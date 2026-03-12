import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { UpdateAppointmentStatusSchema } from '@/lib/validators';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json();
  const parsed = UpdateAppointmentStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
