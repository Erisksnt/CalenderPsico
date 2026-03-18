export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { ensureDefaultAdmin } from '@/lib/bootstrap';

function isPast(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime() <= Date.now();
}

export async function GET(request: Request) {
  try {
    await ensureDefaultAdmin();
    const admin = await getAdminFromRequest(request);
    if (!admin?.psychologist) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const confirmedAppointments = await prisma.appointment.findMany({
      where: {
        psychologist_id: admin.psychologist.id,
        status: 'CONFIRMED',
      },
      select: { id: true, data: true, hora: true },
    });

    const pastConfirmedIds = confirmedAppointments.filter((item) => isPast(item.data, item.hora)).map((item) => item.id);

    if (pastConfirmedIds.length) {
      await prisma.appointment.updateMany({
        where: { id: { in: pastConfirmedIds } },
        data: { status: 'COMPLETED' },
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: { psychologist_id: admin.psychologist.id },
      orderBy: [{ data: 'asc' }, { hora: 'asc' }],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Erro ao carregar agendamentos do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
