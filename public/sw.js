/* Libry Web Push service worker. Kept minimal and push-only — it does NOT cache
   or intercept navigation (offline caching, if added later, lives elsewhere). */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: "Libry", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Libry";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon.jpg",
    badge: data.badge || "/icon.jpg",
    data: { url: data.url || "/notifications" },
    tag: data.tag || undefined,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if one is already open, else open a new one.
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
