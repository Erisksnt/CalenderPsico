import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { hashPassword } from '@/lib/password';

export async function POST() {
  try {
    const existing = await prisma.user.findUnique({ where: { email: 'psicologo@teste.com' } });

    if (existing) {
      return NextResponse.json({ success: true, message: 'Seed já existente' });
    }

    const user = await prisma.user.create({
      data: {
        email: 'psicologo@teste.com',
        password_hash: hashPassword('senha12345'),
      },
    });

    await prisma.profile.create({
      data: {
        user_id: user.id,
        full_name: 'Dra. Psicóloga',
        professional_bio: 'Atendimento clínico com foco em saúde emocional e desenvolvimento pessoal.',
        work_method: 'Abordagem baseada em escuta ativa, plano terapêutico individual e acompanhamento contínuo.',
        specialties: ['Ansiedade', 'Depressão'],
      },
    });

    return NextResponse.json({ success: true, message: 'Seed criado com sucesso' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
