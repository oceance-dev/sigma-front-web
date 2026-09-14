# Déploiement automatique — SIGMA FRONT (sigma-front-web)

Modèle **pull**, identique à celui du backend (`ancre-adonisjs`), qui tourne sur
le même VPS : GitHub Actions teste, construit l'image Docker et la publie sur
GHCR. **GitHub ne se connecte jamais au VPS.** Le VPS détecte la nouvelle image
via un timer systemd et l'applique lui-même.

> Ce document ne redécrit pas le durcissement SSH / pare-feu du VPS : il est
> déjà en place pour l'ensemble du serveur (voir `ancre-adonisjs/docs/DEPLOY.md`
> §1.5–1.6). SSH reste filtré sur l'IP de l'admin ; aucun port entrant
> supplémentaire n'est ouvert pour ce repo.

```
git push main
   └▶ GitHub Actions
        ├ test : lint (informatif) + typecheck + build Next.js
        └ build-and-push : docker build ─▶ ghcr.io/oceance-dev/sigma-front-web:{latest,sha-…}

VPS ─ sigma-front-deploy.timer (toutes les ~2 min) ─▶ scripts/deploy-watch.sh
        ├ nouveau commit origin/main ?  ou  nouveau digest d'image ?
        │     └ non → rien (sort en silence)
        └ oui → scripts/deploy.sh
                  ├ git reset --hard origin/main        (compose + scripts)
                  ├ docker compose -f docker-compose.prod.yml pull
                  └ docker compose -f docker-compose.prod.yml up -d
```

Flux quotidien : `git push` sur `main` → ~1–2 min plus tard le VPS tourne la
nouvelle version, sans intervention.

⚠️ **Ce repo partage le VPS avec le backend** — noms volontairement distincts
partout pour éviter toute collision : unités systemd `sigma-front-deploy.*`
(backend : `sigma-deploy.*`), dossier clone `~/sigma-front-web` (backend :
`~/ancre-adonisjs`), logs dans `~/sigma-front-web/logs/deploy.log` (backend :
`~/backups/logs/deploy.log`), conteneur `sigma_front` (backend : `sigma_api`),
routeur Traefik `sigma-front` (backend : `sigma-api`), image
`ghcr.io/oceance-dev/sigma-front-web`.

---

## 0. Prérequis — accès au dépôt depuis le VPS

### 0.1 Deploy key en lecture seule pour CE repo

Le VPS garde un clone du repo (pour `docker-compose.prod.yml` + `scripts/`).
La deploy key du backend (`repo_deploy_key`) est scoped à `ancre-adonisjs` sur
GitHub — **elle ne donne pas accès à `sigma-front-web`**. Il en faut une nouvelle,
en lecture seule, dédiée à ce repo :

```bash
# sur le VPS, en tant que sigma
ssh-keygen -t ed25519 -f ~/.ssh/sigma_front_deploy_key -N "" -C "vps-sigma-front-web-ro"
cat ~/.ssh/sigma_front_deploy_key.pub
```

GitHub → repo `oceance-dev/sigma-front-web` → **Settings → Deploy keys → Add** :
coller la clé publique (le `cat` ci-dessus), **"Allow write access" décoché**.
La clé privée ne quitte jamais le VPS.

```bash
# toujours sur le VPS, en tant que sigma — config SSH dédiée à ce dépôt
# (alias distinct de github-ancre)
touch ~/.ssh/config && chmod 600 ~/.ssh/config
printf '%s\n' \
  'Host github-sigma-front' \
  '  HostName github.com' \
  '  User git' \
  '  IdentityFile ~/.ssh/sigma_front_deploy_key' \
  '  IdentitiesOnly yes' \
  >> ~/.ssh/config

git clone github-sigma-front:oceance-dev/sigma-front-web.git ~/sigma-front-web
cd ~/sigma-front-web
ssh -T github-sigma-front    # "Hi oceance-dev/sigma-front-web! ..." attendu
```

### 0.2 Login GHCR — déjà fait, à vérifier seulement

Le user `sigma` est déjà loggé sur `ghcr.io` (PAT `read:packages`, utilisé par
le backend). Le même login couvre ce repo tant que le PAT porte sur le compte
`oceance-dev` entier :

```bash
docker pull ghcr.io/oceance-dev/sigma-front-web:latest && echo OK
```

Si ça échoue avec `unauthorized` (PAT scopé à un seul repo/package), refaire
un `docker login ghcr.io` avec un PAT couvrant aussi `sigma-front-web` — ne pas
créer un second login sans raison, `~/.docker/config.json` est déjà partagé.

---

## 1. Préparer le VPS

### 1.1 `.env` de production

