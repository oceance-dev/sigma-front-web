#!/bin/bash

ENV_FILE="$(dirname "$0")/.env"

# Récupère l'IP locale du réseau actif (exclut loopback)
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

if [ -z "$IP" ]; then
  echo "Erreur : impossible de détecter l'IP réseau." >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Erreur : fichier $ENV_FILE introuvable." >&2
  exit 1
fi

# Remplace l'IP dans NEXT_PUBLIC_API_URL en conservant le chemin
sed -i '' "s|NEXT_PUBLIC_API_URL=http://[0-9.]*:|NEXT_PUBLIC_API_URL=http://$IP:|" "$ENV_FILE"

echo ""
echo "✅ IP mise à jour : $IP"
echo "$(grep NEXT_PUBLIC_API_URL "$ENV_FILE")"
echo ""
echo "📱 Ouvre cette URL sur ton mobile :"
echo "   http://$IP:3000"
echo ""

# Affiche un QR code si qrencode est disponible
if command -v qrencode &>/dev/null; then
  qrencode -t ANSIUTF8 "http://$IP:3000"
else
  echo "   (installe qrencode pour un QR code : brew install qrencode)"
fi
