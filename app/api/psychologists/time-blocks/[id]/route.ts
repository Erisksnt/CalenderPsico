// app/api/psychologists/time-blocks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// ⚡ Helper de autenticação (igual ao outro arquivo - podemos mover para um local comum depois)
async function getPsychologistFromToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Token inválido', status: 401 };
  }

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.time(`DELETE /api/psychologists/time-blocks/${params.id}`);
  
  try {
    // ⚡ Reusar o mesmo helper
    const result = await getPsychologistFromToken(req);
    
    if ('error' in result) {
      console.timeEnd(`DELETE /api/psychologists/time-blocks/${params.id}`);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { psychologistId } = result;
    const { id } = params;

    // ⚡ Verificar se o bloqueio existe e pertence ao psicólogo em UMA query
    console.time("findAndVerifyTimeBlock");
    const timeBlock = await prisma.timeBlock.findUnique({
      where: { 
        id,
        psychologist_id: psychologistId // ✅ Já filtra pelo psicólogo na query!
      },
      select: { id: true } // ✅ Só precisamos saber se existe
    });
    console.timeEnd("findAndVerifyTimeBlock");

    if (!timeBlock) {
      console.timeEnd(`DELETE /api/psychologists/time-blocks/${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Bloqueio não encontrado' },
        { status: 404 }
      );
    }

    // ⚡ Deletar (não precisa retornar nada)
    console.time("deleteTimeBlock");
    await prisma.timeBlock.delete({
      where: { id },
      // ✅ Não precisa de select, só queremos confirmar que deletou
    });
    console.timeEnd("deleteTimeBlock");

    console.timeEnd(`DELETE /api/psychologists/time-blocks/${params.id}`);
    return NextResponse.json(
      { success: true, message: 'Bloqueio removido com sucesso' },
      { status: 200 }
    );
  } catch (error: any) {
    console.timeEnd(`DELETE /api/psychologists/time-blocks/${params.id}`);
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao deletar bloqueio:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}