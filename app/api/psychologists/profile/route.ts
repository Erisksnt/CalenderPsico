// app/api/psychologists/profile/route.ts
// GET/PUT: Obter e atualizar perfil do psicólogo autenticado

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const profile = await prisma.profile.findUnique({ where: { user_id: decoded.userId } });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Perfil não encontrado' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: profile.id,
          name: profile.full_name,
          bio: profile.professional_bio,
          specialties: profile.specialties,
          registration_number: '',
          phone: '',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao buscar perfil do psicólogo:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
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

    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();

    const profile = await prisma.profile.update({
      where: { user_id: decoded.userId },
      data: {
        full_name: body.name,
        professional_bio: body.bio,
        specialties: Array.isArray(body.specialties) ? body.specialties : [],
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: profile.id,
          name: profile.full_name,
          bio: profile.professional_bio,
          specialties: profile.specialties,
          registration_number: '',
          phone: '',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