`/home/sigma/sigma-front-web/.env` (gitignoré, **jamais** committé) :

```env
API_URL=https://sigma-saas.cloud/sigma-adonisjs
```

C'est la seule variable requise au runtime (voir `.env.example` du repo) :
`NEXT_PUBLIC_*` sont baked au build par GitHub Actions, pas relues au démarrage
du conteneur.

### 1.2 Timer de déploiement

```bash
sudo cp ~/sigma-front-web/deploy/systemd/sigma-front-deploy.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sigma-front-deploy.timer
systemctl list-timers sigma-front-deploy.timer

# test manuel immédiat
sudo systemctl start sigma-front-deploy.service
tail -n 30 ~/sigma-front-web/logs/deploy.log
```

---

## 2. Secrets & variables GitHub

Contrairement au backend, ce build embarque des variables `NEXT_PUBLIC_*`
dans le bundle client (baked à l'image, pas relues au runtime). `NEXT_PUBLIC_API_URL`
et `NEXT_PUBLIC_SENTRY_DSN` sont déjà configurés en GitHub Secrets sur ce repo
(hérités de l'ancien workflow) — le nouveau workflow les réutilise tels quels,
pas de migration vers des Variables nécessaire.

**Settings → Secrets and variables → Actions → Secrets** (sur le repo
`oceance-dev/sigma-front-web`) — vérifier/compléter :
- `NEXT_PUBLIC_API_URL` = `https://sigma-saas.cloud/sigma-adonisjs` (déjà présent)
- `NEXT_PUBLIC_SENTRY_DSN` (déjà présent)
- `NEXT_PUBLIC_API_HOST` = `https://sigma-saas.cloud` (nouveau — utilisé pour le CSP,
  voir `next.config.ts`)
- `SENTRY_AUTH_TOKEN` (si l'upload de sourcemaps Sentry est utilisé en CI)

Aucun secret SSH : comme côté backend, le push sur GHCR utilise le
`GITHUB_TOKEN` natif du workflow, GitHub ne se connecte jamais au VPS.

---

## 3. Protection de la branche `main`

Repo → **Settings → Branches → Add branch ruleset** sur `main` :

- Require a pull request before merging
- Require status checks : `test`, `build-and-push`
- Block force pushes

---

## 4. Première mise en production (manuelle, une fois)

Avant de laisser le timer tourner, on bascule à la main pour vérifier :

```bash
cd ~/sigma-front-web
git fetch origin && git reset --hard origin/main    # récupère docker-compose.prod.yml + scripts

# l'image doit déjà être sur GHCR (job build-and-push ✅). Vérifier :
docker pull ghcr.io/oceance-dev/sigma-front-web:latest

# vérifier qu'aucun conteneur nommé "sigma-web" (ancien déploiement local-build)
# ou "sigma_front" ne tourne déjà et n'entre en collision de port/nom :
docker ps -a

# si l'ancien conteneur "sigma-web" (docker-compose.yml historique) tourne encore :
docker compose down    # arrête l'ancien stack, sans toucher aux autres services du VPS

docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec web wget -qO- http://127.0.0.1:3000/api/health
curl -i https://sigma-saas.cloud/api/health
```

- `/api/health` interne **200** + `curl` public **200** → OK.
- Vérifier aussi que `https://sigma-saas.cloud/sigma-adonisjs/health` (API)
  répond toujours correctement : le routeur `sigma-front` (Host seul) et le
  routeur `sigma-api` (Host + PathPrefix `/sigma-adonisjs`) doivent cohabiter
  sans que l'un masque l'autre — Traefik priorise la règle la plus spécifique
  par défaut, aucune configuration de priorité explicite n'est nécessaire.

Puis activer le timer (§1.2). À partir de là, chaque `git push` sur `main` est
déployé automatiquement. Vérifier :

```bash
tail -f ~/sigma-front-web/logs/deploy.log
docker compose -f docker-compose.prod.yml logs --tail=50 web
```

---

## 5. Rollback

**Cas normal — revert Git** (recommandé) :

```bash
git revert <commit_fautif> && git push    # -> nouvelle image -> le timer redéploie
```

**Urgence — épingler une image antérieure** (le temps de corriger `main`) :

```bash
cd ~/sigma-front-web
sudo systemctl stop sigma-front-deploy.timer         # sinon le timer re-tire :latest
echo "IMAGE_TAG=sha-<ancien_commit_long>" >> .env    # tags : repo GitHub → Packages
docker compose -f docker-compose.prod.yml up -d web
# … corriger main, puis :
sed -i '/^IMAGE_TAG=/d' .env
sudo systemctl start sigma-front-deploy.timer
```
