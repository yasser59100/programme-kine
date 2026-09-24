// KinéForce — Service Worker v2
// Réseau d'abord pour l'appli (les mises à jour s'affichent dès la première ouverture),
// cache en secours hors connexion. Bibliothèques et polices : cache d'abord.
const VERSION = 'kineforce-v7';
const APP_FILES = [
  './',
  'index.html',
  'manifest.json',
  'assets/js/kine-flow.js',
  'assets/js/kine-avatar.js',
  'assets/js/kine-routines.js',
  'assets/js/kine-suivi.js',
  'assets/js/kine-community.js',
  'assets/js/kine-programme.js',
  'assets/js/kine-layout.js',
  'assets/kine-premium.css',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png'
];
const STATIC_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (cache) {
      // Chaque fichier est mis en cache séparément : un fichier manquant ne bloque pas l'installation
      return Promise.all(APP_FILES.map(function (f) { return cache.add(f).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function saveCopy(request, response) {
  if (response && response.ok && (response.type === 'basic' || response.type === 'cors')) {
    var copy = response.clone();
    caches.open(VERSION).then(function (cache) { cache.put(request, copy); });
  }
  return response;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // Bibliothèque 3D et polices : ne changent pas → cache d'abord
  if (STATIC_HOSTS.indexOf(url.hostname) >= 0) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { return saveCopy(req, res); });
    }));
    return;
  }

  // Fichiers de l'appli : réseau d'abord, cache si hors connexion
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (res) { return saveCopy(req, res); }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined);
        });
      })
    );
  }
  // Autres domaines (connexion, communauté) : comportement normal du navigateur
});

// ── Notifications ──
self.addEventListener('push', function (e) {
  var data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'KinéForce', {
    body: data.body || 'Votre séance du jour vous attend.',
    icon: data.icon || 'assets/icons/icon-192.png',
    badge: 'assets/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || './' },
    actions: [{ action: 'open', title: 'Ouvrir le programme' }, { action: 'dismiss', title: 'Plus tard' }]
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cls) {
    if (cls.length > 0) return cls[0].focus();
    return clients.openWindow(e.notification.data.url || './');
  }));
});
