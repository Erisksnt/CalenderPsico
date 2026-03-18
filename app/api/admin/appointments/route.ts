export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';

function isPast(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime() <= Date.now();
}

export async function GET(request: Request) {
  console.time("GET /api/admin/appointments");
  
  try {
    console.time("getAdminFromRequest");
    const admin = await getAdminFromRequest(request);
    console.timeEnd("getAdminFromRequest");
    
    if (!admin?.psychologist) {
      console.timeEnd("GET /api/admin/appointments");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // ⚡ OTIMIZAÇÃO 1: Buscar confirmados PASSADOS em UMA query só
    console.time("updatePastOptimized");
    const updatedCount = await prisma.appointment.updateMany({
      where: {
        psychologist_id: admin.psychologist.id,
        status: 'CONFIRMED',
        // 👇 Filtro no banco (mais rápido que filter em memória)
        data: { lt: new Date().toISOString().split('T')[0] }
      },
      data: { status: 'COMPLETED' },
    });
    console.timeEnd("updatePastOptimized");
    
    if (updatedCount.count > 0) {
      console.log(`✅ ${updatedCount.count} agendamentos marcados como COMPLETED`);
    }

    // ⚡ OTIMIZAÇÃO 2: Buscar todos com UMA query eficiente
    console.time("findAll");
    const appointments = await prisma.appointment.findMany({
      where: { 
        psychologist_id: admin.psychologist.id,
        // Opcional: limitar a datas futuras se não precisar dos passados
        // data: { gte: new Date().toISOString().split('T')[0] }
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
        // ⚡ OTIMIZAÇÃO 3: Se precisar do nome do psicólogo, busque separadamente
        // ou use uma query raw se for muito lento
      },
      // ⚡ OTIMIZAÇÃO 4: Paginação (se houver muitos registros)
      // take: 100,
      // skip: 0
    });
    console.timeEnd("findAll");

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