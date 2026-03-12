#!/bin/bash

# Script de inicialização rápida do CalenderPsico

echo "🚀 CalenderPsico - Setup Rápido"
echo "================================"
echo ""

# 1. Criar .env.local
echo "📝 Criando arquivo .env.local..."
if [ -f ".env.local" ]; then
    echo "✓ .env.local já existe"
else
    cp .env.example .env.local
    echo "✓ .env.local criado"
fi

echo "⚠️  IMPORTANTE: Edite .env.local com suas credenciais de Supabase"
echo ""

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm install
echo "✓ Dependências instaladas"
echo ""

# 3. Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate
echo "✓ Prisma Client gerado"
echo ""

# 4. Rodar migrações
echo "🗄️  Rodando migrações do banco..."
echo "Confirme que o DATABASE_URL está configurado antes de continuar"
read -p "Pressione ENTER para continuar..."

npx prisma migrate dev --name init
echo "✓ Migrações completadas"
echo ""

# 5. Iniciar servidor
echo "✅ Setup completado!"
echo ""
echo "🎯 Próximos passos:"
echo "1. Edite .env.local com suas credenciais de Supabase"
echo "2. Execute: npm run dev"
echo "3. Abra http://localhost:3000"
echo ""
echo "👨‍💻 Teste com:"
echo "   Email: psico@test.com | Senha: senha123 (Psicólogo)"
echo "   Email: paciente@test.com | Senha: senha123 (Paciente)"
