import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { AvailabilityBulkSchema } from '@/lib/validators';
import { getCachedAvailability, setCachedAvailability, invalidateAdminCache } from '@/lib/admin-cache';

export const dynamic = 'force-dynamic';

async function getPsychologistId(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin?.psychologist) return null;
  return admin.psychologist.id;
}

export async function GET(request: Request) {
  console.time("GET /api/admin/availability");
  
  try {
    const psychologistId = await getPsychologistId(request);
    if (!psychologistId) {
      console.timeEnd("GET /api/admin/availability");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // VERIFICAR CACHE
    const cached = getCachedAvailability(psychologistId);
    if (cached) {
      console.timeEnd("GET /api/admin/availability");
      return NextResponse.json(cached);
    }

    console.time("findAvailability");
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
    console.timeEnd("findAvailability");

    // ARMAZENAR EM CACHE
    setCachedAvailability(psychologistId, rows);

    console.timeEnd("GET /api/admin/availability");
    return NextResponse.json(rows);
  } catch (error) {
    console.timeEnd("GET /api/admin/availability");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao carregar disponibilidade do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  console.time("PUT /api/admin/availability");
  
  try {
    const psychologistId = await getPsychologistId(request);
    if (!psychologistId) {
      console.timeEnd("PUT /api/admin/availability");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AvailabilityBulkSchema.safeParse(body);
    if (!parsed.success) {
      console.timeEnd("PUT /api/admin/availability");
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    console.time("transaction");
    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ 
        where: { psychologist_id: psychologistId } 
      });
      
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
    console.timeEnd("transaction");

    // Buscar os dados atualizados
    console.time("fetchUpdated");
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
    console.timeEnd("fetchUpdated");

    // INVALIDAR CACHE APÓS ALTERAÇÃO
    invalidateAdminCache(psychologistId, ''); // Só precisa do psychologistId

    console.timeEnd("PUT /api/admin/availability");
    return NextResponse.json(rows);
  } catch (error) {
    console.timeEnd("PUT /api/admin/availability");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao salvar disponibilidade do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}