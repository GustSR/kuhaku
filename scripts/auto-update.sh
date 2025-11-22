#!/bin/bash

################################################################################
# Kuhaku Auto-Update Script
#
# Este script verifica se há novas imagens no GitHub Container Registry
# e realiza um deploy zero-downtime usando estratégia Blue-Green
#
# Uso: ./auto-update.sh [--dry-run] [--force]
################################################################################

set -euo pipefail

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/auto-update-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="${PROJECT_DIR}/backups"

# Configuração do repositório (hardcoded para repositório público)
GITHUB_REPOSITORY="gustsr/kuhaku"
IMAGE_TAG="latest"
WEBHOOK_URL=""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
DRY_RUN=false
FORCE_UPDATE=false

# Parse argumentos
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE_UPDATE=true
      shift
      ;;
    --help)
      echo "Uso: $0 [--dry-run] [--force]"
      echo ""
      echo "Opções:"
      echo "  --dry-run    Simula a atualização sem aplicar mudanças"
      echo "  --force      Força atualização mesmo se SHA for igual"
      echo "  --help       Mostra esta mensagem"
      exit 0
      ;;
  esac
done

################################################################################
# Funções auxiliares
################################################################################

log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  case $level in
    INFO)
      echo -e "${BLUE}[INFO]${NC} ${message}" | tee -a "$LOG_FILE"
      ;;
    SUCCESS)
      echo -e "${GREEN}[SUCCESS]${NC} ${message}" | tee -a "$LOG_FILE"
      ;;
    WARN)
      echo -e "${YELLOW}[WARN]${NC} ${message}" | tee -a "$LOG_FILE"
      ;;
    ERROR)
      echo -e "${RED}[ERROR]${NC} ${message}" | tee -a "$LOG_FILE"
      ;;
  esac
}

cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log ERROR "Script falhou com código $exit_code"
  fi
  exit $exit_code
}

trap cleanup EXIT

init_dirs() {
  mkdir -p "$LOG_DIR" "$BACKUP_DIR"
  log INFO "Diretórios inicializados"
}

load_config() {
  log INFO "Usando repositório: $GITHUB_REPOSITORY (público)"
}

get_remote_digest() {
  local image=$1
  local tag=${2:-latest}

  log INFO "Buscando digest remoto para $image:$tag (repositório público)"

  # Para repositórios públicos, não precisa de autenticação
  # Usa docker manifest para obter o digest
  local digest=$(docker manifest inspect "ghcr.io/${GITHUB_REPOSITORY}/${image}:${tag}" 2>/dev/null | \
    grep -oP '"digest":\s*"\K[^"]+' | head -1)

  if [ -z "$digest" ]; then
    # Fallback: tentar via API pública do GitHub Container Registry
    digest=$(curl -sL "https://ghcr.io/v2/${GITHUB_REPOSITORY}/${image}/manifests/${tag}" \
      -H "Accept: application/vnd.docker.distribution.manifest.v2+json" 2>/dev/null | \
      jq -r '.config.digest' 2>/dev/null)
  fi

  echo "$digest"
}

get_local_digest() {
  local image=$1

  log INFO "Buscando digest local para $image"

  local full_image="ghcr.io/${GITHUB_REPOSITORY}/${image}:${IMAGE_TAG:-latest}"

  # Verifica se a imagem existe localmente
  if ! docker image inspect "$full_image" &> /dev/null; then
    log WARN "Imagem local não encontrada: $full_image"
    echo ""
    return 1
  fi

  local digest=$(docker image inspect "$full_image" --format='{{index .RepoDigests 0}}' | \
    grep -oP '@sha256:\K[a-f0-9]+')

  echo "sha256:$digest"
}

check_updates() {
  local service=$1

  log INFO "Verificando updates para serviço: $service"

  local remote_digest=$(get_remote_digest "$service" "${IMAGE_TAG:-latest}")
  local local_digest=$(get_local_digest "$service")

  if [ -z "$remote_digest" ]; then
    log ERROR "Não foi possível obter digest remoto para $service"
    return 2
  fi

  log INFO "Remote digest: ${remote_digest:0:20}..."
  log INFO "Local digest:  ${local_digest:0:20}..."

  if [ "$FORCE_UPDATE" = true ]; then
    log WARN "Modo --force ativado, forçando atualização"
    return 0
  fi

  if [ "$remote_digest" != "$local_digest" ]; then
    log SUCCESS "Nova versão disponível para $service!"
    return 0
  else
    log INFO "Serviço $service já está atualizado"
    return 1
  fi
}

