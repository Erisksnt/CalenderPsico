import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { UpdateAppointmentStatusSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureDefaultAdmin();
    const admin = await getAdminFromRequest(request);
    if (!admin?.psychologist) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const parsed = UpdateAppointmentStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const existing = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        psychologist_id: admin.psychologist.id,
      },
    });

    if (!existing) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json(updated);
  } catch (error) {

    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro ao atualizar agendamento do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
