const CACHE_VERSION = 'v3'
const CACHE_NAME = `fidelite-${CACHE_VERSION}`

const PRECACHE_ROUTES = ['/', '/carte', '/historique', '/profil', '/offres']

// Install — precache shell routes
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ROUTES))
  )
  self.skipWaiting()
})

// Activate — delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch strategy:
//  - API calls   → network only (never cache, always fresh)
//  - Uploads     → network only
//  - Navigation  → network first, fallback to cache
//  - Assets      → cache first, fallback to network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // API & uploads — network only
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return

  // HTML navigation — network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return res
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return res
      })
    })
  )
})

// ── Push notifications ──────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return
  let payload
  try { payload = event.data.json() } catch { return }

  const title = payload.title ?? 'Fidélité'
  const options = {
    body:    payload.body ?? '',
    icon:    payload.icon  ?? '/icons/icon-192.png',
    badge:   payload.badge ?? '/icons/icon-192.png',
    data:    { url: payload.url ?? '/carte', sound: payload.sound ?? null },
    vibrate: payload.silent ? [] : [200, 100, 200],
    silent:  payload.silent ?? false,
  }

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Broadcast to open clients so they can play the custom sound
      if (payload.sound) {
        return self.clients.matchAll({ type: 'window' }).then(list => {
          list.forEach(client => client.postMessage({ type: 'PLAY_SOUND', sound: payload.sound }))
        })
      }
    })
  )
})

// Open the app when notification is clicked
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/carte'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(url) && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
