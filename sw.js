// sw.js - Service Worker for Offline Caching & PWA Support

const CACHE_NAME = 'skycast-cache-v2';

// ഓഫ്‌ലൈനായി സേവ് ചെയ്യേണ്ട പ്രധാന ഫയലുകൾ (ലോക്കൽ ഫയലുകൾ - ഇവ നിർബന്ധമായും കാഷ് ചെയ്യണം)
const LOCAL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './api.js',
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
// മുൻപ് എല്ലാ ഫയലുകളും ഒറ്റ cache.addAll()-ൽ ആയിരുന്നു - ഒരു CDN റിക്വസ്റ്റ് (ഉദാ:
// ഫോണ്ട് / ലീഫ്‌ലെറ്റ്) പരാജയപ്പെട്ടാൽ (ഓഫ്‌ലൈൻ ആയോ, ബ്ലോക്ക് ചെയ്തോ) addAll() മുഴുവനായി
// പരാജയപ്പെടും, ലോക്കൽ ആപ്പ് ഫയലുകൾ പോലും കാഷ് ആവാതെ പോകും. ഇപ്പോൾ അത് വേർതിരിച്ചിരിക്കുന്നു.
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
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // കാഷിൽ ഉണ്ടെങ്കിൽ അവിടെ നിന്നും ലോഡ് ചെയ്യും
      }
      return fetch(event.request); // ഇല്ലെങ്കിൽ ഇന്റർനെറ്റിൽ നിന്ന് എടുക്കും
    })
  );
});