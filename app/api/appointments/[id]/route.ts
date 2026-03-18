import { NextRequest, NextResponse } from 'next/server';
import { UpdateAppointmentSchema } from '@/lib/validators';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database'; // ⚡ Adicionar imports de erro
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';
import { createAuditLog } from '@/lib/database';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/appointments/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  console.time(`GET /api/appointments/${params.id}`); // Opcional
  
  try {
    const { id } = params;

    console.time("findAppointment"); // Opcional
    // ⚡ OTIMIZAÇÃO 1: Selecionar apenas campos necessários
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
    console.timeEnd("findAppointment"); // Opcional

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

// PUT /api/appointments/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  console.time(`PUT /api/appointments/${params.id}`); // Opcional
  
  try {
    console.time("verifyToken"); // Opcional
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
    console.timeEnd("verifyToken"); // Opcional

    const { id } = params;
    
    // ⚡ OTIMIZAÇÃO 2: Buscar apenas o necessário para validação
    console.time("findExisting"); // Opcional
    const appointment = await prisma.appointment.findUnique({ 
      where: { id },
      select: {  // ✅ Buscar só o que precisa para o audit log
        id: true,
        nome_paciente: true,
        status: true,
        data: true,
        hora: true
      }
    });
    console.timeEnd("findExisting"); // Opcional
    
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

    // ⚡ OTIMIZAÇÃO 3: Atualizar e selecionar apenas campos necessários
    console.time("updateAppointment"); // Opcional
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { ...(status && { status }) },
      select: {  // ✅ Já está bom, mantém
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
    console.timeEnd("updateAppointment"); // Opcional

    // ⚡ OTIMIZAÇÃO 4: Audit log em background (não blocker)
    console.time("auditLog"); // Opcional
    createAuditLog('Appointment', id, 'UPDATE', decoded.userId, appointment, updatedAppointment)
      .catch(err => console.error('Erro no audit log:', err));
    console.timeEnd("auditLog"); // Opcional

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

// DELETE /api/appointments/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  console.time(`DELETE /api/appointments/${params.id}`); // Opcional
  
  try {
    console.time("verifyToken"); // Opcional
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
    console.timeEnd("verifyToken"); // Opcional

    const { id } = params;
    
    // ⚡ OTIMIZAÇÃO 5: Buscar apenas o necessário
    console.time("findExisting"); // Opcional
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
    console.timeEnd("findExisting"); // Opcional
    
    if (!appointment) {
      console.timeEnd(`DELETE /api/appointments/${params.id}`);
      return NextResponse.json({ success: false, error: 'Agendamento não encontrado' }, { status: 404 });
    }

    // ⚡ OTIMIZAÇÃO 6: Cancelar e selecionar apenas necessário
    console.time("cancelAppointment"); // Opcional
    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      select: {  // ✅ Já está bom
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
    console.timeEnd("cancelAppointment"); // Opcional

    // ⚡ OTIMIZAÇÃO 7: Audit log em background
    console.time("auditLog"); // Opcional
    createAuditLog('Appointment', id, 'CANCEL', decoded.userId, appointment, cancelledAppointment)
      .catch(err => console.error('Erro no audit log:', err));
    console.timeEnd("auditLog"); // Opcional

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