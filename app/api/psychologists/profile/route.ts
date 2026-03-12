// app/api/psychologists/profile/route.ts
// GET: Obter perfil do psicólogo autenticado

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const psychologist = await prisma.psychologist.findUnique({
      where: { user_id: decoded.userId },
      include: { services: true },
    });

    if (!psychologist) {
      return NextResponse.json(
        { success: false, error: 'Psicólogo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: psychologist },
      { status: 200 }
    );
  } catch (error: any) {
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
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const psychologist = await prisma.psychologist.update({
      where: { user_id: decoded.userId },
      data: {
        name: body.name,
        bio: body.bio,
        specialties: body.specialties,
        phone: body.phone,
      },
      include: { services: true },
    });

    return NextResponse.json(
      { success: true, data: psychologist },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
