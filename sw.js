/* ============================================================
   sw.js — Service Worker
   讓遊戲可安裝、可離線遊玩。

   ★ 發佈新版本時記得把 VERSION 加一。
     改了 VERSION 這個檔案的位元組就變了，瀏覽器才會察覺有新版本、
     重新安裝並清掉舊快取。不改的話舊快取會一直留著。
   ============================================================ */

const VERSION = 'v10';
const CACHE = 'fishing-' + VERSION;

// 程式碼類資產走 network-first 時，等網路的上限（毫秒）。超時就回快取，
// 避免在訊號差的環境下開啟遊戲卡住。
const NET_TIMEOUT = 2500;

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
  './js/cutin.js',
  './js/screen-fishing.js',
  './js/screen-daily.js',
  './js/screen-home.js',
  './js/screen-shop.js',
  './js/screen-codex.js',
  './js/pwa.js',
  './js/devtools.js',
  './js/main.js',
  './assets/sprites/mist-lake/ml_boot.png',
  './assets/sprites/mist-lake/ml_can.png',
  './assets/sprites/mist-lake/ml_weed.png',
  './assets/sprites/mist-lake/ml_crucian.png',
  './assets/sprites/mist-lake/ml_bluegill.png',
  './assets/sprites/mist-lake/ml_loach.png',
  './assets/sprites/mist-lake/ml_smallcarp.png',
  './assets/sprites/mist-lake/ml_minnow.png',
  './assets/sprites/mist-lake/ml_smelt.png',
  './assets/sprites/mist-lake/ml_trout.png',
  './assets/sprites/mist-lake/ml_bass.png',
  './assets/sprites/mist-lake/ml_whitefish.png',
  './assets/sprites/mist-lake/ml_perch.png',
  './assets/sprites/mist-lake/ml_catfish.png',
  './assets/sprites/mist-lake/ml_goldcarp.png',
  './assets/sprites/mist-lake/ml_pike.png',
  './assets/sprites/mist-lake/ml_koi.png',
  './assets/sprites/mist-lake/ml_char.png',
  './assets/sprites/mist-lake/ml_eel.png',
  './assets/sprites/mist-lake/ml_sturgeon.png',
  './assets/sprites/mist-lake/ml_gar.png',
  './assets/sprites/mist-lake/ml_arowana.png',
  './assets/sprites/mist-lake/ml_spirit.png',
  './assets/sprites/mist-lake/ml_king_onde.png',
  './assets/scenes/mist-lake-background.png',
  './assets/scenes/mist-lake-thumbnail.png',
  './assets/scenes/garden-pond-background.png',
  './assets/scenes/garden-pond-thumbnail.png',
  './assets/scenes/rapids-background.png',
  './assets/scenes/rapids-thumbnail.png',
  './assets/scenes/sunset-fjord-background.png',
  './assets/scenes/sunset-fjord-thumbnail.png',
  './assets/scenes/coral-reef-background.png',
  './assets/scenes/coral-reef-thumbnail.png',
  './assets/scenes/sakura-shrine-background.png',
  './assets/scenes/sakura-shrine-thumbnail.png',
  './assets/scenes/tide-flat-background.png',
  './assets/scenes/tide-flat-thumbnail.png',
  './assets/scenes/frost-lake-background.png',
  './assets/scenes/frost-lake-thumbnail.png',
  './assets/scenes/fall-pool-background.png',
  './assets/scenes/fall-pool-thumbnail.png',
  './assets/scenes/lotus-river-background.png',
  './assets/scenes/lotus-river-thumbnail.png',
  './assets/scenes/caldera-background.png',
  './assets/scenes/caldera-thumbnail.png',
  './assets/scenes/abyss-background.png',
  './assets/scenes/abyss-thumbnail.png',
  './assets/scenes/world-root-background.png',
  './assets/scenes/world-root-thumbnail.png',
  './assets/scenes/duat-background.png',
  './assets/scenes/duat-thumbnail.png',
  './assets/scenes/cavern-background.png',
  './assets/scenes/cavern-thumbnail.png',
  './assets/scenes/dawn-port-background.png',
  './assets/scenes/dawn-port-thumbnail.png',
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

/* ---------- 取用策略 ----------

   程式碼類（html / js / css / webmanifest）→ network-first
     GitHub Pages 送的是 Cache-Control: max-age=600，瀏覽器的 HTTP 快取會把檔案
     留住 10 分鐘。若這裡用一般的 fetch()，即使 SW 想抓新版也可能被 HTTP 快取攔下來
     回舊檔。所以一律用 cache:'no-cache' 強制跟伺服器對 ETag（命中就是 304，很便宜）。
     這讓「推上去 → 重載一次」就會拿到新版，不必等 10 分鐘也不必重載兩次。

   圖片類 → cache-first
     圖示幾乎不會變，而且是位元組大宗，沒必要每次都對伺服器問。
     真的換圖時把 VERSION 加一，install 階段會強制重抓。
*/

const CODE_RE = /\.(?:html|js|css|webmanifest)$/i;

function isCodeAsset(url) {
  return url.pathname.endsWith('/') || CODE_RE.test(url.pathname);
}

// 強制向伺服器驗證的 fetch（繞過瀏覽器 HTTP 快取，但仍走 ETag 協商）
function fetchFresh(url) {
  return fetch(new Request(url, { cache: 'no-cache', credentials: 'same-origin' }));
}

function timeoutAfter(ms) {
  return new Promise(function (_, reject) {
    setTimeout(function () { reject(new Error('network timeout')); }, ms);
  });
}

function putInCache(req, res) {
  if (res && res.status === 200) {
    const copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
  }
  return res;
}

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 外部資源不插手（本專案其實也沒有）

  const navigate = req.mode === 'navigate';

  if (navigate || isCodeAsset(url)) {
    e.respondWith(
      Promise.race([fetchFresh(req.url), timeoutAfter(NET_TIMEOUT)])
        .then(function (res) { return putInCache(req, res); })
        .catch(function () {
          // 離線或逾時：回快取；導覽請求另外退回 index.html
          return caches.match(req).then(function (cached) {
            if (cached) return cached;
            if (navigate) {
              return caches.match('./index.html').then(function (r) {
                return r || caches.match('./');
              });
            }
            return Response.error();
          });
        })
    );
    return;
  }

  // 圖片等靜態資產：cache-first
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) { return putInCache(req, res); });
    })
  );
});

/* ---------- 讓頁面能主動要求立刻套用新版 ---------- */
self.addEventListener('message', function (e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
