# DEPLOY.md - Guia de Deploy para Produção

## 🚀 Deploy na Vercel

### Pré-requisitos

- Conta Vercel (https://vercel.com)
- GitHub repositório configurado
- Projeto Supabase configurado para produção

### Passo a Passo

#### 1. Preparar repositório Git

```bash
# Inicializar git (se não tiver)
git init

# Adicionar arquivos
git add .
git commit -m "Initial commit: CalenderPsico MVP"

# Criar repositório no GitHub
# E fazer push
git push -u origin main
```

#### 2. Conectar Vercel ao GitHub

1. Acesse https://vercel.com/dashboard
2. Clique em "New Project"
3. Selecione seu repositório GitHub
4. Clique em "Import"

#### 3. Configurar Variáveis de Ambiente

Na dashboard do Vercel, vá para **Settings → Environment Variables** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=sua-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
DATABASE_URL=sua-database-url
JWT_SECRET=seu-secret-aleatorio
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

#### 4. Configurar Build

Na seção **Settings → Build & Development**:

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### 5. Deploy

Vercel fará deploy automaticamente a cada push no branch `main`.

Para fazer deploy agora:

```bash
git push origin main
```

## 🗄️ Configurar Supabase para Produção

### 1. Criar Projeto Supabase

Vá para https://supabase.com

1. Clique em "New Project"
2. Preencha as informações
3. Aguarde o projeto ser criado

### 2. Obter Credenciais

Em **Project Settings → API**:

- Copiar `URL`
- Copiar `anon public` key
- Copiar `service_role` key (manter seguro!)

### 3. Executar Migrações no Banco Produção

```bash
# Com a DATABASE_URL do Supabase
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 4. Configurar Autenticação

Em **Authentication → Providers**:

1. Email/Password: Habilitar
2. OAuth (opcional):
   - Google
   - GitHub

### 5. Configurar RLS (Row Level Security)

Para segurança, adicione RLS às tabelas. Em **SQL Editor**, execute:

```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychologists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (auth.uid() = auth_id);
```

## 📧 Configurar Emails (SendGrid/NodeMailer)

### Opção 1: Supabase SMTP

1. Vá para **Email Templates** no Supabase
2. Configure os templates de confirmação

### Opção 2: SendGrid

```typescript
// lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendConfirmationEmail(email: string, token: string) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirm/${token}`;
  
  await sgMail.send({
    to: email,
    from: 'noreply@calenderpisco.com',
    subject: 'Confirme seu agendamento',
    html: `
      <p>Obrigado por agendar uma consulta!</p>
      <a href="${confirmUrl}">Confirmar agendamento</a>
    `,
  });
}
```

## 🔒 Checklist de Segurança para Produção

- [ ] JWT_SECRET alterado para um valor aleatório seguro
- [ ] CORS configurado corretamente
- [ ] RLS habilitado no Supabase
- [ ] Variáveis sensitivas em Environment Variables
- [ ] HTTPS ativado
- [ ] Rate limiting configurado
- [ ] Backup do banco agendado
- [ ] Logs configurados
- [ ] Sentry integrado (opcional)

## 📊 Monitoramento em Produção

### Usar Sentry para Error Tracking

```bash
npm install @sentry/nextjs
```

```bash
# Em app/layout.tsx
import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}
```

### Usar Vercel Analytics

Analytics já está configurado na Vercel. Acesse **Analytics** na dashboard.

## 🔄 CI/CD Pipeline

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run type-check
```

## 🎯 Próximos Passos

1. **Integração de Pagamento**: Stripe/PagSeguro
2. **Notificações**: Email e SMS
3. **Análises**: Dashboard de métricas
4. **Chat/Suporte**: Sistema de mensagens
5. **Vídeo Chamadas**: Twilio/Jitsi

## 📞 Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Production Guide](https://supabase.com/docs/guides/production)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
