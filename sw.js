const CACHE_NAME = 'neuromicon-core-v3';
const CORE_ASSETS =[
    './',
    './index.html',
    './manifest.json'
];

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

self.addEventListener('fetch', event => {
    const req = event.request;

    // СИСТЕМНЫЙ БАЙПАС ДЛЯ АУДИО:
    // Мы полностью пропускаем MP3 файлы мимо Service Worker-а, 
    // чтобы не ломать Range Requests в браузерах.
    if (req.url.match(/\.(mp3|MP3)$/)) {
        return; 
    }

    // Для остальных ресурсов (HTML, изображения) используем кэш
    event.respondWith(
        caches.match(req).then(cachedResponse => {
            if (cachedResponse) {
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
