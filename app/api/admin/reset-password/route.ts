import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { ResetPasswordSchema } from '@/lib/validators';
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = ResetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const now = new Date();

  const user = await prisma.user.findFirst({
    where: {
      reset_password_token: token,
      reset_password_expires_at: { gt: now },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: hashPassword(password),
      reset_password_token: null,
      reset_password_expires_at: null,
    },
  });

  return NextResponse.json({ success: true });
}
