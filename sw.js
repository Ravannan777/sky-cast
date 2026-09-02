// sw.js - Service Worker for Offline Caching & PWA Support

// FIX: bumped v2 -> v3. Without a version bump, browsers that already
// installed this service worker keep serving the OLD cached JS/CSS forever
// (that's a classic source of "the bug is still there after I fixed it"
// reports) — the activate handler below only clears caches whose name
// doesn't match CACHE_NAME, so this bump is what forces the refresh.
const CACHE_NAME = 'skycast-cache-v3';

// ഓഫ്‌ലൈനായി സേവ് ചെയ്യേണ്ട പ്രധാന ഫയലുകൾ (ലോക്കൽ ഫയലുകൾ - ഇവ നിർബന്ധമായും കാഷ് ചെയ്യണം)
const LOCAL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './api.js',
  './utils.js',
  './lifestyleLogic.js',
  './map.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// പുറത്തുനിന്നുള്ള (CDN) ഫയലുകൾ - ഇവ ഓപ്ഷണൽ ആണ്, ഒന്ന് പരാജയപ്പെട്ടാലും ബാക്കി ഇൻസ്റ്റാൾ തടസ്സപ്പെടരുത്
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// 1. Service Worker ഇൻസ്റ്റാൾ ചെയ്യുമ്പോൾ ഫയലുകൾ കാഷ് ചെയ്യുന്നു
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Caching local app shell');
      await cache.addAll(LOCAL_ASSETS);

      console.log('[Service Worker] Caching external assets (best-effort)');
      await Promise.all(
        EXTERNAL_ASSETS.map((url) =>
          cache.add(url).catch((err) =>
            console.warn('[Service Worker] Skipped external asset:', url, err)
          )
        )
      );
    })
  );
  self.skipWaiting();
});

// 2. പഴയ കാഷുകൾ ക്ലിയർ ചെയ്യുന്നു (Activate event)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. ഫെച്ച് റിക്വസ്റ്റുകൾ വരുമ്പോൾ (Cache-First Network Fallback)
self.addEventListener('fetch', (event) => {
  // FIX: only intercept safe GET requests. Previously every request (POST,
  // and cross-origin API calls to Open-Meteo/BigDataCloud) went through
  // caches.match() too — harmless for GET, but non-GET requests would throw
  // "Request method 'X' is unsupported" when caches.match() tried to read
  // them, which is exactly the kind of noisy console error users see.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => cachedResponse);
    })
  );
});
