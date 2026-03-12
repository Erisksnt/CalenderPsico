// app/api/availability/[id]/route.ts
// PUT: Atualizar disponibilidade
// DELETE: Deletar disponibilidade

import { NextRequest, NextResponse } from 'next/server';
import { AvailabilitySchema } from '@/lib/validators';
import prisma from '@/lib/database';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/availability/[id]
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
    if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso negado',
        },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verifica se a disponibilidade existe
    const availability = await prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) {
      return NextResponse.json(
        {
          success: false,
          error: 'Disponibilidade não encontrada',
        },
        { status: 404 }
      );
    }

    // Verifica se o psicólogo é o proprietário
    const psychologist = await prisma.psychologist.findUnique({
      where: { user_id: decoded.userId },
    });

    if (!psychologist || availability.psychologist_id !== psychologist.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você não tem permissão para atualizar esta disponibilidade',
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validação (todos os campos são opcionais para update)
    const updateData: any = {};

    if (body.day_of_week) updateData.day_of_week = body.day_of_week;
    if (body.start_time) updateData.start_time = body.start_time;
    if (body.end_time) updateData.end_time = body.end_time;
    if (body.is_blocked !== undefined) updateData.is_blocked = body.is_blocked;

    // Atualiza
    const updatedAvailability = await prisma.availability.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedAvailability,
        message: 'Disponibilidade atualizada com sucesso!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao atualizar disponibilidade:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/availability/[id]
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
    if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso negado',
        },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verifica se a disponibilidade existe
    const availability = await prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) {
      return NextResponse.json(
        {
          success: false,
          error: 'Disponibilidade não encontrada',
        },
        { status: 404 }
      );
    }

    // Verifica se o psicólogo é o proprietário
    const psychologist = await prisma.psychologist.findUnique({
      where: { user_id: decoded.userId },
    });

    if (!psychologist || availability.psychologist_id !== psychologist.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você não tem permissão para deletar esta disponibilidade',
        },
        { status: 403 }
      );
    }

    // Deleta
    await prisma.availability.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Disponibilidade deletada com sucesso!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao deletar disponibilidade:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
