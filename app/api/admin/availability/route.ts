import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { AvailabilitySchema } from '@/lib/validators';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const rows = await prisma.availability.findMany({ where: { user_id: admin.id }, orderBy: { weekday: 'asc' } });
  return NextResponse.json(rows);
}

export async function PUT(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json();
  const parsed = AvailabilitySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.$transaction(
    parsed.data.items.map((item) =>
      prisma.availability.upsert({
        where: { user_id_weekday: { user_id: admin.id, weekday: item.weekday } },
        create: { user_id: admin.id, ...item },
        update: item,
      })
    )
  );

  const rows = await prisma.availability.findMany({ where: { user_id: admin.id }, orderBy: { weekday: 'asc' } });
  return NextResponse.json(rows);
}
