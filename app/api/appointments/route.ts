export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { AppointmentStatus } from '@prisma/client';
import prisma, { isDatabaseConnectionError, createDatabaseUnavailableResponse } from '@/lib/database';
import { BookAppointmentSchema } from '@/lib/validators';
import { getTodayISO, getAvailableSlots, getPrimaryPsychologistId } from '@/lib/scheduling';
import { invalidateAdminCache } from '@/lib/admin-cache';
import { sendAppointmentRequestedEmail } from '@/lib/appointment-email';

export async function POST(req: NextRequest) {
  console.time("POST /api/appointments");
  
  try {
    const body = await req.json();
    const parsed = BookAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      console.timeEnd("POST /api/appointments");
      return NextResponse.json(
        { success: false, error: 'Erro de validação', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { nome, email, telefone, mensagem, data, hora } = parsed.data;

    if (data < getTodayISO()) {
      console.timeEnd("POST /api/appointments");
      return NextResponse.json({ success: false, error: 'Não é possível agendar em datas passadas' }, { status: 400 });
    }

    const psychologistId = await getPrimaryPsychologistId();
    if (!psychologistId) {
      return NextResponse.json({ success: false, error: 'Agendamentos indisponíveis no momento.' }, { status: 503 });
    }

    const availableSlots = await getAvailableSlots(data, psychologistId);
    if (!availableSlots.includes(hora)) {
      return NextResponse.json({ success: false, error: 'Horário indisponível.' }, { status: 409 });
    }

    console.time("createAppointment");
    const appointmentKey = {
      psychologist_id_data_hora: { psychologist_id: psychologistId, data, hora },
    };
    const existing = await prisma.appointment.findUnique({
      where: appointmentKey,
      select: { id: true, status: true },
    });

    const appointmentData = {
      nome_paciente: nome,
      email,
      telefone,
      mensagem,
      status: 'PENDING' as const,
      privacy_consent_at: new Date(),
      updated_at: new Date(),
    };

    let appointment: {
      id: string;
      nome_paciente: string;
      data: string;
      hora: string;
      status: AppointmentStatus;
    };
    if (existing) {
      if (existing.status !== 'CANCELLED') {
        console.timeEnd("createAppointment");
        console.timeEnd("POST /api/appointments");
        return NextResponse.json({ success: false, error: 'Horário indisponível.' }, { status: 409 });
      }

      const rebooked = await prisma.appointment.updateMany({
        where: { id: existing.id, status: 'CANCELLED' },
        data: appointmentData,
      });
      if (rebooked.count !== 1) {
        console.timeEnd("createAppointment");
        console.timeEnd("POST /api/appointments");
        return NextResponse.json({ success: false, error: 'Horário indisponível.' }, { status: 409 });
      }

      appointment = await prisma.appointment.findUniqueOrThrow({
        where: { id: existing.id },
        select: {
          id: true,
          nome_paciente: true,
          data: true,
          hora: true,
          status: true,
        },
      });
    } else {
      appointment = await prisma.appointment.create({
        data: {
          psychologist_id: psychologistId,
          nome_paciente: nome,
          email,
          telefone,
          mensagem,
          data,
          hora,
          privacy_consent_at: new Date(),
          status: 'PENDING',
        },
        select: {
          id: true,
          nome_paciente: true,
          data: true,
          hora: true,
          status: true,
        },
      });
    }
    console.timeEnd("createAppointment");

    // INVALIDAR CACHE DO ADMIN
    invalidateAdminCache(psychologistId, '');

    try {
      await sendAppointmentRequestedEmail({
        patientName: nome,
        patientEmail: email,
        patientPhone: telefone,
        date: data,
        time: hora,
        notes: mensagem,
      });
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de notificação ao psicólogo:', emailError);
    }

    console.timeEnd("POST /api/appointments");
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
    console.timeEnd("POST /api/appointments");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Horário indisponível' },
        { status: 409 }
      );
    }
    
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}