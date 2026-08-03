/* ============================================================
   ui.js — 共用介面元件（Toast、彈窗）
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const ui = FG.ui = {};
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
  // opts: { title, body(HTMLElement|string), buttons:[{label, cls, close, onClick}], dismissable, cardClass }
  ui.modal = function (opts) {
    const root = document.getElementById('modalRoot');
    const wrap = FG.el('div', 'modal' + (opts.cardClass ? ' ' + opts.cardClass : ''));

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

    const handle = {
      el: wrap,
      body: body,
      close: function () {
        modalStack.pop();
        root.classList.remove('on');
        root.innerHTML = '';
        if (opts.onClose) opts.onClose();
        // 若堆疊中還有上一層，重新開啟
        const prev = modalStack.pop();
        if (prev) ui.modal(prev);
      }
    };

    root.onclick = function (e) {
      if (e.target === root && opts.dismissable !== false) handle.close();
    };
    modalStack.push(opts);
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
