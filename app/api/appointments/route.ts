export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { ensureDefaultAdmin, getPrimaryPsychologist } from '@/lib/bootstrap';
import { getAuthenticatedUser } from '@/lib/auth';
import { BookAppointmentSchema } from '@/lib/validators';
import { getTodayISO, getAvailableSlots } from '@/lib/scheduling';
import { isDatabaseConnectionError, createDatabaseUnavailableResponse } from '@/lib/database';

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
  select: {
    id: true,
    nome_paciente: true,
    email: true,
    telefone: true,
    mensagem: true,
    data: true,
    hora: true,
    status: true
  }
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
        message: `✨ Sua ambientação foi solicitada com sucesso e está aguardando a confirmação do psicólogo.

💬 Este primeiro contato permitirá que vocês se conheçam melhor e sintam se querem seguir com o processo terapêutico.

📅 Você receberá a confirmação da agenda por e-mail ou ligação telefônica.

🤗 Estamos felizes em te acompanhar nesse início da sua jornada!`
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