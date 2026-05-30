// ========== SERVICE WORKER PARA TOTALBIZ 2.0 ==========
const CACHE_NAME = 'totalbiz-v2.0.0';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/database.js',
  './js/auth.js',
  './js/sidebar.js',
  './js/backup.js',
  './js/support.js',
  './js/icons.js',
  './pages/dashboard.html',
  './pages/products.html',
  './pages/sellers.html',
  './pages/sales.html',
  './pages/reports.html',
  './pages/exchange.html',
  './pages/payment-methods.html',
  './pages/guide.html',
  './manifest.json'
];

// Instalación: guardar archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones y responder desde caché o red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});