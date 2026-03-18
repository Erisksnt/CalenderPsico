// app/api/psychologists/time-blocks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { TimeBlockSchema } from '@/lib/validators';

// ⚡ Helper reutilizável para autenticação
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

  // ✅ Já temos o userId no token, podemos usar direto
  // Mas precisamos verificar se o psicólogo existe
  const psychologist = await prisma.psychologist.findUnique({
    where: { user_id: decoded.userId },
    select: { id: true } // ⚡ Só precisamos do ID
  });

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado', status: 404 };
  }

  return { psychologistId: psychologist.id, userId: decoded.userId };
}

export async function GET(req: NextRequest) {
  console.time("GET /api/psychologists/time-blocks");
  
  try {
    // ⚡ Usar helper único
    const result = await getPsychologistFromToken(req);
    
    if ('error' in result) {
      console.timeEnd("GET /api/psychologists/time-blocks");
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { psychologistId } = result;

    // ⚡ Buscar bloqueios com select otimizado
    console.time("findTimeBlocks");
    const timeBlocks = await prisma.timeBlock.findMany({
      where: { psychologist_id: psychologistId },
      orderBy: { start_time: 'asc' },
      select: {
        id: true,
        start_time: true,
        end_time: true,
        reason: true,
        created_at: true,
        psychologist_id: true
      }
    });
    console.timeEnd("findTimeBlocks");

    console.timeEnd("GET /api/psychologists/time-blocks");
    return NextResponse.json(
      { success: true, data: timeBlocks },
      { status: 200 }
    );
  } catch (error: any) {
    console.timeEnd("GET /api/psychologists/time-blocks");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao buscar bloqueios:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.time("POST /api/psychologists/time-blocks");
  
  try {
    // ⚡ Reusar o mesmo helper (DRY)
    const result = await getPsychologistFromToken(req);
    
    if ('error' in result) {
      console.timeEnd("POST /api/psychologists/time-blocks");
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { psychologistId } = result;

    const body = await req.json();

    // Validação
    console.time("validateTimeBlock");
    const validation = TimeBlockSchema.safeParse(body);
    console.timeEnd("validateTimeBlock");
    
    if (!validation.success) {
      console.timeEnd("POST /api/psychologists/time-blocks");
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { success: false, error: 'Erro de validação', data: { errors } },
        { status: 400 }
      );
    }

    // ⚡ Criar bloqueio com select otimizado
    console.time("createTimeBlock");
    const timeBlock = await prisma.timeBlock.create({
      data: {
        psychologist_id: psychologistId,
        start_time: new Date(validation.data.start_time),
        end_time: new Date(validation.data.end_time),
        reason: validation.data.reason,
      },
      select: {
        id: true,
        start_time: true,
        end_time: true,
        reason: true,
        created_at: true,
        psychologist_id: true
      }
    });
    console.timeEnd("createTimeBlock");

    console.timeEnd("POST /api/psychologists/time-blocks");
    return NextResponse.json(
      { success: true, data: timeBlock },
      { status: 201 }
    );
  } catch (error: any) {
    console.timeEnd("POST /api/psychologists/time-blocks");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao criar bloqueio:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}