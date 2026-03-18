import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { ProfileSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensureDefaultAdmin();
    const admin = await getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const profile = await prisma.profile.findUnique({ where: { user_id: admin.id } });
    return NextResponse.json(profile);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao carregar perfil do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureDefaultAdmin();
    const admin = await getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const profile = await prisma.profile.upsert({
      where: { user_id: admin.id },
      create: { user_id: admin.id, ...parsed.data, photo_url: parsed.data.photo_url || null },
      update: { ...parsed.data, photo_url: parsed.data.photo_url || null },
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao salvar perfil do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
