import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { UpdateAppointmentStatusSchema } from '@/lib/validators';
import { invalidateAdminCache } from '@/lib/admin-cache';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  console.time("PATCH /api/admin/appointments/[id]");
  
  try {
    console.time("getAdminFromRequest");
    const admin = await getAdminFromRequest(request);
    console.timeEnd("getAdminFromRequest");
    
    if (!admin?.psychologist) {
      console.timeEnd("PATCH /api/admin/appointments/[id]");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateAppointmentStatusSchema.safeParse(body);
    if (!parsed.success) {
      console.timeEnd("PATCH /api/admin/appointments/[id]");
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // ⚡ Buscar apenas os campos necessários para validação
    console.time("findExisting");
    const existing = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        psychologist_id: admin.psychologist.id,
      },
      select: {
        id: true,
        status: true
      }
    });
    console.timeEnd("findExisting");

    if (!existing) {
      console.timeEnd("PATCH /api/admin/appointments/[id]");
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    // ⚡ Atualizar e retornar apenas campos necessários
    console.time("updateAppointment");
    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      select: {
        id: true,
        data: true,
        hora: true,
        nome_paciente: true,
        email: true,
        telefone: true,
        status: true,
        mensagem: true,
        updated_at: true
      }
    });
    console.timeEnd("updateAppointment");

    // 🔥 INVALIDAR CACHE APÓS ALTERAÇÃO
    invalidateAdminCache(admin.psychologist.id, admin.id);
    console.log(`🗑️ Cache invalidado para psicólogo ${admin.psychologist.id}`);

    console.timeEnd("PATCH /api/admin/appointments/[id]");
    return NextResponse.json(updated);
  } catch (error) {
    console.timeEnd("PATCH /api/admin/appointments/[id]");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro ao atualizar agendamento do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}