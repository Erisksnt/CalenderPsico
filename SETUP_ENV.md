# 🔑 Guia: Como Preencher o `.env.local` com Credenciais do Supabase

## 📝 Passo 1: Criar Projeto no Supabase

1. Acesse **https://supabase.com**
2. Clique em **"Sign Up"** (ou faça login se já tem conta)
3. Escolha uma organização ou crie uma "Personal" 
4. Clique em **"New Project"**
5. Preencha:
   - **Project Name**: `calenderpisco` (ou que preferir)
   - **Database Password**: Escolha uma **senha FORTE** (salve!)
   - **Region**: Selecione **South America - São Paulo** (mais próximo)
6. Aguarde criar (2-3 minutos)

---

## 🔐 Passo 2: Obter as Credenciais

### A. DATABASE_URL

1. No painel Supabase, vá para **Settings** (⚙️ engrenagem no canto inferior esquerdo)
2. Clique em **"Database"** no menu lateral
3. Procure por **"Connection string"**
4. Copie a string com a label **"URI"** (a que começa com `postgresql://`)
5. A string terá este formato:
   ```
   postgresql://postgres.XXXXXXXX:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```
6. **IMPORTANTE**: Mude a **porta de 5432 para 6543**:
   ```
   postgresql://postgres.XXXXXXXX:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
7. Cole no `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres.XXXXXXXX:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
   ```

### B. NEXT_PUBLIC_SUPABASE_URL e Chaves

1. No painel Supabase, vá para **Settings** (⚙️)
2. Clique em **"API"** no menu lateral
3. Copie **"Project URL"** (exemplo: `https://XXXXXXXX.supabase.co`)
4. Cole no `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
   ```

Agora copie as **chaves**:
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Copie a chave com label **"anon public"**
- **SUPABASE_SERVICE_ROLE_KEY**: Copie a chave com label **"service_role secret"** (⚠️ cuidado, é secreto!)

Cole no `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## ✅ Passo 3: Verificar Arquivo

Seu `.env.local` deverá ficar assim (**com SEUS dados**):

```env
DATABASE_URL="postgresql://postgres.bgndvsnyjbxqhicpswmb:sua_senha_aqui@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

NEXT_PUBLIC_SUPABASE_URL=https://bgndvsnyjbxqhicpswmb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

JWT_SECRET=seu-secret-key-muito-complexo-123!@#abc

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

---

## 🚀 Passo 4: Testar Conexão

Depois de preencher, rode:

```bash
# Sincronizar banco de dados
npx prisma db push

# Gerar cliente Prisma
npx prisma generate

# Iniciar servidor
npm run dev
```

Se tudo funcionar, você verá:
```
✓ Prisma schema validated
✓ Database accessible
✓ ready - started server on 0.0.0.0:3000
```

Acesse: **http://localhost:3000**

---

## ⚠️ Erros Comuns

### ❌ "Environment variable not found: DATABASE_URL"
- Verifique se preencheu o `.env.local` corretamente
- Verifique se o arquivo está na **raiz** do projeto (junto com `package.json`)
- Tente reiniciar o terminal

### ❌ "password authentication failed"
- Verifique se a **senha** está correta (a que você criou no Supabase)
- Verifique se copiou a string **completa** da connection string
- Se errou a senha, resete em: Settings → Database → Reset Password

### ❌ "Connection refused"
- Verifique se a **porta é 6543** (não 5432)
- Verifique se o **URL está correto** (sem espaços extras)
- Tente aguardar 1-2 minutos (às vezes Supabase demora para ativar)

---

## 📚 Mais Informações

- **Documentação Supabase**: https://supabase.com/docs
- **Documentação Prisma**: https://www.prisma.io/docs
- **Documentação Next.js**: https://nextjs.org/docs
