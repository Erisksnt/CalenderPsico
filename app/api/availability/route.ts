export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma, {
  createDatabaseUnavailableResponse,
  isDatabaseConnectionError,
} from '@/lib/database';
// 🔥 REMOVER: import { ensureDefaultAdmin, getPrimaryPsychologist } from '@/lib/bootstrap';

export async function GET(req: NextRequest) {
  console.time("GET /api/availability");
  
  try {
    // 🔥 REMOVER: await ensureDefaultAdmin();

    const { searchParams } = new URL(req.url);

    let psychologistId = searchParams.get('psychologist_id');

    // ⚡ Só busca o primary se realmente não tiver psychologist_id
    if (!psychologistId) {
      console.time("findPrimaryPsychologist");
      const primary = await prisma.psychologist.findFirst({
        orderBy: { created_at: 'asc' },
        select: { id: true } // ✅ Só precisa do ID
      });
      console.timeEnd("findPrimaryPsychologist");
      
      psychologistId = primary?.id || null;
    }

    const dayOfWeek = searchParams.get('day_of_week');
    const excludeBlocked = searchParams.get('exclude_blocked') === 'true';

    if (!psychologistId) {
      console.timeEnd("GET /api/availability");
      return NextResponse.json(
        { success: false, error: 'Nenhum psicólogo encontrado' },
        { status: 404 }
      );
    }

    console.time("findAvailabilities");
    const availabilities = await prisma.availability.findMany({
      where: {
        psychologist_id: psychologistId,
        ...(dayOfWeek ? { day_of_week: dayOfWeek as any } : {}),
        ...(excludeBlocked ? { is_blocked: false } : {}),
      },
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
      // ⚡ ADICIONAR select para buscar apenas campos necessários
      select: {
        id: true,
        day_of_week: true,
        start_time: true,
        end_time: true,
        is_blocked: true,
        session_duration: true,
        psychologist_id: true
      }
    });
    console.timeEnd("findAvailabilities");

    console.timeEnd("GET /api/availability");
    return NextResponse.json(
      { success: true, data: availabilities },
      { status: 200 }
    );
  } catch (error) {
    console.timeEnd("GET /api/availability");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro ao listar disponibilidades:', error);

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}