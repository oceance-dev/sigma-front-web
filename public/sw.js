const CACHE_NAME = 'sigma-v2';

// Uniquement des assets vraiment statiques — jamais de routes HTML protégées
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne jamais intercepter :
  // - Requêtes non-GET (POST login, PUT, DELETE…)
  // - Requêtes vers d'autres origines (API AdonisJS)
  // - Routes BFF /api/ (auth cookies)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Assets statiques connus (icônes, manifest) → cache-first
  if (STATIC_ASSETS.some((p) => url.pathname === p)) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request))
    );
    return;
  }

  // Pages HTML (routes Next.js) → network-only
  // Pas de cache pour éviter de servir des pages périmées ou des redirects stale.
  // Fallback cache uniquement si le réseau est totalement indisponible (offline).
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'SIGMA', {
      body: data.body,
      icon: data.icon ?? '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
