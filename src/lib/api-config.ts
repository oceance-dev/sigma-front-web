// API_URL : var runtime (non-NEXT_PUBLIC_), modifiable sans rebuild.
// Fallback sur NEXT_PUBLIC_API_URL pour la compatibilité dev local.
export const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL)!
