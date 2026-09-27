/**
 * The site used to ship an offline-capable service worker. Browsers that still
 * have it registered fetch this file on their next visit, so it removes every
 * cache, unregisters itself and reloads open tabs from the network.
 */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
        await self.registration.unregister()
        const clients = await self.clients.matchAll({ type: 'window' })
        clients.forEach((client) => client.navigate(client.url))
    })())
})
