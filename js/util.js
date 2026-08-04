/* ============================================================
   util.js — 共用工具（亂數、色彩、DOM、格式化、音效）
   全域命名空間：window.FG
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  /* ---------------- 亂數 ---------------- */

  // 可指定種子的亂數：讓場景細節（水面反光、樹林）每次重繪都一致
  FG.seeded = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  FG.rand = function (a, b) {
    if (b === undefined) { b = a; a = 0; }
    return a + Math.random() * (b - a);
  };
  FG.randInt = function (a, b) { return Math.floor(FG.rand(a, b + 1)); };
  FG.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  FG.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  FG.lerp = function (a, b, t) { return a + (b - a) * t; };

  // 加權抽選：items 為陣列，weightOf(item) 回傳權重
  FG.weightedPick = function (items, weightOf) {
    let total = 0;
    const w = items.map(function (it) { const x = Math.max(0, weightOf(it)); total += x; return x; });
    if (total <= 0) return items[0];
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };

  // 偏小的隨機值（0~1，power 越大越偏小），用來讓大魚更罕見
  FG.skewed = function (power) { return Math.pow(Math.random(), power || 2); };

  /* ---------------- 色彩 ---------------- */

  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgb2hex(r, g, b) {
    const f = function (v) { return ('0' + Math.round(FG.clamp(v, 0, 255)).toString(16)).slice(-2); };
    return '#' + f(r) + f(g) + f(b);
  }
  FG.hex2rgb = hex2rgb;

  // amt > 0 變亮，amt < 0 變暗
  FG.shade = function (hex, amt) {
    const c = hex2rgb(hex);
    if (amt >= 0) return rgb2hex(FG.lerp(c[0], 255, amt), FG.lerp(c[1], 255, amt), FG.lerp(c[2], 255, amt));
    return rgb2hex(c[0] * (1 + amt), c[1] * (1 + amt), c[2] * (1 + amt));
  };
  FG.mix = function (h1, h2, t) {
    const a = hex2rgb(h1), b = hex2rgb(h2);
    return rgb2hex(FG.lerp(a[0], b[0], t), FG.lerp(a[1], b[1], t), FG.lerp(a[2], b[2], t));
  };

  /* ---------------- 格式化 ---------------- */

  FG.fmt = function (n) {
    n = Math.round(n || 0);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  // 大數字縮寫（用於窄空間）
  FG.fmtShort = function (n) {
    n = Math.round(n || 0);
    if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '億';
    if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '萬';
    return FG.fmt(n);
  };
  FG.todayKey = function () {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  };

  /* ---------------- DOM ---------------- */

  FG.$ = function (sel, root) { return (root || document).querySelector(sel); };
  FG.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  FG.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    return e;
  };
  // 簡易 HTML 轉義（魚名等資料都是自產的，但保險起見）
  FG.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  /* ---------------- 儲存 ---------------- */

  FG.store = {
    load: function (key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    save: function (key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 隱私模式忽略 */ }
    },
    clear: function (key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  /* ---------------- 音效（WebAudio 合成，不需外部檔案） ---------------- */

  const Sfx = {
    ctx: null,
    on: true,
    init: function () {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { this.ctx = null; }
    },
    tone: function (freq, dur, type, vol, slideTo) {
      if (!this.on) return;
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(vol || 0.06, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur + 0.02);
    },
    click: function () { this.tone(520, 0.05, 'square', 0.04); },
    cast:  function () { this.tone(300, 0.22, 'triangle', 0.05, 820); },
    splash:function () { this.tone(180, 0.18, 'sawtooth', 0.03, 90); },
    bite:  function () { this.tone(880, 0.07, 'square', 0.07); const s = this; setTimeout(function () { s.tone(1180, 0.09, 'square', 0.07); }, 90); },
    coin:  function () { this.tone(980, 0.06, 'square', 0.05); const s = this; setTimeout(function () { s.tone(1320, 0.1, 'square', 0.05); }, 70); },
    win:   function () {
      const s = this, n = [660, 830, 990, 1320];
      n.forEach(function (f, i) { setTimeout(function () { s.tone(f, 0.13, 'square', 0.06); }, i * 90); });
    },
    fail:  function () { this.tone(220, 0.2, 'sawtooth', 0.04, 110); },

    // 依序播一串音。cut-in 用它把每位魚王的音階動機播出來——同一套演出骨架
    // 配不同的音階，聽起來就是不同的登場曲（見 cutin.js 的 KING 表）。
    seq: function (notes, gap, dur, type, vol) {
      const s = this;
      (notes || []).forEach(function (f, i) {
        setTimeout(function () { s.tone(f, dur || 0.15, type || 'square', vol || 0.06); }, i * (gap || 110));
      });
    },
    // 魚王 cut-in 開場的悶響。低頻下滑，跟 fail() 的挫敗感刻意分開（音量與波形不同）
    impact: function () { this.tone(130, 0.34, 'sawtooth', 0.075, 42); }
  };
  FG.sfx = Sfx;

})(window.FG);
