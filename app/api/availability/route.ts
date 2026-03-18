export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import prisma from '@/lib/database';

import { ensureDefaultAdmin, getPrimaryPsychologist } from '@/lib/bootstrap';

export async function GET(req: NextRequest) {
  try {
    await ensureDefaultAdmin();
    const { searchParams } = new URL(req.url);

    const psychologistId = searchParams.get('psychologist_id') || (await getPrimaryPsychologist())?.id;
    const dayOfWeek = searchParams.get('day_of_week');
    const excludeBlocked = searchParams.get('exclude_blocked') === 'true';

    if (!psychologistId) {
      return NextResponse.json({ success: false, error: 'psychologist_id é obrigatório' }, { status: 400 });
    }

    const availabilities = await prisma.availability.findMany({
      where: {
        psychologist_id: psychologistId,
        ...(dayOfWeek ? { day_of_week: dayOfWeek as any } : {}),
        ...(excludeBlocked ? { is_blocked: false } : {}),
      },
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
    });

    return NextResponse.json({ success: true, data: availabilities }, { status: 200 });
  } catch (error) {

    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro ao listar disponibilidades:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
