# CalenderPsico

Sistema simples de portfólio + agenda pública para um único psicólogo.

## Requisitos
- Node.js 18+
- PostgreSQL

## Configuração local
1. Copie `.env.example` para `.env` e configure:
   - `DATABASE_URL`
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
## Seed inicial do admin
Você pode criar dados iniciais com:
```bash
curl -X POST http://localhost:3000/api/seed
```
=======
## Seed inicial do admin (manual)
Crie um usuário em `users` com senha SHA-256:
- email do psicólogo

## Endpoints
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
=======
- `POST /api/admin/login`
- `POST /api/admin/logout`

- `GET/PUT /api/admin/profile`
- `GET/PUT /api/admin/availability`
- `GET /api/admin/appointments`
- `PATCH /api/admin/appointments/:id`


## Autenticação do psicólogo
- Login: `/admin/login`
- Registro: `/admin/register`
- Recuperação: `/admin/forgot-password` → link para `/admin/reset-password?token=...`

Regras aplicadas:
- Email válido
- Senha mínima de 8 caracteres
- Email único no banco
- Senha armazenada com hash seguro (`scrypt` + salt)
- Token de reset com expiração de 1 hora
=======

