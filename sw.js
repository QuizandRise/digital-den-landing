self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Keep all existing Digital Den routes and integrations network-transparent.
// This listener establishes PWA control without caching or rewriting requests.
self.addEventListener('fetch', () => {});
