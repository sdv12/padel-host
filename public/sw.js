// Service worker mínimo (Fase 4, punto 18): solo lo necesario para que la app
// sea instalable y funcione un poco offline. A propósito NO cachea agresivo
// (nada de "cache first" para HTML/JSON) para no mostrar datos viejos de
// turnos/disponibilidad — esto es un directorio con datos que cambian todo el
// tiempo, no un sitio estático.
const CACHE = "quien-saco-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return; // solo navegación de página completa
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});
