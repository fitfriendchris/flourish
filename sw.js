const CACHE_NAME='flourish-v1';
const STATIC_ASSETS=[
  '/flourish/',
  '/flourish/index.html',
  '/flourish/app.html',
  '/flourish/flourish.html',
  '/flourish/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap'
];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache=>{
      return cache.addAll(STATIC_ASSETS);
    }).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(names=>{
      return Promise.all(
        names.filter(n=>n!==CACHE_NAME).map(n=>caches.delete(n))
      );
    }).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const{request}=e;
  const url=new URL(request.url);

  if(request.method!=='GET')return;

  // Network-first for curriculum data (always fresh)
  if(url.pathname.includes('/data/')){
    e.respondWith(
      fetch(request).then(response=>{
        const clone=response.clone();
        caches.open(CACHE_NAME).then(c=>c.put(request,clone));
        return response;
      }).catch(()=>caches.match(request))
    );
    return;
  }

  // Stale-while-revalidate for HTML
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

  // Cache-first for everything else
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