# 🚀 Guia de Deploy - Kuhaku SaaS

Este guia explica como fazer deploy do Kuhaku usando GitHub Container Registry (GHCR) com auto-update.

---

## 📦 Visão Geral

O Kuhaku usa uma estratégia moderna de CI/CD:

1. **Push para GitHub** → GitHub Actions builda as imagens
2. **Imagens publicadas** no GitHub Container Registry (público)
3. **Script auto-update** verifica SHA e atualiza containers automaticamente
4. **Zero-downtime** com estratégia Blue-Green deployment

---

## 🔧 Setup Inicial

### 1. Configurar o Repositório

Após o primeiro push para `main`, as imagens serão criadas como **privadas** por padrão.

**Tornar as imagens públicas:**

1. Vá em: `https://github.com/SEU-USUARIO/kuhaku/packages`
2. Clique em `backend` → Settings → Change visibility → **Public**
3. Clique em `frontend` → Settings → Change visibility → **Public**

Isso precisa ser feito **apenas uma vez**. Todas as futuras builds serão públicas automaticamente.

---

### 2. Configurar o Servidor de Produção

No servidor onde você vai rodar os containers:

```bash
# Clone o repositório
git clone https://github.com/GustSR/kuhaku.git
cd kuhaku

# Configurar variáveis de ambiente
cp backend/.env.example backend/.env
nano backend/.env  # Ajuste as variáveis
```

> **Nota:** O script de auto-update já vem pré-configurado com o repositório `GustSR/kuhaku`. Não é necessário arquivo de configuração adicional para repositórios públicos.

---

### 3. Primeiro Deploy Manual

```bash
# Exportar variáveis para docker-compose
export GITHUB_REPOSITORY="GustSR/kuhaku"
export IMAGE_TAG="latest"

# Subir os containers
docker-compose -f docker-compose.prod.yml up -d

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f
```

**Ou use um alias:**
```bash
# Adicione ao ~/.bashrc ou ~/.zshrc
alias kuhaku-up='GITHUB_REPOSITORY=GustSR/kuhaku IMAGE_TAG=latest docker-compose -f docker-compose.prod.yml up -d'
alias kuhaku-logs='docker-compose -f docker-compose.prod.yml logs -f'
alias kuhaku-down='docker-compose -f docker-compose.prod.yml down'
```

---

## 🔄 Auto-Update

### Testar Manualmente

```bash
# Dry-run (simula sem aplicar)
./scripts/auto-update.sh --dry-run

# Forçar update (mesmo se SHA for igual)
./scripts/auto-update.sh --force

# Update normal
./scripts/auto-update.sh
```

---

### Configurar Execução Automática

**Opção 1: Cron (mais simples)**

```bash
./scripts/install-cron.sh
```

Escolha a frequência:
- **Desenvolvimento:** A cada 5 minutos
- **Produção:** A cada 6 horas (recomendado)

**Opção 2: Systemd Timer (mais moderno)**

```bash
sudo ./scripts/install-systemd.sh
```

Verificar status:
```bash
systemctl status kuhaku-update.timer
journalctl -u kuhaku-update.service -f
```

---

## 🔍 Como Funciona o Auto-Update

### Fluxo Completo

```
1. Script verifica digest SHA das imagens remotas (GHCR)
   ↓
2. Compara com digest das imagens locais
   ↓
3. Se diferentes → Inicia Blue-Green Deploy:
   ├─ Faz backup do estado atual
   ├─ Faz pull das novas imagens
   ├─ Renomeia containers antigos (blue)
   ├─ Sobe novos containers (green)
   ├─ Executa health checks
   ├─ Se OK → Remove containers antigos
   └─ Se FALHA → Rollback automático
```

### Estratégia Blue-Green

**Vantagens:**
- ✅ Zero downtime
- ✅ Rollback automático se falhar
- ✅ Health checks antes de finalizar
- ✅ Mantém versão anterior até confirmar sucesso

**Exemplo de execução:**

```bash
$ ./scripts/auto-update.sh

[INFO] Kuhaku Auto-Update Script
[INFO] Configuração carregada: gust/kuhaku (público)
[INFO] Verificando updates para serviço: backend
[INFO] Remote digest: sha256:abc123...
[INFO] Local digest:  sha256:def456...
[SUCCESS] Nova versão disponível para backend!
[INFO] Iniciando deploy Blue-Green...
[INFO] Criando backup do estado atual...
[SUCCESS] Backup criado: backups/backup-20250121-143022.tar.gz
[INFO] Baixando novas imagens...
[SUCCESS] Imagens baixadas com sucesso
[INFO] Renomeando containers atuais (Blue)...
[INFO] Subindo novos containers (Green)...
[INFO] Executando health checks...
[INFO] Verificando saúde do serviço backend na porta 3333...
[SUCCESS] Serviço backend está saudável
[INFO] Verificando saúde do serviço frontend na porta 3000...
[SUCCESS] Serviço frontend está saudável
[SUCCESS] Deploy bem-sucedido! Removendo versão antiga...
[SUCCESS] Deploy Blue-Green concluído com sucesso!
```

---

## 📊 Monitoramento

### Verificar Status dos Containers

