// app/api/services/[id]/route.ts
// GET: Obter detalhes do serviço
// PUT: Atualizar serviço
// DELETE: Deletar serviço

import { NextRequest, NextResponse } from 'next/server';
import { ServiceSchema } from '@/lib/validators';
import prisma from '@/lib/database';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/services/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const service = await prisma.service.findUnique({
      where: { id },
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

    return NextResponse.json(
      {
        success: true,
        data: service,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao obter serviço:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// PUT /api/services/[id]
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

    // Obtém o serviço
    const service = await prisma.service.findUnique({
      where: { id },
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

    // Verifica permissão
    const psychologist = await prisma.psychologist.findUnique({
      where: { user_id: decoded.userId },
    });

    if (!psychologist || service.psychologist_id !== psychologist.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você não tem permissão para atualizar este serviço',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.price !== undefined) updateData.price = Math.round(body.price * 100);
    if (body.color !== undefined) updateData.color = body.color;

    // Atualiza
    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedService,
        message: 'Serviço atualizado com sucesso!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id]
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

    // Obtém o serviço
    const service = await prisma.service.findUnique({
      where: { id },
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

    // Verifica permissão
    const psychologist = await prisma.psychologist.findUnique({
      where: { user_id: decoded.userId },
    });

    if (!psychologist || service.psychologist_id !== psychologist.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você não tem permissão para deletar este serviço',
        },
        { status: 403 }
      );
    }

    // Verifica se há agendamentos associados
    const appointmentCount = await prisma.appointment.count({
      where: { service_id: id },
    });

    if (appointmentCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não é possível deletar um serviço com agendamentos associados',
        },
        { status: 409 }
      );
    }

    // Deleta
    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Serviço deletado com sucesso!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao deletar serviço:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
