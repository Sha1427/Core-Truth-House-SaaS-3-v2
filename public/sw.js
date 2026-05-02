// Core Truth House service worker kill-switch
// Temporary file. Clears any old caches, unregisters itself, and gets out of the way.
// No fetch handler — browser uses default network handling, no race/retry/timeout deadlocks.

self.addEventListener("install", (event) => {
 self.skipWaiting();
});

self.addEventListener("activate", (event) => {
 event.waitUntil(
 (async () => {
 try {
 if ("caches" in self) {
 const keys = await caches.keys();
 await Promise.all(keys.map((key) => caches.delete(key)));
 }
 if (self.registration) {
 await self.registration.unregister();
 }
 } catch (error) {
 // never throw during activation
 }
 })()
 );
});
