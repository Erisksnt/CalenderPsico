// app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceSchema } from '@/lib/validators';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { verifyJWT, getTokenFromHeader } from '@/lib/auth';

// ⚡ Helper de autenticação (igual ao arquivo anterior)
async function getPsychologistFromToken(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization') || '');
  if (!token) {
    return { error: 'Não autorizado', status: 401 };
  }

  const decoded = verifyJWT(token);
  if (!decoded || decoded.role !== 'PSYCHOLOGIST') {
    return { error: 'Acesso negado. Apenas psicólogos podem realizar esta ação.', status: 403 };
  }

  const psychologist = await prisma.psychologist.findUnique({
    where: { user_id: decoded.userId },
    select: { id: true }
  });

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado', status: 404 };
  }

  return { psychologistId: psychologist.id, userId: decoded.userId };
}

// GET /api/services?psychologist_id=xxx
export async function GET(req: NextRequest) {
  console.time("GET /api/services");
  
  try {
    const { searchParams } = new URL(req.url);
    const psychologistId = searchParams.get('psychologist_id');

    const where: any = {};

    if (psychologistId) {
      where.psychologist_id = psychologistId;
    }

    console.time("findServices");
    const services = await prisma.service.findMany({
      where,
      // ⚡ Remover include e usar select específico
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        color: true,
        psychologist_id: true,
        created_at: true,
        updated_at: true,
        // Se precisar de dados do psicólogo, selecione apenas o necessário
        psychologist: {
          select: {
            id: true,
            name: true,
            photo_url: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    console.timeEnd("findServices");

    console.timeEnd("GET /api/services");
    return NextResponse.json(
      { success: true, data: services },
      { status: 200 }
    );
  } catch (error: any) {
    console.timeEnd("GET /api/services");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao listar serviços:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { debug: errorMessage }),
      },
      { status: 500 }
    );
  }
}

// POST /api/services
export async function POST(req: NextRequest) {
  console.time("POST /api/services");
  
  try {
    // ⚡ Usar helper de autenticação
    const auth = await getPsychologistFromToken(req);
    if ('error' in auth) {
      console.timeEnd("POST /api/services");
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { psychologistId } = auth;

    const body = await req.json();

    // Validação
    console.time("validateService");
    const validation = ServiceSchema.safeParse(body);
    console.timeEnd("validateService");
    
    if (!validation.success) {
      console.timeEnd("POST /api/services");
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        {
          success: false,
          error: 'Erro de validação',
          data: { errors },
        },
        { status: 400 }
      );
    }

    const { name, description, duration, price, color } = validation.data;

    // ⚡ Criar serviço com select otimizado
    console.time("createService");
    const service = await prisma.service.create({
      data: {
        psychologist_id: psychologistId,
        name,
        description: description || undefined,
        duration,
        price: Math.round(price * 100), // Converte para centavos
        color: color || '#3B82F6',
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        color: true,
        psychologist_id: true,
        created_at: true,
        updated_at: true
      }
    });
    console.timeEnd("createService");

    console.timeEnd("POST /api/services");
    return NextResponse.json(
      {
        success: true,
        data: service,
        message: 'Serviço criado com sucesso!',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.timeEnd("POST /api/services");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao criar serviço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}