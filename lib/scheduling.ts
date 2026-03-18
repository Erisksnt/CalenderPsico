import prisma from './database';
import { getPrimaryPsychologist } from './bootstrap';

const DAY_MAP = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function toHour(totalMinutes: number) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getTodayISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

async function resolvePsychologistId(psychologistId?: string) {
  if (psychologistId) return psychologistId;
  const psychologist = await getPrimaryPsychologist();
  return psychologist?.id ?? null;
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
  });

  if (!config || config.is_blocked) return [];

  const appointments = await prisma.appointment.findMany({
    where: {
      psychologist_id: targetPsychologistId,
      data: date,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { hora: true },
  });

  const busyHours = new Set(appointments.map((appointment) => appointment.hora));
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
