# SETUP.md - Guia de Configuração Inicial do CalenderPsico

## 📋 Pré-requisitos

- Node.js 18.0.0 ou superior
- npm ou yarn
- PostgreSQL 12 ou superior
- Conta Supabase (gratuita em https://supabase.com)

## 🚀 Instalação e Configuração Local

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-user/calenderpisco.git
cd calenderpisco
```

### 2. Instalar dependências

```bash
npm install
# ou
yarn install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus dados:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/calenderpisco?schema=public

# JWT
JWT_SECRET=seu-secret-super-secreto-alterado-em-producao

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Supabase

#### No console do Supabase:

1. Criar novo projeto
2. Copiar `NEXT_PUBLIC_SUPABASE_URL` e chaves
3. Ir para SQL Editor e executar:

```sql
-- Conectar o PostgreSQL externo (opcional)
-- Ou usar o PostgreSQL gerenciado do Supabase
```

### 5. Configurar Banco de Dados

```bash
# Instalar Prisma CLI globalmente (opcional)
npm install -g @prisma/cli

# Executar migrações
npx prisma migrate dev --name init

# Gerar Prisma Client
npx prisma generate

# Visualizar dados (Prisma Studio)
npx prisma studio
```

### 6. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000

## 🧪 Testando a Aplicação

### Criar conta de psicólogo

1. Acesse http://localhost:3000/auth/register
2. Selecione "Psicólogo"
3. Preencha com:
   - Nome: Seu Nome
   - Email: psico@test.com
   - Senha: senha123
   - CRP: 06/123456

### Criar conta de paciente

1. Acesse http://localhost:3000/auth/register
2. Selecione "Paciente"
3. Preencha com:
   - Nome: Seu Nome
   - Email: paciente@test.com
   - Senha: senha123

### Testar fluxo completo

1. Login como psicólogo
2. Ir para "Disponibilidades" e adicionar horários
3. Ir para "Serviços" e criar um serviço
4. Logout
5. Login como paciente
6. Agendar uma consulta

## 📚 Estrutura de Pastas

```
CalenderPsico/
├── app/
│   ├── api/              # API Routes
│   ├── (auth)/           # Páginas de autenticação
│   ├── (psychologist)/   # Páginas do psicólogo
│   ├── (patient)/        # Páginas do paciente
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── shared/           # Componentes reutilizáveis
│   ├── auth/             # Componentes de auth
│   ├── patient/          # Componentes para pacientes
│   └── psychologist/     # Componentes para psicólogos
├── lib/
│   ├── supabase.ts       # Configuração Supabase
│   ├── database.ts       # Funções de banco
│   ├── auth.ts           # Autenticação e JWT
│   ├── validators.ts     # Validação Zod
│   ├── utils.ts          # Funções utilitárias
│   └── api-response.ts   # Helpers de resposta
├── prisma/
│   ├── schema.prisma     # Schema do banco
│   └── migrations/       # Histórico de migrações
├── types/
│   └── index.ts          # Tipos TypeScript
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor local

# Build
npm run build           # Cria build para produção
npm start              # Inicia servidor de produção

# Banco de dados
npx prisma migrate dev # Cria nova migração
npx prisma studio     # Abre visual explorer do banco
npx prisma generate   # Regenera Prisma Client

# Qualidade
npm run lint           # Executa ESLint
npm run type-check    # Verifica tipos TypeScript
npm test              # Executa testes
```

## 🐛 Troubleshooting

### Erro de conexão com banco de dados

```bash
# Verificar DATABASE_URL em .env.local
# Testar conexão
psql $DATABASE_URL
```

### Erro com Prisma Client

```bash
# Regenerar Prisma Client
rm -rf node_modules/.prisma
npx prisma generate
```

### Porta 3000 já em uso

```bash
# Usar porta diferente
npm run dev -- -p 3001
```

## 📖 Documentação Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zod Validation](https://zod.dev/)

## ❓ Suporte

Se encontrar problemas:

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Limpe o cache: `rm -rf .next node_modules`
3. Reinstale dependências: `npm install`
4. Reinicie o servidor de desenvolvimento
