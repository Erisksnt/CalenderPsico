// app/api/admin/cleanup/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Quantos dias manter (padrão: 30)
  const { daysToKeep = 30 } = await request.json();

  // Data limite: hoje - daysToKeep
  const today = new Date();
  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() - daysToKeep);
  
  // Formatar como YYYY-MM-DD
  const limitDateStr = limitDate.toISOString().split('T')[0];

  console.log(`🗑️ Limpando agendamentos anteriores a ${limitDateStr}`);

  // ❌ IMPORTANTE: Só apaga se a DATA do agendamento for antiga
  // ✅ NÃO apaga agendamentos futuros!
  const result = await prisma.appointment.deleteMany({
    where: {
      OR: [
        { status: 'COMPLETED' },
        { status: 'CANCELLED' }
      ],
      data: {
        lt: limitDateStr  // data do agendamento < data limite
      }
    }
  });

  return NextResponse.json({ 
    success: true,
    message: `Limpeza concluída`, 
    deletedCount: result.count,
    deletedBefore: limitDateStr
  });
}

// Para testes manuais (GET)
export async function GET() {
  const today = new Date();
  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() - 30);
  
  const count = await prisma.appointment.count({
    where: {
      OR: [
        { status: 'COMPLETED' },
        { status: 'CANCELLED' }
      ],
      data: {
        lt: limitDate.toISOString().split('T')[0]
      }
    }
  });

  return NextResponse.json({
    message: `Há ${count} agendamentos antigos para limpeza`,
    example: `Agendamentos com data < ${limitDate.toISOString().split('T')[0]}`
  });
}