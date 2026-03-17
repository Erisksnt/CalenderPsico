// app/api/psychologists/profile/route.ts
// Rotas para consultar/editar os dados do perfil clínico do psicólogo autenticado

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { verifyToken } from '@/lib/auth';

const PROFILE_SELECT = {
  id: true,
  user_id: true,
  full_name: true,
  professional_bio: true,
  work_method: true,
  specialties: true,
  photo_url: true,
};

const sanitizeSpecialties = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const profile = await prisma.profile.findUnique({
      where: { user_id: decoded.userId },
      select: PROFILE_SELECT,
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Perfil não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar perfil do psicólogo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const sanitizedSpecialties = sanitizeSpecialties(body.specialties);

    const payload = {
      full_name: typeof body.full_name === 'string' ? body.full_name.trim() : '',
      professional_bio:
        typeof body.professional_bio === 'string' ? body.professional_bio.trim() : '',
      work_method: typeof body.work_method === 'string' ? body.work_method.trim() : '',
      specialties: sanitizedSpecialties,
      photo_url:
        typeof body.photo_url === 'string' ? body.photo_url.trim() || null : null,
    };

    const profile = await prisma.profile.upsert({
      where: { user_id: decoded.userId },
      update: payload,
      create: {
        user_id: decoded.userId,
        ...payload,
      },
      select: PROFILE_SELECT,
    });

    return NextResponse.json({ success: true, data: profile }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
