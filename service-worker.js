const CACHE_NAME = "anesthesia-board-review-v34-legacy-escape";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=34",
  "./questions.js?v=34",
  "./app.js?v=34",
  "./manifest.webmanifest?v=34",
  "./manifest.json",
  "./sw.js?v=18",
  "./icons/favicon-32.png?v=34",
  "./icons/favicon-48.png?v=34",
  "./icons/apple-touch-icon.png?v=34",
  "./icons/icon-192.png?v=34",
  "./icons/icon-512.png?v=34",
  "./icons/icon-192.svg?v=34",
  "./icons/header-logo.svg?v=34",
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
