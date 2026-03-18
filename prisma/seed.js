const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'thais_snt@psicologia.com.br').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'T34mo%1104';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password_hash: passwordHash, role: 'ADMIN' },
    create: {
      email: ADMIN_EMAIL,
      password_hash: passwordHash,
      role: 'ADMIN',
    },
  });

  await prisma.profile.upsert({
    where: { user_id: user.id },
    update: {},
    create: {
      user_id: user.id,
      full_name: 'Thaís Santos',
      professional_bio: 'Psicóloga clínica com foco em acolhimento, organização terapêutica e evolução contínua.',
      work_method: 'Escuta ativa, acolhimento humanizado e sessões estruturadas de 50 minutos.',
      specialties: ['Ansiedade', 'Depressão', 'Autoconhecimento'],
    },
  });

  await prisma.psychologist.upsert({
    where: { user_id: user.id },
    update: {},
    create: { user_id: user.id },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