```bash
# Status geral
docker ps

# Health status
docker inspect kuhaku-backend --format='{{.State.Health.Status}}'
docker inspect kuhaku-frontend --format='{{.State.Health.Status}}'

# Logs
docker logs kuhaku-backend -f
docker logs kuhaku-frontend -f
```

### Logs do Auto-Update

```bash
# Últimos logs
tail -f logs/auto-update-*.log

# Logs do cron
tail -f logs/cron.log

# Logs do systemd
journalctl -u kuhaku-update.service -f
```

---

## 🔐 Segurança

### Imagens Públicas

Como o repositório é **público**, qualquer um pode fazer pull das imagens:

```bash
docker pull ghcr.io/SEU-USUARIO/kuhaku/backend:latest
docker pull ghcr.io/SEU-USUARIO/kuhaku/frontend:latest
```

**⚠️ IMPORTANTE:**
- Nunca commite arquivos `.env` com secrets
- Use `.env.example` apenas com valores placeholder
- O arquivo `.update.config` pode ser público (não tem credenciais)

### Containers Rodando como Não-Root

Ambos containers rodam com usuários não-privilegiados:
- Backend: usuário `nodejs` (UID 1001)
- Frontend: usuário `nextjs` (UID 1001)

Verificar:
```bash
docker exec kuhaku-backend whoami  # Deve retornar: nodejs
docker exec kuhaku-frontend whoami # Deve retornar: nextjs
```

---

## 🛠️ Troubleshooting

### Auto-update não detecta mudanças

```bash
# Verificar digest manualmente
docker manifest inspect ghcr.io/SEU-USUARIO/kuhaku/backend:latest | grep digest

# Forçar update
./scripts/auto-update.sh --force
```

### Rollback manual

Se algo der errado e você precisar voltar:

```bash
# Parar containers atuais
docker-compose -f docker-compose.prod.yml down

# Ver imagens disponíveis
docker images | grep kuhaku

# Editar docker-compose.prod.yml e apontar para tag específica
export IMAGE_TAG="main-abc123"  # SHA antigo
docker-compose -f docker-compose.prod.yml up -d
```

### Limpar tudo e recomeçar

```bash
# CUIDADO: Isso remove TUDO
docker-compose -f docker-compose.prod.yml down -v
docker rmi $(docker images | grep kuhaku | awk '{print $3}')
rm -rf logs/* backups/*

# Recomeçar do zero
./scripts/auto-update.sh
```

---

## 📈 Workflow CI/CD Completo

```
Desenvolvedor faz commit → Push para GitHub
                              ↓
                    GitHub Actions triggered
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            Build Backend       Build Frontend
                    ↓                   ↓
                    └─────────┬─────────┘
                              ↓
                      Test Images (smoke tests)
                              ↓
                 Push to ghcr.io (public)
                              ↓
                    Tag: latest + SHA
                              ↓
          Servidor de produção (cada 6h ou manual)
                              ↓
                    auto-update.sh executa
                              ↓
                 Compara SHA remote vs local
                              ↓
                      ┌───────┴────────┐
                      ↓                ↓
                 Atualizado      Novo disponível
                      ↓                ↓
               Nada a fazer    Blue-Green Deploy
                                       ↓
                              Health Check Pass?
                                       ↓
                              ┌────────┴────────┐
                              ↓                 ↓
                            YES               NO
                              ↓                 ↓
                    Remove containers    Rollback
                         antigos         automático
```

---

## 🎯 Melhores Práticas

### Deploy de Produção

1. **Sempre teste primeiro:**
   ```bash
   ./scripts/auto-update.sh --dry-run
   ```

2. **Monitore os logs durante update:**
   ```bash
   tail -f logs/auto-update-*.log
   ```

3. **Verifique health após deploy:**
   ```bash
   curl http://localhost:3333/
   curl http://localhost:3000/
   ```

4. **Mantenha backups:**
   Os backups são criados automaticamente em `backups/`
   (mantém os 5 mais recentes)

5. **Configure notificações:**
   Adicione um webhook no `.update.config` para ser notificado de deploys

---

## 📝 Exemplo de Webhook (Discord)

Adicione ao `.update.config`:

```bash
WEBHOOK_URL="https://discord.com/api/webhooks/123/abc"
```

O script enviará notificações automáticas:
- ✅ Deploy bem-sucedido
- ❌ Deploy falhou (com rollback)
- ℹ️ Nenhuma atualização disponível

---

## ✅ Checklist de Deploy

- [ ] Repositório configurado no GitHub
- [ ] Imagens tornadas públicas no GHCR
- [ ] Servidor com Docker e Docker Compose instalados
- [ ] Arquivo `.env` configurado
- [ ] Arquivo `.update.config` ajustado
- [ ] Primeiro deploy manual executado com sucesso
- [ ] Auto-update testado com `--dry-run`
- [ ] Cron ou Systemd timer instalado
- [ ] Logs sendo monitorados
- [ ] Health checks funcionando

---

## 🆘 Suporte

- **GitHub Issues:** https://github.com/SEU-USUARIO/kuhaku/issues
- **GitHub Actions Logs:** https://github.com/SEU-USUARIO/kuhaku/actions
- **Container Registry:** https://github.com/SEU-USUARIO/kuhaku/pkgs

---

**Pronto! Seu SaaS está com deploy automatizado e zero-downtime! 🚀**
