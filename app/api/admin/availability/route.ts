import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { AvailabilityBulkSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

async function getPsychologistId(request: Request) {
  await ensureDefaultAdmin();
  const admin = await getAdminFromRequest(request);
  if (!admin?.psychologist) return null;
  return admin.psychologist.id;
}

export async function GET(request: Request) {
  try {
    const psychologistId = await getPsychologistId(request);
    if (!psychologistId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const rows = await prisma.availability.findMany({
      where: { psychologist_id: psychologistId },
      orderBy: { day_of_week: 'asc' },
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao carregar disponibilidade do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const psychologistId = await getPsychologistId(request);
    if (!psychologistId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AvailabilityBulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ where: { psychologist_id: psychologistId } });
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
    });

    const rows = await prisma.availability.findMany({
      where: { psychologist_id: psychologistId },
      orderBy: { day_of_week: 'asc' },
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao salvar disponibilidade do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
