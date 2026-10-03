/* Service worker: chơi offline sau lần tải đầu. Tăng VERSION mỗi lần deploy để người chơi nhận bản mới. */
const VERSION = 'mb-v8.3.1';
const CORE = [
  './', 'index.html', 'css/fonts.css', 'css/style.css', 'assets/fonts/chakra-petch-latin-600-normal.woff2', 'manifest.webmanifest', 'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/icon-maskable-192.png', 'assets/icons/icon-maskable-512.png', 'assets/icons/apple-touch-icon.png', 'assets/icons/favicon-32.png', 'assets/hunter/body.webp', 'assets/hunter/portrait.webp', 'assets/hunter/dossier.webp',
  'js/core.js', 'js/props.js', 'js/input.js', 'js/audio.js', 'js/weapons.js', 'js/hero.js', 'js/enemies.js',
  'js/items.js', 'js/skills.js', 'js/arsenal.js', 'js/progress.js', 'js/cloud.js', 'js/access.js', 'js/story.js', 'js/ally.js', 'js/hud.js', 'js/game.js', 'js/gates/index.js', 'js/main.js', 'js/creepers.js',
  'js/gates/gate01-jungle.js', 'js/gates/gate02-mountain.js', 'js/gates/gate03-swamp.js', 'js/gates/gate04-snow.js',
  'js/gates/gate05-volcano.js', 'js/gates/gate06-ocean.js', 'js/gates/gate07-industrial.js', 'js/gates/gate08-city.js',
  'js/gates/gate09-lab.js', 'js/gates/gate10-apocalypse.js', 'js/gates/gate11-hanoi.js', 'js/gates/gate12-hoian.js', 'js/gates/gate13-halong.js', 'js/gates/gate14-sapa.js', 'js/gates/gate15-hue.js', 'js/gates/gate16-danang.js', 'js/gates/gate17-dalat.js',
  'js/gates/gate18-saigon.js',
  'js/gates/gate19-mientay.js',
  'js/gates/gate20-thatson.js',
  'js/gates/gate21-alpha.js',
  'js/render3d.js', 'js/vendor/three.module.min.js', 'js/vendor/three-addons.min.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// network-first: luôn lấy bản mới khi có mạng, rớt mạng thì dùng cache
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('/version.json')) return; // luôn hỏi thẳng server, không cache
  e.respondWith(
    fetch(e.request.mode === 'navigate' ? e.request : new Request(e.request, { cache: 'no-cache' })).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
