/* eslint-disable no-restricted-globals */
/**
 * Placeholder service worker at the legacy FCM path.
 *
 * Without this file, requests to /firebase-messaging-sw.js are handled by
 * Next.js app routes (e.g. /[category]) and can cause 500s and bad builds.
 *
 * FCM has been removed from the app; this SW is a no-op so the URL returns
 * valid JS and registered workers stay harmless.
 */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
