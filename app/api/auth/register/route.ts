// app/api/auth/register/route.ts
// Endpoint para registrar novo usuário

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { RegisterSchema } from '@/lib/validators';
import { supabaseAdmin } from '@/lib/supabase';
import prisma from '@/lib/database';
import { sendSuccess, sendError, sendValidationError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validação
    const validation = RegisterSchema.safeParse(body);
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

    const { email, password, role, name, phone, registration_number } = validation.data;

    // Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email já cadastrado',
        },
        { status: 409 }
      );
    }

    // Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao criar conta: ' + authError.message,
        },
        { status: 400 }
      );
    }

    // Cria registro do usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        auth_id: authData.user.id,
        email,
        role,
      },
    });

    // Se for psicólogo, cria registro adicional
    if (role === 'PSYCHOLOGIST') {
      if (!registration_number) {
        return NextResponse.json(
          {
            success: false,
            error: 'Número de registro (CRP) é obrigatório para psicólogos',
          },
          { status: 400 }
        );
      }

      // Verifica se o CRP já existe
      const existingCRP = await prisma.psychologist.findUnique({
        where: { registration_number },
      });

      if (existingCRP) {
        // Deleta o usuário criado se o CRP for duplicado
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        await prisma.user.delete({ where: { id: user.id } });

        return NextResponse.json(
          {
            success: false,
            error: 'Número de registro (CRP) já cadastrado',
          },
          { status: 409 }
        );
      }

      await prisma.psychologist.create({
        data: {
          user_id: user.id,
          name,
          registration_number,
          phone: phone || undefined,
        },
      });

      // Cria um serviço padrão "Terapia" para o psicólogo
      const psychologist = await prisma.psychologist.findUnique({
        where: { user_id: user.id },
      });

      if (psychologist) {
        await prisma.service.create({
          data: {
            id: uuidv4(),
            psychologist_id: psychologist.id,
            name: 'Terapia Individual',
            description: 'Sessão de terapia individual de 50 minutos',
            duration: 50,
            price: 10000, // 100.00 reais em centavos
            color: '#3B82F6',
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
        message: 'Conta criada com sucesso!',
      },
      { status: 201 }
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('❌ ERRO ao registrar usuário:');
    console.error('Mensagem:', errorMessage);
    console.error('Stack:', errorStack);
    console.error('Objeto completo:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        debug: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          stack: errorStack,
        } : undefined,
      },
      { status: 500 }
    );
  }
}
