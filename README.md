# ConectFlow — ISP Pre-Registration Platform

> Sistema de pré-cadastro para provedores de internet (ISPs), com formulário público multi-etapas, dashboard administrativo e integrações com SGP.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 · Tailwind CSS · shadcn/ui |
| Backend | Node.js · Express · TypeScript |
| Database | PostgreSQL · Prisma ORM |
| Infra | Docker · Docker Compose |

## Funcionalidades

### Portal Público
- Formulário multi-etapas (7 passos):
  1. Dados pessoais
  2. Endereço com busca por CEP
  3. Foto da casa e localização
  4. Seleção de plano (integração SGP)
  5. Tipo de contrato (fidelidade ou não)
  6. Agendamento de instalação
  7. Nome e senha do Wi-Fi

### Regras de Negócio
- Taxa de adesão variável por bairro
- Override por bairros especiais
- Taxa de distância: até 150m = R$50 / acima = +R$1/m extra

### Dashboard Admin
- Kanban de leads por status
- Detalhes do lead
- Visualização em mapa
- Preview de fotos
- Atualização de status

## Instalação e Uso

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+ (ou Docker)
- npm / pnpm

### 1. Clone e configure

```bash
git clone https://github.com/erickbenezar218/ConectStart.git
cd ConectStart

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações
```

### 2. Com Docker (recomendado)

```bash
docker-compose up -d
```

### 3. Sem Docker

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Acesse:
- Frontend: http://localhost:3000
- API: http://localhost:3001/api

## Estrutura do Projeto

```
ConectFlow/
├── backend/
│   ├── prisma/           # Schema e migrations
│   ├── src/
│   │   ├── config/       # Database, env
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, upload, validation
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── types/        # TypeScript types
│   └── uploads/          # Uploaded files
└── frontend/
    └── src/
        ├── app/
        │   ├── (public)/ # Formulário público
        │   └── (admin)/  # Dashboard admin
        ├── components/
        │   ├── forms/    # Multi-step form
        │   └── admin/    # Admin components
        ├── hooks/        # React hooks
        ├── lib/          # API client, utils
        └── types/        # Shared types
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/leads` | Lista todos os leads |
| POST | `/api/leads` | Cria novo lead |
| GET | `/api/leads/:id` | Detalhes do lead |
| PATCH | `/api/leads/:id/status` | Atualiza status |
| GET | `/api/plans` | Lista planos do SGP |
| GET | `/api/plans/billing-dates` | Datas de vencimento |
| POST | `/api/pricing/calculate` | Calcula taxas |
| POST | `/api/uploads/photo` | Upload de foto |

## Integrações

- **SGP (Conectstelecom):** Busca planos e datas de vencimento
- **WhatsApp (preparado):** Notificações automáticas
- **ERP (preparado):** Sincronização de clientes

## Licença

Privado — Conectplus Fibra © 2024
