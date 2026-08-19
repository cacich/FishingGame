/* ============================================================
   screen-daily.js — 每日：簽到 + 每日任務
   （原本示意圖下方兩個「每日」在此整合為單一分頁）
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const S = FG.screenDaily = {
    id: 'daily',
    label: '每日',
    icon: 'calendar',
    el: null,

    build: function () {
      const el = FG.el('section', 'screen');
      el.id = 'screen-daily';
      el.innerHTML = '<div class="scroll" id="dailyBody"></div>';
      this.el = el;
      FG.state.on('daily', function () { if (S.el) S.render(); });
      FG.state.on('loc', function () { if (S.el) S.render(); });
      return el;
    },

    onShow: function () { FG.state.rollDaily(); this.render(); },

    render: function () {
      if (!this.el) return;
      const st = FG.state;
      const root = this.el.querySelector('#dailyBody');
      root.innerHTML = '';

      /* --- 每日簽到 --- */
      const sst = st.signinState();
      const p1 = FG.el('div', 'panel');
      p1.appendChild(FG.el('div', 'panel-title', '每日簽到 <span class="sub">連續第 ' + (sst.streak % 7 + (sst.canClaim ? 1 : 0) || 7) + ' 天</span>'));

      const grid = FG.el('div', 'signin-grid');
      FG.SIGNIN.forEach(function (r, i) {
        const claimedIdx = sst.streak % 7;
        const got = i < claimedIdx || (!sst.canClaim && i === (sst.streak - 1) % 7);
        const isToday = sst.canClaim && i === claimedIdx;
        const cell = FG.el('div', 'signin-cell' + (got ? ' got' : '') + (isToday ? ' today' : ''));
        cell.innerHTML = '<div class="d">第 ' + r.day + ' 天</div><div class="r">' + FG.fmtShort(r.chips) + '</div>' +
          (r.bait ? '<div class="d" style="color:#5fd08a">餌×' + r.bait.n + '</div>' : '<div class="d">&nbsp;</div>');
        grid.appendChild(cell);
      });
      p1.appendChild(grid);

      const btn = FG.el('button', 'btn block ' + (sst.canClaim ? 'gold' : 'ghost'), sst.canClaim ? '領取今日獎勵' : '今天已領取');
      btn.style.marginTop = '10px';
      btn.disabled = !sst.canClaim;
      btn.onclick = function () {
        FG.sfx.click();
        const r = st.claimSignin();
        if (r) {
          FG.sfx.win();
          FG.ui.toast('簽到獲得 ' + FG.fmt(r.chips) + ' 籌碼' + (r.bait ? ' + 餌料×' + r.bait.n : ''), 'gold', 2200);
        }
      };
      p1.appendChild(btn);
      root.appendChild(p1);

      /* --- 每日任務 --- */
      const p2 = FG.el('div', 'panel');
      p2.appendChild(FG.el('div', 'panel-title', '每日任務 <span class="sub">每天 00:00 重置</span>'));
      FG.MISSIONS.forEach(function (m) {
        const ms = st.missionState(m);
        const row = FG.el('div', 'mission');
        const mi = FG.el('div', 'mi');
        mi.innerHTML = '<div class="mt">' + FG.esc(m.name) + ' <span class="mute tiny">' + ms.cur + '/' + m.target + '</span></div>' +
          '<div class="bar"><i style="width:' + (ms.cur / m.target * 100) + '%"></i></div>';
        row.appendChild(mi);
        if (ms.claimed) {
          row.appendChild(FG.el('div', 'mr mute', '已領取'));
        } else if (ms.done) {
          const b = FG.el('button', 'btn gold', '+' + FG.fmtShort(m.reward));
          b.style.padding = '7px 8px';
          b.style.fontSize = '12px';
          b.onclick = function () {
            FG.sfx.click();
            if (st.claimMission(m)) { FG.sfx.coin(); FG.ui.toast('任務完成 +' + FG.fmt(m.reward) + ' 籌碼', 'gold'); }
          };
          row.appendChild(b);
        } else {
          row.appendChild(FG.el('div', 'mr', '+' + FG.fmtShort(m.reward)));
        }
        p2.appendChild(row);
      });
      root.appendChild(p2);

      /* --- 目前釣點：完整清單統一交給全螢幕地圖庫，避免釣點增加後每日頁無限變長 --- */
      const p3 = FG.el('div', 'panel');
      p3.appendChild(FG.el('div', 'panel-title', '目前釣點 <span class="sub">' + FG.LOCATIONS.length + ' 個釣點</span>'));
      const loc = st.loc();
      const prog = st.codexProgress(loc);
      const card = FG.el('button', 'daily-loc-summary');
      card.type = 'button';
      card.setAttribute('aria-label', '開啟釣點地圖庫，目前是' + loc.name);
      card.appendChild(FG.px.locThumb(loc, 114, 75));
      const info = FG.el('span', 'daily-loc-info');
      info.innerHTML = '<b>' + FG.esc(loc.name) + '</b><small>' + FG.esc(loc.subtitle) + '</small>' +
        '<em>最低下注 ' + FG.fmt(loc.minBet) + ' · 圖鑑 ' + prog.got + '/' + prog.total + '</em>';
      card.appendChild(info);
      card.appendChild(FG.el('span', 'daily-loc-arrow', '›'));
      card.onclick = function () { FG.sfx.click(); FG.locationPicker(); };
      p3.appendChild(card);
      const openAtlas = FG.el('button', 'btn primary block', '開啟釣點地圖庫');
      openAtlas.style.marginTop = '9px';
      openAtlas.onclick = function () { FG.sfx.click(); FG.locationPicker(); };
      p3.appendChild(openAtlas);
      root.appendChild(p3);
    }
  };

})(window.FG);
