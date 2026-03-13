import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { AdminRegisterSchema } from '@/lib/validators';
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = AdminRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      );
    }

    const password_hash = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password_hash,
      },
      select: {
        id: true,
        email: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      { success: true, user },
      { status: 201 }
    );

  } catch (error) {
    console.error('REGISTER ERROR:', error);

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}