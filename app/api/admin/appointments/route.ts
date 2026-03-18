export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';

function isPast(date: string, time: string) {
  const appointmentDate = new Date(`${date}T${time}:00`);
  return appointmentDate.getTime() <= Date.now();
}

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const confirmedAppointments = await prisma.appointment.findMany({
      where: { status: 'CONFIRMED' as any },
      select: { id: true, data: true, hora: true },
    });

    const pastConfirmedIds = confirmedAppointments
      .filter((a: { id: string; data: string; hora: string }) => isPast(a.data, a.hora))
      .map((a: { id: string }) => a.id);

    if (pastConfirmedIds.length) {
      await prisma.appointment.updateMany({
        where: { id: { in: pastConfirmedIds } },
        data: { status: 'COMPLETED' as any },
      });
    }

    const appointments = await prisma.appointment.findMany({ orderBy: [{ data: 'asc' }, { hora: 'asc' }] });
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Erro ao carregar agendamentos do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
