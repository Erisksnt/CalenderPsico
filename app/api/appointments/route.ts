// app/api/appointments/route.ts
// GET: Listar agendamentos
// POST: Criar novo agendamento

import { NextRequest, NextResponse } from 'next/server';
import { CreateAppointmentSchema } from '@/lib/validators';
import prisma from '@/lib/database';
import { verifyJWT, getTokenFromHeader, checkTimeSlotConflict } from '@/lib/auth';
import { getOrCreatePatient, createAuditLog } from '@/lib/database';
import { generateConfirmationToken, calculateEndTime } from '@/lib/utils';

// GET /api/appointments?status=SCHEDULED&date_from=xxx&date_to=xxx
export async function GET(req: NextRequest) {
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
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token inválido',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const where: any = {};

    // Psicólogo vê seus agendamentos
    if (decoded.role === 'PSYCHOLOGIST') {
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

      where.psychologist_id = psychologist.id;
    }

    // Paciente vê seus agendamentos
    if (decoded.role === 'PATIENT') {
      // TODO: Implementar lógica para pacientes
      // Precisa relacionar usuário com paciente
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.start_time = {};
      if (dateFrom) where.start_time.gte = new Date(dateFrom);
      if (dateTo) where.start_time.lte = new Date(dateTo);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: true,
        patient: true,
        psychologist: true,
      },
      orderBy: { start_time: 'asc' },
    });

    return NextResponse.json(
      {
        success: true,
        data: appointments,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao listar agendamentos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// POST /api/appointments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validação
    const validation = CreateAppointmentSchema.safeParse(body);
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

    const { service_id, patient_name, patient_email, patient_phone, start_time, notes } =
      validation.data;

    // Obtém o serviço
    const service = await prisma.service.findUnique({
      where: { id: service_id },
      include: { psychologist: true },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: 'Serviço não encontrado',
        },
        { status: 404 }
      );
    }

    // Calcula o horário de término
    const startDateTime = new Date(start_time);
    const endDateTime = calculateEndTime(startDateTime, service.duration);

    // Verifica conflito de agendamento (double booking)
    const hasConflict = await checkTimeSlotConflict(
      service.psychologist_id,
      startDateTime,
      endDateTime
    );

    if (hasConflict) {
      return NextResponse.json(
        {
          success: false,
          error: 'Horário não está disponível',
        },
        { status: 409 }
      );
    }

    // Obtém ou cria paciente
    const patient = await getOrCreatePatient(patient_name, patient_email, patient_phone);

    // Gera token de confirmação
    const confirmationToken = generateConfirmationToken();

    // Cria agendamento
    const appointment = await prisma.appointment.create({
      data: {
        service_id,
        patient_id: patient.id,
        psychologist_id: service.psychologist_id,
        start_time: startDateTime,
        end_time: endDateTime,
        notes: notes || undefined,
        confirmation_token: confirmationToken,
      },
      include: {
        service: true,
        patient: true,
      },
    });

    // Log de auditoria
    await createAuditLog(
      'Appointment',
      appointment.id,
      'CREATE',
      undefined,
      undefined,
      appointment
    );

    // TODO: Enviar email de confirmação para o paciente

    return NextResponse.json(
      {
        success: true,
        data: appointment,
        message: 'Agendamento realizado com sucesso! Verifique seu email para confirmar.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
