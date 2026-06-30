// Cleanup service worker — unregisters itself and clears all caches
self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      }),
      self.registration.unregister()
    ]).then(function() {
      return self.clients.matchAll();
    }).then(function(clients) {
      clients.forEach(function(client) {
        client.navigate(client.url);
      });
    })
  );
});
