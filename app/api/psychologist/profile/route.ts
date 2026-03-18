export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma, {
  createDatabaseUnavailableResponse,
  isDatabaseConnectionError,
} from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth';
import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { ProfileSchema } from '@/lib/validators';

const PROFILE_SELECT = {
  id: true,
  user_id: true,
  full_name: true,
  professional_bio: true,
  work_method: true,
  specialties: true,
  photo_url: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    await ensureDefaultAdmin();

    const user = await getAuthenticatedUser(request);
    if (!user?.psychologist) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { user_id: user.id },
      select: PROFILE_SELECT,
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: profile },
      { status: 200 }
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro ao buscar perfil do psicólogo:', error);

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureDefaultAdmin();

    const user = await getAuthenticatedUser(request);
    if (!user?.psychologist) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const parsed = ProfileSchema.safeParse({
      ...body,
      specialties: Array.isArray(body.specialties)
        ? body.specialties
        : String(body.specialties || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.upsert({
      where: { user_id: user.id },
      update: { ...parsed.data, photo_url: parsed.data.photo_url || null },
      create: {
        user_id: user.id,
        ...parsed.data,
        photo_url: parsed.data.photo_url || null,
      },
      select: PROFILE_SELECT,
    });

    return NextResponse.json(
      { success: true, data: profile },
      { status: 200 }
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro ao atualizar perfil do psicólogo:', error);

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}