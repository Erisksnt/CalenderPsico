import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const appointments = await prisma.appointment.findMany({ orderBy: [{ data: 'asc' }, { hora: 'asc' }] });
  return NextResponse.json(appointments);
}
