const CACHE_NAME = 'neuromicon-core-v2';
const CORE_ASSETS =[
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install: Cache only the shell/core UI
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('> SW: Caching core architecture.');
            return cache.addAll(CORE_ASSETS);
        })
    );
});

// Activate: Clear old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: Stale-While-Revalidate for images, Network-First for Audio
self.addEventListener('fetch', event => {
    const req = event.request;

    // Do not cache MP3s to save device memory, stream them instead.
    if (req.url.endsWith('.mp3')) {
        event.respondWith(fetch(req));
        return;
    }

    // Cache-First strategy for Images and UI
    event.respondWith(
        caches.match(req).then(cachedResponse => {
            if (cachedResponse) {
                // Fetch in background to update cache
                fetch(req).then(networkResponse => {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(req, networkResponse.clone());
                    });
                }).catch(() => {});
                return cachedResponse;
            }
            return fetch(req).then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(req, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});