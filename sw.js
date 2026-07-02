const CACHE_NAME = 'flourish-v11-1'; // +8 plans: relationships suite, emotional healing, generous life (26 plans / 431 days)
const SHELL = [
  './',
  './index.html',
  './flourish-v10.css',
  './flourish-v10.js',
  './flourish-mana.js',
  './flourish-cinematic.css',
  './flourish-art.js',
  './flourish-commerce.js',
  './flourish-commerce.css',
  './manifest.json'
];
const DATA = [
  './data/year1.json',
  './data/year2.json',
  './data/year3.json',
  './data/plans.json',
  './data/catalog.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL).then(() =>
        // Data files are large — cache best-effort, don't block install
        Promise.allSettled(DATA.map(u => cache.add(u)))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Never intercept Supabase API calls
  if (url.hostname.endsWith('.supabase.co')) return;

  if (url.pathname.includes('/data/')) {
    // Data: cache-first (immutable per release), fall back to network
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      }))
    );
    return;
  }
  if (url.origin === location.origin) {
    // Shell: network-first so updates land, cache fallback for offline
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
  }
});
