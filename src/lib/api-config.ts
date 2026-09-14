// API_URL : var runtime (non-NEXT_PUBLIC_), modifiable sans rebuild.
// Fallback sur NEXT_PUBLIC_API_URL pour la compatibilité dev local.
// Server-only : ne pas importer ce module depuis un composant client.
export const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL)!

// Chemin de base des routes backend (Traefik Host+PathPrefix `/sigma-adonisjs`,
// AdonisJS routes.ts groupe `.prefix('/sigma-adonisjs/v1')`). Constante fixe
// (pas de var d'env) car son seul usage côté client est de retirer ce préfixe
// d'une URL renvoyée par le backend — voir app/dashboard/document/page.tsx.
export const API_BASE_PATH = '/sigma-adonisjs/v1'

import type { NextRequest } from 'next/server'

// Extrait la vraie IP client pour la forwarder à AdonisJS
// (évite que le rate limiter bloque toutes les requêtes depuis l'IP du container Next.js)
export function clientIpHeaders(req: NextRequest): Record<string, string> {
  const ip = req.headers.get('x-real-ip')
           ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim()
           ?? req.headers.get('cf-connecting-ip')
  return ip ? { 'X-Forwarded-For': ip, 'X-Real-IP': ip } : {}
}
