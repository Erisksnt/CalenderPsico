// app/api/availability/route.ts
// GET: Listar disponibilidades
// POST: Criar nova disponibilidade

import { NextRequest, NextResponse } from 'next/server';
import { AvailabilitySchema } from '@/lib/validators';
import prisma from '@/lib/database';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';

// GET /api/availability?psychologist_id=xxx&day_of_week=MONDAY
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const psychologistId = searchParams.get('psychologist_id');
    const dayOfWeek = searchParams.get('day_of_week');
    const excludeBlocked = searchParams.get('exclude_blocked') === 'true';

    if (!psychologistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'psychologist_id é obrigatório',
        },
        { status: 400 }
      );
    }

    // Query de disponibilidades
    const where: any = {
      psychologist_id: psychologistId,
    };

    if (dayOfWeek) {
      where.day_of_week = dayOfWeek;
    }

    if (excludeBlocked) {
      where.is_blocked = false;
    }

    const availabilities = await prisma.availability.findMany({
      where,
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
    });

    return NextResponse.json(
      {
        success: true,
        data: availabilities,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao listar disponibilidades:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// POST /api/availability
export async function POST(req: NextRequest) {
  try {
    // Verifica autenticação
    const token = getTokenFromHeader(req.headers.get('authorization') || '');
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não autorizado',
        },
        { status: 401 }
      );
    }

    const decoded = verifyJWT(token);
    if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso negado. Apenas psicólogos podem criar disponibilidades.',
        },
        { status: 403 }
      );
    }

    // Obtém psicólogo associado ao usuário
    const psychologist = await prisma.psychologist.findUnique({
      where: { user_id: decoded.userId },
    });

    if (!psychologist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Psicólogo não encontrado',
        },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Validação
    const validation = AvailabilitySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        {
          success: false,
          error: 'Erro de validação',
          data: { errors },
        },
        { status: 400 }
      );
    }

    const { day_of_week, start_time, end_time } = validation.data;

    // Verifica se já existe uma disponibilidade no mesmo horário e dia
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        psychologist_id: psychologist.id,
        day_of_week,
        start_time,
        end_time,
      },
    });

    if (existingAvailability) {
      return NextResponse.json(
        {
          success: false,
          error: 'Já existe uma disponibilidade para este horário e dia',
        },
        { status: 409 }
      );
    }

    // Cria a disponibilidade
    const availability = await prisma.availability.create({
      data: {
        psychologist_id: psychologist.id,
        day_of_week,
        start_time,
        end_time,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: availability,
        message: 'Horário disponível criado com sucesso!',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar disponibilidade:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
