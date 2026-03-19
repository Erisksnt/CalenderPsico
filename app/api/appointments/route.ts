export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma, { isDatabaseConnectionError, createDatabaseUnavailableResponse } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth';
import { BookAppointmentSchema } from '@/lib/validators';
import { getTodayISO, getAvailableSlots } from '@/lib/scheduling';

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

    // ⚡ Buscar psicólogo principal com select otimizado
    console.time("findPsychologist");
    const psychologist = await prisma.psychologist.findFirst({
      orderBy: { created_at: 'asc' },
      select: { id: true }
    });
    console.timeEnd("findPsychologist");
    
    if (!psychologist) {
      console.timeEnd("POST /api/appointments");
      return NextResponse.json({ success: false, error: 'Psicólogo não encontrado' }, { status: 404 });
    }

    const { nome, email, telefone, mensagem, data, hora } = parsed.data;

    if (data < getTodayISO()) {
      console.timeEnd("POST /api/appointments");
      return NextResponse.json({ success: false, error: 'Não é possível agendar em datas passadas' }, { status: 400 });
    }

    console.time("checkAvailability");
    const slots = await getAvailableSlots(data, psychologist.id);
    console.timeEnd("checkAvailability");
    
    if (!slots.includes(hora)) {
      console.timeEnd("POST /api/appointments");
      return NextResponse.json({ success: false, error: 'Horário indisponível' }, { status: 409 });
    }

    // 🔥 VERIFICAÇÃO EXTRA DE SEGURANÇA - CORRIGIDA
    console.time("finalCheck");
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        psychologist_id: psychologist.id,
        data: data,
        hora: hora,
        // ✅ Só bloqueia se for PENDING ou CONFIRMED
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });
    console.timeEnd("finalCheck");

    if (existingAppointment) {
      console.log('❌ CONFLITO: Agendamento ativo já existe', existingAppointment);
      console.timeEnd("POST /api/appointments");
      return NextResponse.json({ 
        success: false, 
        error: 'Horário indisponível' 
      }, { status: 409 });
    }

    // 🔥 SUBSTITUÍDO: create por upsert
    console.time("createAppointment");
    const appointment = await prisma.appointment.upsert({
      where: {
        // Usa a unique constraint para encontrar
        psychologist_id_data_hora: {
          psychologist_id: psychologist.id,
          data: data,
          hora: hora
        }
      },
      // Se existir (caso cancelado), atualiza para PENDING
      update: {
        nome_paciente: nome,
        email,
        telefone,
        mensagem,
        status: 'PENDING',
        updated_at: new Date()
      },
      // Se não existir, cria novo
      create: {
        psychologist_id: psychologist.id,
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
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}