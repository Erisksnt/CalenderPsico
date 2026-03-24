export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { getCachedAppointments, setCachedAppointments } from '@/lib/admin-cache';

function isPast(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime() <= Date.now();
}

export async function GET(request: Request) {
  console.time("GET /api/admin/appointments");
  
  try {
    const admin = await getAdminFromRequest(request);
    
    if (!admin?.psychologist) {
      console.timeEnd("GET /api/admin/appointments");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const psychologistId = admin.psychologist.id;

    //  VERIFICAR CACHE
    const cached = getCachedAppointments(psychologistId);
    if (cached) {
      console.timeEnd("GET /api/admin/appointments");
      return NextResponse.json(cached);
    }

    // Buscar confirmados PASSADOS em UMA query só
    const updatedCount = await prisma.appointment.updateMany({
      where: {
        psychologist_id: psychologistId,
        status: 'CONFIRMED',
        data: { lt: new Date().toISOString().split('T')[0] }
      },
      data: { status: 'COMPLETED' },
    });

    // Buscar todos com UMA query eficiente
    const appointments = await prisma.appointment.findMany({
      where: { 
        psychologist_id: psychologistId,
      },
      orderBy: [
        { data: 'asc' }, 
        { hora: 'asc' }
      ],
      select: {
        id: true,
        data: true,
        hora: true,
        nome_paciente: true,
        email: true,
        telefone: true,
        status: true,
        mensagem: true,
        created_at: true,
        updated_at: true,
        psychologist_id: true,
      },
    });

    // ARMAZENAR EM CACHE
    setCachedAppointments(psychologistId, appointments);

    console.timeEnd("GET /api/admin/appointments");
    return NextResponse.json(appointments);
  } catch (error) {
    console.timeEnd("GET /api/admin/appointments");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao carregar agendamentos do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}