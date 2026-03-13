import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { ForgotPasswordSchema } from '@/lib/validators';
import { createResetToken } from '@/lib/password';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = ForgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = createResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_password_token: token,
        reset_password_expires_at: expiresAt,
      },
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const resetLink = `${origin}/admin/reset-password?token=${token}`;

    // Simulação de envio de email (integrar provider SMTP depois)
    console.log(`[RESET PASSWORD] Enviar para ${email}: ${resetLink}`);
  }

  return NextResponse.json({
    message: 'Se o email existir, você receberá um link para redefinir sua senha.',
  });
}
