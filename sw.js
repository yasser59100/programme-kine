// KinéForce Service Worker v1
const CACHE = 'kineforce-v1';
const OFFLINE_PAGE = 'index.html';

// Fichiers à mettre en cache au premier lancement
const PRECACHE = [
  'programme-kine-v3.html',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'
];

// ── Installation : précache ──
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // On précache le HTML principal; la police est optionnelle (réseau requis)
      return cache.add(OFFLINE_PAGE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activation : nettoyage anciens caches ──
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch : cache-first pour le HTML, network-first pour le reste ──
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Ignorer les requêtes non-GET
  if (e.request.method !== 'GET') return;

  // Stratégie "cache-first" pour le fichier principal
  if (url.includes('index.html') || url.includes('sw.js') || url.includes('manifest')) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        var networkFetch = fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
          }
          return response;
        }).catch(function() { return cached; });
        return cached || networkFetch;
      })
    );
    return;
  }

  // Stratégie "network-first avec fallback cache" pour tout le reste (polices, etc.)
  e.respondWith(
    fetch(e.request).then(function(response) {
      if (response && response.status === 200 && response.type !== 'opaque') {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match(OFFLINE_PAGE);
      });
    })
  );
});

// ── Push notifications ──
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  var title = data.title || 'KinéForce';
  var options = {
    body: data.body || 'Votre séance du jour vous attend 💪',
    icon: data.icon || 'icon-192.png',
    badge: 'icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '.' },
    actions: [
      { action: 'open', title: 'Ouvrir le programme' },
      { action: 'dismiss', title: 'Plus tard' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cls) {
      if (cls.length > 0) { return cls[0].focus(); }
      return clients.openWindow(e.notification.data.url || '.');
    })
  );
});
