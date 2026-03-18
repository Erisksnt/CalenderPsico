import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
// 🔥 REMOVER esta linha:
// import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { AvailabilityBulkSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

async function getPsychologistId(request: Request) {
  // 🔥 REMOVER esta linha:
  // await ensureDefaultAdmin();
  
  console.time("getPsychologistId"); // Opcional
  const admin = await getAdminFromRequest(request);
  console.timeEnd("getPsychologistId"); // Opcional
  
  if (!admin?.psychologist) return null;
  return admin.psychologist.id;
}

export async function GET(request: Request) {
  console.time("GET /api/admin/availability"); // Opcional
  
  try {
    const psychologistId = await getPsychologistId(request);
    if (!psychologistId) {
      console.timeEnd("GET /api/admin/availability"); // Opcional
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.time("findAvailability"); // Opcional
    const rows = await prisma.availability.findMany({
      where: { psychologist_id: psychologistId },
      orderBy: { day_of_week: 'asc' },
      // ⚡ Selecionar apenas campos necessários
      select: {
        id: true,
        day_of_week: true,
        start_time: true,
        end_time: true,
        is_blocked: true,
        session_duration: true,
        psychologist_id: true,
        created_at: true,
        updated_at: true
      }
    });
    console.timeEnd("findAvailability"); // Opcional

    console.timeEnd("GET /api/admin/availability"); // Opcional
    return NextResponse.json(rows);
  } catch (error) {
    console.timeEnd("GET /api/admin/availability"); // Opcional
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao carregar disponibilidade do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  console.time("PUT /api/admin/availability"); // Opcional
  
  try {
    const psychologistId = await getPsychologistId(request);
    if (!psychologistId) {
      console.timeEnd("PUT /api/admin/availability"); // Opcional
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AvailabilityBulkSchema.safeParse(body);
    if (!parsed.success) {
      console.timeEnd("PUT /api/admin/availability"); // Opcional
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // ⚡ Transação otimizada
    console.time("transaction"); // Opcional
    await prisma.$transaction(async (tx) => {
      // Deletar existentes
      await tx.availability.deleteMany({ 
        where: { psychologist_id: psychologistId } 
      });
      
      // Criar novos (apenas se houver itens)
      if (parsed.data.items.length > 0) {
        await tx.availability.createMany({
          data: parsed.data.items.map((item) => ({
            psychologist_id: psychologistId,
            day_of_week: item.day_of_week,
            start_time: item.start_time,
            end_time: item.end_time,
            is_blocked: item.is_blocked,
            session_duration: item.session_duration,
          })),
        });
      }
    });
    console.timeEnd("transaction"); // Opcional

    // Buscar os dados atualizados (com select otimizado)
    console.time("fetchUpdated"); // Opcional
    const rows = await prisma.availability.findMany({
      where: { psychologist_id: psychologistId },
      orderBy: { day_of_week: 'asc' },
      select: {
        id: true,
        day_of_week: true,
        start_time: true,
        end_time: true,
        is_blocked: true,
        session_duration: true,
        psychologist_id: true,
        created_at: true,
        updated_at: true
      }
    });
    console.timeEnd("fetchUpdated"); // Opcional

    console.timeEnd("PUT /api/admin/availability"); // Opcional
    return NextResponse.json(rows);
  } catch (error) {
    console.timeEnd("PUT /api/admin/availability"); // Opcional
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao salvar disponibilidade do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}