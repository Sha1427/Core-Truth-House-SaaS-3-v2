/**
 * sw.js
 * Core Truth House OS — Service Worker
 *
 * CACHING STRATEGY:
 *   App shell (HTML, JS, CSS):  Cache First — instant loads
 *   API calls to /api/*:        Network First — always fresh data
 *   Static assets (icons, fonts): Cache First with long TTL
 *   AI generations:             Network Only — never cache, always live
 */

var CACHE_VERSION  = 'cth-os-v3'
var SHELL_CACHE    = CACHE_VERSION + '-shell'
var DATA_CACHE     = CACHE_VERSION + '-data'
var ASSET_CACHE    = CACHE_VERSION + '-assets'

// App shell — these files load instantly from cache
var SHELL_FILES = [
  '/',
  '/dashboard',
  '/brand-audit',
  '/brand-foundation',
  '/brand-memory',
  '/offline.html',
  '/manifest.json',
]

// Routes that should NEVER be cached (always need live server)
var NEVER_CACHE = [
  '/api/content/generate',
  '/api/media/generate',
  '/api/ai/',
  '/api/auth/',
  '/api/workspaces/stripe/',
]

// Authentication routes — ALWAYS go to network (Clerk multi-step flow)
var AUTH_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/sso-callback',
]

// API routes worth caching for offline reading
var CACHEABLE_API = [
  '/api/brand-memory',
  '/api/brand-foundation',
  '/api/strategic-os',
  '/api/brand-audit/latest',
  '/api/workspaces/',
]

// ── Install ────────────────────────────────────────────────

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function(cache) {
        console.log('[SW] Pre-caching app shell')
        return cache.addAll(SHELL_FILES)
      })
      .then(function() {
        return self.skipWaiting()
      })
  )
})

// ── Activate ───────────────────────────────────────────────

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) {
              return name.startsWith('cth-os-') && name !== CACHE_VERSION
                && name !== SHELL_CACHE && name !== DATA_CACHE && name !== ASSET_CACHE
            })
            .map(function(name) {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(function() {
        return self.clients.claim()
      })
  )
})

// ── Fetch ──────────────────────────────────────────────────

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url)

  if (url.origin !== location.origin) return

  var path = url.pathname

  // ── Never cache AI generation routes
  if (NEVER_CACHE.some(function(p) { return path.startsWith(p) })) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          JSON.stringify({ error: 'offline', message: 'AI generation requires an internet connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      })
    )
    return
  }

  // ── Authentication routes — ALWAYS Network Only (Clerk multi-step flow)
  // This is critical: Clerk redirects between /sign-in -> /sign-in/factor-one etc.
  // Caching these breaks the authentication flow. Must be checked BEFORE static assets.
  var isAuthRoute = AUTH_ROUTES.some(function(route) { 
    return path.startsWith(route) || path === route
  })
  
  if (isAuthRoute) {
    event.respondWith(
      fetch(event.request)
        .catch(function() {
          return caches.match('/offline.html')
        })
    )
    return
  }

  // ── API routes — Network First
  if (path.startsWith('/api/')) {
    var isCacheable = CACHEABLE_API.some(function(p) { return path.startsWith(p) })

    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (isCacheable && response.ok) {
            var clone = response.clone()
            caches.open(DATA_CACHE).then(function(cache) {
              cache.put(event.request, clone)
            })
          }
          return response
        })
        .catch(function() {
          if (isCacheable) {
            return caches.match(event.request).then(function(cached) {
              if (cached) return cached
              return new Response(
                JSON.stringify({ error: 'offline', cached: false }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
              )
            })
          }
          return new Response(
            JSON.stringify({ error: 'offline', message: 'This feature requires an internet connection.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          )
        })
    )
    return
  }

  // ── Static assets — Cache First
  if (
    path.startsWith('/icons/') ||
    path.startsWith('/fonts/') ||
    path.startsWith('/images/') ||
    path.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached
        return fetch(event.request).then(function(response) {
          if (response.ok) {
            var clone = response.clone()
            caches.open(ASSET_CACHE).then(function(cache) {
              cache.put(event.request, clone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // ── Navigation (HTML pages) — Cache First + Network Update
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then(function(cached) {
          var fetchPromise = fetch(event.request)
            .then(function(response) {
              if (response.ok) {
                var clone = response.clone()
                caches.open(SHELL_CACHE).then(function(cache) {
                  cache.put(event.request, clone)
                })
              }
              return response
            })
            .catch(function() {
              return caches.match('/offline.html')
            })

          return cached || fetchPromise
        })
    )
    return
  }
})

// ── Background Sync ────────────────────────────────────────

self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-brand-memory') {
    event.waitUntil(syncBrandMemory())
  }
  if (event.tag === 'sync-brand-foundation') {
    event.waitUntil(syncBrandFoundation())
  }
})

async function syncBrandMemory() {
  try {
    var db = await openSyncDB()
    var tx = db.transaction('pending-brand-memory', 'readonly')
    var store = tx.objectStore('pending-brand-memory')
    var req = store.getAll()
    var pendingUpdates = await new Promise(function(r) { req.onsuccess = function() { r(req.result) } })
    for (var update of pendingUpdates) {
      await fetch('/api/brand-memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': update.token, 'X-Workspace-ID': update.workspaceId },
        body: JSON.stringify(update.data),
      })
      var delTx = db.transaction('pending-brand-memory', 'readwrite')
      delTx.objectStore('pending-brand-memory').delete(update.id)
    }
  } catch (err) {
    console.error('[SW] Sync failed:', err)
  }
}

async function syncBrandFoundation() {
  try {
    var db = await openSyncDB()
    var tx = db.transaction('pending-brand-foundation', 'readonly')
    var store = tx.objectStore('pending-brand-foundation')
    var req = store.getAll()
    var pendingUpdates = await new Promise(function(r) { req.onsuccess = function() { r(req.result) } })
    for (var update of pendingUpdates) {
      await fetch('/api/brand-foundation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': update.token, 'X-Workspace-ID': update.workspaceId },
        body: JSON.stringify(update.data),
      })
      var delTx = db.transaction('pending-brand-foundation', 'readwrite')
      delTx.objectStore('pending-brand-foundation').delete(update.id)
    }
  } catch (err) {
    console.error('[SW] Sync failed:', err)
  }
}

function openSyncDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open('cth-sync-queue', 1)
    req.onupgradeneeded = function(e) {
      var db = e.target.result
      if (!db.objectStoreNames.contains('pending-brand-memory'))
        db.createObjectStore('pending-brand-memory', { keyPath: 'id', autoIncrement: true })
      if (!db.objectStoreNames.contains('pending-brand-foundation'))
        db.createObjectStore('pending-brand-foundation', { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = function(e) { resolve(e.target.result) }
    req.onerror = function(e) { reject(e.target.error) }
  })
}

// ── Push Notifications ─────────────────────────────────────

self.addEventListener('push', function(event) {
  if (!event.data) return
  var data = event.data.json()

  var options = {
    body: data.body || 'Check your brand dashboard',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'cth-notification',
    data: { url: data.url || '/dashboard' },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Core Truth House OS',
      options
    )
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  var url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(function(clients) {
        for (var client of clients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})

// ── Skip waiting on message ────────────────────────────────

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
