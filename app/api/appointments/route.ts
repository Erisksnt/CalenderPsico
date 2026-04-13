export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma, { isDatabaseConnectionError, createDatabaseUnavailableResponse } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth';
import { BookAppointmentSchema } from '@/lib/validators';
import { getTodayISO } from '@/lib/scheduling';
import { invalidateAdminCache } from '@/lib/admin-cache';
import { sendAppointmentRequestedEmail } from '@/lib/appointment-email';

// ID FIXO do psicólogo (obtido uma vez e mantido)
const PSYCHOLOGIST_ID = 'cmmw6oa2b0003132nw01wicuh';

export async function GET(req: NextRequest) {
  console.time("GET /api/appointments");
  
  try {
    console.time("getAuthenticatedUser");
    const user = await getAuthenticatedUser(req);
    console.timeEnd("getAuthenticatedUser");
    
    if (!user?.psychologist) {
      console.timeEnd("GET /api/appointments");
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    console.time("findAppointments");
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
        status: true,
        created_at: true
      }
    });
    console.timeEnd("findAppointments");

    console.timeEnd("GET /api/appointments");
    return NextResponse.json({ success: true, data: appointments }, { status: 200 });
  } catch (error) {
    console.timeEnd("GET /api/appointments");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao listar agendamentos:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

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

    // ✅ CRIA AGENDAMENTO (upsert)
    console.time("createAppointment");
    const appointment = await prisma.appointment.upsert({
      where: {
        psychologist_id_data_hora: {
          psychologist_id: PSYCHOLOGIST_ID,
          data: data,
          hora: hora
        }
      },
      update: {
        nome_paciente: nome,
        email,
        telefone,
        mensagem,
        status: 'PENDING',
        updated_at: new Date()
      },
      create: {
        psychologist_id: PSYCHOLOGIST_ID,
        nome_paciente: nome,
        email,
        telefone,
        mensagem,
        data,
        hora,
        status: 'PENDING',
      },
      select: {
        id: true,
        nome_paciente: true,
        data: true,
        hora: true,
        status: true
      }
    });
    console.timeEnd("createAppointment");

    // INVALIDAR CACHE DO ADMIN
    invalidateAdminCache(PSYCHOLOGIST_ID, '');
    console.log(`🗑️ Cache invalidado para psicólogo ${PSYCHOLOGIST_ID}`);

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