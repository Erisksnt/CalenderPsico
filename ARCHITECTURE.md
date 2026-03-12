# ARCHITECTURE.md - Arquitetura do CalenderPsico

## 🏗️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Next.js)                     │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │  Pages/Routes    │  │   Components     │             │
│  │  ├─ /auth        │  │  ├─ Auth         │             │
│  │  ├─ /psycholog.  │  │  ├─ Patient      │             │
│  │  └─ /patient     │  │  └─ Psycholog.   │             │
│  └──────────────────┘  └──────────────────┘             │
│           │                     │                         │
│           └─────────────────────┘                         │
│                     │ HTTP                                │
└─────────────────────┼─────────────────────────────────────┘
                      │
┌─────────────────────┼─────────────────────────────────────┐
│        SERVIDOR (Next.js API Routes)                      │
│  ┌───────────────────────────────────────────────────┐   │
│  │         API Routes (/app/api)                     │   │
│  │  ├─ /auth (register, login, logout)              │   │
│  │  ├─ /availability (CRUD)                         │   │
│  │  ├─ /appointments (CRUD)                         │   │
│  │  ├─ /services (CRUD)                            │   │
│  │  └─ /psychologists (lista pública)              │   │
│  └───────────────────────────────────────────────────┘   │
│           │                                               │
│           │                                               │
│  ┌───────────────────────────────────────────────────┐   │
│  │    Business Logic (lib/)                          │   │
│  │  ├─ database.ts (queries Prisma)                 │   │
│  │  ├─ auth.ts (autenticação, JWT)                 │   │
│  │  ├─ validators.ts (validação Zod)               │   │
│  │  └─ utils.ts (funções úteis)                    │   │
│  └───────────────────────────────────────────────────┘   │
│           │                                               │
└───────────┼───────────────────────────────────────────────┘
            │
┌───────────┼───────────────────────────────────────────────┐
│         BANCO DE DADOS (PostgreSQL)                       │
│  ┌───────────────────────────────────────────────────┐   │
│  │       Tabelas (Prisma ORM)                        │   │
│  │  ├─ users (Supabase Auth)                        │   │
│  │  ├─ psychologists                                │   │
│  │  ├─ patients                                     │   │
│  │  ├─ services                                     │   │
│  │  ├─ appointments                                 │   │
│  │  ├─ availabilities                              │   │
│  │  └─ time_blocks                                 │   │
│  └───────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            SERVIÇOS EXTERNOS                             │
│  ├─ Supabase Auth (Autenticação)                        │
│  ├─ Vercel (Hosting)                                    │
│  └─ SendGrid/SMTP (Email)  [Opcional]                  │
└─────────────────────────────────────────────────────────┘
```

## 📊 Fluxos de Dados

### Fluxo 1: Registro de Psicólogo

```
1. Usuário preenche formulário de registro
   ↓
2. RegisterForm envia POST /api/auth/register
   ↓
3. API valida dados com Zod
   ↓
4. API cria usuário no Supabase Auth
   ↓
5. API cria registro em users (banco local)
   ↓
6. API cria registro em psychologists
   ↓
7. Retorna user + token para frontend
   ↓
8. Frontend armazena token no localStorage
   ↓
9. Redireciona para /psychologist/dashboard
```

### Fluxo 2: Agendamento por Paciente

```
1. Paciente seleciona psicólogo na página pública
   ↓
2. BookingForm carrega serviços via GET /api/services?psychologist_id=xxx
   ↓
3. Paciente preenche dados e clica "Agendar"
   ↓
4. BookingForm envia POST /api/appointments
   ↓
5. API valida dados com Zod
   ↓
6. API verifica conflito de agendamento
   ↓
7. API cria/obtém registro de patient
   ↓
8. API cria appointment com status SCHEDULED
   ↓
9. API gera token de confirmação por email
   ↓
10. API envia email para paciente [Opcional]
   ↓
11. Frontend mostra mensagem de sucesso
```

### Fluxo 3: Atualizar Agendamento por Psicólogo

```
1. Psicólogo acessa dashboard e vê agendamentos
   ↓
2. Dashboard faz GET /api/appointments com token
   ↓
3. API verifica autenticação e role
   ↓
4. API retorna agendamentos do psicólogo
   ↓
5. Psicólogo muda status para COMPLETED
   ↓
6. Dashboard envia PUT /api/appointments/:id
   ↓
7. API atualiza status
   ↓
8. API cria log de auditoria
   ↓