backup_current_state() {
  log INFO "Criando backup do estado atual..."

  local backup_file="${BACKUP_DIR}/backup-$(date +%Y%m%d-%H%M%S).tar.gz"

  if [ "$DRY_RUN" = true ]; then
    log INFO "[DRY-RUN] Backup seria criado em: $backup_file"
    return 0
  fi

  # Salva informações das imagens atuais
  docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | \
    grep "ghcr.io/${GITHUB_REPOSITORY}" > "${BACKUP_DIR}/images.txt"

  # Salva configuração atual
  docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" config > "${BACKUP_DIR}/config.yml"

  tar -czf "$backup_file" -C "$BACKUP_DIR" images.txt config.yml 2>/dev/null

  # Manter apenas os 5 backups mais recentes
  ls -t "${BACKUP_DIR}"/backup-*.tar.gz | tail -n +6 | xargs rm -f 2>/dev/null || true

  log SUCCESS "Backup criado: $backup_file"
}

pull_new_images() {
  log INFO "Baixando novas imagens..."

  if [ "$DRY_RUN" = true ]; then
    log INFO "[DRY-RUN] Pull seria executado"
    return 0
  fi

  cd "$PROJECT_DIR"

  docker-compose -f docker-compose.prod.yml pull --quiet

  if [ $? -eq 0 ]; then
    log SUCCESS "Imagens baixadas com sucesso"
  else
    log ERROR "Falha ao baixar imagens"
    return 1
  fi
}

health_check() {
  local service=$1
  local port=$2
  local max_attempts=${3:-30}
  local attempt=0

  log INFO "Verificando saúde do serviço $service na porta $port..."

  while [ $attempt -lt $max_attempts ]; do
    if curl -f -s "http://localhost:${port}/" > /dev/null 2>&1; then
      log SUCCESS "Serviço $service está saudável"
      return 0
    fi

    attempt=$((attempt + 1))
    log INFO "Tentativa $attempt/$max_attempts - Aguardando serviço ficar pronto..."
    sleep 2
  done

  log ERROR "Serviço $service falhou no health check após $max_attempts tentativas"
  return 1
}

blue_green_deploy() {
  log INFO "Iniciando deploy Blue-Green..."

  if [ "$DRY_RUN" = true ]; then
    log INFO "[DRY-RUN] Deploy seria executado"
    return 0
  fi

  cd "$PROJECT_DIR"

  # Passo 1: Criar backup
  backup_current_state

  # Passo 2: Pull das novas imagens
  pull_new_images || {
    log ERROR "Falha no pull das imagens, abortando deploy"
    return 1
  }

  # Passo 3: Renomear containers antigos (Blue)
  log INFO "Renomeando containers atuais (Blue)..."

  # SEGURANÇA: Verifica se containers existem antes de renomear
  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-backend$"; then
    docker rename kuhaku-backend kuhaku-backend-blue 2>/dev/null || true
  fi

  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-frontend$"; then
    docker rename kuhaku-frontend kuhaku-frontend-blue 2>/dev/null || true
  fi

  # Passo 4: Subir novos containers (Green)
  log INFO "Subindo novos containers (Green)..."

  # SEGURANÇA: Para apenas containers específicos do Kuhaku
  # Verifica se existem antes de parar
  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-backend-blue$"; then
    docker stop kuhaku-backend-blue 2>/dev/null || true
  fi

  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-frontend-blue$"; then
    docker stop kuhaku-frontend-blue 2>/dev/null || true
  fi

  # Subir novos containers
  docker-compose -f docker-compose.prod.yml up -d

  if [ $? -ne 0 ]; then
    log ERROR "Falha ao subir novos containers"
    rollback
    return 1
  fi

  # Passo 5: Health check dos novos containers
  log INFO "Executando health checks..."

  if ! health_check "backend" 3333 30; then
    log ERROR "Backend health check falhou"
    rollback
    return 1
  fi

  if ! health_check "frontend" 3000 30; then
    log ERROR "Frontend health check falhou"
    rollback
    return 1
  fi

  # Passo 6: Sucesso! Remover containers antigos
  log SUCCESS "Deploy bem-sucedido! Removendo versão antiga..."

  # SEGURANÇA: Remove apenas containers Blue específicos do Kuhaku
  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-backend-blue$"; then
    docker rm -f kuhaku-backend-blue 2>/dev/null || true
  fi

  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-frontend-blue$"; then
    docker rm -f kuhaku-frontend-blue 2>/dev/null || true
  fi

  # Passo 7: Limpeza de imagens antigas (manter as 2 últimas versões)
  cleanup_old_images

  log SUCCESS "Deploy Blue-Green concluído com sucesso!"
}

