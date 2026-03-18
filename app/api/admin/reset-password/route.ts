import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { ResetPasswordSchema } from '@/lib/validators';
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  console.time("POST /api/auth/reset-password"); // Opcional
  
  try {
    const body = await request.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      console.timeEnd("POST /api/auth/reset-password");
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { token, password } = parsed.data;
    const now = new Date();

    console.time("findUser"); // Opcional
    // ⚡ OTIMIZAÇÃO 1: Selecionar apenas campos necessários
    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires_at: { gt: now },
      },
      select: {  // ✅ Buscar só o que precisa
        id: true
      }
    });
    console.timeEnd("findUser"); // Opcional

    if (!user) {
      console.timeEnd("POST /api/auth/reset-password");
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
    }

    console.time("updateUser"); // Opcional
    // ⚡ OTIMIZAÇÃO 2: Não precisa retornar nada
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: await hashPassword(password),
        reset_password_token: null,
        reset_password_expires_at: null,
      },
      // ✅ Não precisa selecionar nada (só queremos confirmar que atualizou)
    });
    console.timeEnd("updateUser"); // Opcional

    console.timeEnd("POST /api/auth/reset-password");
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.timeEnd("POST /api/auth/reset-password");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    console.error('Erro ao resetar senha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}