9. Frontend atualiza lista de agendamentos
```

## 🔐 Camadas de Segurança

### 1. Autenticação
- **Supabase Auth**: Gerencia login/registro de forma segura
- **JWT Tokens**: Tokens assinados para acesso à API
- **Token Refresh**: Tokens expiram em 7 dias

### 2. Autorização
- **Role-based Access**: PSYCHOLOGIST vs PATIENT
- **Resource Ownership**: Usuário só vê seus próprios dados
- **RLS (Row Level Security)**: Proteção no nível do banco

### 3. Validação
- **Zod Schemas**: Validação de entrada em todos os endpoints
- **Type Safety**: TypeScript garante tipos corretos
- **CORS**: Apenas domínios autorizados

### 4. Prevenção de Double Booking
- Checagem de conflito antes de criar appointment
- Unique constraint na tabela de appointments
- Transações no banco para integridade

## 📦 Stack Tecnológico

| Camada          | Tecnologia          | Função                              |
|-----------------|---------------------|------------------------------------|
| **Frontend**    | Next.js 14          | Framework React com SSR            |
|                 | React 18            | Componentes UI                     |
|                 | TypeScript          | Type safety                        |
|                 | Tailwind CSS        | Estilos CSS                        |
|                 | Zod                 | Validação de dados                 |
| **Backend**     | Next.js API Routes  | Serverless backend                 |
|                 | Prisma              | ORM para PostgreSQL                |
|                 | Node.js             | Runtime JavaScript                |
| **Database**    | PostgreSQL          | Banco relacional                   |
|                 | Supabase            | Hosted PostgreSQL + Auth           |
| **Auth**        | Supabase Auth       | Gerenciamento de usuários          |
|                 | JWT                 | Token-based auth                   |
| **Deploy**      | Vercel              | Hosting serverless                 |
|                 | GitHub              | Versionamento e CI/CD              |

## 🔄 Padrões de Design Utilizados

### 1. **MVC (Model-View-Controller)**
- **Model**: Prisma types
- **View**: Componentes React
- **Controller**: API Routes

### 2. **Repository Pattern**
```typescript
// lib/database.ts
export async function getAppointmentsForPsychologist(...) {
  // Abstrai complexidade de queries
}
```

### 3. **Service Layer**
```typescript
// lib/auth.ts
export async function requireAuth(req, res) {
  // Middleware de autenticação
}
```

### 4. **Middleware Pattern**
```typescript
// Usado em API routes para validar requests
export async function POST(req: NextRequest) {
  // Validar
  // Autorizar
  // Executar
  // Responder
}
```

## 🚀 Performance Considerations

### Frontend
- **Code Splitting**: Carregamento lazy de componentes
- **Image Optimization**: Next.js Image component
- **CSS**: Tailwind com CSS puro (sem runtime)

### Backend
- **Database Indexing**: Índices em campos frequentes
- **Query Optimization**: Eager loading com include()
- **Caching**: localStorage no cliente para tokens

### Network
- **API Routes**: Zero cold start na Vercel
- **Compression**: GZIP automático
- **CDN**: Vercel distribui assets globalmente

## 📈 Escalabilidade

### Horizontal Scaling
- Vercel escala automaticamente
- PostgreSQL gerenciado pelo Supabase
- Sem estado no servidor (stateless)

### Vertical Scaling
- Aumentar recursos do PostgreSQL
- Aumentar workers da Vercel

### Futuras Otimizações
- Redis para cache
- Message Queue (Bull/RabbitMQ) para emails
- GraphQL para queries mais eficientes

## 🔍 Monitoramento

### Logs
- Vercel Logs: Automáticos
- Database Logs: Supabase
- Custom Logs: Sentry (opcional)

### Metrics
- Vercel Analytics
- Web Vitals
- Custom KPIs

## 📝 Versionamento de API

Actualmente em v1 implícito. Para futuras versões:

```typescript
// app/api/v1/appointments/route.ts
// app/api/v2/appointments/route.ts
```

## 🔧 Configuração de Desenvolvimento Local vs Produção

```env
# Local (.env.local)
DATABASE_URL=postgresql://localhost/calenderpisco
JWT_SECRET=local-secret-não-seguro
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Produção (.env.production)
DATABASE_URL=postgresql://supabase-hosted
JWT_SECRET=secret-aleatório-seguro
NEXT_PUBLIC_APP_URL=https://calenderpisco.com
```

## 📚 Referências Adicionais

- [12 Factor App](https://12factor.net/)
- [REST API Best Practices](https://restfulapi.net/)
- [OWASP Security](https://owasp.org/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
