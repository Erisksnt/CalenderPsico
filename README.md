# CalenderPsico - Sistema de Agendamento para Psicólogos

Um micro SaaS completo para agendamento online de consultas psicológicas.

## 🚀 Stack Técnico

- **Frontend**: Next.js 14+ (App Router)
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL + Prisma
- **Autenticação**: Supabase Auth
- **Deploy**: Vercel + Supabase

## 📋 Requisitos

- Node.js 18+
- PostgreSQL
- Conta Supabase
- Conta Vercel (para deploy)

## 🏗️ Estrutura do Projeto

```
CalenderPsico/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (patient)/
│   │   ├── schedule/page.tsx
│   │   └── layout.tsx
│   ├── (psychologist)/
│   │   ├── dashboard/page.tsx
│   │   ├── availability/page.tsx
│   │   ├── appointments/page.tsx
│   │   └── layout.tsx
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   └── logout/route.ts
│       ├── availability/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── appointments/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── psychologists/
│           └── route.ts
├── components/
│   ├── shared/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── patient/
│   │   ├── AvailabilityList.tsx
│   │   ├── BookingForm.tsx
│   │   └── ConfirmationModal.tsx
│   └── psychologist/
│       ├── Calendar.tsx
│       ├── AvailabilityManager.tsx
│       ├── AppointmentList.tsx
│       └── BlockTimeModal.tsx
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── database.ts
│   ├── validators.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── types/
│   └── index.ts
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

## 🚀 Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local

# 3. Rodar migrações do banco
npx prisma migrate dev

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

## 📚 Documentação

- [Setup Inicial](./SETUP.md)
- [Arquitetura](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Deploy](./DEPLOY.md)

## 👥 Usuários de Teste

- **Psicólogo**: psico@test.com / senha123
- **Paciente**: paciente@test.com / senha123

## 📝 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/logout` - Fazer logout

### Disponibilidade
- `GET /api/availability?psychologist_id=xxx` - Listar horários disponíveis
- `POST /api/availability` - Criar novo horário
- `PUT /api/availability/[id]` - Atualizar horário
- `DELETE /api/availability/[id]` - Deletar horário

### Agendamentos
- `GET /api/appointments` - Listar agendamentos (filtrado por usuário)
- `POST /api/appointments` - Criar novo agendamento
- `PUT /api/appointments/[id]` - Atualizar status
- `DELETE /api/appointments/[id]` - Cancelar agendamento

## 🔐 Segurança

- ✅ Validação de dados com Zod
- ✅ Proteção de rotas (Middleware de autenticação)
- ✅ Prevenção de double booking
- ✅ CORS configurado
- ✅ Rate limiting nas APIs

## 🎯 Roadmap

- [x] MVP básico
- [ ] Integração de pagamento (Stripe)
- [ ] Notificações por email
- [ ] SMS reminders
- [ ] Vídeo chamadas (Twilio)
- [ ] Dashboard de análises
- [ ] Multi-profissional

---

**Desenvolvido com ❤️ para psicólogos**
