// app/api/appointments/[id]/route.ts
// GET: Obter detalhes de um agendamento
// PUT: Atualizar status de um agendamento
// DELETE: Cancelar agendamento

import { NextRequest, NextResponse } from 'next/server';
import { UpdateAppointmentSchema } from '@/lib/validators';
import prisma from '@/lib/database';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';
import { createAuditLog } from '@/lib/database';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/appointments/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        patient: true,
        psychologist: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agendamento não encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: appointment,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao obter agendamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    const { id } = params;

    // Obtém o agendamento
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agendamento não encontrado',
        },
        { status: 404 }
      );
    }

    // Verifica permissão
    if (decoded.role === 'PSYCHOLOGIST') {
      const psychologist = await prisma.psychologist.findUnique({
        where: { user_id: decoded.userId },
      });

      if (!psychologist || appointment.psychologist_id !== psychologist.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Você não tem permissão para atualizar este agendamento',
          },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Apenas psicólogos podem atualizar agendamentos',
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validação
    const validation = UpdateAppointmentSchema.safeParse(body);
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

    const { status, notes, start_time } = validation.data;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (start_time !== undefined) {
      updateData.start_time = new Date(start_time);
      // Se alterar a data, recalcular end_time baseado na duração do serviço
      const service = await prisma.service.findUnique({
        where: { id: appointment.service_id },
      });
      if (service) {
        updateData.end_time = new Date(
          new Date(start_time).getTime() + service.duration * 60000
        );
      }
    }

    // Atualiza
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        patient: true,
        psychologist: true,
      },
    });

    // Log de auditoria
    await createAuditLog(
      'Appointment',
      id,
      'UPDATE',
      decoded.userId,
      appointment,
      updatedAppointment
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedAppointment,
        message: 'Agendamento atualizado com sucesso!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    const { id } = params;

    // Obtém o agendamento
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agendamento não encontrado',
        },
        { status: 404 }
      );
    }

    // Verifica permissão
    if (decoded.role === 'PSYCHOLOGIST') {
      const psychologist = await prisma.psychologist.findUnique({
        where: { user_id: decoded.userId },
      });

      if (!psychologist || appointment.psychologist_id !== psychologist.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Você não tem permissão para cancelar este agendamento',
          },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Apenas psicólogos podem cancelar agendamentos',
        },
        { status: 403 }
      );
    }

    // Cancela o agendamento (soft delete)
    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Log de auditoria
    await createAuditLog('Appointment', id, 'CANCEL', decoded.userId, appointment, {
      status: 'CANCELLED',
    });

    return NextResponse.json(
      {
        success: true,
        data: cancelledAppointment,
        message: 'Agendamento cancelado com sucesso!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao cancelar agendamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
