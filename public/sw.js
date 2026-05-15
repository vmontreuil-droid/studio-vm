// Studio VM — minimal service worker
// Network-first for navigations, cached offline fallback.

const CACHE = "studio-vm-v1";
const OFFLINE_URLS = ["/nl/offline", "/fr/offline", "/en/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Navigations: network-first, fall back to offline page in matching locale
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const url = new URL(request.url);
        const seg = url.pathname.split("/")[1];
        const locale = ["nl", "fr", "en"].includes(seg) ? seg : "nl";
        const cached = await caches.match(`/${locale}/offline`);
        return cached ?? caches.match("/nl/offline");
      }),
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (
    request.url.includes("/_next/static/") ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached ?? network;
      }),
    );
  }
});
