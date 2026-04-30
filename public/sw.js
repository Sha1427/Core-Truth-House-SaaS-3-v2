// Core Truth House active service worker kill switch
// Temporary file. It clears old app-shell caches, unregisters itself, and reloads controlled tabs.

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

 await self.clients.claim();

 const clientsList = await self.clients.matchAll({
 type: "window",
 includeUncontrolled: true,
 });

 for (const client of clientsList) {
 try {
 client.postMessage({ type: "CTH_SW_CACHE_CLEARED" });
 client.navigate(client.url);
 } catch (error) {
 // ignore client navigation errors
 }
 }

 if (self.registration) {
 await self.registration.unregister();
 }
 } catch (error) {
 // keep worker from throwing during activation
 }
 })()
 );
});

self.addEventListener("fetch", (event) => {
 // Force network. Do not serve cached app shell.
 event.respondWith(fetch(event.request));
});
