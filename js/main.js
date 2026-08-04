/* ============================================================
   main.js — 啟動、分頁切換、頂部列、儲值、主迴圈
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const SCREENS = [FG.screenFishing, FG.screenDaily, FG.screenHome, FG.screenShop, FG.screenCodex];
  let active = null;
  let tabEls = {};

  /* ---------------- 分頁切換 ---------------- */
  FG.go = function (id, arg) {
    const s = SCREENS.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    SCREENS.forEach(function (x) { x._el.classList.toggle('active', x === s); });
    for (const k in tabEls) tabEls[k].classList.toggle('active', k === id);
    active = s;
    if (s.onShow) s.onShow(arg);
  };

  function buildTabs() {
    const bar = document.getElementById('tabbar');
    SCREENS.forEach(function (s) {
      const b = FG.el('button', 'tab');
      b.dataset.tab = s.id;   // 給外部（例如 devtools 的連點觸發）用來認出是哪一頁
      b.appendChild(FG.px.icon(s.icon, 2, '#e8f1f7', '#59a6ff'));
      b.appendChild(FG.el('span', '', s.label));
      b.onclick = function () { FG.sfx.click(); FG.go(s.id); };
      bar.appendChild(b);
      tabEls[s.id] = b;
    });
  }

  function refreshBadges() {
    const t = tabEls['daily'];
    if (!t) return;
    const has = FG.state.dailyBadge();
    let b = t.querySelector('.badge');
    if (has && !b) { b = FG.el('i', 'badge'); t.appendChild(b); }
    else if (!has && b) b.parentNode.removeChild(b);
  }

  /* ---------------- 頂部列 ---------------- */
  function refreshTop() {
    document.getElementById('chipsVal').textContent = FG.fmt(FG.state.data.chips);
    document.querySelector('#topLocBtn .loc-name').textContent = FG.state.loc().name;
    refreshBadges();
  }

  function bindTop() {
    const coin = document.querySelector('.coin-ico');
    const ic = FG.px.icon('coin', 1, '#8a6a20', '#ffd75e');
    coin.width = ic.width; coin.height = ic.height;
    coin.getContext('2d').drawImage(ic, 0, 0);

    document.getElementById('chipsBtn').onclick = function () { FG.sfx.click(); FG.openTopup(); };
    document.getElementById('topLocBtn').onclick = function () { FG.sfx.click(); FG.locationPicker(); };
  }

  /* ---------------- 釣點選單 ---------------- */
  FG.locationPicker = function () {
    const st = FG.state;
    const box = FG.el('div');
    // 卡片放進自己的捲動容器：釣點數量會成長，直接堆在 modal-body 裡會把下方的
    // 說明文字推出可視範圍（彈窗有 max-height，超出的部分要捲整個 body 才看得到）
    const list = FG.el('div', 'loc-list');
    box.appendChild(list);
    FG.LOCATIONS.forEach(function (loc) {
      const unlocked = st.isUnlocked(loc);
      const cur = st.data.loc === loc.id;
      const card = FG.el('div', 'loc-card' + (cur ? ' on' : '') + (unlocked ? '' : ' lock'));
      card.appendChild(FG.px.locThumb(loc, 76, 50));
      const info = FG.el('div', 'lc-info');
      info.innerHTML = '<div class="nm">' + FG.esc(loc.name) +
        (cur ? ' <span class="tag" style="color:#ffc44d">目前</span>' : '') + '</div>' +
        '<div class="ds">' + FG.esc(loc.subtitle) + '<br>拋竿 ' + FG.fmt(loc.castCost) + ' 籌碼／次</div>';
      card.appendChild(info);

      const act = FG.el('div');
      if (loc.comingSoon) {
        act.appendChild(FG.el('div', 'tiny mute', '即將<br>開放'));
      } else if (unlocked) {
        const b = FG.el('button', 'btn ' + (cur ? 'ghost' : 'primary'), cur ? '目前' : '前往');
        b.disabled = cur;
        b.onclick = function () {
          FG.sfx.click(); st.setLoc(loc); FG.ui.closeAll(); FG.go('fishing');
          FG.ui.toast('已前往 ' + loc.name, 'good');
        };
        act.appendChild(b);
      } else {
        const b = FG.el('button', 'btn gold', FG.fmtShort(loc.unlock.chips));
        b.onclick = function () {
          FG.sfx.click();
          FG.ui.confirm('解鎖 ' + loc.name, FG.esc(loc.desc) + '<br><br>花費 <span class="money">' + FG.fmt(loc.unlock.chips) + '</span> 籌碼永久解鎖？', '解鎖', function () {
            const r = st.unlockLoc(loc);
            if (r === 'ok') { FG.sfx.win(); st.setLoc(loc); FG.ui.closeAll(); FG.go('fishing'); FG.ui.toast('已解鎖 ' + loc.name + '！', 'gold', 2200); }
            else if (r === 'poor') { FG.sfx.fail(); FG.openTopup('籌碼不足'); }
          }, 'gold');
        };
        act.appendChild(b);
      }
      card.appendChild(act);
      list.appendChild(card);
    });
    // 數字由陣列長度算出來，加釣點就不用回來改文案（原本寫死「四個」，第五個上線後就錯了）
    const note = FG.el('div', 'tiny mute',
      FG.LOCATIONS.length + ' 個釣點都可以自由切換，不需要解鎖。每個釣點有專屬魚種與魚王，拋竿成本與產出也不同。');
    note.style.lineHeight = '1.8';
    box.appendChild(note);
    FG.ui.modal({ title: '選擇釣點', body: box });
    FG.ui.scrollEdges(list, 'y');
  };

  /* ---------------- 儲值（測試版：點擊直接發放） ---------------- */
  FG.openTopup = function (title) {
    const st = FG.state;
    const box = FG.el('div');

    const warn = FG.el('div', 'tiny', '測試版：尚未串接金流，點擊「購買」會直接發放籌碼。');
    warn.style.cssText = 'background:#2a2013;color:#ffc44d;padding:7px;margin-bottom:10px;box-shadow:0 0 0 1px #5a4520;line-height:1.6';
    box.appendChild(warn);

    FG.PACKS.forEach(function (p) {
      const bought = st.data.packsBought[p.id] || 0;
      const soldOut = p.once && bought > 0;
      const row = FG.el('div', 'pack');
      row.appendChild(chipStack(p));
      const pk = FG.el('div', 'pk');
      pk.innerHTML = '<div class="nm">' + FG.esc(p.name) + (p.once ? ' <span class="tag">限購一次</span>' : '') + '</div>' +
        '<div class="amt">' + FG.fmt(p.chips) + ' 籌碼</div>' +
        (p.bonus ? '<div class="bonus">加贈 ' + FG.fmt(p.bonus) + '</div>' : '') +
        (p.note ? '<div class="bonus">' + FG.esc(p.note) + '</div>' : '');
      row.appendChild(pk);
      const b = FG.el('button', 'btn ' + (soldOut ? 'ghost' : 'gold'), soldOut ? '已購買' : p.price);
      b.disabled = soldOut;
      b.onclick = function () {
        FG.sfx.click();
        const r = st.buyPack(p);
        if (r === 'ok') {
          FG.sfx.win();
          FG.ui.toast('已發放 ' + FG.fmt(p.chips + (p.bonus || 0)) + ' 籌碼', 'gold', 2200);
          FG.openTopup();
        }
      };
      row.appendChild(b);
      box.appendChild(row);
    });

    FG.ui.modal({ title: title || '取得籌碼', body: box, buttons: [{ label: '關閉', cls: 'ghost' }] });
  };

  // 籌碼堆圖示（依面額大小畫不同高度）
  function chipStack(p) {
    const cv = FG.px.make(38, 38);
    const g = cv.getContext('2d');
    const tiers = FG.PACKS.indexOf(p);
    const n = 2 + Math.min(4, tiers);
    const cols = ['#ffd75e', '#ffb347', '#ff8f6b', '#c98cff', '#6fd8ff'];
    for (let i = 0; i < n; i++) {
      const y = 30 - i * 5;
      g.fillStyle = FG.shade(cols[tiers % cols.length], -0.35);
      g.fillRect(9, y + 3, 20, 4);
      g.fillStyle = cols[tiers % cols.length];
      g.fillRect(9, y, 20, 4);
      g.fillStyle = FG.shade(cols[tiers % cols.length], 0.35);
      g.fillRect(12, y, 6, 1);
    }
    return cv;
  }

  /* ---------------- 開場說明 ---------------- */
  function intro() {
    if (FG.store.load('fg_seen_intro', false)) return;
    FG.store.save('fg_seen_intro', true);
    FG.ui.modal({
      title: '歡迎來到晨霧湖',
      body:
        '<div class="tiny" style="line-height:2">' +
        '這是一款用<b>籌碼</b>下竿的釣魚小遊戲。<br><br>' +
        '· 每次拋竿都要付出籌碼與一份餌料<br>' +
        '· 釣起來的魚可以<b>賣掉換籌碼</b>，或<b>收藏</b>到家園魚缸展示<br>' +
        '· 更好的釣竿、餌料與裝備會拉高稀有魚與<b>魚王</b>的機率<br>' +
        '· 每個釣點都有專屬魚種與一位魚王，牠們各自有自己的傳說<br><br>' +
        '<span class="mute">初始贈送 20,000 籌碼。籌碼不足時可從右上角「＋」取得（測試版直接發放）。</span>' +
        '</div>',
      buttons: [{ label: '開始釣魚', cls: 'primary' }]
    });
  }

  /* ---------------- 設定 ---------------- */
  FG.openSettings = function () {
    const st = FG.state;
    const box = FG.el('div');
    const row = FG.el('div', 'row');
    row.style.marginBottom = '10px';
    const lab = FG.el('div', '', '音效');
    lab.style.flex = '1';
    row.appendChild(lab);
    const sb = FG.el('button', 'btn ' + (FG.sfx.on ? 'primary' : 'ghost'), FG.sfx.on ? '開啟' : '關閉');
    sb.onclick = function () {
      FG.sfx.on = !FG.sfx.on;
      st.data.sfx = FG.sfx.on; st.save();
      sb.textContent = FG.sfx.on ? '開啟' : '關閉';
      sb.className = 'btn ' + (FG.sfx.on ? 'primary' : 'ghost');
      if (FG.sfx.on) FG.sfx.click();
    };
    row.appendChild(sb);
    box.appendChild(row);

    /* --- 安裝到主畫面 --- */
    const inst = FG.el('div', 'set-row');
    inst.appendChild(FG.el('div', 'set-label', '安裝'));
    if (FG.pwa.isStandalone()) {
      inst.appendChild(FG.el('div', 'tiny mute', '已安裝為 App，目前正從主畫面開啟。'));
    } else if (FG.pwa.canInstall()) {
      const ib = FG.el('button', 'btn gold block', '安裝到主畫面');
      ib.onclick = function () {
        FG.pwa.promptInstall(function (r) {
          if (r === 'accepted') FG.ui.toast('安裝完成', 'good');
        });
      };
      inst.appendChild(ib);
    } else if (FG.pwa.isIOS()) {
      inst.appendChild(FG.el('div', 'tiny mute', FG.esc(FG.pwa.iosHint)));
    } else {
      inst.appendChild(FG.el('div', 'tiny mute', '在瀏覽器選單中選擇「安裝應用程式 / 加到主畫面」即可安裝。'));
    }
    box.appendChild(inst);

    const rb = FG.el('button', 'btn danger block', '清除存檔並重新開始');
    rb.onclick = function () {
      FG.ui.confirm('重置遊戲', '所有籌碼、圖鑑、收藏與家園都會清空，無法復原。確定嗎？', '確定重置', function () {
        st.reset();
        FG.ui.closeAll();
        FG.go('fishing');
        FG.ui.toast('已重置存檔', 'bad');
      }, 'danger');
    };
    box.appendChild(rb);

    box.appendChild(FG.el('div', 'tiny mute', '<br>本作為展示用 Demo，未串接任何金流，所有籌碼皆為虛擬且無法兌換。'));
    FG.ui.modal({ title: '設定', body: box });
  };

  /* ---------------- 主迴圈 ---------------- */
  function loop(now) {
    if (active && active.frame) {
      try { active.frame(now || 0); } catch (e) { console.error(e); }
    }
    requestAnimationFrame(loop);
  }

  /* ---------------- 啟動 ---------------- */
  function boot() {
    FG.state.init();

    const host = document.getElementById('screens');
    SCREENS.forEach(function (s) {
      const el = s.build();
      s._el = el;
      host.appendChild(el);
    });

    buildTabs();
    bindTop();
    refreshTop();

    FG.state.on('all', refreshTop);

    FG.go('fishing');
    intro();
    requestAnimationFrame(loop);

    // 首次觸控時解鎖 WebAudio
    document.addEventListener('pointerdown', function once() {
      FG.sfx.init();
      document.removeEventListener('pointerdown', once);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window.FG);
