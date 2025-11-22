# 🚀 Kuhaku SaaS Platform

Bem-vindo ao **Kuhaku**, um boilerplate **production-ready** de projeto SaaS construído com arquitetura moderna, limpa e escalável. Este projeto serve como uma base sólida para o desenvolvimento de aplicações complexas, seguindo os princípios de **Clean Architecture**, **DDD (Lite)** e **Microserviços**.

## ✨ Destaques

- ✅ **Zero-Downtime Deployment** com estratégia Blue-Green
- ✅ **CI/CD Completo** com GitHub Actions
- ✅ **Auto-Update Inteligente** com rollback automático
- ✅ **Docker Otimizado** com multi-stage builds e segurança
- ✅ **Health Checks** integrados
- ✅ **Testes** automatizados (Unit + Integration)
- ✅ **100% Seguro** - nunca afeta outros containers do servidor

---

## 📖 Índice

- [Stack Tecnológica](#️-stack-tecnológica)
- [Arquitetura Geral](#-arquitetura-geral)
- [Como Iniciar](#-como-iniciar)
- [Estrutura de Diretórios](#-estrutura-de-diretórios)
- [Exemplos de API](#️-exemplos-de-api-mock)
- [Deploy Automatizado](#-deploy-automatizado)
  - [Blue-Green Deployment](#-estratégia-blue-green-deployment)
  - [Guia Repositório Público](#-repositório-público-recomendado-para-projetos-open-source)
  - [Guia Repositório Privado](#-repositório-privado-para-projetos-comerciais)
  - [Proteções de Segurança](#️-proteções-de-segurança)
- [Testes](#-testes)
- [Estrutura de Scripts](#-estrutura-de-scripts)
- [Expansão Futura](#-expansão-futura)
- [Documentação](#-documentação)
- [Características Enterprise](#-características-enterprise)

---

## 🛠️ Stack Tecnológica

### Backend
- **Runtime:** Node.js 20 (Alpine Linux)
- **Framework:** Fastify 4.27 (alta performance)
- **Auth:** JWT (jsonwebtoken)
- **Testes:** Jest + Supertest

### Frontend
- **Framework:** Next.js 14 (React 18)
- **Styling:** TailwindCSS 3.4
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Testes:** Jest + React Testing Library

### DevOps
- **Container:** Docker (multi-stage builds)
- **Orchestration:** Docker Compose
- **CI/CD:** GitHub Actions
- **Registry:** GitHub Container Registry (GHCR)
- **Deployment:** Blue-Green strategy
- **Automation:** Bash scripts + Cron/Systemd

---

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
-   **Blue-Green Deployment**: Deploy sem downtime com rollback automático.
-   **Security First**: Usuários não-root, health checks, isolamento de containers.

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

## 🐳 Deploy Automatizado

O Kuhaku possui um **sistema completo de CI/CD** com deploy automatizado e zero-downtime.

### 🎯 Estratégia Blue-Green Deployment

O script de auto-update implementa **Blue-Green deployment**, a mesma estratégia usada por Netflix, Amazon e Google:

```
🔵 Blue (versão antiga)  → Mantém rodando
🟢 Green (versão nova)   → Sobe paralelamente
✅ Health Check          → Valida nova versão
🔄 Switch                → Troca versões instantaneamente
♻️  Rollback automático  → Se algo falhar
```

**Vantagens:**
- **Zero downtime** - Seu site nunca fica fora do ar
- **Rollback instantâneo** - Se a nova versão falhar, volta para a antiga automaticamente
- **Seguro** - Testa a nova versão antes de remover a antiga
- **Isolado** - Nunca afeta outros containers no servidor

### 📚 Guias de Deploy

Escolha o guia apropriado para seu caso:

#### 🌍 **Repositório Público** (Recomendado para projetos open-source)
- Sem necessidade de autenticação
- Pull de imagens é público
- Setup simplificado

👉 **[Guia Completo: DEPLOY.md](./DEPLOY.md)**

#### 🔒 **Repositório Privado** (Para projetos comerciais)
- Requer GitHub Personal Access Token
- Imagens privadas no GHCR
- Segurança adicional

👉 **[Guia Completo: DEPLOY-PRIVATE.md](./DEPLOY-PRIVATE.md)**

### ⚡ Quick Start

```bash
# 1. Clone o repositório
git clone https://github.com/GustSR/kuhaku.git
cd kuhaku

# 2. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
nano backend/.env  # Ajuste conforme necessário

# 3. Primeiro deploy (usando imagens do GHCR)
export GITHUB_REPOSITORY="GustSR/kuhaku"
export IMAGE_TAG="latest"
docker-compose -f docker-compose.prod.yml up -d

# 4. Configurar auto-update (a cada 6 horas)
./scripts/install-cron.sh

# 5. Testar manualmente
./scripts/auto-update.sh
```

> **Nota:** O repositório já está pré-configurado para usar `GustSR/kuhaku`. Não é necessário arquivo `.update.config`.

### 🛡️ Proteções de Segurança

O auto-update é **100% seguro** para servidores compartilhados:

- ✅ **Nunca afeta outros containers** - Apenas manipula containers com nome `kuhaku-*`
- ✅ **Nunca afeta outras imagens** - Apenas remove imagens do repositório `ghcr.io/gustsr/kuhaku/*`
- ✅ **Usa labels** - Filtra containers pela label `com.kuhaku.service`
- ✅ **Verifica existência** - Sempre valida antes de operar
- ✅ **Backup automático** - Mantém as 2 versões mais recentes

**Exemplo de servidor seguro:**
```
Seu servidor rodando:
  ✅ kuhaku-backend      → Será atualizado
  ✅ kuhaku-frontend     → Será atualizado
  🔒 postgres-db         → NUNCA será afetado
  🔒 redis-cache         → NUNCA será afetado
  🔒 outro-app           → NUNCA será afetado
```

---

## 🧪 Testes

O projeto possui testes automatizados com boa cobertura:

### Backend
```bash
cd backend
npm test
```

**Testes implementados:**
- ✅ Unit: `Login.test.js` - Testa use case isolado
- ✅ Integration: `auth.test.js` - Testa rotas completas

### Frontend
```bash
cd frontend
npm test
```

**Testes implementados:**
- ✅ Component: `page.test.jsx` - Testa renderização e estados

---

## 📁 Estrutura de Scripts

```
scripts/
├── auto-update.sh          → Script principal de auto-update
├── quick-setup.sh          → Setup interativo inicial
├── install-cron.sh         → Instala cronjob automático
├── install-systemd.sh      → Instala systemd timer (alternativa)
├── migrate-to-private.sh   → Migração de público para privado
└── systemd/
    ├── kuhaku-update.service
    └── kuhaku-update.timer
```

---

## 🔮 Expansão Futura

Este boilerplate foi projetado para ser facilmente expandido. Próximos passos podem incluir:

1.  **Serviço de Autenticação Real**: Substituir o mock por um serviço de autenticação completo usando um banco de dados (ex: PostgreSQL) e uma estratégia de JWT robusta.
2.  **Serviço de Billing**: Adicionar um novo microserviço para gerenciar assinaturas e pagamentos, integrado com gateways como Stripe.
3.  **Serviço de Notificações**: Criar um serviço para enviar e-mails, push notifications ou alertas via WebSockets.
4.  **Banco de Dados**: Substituir os repositórios mockados por implementações reais que se conectam a um banco de dados (ex: usando Prisma, TypeORM ou Drizzle).
5.  **Monitoramento**: Adicionar Prometheus + Grafana para observabilidade.
6.  **SSL/TLS**: Configurar certificados automáticos com Let's Encrypt.
7.  **API Gateway**: Centralizar roteamento com Kong ou Traefik.
8.  **Service Mesh**: Implementar Istio ou Linkerd para comunicação avançada.

---

## 📚 Documentação

- **[DEPLOY.md](./DEPLOY.md)** - Guia completo de deploy para repositório público
- **[DEPLOY-PRIVATE.md](./DEPLOY-PRIVATE.md)** - Guia de deploy para repositório privado
- **[.github/workflows/](./.github/workflows/)** - Configuração do CI/CD

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fork o projeto
2. Criar uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abrir um Pull Request

---

## 📄 Licença

Este projeto é open-source e está disponível sob a licença MIT.

---

## 🌟 Características Enterprise

O Kuhaku implementa práticas de nível enterprise:

- ✅ **Clean Architecture** - Código testável e manutenível
- ✅ **Domain-Driven Design** - Foco no domínio de negócio
- ✅ **Microservices** - Escalabilidade e independência
- ✅ **CI/CD Automático** - Deploy contínuo com GitHub Actions
- ✅ **Zero-Downtime** - Blue-Green deployment
- ✅ **Auto-Update** - Atualização automática e inteligente
- ✅ **Rollback Automático** - Segurança em caso de falha
- ✅ **Health Checks** - Monitoramento de saúde
- ✅ **Security Hardening** - Non-root users, imagens otimizadas
- ✅ **Multi-stage Builds** - Imagens Docker menores
- ✅ **Automated Testing** - Testes unit e integration
- ✅ **Isolation** - Nunca afeta outros containers

---

## 📊 Deploy Tradicional vs Kuhaku

| Aspecto | Deploy Tradicional | Kuhaku (Blue-Green) |
|---------|-------------------|---------------------|
| **Downtime** | ❌ 10-60 segundos | ✅ Zero segundos |
| **Segurança** | ❌ Se falhar, site fica fora | ✅ Rollback automático |
| **Teste** | ❌ Não testa antes | ✅ Health check antes de finalizar |
| **Rollback** | ❌ Lento (re-deploy) | ✅ Instantâneo (~2 segundos) |
| **Automação** | ❌ Manual | ✅ Automático (cron/systemd) |
| **CI/CD** | ❌ Não incluído | ✅ GitHub Actions completo |
| **Multi-container** | ⚠️ Pode afetar outros | ✅ Isolado e seguro |
| **Backup** | ❌ Manual | ✅ Automático |
| **Monitoramento** | ❌ Não incluído | ✅ Health checks + logs |

---

<div align="center">

### 🎯 Pronto para Deploy Enterprise-Grade

**Construído com ❤️ usando as melhores práticas de mercado**

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)

[⬆ Voltar ao topo](#-kuhaku-saas-platform)

</div>
