#!/bin/bash
# setup-vps.sh — Initialisation du VPS Hostinger (à exécuter une seule fois en root)
# Usage : bash scripts/setup-vps.sh

set -e

REPO_URL="https://github.com/VOTRE_ORG/VOTRE_REPO.git"  # ← à remplacer
APP_DIR="/opt/sigma-web"

echo ""
echo "══════════════════════════════════════════"
echo "  SIGMA — Setup VPS"
echo "══════════════════════════════════════════"
echo ""

# ── 1. Mise à jour du système ──────────────────────────────────
echo "▶ Mise à jour du système..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Installation de Docker ──────────────────────────────────
echo "▶ Installation de Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "  ✅ Docker installé"
else
  echo "  ✅ Docker déjà présent ($(docker --version))"
fi

# ── 3. Installation de Git ─────────────────────────────────────
echo "▶ Vérification de Git..."
apt-get install -y -qq git curl

# ── 4. Clonage du dépôt ───────────────────────────────────────
echo "▶ Clonage du dépôt dans $APP_DIR..."
if [ -d "$APP_DIR" ]; then
  echo "  ✅ Répertoire déjà présent — git pull"
  git -C "$APP_DIR" pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  echo "  ✅ Dépôt cloné"
fi

# ── 5. Fichier .env ────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo ""
  echo "  ⚠️  Fichier .env créé depuis .env.example"
  echo "  → Éditez $APP_DIR/.env avant de continuer :"
  echo ""
  echo "     nano $APP_DIR/.env"
  echo ""
else
  echo "  ✅ Fichier .env déjà présent"
fi

# ── 6. Clé SSH pour GitHub Actions ───────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  Génération de la clé SSH pour le CI"
echo "══════════════════════════════════════════"
echo ""

SSH_KEY="$HOME/.ssh/github_actions"
if [ ! -f "$SSH_KEY" ]; then
  ssh-keygen -t ed25519 -C "github-actions@sigma" -f "$SSH_KEY" -N ""
  cat "$SSH_KEY.pub" >> "$HOME/.ssh/authorized_keys"
  chmod 600 "$HOME/.ssh/authorized_keys"
  echo "  ✅ Clé SSH créée"
else
  echo "  ✅ Clé SSH déjà présente"
fi

echo ""
echo "  → Copiez la clé PRIVÉE ci-dessous dans le secret GitHub VPS_SSH_KEY :"
echo ""
cat "$SSH_KEY"
echo ""

# ── 7. Résumé ─────────────────────────────────────────────────
echo "══════════════════════════════════════════"
echo "  Secrets GitHub à configurer"
echo "  (Settings → Secrets → Actions)"
echo "══════════════════════════════════════════"
echo ""
echo "  VPS_HOST          → $(curl -s ifconfig.me)"
echo "  VPS_USER          → $(whoami)"
echo "  VPS_PORT          → 22"
echo "  VPS_SSH_KEY       → (clé privée ci-dessus)"
echo "  GHCR_PAT          → Token GitHub (scope : read:packages)"
echo "  NEXT_PUBLIC_API_URL → URL de votre API AdonisJS"
echo "  NEXT_PUBLIC_SENTRY_DSN → DSN Sentry (optionnel)"
echo "  SENTRY_AUTH_TOKEN → Token Sentry (optionnel)"
echo ""
echo "══════════════════════════════════════════"
echo "  Étapes suivantes"
echo "══════════════════════════════════════════"
echo ""
echo "  1. Éditez le .env :     nano $APP_DIR/.env"
echo "  2. Éditez nginx.conf :  nano $APP_DIR/nginx.conf"
echo "     (remplacer VOTRE_DOMAINE par votre vrai domaine)"
echo "  3. Obtenez un certificat SSL :"
echo "     apt install certbot"
echo "     certbot certonly --standalone -d VOTRE_DOMAINE"
echo "  4. Premier déploiement :"
echo "     cd $APP_DIR && docker compose pull && docker compose up -d"
echo ""
