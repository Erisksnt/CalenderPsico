import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma, {
  createDatabaseUnavailableResponse,
  isDatabaseConnectionError,
} from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { getTodayISO } from '@/lib/scheduling';

const CleanupSchema = z.object({
  daysToKeep: z.number().int().min(30).max(3650).default(30),
});

function getLimitDate(daysToKeep: number) {
  const limitDate = new Date(`${getTodayISO()}T00:00:00.000Z`);
  limitDate.setUTCDate(limitDate.getUTCDate() - daysToKeep);
  return limitDate.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!admin.psychologist) {
    return NextResponse.json({ error: 'Perfil de psicóloga não encontrado.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da solicitação inválido.' }, { status: 400 });
  }

  const parsed = CleanupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'O período de retenção deve estar entre 30 e 3650 dias.' },
      { status: 400 },
    );
  }

  const limitDate = getLimitDate(parsed.data.daysToKeep);
  try {
    const result = await prisma.appointment.deleteMany({
      where: {
        psychologist_id: admin.psychologist.id,
        status: { in: ['COMPLETED', 'CANCELLED'] },
        data: { lt: limitDate },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      deletedBefore: limitDate,
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) return createDatabaseUnavailableResponse();
    console.error('Erro ao limpar agendamentos antigos:', error);
    return NextResponse.json({ error: 'Não foi possível concluir a limpeza.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!admin.psychologist) {
    return NextResponse.json({ error: 'Perfil de psicóloga não encontrado.' }, { status: 403 });
  }

  const limitDate = getLimitDate(30);
  try {
    const count = await prisma.appointment.count({
      where: {
        psychologist_id: admin.psychologist.id,
        status: { in: ['COMPLETED', 'CANCELLED'] },
        data: { lt: limitDate },
      },
    });

    return NextResponse.json(
      { eligibleCount: count, deletedBefore: limitDate },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) return createDatabaseUnavailableResponse();
    console.error('Erro ao consultar agendamentos antigos:', error);
    return NextResponse.json({ error: 'Não foi possível consultar os registros.' }, { status: 500 });
  }
}
