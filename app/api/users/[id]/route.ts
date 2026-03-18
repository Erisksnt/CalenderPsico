// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// ⚡ Helper de autenticação (podemos mover para shared depois)
async function authenticateRequest(req: NextRequest, userId: string) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Token inválido', status: 401 };
  }

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return { error: 'Token inválido', status: 401 };
  }

  // Verifica se é o próprio usuário
  if (decoded.userId !== userId) {
    return { error: 'Acesso negado', status: 403 };
  }

  return { userId: decoded.userId };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.time(`GET /api/users/${params.id}`);
  
  try {
    const { id } = params;

    // ⚡ Autenticação
    console.time("authenticate");
    const auth = await authenticateRequest(req, id);
    if ('error' in auth) {
      console.timeEnd(`GET /api/users/${params.id}`);
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    console.timeEnd("authenticate");

    // ⚡ Buscar usuário (já tem select, mas vamos refinar)
    console.time("findUser");
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Se precisar de dados relacionados
        profile: {
          select: {
            id: true,
            full_name: true,
            photo_url: true
          }
        }
      },
    });
    console.timeEnd("findUser");

    if (!user) {
      console.timeEnd(`GET /api/users/${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.timeEnd(`GET /api/users/${params.id}`);
    return NextResponse.json(
      { success: true, data: user },
      { status: 200 }
    );
  } catch (error: any) {
    console.timeEnd(`GET /api/users/${params.id}`);
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}