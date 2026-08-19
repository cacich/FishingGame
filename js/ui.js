/* ============================================================
   ui.js — 共用介面元件（Toast、彈窗）
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const ui = FG.ui = {};
  // 彈窗堆疊。每次開窗都 push 一個獨立的 entry 物件，close() 靠**物件識別**找自己的位置，
  // 而不是假設「自己一定在最上層」——關閉順序並不保證後進先出：modal-foot 的按鈕是
  // 「先跑 onClick、再自動 close()」，onClick 裡若開了新彈窗，輪到 close() 時自己已經
  // 不是最上層了。用 pop() 會誤把新彈窗踢掉再把自己重開，症狀就是「按鈕好像沒作用，
  // 只是把同一個視窗又叫出來一次」。
  let modalStack = [];

  /* ---------------- Toast ---------------- */
  ui.toast = function (msg, kind, ms) {
    const root = document.getElementById('toastRoot');
    const t = FG.el('div', 'toast' + (kind ? ' ' + kind : ''), msg);
    root.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .25s';
      t.style.opacity = '0';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, ms || 1600);
  };

  /* ---------------- 彈窗 ---------------- */
  // opts: { title, body(HTMLElement|string), buttons:[{label, cls, close, onClick}], dismissable, cardClass, fullscreen }
  ui.modal = function (opts) {
    const root = document.getElementById('modalRoot');
    const wrap = FG.el('div', 'modal' + (opts.cardClass ? ' ' + opts.cardClass : ''));

    // 全螢幕模式仍沿用同一套堆疊與關閉邏輯，只改 root 的留白與卡片尺寸。
    // 這樣地圖庫上再開確認窗時，關掉確認窗仍能回到原本的搜尋／捲動狀態。
    root.classList.toggle('fullscreen', opts.fullscreen === true);

    if (opts.title !== false) {
      const head = FG.el('div', 'modal-head', FG.esc(opts.title || ''));
      const x = FG.el('button', 'x', '✕');
      x.onclick = function () { FG.sfx.click(); handle.close(); };
      head.appendChild(x);
      wrap.appendChild(head);
    }

    const body = FG.el('div', 'modal-body');
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);
    wrap.appendChild(body);

    if (opts.buttons && opts.buttons.length) {
      const foot = FG.el('div', 'modal-foot');
      opts.buttons.forEach(function (b) {
        const btn = FG.el('button', 'btn ' + (b.cls || ''), FG.esc(b.label));
        btn.onclick = function () {
          FG.sfx.click();
          if (b.onClick) b.onClick(handle);
          if (b.close !== false) handle.close();
        };
        foot.appendChild(btn);
      });
      wrap.appendChild(foot);
    }

    root.innerHTML = '';
    root.appendChild(wrap);
    root.classList.add('on');

    const entry = { opts: opts };

    const handle = {
      el: wrap,
      body: body,
      close: function () {
        const i = modalStack.indexOf(entry);
        if (i < 0) return;                       // 已經關過（或被 closeAll 清掉），重複呼叫是 no-op
        const isTop = i === modalStack.length - 1;
        modalStack.splice(i, 1);
        if (opts.onClose) opts.onClose();
        // 不是最上層 → 畫面已經被更上層的彈窗接管，只從堆疊移除，不要碰 DOM
        if (!isTop) return;
        root.classList.remove('on');
        root.classList.remove('fullscreen');
        root.innerHTML = '';
        // 若堆疊中還有上一層，重新開啟
        const prev = modalStack.pop();
        if (prev) ui.modal(prev.opts);
      }
    };

    root.onclick = function (e) {
      if (e.target === root && opts.dismissable !== false) handle.close();
    };
    modalStack.push(entry);
    return handle;
  };

  ui.confirm = function (title, msg, okLabel, onOk, okCls) {
    return ui.modal({
      title: title,
      body: '<div class="tiny" style="line-height:1.8">' + msg + '</div>',
      buttons: [
        { label: '取消', cls: 'ghost' },
        { label: okLabel || '確定', cls: okCls || 'primary', onClick: onOk }
      ]
    });
  };

  ui.closeAll = function () {
    modalStack = [];
    const root = document.getElementById('modalRoot');
    root.classList.remove('on');
    root.classList.remove('fullscreen');
    root.innerHTML = '';
  };

  /* ---------------- 常用小元件 ---------------- */

  // 稀有度標籤
  ui.rarityTag = function (rarityKey) {
    const R = FG.RARITY[rarityKey];
    const s = FG.el('span', 'tag', FG.esc(R.name));
    s.style.color = R.color;
    s.style.boxShadow = '0 0 0 1px ' + R.color + '55';
    return s;
  };

  // 魚的縮圖（放進 .thumb 用）
  ui.fishThumb = function (fish, scale) {
    const cv = FG.px.spriteEl(fish, scale || 1);
    return cv;
  };

  // 捲動容器的邊緣提示：依目前捲動位置掛上／拿掉 .at-start / .at-end。
  // CSS 用這兩個 class 決定要不要在該側畫漸層遮罩（見 styles.css › .seg-scroll）。
  //
  // 為什麼需要：桌機沒有觸控慣性，一條被截斷的橫向清單看起來就只是「被切掉」而不是
  // 「可以捲」。兩端的漸層是唯一不佔空間又看得懂的提示。
  // 可重複呼叫（會先移除舊的 listener），內容重繪之後直接再呼叫一次即可。
  ui.scrollEdges = function (el, axis) {
    if (!el) return;
    const horiz = axis !== 'y';
    function upd() {
      const size = horiz ? el.clientWidth : el.clientHeight;
      const total = horiz ? el.scrollWidth : el.scrollHeight;
      const pos = horiz ? el.scrollLeft : el.scrollTop;
      // 完全放得下就兩端都不畫遮罩（at-start + at-end 會關掉 mask）
      const room = total - size;
      el.classList.toggle('at-start', pos <= 1);
      el.classList.toggle('at-end', pos >= room - 1);
      el.classList.toggle('scrollable', room > 1);
    }
    if (el._sedge) el.removeEventListener('scroll', el._sedge);
    el._sedge = upd;
    el.addEventListener('scroll', upd);
    upd();
    return upd;
  };

})(window.FG);
