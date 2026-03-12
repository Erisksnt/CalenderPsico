import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { AdminLoginSchema } from '@/lib/validators';
import { buildAuthCookie, createToken } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = AdminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const token = createToken({ userId: user.id, email: user.email });
  return NextResponse.json({ success: true }, { headers: { 'Set-Cookie': buildAuthCookie(token) } });
}
