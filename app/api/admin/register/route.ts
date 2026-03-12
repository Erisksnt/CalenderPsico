import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { AdminRegisterSchema } from '@/lib/validators';
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = AdminRegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      password_hash: hashPassword(password),
    },
    select: { id: true, email: true, created_at: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
