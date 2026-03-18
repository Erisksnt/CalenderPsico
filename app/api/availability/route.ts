// app/api/availability/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { AvailabilitySchema } from '@/lib/validators';
import prisma from '@/lib/database';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';

// helper auth
async function authenticate(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization') || '');

  if (!token) {
    return { error: 'Não autorizado', status: 401 };
  }

  const decoded = verifyJWT(token);

  if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
    return { error: 'Acesso negado', status: 403 };
  }

  return { decoded };
}

// GET /api/availability
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const psychologistId = searchParams.get('psychologist_id');
    const dayOfWeek = searchParams.get('day_of_week');
    const excludeBlocked = searchParams.get('exclude_blocked') === 'true';

    if (!psychologistId) {
      return NextResponse.json(
        { success: false, error: 'psychologist_id é obrigatório' },
        { status: 400 }
      );
    }

    const where: any = {
      psychologist_id: psychologistId, // ✅ CORRETO (string)
    };

    if (dayOfWeek) {
      where.day_of_week = dayOfWeek;
    }

    if (excludeBlocked) {
      where.is_blocked = false;
    }

    const availabilities = await prisma.availability.findMany({
      where,
      orderBy: [
        { day_of_week: 'asc' },
        { start_time: 'asc' },
      ],
    });

    return NextResponse.json(
      { success: true, data: availabilities },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao listar disponibilidades:', error);

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/availability
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);

    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { decoded } = auth;

    const psychologist = await prisma.psychologist.findUnique({
      where: { user_id: decoded.userId },
    });

    if (!psychologist) {
      return NextResponse.json(
        { success: false, error: 'Psicólogo não encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();

    const parsed = AvailabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro de validação',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { day_of_week, start_time, end_time } = parsed.data;

    const conflict = await prisma.availability.findFirst({
      where: {
        psychologist_id: psychologist.id,
        day_of_week,
        AND: [
          { start_time: { lt: end_time } },
          { end_time: { gt: start_time } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflito de horário com outra disponibilidade',
        },
        { status: 409 }
      );
    }

    const availability = await prisma.availability.create({
      data: {
        day_of_week,
        start_time,
        end_time,
        is_blocked: false,
        psychologist: {
          connect: { id: psychologist.id },
        },
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
  } catch (error) {
    console.error('Erro ao criar disponibilidade:', error);

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}