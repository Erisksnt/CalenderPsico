import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { hashPassword } from '@/lib/password';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: 'ADMIN_EMAIL e ADMIN_PASSWORD obrigatórios' },
      { status: 500 }
    );
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (existing) {
      return NextResponse.json({ success: true, message: 'Seed já existente' });
    }

    const user = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password_hash: hashPassword(ADMIN_PASSWORD),
      },
    });

    await prisma.profile.create({
      data: {
        user_id: user.id,
        full_name: 'Dra. Thais SNT',
        professional_bio:
          'Atendimento clínico com foco em acolhimento, governança emocional e desenvolvimento sustentável do paciente.',
        work_method:
          'Abordagem centrada na escuta ativa, mapeamento de metas terapêuticas e revisão contínua do progresso.',
        specialties: ['Ansiedade', 'Depressão'],
      },
    });

    return NextResponse.json({ success: true, message: 'Seed criado com sucesso' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