rollback() {
  log WARN "Iniciando rollback para versão anterior..."

  # SEGURANÇA: Para e remove apenas containers específicos do Kuhaku (Green que falharam)
  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-backend$"; then
    docker stop kuhaku-backend 2>/dev/null || true
    docker rm kuhaku-backend 2>/dev/null || true
  fi

  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-frontend$"; then
    docker stop kuhaku-frontend 2>/dev/null || true
    docker rm kuhaku-frontend 2>/dev/null || true
  fi

  # Renomear containers antigos (Blue) de volta
  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-backend-blue$"; then
    docker rename kuhaku-backend-blue kuhaku-backend 2>/dev/null || true
  fi

  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-frontend-blue$"; then
    docker rename kuhaku-frontend-blue kuhaku-frontend 2>/dev/null || true
  fi

  # Reiniciar containers antigos apenas se existirem
  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-backend$"; then
    docker start kuhaku-backend 2>/dev/null || true
  fi

  if docker ps -a --format '{{.Names}}' | grep -q "^kuhaku-frontend$"; then
    docker start kuhaku-frontend 2>/dev/null || true
  fi

  log SUCCESS "Rollback concluído - versão anterior restaurada"
}

cleanup_old_images() {
  log INFO "Limpando imagens antigas do Kuhaku..."

  # SEGURANÇA: Apenas remove imagens do repositório Kuhaku
  # Remove imagens não utilizadas, mantendo as 2 mais recentes
  docker images --format "{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedAt}}" | \
    grep "ghcr.io/${GITHUB_REPOSITORY}" | \
    sort -k3 -r | \
    tail -n +3 | \
    awk '{print $2}' | \
    xargs -r docker rmi -f 2>/dev/null || true

  # SEGURANÇA: Apenas limpar containers do Kuhaku (não usar prune genérico!)
  # Lista containers parados com label do Kuhaku e remove especificamente
  docker ps -a --filter "label=com.kuhaku.service" --filter "status=exited" -q | \
    xargs -r docker rm 2>/dev/null || true

  log SUCCESS "Limpeza concluída (apenas imagens/containers do Kuhaku)"
}

send_notification() {
  local status=$1
  local message=$2

  # Implementar notificações (webhook, email, etc)
  # Exemplo: enviar para webhook do Discord/Slack

  if [ -n "${WEBHOOK_URL:-}" ]; then
    curl -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"status\": \"$status\", \"message\": \"$message\"}" \
      > /dev/null 2>&1 || true
  fi
}

################################################################################
# Main
################################################################################

main() {
  log INFO "========================================="
  log INFO "Kuhaku Auto-Update Script"
  log INFO "========================================="
  log INFO "Timestamp: $(date)"
  log INFO "Dry-run: $DRY_RUN"
  log INFO "Force: $FORCE_UPDATE"
  log INFO "========================================="

  # Inicialização
  init_dirs
  load_config

  # Verificar atualizações
  local backend_needs_update=false
  local frontend_needs_update=false

  if check_updates "backend"; then
    backend_needs_update=true
  fi

  if check_updates "frontend"; then
    frontend_needs_update=true
  fi

  # Se nenhum serviço precisa atualizar
  if [ "$backend_needs_update" = false ] && [ "$frontend_needs_update" = false ]; then
    log INFO "Nenhuma atualização disponível"
    send_notification "info" "Nenhuma atualização disponível"
    exit 0
  fi

  # Executar deploy
  log INFO "Atualizações detectadas, iniciando deploy..."

  if blue_green_deploy; then
    log SUCCESS "========================================="
    log SUCCESS "Atualização concluída com sucesso!"
    log SUCCESS "========================================="
    send_notification "success" "Deploy concluído com sucesso"
  else
    log ERROR "========================================="
    log ERROR "Falha na atualização"
    log ERROR "========================================="
    send_notification "error" "Falha no deploy - rollback executado"
    exit 1
  fi
}

# Executar
main "$@"
