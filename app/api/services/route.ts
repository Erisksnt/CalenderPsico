// app/api/services/route.ts
// GET: Listar serviços
// POST: Criar novo serviço

import { NextRequest, NextResponse } from 'next/server';
import { ServiceSchema } from '@/lib/validators';
import prisma from '@/lib/database';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';

// GET /api/services?psychologist_id=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const psychologistId = searchParams.get('psychologist_id');

    const where: any = {};

    if (psychologistId) {
      where.psychologist_id = psychologistId;
    }

    const services = await prisma.service.findMany({
      where,
      include: { psychologist: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: services,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao listar serviços:', errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/services
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
          error: 'Acesso negado. Apenas psicólogos podem criar serviços.',
        },
        { status: 403 }
      );
    }

    // Obtém psicólogo
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
    const validation = ServiceSchema.safeParse(body);
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

    const { name, description, duration, price, color } = validation.data;

    // Cria o serviço
    const service = await prisma.service.create({
      data: {
        psychologist_id: psychologist.id,
        name,
        description: description || undefined,
        duration,
        price: Math.round(price * 100), // Converte para centavos
        color: color || '#3B82F6',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: service,
        message: 'Serviço criado com sucesso!',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar serviço:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
