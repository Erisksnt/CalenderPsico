// app/api/psychologists/time-blocks/[id]/route.ts
// Deletar bloqueio de data

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const psychologist = await prisma.psychologist.findUnique({
      where: { user_id: decoded.userId },
    });

    if (!psychologist) {
      return NextResponse.json(
        { success: false, error: 'Psicólogo não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se o bloqueio pertence ao psicólogo
    const timeBlock = await prisma.timeBlock.findUnique({
      where: { id: params.id },
    });

    if (!timeBlock || timeBlock.psychologist_id !== psychologist.id) {
      return NextResponse.json(
        { success: false, error: 'Bloqueio não encontrado' },
        { status: 404 }
      );
    }

    await prisma.timeBlock.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { success: true, message: 'Bloqueio removido' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao deletar bloqueio:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
