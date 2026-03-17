import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { AvailabilityBulkSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = prisma as any;
    const admin = await getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const rows = await prisma.availability.findMany({
      where: { user_id: admin.id },
      orderBy: { weekday: 'asc' },

    const psychologist = await db.psychologist.findUnique({ where: { user_id: admin.id } });
    if (!psychologist) return NextResponse.json({ error: 'Psicólogo não encontrado' }, { status: 404 });

    const rows = await db.availability.findMany({
      where: { psychologist_id: psychologist.id },
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
    const db = prisma as any;
    const admin = await getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const psychologist = await db.psychologist.findUnique({ where: { user_id: admin.id } });
    if (!psychologist) return NextResponse.json({ error: 'Psicólogo não encontrado' }, { status: 404 });

    const body = await request.json();
    const parsed = AvailabilityBulkSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ where: { user_id: { not: admin.id } } });

      for (const item of parsed.data.items) {
        await tx.availability.upsert({
          where: { user_id_weekday: { user_id: admin.id, weekday: item.weekday } },
          create: { user_id: admin.id, ...item },
          update: item,
        });
      }
    });

    const rows = await prisma.availability.findMany({
      where: { user_id: admin.id },
      orderBy: { weekday: 'asc' },
    });

    await db.$transaction(
      parsed.data.items.map((item) =>
        db.availability.upsert({
          where: {
            psychologist_id_day_of_week: {
              psychologist_id: psychologist.id,
              day_of_week: item.day_of_week,
            },
          },
          create: {
            psychologist_id: psychologist.id,
            day_of_week: item.day_of_week,
            start_time: item.start_time,
            end_time: item.end_time,
            is_blocked: item.is_blocked,
            session_duration: item.session_duration,
          },
          update: {
            start_time: item.start_time,
            end_time: item.end_time,
            is_blocked: item.is_blocked,
            session_duration: item.session_duration,
          },
        })
      )
    );

    const rows = await db.availability.findMany({
      where: { psychologist_id: psychologist.id },
      orderBy: { day_of_week: 'asc' },
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao salvar disponibilidade do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
