// Minimal offline service worker for Country Maker.
// Network-first for navigations (never brick on a stale shell), cache-first for static assets.
const VERSION = "v1";
const SHELL_CACHE = `country-maker-shell-${VERSION}`;
const ASSET_CACHE = `country-maker-assets-${VERSION}`;
const PRECACHE_URLS = ["/", "/manifest.json", "/icon.png", "/apple-icon.png"];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .catch(() => {}),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE).map((key) => caches.delete(key)));
            await self.clients.claim();
        })(),
    );
});

function isStaticAsset(url) {
    return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/icons/") || /\.(png|jpg|jpeg|svg|webp|ico|woff2?|ttf)$/.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Navigations: network-first so a bad/stale cache can never brick the app.
    if (request.mode === "navigate") {
        event.respondWith(
            (async () => {
                try {
                    const response = await fetch(request);
                    const cache = await caches.open(SHELL_CACHE);
                    cache.put("/", response.clone());
                    return response;
                } catch {
                    const cache = await caches.open(SHELL_CACHE);
                    return (await cache.match("/")) || Response.error();
                }
            })(),
        );
        return;
    }

    // Static assets: cache-first, filled in from the network on first use.
    if (isStaticAsset(url)) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(ASSET_CACHE);
                const cached = await cache.match(request);
                if (cached) return cached;
                try {
                    const response = await fetch(request);
                    if (response.ok) cache.put(request, response.clone());
                    return response;
                } catch {
                    return cached || Response.error();
                }
            })(),
        );
    }
});
