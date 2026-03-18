import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { AvailabilityBulkSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

async function findProfile(adminId: string) {
  return prisma.profile.findUnique({ where: { user_id: adminId } });
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const profile = await findProfile(admin.id);
    if (!profile) {
      return NextResponse.json({ error: 'Perfil do psicólogo não encontrado' }, { status: 404 });
    }

    const rows = await prisma.availability.findMany({
      where: { psychologist_id: profile.id },
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
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const profile = await findProfile(admin.id);
    if (!profile) {
      return NextResponse.json({ error: 'Perfil do psicólogo não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = AvailabilityBulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const itemsByDay = new Map(parsed.data.items.map((item) => [item.day_of_week, item]));
    const dedupedItems = Array.from(itemsByDay.values());

    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ where: { psychologist_id: profile.id } });
      await Promise.all(
        dedupedItems.map((item) =>
          tx.availability.create({
            data: {
              psychologist_id: profile.id,
              day_of_week: item.day_of_week,
              start_time: item.start_time,
              end_time: item.end_time,
              is_blocked: item.is_blocked,
              session_duration: item.session_duration,
            },
          })
        )
      );
    });

    const rows = await prisma.availability.findMany({
      where: { psychologist_id: psychologist.id },
      orderBy: { day_of_week: 'asc' },
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao salvar disponibilidade do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
