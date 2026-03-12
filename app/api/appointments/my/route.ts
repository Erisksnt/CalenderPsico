// app/api/appointments/my/route.ts
// GET: Listar agendamentos do paciente autenticado

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verifica autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    if (decoded.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, error: 'Apenas pacientes podem acessar este endpoint' },
        { status: 403 }
      );
    }

    // Encontra o paciente associado ao usuário
    const patient = await prisma.patient.findFirst({
      where: { user_id: decoded.userId },
    });

    if (!patient) {
      // Pode ser que o paciente nunca tenha agendado nada
      // Retorna lista vazia
      return NextResponse.json(
        { success: true, data: [] },
        { status: 200 }
      );
    }

    // Busca todos os agendamentos do paciente
    const appointments = await prisma.appointment.findMany({
      where: { patient_id: patient.id },
      include: {
        service: true,
        psychologist: {
          select: {
            id: true,
            name: true,
            bio: true,
          },
        },
      },
      orderBy: { start_time: 'desc' },
    });

    return NextResponse.json(
      { success: true, data: appointments },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao listar agendamentos do paciente:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
