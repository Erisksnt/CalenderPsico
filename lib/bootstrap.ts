import prisma from './database';
import { hashPassword, verifyPassword } from './password';

export const DEFAULT_ADMIN_EMAIL = 'thais_snt@psicologia.com.br';
export const DEFAULT_ADMIN_PASSWORD = 'T34mo%1104';

const DEFAULT_PROFILE = {
  full_name: 'Thaís Santos',
  professional_bio:
    'Psicóloga clínica com foco em escuta acolhedora, planejamento terapêutico e acompanhamento contínuo.',
  work_method:
    'Atendimento humanizado, com objetivos claros, acompanhamento estruturado e sessões de 50 minutos.',
  specialties: ['Ansiedade', 'Depressão', 'Relacionamentos'],
  photo_url: null as string | null,
};

export async function ensureDefaultAdmin() {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        password_hash: await hashPassword(password),
        role: 'ADMIN',
      },
    });
  } else {
    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches || user.role !== 'ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          password_hash: await hashPassword(password),
          role: 'ADMIN',
        },
      });
    }
  }

  await prisma.profile.upsert({
    where: { user_id: user.id },
    update: {},
    create: {
      user_id: user.id,
      ...DEFAULT_PROFILE,
    },
  });

  const psychologist = await prisma.psychologist.upsert({
    where: { user_id: user.id },
    update: {},
    create: { user_id: user.id },
  });

  return { user, psychologist };
}

// ✅ VERSÃO OTIMIZADA - sem ensureDefaultAdmin e com select
export async function getPrimaryPsychologist() {
  // 🔥 REMOVIDO: await ensureDefaultAdmin();

  return prisma.psychologist.findFirst({
    orderBy: { created_at: 'asc' },
    select: {  // ⚡ Select otimizado
      id: true,
      user_id: true,
      name: true,
      bio: true,
      registration_number: true,
      phone: true,
      specialties: true,
      user: {
        select: {
          profile: {
            select: {
              id: true,
              full_name: true,
              professional_bio: true,
              work_method: true,
              specialties: true,
              photo_url: true,
            }
          }
        }
      }
    }
  });
}