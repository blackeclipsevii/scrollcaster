const CACHE_NAME = 'scrollcaster-cache-v1';
const assetsToCache = [
  '/',
  '/index.html',
  '/bundle.js',
  "/lib/lib.css",
  "/lib/css/contextMenu.css", // can probably merge all this css..
  "/lib/css/draggable.css",
  "/lib/css/items.css",
  "/lib/css/modal.css",
  "/lib/css/root.css",
  "/lib/css/slideBanner.css",
  "/lib/css/toggleSwitch.css",
  "/pages/css/builder.css",
  "/pages/css/pages.css",
  "/pages/css/rosters.css",
  "/pages/css/searchbar.css",
  "/pages/css/warscroll.css",
  "/resources/dropped-scrolls.jpg", // is there a way to merge images and pick out pieces like a video game dev?
  "/resources/kofi_symbol-edited.png",
  "/resources/manifest.json",
  "/resources/scrollcaster-icon.ico",
  "/resources/scrollcaster-icon.png",
  "/resources/support_me_on_kofi_beige.webp",
  "/resources/flaticon/001-sword.png",
  "/resources/flaticon/002-flag.png",
  "/resources/flaticon/003-circle.png",
  "/resources/flaticon/004-cursor.png",
  "/resources/flaticon/005-star.png",
  "/resources/flaticon/006-archery.png",
  "/resources/flaticon/007-shield.png",
  "/resources/flaticon/008-skull.png",
  "/resources/flaticon/009-right-arrow.png",
  "/resources/flaticon/010-loupe.png",
  "/resources/flaticon/011-open-book.png",
  "/resources/flaticon/012-left-arrow.png",
  "/resources/flaticon/013-gear.png",
  "/resources/flaticon/014-plus-symbol-button.png",
  "/resources/flaticon/015-minus.png",
  "/resources/flaticon/016-danger.png",
  "/resources/flaticon/017-check.png",
  "/resources/flaticon/018-dots.png",
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(assetsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) 
            return caches.delete(key);
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});