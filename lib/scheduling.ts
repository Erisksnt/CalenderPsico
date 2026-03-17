import prisma from './database';

const DAY_MAP = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

export function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function toHour(minutes: number) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function getTodayISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function getCurrentTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export async function getAvailableSlots(date: string, psychologistId?: string) {
  const db = prisma as any;
  const day_of_week = DAY_MAP[new Date(`${date}T00:00:00`).getDay()];

  const fallbackPsychologist = psychologistId
    ? null
    : await db.psychologist.findFirst({ select: { id: true } });
  const targetPsychologistId = psychologistId || fallbackPsychologist?.id;
  if (!targetPsychologistId) return [];

  const config = await db.availability.findFirst({
    where: {
      psychologist_id: targetPsychologistId,
      day_of_week,
      is_blocked: false,
    },
    orderBy: { start_time: 'asc' },
  });
  if (!config) return [];

  const start = toMinutes(config.start_time);
  const end = toMinutes(config.end_time);

  const appointments = await db.appointment.findMany({
    where: {
      data: date,
      psychologist_id: targetPsychologistId,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { hora: true },
  });

  const blocked = new Set(appointments.map((a: { hora: string }) => a.hora));
  const slots: string[] = [];
  const isToday = date === getTodayISO();
  const currentTime = getCurrentTime();

  for (let value = start; value + config.session_duration <= end; value += config.session_duration) {
    const hour = toHour(value);
    if (blocked.has(hour)) continue;
    if (isToday && hour <= currentTime) continue;
    slots.push(hour);
  }

  return slots;
}

export async function getEnabledWeekdays(psychologistId?: string) {
  const db = prisma as any;
  const where = {
    is_blocked: false,
    ...(psychologistId ? { psychologist_id: psychologistId } : {}),
  };

  const rows = await db.availability.findMany({
    where,
    select: { day_of_week: true },
  });

  return Array.from(new Set(rows.map((row: { day_of_week: typeof DAY_MAP[number] }) => DAY_MAP.indexOf(row.day_of_week))));
}
