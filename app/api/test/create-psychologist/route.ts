// app/api/test/create-psychologist/route.ts
// Endpoint de teste para criar um psicólogo de exemplo

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'Endpoint disponível apenas em desenvolvimento' },
      { status: 403 }
    );
  }

  try {
    // Cria usuário no Supabase
    const authEmail = `psiclogo${Date.now()}@teste.com`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: 'Senha123!',
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    // Cria usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        auth_id: authData.user.id,
        email: authEmail,
        role: 'PSYCHOLOGIST',
      },
    });

    // Cria psicólogo
    const psychologist = await prisma.psychologist.create({
      data: {
        id: uuidv4(),
        user_id: user.id,
        name: 'Dr. João Silva - Teste',
        bio: 'Psicólogo com experiência em terapia cognitivo-comportamental.',
        registration_number: '06/123456',
        phone: '(11) 99999-9999',
        specialties: ['Ansiedade', 'Depressão', 'Relacionamentos'],
      },
    });

    // Cria um serviço para o psicólogo
    const service = await prisma.service.create({
      data: {
        id: uuidv4(),
        psychologist_id: psychologist.id,
        name: 'Sessão Individual',
        description: 'Sessão de terapia individual de 50 minutos',
        duration: 50,
        price: 10000, // 100.00 em centavos
        color: '#3B82F6',
      },
    });

    // Cria disponibilidades (segunda a sexta, 9h às 18h)
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    for (const day of days) {
      await prisma.availability.create({
        data: {
          id: uuidv4(),
          psychologist_id: psychologist.id,
          day_of_week: day as any,
          start_time: '09:00',
          end_time: '18:00',
          is_blocked: false,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: { id: user.id, email: authEmail, password: 'Senha123!' },
          psychologist,
          service,
          message: 'Psicólogo de teste criado com sucesso!',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao criar psicólogo de teste:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
