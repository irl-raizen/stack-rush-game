/* Stack Rush — minimal offline-first service worker */
const CACHE = "stack-rush-v2"
const CORE = ["/manifest.json", "/icon.svg"]
const NEXT_ASSET = "/_next/"
const API_PREFIX = "/api/"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => undefined),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return

  const url = new URL(req.url)
  // Never cache Next.js chunks, RSC payloads, API responses, or development/HMR traffic.
  if (url.pathname.startsWith(NEXT_ASSET) || url.pathname.startsWith(API_PREFIX) || url.pathname.includes("__nextjs_") || url.searchParams.has("_rsc")) {
    event.respondWith(fetch(req))
    return
  }

  // Network-first for navigations, cache-first for stable static assets.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => undefined)
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
    )
    return
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => undefined)
          }
          return res
        })
        .catch(() => cached)
    }),
  )
})
