const CACHE_NAME='kingdom-excellence-v1';
const STATIC_ASSETS=[
  '/flourish/',
  '/flourish/flourish.html',
  '/flourish/index.html'
];

// Install: cache static assets
self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache=>{
      return cache.addAll(STATIC_ASSETS);
    }).then(()=>self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(names=>{
      return Promise.all(
        names.filter(n=>n!==CACHE_NAME).map(n=>caches.delete(n))
      );
    }).then(()=>self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for HTML, network-first for others
self.addEventListener('fetch',e=>{
  const{request}=e;
  const url=new URL(request.url);

  // Skip non-GET requests
  if(request.method!=='GET')return;

  // For HTML pages: serve from cache immediately, update in background
  if(request.mode==='navigate'||request.destination==='document'){
    e.respondWith(
      caches.match(request).then(cached=>{
        const fetchPromise=fetch(request).then(response=>{
          if(response.ok){
            const clone=response.clone();
            caches.open(CACHE_NAME).then(c=>c.put(request,clone));
          }
          return response;
        }).catch(()=>cached);
        return cached||fetchPromise;
      })
    );
    return;
  }

  // For static assets (CDNs): cache first, network fallback
  e.respondWith(
    caches.match(request).then(cached=>{
      if(cached)return cached;
      return fetch(request).then(response=>{
        if(response.ok){
          const clone=response.clone();
          caches.open(CACHE_NAME).then(c=>c.put(request,clone));
        }
        return response;
      });
    })
  );
});
