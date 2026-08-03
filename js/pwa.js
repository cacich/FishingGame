/* ============================================================
   pwa.js — Service Worker 註冊、安裝流程、更新提示
   載入順序必須在 ui.js 之後（要用 FG.ui.toast）、main.js 之前
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const pwa = FG.pwa = {
    deferred: null,      // beforeinstallprompt 事件，Chrome 系才有
    dismissKey: 'fg_install_dismissed'
  };

  /* ---------------- 狀態查詢 ---------------- */

  // 是否已經以 App 形式開啟（安裝後從主畫面點進來）
  pwa.isStandalone = function () {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           window.navigator.standalone === true;
  };

  pwa.isIOS = function () {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };

  // 只有 Chrome/Edge/Samsung 這類會丟 beforeinstallprompt 的瀏覽器才有原生安裝鈕
  pwa.canInstall = function () { return !!pwa.deferred; };

  pwa.promptInstall = function (cb) {
    if (!pwa.deferred) { if (cb) cb('unsupported'); return; }
    const d = pwa.deferred;
    pwa.deferred = null;
    hideChip();
    d.prompt();
    d.userChoice.then(function (r) {
      if (cb) cb(r && r.outcome === 'accepted' ? 'accepted' : 'dismissed');
    }).catch(function () { if (cb) cb('dismissed'); });
  };

  // iOS Safari 沒有安裝 API，只能給文字指引
  pwa.iosHint = '在 Safari 下方工具列點「分享」，選擇「加入主畫面」即可安裝。';

  /* ---------------- 底部安裝提示條 ---------------- */

  function showChip() {
    if (document.getElementById('installChip')) return;
    if (pwa.isStandalone()) return;
    if (FG.store.load(pwa.dismissKey, false)) return;

    const chip = FG.el('div', 'install-chip');
    chip.id = 'installChip';
    chip.innerHTML = '<span class="ic-txt">把遊戲安裝到主畫面，開啟更快也能離線玩</span>';

    const ok = FG.el('button', 'btn gold', '安裝');
    ok.onclick = function () {
      FG.sfx.click();
      pwa.promptInstall(function (r) {
        if (r === 'accepted') FG.ui.toast('安裝完成，可以從主畫面開啟了', 'good', 2400);
      });
    };
    const no = FG.el('button', 'ic-x', '✕');
    no.onclick = function () {
      FG.sfx.click();
      FG.store.save(pwa.dismissKey, true);
      hideChip();
    };
    chip.appendChild(ok);
    chip.appendChild(no);
    document.body.appendChild(chip);
  }

  function hideChip() {
    const c = document.getElementById('installChip');
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }
  pwa.hideChip = hideChip;

  /* ---------------- 事件 ---------------- */

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();          // 擋掉瀏覽器預設的迷你提示，改由我們自己決定時機
    pwa.deferred = e;
    // 等遊戲畫面建好再冒出來，不要跟開場說明搶版面
    setTimeout(showChip, 4000);
  });

  window.addEventListener('appinstalled', function () {
    pwa.deferred = null;
    hideChip();
    FG.store.save(pwa.dismissKey, true);
    if (FG.ui) FG.ui.toast('已安裝到主畫面', 'good');
  });

  /* ---------------- Service Worker ---------------- */

  // file:// 下沒有 serviceWorker（也不需要），要擋掉否則會拋錯
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        reg.addEventListener('updatefound', function () {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', function () {
            // 有 controller 代表這是「更新」而不是「第一次安裝」
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              if (FG.ui) FG.ui.toast('有新版本，重新整理即可更新', 'gold', 4000);
            }
          });
        });
      }).catch(function (err) {
        console.warn('[pwa] Service Worker 註冊失敗：', err);
      });
    });
  }

})(window.FG);
