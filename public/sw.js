/* AMedix service worker — background Web Push only.
 *
 * Responsibilities are deliberately narrow:
 *  1. show a push message when the app is closed or in the background;
 *  2. open the exact AMedix page on click, re-authenticating in the app;
 *  3. never cache, never intercept fetches, never touch clinical data.
 *
 * The payload the server sends is already privacy-safe (no diagnosis, no
 * medication name, no patient name), so nothing sensitive is written to the
 * lock screen by this worker. It also refuses to render a body longer than the
 * server's own preview limit, as a second guard against a careless caller.
 */

const MAX_BODY = 140;
// The app's own logo (the same asset the PWA manifest and emails use), so a
// notification is recognisably AMedix without shipping extra image files.
const DEFAULT_ICON =
  "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/a11f18a92_logo.jpg";
const DEFAULT_URL = "/";

function safeBody(text) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= MAX_BODY) return value;
  return `${value.slice(0, MAX_BODY - 1)}…`;
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { title: "AMedix", body: "You have a new notification." };
  }

  const title = String(payload.title || "AMedix");
  const options = {
    body: safeBody(payload.body || "You have a new notification."),
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_ICON,
    tag: payload.tag || "amedix",
    renotify: false,
    requireInteraction: false,
    silent: false,
    data: { url: payload.url || DEFAULT_URL },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || DEFAULT_URL;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Reuse an open AMedix window when there is one, so the patient does not
      // end up with a stack of tabs.
      for (const client of clientList) {
        const url = new URL(client.url);
        if (url.origin === self.location.origin) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
