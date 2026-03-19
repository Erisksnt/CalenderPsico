import prisma from './database';
import { getPrimaryPsychologist } from './bootstrap';

const DAY_MAP = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

// ⚡ Cache para o ID do psicólogo principal
let cachedPsychologistId: string | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getCachedPsychologistId() {
  const now = Date.now();

  if (cachedPsychologistId && (now - lastFetch) < CACHE_TTL) {
    return cachedPsychologistId;
  }
  
  const psychologist = await prisma.psychologist.findFirst({
    orderBy: { created_at: 'asc' },
    select: { id: true }
  });
  
  cachedPsychologistId = psychologist?.id ?? null;
  lastFetch = now;
  
  return cachedPsychologistId;
}

async function resolvePsychologistId(psychologistId?: string) {
  if (psychologistId) return psychologistId;
  return getCachedPsychologistId();
}

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function toHour(totalMinutes: number) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
} 

export function getTodayISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export async function getAvailableSlots(date: string, psychologistId?: string) {
  const targetPsychologistId = await resolvePsychologistId(psychologistId);
  if (!targetPsychologistId) return [];

  const day_of_week = DAY_MAP[new Date(`${date}T00:00:00`).getDay()];

  const config = await prisma.availability.findUnique({
    where: {
      psychologist_id_day_of_week: {
        psychologist_id: targetPsychologistId,
        day_of_week,
      },
    },
    select: {
      is_blocked: true,
      start_time: true,
      end_time: true,
      session_duration: true,
    },
  });

  // ✅ Busca TODOS os agendamentos
  const appointments = await prisma.appointment.findMany({
    where: {
      psychologist_id: targetPsychologistId,
      data: date,
    },
    select: { hora: true, status: true },
  });
  
  // 🔥 Criar Set APENAS com horários ocupados (excluindo cancelados/concluídos)
  const busyHours = new Set(
    appointments
      .filter(apt => apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED')
      .map(apt => apt.hora)
  );

  const slots: string[] = [];
  const startMinutes = toMinutes(config.start_time);
  const endMinutes = toMinutes(config.end_time);
  const currentTime = getCurrentTime();
  const isToday = date === getTodayISO();

  for (
    let currentMinutes = startMinutes;
    currentMinutes + config.session_duration <= endMinutes;
    currentMinutes += config.session_duration
  ) {
    const hour = toHour(currentMinutes);
    if (busyHours.has(hour)) continue;
    if (isToday && hour <= currentTime) continue;
    slots.push(hour);
  }

  return slots;
}

export async function getEnabledWeekdays(psychologistId?: string) {
  const targetPsychologistId = await resolvePsychologistId(psychologistId);
  if (!targetPsychologistId) return [];

  const rows = await prisma.availability.findMany({
    where: {
      psychologist_id: targetPsychologistId,
      is_blocked: false,
    },
    select: { day_of_week: true },
  });

  return Array.from(new Set(rows.map((row) => DAY_MAP.indexOf(row.day_of_week)))).sort((a, b) => a - b);
}