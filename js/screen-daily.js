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

      /* --- 釣點快速切換 --- */
      const p3 = FG.el('div', 'panel');
      p3.appendChild(FG.el('div', 'panel-title', '釣點 <span class="sub">點擊自由切換</span>'));
      FG.LOCATIONS.forEach(function (loc) {
        const unlocked = st.isUnlocked(loc);
        const cur = st.data.loc === loc.id;
        const card = FG.el('div', 'loc-card' + (cur ? ' on' : '') + (unlocked ? '' : ' lock'));
        card.appendChild(FG.px.locThumb(loc, 76, 50));
        const info = FG.el('div', 'lc-info');
        info.innerHTML = '<div class="nm">' + FG.esc(loc.name) +
          (cur ? ' <span class="tag" style="color:#ffc44d">目前</span>' : '') + '</div>' +
          '<div class="ds">' + FG.esc(loc.subtitle) + '<br>最低下注 ' + FG.fmt(loc.minBet) + ' 籌碼</div>';
        card.appendChild(info);
        const act = FG.el('div');
        if (loc.comingSoon) {
          act.appendChild(FG.el('div', 'tiny mute', '即將開放'));
        } else if (unlocked) {
          const b = FG.el('button', 'btn ' + (cur ? 'ghost' : 'primary'), cur ? '釣魚中' : '前往');
          b.disabled = cur;
          b.onclick = function () { FG.sfx.click(); st.setLoc(loc); FG.go('fishing'); FG.ui.toast('已前往 ' + loc.name, 'good'); };
          act.appendChild(b);
        } else {
          const b = FG.el('button', 'btn gold', FG.fmtShort(loc.unlock.chips));
          b.onclick = function () {
            FG.sfx.click();
            FG.ui.confirm('解鎖 ' + loc.name, FG.esc(loc.desc) + '<br><br>花費 <span class="money">' + FG.fmt(loc.unlock.chips) + '</span> 籌碼永久解鎖？', '解鎖', function () {
              const r = st.unlockLoc(loc);
              if (r === 'ok') { FG.sfx.win(); st.setLoc(loc); FG.go('fishing'); FG.ui.toast('已解鎖 ' + loc.name + '！', 'gold', 2200); }
              else if (r === 'poor') { FG.sfx.fail(); FG.openTopup('籌碼不足'); }
            }, 'gold');
          };
          act.appendChild(b);
        }
        card.appendChild(act);
        p3.appendChild(card);
      });
      root.appendChild(p3);
    }
  };

})(window.FG);
