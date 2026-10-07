/* =====================================================================
   SERVICE WORKER: lưu app vào máy để mở được khi không có mạng.
   - File của app: lấy bản mới từ mạng trước (để luôn được cập nhật),
     mất mạng hoặc mạng quá chậm thì dùng bản đã lưu.
   - Font Google: lưu lại sau lần tải đầu.
   Khi sửa code, tăng số phiên bản CACHE để máy người dùng tải bản mới.
   ===================================================================== */
const CACHE = 'scn-app-v4';
const FONT_CACHE = 'scn-fonts';
const ASSETS = [
  './', 'index.html', 'app.js', 'engine.js',
  'brain/exercises.js', 'brain/programs.js', 'brain/nutrition.js', 'brain/rules.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Mạng trước. Lỗi mạng → dùng bản đã lưu. Quá 4 giây mà đã có bản lưu → dùng bản lưu, chưa có thì chờ mạng tiếp.
function networkFirst(req) {
  const cached = () => caches.match(req, {ignoreSearch: true})
    .then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : null));
  const net = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  return new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done && r) { done = true; resolve(r); } };
    net.then(finish).catch(() => cached().then(r => { if (!done) { done = true; resolve(r || Response.error()); } }));
    setTimeout(() => { if (!done) cached().then(finish); }, 4000);
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(req));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONT_CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }))));
  }
});
