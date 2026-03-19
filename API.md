# API.md - Referência Completa de Endpoints

## 🔑 Autenticação


### POST /api/auth/login

Autenticar usuário.

**Response (200):**


### POST /api/auth/logout

Fazer logout.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso!"
}
```

---

## 📅 Disponibilidades

### GET /api/availability

Listar disponibilidades.

**Query Parameters:**
- `psychologist_id` (required): ID do psicólogo
- `day_of_week` (optional): MONDAY, TUESDAY, etc
- `exclude_blocked` (optional): true para excluir bloqueados

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "psychologist_id": "clx...",
      "day_of_week": "MONDAY",
      "start_time": "09:00",
      "end_time": "12:00",
      "is_blocked": false,
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  ]
}
```

---

### POST /api/availability

Criar nova disponibilidade.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "day_of_week": "MONDAY",
  "start_time": "09:00",
  "end_time": "12:00"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { /* objeto availability */ },
  "message": "Horário disponível criado com sucesso!"
}
```

---

### PUT /api/availability/[id]

Atualizar disponibilidade.

**Response (200):** Retorna objeto atualizado

---

### DELETE /api/availability/[id]

Deletar disponibilidade.

**Response (200):**
```json
{
  "success": true,
  "message": "Disponibilidade deletada com sucesso!"
}
```

---

## 📋 Agendamentos

### GET /api/appointments

Listar agendamentos do usuário autenticado.

**Query Parameters:**
- `status` (optional): SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
- `date_from` (optional): ISO date string
- `date_to` (optional): ISO date string

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "service_id": "clx...",
      "patient_id": "clx...",
      "psychologist_id": "clx...",
      "start_time": "2024-02-14T14:00:00Z",
      "end_time": "2024-02-14T15:00:00Z",
      "status": "SCHEDULED",
      "notes": "Paciente mencionou ansiedade",
      "confirmation_token": "abc123...",
      "payment_status": "pending",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z",
      "service": { /* objeto service */ },
      "patient": { /* objeto patient */ },
      "psychologist": { /* objeto psychologist */ }
    }
  ]
}
```

---

### POST /api/appointments

Criar novo agendamento.

**Body:**
```json
{
  "service_id": "clx...",
  "patient_name": "João Silva",
  "patient_email": "joao@example.com",
  "patient_phone": "11999999999",
  "start_time": "2024-02-14T14:00:00Z",
  "notes": "Primeira sessão"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { /* objeto appointment */ },
  "message": "Agendamento realizado com sucesso! Verifique seu email para confirmar."
}
```

**Errors:**
- 409: "Horário não está disponível"

---

### GET /api/appointments/[id]

Obter detalhes de um agendamento.

**Response (200):** Retorna objeto appointment completo

---

### PUT /api/appointments/[id]

Atualizar agendamento.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (todos opcionais):**
```json
{
  "status": "COMPLETED",
  "notes": "Sessão positiva",
  "start_time": "2024-02-14T15:00:00Z"
}
```

**Response (200):** Retorna objeto atualizado

---

### DELETE /api/appointments/[id]

Cancelar agendamento (soft delete).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* appointment com status CANCELLED */ },
  "message": "Agendamento cancelado com sucesso!"
}
```

---

## 🏥 Serviços

### GET /api/services

Listar serviços.

**Query Parameters:**
- `psychologist_id` (optional): Filtrar por psicólogo

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "psychologist_id": "clx...",
      "name": "Sessão Individual",
      "description": "Sessão de terapia com duração de 1 hora",
      "duration": 60,
      "price": 10000,  // centavos
      "color": "#3B82F6",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  ]
}
```

---

### POST /api/services

Criar novo serviço.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (201):** Retorna objeto service criado

---

### GET /api/services/[id]

Obter detalhes de um serviço.

**Response (200):** Retorna objeto service

---

### PUT /api/services/[id]

Atualizar serviço.

**Response (200):** Retorna objeto atualizado

---

### DELETE /api/services/[id]

Deletar serviço.

**Response (200):**
```json
{
  "success": true,
  "message": "Serviço deletado com sucesso!"
}
```

**Error:**
- 409: "Não é possível deletar um serviço com agendamentos associados"

---

## 👥 Psicólogos

### GET /api/psychologists

---

## ⚠️ Tratamento de Erros

Todos os endpoints retornam respostas estruturadas:

### Erro de Validação (400)
```json
{
  "success": false,
  "error": "Erro de validação",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Email inválido"
      }
    ]
  }
}
```

### Não Autorizado (401)
```json
{
  "success": false,
  "error": "Não autorizado"
}
```

### Acesso Negado (403)
```json
{
  "success": false,
  "error": "Acesso negado"
}
```

### Não Encontrado (404)
```json
{
  "success": false,
  "error": "Recurso não encontrado"
}
```

### Conflito (409)
```json
{
  "success": false,
  "error": "Horário não está disponível"
}
```

### Erro Interno (500)
```json
{
  "success": false,
  "error": "Erro interno do servidor"
}
```

---

## 📊 Rate Limiting

Cada endpoint tem limite de requisições:

- **Autenticação**: 10 por minuto
- **Agendamentos**: 30 por minuto
- **Disponibilidades**: 20 por minuto
- **Outros**: 100 por minuto

---

## 🔄 Tipos de Status de Agendamento

| Status      | Descrição                          |
|-------------|-------------------------------------|
| SCHEDULED   | Agendado e aguardando confirmação   |
| COMPLETED   | Consulta realizada                  |
| CANCELLED   | Cancelado por paciente ou psicólogo |
| NO_SHOW     | Paciente não compareceu             |

---

## 📌 Headers Recomendados

```
Content-Type: application/json
Authorization: Bearer <token>
Accept: application/json
```
