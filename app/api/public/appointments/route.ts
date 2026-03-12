import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { BookAppointmentSchema } from '@/lib/validators';
import { getAvailableSlots } from '@/lib/scheduling';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = BookAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { nome, email, telefone, mensagem, data, hora } = parsed.data;
  const slots = await getAvailableSlots(data);

  if (!slots.includes(hora)) {
    return NextResponse.json({ error: 'Horário não disponível' }, { status: 409 });
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
      message: 'Solicitação enviada. O psicólogo entrará em contato para confirmar.',
    });
  } catch {
    return NextResponse.json({ error: 'Conflito de agendamento' }, { status: 409 });
  }
}
