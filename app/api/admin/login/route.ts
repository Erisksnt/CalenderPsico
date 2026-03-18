import { NextResponse } from 'next/server';
import { AdminLoginSchema } from '@/lib/validators';
// 🔥 REMOVER esta linha:
// import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { verifyPassword, createToken, buildAuthCookie } from '@/lib/auth';
import { isDatabaseConnectionError, createDatabaseUnavailableResponse } from '@/lib/database';
import prisma from '@/lib/database';

export async function POST(request: Request) {
  console.time("POST /api/admin/login"); // Opcional
  
  try {
    const body = await request.json();
    const parsed = AdminLoginSchema.safeParse(body);

    if (!parsed.success) {
      console.timeEnd("POST /api/admin/login"); // Opcional
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // 🔥 REMOVER estas 3 linhas:
    // console.time("ensureDefaultAdmin");
    // await ensureDefaultAdmin();
    // console.timeEnd("ensureDefaultAdmin");

    const email = parsed.data.email.trim().toLowerCase();
    
    console.time("findUser"); // Opcional
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        psychologist: {
          select: {  // ⚡ Selecionar apenas o necessário
            id: true
          }
        } 
      },
    });
    console.timeEnd("findUser"); // Opcional

    // Verificação rápida (sem mensagem específica por segurança)
    if (!user || user.role !== 'ADMIN') {
      console.timeEnd("POST /api/admin/login"); // Opcional
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    console.time("verifyPassword"); // Opcional
    const passwordMatches = await verifyPassword(parsed.data.password, user.password_hash);
    console.timeEnd("verifyPassword"); // Opcional
    
    if (!passwordMatches) {
      console.timeEnd("POST /api/admin/login"); // Opcional
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    console.time("createToken"); // Opcional
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: 'ADMIN',
      psychologistId: user.psychologist?.id,
    });
    console.timeEnd("createToken"); // Opcional

    console.timeEnd("POST /api/admin/login"); // Opcional
    
    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      {
        headers: {
          'Set-Cookie': buildAuthCookie(token),
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.timeEnd("POST /api/admin/login"); // Opcional
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro no login do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}