// ── Cache names ──────────────────────────────────────────────────────────────
// Bump CACHE_VERSION to invalidate all caches on deploy
const CACHE_VERSION  = 'v5'
const CACHE_STATIC   = `fid-static-${CACHE_VERSION}`   // Next.js hashed assets
const CACHE_PAGES    = `fid-pages-${CACHE_VERSION}`     // HTML shells
const CACHE_FONTS    = `fid-fonts-${CACHE_VERSION}`     // Google / system fonts

const MAX_STATIC     = 80   // max entries in static cache
const MAX_PAGES      = 10   // max cached HTML pages

// ── Assets à précacher au premier install ─────────────────────────────────────
// ⚠️ NE PAS précacher les routes HTML avec données utilisateur (/carte, etc.)
//    → risque de servir des données d'un autre user + données périmées
const PRECACHE_ASSETS = [
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// ── Activate — purge old cache versions ──────────────────────────────────────
self.addEventListener('activate', event => {
  const current = new Set([CACHE_STATIC, CACHE_PAGES, CACHE_FONTS])
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !current.has(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Cross-origin (analytics, external APIs) → passthrough
  if (url.origin !== self.location.origin) return

  // API & upload routes → ALWAYS network only (never stale auth/data)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return

  // Next.js hashed static assets (_next/static/**) → Cache-First
  // Safe because filename changes with every build
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(CACHE_STATIC, event.request, MAX_STATIC))
    return
  }

  // Public static files (icons, images, manifest) → Stale-While-Revalidate
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(staleWhileRevalidate(CACHE_STATIC, event.request, MAX_STATIC))
    return
  }

  // Google Fonts / external fonts → Cache-First (immutable with cache-busting URL)
  if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(cacheFirst(CACHE_FONTS, event.request, 30))
    return
  }

  // HTML navigation → Network-First with offline fallback
  // Freshness wins; cached shell used only when offline
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(event.request))
    return
  }

  // Everything else → Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(CACHE_STATIC, event.request, MAX_STATIC))
})

// ── Strategies ────────────────────────────────────────────────────────────────

/** Cache-First: serve from cache, fetch + update on miss */
async function cacheFirst(cacheName, request, maxEntries) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const res = await fetch(request)
    if (res.ok) {
      const cache = await caches.open(cacheName)
      await trimCache(cache, maxEntries - 1)
      cache.put(request, res.clone())
    }
    return res
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

/** Stale-While-Revalidate: return cached immediately, update in background */
async function staleWhileRevalidate(cacheName, request, maxEntries) {
  const cache  = await caches.open(cacheName)
  const cached = await cache.match(request)

  // Fire network request in background regardless of cache hit
  const networkPromise = fetch(request).then(res => {
    if (res.ok) {
      trimCache(cache, maxEntries - 1)
      cache.put(request, res.clone())
    }
    return res
  }).catch(() => null)

  // Return cached immediately (or await network if no cache)
  return cached ?? (await networkPromise) ?? new Response('Offline', { status: 503 })
}

/** Network-First for HTML: fresh content; cached shell if offline */
async function networkFirstWithOfflineFallback(request) {
  try {
    const res = await fetch(request)
    if (res.ok) {
      const cache = await caches.open(CACHE_PAGES)
      await trimCache(cache, MAX_PAGES - 1)
      cache.put(request, res.clone())
    }
    return res
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // Last resort: show offline page
    const offline = await caches.match('/offline.html')
    return offline ?? new Response('<h1>Hors ligne</h1>', {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

/** Keep cache under maxEntries by deleting oldest entry */
async function trimCache(cache, maxEntries) {
  const keys = await cache.keys()
  if (keys.length <= maxEntries) return
  // Delete oldest entries first (FIFO approximation)
  await Promise.all(keys.slice(0, keys.length - maxEntries).map(k => cache.delete(k)))
}

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return
  let payload
  try { payload = event.data.json() } catch { return }

  const title   = payload.title  ?? 'Fidélité'
  const options = {
    body:    payload.body   ?? '',
    icon:    payload.icon   ?? '/icons/icon-192.png',
    badge:   payload.badge  ?? '/icons/icon-192.png',
    data:    { url: payload.url ?? '/carte', sound: payload.sound ?? null },
    vibrate: payload.silent ? [] : [200, 100, 200],
    silent:  payload.silent ?? false,
  }

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      if (!payload.sound) return
      return self.clients.matchAll({ type: 'window' }).then(list =>
        list.forEach(c => c.postMessage({ type: 'PLAY_SOUND', sound: payload.sound }))
      )
    })
  )
})

// ── Notification click — focus or open app ───────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/carte'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(targetUrl) && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(targetUrl)
    })
  )
})
