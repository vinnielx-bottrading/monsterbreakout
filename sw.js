/* Service worker: chơi offline sau lần tải đầu. Tăng VERSION mỗi lần deploy để người chơi nhận bản mới. */
const VERSION = 'mb-v5.0.0';
const CORE = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest', 'assets/icons/icon.svg', 'assets/icons/icon-192.png',
  'js/core.js', 'js/props.js', 'js/input.js', 'js/audio.js', 'js/weapons.js', 'js/hero.js', 'js/enemies.js',
  'js/items.js', 'js/skills.js', 'js/hud.js', 'js/game.js', 'js/gates/index.js', 'js/main.js',
  'js/gates/gate01-jungle.js', 'js/gates/gate02-mountain.js', 'js/gates/gate03-swamp.js', 'js/gates/gate04-snow.js',
  'js/gates/gate05-volcano.js', 'js/gates/gate06-ocean.js', 'js/gates/gate07-industrial.js', 'js/gates/gate08-city.js',
  'js/gates/gate09-lab.js', 'js/gates/gate10-apocalypse.js',
  'js/render3d.js', 'js/vendor/three.module.min.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// network-first: luôn lấy bản mới khi có mạng, rớt mạng thì dùng cache
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
