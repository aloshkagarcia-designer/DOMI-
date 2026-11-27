// DOMI — service worker: funciona sin conexión
const CACHE = 'domi-v7';
const ASSETS = ['./', 'index.html', 'styles.css', 'app.js', 'icon.svg', 'manifest.webmanifest', 'fonts.css', 'fonts/inter-latin-400-normal.woff2', 'fonts/inter-latin-600-normal.woff2', 'fonts/inter-tight-latin-700-normal.woff2', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Red primero para archivos propios (siempre la versión nueva), caché como respaldo
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
