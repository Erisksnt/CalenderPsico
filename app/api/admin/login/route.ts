import { NextResponse } from 'next/server';
import { AdminLoginSchema } from '@/lib/validators';
import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { verifyPassword, createToken, buildAuthCookie } from '@/lib/auth';
import { isDatabaseConnectionError, createDatabaseUnavailableResponse } from '@/lib/database';
import prisma from '@/lib/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = AdminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await ensureDefaultAdmin();

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { psychologist: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const passwordMatches = await verifyPassword(parsed.data.password, user.password_hash);
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
      role: 'ADMIN',
      psychologistId: user.psychologist?.id,
    });

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
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro no login do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}