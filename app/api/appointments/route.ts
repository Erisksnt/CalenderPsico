// app/api/appointments/route.ts

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { CreateAppointmentSchema } from '@/lib/validators';
import prisma from '@/lib/database';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';

// GET /api/appointments
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization') || '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const decoded = verifyJWT(token);

    if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    const where: any = {};

    if (status) where.status = status;
    if (date) where.data = date;

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [
        { data: 'asc' },
        { hora: 'asc' }
      ],
    });

    return NextResponse.json(
      { success: true, data: appointments },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/appointments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = CreateAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro de validação',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      nome_paciente,
      email,
      telefone,
      mensagem,
      data,
      hora,
    } = validation.data;

    // 🔥 evita conflito de horário
    const conflict = await prisma.appointment.findFirst({
      where: {
        data,
        hora,
        status: {
          not: 'CANCELLED',
        },
      },
    });

    if (conflict) {
      return NextResponse.json(
        {
          success: false,
          error: 'Horário já está ocupado',
        },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        nome_paciente,
        email,
        telefone,
        mensagem,
        data,
        hora,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: appointment,
        message: 'Solicitação de agendamento enviada com sucesso!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}