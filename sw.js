// KinéForce — Service Worker v2
// Réseau d'abord pour l'appli (les mises à jour s'affichent dès la première ouverture),
// cache en secours hors connexion. Bibliothèques et polices : cache d'abord.
const VERSION = 'kineforce-v100';
const VOIX = 'kineforce-voix';   // jamais vidé à chaque mise à jour
const POSE = 'kineforce-pose-0.10.35';   // outil d'analyse caméra : téléchargé une fois, gardé entre les versions
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
  'assets/js/kine-ressenti.js',
  'assets/js/kine-layout.js',
  'assets/js/kine-savoir.js',
  'assets/js/kine-mascotte.js',
  'assets/js/kine-niveau.js',
  'assets/js/kine-biblio.js',
  'assets/js/kine-compose.js',
  'assets/js/kine-officiel.js',
  'assets/js/kine-harmonie.js',
  'assets/js/kine-metronome.js',
  'assets/js/kine-celebration.js',
  'assets/js/kine-idees.js',
  'assets/js/kine-notifs.js',
  'assets/js/kine-lexique.js',
  'assets/js/kine-gestes.js',
  'assets/js/kine-souple.js',
  'assets/js/kine-variantes.js',
  'assets/js/kine-reactif.js',
  'assets/js/kine-camera.js',
  'assets/js/kine-explique.js',
  'assets/js/kine-lumiere.js',
  'assets/js/kine-installer.js',
  'assets/js/kine-scenes.js',
  'assets/js/kine-ludique.js',
  'assets/js/kine-createur.js',
  'assets/js/kine-eveil.js',
  'assets/kine-premium.css',
  'assets/kine-harmonie.css',
  'assets/kine-lumiere.css',
  'assets/fonts/bricolage-grotesque-latin-700-normal.woff2',
  'assets/fonts/bricolage-grotesque-latin-800-normal.woff2',
  'assets/fonts/figtree-latin-400-normal.woff2',
  'assets/fonts/figtree-latin-500-normal.woff2',
  'assets/fonts/figtree-latin-600-normal.woff2',
  'assets/fonts/figtree-latin-700-normal.woff2',
  'assets/lumiere/yass-salut.webp',
  'assets/lumiere/yass-bravo.webp',
  'assets/lumiere/video-fente.webp',
  'assets/lumiere/yass-anim/salut.webp',
  'assets/lumiere/yass-anim/joie.webp',
  'assets/lumiere/yass-anim/biceps.webp',
  'assets/lumiere/yass-anim/etire.webp',
  'assets/lumiere/yass-anim/pouce.webp',
  'assets/illus/walk.webp',
  'assets/illus/back.webp',
  'assets/illus/knee.webp',
  'assets/illus/muscle.webp',
  'assets/illus/brain.webp',
  'assets/illus/moral.webp',
  'assets/illus/sleep.webp',
  'assets/illus/balance.webp',
  'assets/illus/lungs.webp',
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
      return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== VOIX && k !== POSE; }).map(function (k) { return caches.delete(k); }));
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

  // Voix enregistrée : chaque fichier a un nom unique et ne change jamais → cache d'abord, gardé entre les versions
  if (url.origin === self.location.origin && /\/assets\/voix\/[^/]+\.mp3$/.test(url.pathname)) {
    e.respondWith(caches.open(VOIX).then(function (cache) {
      return cache.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res && res.ok) cache.put(req, res.clone()); return res; });
      });
    }));
    return;
  }

  // Outil d'analyse caméra (gros fichiers qui ne changent pas) → cache d'abord, gardé entre les versions
  if (url.origin === self.location.origin && url.pathname.indexOf('/assets/pose/') >= 0) {
    e.respondWith(caches.open(POSE).then(function (cache) {
      return cache.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res && res.ok) cache.put(req, res.clone()); return res; });
      });
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

// ── Notifications du jour (« Le saviez-vous ? », « Vrai ou faux ») ──
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'KinéForce', {
    body: d.body || '', icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png',
    tag: d.tag || 'kf-jour', data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  var what = new URL(url).searchParams.get('ouvrir');
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) { list[i].postMessage({ kfOuvrir: what }); return list[i].focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
