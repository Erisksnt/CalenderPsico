# CalenderPsico

## Sobre o projeto

O CalenderPsico é um site institucional com painel administrativo, desenvolvido para apoiar a presença digital de uma profissional de psicologia. A proposta é reunir em um só lugar a apresentação pública do trabalho, a gestão do conteúdo do site e as ferramentas administrativas relacionadas à rotina de atendimentos.

O projeto busca permitir que as informações institucionais — como textos, imagens, contatos e organização das seções — sejam mantidas pelo painel, sem depender de alterações no código a cada atualização. A separação entre rascunho e publicação permite revisar as mudanças antes que elas sejam exibidas no site público.

Além do CMS, a aplicação inclui recursos para gerenciar disponibilidade e solicitações de agendamento. A página pública de agendamento existe no projeto, mas seu uso está atualmente em espera.

## O que o sistema reúne

- **Site institucional:** apresenta o trabalho da psicóloga em uma página composta por seções reutilizáveis, com conteúdo obtido da versão publicada no CMS.
- **Painel administrativo:** concentra a edição do conteúdo e da aparência, o preview do site, a biblioteca de mídia e o histórico de revisões.
- **Gestão de atendimentos:** reúne configurações de disponibilidade e solicitações de agendamento, com acesso administrativo.
- **Privacidade:** inclui uma página pública de política de privacidade.

## Estrutura pensada para o projeto

A aplicação é organizada por responsabilidades, separando as páginas e interfaces da lógica de dados e dos serviços externos:

```text
app/
  (psychologist)/       páginas administrativas agrupadas por contexto
  admin/                painel e preview do CMS
  agendar/               experiência pública de agendamento
  api/                   endpoints públicos e administrativos
  privacidade/           política de privacidade
components/
  admin/                 editor, painel e preview administrativo
  public/                composição das páginas públicas
  shared/                elementos compartilhados, como header e footer
lib/
  auth.ts                autenticação e sessão administrativa
  database.ts            acesso compartilhado ao banco de dados
  scheduling.ts          regras relacionadas a horários e agendamentos
  site-settings.ts       leitura, edição e publicação do conteúdo do site
  supabase/              integração com armazenamento de mídia
prisma/
  schema.prisma          modelos persistidos da aplicação
  migrations/            histórico ativo de alterações do banco
```

### Como as partes se relacionam

1. As páginas do Next.js (`app/`) compõem as experiências pública e administrativa.
2. Componentes em `components/` organizam a apresentação e são reutilizados onde as interfaces compartilham elementos.
3. As páginas e os Route Handlers da API usam a camada `lib/` para autenticação, persistência e regras de negócio.
4. PostgreSQL armazena contas, disponibilidade, agendamentos e conteúdo do CMS. O Prisma descreve os modelos e registra as migrações ativas.
5. O conteúdo do site possui estado de rascunho e estado publicado: o painel trabalha sobre o rascunho, enquanto a página pública lê a versão publicada.
6. Os arquivos de mídia são armazenados separadamente do banco, usando Supabase Storage; o banco guarda seus metadados e referências.

## Tecnologias

- Next.js 14 com App Router, React e TypeScript.
- PostgreSQL com Prisma ORM.
- Supabase Storage para arquivos de mídia.
- Upstash Redis para limitação de requisições.
- Integrações de e-mail para notificações, conforme a configuração da instalação.
- Vercel como plataforma de deploy prevista.

## Rotas da aplicação

| Rota | Finalidade |
| --- | --- |
| `/` | Site institucional público. |
| `/agendar` | Página pública de agendamento; funcionalidade atualmente em espera. (pagina em stand-by no momento) |
| `/privacidade` | Política de privacidade. |
| `/login/admin` | Entrada do painel administrativo. |
| `/admin` | Painel de gestão do site e dos atendimentos. |
| `/admin/preview` | Visualização administrativa do rascunho do site. |

As APIs ficam organizadas em `app/api/`, com rotas públicas separadas das operações administrativas protegidas.

## Persistência e evolução

As migrações ativas do banco ficam em `prisma/migrations/` e compõem o histórico necessário para evoluir o schema. A pasta `prisma/migrations-archive/` contém migrações antigas, fora da sequência ativa.

O CMS registra rascunho, publicação e revisões no banco. Essa estrutura centraliza a fonte do conteúdo e evita depender do armazenamento local do navegador para alterações administrativas.
