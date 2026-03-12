// app/api/seed/route.ts
// Endpoint para seeding de dados de teste

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { hash } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    // Verifica se já existe um psicólogo
    const existingPsych =  await prisma.psychologist.findFirst();
    const existingService = await prisma.service.findFirst();

    if (existingPsych && existingService) {
      return NextResponse.json(
        {
          success: true,
          message: 'Dados de teste já existem',
        },
        { status: 200 }
      );
    }

    // Cria usuário psicólogo se não existir
    let psychUser = await prisma.user.findUnique({
      where: { email: 'psicologo@teste.com' },
    });

    if (!psychUser) {
      const hashedPassword = await hash('senha123', 10);
      psychUser = await prisma.user.create({
        data: {
          email: 'psicologo@teste.com',
          password: hashedPassword,
          role: 'PSYCHOLOGIST',
          name: 'Dr. João Silva',
        },
      });
    }

    // Cria perfil do psicólogo se não existir
    let psychologist = await prisma.psychologist.findUnique({
      where: { user_id: psychUser.id },
    });

    if (!psychologist) {
      psychologist = await prisma.psychologist.create({
        data: {
          user_id: psychUser.id,
          name: 'Dr. João Silva',
          bio: 'Psicólogo especializado em terapia comportamental e cognitiva',
          specialties: ['Ansiedade', 'Depressão', 'Relacionamentos'],
          registration_number: '12345/SP',
          phone: '11987654321',
        },
      });
    }

    // Cria serviço "Terapia" padrão se não existir
    let therapyService = await prisma.service.findFirst({
      where: { name: 'Terapia' },
    });

    if (!therapyService) {
      therapyService = await prisma.service.create({
        data: {
          psychologist_id: psychologist.id,
          name: 'Terapia',
          description: 'Sessão de terapia individual',
          duration: 60,
          price: 150.0,
          color: '#3B82F6',
        },
      });
    }

    // Cria algumas disponibilidades padrão (seg-sex, 9-17h)
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    
    for (const day of daysOfWeek) {
      const existingAvailability = await prisma.availability.findFirst({
        where: {
          psychologist_id: psychologist.id,
          day_of_week: day as any,
        },
      });

      if (!existingAvailability) {
        await prisma.availability.create({
          data: {
            psychologist_id: psychologist.id,
            day_of_week: day as any,
            start_time: '09:00',
            end_time: '17:00',
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Dados de teste criados com sucesso',
        data: {
          psychologist: psychologist.name,
          service: therapyService.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao seeding:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar dados de teste',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
