// Cleanup service worker — replaces old workbox, clears all caches, unregisters itself
self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      // Delete ALL caches (old workbox, runtime, everything)
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      }),
      // Unregister this cleanup SW — it has no other purpose
      self.registration.unregister()
    ]).then(function() {
      // Force-reload all open pages to pick up the new code
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then(function(clients) {
      clients.forEach(function(client) {
        if (client.url && client.url.startsWith(self.location.origin)) {
          client.navigate(client.url);
        }
      });
    })
  );
});

// Pass-through fetch — don't intercept any requests
self.addEventListener('fetch', function() {});
