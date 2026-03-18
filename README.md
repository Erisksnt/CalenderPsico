# CalenderPsico

Sistema simples de portfólio + agenda pública para um único psicólogo.

## Requisitos
- Node.js 18+
- PostgreSQL 16+
- Docker Desktop (opcional, recomendado para subir o banco local)

## Configuração local
1. Copie `.env.example` para `.env`.
2. Se você não tiver PostgreSQL rodando localmente, suba o banco com Docker:
   ```bash
   docker compose up -d postgres
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Gere o client Prisma:
   ```bash
   npm run prisma:generate
   ```
5. Aplique o schema no banco:
   ```bash
   npm run db:push
   ```
6. Popule o admin padrão:
   ```bash
   npm run db:seed
   ```
7. Rode a aplicação:
   ```bash
   npm run dev
   ```

## Admin padrão
- Email: `thais_snt@psicologia.com.br`
- Senha: `T34mo%1104`

## Endpoints principais
### Públicos
- `GET /api/public/profile`
- `GET /api/public/slots?date=YYYY-MM-DD`
- `POST /api/public/appointments`

### Admin
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `POST /api/admin/forgot-password`
- `POST /api/admin/reset-password`
- `GET/PUT /api/admin/profile`
- `GET/PUT /api/admin/availability`
- `GET /api/admin/appointments`
- `PATCH /api/admin/appointments/:id`
