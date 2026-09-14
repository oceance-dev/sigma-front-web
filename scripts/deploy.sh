#!/usr/bin/env bash
#
# Applique le déploiement sur le VPS : synchronise le dépôt, tire l'image
# publiée par GitHub Actions sur GHCR, recrée les conteneurs.
#
#   - appelé automatiquement par scripts/deploy-watch.sh (timer systemd)
#     quand une nouvelle image / un nouveau commit main est détecté ;
#   - utilisable à la main pour forcer un déploiement immédiat :
#       ~/sigma-front-web/scripts/deploy.sh
#
# GitHub ne se connecte jamais au VPS : tout est en "pull" côté serveur.
#
set -euo pipefail

REPO_DIR="/home/sigma/sigma-front-web"
COMPOSE_FILE="docker-compose.prod.yml"

cd "$REPO_DIR"

echo "[deploy] $(date -Is) — synchronisation du dépôt (compose + scripts)"
git fetch --quiet origin
git reset --hard origin/main          # le .env (gitignoré) est préservé

echo "[deploy] pull de l'image applicative depuis GHCR"
docker compose -f "$COMPOSE_FILE" pull

echo "[deploy] redémarrage des services"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "[deploy] nettoyage des images inutilisées"
docker image prune -f

echo "[deploy] état des conteneurs :"
docker compose -f "$COMPOSE_FILE" ps

echo "[deploy] $(date -Is) — terminé"
