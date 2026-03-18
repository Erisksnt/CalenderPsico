// app/api/appointments/[id]/route.ts

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
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: appointment }, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter agendamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT /api/appointments/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization') || '');
    if (!token) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

    const decoded = verifyJWT(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });

    const { id } = params;
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return NextResponse.json({ success: false, error: 'Agendamento não encontrado' }, { status: 404 });

    const body = await req.json();
    const validation = UpdateAppointmentSchema.safeParse(body);
    if (!validation.success)
      return NextResponse.json(
        { success: false, error: 'Erro de validação', details: validation.error.format() },
        { status: 400 }
      );

    const { status } = validation.data;

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { ...(status && { status }) },
      select: {
        id: true,
        nome_paciente: true,
        email: true,
        telefone: true,
        mensagem: true,
        data: true,
        hora: true,
        status: true,
      },
    });

    await createAuditLog('Appointment', id, 'UPDATE', decoded.userId, appointment, updatedAppointment);

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      message: 'Agendamento atualizado com sucesso!',
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/appointments/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization') || '');
    if (!token) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

    const decoded = verifyJWT(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });

    const { id } = params;
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return NextResponse.json({ success: false, error: 'Agendamento não encontrado' }, { status: 404 });

    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      select: {
        id: true,
        nome_paciente: true,
        email: true,
        telefone: true,
        mensagem: true,
        data: true,
        hora: true,
        status: true,
      },
    });

    await createAuditLog('Appointment', id, 'CANCEL', decoded.userId, appointment, cancelledAppointment);

    return NextResponse.json({
      success: true,
      data: cancelledAppointment,
      message: 'Agendamento cancelado com sucesso!',
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}