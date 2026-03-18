export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { ensureDefaultAdmin, getPrimaryPsychologist } from '@/lib/bootstrap';
import { getAuthenticatedUser } from '@/lib/auth';
import { BookAppointmentSchema } from '@/lib/validators';
import { getAvailableSlots } from '@/lib/scheduling';

function getTodayISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}


import prisma from '@/lib/database';

import { ensureDefaultAdmin, getPrimaryPsychologist } from '@/lib/bootstrap';
import { getAuthenticatedUser } from '@/lib/auth';
import { BookAppointmentSchema } from '@/lib/validators';
import { getAvailableSlots } from '@/lib/scheduling';

function getTodayISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}


export async function GET(req: NextRequest) {
  try {
    await ensureDefaultAdmin();
    const user = await getAuthenticatedUser(req);
    if (!user?.psychologist) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    const appointments = await prisma.appointment.findMany({
      where: {
        psychologist_id: user.psychologist.id,
        ...(status ? { status: status as any } : {}),
        ...(date ? { data: date } : {}),
      },
      orderBy: [{ data: 'asc' }, { hora: 'asc' }],
    });

    return NextResponse.json({ success: true, data: appointments }, { status: 200 });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao listar agendamentos:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDefaultAdmin();
    const body = await req.json();
    const parsed = BookAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Erro de validação', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const psychologist = await getPrimaryPsychologist();
    if (!psychologist) {
      return NextResponse.json({ success: false, error: 'Psicólogo não encontrado' }, { status: 404 });
    }


    const { nome, email, telefone, mensagem, data, hora } = parsed.data;



    const { nome, email, telefone, mensagem, data, hora } = parsed.data;

    if (data < getTodayISO()) {
      return NextResponse.json({ success: false, error: 'Não é possível agendar em datas passadas' }, { status: 400 });
    }

    const slots = await getAvailableSlots(data, psychologist.id);
    if (!slots.includes(hora)) {
      return NextResponse.json({ success: false, error: 'Horário indisponível' }, { status: 409 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        psychologist_id: psychologist.id,
        nome_paciente: nome,
        email,
        telefone,
        mensagem,
        data,
        hora,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: appointment,
        message: 'Solicitação de agendamento enviada com sucesso!',
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
