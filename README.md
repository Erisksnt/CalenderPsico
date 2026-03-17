# CalenderPsico

Sistema simples de portfólio + agenda pública para um único psicólogo.

## Requisitos
- Node.js 18+
- PostgreSQL

## Configuração local
1. Copie `.env.example` para `.env` e configure:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
2. Gere client prisma:
   ```bash
   npm run prisma:generate
   ```
3. Aplique schema no banco:
   ```bash
   npm run db:push
   ```
4. Rode a aplicação:
   ```bash
   npm run dev
   ```

## Perfis e disponibilidade
- As informações do psicólogo (nome, foto, bio, método e especialidades) são salvas via:
  - `GET/PUT /api/admin/profile`
  - `GET/PUT /api/psychologists/profile`
- A disponibilidade é salva via:
  - `GET/PUT /api/admin/availability`
  - `GET/POST /api/psychologists/time-blocks`

## Endpoints principais
### Públicos
- `GET /api/public/profile`
- `GET /api/public/slots?date=YYYY-MM-DD`
- `POST /api/public/appointments`

### Admin
- `POST /api/admin/register`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `POST /api/admin/forgot-password`
- `POST /api/admin/reset-password`
- `GET/PUT /api/admin/profile`
- `GET/PUT /api/admin/availability`
- `GET /api/admin/appointments`
- `PATCH /api/admin/appointments/:id`
