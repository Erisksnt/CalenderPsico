// app/api/psychologists/time-blocks/route.ts
// Gerenciar datas bloqueadas

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { TimeBlockSchema } from '@/lib/validators';

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
    });

    if (!psychologist) {
      return NextResponse.json(
        { success: false, error: 'Psicólogo não encontrado' },
        { status: 404 }
      );
    }

    // Busca bloqueios de datas
    const timeBlocks = await prisma.timeBlock.findMany({
      where: { psychologist_id: psychologist.id },
      orderBy: { start_time: 'asc' },
    });

    return NextResponse.json(
      { success: true, data: timeBlocks },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao buscar bloqueios:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    // Validação
    const validation = TimeBlockSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { success: false, error: 'Erro de validação', data: { errors } },
        { status: 400 }
      );
    }

    const psychologist = await prisma.psychologist.findUnique({
      where: { user_id: decoded.userId },
    });

    if (!psychologist) {
      return NextResponse.json(
        { success: false, error: 'Psicólogo não encontrado' },
        { status: 404 }
      );
    }

    const timeBlock = await prisma.timeBlock.create({
      data: {
        psychologist_id: psychologist.id,
        start_time: new Date(validation.data.start_time),
        end_time: new Date(validation.data.end_time),
        reason: validation.data.reason,
      },
    });

    return NextResponse.json(
      { success: true, data: timeBlock },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar bloqueio:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
