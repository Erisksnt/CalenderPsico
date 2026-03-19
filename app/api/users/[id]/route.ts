// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// ⚡ Helper de autenticação
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

    console.time("findUser");
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,  // ✅ Nome correto do campo
        updated_at: true,  // ✅ Nome correto do campo
        profile: {
          select: {
            full_name: true
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

    // Transformar para camelCase se o frontend esperar assim
    const userData = {
      id: user.id,
      email: user.email,
      name: user.profile?.full_name || null,
      role: user.role,
      createdAt: user.created_at,  // ← Transformação opcional
      updatedAt: user.updated_at   // ← Transformação opcional
    };

    console.timeEnd(`GET /api/users/${params.id}`);
    return NextResponse.json(
      { success: true, data: userData },
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