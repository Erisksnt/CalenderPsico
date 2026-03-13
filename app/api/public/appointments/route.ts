import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { BookAppointmentSchema } from '@/lib/validators';
import { getAvailableSlots } from '@/lib/scheduling';

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = BookAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { nome, email, telefone, mensagem, data, hora } = parsed.data;

  if (data < getTodayISO()) {
    return NextResponse.json({ error: 'Não é possível solicitar pré-consulta em datas passadas.' }, { status: 400 });
  }

  const slots = await getAvailableSlots(data);

  if (!slots.includes(hora)) {
    return NextResponse.json({ error: 'O horário selecionado não é válido para a data informada.' }, { status: 409 });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        nome_paciente: nome,
        email,
        telefone,
        mensagem,
        data,
        hora,
        status: 'pending',
      },
    });

    return NextResponse.json({
      appointment,
      message: 'Sua pré-consulta foi solicitada com sucesso e está aguardando a confirmação do psicólogo.\n\nEssa conversa inicial servirá para que vocês possam se conhecer melhor e entender se desejam iniciar o processo terapêutico.\n\nVocê receberá a confirmação da agenda por e-mail ou contato telefônico.',
    });
  } catch {
    return NextResponse.json({ error: 'Conflito de agendamento' }, { status: 409 });
  }
}
