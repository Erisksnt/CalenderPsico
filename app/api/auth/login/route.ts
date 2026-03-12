// app/api/auth/login/route.ts
// Endpoint para fazer login

import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/lib/validators';
import { supabaseClient } from '@/lib/supabase';
import prisma from '@/lib/database';
import { generateJWT } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validação
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        {
          success: false,
          error: 'Erro de validação',
          data: { errors },
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Verifica credenciais com Supabase
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email ou senha incorretos',
        },
        { status: 401 }
      );
    }

    // Obtém dados do usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { auth_id: data.user.id },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não encontrado',
        },
        { status: 404 }
      );
    }

    // Gera JWT token
    const token = generateJWT(user.id, user.role);

    // Prepara dados do usuário para retorno
    let userData: any = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Se for psicólogo, inclui dados adicionais
    if (user.role === 'PSYCHOLOGIST') {
      const psychologist = await prisma.psychologist.findUnique({
        where: { user_id: user.id },
      });
      userData.psychologist = psychologist;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: userData,
          token,
          session: data.session,
        },
        message: 'Login realizado com sucesso!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
