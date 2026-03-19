const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 🔥 VERIFICAR SE AS VARIÁVEIS EXISTEM
if (!process.env.ADMIN_EMAIL) {
  console.error('❌ ERRO: ADMIN_EMAIL não definido no .env');
  process.exit(1);
}

if (!process.env.ADMIN_PASSWORD) {
  console.error('❌ ERRO: ADMIN_PASSWORD não definido no .env');
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL.trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  console.log('🌱 Criando admin padrão...');
  
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

  console.log('✅ Admin criado com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('❌ Erro no seed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });