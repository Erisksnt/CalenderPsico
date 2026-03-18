import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
// 🔥 REMOVER esta linha:
// import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { UpdateAppointmentStatusSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // 🔥 REMOVER esta linha:
    // await ensureDefaultAdmin();
    
    console.time("getAdminFromRequest"); // Opcional
    const admin = await getAdminFromRequest(request);
    console.timeEnd("getAdminFromRequest"); // Opcional
    
    if (!admin?.psychologist) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateAppointmentStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // ⚡ Buscar apenas os campos necessários para validação
    console.time("findExisting"); // Opcional
    const existing = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        psychologist_id: admin.psychologist.id,
      },
      select: {  // ⚡ Selecionar apenas o que precisa
        id: true,
        status: true
      }
    });
    console.timeEnd("findExisting"); // Opcional

    if (!existing) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    // ⚡ Atualizar e retornar apenas campos necessários
    console.time("updateAppointment"); // Opcional
    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      select: {  // ⚡ Retornar apenas o necessário
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
    console.timeEnd("updateAppointment"); // Opcional

    return NextResponse.json(updated);
  } catch (error) {
    // ✅ Verificação de erro ÚNICA (removidas as duplicatas)
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro ao atualizar agendamento do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}