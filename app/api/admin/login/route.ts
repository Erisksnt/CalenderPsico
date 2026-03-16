import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { AdminLoginSchema } from '@/lib/validators';
import { buildAuthCookie, createToken } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';

const LEGACY_EMAIL = 'psico@teste.com';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = AdminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && normalizedEmail !== adminEmail) {
    return NextResponse.json(
      { error: 'Credenciais inválidas' },
      { status: 401 }
    );
  }

  await prisma.user.deleteMany({ where: { email: LEGACY_EMAIL } });

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.password_hash) {
    return NextResponse.json(
      { error: 'Administrador não cadastrado' },
      { status: 500 }
    );
  }

  if (!verifyPassword(password, user.password_hash)) {
    return NextResponse.json(
      { error: 'Credenciais inválidas' },
      { status: 401 }
    );
  }

  const token = createToken({
    userId: user.id,
    email: user.email,
    role: 'PSYCHOLOGIST',
  });

  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': buildAuthCookie(token),
        'Cache-Control': 'no-store',
      },
    }
  );
}
