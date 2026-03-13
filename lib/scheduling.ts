import prisma from './database';

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

export async function getAvailableSlots(date: string) {
  const weekday = new Date(`${date}T00:00:00`).getDay();
  const config = await prisma.availability.findFirst({ where: { weekday } });

  if (!config || !config.enabled) return [];

  const start = toMinutes(config.start_time);
  const end = toMinutes(config.end_time);

  const appointments = await prisma.appointment.findMany({
    where: {
      data: date,
      status: { in: ['pending', 'confirmed'] },
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
