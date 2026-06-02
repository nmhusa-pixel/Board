const CACHE_NAME = "anesthesia-board-review-v16-header-icon";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=16",
  "./questions.js?v=16",
  "./app.js?v=16",
  "./manifest.webmanifest?v=16",
  "./manifest.json",
  "./icons/favicon-32.png?v=16",
  "./icons/favicon-48.png?v=16",
  "./icons/apple-touch-icon.png?v=16",
  "./icons/icon-192.png?v=16",
  "./icons/icon-512.png?v=16",
  "./icons/icon-192.svg?v=16",
  "./icons/header-logo.svg?v=16",
  "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
