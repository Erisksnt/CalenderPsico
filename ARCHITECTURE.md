# Arquitetura do sistema

## Stack
- Next.js (App Router) para frontend e backend (Route Handlers).
- PostgreSQL + Prisma ORM.
- Deploy alvo: Vercel (app) + Supabase (Postgres).

## Módulos
- **Página pública** (`/`): perfil do psicólogo e CTA para agendamento.
- **Agendamento público** (`/agendar`): seleção de data/horário + formulário sem login.
- **Admin** (`/admin`): login exclusivo do psicólogo, edição de perfil, disponibilidade e consultas.

## Segurança
- Autenticação admin com cookie HttpOnly assinado por JWT.
- Rotas administrativas validam sessão.
- Validação com Zod em payloads de API.
- Prevenção de double booking:
  - verificação de slot livre antes de criar consulta;
  - índice único em `appointments(data, hora)`.

## Fluxo de agendamento
1. Paciente abre `/agendar`.
2. Front consulta `GET /api/public/slots?date=YYYY-MM-DD`.
3. Seleciona slot e envia `POST /api/public/appointments`.
4. API valida dados, valida slot livre e cria consulta com `status=pending`.
5. Admin visualiza em `/admin` e atualiza status para `confirmed` ou `cancelled`.

## Registro/Login/Recuperação
- `POST /api/admin/register`: cria conta do psicólogo com validações e hash de senha.
- `POST /api/admin/login`: autentica e emite cookie HttpOnly.
- `POST /api/admin/forgot-password`: gera token de reset com 1h de validade e gera link de redefinição.
- `POST /api/admin/reset-password`: valida token e troca senha com novo hash.
=======

