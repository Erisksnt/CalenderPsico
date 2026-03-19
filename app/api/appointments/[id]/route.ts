import { NextRequest, NextResponse } from 'next/server';
import { UpdateAppointmentSchema } from '@/lib/validators';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';
// import { createAuditLog } from '@/lib/database'; // 🔥 COMENTADO - legacy

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/appointments/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  console.time(`GET /api/appointments/${params.id}`);
  
  try {
    const { id } = params;

    console.time("findAppointment");
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        nome_paciente: true,
        email: true,
        telefone: true,
        mensagem: true,
        data: true,
        hora: true,
        status: true,
        created_at: true,
        psychologist: {
          select: {
            id: true,
            user: {
              select: {
                profile: {
                  select: {
                    full_name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    console.timeEnd("findAppointment");

    if (!appointment) {
      console.timeEnd(`GET /api/appointments/${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    console.timeEnd(`GET /api/appointments/${params.id}`);
    return NextResponse.json({ success: true, data: appointment }, { status: 200 });
  } catch (error) {
    console.timeEnd(`GET /api/appointments/${params.id}`);
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao obter agendamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  console.time(`PUT /api/appointments/${params.id}`);
  
  try {
    console.time("verifyToken");
    const token = getTokenFromHeader(req.headers.get('authorization') || '');
    if (!token) {
      console.timeEnd(`PUT /api/appointments/${params.id}`);
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    if (!decoded) {
      console.timeEnd(`PUT /api/appointments/${params.id}`);
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }
    console.timeEnd("verifyToken");

    const { id } = params;
    
    console.time("findExisting");
    const appointment = await prisma.appointment.findUnique({ 
      where: { id },
      select: {
        id: true,
        nome_paciente: true,
        status: true,
        data: true,
        hora: true
      }
    });
    console.timeEnd("findExisting");
    
    if (!appointment) {
      console.timeEnd(`PUT /api/appointments/${params.id}`);
      return NextResponse.json({ success: false, error: 'Agendamento não encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const validation = UpdateAppointmentSchema.safeParse(body);
    if (!validation.success) {
      console.timeEnd(`PUT /api/appointments/${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Erro de validação', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    console.time("updateAppointment");
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
    console.timeEnd("updateAppointment");

    console.timeEnd(`PUT /api/appointments/${params.id}`);
    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      message: 'Agendamento atualizado com sucesso!',
    }, { status: 200 });
  } catch (error) {
    console.timeEnd(`PUT /api/appointments/${params.id}`);
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  console.time(`DELETE /api/appointments/${params.id}`);
  
  try {
    console.time("verifyToken");
    const token = getTokenFromHeader(req.headers.get('authorization') || '');
    if (!token) {
      console.timeEnd(`DELETE /api/appointments/${params.id}`);
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    if (!decoded) {
      console.timeEnd(`DELETE /api/appointments/${params.id}`);
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }
    console.timeEnd("verifyToken");

    const { id } = params;
    
    console.time("findExisting");
    const appointment = await prisma.appointment.findUnique({ 
      where: { id },
      select: {
        id: true,
        nome_paciente: true,
        status: true,
        data: true,
        hora: true
      }
    });
    console.timeEnd("findExisting");
    
    if (!appointment) {
      console.timeEnd(`DELETE /api/appointments/${params.id}`);
      return NextResponse.json({ success: false, error: 'Agendamento não encontrado' }, { status: 404 });
    }

    console.time("cancelAppointment");
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
    console.timeEnd("cancelAppointment");

    console.timeEnd(`DELETE /api/appointments/${params.id}`);
    return NextResponse.json({
      success: true,
      data: cancelledAppointment,
      message: 'Agendamento cancelado com sucesso!',
    }, { status: 200 });
  } catch (error) {
    console.timeEnd(`DELETE /api/appointments/${params.id}`);
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao cancelar agendamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}