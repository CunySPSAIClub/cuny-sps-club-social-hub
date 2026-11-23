/* CUNY SPS Club Social Hub - App-Shell Service Worker
 * Security rule: NEVER cache /api/* responses (shared campus computers).
 * Only caches the static app shell (HTML, JS, CSS, fonts, icons) and offline fallback.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `club-hub-shell-${CACHE_VERSION}`;
const FONT_CACHE = `club-hub-fonts-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/club-social-hub-mark.svg',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/favicon.ico',
];

const STATIC_EXT_RE = /\.(?:js|mjs|css|woff2?|ttf|otf|png|jpg|jpeg|webp|gif|svg|ico|webmanifest)$/i;

function isApiRequest(url) {
  return url.pathname === '/api' || url.pathname.startsWith('/api/');
}

function isViteDevInternal(url) {
  return (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@fs/') ||
    url.pathname.startsWith('/@id/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/src/')
  );
}

function isGoogleFontHost(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)
        )
      );
    })
  );
  // Do NOT auto-call self.skipWaiting() here so the app can display
  // the "Update available - Refresh" banner before activating the new version.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith('club-hub-') && key !== SHELL_CACHE && key !== FONT_CACHE
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // CRITICAL: Never intercept or cache any /api/* requests (shared computer privacy)
  if (url.origin === self.location.origin && isApiRequest(url)) {
    return;
  }

  // Never cache Vite dev module endpoints
  if (url.origin === self.location.origin && isViteDevInternal(url)) {
    return;
  }

  // Navigation requests (HTML pages): network-first, fall back to friendly offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok && url.pathname === '/') {
            const copy = networkResponse.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy)).catch(() => {});
          }
          return networkResponse;
        } catch {
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) return offlinePage;
          return new Response('Offline — please reconnect to use CUNY SPS Club Social Hub.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      })()
    );
    return;
  }

  // Google Fonts: cache-first
  if (isGoogleFontHost(url)) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Same-origin static app-shell assets (JS, CSS, icons, images, manifest): stale-while-revalidate
  if (url.origin === self.location.origin && STATIC_EXT_RE.test(url.pathname)) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === 'basic') {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          })
          .catch(() => null);

        if (cached) {
          event.waitUntil(networkPromise);
          return cached;
        }

        const networkResponse = await networkPromise;
        return networkResponse || Response.error();
      })
    );
  }
});
