/* ============================================================
   sw.js — Service Worker
   讓遊戲可安裝、可離線遊玩。

   ★ 發佈新版本時記得把 VERSION 加一。
     改了 VERSION 這個檔案的位元組就變了，瀏覽器才會察覺有新版本、
     重新安裝並清掉舊快取。不改的話舊快取會一直留著。
   ============================================================ */

const VERSION = 'v1';
const CACHE = 'fishing-' + VERSION;

// 全部用相對路徑，這樣部署在 GitHub Pages 的子路徑（/FishingGame/）也能運作
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/util.js',
  './js/pixel.js',
  './js/data.js',
  './js/state.js',
  './js/ui.js',
  './js/screen-fishing.js',
  './js/screen-daily.js',
  './js/screen-home.js',
  './js/screen-shop.js',
  './js/screen-codex.js',
  './js/pwa.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png',
  './icons/favicon-32.png'
];

/* ---------- 安裝：預先快取所有資源 ---------- */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      // 個別 add，單一檔案失敗不會讓整包 addAll 掛掉
      .then(function (c) {
        return Promise.all(ASSETS.map(function (url) {
          return c.add(new Request(url, { cache: 'reload' })).catch(function (err) {
            console.warn('[sw] 預先快取失敗：', url, err);
          });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

/* ---------- 啟用：清掉舊版本快取 ---------- */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k !== CACHE && k.indexOf('fishing-') === 0) return caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

/* ---------- 取用資源 ---------- */
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 外部資源不插手（本專案其實也沒有）

  // 導覽請求（開啟頁面）：優先走網路，讓新版本能立刻生效；離線才回快取
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(function (res) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
          return res;
        })
        .catch(function () {
          return caches.match('./index.html').then(function (r) { return r || caches.match('./'); });
        })
    );
    return;
  }

  // 其他資源：stale-while-revalidate
  // 先回快取（開得快、離線可用），同時背景抓新版寫回快取，下次載入就是新的
  e.respondWith(
    caches.match(req).then(function (cached) {
      const network = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});

/* ---------- 讓頁面能主動要求立刻套用新版 ---------- */
self.addEventListener('message', function (e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
