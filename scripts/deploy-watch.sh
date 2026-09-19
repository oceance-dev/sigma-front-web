#!/usr/bin/env bash
#
# Détecte si une nouvelle version doit être déployée, et déclenche deploy.sh
# si c'est le cas. Sinon, sort silencieusement (aucun bruit dans les logs).
#
# Déclencheur : deploy/systemd/sigma-front-deploy.{service,timer} (toutes les ~2 min).
#
# "Nouvelle version" = l'un ou l'autre :
#   - le commit de origin/main a changé (compose / scripts) ;
#   - le digest de l'image ghcr.io/…:latest a changé.
#
set -euo pipefail

REPO_DIR="/home/sigma/sigma-front-web"
COMPOSE_FILE="docker-compose.prod.yml"
IMAGE="ghcr.io/oceance-dev/sigma-front-web:latest"
LOG_DIR="/home/sigma/sigma-front-web/logs"
LOG="$LOG_DIR/deploy.log"

LOCKFILE="/var/lock/sigma-docker-pull.lock"
exec 200>"$LOCKFILE"
if ! flock -w 300 200; then
  echo "impossible d'obtenir le verrou docker pull (timeout)" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"
cd "$REPO_DIR"

log() { printf '[%s] %s\n' "$(date -Is)" "$*" | tee -a "$LOG"; }

changed=0

# --- 1. Changement de commit sur main ? --------------------------------------
git fetch --quiet origin
local_rev="$(git rev-parse HEAD)"
remote_rev="$(git rev-parse origin/main)"
[ "$local_rev" != "$remote_rev" ] && changed=1

# --- 2. Nouveau digest d'image sur GHCR ? -----------------------------------
# digest publié (lecture du registre, via le `docker login` déjà en place)
remote_digest="$(docker buildx imagetools inspect "$IMAGE" --format '{{.Manifest.Digest}}' 2>/dev/null || true)"
# digest de l'image locale correspondant au tag
local_digest="$(docker inspect --format '{{range .RepoDigests}}{{.}}{{end}}' "$IMAGE" 2>/dev/null | sed 's/.*@//' || true)"
if [ -n "$remote_digest" ] && [ "$remote_digest" != "$local_digest" ]; then
  changed=1
fi

# --- 3. Rien à faire -------------------------------------------------------
if [ "$changed" -eq 0 ]; then
  exit 0
fi

log "nouvelle version détectée (commit ${local_rev:0:7}->${remote_rev:0:7}, image ${local_digest:-none} -> ${remote_digest:-?}) — déploiement"
if ./scripts/deploy.sh >>"$LOG" 2>&1; then
  log "déploiement OK"
else
  rc=$?
  log "ÉCHEC du déploiement (code $rc) — voir $LOG"
  exit "$rc"
fi
