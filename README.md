# Kuhaku SaaS Platform

Bem-vindo ao Kuhaku, um boilerplate de projeto SaaS construído com uma arquitetura moderna, limpa e escalável. Este projeto serve como uma base sólida para o desenvolvimento de aplicações complexas, seguindo os princípios de Clean Architecture, DDD (Lite) e Microserviços.

## 🧱 Arquitetura Geral

O Kuhaku é organizado em um sistema de microserviços independentes, cada um containerizado com Docker:

-   **Frontend Service**: Uma aplicação Next.js (React) responsável pela interface do usuário.
-   **Backend Service**: Uma API REST mockada em Node.js (Fastify) que simula as funcionalidades do servidor.

A comunicação entre os serviços é feita via HTTP através de uma rede Docker interna, garantindo isolamento e segurança.

### Princípios Aplicados

-   **Microservices**: Garante a independência e o deploy desacoplado dos serviços.
-   **Clean Architecture & DDD (Lite)**: Separa as regras de negócio da tecnologia, resultando em um código mais testável, manutenível e evolutivo.
-   **Infra-as-Code**: Docker e Docker Compose são usados para definir e gerenciar a infraestrutura de forma declarativa.
-   **Independência Total**: O frontend e o backend são 100% independentes e podem ser desenvolvidos e escalados separadamente.

## 🚀 Como Iniciar

**Pré-requisitos:**
*   Docker
*   Docker Compose

Para rodar a aplicação completa (frontend + backend) de forma integrada, execute o seguinte comando na raiz do projeto:

```bash
docker-compose up --build
```

A aplicação estará disponível nos seguintes endereços:
-   **Frontend**: [http://localhost:3000](http://localhost:3000)
-   **Backend API**: [http://localhost:3333](http://localhost:3333)

### Rodando os Serviços Separadamente

#### Backend
```bash
cd backend
docker build -t kuhaku-backend .
docker run -p 3333:3333 --env-file .env kuhaku-backend
```

#### Frontend
```bash
cd frontend
docker build -t kuhaku-frontend .
docker run -p 3000:3000 kuhaku-frontend
```

## 📂 Estrutura de Diretórios

O projeto é dividido em duas pastas principais: `backend` e `frontend`.

### Backend
```
/src
  /domain       → Regras de negócio puras e entidades (ex: User)
  /usecases     → Casos de uso da aplicação (ex: Login, GetUser)
  /infra        → Implementações de repositórios e acesso a dados (ex: UserMockRepository)
  /adapters     → Controllers, DTOs e mapeadores que adaptam a web para os use cases
  /routes       → Definição das rotas HTTP (ex: /auth/login)
  /middlewares  → Middlewares de Autenticação, tratamento de erros, logs
  /mocks        → Dados mockados para simular o banco de dados
```

### Frontend
```
/src
  /app          → Páginas e rotas da aplicação (Next.js App Router)
  /components   → Componentes de UI reutilizáveis (Sidebar, Header)
  /services     → Cliente HTTP (api.js) para comunicação com o backend
  /contexts     → Contextos globais (ex: AuthContext)
  /hooks        → Hooks customizados (ex: useAuth)
  /utils        → Funções utilitárias
  /styles       → Estilos globais
  /types        → Tipagens e interfaces TypeScript
```

## ⚙️ Exemplos de API (Mock)

### Login
-   **Endpoint**: `POST /auth/login`
-   **Credenciais**:
    -   `email`: `admin@kuhaku.com`
    -   `password`: `123456`

**Exemplo (cURL):**
```bash
curl -X POST http://localhost:3333/auth/login \
-H "Content-Type: application/json" \
-d '{"email": "admin@kuhaku.com", "password": "123456"}'
```
**Resposta:**
```json
{
  "token": "um.jwt.ficticio.gerado.aqui",
  "user": {
    "id": "1",
    "name": "Admin Kuhaku",
    "email": "admin@kuhaku.com"
  }
}
```

### Obter Dados do Usuário
-   **Endpoint**: `GET /users/me`
-   **Header**: `Authorization: Bearer <seu_token>`

## 🔮 Expansão Futura

Este boilerplate foi projetado para ser facilmente expandido. Próximos passos podem incluir:
1.  **Serviço de Autenticação Real**: Substituir o mock por um serviço de autenticação completo usando um banco de dados (ex: PostgreSQL) e uma estratégia de JWT robusta.
2.  **Serviço de Billing**: Adicionar um novo microserviço para gerenciar assinaturas e pagamentos, integrado com gateways como Stripe.
3.  **Serviço de Notificações**: Criar um serviço para enviar e-mails, push notifications ou alertas via WebSockets.
4.  **Banco de Dados**: Substituir os repositórios mockados por implementações reais que se conectam a um banco de dados (ex: usando Prisma, TypeORM ou Drizzle).
