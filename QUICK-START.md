# 🚀 Quick Start - Guia Rápido

Siga este guia para colocar o projeto funcionando em **5-10 minutos**.

---

## 📋 Pré-requisitos

Certifique-se que você tem instalado:

- **Node.js 18+** - [Download aqui](https://nodejs.org/)
- **npm** ou **yarn** (vem com Node.js)
- **Git** (opcional, para versionamento)
- Conta no **Supabase** - [cadastro grátis](https://supabase.com)

**Verificar versão instalada:**
```bash
node --version
npm --version
```

---

## 🔧 Passo 1: Configurar Supabase (Banco de Dados)

### 1.1 Criar Projeto
1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **"New Project"**
3. Escolha uma organização ou crie uma nova
4. Configure:
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
5. Aguarde criar (2-3 minutos)

### 1.2 Pegar as Credenciais

No painel do Supabase:

1. Clique em **Settings** (engrenagem) no canto inferior esquerdo
2. Vá para **API**
3. Copie:
   - **Project URL** → `https://mylvcaviceelxhylnezz.supabase.co`
   - **anon public** → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbmR2c255amJ4cWhpY3Bzd21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzM5MzksImV4cCI6MjA4ODgwOTkzOX0.51bo36_seVY9YzM1mqpWzdbPgXKWQ4ddIJJzKXkuTw8`
   - **service_role secret** → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbmR2c255amJ4cWhpY3Bzd21iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIzMzkzOSwiZXhwIjoyMDg4ODA5OTM5fQ._Wz1ra1DNjFdEmyrge5mZQnq6RX7K8SRJI-BMLBoYtY`

### 1.3 Criar Tabelas

1. No Supabase, vá para **SQL Editor**
2. Clique em **"New Query"**
3. Copie todo o conteúdo de `prisma/migrations/001_init/migration.sql`
4. Cole na query
5. Clique em **"Run"** (Ctrl+Enter)
6. Espere concluir ✅

---

## 💻 Passo 2: Configurar Projeto Localmente

### 2.1 Navegar até a Pasta
```bash
cd "C:\Users\[seu-usuario]\Documents\Code\CalenderPsico"
```

### 2.2 Instalar Dependências
```bash
npm install
```

Vai levar 2-3 minutos...

### 2.3 Criar Arquivo de Ambiente

1. Copie `.env.example` para `.env.local`
   ```bash
   copy .env.example .env.local
   ```

2. Abra `.env.local` e preencha com as credenciais do Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=seu_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_aqui
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_secreta_aqui
   
   JWT_SECRET=qualquer_string_secreta_aqui_123!@#
   ```

### 2.4 Gerar Prisma Client
```bash
npx prisma generate
```

---

## 🏃 Passo 3: Rodar o Projeto

### Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Você verá:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

✅ Pronto! Acesse http://localhost:3000

---

## 🧪 Passo 4: Testar o Projeto

### Criar Primeira Conta (Psicólogo)

1. Acesse http://localhost:3000
2. Clique em **"Entrar"** no canto superior direito
3. Clique em **"Cadastre-se agora"**
4. Selecione **"Psicólogo"**
5. Preencha:
   - **Email**: `psico@teste.com`
   - **Senha**: `Senha123!`
   - **Telefone**: `(11) 99999-9999`
   - **CRP**: `06/123456`
   - **Nome**: `Dr. João Silva`
6. Clique em **"Cadastrar"**

### Fazer Login como Psicólogo

1. Clique em **"Entrar"**
2. Digite as credenciais
3. Clique em **"Login"**
4. Você será redirecionado para o **Dashboard** ✅

### Criar Serviço (Atendimento)

1. No menu lateral, clique em **"Serviços"**
2. Preencha:
   - **Nome**: `Consulta Psicológica`
   - **Descrição**: `Atendimento individual de 1h`
   - **Duração (minutos)**: `60`
   - **Preço (R$)**: `150.00`
3. Clique em **"Criar Serviço"**
4. Serviço aparece na lista ✅

### Adicionar Disponibilidade (Horário)

1. No menu, clique em **"Disponibilidade"**
2. Para cada dia disponível:
   - **Dia da Semana**: Segunda, Terça, etc.
   - **Hora Início**: `09:00`
   - **Hora Fim**: `17:00`
3. Clique em **"Adicionar"**
4. Horários aparecem na lista ✅

### Testar como Paciente

1. Abra uma **aba privada/anônima** do navegador
2. Acesse http://localhost:3000
3. Clique em **"Agendar Consulta"**
4. Você vê o psicólogo criado e seus serviços
5. Clique em **"Marcar Horário"**
6. Preencha os dados pessoais
7. Escolha a data e hora disponível
8. Clique em **"Agendar"** ✅

### Verificar Agendamento como Psicólogo

1. Volte na aba do psicólogo
2. Clique em **"Agendamentos"** no menu
3. Você verá o agendamento que o paciente fez ✅

---

## 🆘 Troubleshooting Rápido

### ❌ Erro: "Cannot find module 'prisma'"
```bash
npm install
npx prisma generate
```

### ❌ Erro: "SUPABASE_SERVICE_ROLE_KEY is missing"
- Verifique se preencheu `.env.local` corretamente
- Certifique-se que está usando a **service_role key** (não a anon key)

### ❌ Aplicação não inicia (porta 3000 em uso)
```bash
# Windows - encontrar e matar processo
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Ou simplesmente mudar porta
npm run dev -- -p 3001
```

### ❌ Erro ao conectar no Supabase
- Verifique se as URLs estão **corretas** (sem espaços extras)
- Certifique-se que criou as tabelas (rodou a migration)
- Verifique se está usando `anon key` para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### ❌ Erro: "Unauthorized" ao tentar logar
- Verifique se a migration rodou corretamente no Supabase
- Tente fazer logout e limpar cookies do navegador

---

## 📱 Testar em Outro Dispositivo

Para acessar de outro computador na mesma rede:

1. Descubra seu IP local:
   ```bash
   ipconfig
   # Procure por "IPv4 Address:" (ex: 192.168.1.100)
   ```

2. No outro dispositivo, acesse:
   ```
   http://192.168.1.100:3000
   ```

---

## 🎉 Parabéns!

Seu projeto está funcionando! Agora você pode:

✅ Criar múltiplos psicólogos e pacientes
✅ Testar agendamentos
✅ Verificar proteção contra double-booking
✅ Explorar o dashboard de estatísticas
✅ Conferir a API em http://localhost:3000/api/

---

## 📚 Próximos Passos

- **Ler** [ARCHITECTURE.md](./ARCHITECTURE.md) para entender a arquitetura
- **Consultar** [API.md](./API.md) para detalhes técnicos dos endpoints
- **Deploy** em produção seguindo [DEPLOY.md](./DEPLOY.md)
- **Adicionar** novas funcionalidades (emails, pagamentos, etc)

---

## 🆘 Precisa de Ajuda?

1. Verifique [SETUP.md](./SETUP.md) para instruções mais detalhadas
2. Veja a seção de "Common Issues" em [SETUP.md](./SETUP.md)
3. Consulte logs no terminal do `npm run dev`
4. Verifique o console do navegador (F12 → Console)

---

**Boa sorte e divirta-se desenvolvendo! 🚀**
