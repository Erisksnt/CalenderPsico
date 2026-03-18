// app/api/services/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceSchema } from '@/lib/validators';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// ⚡ Helper de autenticação (podemos mover para um arquivo compartilhado depois)
async function getPsychologistIdFromToken(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization') || '');
  if (!token) {
    return { error: 'Não autorizado', status: 401 };
  }

  const decoded = verifyJWT(token);
  if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
    return { error: 'Acesso negado', status: 403 };
  }

  // ⚡ Buscar apenas o ID do psicólogo
  const psychologist = await prisma.psychologist.findUnique({
    where: { user_id: decoded.userId },
    select: { id: true }
  });

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado', status: 404 };
  }

  return { psychologistId: psychologist.id, userId: decoded.userId };
}

// GET /api/services/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  console.time(`GET /api/services/${params.id}`);
  
  try {
    const { id } = params;

    console.time("findService");
    const service = await prisma.service.findUnique({
      where: { id },
      // ⚡ Remover include e usar select específico
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        color: true,
        psychologist_id: true,
        // Se precisar de dados do psicólogo, selecione apenas o necessário
        psychologist: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    console.timeEnd("findService");

    if (!service) {
      console.timeEnd(`GET /api/services/${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    console.timeEnd(`GET /api/services/${params.id}`);
    return NextResponse.json(
      { success: true, data: service },
      { status: 200 }
    );
  } catch (error: any) {
    console.timeEnd(`GET /api/services/${params.id}`);
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao obter serviço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/services/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  console.time(`PUT /api/services/${params.id}`);
  
  try {
    // ⚡ Usar helper de autenticação
    const auth = await getPsychologistIdFromToken(req);
    if ('error' in auth) {
      console.timeEnd(`PUT /api/services/${params.id}`);
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = params;
    const { psychologistId } = auth;

    // ⚡ Verificar serviço e permissão em UMA query
    console.time("findAndVerifyService");
    const service = await prisma.service.findUnique({
      where: { 
        id,
        psychologist_id: psychologistId // ✅ Já filtra pelo psicólogo!
      },
      select: { id: true } // ✅ Só precisamos saber se existe
    });
    console.timeEnd("findAndVerifyService");

    if (!service) {
      console.timeEnd(`PUT /api/services/${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    
    // ⚡ Preparar dados (mantendo a lógica de negócio)
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.price !== undefined) updateData.price = Math.round(body.price * 100);
    if (body.color !== undefined) updateData.color = body.color;

    // ⚡ Atualizar com select otimizado
    console.time("updateService");
    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        color: true,
        psychologist_id: true,
        updated_at: true
      }
    });
    console.timeEnd("updateService");

    console.timeEnd(`PUT /api/services/${params.id}`);
    return NextResponse.json(
      {
        success: true,
        data: updatedService,
        message: 'Serviço atualizado com sucesso!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.timeEnd(`PUT /api/services/${params.id}`);
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  console.time(`DELETE /api/services/${params.id}`);
  
  try {
    // ⚡ Usar helper de autenticação
    const auth = await getPsychologistIdFromToken(req);
    if ('error' in auth) {
      console.timeEnd(`DELETE /api/services/${params.id}`);
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = params;
    const { psychologistId } = auth;

    // ⚡ Verificar serviço e permissão em UMA query
    console.time("findAndVerifyService");
    const service = await prisma.service.findUnique({
      where: { 
        id,
        psychologist_id: psychologistId
      },
      select: { id: true }
    });
    console.timeEnd("findAndVerifyService");

    if (!service) {
      console.timeEnd(`DELETE /api/services/${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    // ⚡ Verificar agendamentos associados (contagem rápida)
    console.time("checkAppointments");
    const appointmentCount = await prisma.appointment.count({
      where: { service_id: id },
    });
    console.timeEnd("checkAppointments");

    if (appointmentCount > 0) {
      console.timeEnd(`DELETE /api/services/${params.id}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Não é possível deletar um serviço com agendamentos associados',
        },
        { status: 409 }
      );
    }

    // ⚡ Deletar (não precisa retornar nada)
    console.time("deleteService");
    await prisma.service.delete({
      where: { id },
    });
    console.timeEnd("deleteService");

    console.timeEnd(`DELETE /api/services/${params.id}`);
    return NextResponse.json(
      {
        success: true,
        message: 'Serviço deletado com sucesso!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.timeEnd(`DELETE /api/services/${params.id}`);
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao deletar serviço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}