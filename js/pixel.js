/* ============================================================
   pixel.js — 像素美術引擎
   1) 字元圖（char map）繪製：小圖示、雜物、人物、水豚
   2) 程序化魚類精靈：依 shape / colors / pattern / special 產生像素魚
   3) 場景繪製：釣點風景、家園房間、地點縮圖
   所有繪製都在低解析度 canvas 上完成，再由 CSS 放大（image-rendering: pixelated）
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  const px = FG.px = {};

  /* ============================================================
     基礎工具
     ============================================================ */

  px.make = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return c;
  };

  // 繪製字元圖：map 為字串陣列，pal 為 { 字元: 顏色 }
  px.drawMap = function (ctx, map, pal, ox, oy, scale) {
    scale = scale || 1;
    for (let r = 0; r < map.length; r++) {
      const row = map[r];
      for (let c = 0; c < row.length; c++) {
        const col = pal[row[c]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(ox + c * scale, oy + r * scale, scale, scale);
      }
    }
  };

  px.mapSize = function (map) {
    let w = 0;
    for (let i = 0; i < map.length; i++) w = Math.max(w, map[i].length);
    return { w: w, h: map.length };
  };

  /* ============================================================
     介面圖示（12x12 字元圖）
     ============================================================ */

  const ICONS = {
    fish: [
      '............',
      '.......XX...',
      '..XXXX.XXX..',
      '.XXXXXXXXXX.',
      'XXXXXXXXXXX.',
      'XXaXXXXXXXX.',
      'XXXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '..XXXX.XXX..',
      '.......XX...',
      '............',
      '............'
    ],
    calendar: [
      '............',
      '..X......X..',
      '.XXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '.X........X.',
      '.X.aa.aa..X.',
      '.X........X.',
      '.X.aa.aa..X.',
      '.X........X.',
      '.XXXXXXXXXX.',
      '............',
      '............'
    ],
    house: [
      '.....XX.....',
      '....XXXX....',
      '...XXXXXX...',
      '..XXXXXXXX..',
      '.XXXXXXXXXX.',
      'XXXXXXXXXXXX',
      '.XX......XX.',
      '.XX.aaaa.XX.',
      '.XX.aaaa.XX.',
      '.XX.aaaa.XX.',
      '.XXXXXXXXXX.',
      '............'
    ],
    bag: [
      '............',
      '...XX..XX...',
      '..X.X..X.X..',
      '..X.X..X.X..',
      '.XXXXXXXXXX.',
      '.XaXXXXXXaX.',
      '.XXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '..XXXXXXXX..',
      '............'
    ],
    book: [
      '............',
      '..XXXXXXXX..',
      '.XaaaaaaaaX.',
      '.XaXXXXXXaX.',
      '.XaaaaaaaaX.',
      '.XaXXXXXXaX.',
      '.XaaaaaaaaX.',
      '.XaXXXXXXaX.',
      '.XaaaaaaaaX.',
      '..XXXXXXXX..',
      '............',
      '............'
    ],
    coin: [
      '...XXXX...',
      '..XaaaaX..',
      '.XaaXXaaX.',
      'XaaXaaXaaX',
      'XaXaaaaXaX',
      'XaXaaaaXaX',
      'XaaXaaXaaX',
      '.XaaXXaaX.',
      '..XaaaaX..',
      '...XXXX...'
    ]
  };

  px.icon = function (name, scale, color, accent) {
    const map = ICONS[name] || ICONS.fish;
    const s = px.mapSize(map);
    const cv = px.make(s.w, s.h);
    px.drawMap(cv.getContext('2d'), map, { X: color || '#e8f1f7', a: accent || '#59a6ff' }, 0, 0, 1);
    if (scale && scale !== 1) {
      const big = px.make(s.w * scale, s.h * scale);
      const g = big.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(cv, 0, 0, big.width, big.height);
      return big;
    }
    return cv;
  };

  /* ============================================================
     程序化魚類精靈
     ============================================================ */

  // 各體型的輪廓參數（皆為精靈框的比例值；scale=1 時大約佔 2/3 畫面，
  // 讓 scale 大的魚王在同尺寸框裡看起來就是比較大隻）
  const SHAPES = {
    normal: { bodyLen: .50, bodyH: .46, gamma: 1.15, e: .50, tailLen: .18, tailH: .80, fork: .45, dorsal: .36, dorsalAt: [.30, .64], anal: .22, analAt: [.18, .42] },
    long:   { bodyLen: .62, bodyH: .24, gamma: 1.05, e: .58, tailLen: .14, tailH: .52, fork: .30, dorsal: .26, dorsalAt: [.24, .72], anal: .16, analAt: [.22, .55] },
    round:  { bodyLen: .40, bodyH: .62, gamma: 1.20, e: .42, tailLen: .16, tailH: .58, fork: .40, dorsal: .28, dorsalAt: [.28, .60], anal: .22, analAt: [.22, .46] },
    flat:   { bodyLen: .42, bodyH: .70, gamma: 1.24, e: .44, tailLen: .15, tailH: .70, fork: .48, dorsal: .40, dorsalAt: [.22, .62], anal: .32, analAt: [.18, .48] },
    wide:   { bodyLen: .56, bodyH: .52, gamma: 1.10, e: .48, tailLen: .18, tailH: .86, fork: .45, dorsal: .30, dorsalAt: [.28, .58], anal: .20, analAt: [.20, .44] },
    ray:    { bodyLen: .46, bodyH: .80, gamma: 1.00, e: .30, tailLen: .36, tailH: .03, fork: .00, dorsal: .04, dorsalAt: [.34, .50], anal: .04, analAt: [.34, .50] },

    // ── 2026-08-06 補的四種一般魚輪廓：原本六種撐不起 300+ 條非魚王魚，同釣點同階級常常撞型 ──
    // 刀型（側扁窄長）：tailH .30／fork .05 幾乎沒有尾扇，靠貫穿大半個身體的背鰭＋臀鰭
    // 讀出「刀魚／魛魚」那種長條薄片的輪廓。跟 long 的差別是 long 有正常尾巴、鰭短而集中；
    // 這裡的尾巴幾乎收沒了，識別全交給那圈長鰭
    slim:    { bodyLen: .58, bodyH: .30, gamma: 1.05, e: .40, tailLen: .10, tailH: .30, fork: .05, dorsal: .40, dorsalAt: [.10, .85], anal: .34, analAt: [.10, .80] },
    // 高冠短身：gamma 1.40 把最寬處推到 t≈0.66（比 flat 的 1.24 更前傾＝額頭更陡），
    // bodyLen 只有 .36 但 bodyH .82（全一般魚最高），配上幾乎沒有的尾巴（tailLen .12／tailH .46）——
    // 讀起來是月魚／神仙魚那種「一個立起來的圓盤」，不是 flat 那種「有尾巴的高身魚」
    crest:   { bodyLen: .36, bodyH: .82, gamma: 1.40, e: .38, tailLen: .12, tailH: .46, fork: .16, dorsal: .50, dorsalAt: [.16, .55], anal: .42, analAt: [.16, .48] },
    // 箱型：e .18 是全檔（含魚王）最低，把橢圓壓成接近矩形的箱子；尾巴縮到 tailH .30／fork 0
    // 的一根小槳，鰭也刻意收小（dorsal .20、anal .18）。讀起來是箱魨／河魨那種硬殼方塊，
    // 跟 e .24 的 clinger（貼石巨鰍，靠 sucker identify）不會混——clinger 是扁板，這是方塊
    boxy:    { bodyLen: .46, bodyH: .58, gamma: 1.00, e: .18, tailLen: .10, tailH: .30, fork: .00, dorsal: .20, dorsalAt: [.35, .60], anal: .18, analAt: [.32, .55] },
    // 小型流線：gamma 1.00（前後對稱收尖，不像 normal 的 1.15 偏頭）＋ e .62（全一般魚最尖，
    // 比 long 的 .58 更瘦），配深叉尾（fork .58，一般魚裡僅次於無、鰭刻意收小）——
    // 讀起來是沙丁魚／鯖魚那種對稱紡錘、鰭小尾深叉的快速小型魚
    torpedo: { bodyLen: .48, bodyH: .34, gamma: 1.00, e: .62, tailLen: .16, tailH: .68, fork: .58, dorsal: .18, dorsalAt: [.35, .55], anal: .14, analAt: [.30, .48] },

    // ── 以下五種是為魚王設計的專屬輪廓 ──
    // 五位魚王原本全是 shape:'wide' + glow + scar，只有配色不同，並排時完全認不出是不同的魚。
    // 體型是這個解析度下最強的辨識線索（比花紋、比配色都強），所以一王一型，不共用。
    // gamma < 1 把最寬處推向尾部、> 1 推向頭部，是拉開輪廓差異最有效的旋鈕。
    catfish: { bodyLen: .62, bodyH: .44, gamma: 1.42, e: .34, tailLen: .18, tailH: .50, fork: .02, dorsal: .18, dorsalAt: [.50, .68], anal: .32, analAt: [.06, .42] },
    tuna:    { bodyLen: .52, bodyH: .50, gamma: 1.08, e: .52, tailLen: .22, tailH: 1.05, fork: .72, dorsal: .54, dorsalAt: [.36, .52], anal: .30, analAt: [.20, .34] },
    dragon:  { bodyLen: .66, bodyH: .32, gamma: 1.18, e: .56, tailLen: .18, tailH: .95, fork: .22, dorsal: .52, dorsalAt: [.16, .82], anal: .30, analAt: [.12, .50] },
    pike:    { bodyLen: .66, bodyH: .34, gamma: 0.78, e: .60, tailLen: .16, tailH: .72, fork: .34, dorsal: .38, dorsalAt: [.08, .26], anal: .28, analAt: [.06, .22] },
    abyss:   { bodyLen: .60, bodyH: .52, gamma: 1.70, e: .40, tailLen: .22, tailH: .48, fork: .12, dorsal: .24, dorsalAt: [.16, .50], anal: .22, analAt: [.10, .36] },
    // 鱘／鱘形目：背鰭與臀鰭都極靠尾、深叉尾。身體刻意畫短，長度靠 rostrum 補回來
    paddle:  { bodyLen: .54, bodyH: .38, gamma: 1.25, e: .46, tailLen: .18, tailH: .88, fork: .55, dorsal: .32, dorsalAt: [.08, .28], anal: .24, analAt: [.05, .20] },
    // 真蛇：**幾乎沒有鰭**，尾巴收成一點（不是尾鰭）。
    // e = .30 讓剖面接近矩形＝粗細均勻的管子，這是「蛇」跟 dragon 那種帶狀魚身最大的差別；
    // dragon 有 tailH .95 的大尾扇與高聳的鬃，serpent 兩者都沒有
    serpent: { bodyLen: .78, bodyH: .21, gamma: 1.30, e: .30, tailLen: .07, tailH: .14, fork: .00, dorsal: .05, dorsalAt: [.10, .80], anal: .04, analAt: [.10, .60] },
    // 肺魚：鰻形身體，但**後半段的背鰭與臀鰭拉得又長又低**，跟圓鈍的小尾扇連成
    // 一圈連續的鰭緣。這是它跟 serpent（完全無鰭）與 long（鰭短而集中）的分界
    lungfish: { bodyLen: .72, bodyH: .24, gamma: 1.40, e: .45, tailLen: .10, tailH: .34, fork: .00, dorsal: .30, dorsalAt: [.02, .58], anal: .26, analAt: [.02, .48] },

    // 觀賞錦鯉：厚實深身 ＋ **全遊戲最長最高、而且幾乎不分叉的飄逸尾**。
    // tuna 的 tailH 1.05 是「高而深叉的月牙」，這裡 tailLen .30 / fork .10 是
    // 「一整片拖在後面的紗」——尾巴佔掉的長度比 tuna 多五成，輪廓一眼分得開
    koi:      { bodyLen: .50, bodyH: .56, gamma: 1.12, e: .44, tailLen: .30, tailH: 1.18, fork: .10, dorsal: .46, dorsalAt: [.18, .70], anal: .30, analAt: [.14, .42] },
    // 彈塗魚：鈍頭低身 ＋ **一整片幾乎貫穿全背的帆狀背鰭**（dorsal .70，全檔最大）＋
    // 完全不分叉的圓槳尾。abyss 也是大頭，但它的背鰭只有 .24、尾巴極小，讀起來完全不同
    skipper:  { bodyLen: .60, bodyH: .34, gamma: 1.55, e: .42, tailLen: .18, tailH: .60, fork: .00, dorsal: .70, dorsalAt: [.08, .78], anal: .20, analAt: [.08, .40] },
    // 溯河巨鮭：gamma .82 把最寬處推到中線偏尾（t≈0.44）＝「後半身全是肌肉」，
    // 再配一支又長又高的月牙尾。跟 tuna 分開的關鍵是**背鰭**：tuna 有 .54 的高帆，
    // 這裡只有 .32 的低背鰭，辨識全交給尾巴與鉤吻（kype）
    leaper:   { bodyLen: .56, bodyH: .54, gamma: 0.82, e: .56, tailLen: .28, tailH: 1.02, fork: .52, dorsal: .32, dorsalAt: [.24, .46], anal: .28, analAt: [.10, .32] },
    // 腔棘魚：gamma 1.02 ＝ 最寬處剛好落在正中央（**唯一一個**），配 e .36 的方剖面，
    // 讀起來是「兩端一樣粗的木桶」。catfish 的 gamma 1.42 是大頭收尾，不會搞混
    coelacanth: { bodyLen: .58, bodyH: .50, gamma: 1.02, e: .36, tailLen: .22, tailH: .62, fork: .00, dorsal: .34, dorsalAt: [.30, .50], anal: .28, analAt: [.14, .36] },

    // 貼石巨鰍：**全檔最扁**（bodyH .30）＋ e .24 的方剖面 ＝ 一片等厚的板子。
    // 它跟 lungfish 的分界不在長度，在鰭：lungfish 的鰭緣從 .02 一路鋪到 .58，
    // 這裡的背鰭只有 .12 而且擠在尾側，前半身**光的**——因為前半身要交給 sucker。
    // 真正的識別是那片吸盤（底緣是一條完全水平的直線，全檔唯一）
    clinger:  { bodyLen: .70, bodyH: .30, gamma: 1.35, e: .24, tailLen: .14, tailH: .42, fork: .00, dorsal: .12, dorsalAt: [.10, .40], anal: .10, analAt: [.08, .34] },
    // 隆頭魚：gamma 1.34 把最寬處推到 t≈0.59（厚重的前半身），再靠 hump 把頭墊高。
    // fork .04 ＝ 幾乎切齊的圓截尾，這是它跟 flat（.48 深叉）與 tuna（.72）的分界；
    // 背鰭刻意收在 [.14,.62]**不要碰到頭**，否則會跟 hump 連成一塊看不出是額隆
    wrasse:   { bodyLen: .54, bodyH: .60, gamma: 1.34, e: .46, tailLen: .20, tailH: .74, fork: .04, dorsal: .40, dorsalAt: [.14, .62], anal: .34, analAt: [.12, .48] },
    // 洞螈：長管身 ＋ **側扁的圓槳尾**（tailH .50、fork 0），鰭褶只在尾側三成。
    // serpent 的尾是收成一點的（tailH .14），lungfish 的鰭緣鋪滿後半身——
    // 這一種是「前面光溜溜、後面一支槳」，加上外鰓與四肢才成立
    olm:      { bodyLen: .76, bodyH: .19, gamma: 1.12, e: .36, tailLen: .13, tailH: .50, fork: .00, dorsal: .16, dorsalAt: [.02, .30], anal: .13, analAt: [.02, .26] },
    // 章魚：**gamma 1.00 ＋ e .50 ＝ 一個正橢圓**，而 bodyLen .42 與 bodyH .74 讓那個
    // 橢圓的長寬幾乎相等——也就是一個圓。這是全檔唯一刻意畫成圓的輪廓，也是
    // 「圓圓的太陽升起」這個名字的來源。尾鰭與各鰭全部壓到接近零（頭足類沒有鰭），
    // 身體後方留給 `arms` 的八條腕；沒有 arms 的話它只是一顆球
    octopus:  { bodyLen: .42, bodyH: .74, gamma: 1.00, e: .50, tailLen: .05, tailH: .08, fork: .00, dorsal: .04, dorsalAt: [.34, .52], anal: .04, analAt: [.34, .52] }
  };

  const SPR_W = 96, SPR_H = 56, MARGIN = 4;

  const fishCache = {};

  // 產生一隻魚的像素精靈（面向右）
  function buildFish(f) {
    const W = SPR_W, H = SPR_H;
    const S = SHAPES[f.shape] || SHAPES.normal;
    const rng = FG.seeded(hashStr(f.id));

    const usableW = W - MARGIN * 2;
    const sp = f.special || [];

    // 會往吻端前方延伸的 special 要先預留空間。不預留的話，魚王級的 scale 會把吻端推到 x≈91，
    // 那些特徵只剩 3px 可畫＝等於完全看不見（原本有鬍鬚的魚王全中這個坑）。
    // 新增這類 special 時記得在這裡登記需要的 px 數，取最大值。
    const HEAD_ROOM = { whisker: 12, rostrum: 24, forkTongue: 12, kype: 10 };
    let headRoom = 0;
    for (const k in HEAD_ROOM) if (sp.indexOf(k) >= 0) headRoom = Math.max(headRoom, HEAD_ROOM[k]);
    // 避免體型倍率把魚撐出畫面；有鬍鬚時連同前方留白一起算進去
    const sc = Math.min(f.scale || 1, (0.98 - headRoom / usableW) / (S.bodyLen + S.tailLen));
    const halfMax = (H / 2 - MARGIN) * S.bodyH * sc;
    const bodyW = Math.max(6, Math.round(usableW * S.bodyLen * sc));
    const tailW = Math.max(3, Math.round(usableW * S.tailLen * sc));
    const total = bodyW + tailW;
    // 有多餘空間時置中；空間不夠時優先把留白讓給吻端前方（否則鬍鬚會被切掉）
    const slack = usableW - total;
    const xStart = Math.round(MARGIN + Math.max(0, Math.min(slack / 2, slack - headRoom)));
    const x0 = xStart + tailW;          // 身體起點（尾側）
    const x1 = x0 + bodyW;              // 身體終點（頭部）
    const cy = H / 2 + (f.cyOffset || 0);

    // layer: 0 空 / 1 鰭 / 2 尾 / 3 身體（數字大者覆蓋）
    const layer = new Uint8Array(W * H);
    function put(x, y, v) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      if (v > layer[i]) layer[i] = v;
    }

    // 身體縱向半高剖面：t=0 尾根、t=1 吻端
    function profile(t) {
      t = FG.clamp(t, 0, 1);
      const tt = Math.pow(t, S.gamma);
      const s = Math.max(0, 1 - Math.pow(2 * tt - 1, 2));
      const h = halfMax * Math.pow(s, S.e);
      return (t > 0.02 && t < 0.995) ? Math.max(h, 1.2) : h;
    }

    // --- 背鰭 ---
    const dorH = halfMax * S.dorsal;
    for (let x = Math.round(x0 + bodyW * S.dorsalAt[0]); x <= Math.round(x0 + bodyW * S.dorsalAt[1]); x++) {
      const t = (x - x0) / bodyW;
      const s = (t - S.dorsalAt[0]) / (S.dorsalAt[1] - S.dorsalAt[0]);
      const hgt = dorH * Math.pow(Math.sin(Math.PI * FG.clamp(s, 0, 1)), .55);
      const base = cy - profile(t);
      for (let y = base - hgt; y < base; y++) put(x, y, 1);
    }
    // --- 臀鰭 ---
    const anH = halfMax * S.anal;
    for (let x = Math.round(x0 + bodyW * S.analAt[0]); x <= Math.round(x0 + bodyW * S.analAt[1]); x++) {
      const t = (x - x0) / bodyW;
      const s = (t - S.analAt[0]) / (S.analAt[1] - S.analAt[0]);
      const hgt = anH * Math.pow(Math.sin(Math.PI * FG.clamp(s, 0, 1)), .55);
      const base = cy + profile(t);
      for (let y = base; y < base + hgt; y++) put(x, y, 1);
    }
    // --- 胸鰭 ---
    const pecX = x0 + bodyW * 0.62;
    const pecLen = Math.max(3, Math.round(bodyW * 0.16));
    for (let i = 0; i < pecLen; i++) {
      const hgt = (1 - i / pecLen) * halfMax * 0.34 + 1;
      for (let y = 0; y < hgt; y++) put(pecX - i, cy + profile(0.62) * 0.25 + y, 1);
    }

    // --- 尾鰭 ---
    const jointHalf = profile(0);
    const tailHalf = halfMax * S.tailH;
    for (let i = 0; i < tailW; i++) {
      const x = x0 - tailW + i;
      const u = tailW > 1 ? i / (tailW - 1) : 1;
      const half = tailHalf * (1 - u) + jointHalf * u;
      const cut = u < S.fork ? ((S.fork - u) / S.fork) * tailHalf * 0.62 : 0;
      for (let y = Math.round(cy - half); y <= Math.round(cy + half); y++) {
        if (cut > 0 && Math.abs(y - cy) < cut) continue;
        put(x, y, 2);
      }
    }

    // --- 身體 ---
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / bodyW;
      const half = profile(t);
      for (let y = Math.round(cy - half); y <= Math.round(cy + half); y++) put(x, y, 3);
    }

    /* ---------- 上色 ---------- */
    const C = f.colors || {};
    const body = C.body || '#7f9bb0';
    const back = C.back || FG.shade(body, -0.32);
    const belly = C.belly || FG.shade(body, 0.42);
    const finC = C.fin || FG.mix(body, back, 0.4);
    const patC = C.pattern || FG.shade(back, -0.2);
    const outline = C.outline || FG.shade(back, -0.55);

    const col = new Array(W * H).fill(null);

    // 斑點座標（僅 pattern = 'spot' 使用）
    const spots = [];
    if (f.pattern === 'spot') {
      const n = Math.round(6 + rng() * 8);
      for (let i = 0; i < n; i++) spots.push([0.12 + rng() * 0.72, 0.15 + rng() * 0.7]);
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const L = layer[i];
        if (!L) continue;
        if (L === 1 || L === 2) {
          // 鰭與尾：邊緣稍暗，做出膜狀質感
          col[i] = ((x + y) % 5 === 0) ? FG.shade(finC, -0.16) : finC;
          continue;
        }
        const t = (x - x0) / bodyW;
        const half = profile(t);
        const v = FG.clamp((y - (cy - half)) / (2 * half), 0, 1);
        let c;
        if (v < 0.24) c = back;
        else if (v > 0.74) c = belly;
        else if (v < 0.40) c = FG.mix(back, body, 0.55);
        else c = body;

        // 花紋
        switch (f.pattern) {
          case 'stripe':
            if ((x - x0) % 8 < 2 && v > 0.08 && v < 0.9) c = FG.mix(c, patC, 0.8);
            break;
          case 'band':
            if (Math.abs(v - 0.46) < 0.09) c = FG.mix(c, patC, 0.85);
            break;
          case 'band2':
            if (Math.abs(v - 0.40) < 0.07 || Math.abs(v - 0.62) < 0.05) c = FG.mix(c, patC, 0.8);
            break;
          case 'spot':
            for (let s = 0; s < spots.length; s++) {
              if (Math.abs(t - spots[s][0]) < 0.035 && Math.abs(v - spots[s][1]) < 0.09) { c = patC; break; }
            }
            break;
          case 'speck':
            if (((x * 7 + y * 13) % 11) === 0 && v > 0.1 && v < 0.8) c = FG.mix(c, patC, 0.7);
            break;
          case 'net':
            if ((x - x0) % 5 === 0 || (y % 5 === 0)) c = FG.mix(c, patC, 0.35);
            break;
          case 'scale':
            if (((x - x0 + (y % 2) * 2) % 4) === 0) c = FG.mix(c, FG.shade(c, -0.18), 0.9);
            break;
          // ── 2026-08-06 補的四種花紋：原本八種裡六種是「重複紋理」，剩下兩種是「橫帶」，
          // 同釣點同階級的魚很容易撞到同一種讀感。這四種各自换一種幾何邏輯，不重複前八種的手法 ──
          case 'gradient':
            // 漸層：沿 t（尾到頭）連續變色，不是離散色塊——跟其餘七種花紋都是「重複」或「帶狀」不同
            if (v > 0.08 && v < 0.92) c = FG.mix(c, patC, t * 0.6);
            break;
          case 'saddle':
            // 背側鞍斑：只長在背部（v < 0.38）的等距色塊，跟 stripe 的差別是它到不了腹部，
            // 跟 band 的差別是它沿長度分段而不是沿高度一整條
            if (v < 0.38 && Math.floor(t * 4.5) % 2 === 0) c = FG.mix(c, patC, 0.8);
            break;
          case 'ocellus': {
            // 尾柄假眼：固定位置的單一同心圓（深色瞳 + 淺色圈），是全部花紋裡唯一的「單一標記」，
            // 其餘都是重複或帶狀。中心用 shade 提亮，外圈用原色，讀起來才有「圈」的層次
            const dt = (t - 0.18) * 3.4, dv = (v - 0.5) * 2.4;
            const d = Math.sqrt(dt * dt + dv * dv);
            if (d < 0.62) c = (d < 0.38) ? FG.shade(patC, 0.3) : patC;
            break;
          }
          case 'chevron': {
            // 人字紋：沿身體重複的 V 形斜紋（上下鏡射兩道），跟 stripe（垂直直條）在幾何上
            // 是「斜的」對「直的」，一眼不會混
            const seg = 0.16;
            const localT = (t % seg) / seg;
            const apex = Math.abs(localT - 0.5) * 2;
            const bandV = 0.5 - apex * 0.42;
            if (Math.abs(v - bandV) < 0.05 || Math.abs(v - (1 - bandV)) < 0.05) c = FG.mix(c, patC, 0.8);
            break;
          }
        }
        col[i] = c;
      }
    }

    // --- 鰓線 ---
    {
      const gx = Math.round(x0 + bodyW * 0.74);
      const half = profile(0.74);
      for (let y = Math.round(cy - half * 0.85); y <= Math.round(cy + half * 0.7); y++) {
        const off = Math.round(Math.abs(y - cy) / Math.max(1, half) * 2);
        const i = y * W + (gx - off);
        if (col[i]) col[i] = FG.shade(col[i], -0.22);
      }
    }

    // --- 眼睛 ---
    {
      const ex = Math.round(x0 + bodyW * 0.87);
      const ey = Math.round(cy - profile(0.87) * 0.28);
      const eyeW = C.eyeWhite || '#f4f8fb';
      const pupil = C.pupil || '#141a20';
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const i = (ey + dy) * W + (ex + dx);
        if (i >= 0 && i < W * H && col[i]) col[i] = eyeW;
      }
      for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) {
        const i = (ey + dy) * W + (ex + dx);
        if (i >= 0 && i < W * H && col[i]) col[i] = pupil;
      }
    }

    // --- 嘴 ---
    {
      const my = Math.round(cy + profile(0.96) * 0.45);
      for (let x = x1 - 3; x <= x1; x++) {
        const i = my * W + x;
        if (i >= 0 && i < W * H && col[i]) col[i] = FG.shade(outline, 0.15);
      }
    }

    // --- 傷疤 ---
    // 只有霧語巨鯰「翁德」用這個：牠的傳說明寫「背上那道疤」，是角色設定的一部分。
    // 別因為「魚王看起來比較猛」就到處加，五王同疤就會變成看不出差別的貼圖。
    if (sp.indexOf('scar') >= 0) {
      const scarC = C.scar || '#efd9c0';
      const sx = Math.round(x0 + bodyW * 0.52);
      const half = profile(0.52);
      const top = Math.round(cy - half * 0.9);
      // 長度夾在 6～9：疤要在「背上」，拉太長會貫穿整條魚，看起來像被切成兩半
      const len = FG.clamp(Math.round(half * 0.8), 6, 9);
      for (let k = 0; k < len; k++) {
        const x = sx + Math.round(k * 0.6), y = top + k;
        const i = y * W + x;
        if (col[i]) col[i] = scarC;
        // 每三格往兩側岔出一格，讀起來才是「癒合的舊傷」而不是一道亮線
        if (k % 3 === 1) {
          const a = y * W + (x - 2), b = y * W + (x + 2);
          if (col[a]) col[a] = FG.mix(col[a], scarC, 0.7);
          if (col[b]) col[b] = FG.mix(col[b], scarC, 0.7);
        }
      }
    }
    // --- 背棘 ---
    if (sp.indexOf('spike') >= 0) {
      for (let k = 0; k < 6; k++) {
        const x = Math.round(x0 + bodyW * (0.24 + k * 0.09));
        const base = Math.round(cy - profile((x - x0) / bodyW)) - 1;
        for (let y = base; y > base - 4 + (k % 2); y--) {
          const i = y * W + x;
          if (i > 0 && i < W * H) col[i] = FG.shade(back, -0.1);
        }
      }
    }
    // --- 鬍鬚（鯰魚） ---
    if (sp.indexOf('whisker') >= 0) {
      const mx = x1, my = Math.round(cy + profile(0.96) * 0.4);
      const room = W - 2 - mx;                       // 別讓鬍鬚畫出畫面（會繞到下一列）
      for (let s = 0; s < 2; s++) {
        for (let k = 0; k < 14; k++) {
          const x = Math.round(mx + k * 0.75);
          const y = Math.round(my + (s ? 1 : -3) + k * k * (s ? 0.05 : 0.02));
          if (x < 0 || x >= W || y < 0 || y >= H || k * 0.75 > room) continue;
          const i = y * W + x;
          if (!col[i]) col[i] = FG.shade(back, 0.05);
        }
      }
    }
    // --- 頭角 ---
    // 基部兩格寬、尖端一格寬。原本整根都是 1px，跟 mane 的細絲擺在一起會分不出哪根是角。
    if (sp.indexOf('horn') >= 0) {
      const hc = C.hornColor || '#f2e2a8';
      const hx = Math.round(x0 + bodyW * 0.84);
      for (let k = 0; k < 6; k++) {
        const x = hx + Math.round(k * 0.8), y = Math.round(cy - profile(0.84) - k);
        for (let d = 0; d < (k < 3 ? 2 : 1); d++) {
          const xx = x - d;
          if (xx < 0 || xx >= W || y < 0 || y >= H) continue;
          col[y * W + xx] = hc;
        }
      }
    }
    // --- 劍狀長吻（鱘、白鱘、匙吻鱘）---
    // 一片扁平的槳狀吻板，長度接近體長的一半。這是全檔唯一「往身體外長出主要體積」的
    // 特徵，所以它必須登記在 HEAD_ROOM 裡，否則會被畫布右緣切掉。
    if (sp.indexOf('rostrum') >= 0) {
      const rc = C.rostrum || FG.mix(body, back, 0.35);
      const len = Math.max(10, Math.round(bodyW * 0.46));
      const my = Math.round(cy - profile(0.995) * 0.15);
      for (let k = 1; k <= len; k++) {
        const u = k / len;
        // 板狀：從吻基往前先變厚（u≈0.3 最厚）再收成圓鈍的尖端。
        // 純三角形會變成一根「針」，讀不出是槳狀吻板。
        const half = Math.max(0.6, Math.sin(Math.pow(u, 0.55) * Math.PI) * halfMax * 0.30 + 1.1 - u * 0.9);
        const y0 = Math.round(my - half), y1 = Math.round(my + half);
        const x = x1 + k;
        if (x < 0 || x >= W) break;
        for (let y = y0; y <= y1; y++) {
          if (y < 0 || y >= H) continue;
          // 上緣用背色、下緣提亮，讓這片薄板在沒有光照系統的情況下有厚度
          col[y * W + x] = y === y0 ? back : (y === y1 ? FG.shade(rc, 0.22) : rc);
        }
      }
    }
    // --- 絲狀四肢（肺魚的胸鰭與腹鰭退化成細絲）---
    // 四條往後下方飄的細絲。刻意**斜著往尾部飄而不是垂直往下垂**：
    // 垂直的細線在這個尺寸會被讀成雨絲（地形系統與 mane 都踩過同一個坑）。
    if (sp.indexOf('filaments') >= 0) {
      const fl = C.filament || FG.shade(finC, 0.25);
      [[0.66, 1], [0.66, -1], [0.36, 1], [0.36, -1]].forEach(function (s) {
        const t = s[0], side = s[1];
        const bx = Math.round(x0 + bodyW * t);
        const by = Math.round(cy + side * profile(t) * 0.68);
        for (let k = 1; k <= 9; k++) {
          const x = bx - Math.round(k * 0.9);                       // 往尾部（左）飄
          const y = by + side * Math.round(k * 0.42 + Math.sin(k * 0.7) * 1.1);
          if (x < 0 || x >= W || y < 0 || y >= H) break;
          if (!col[y * W + x]) col[y * W + x] = fl;
        }
      });
    }
    // --- 分叉的蛇舌 ---
    // 在 serpent 這種沒有鰭、沒有尾扇的輪廓上，舌頭是唯一能把「蛇」跟「鰻」分開的訊號。
    // 分叉一定要張得夠開（末端上下各 3px）；只岔 1px 在 4 倍放大後看起來只是一條粗線。
    if (sp.indexOf('forkTongue') >= 0) {
      const tc = C.tongue || '#e0566a';
      const my = Math.round(cy + profile(0.96) * 0.45);
      const stem = 7;
      for (let k = 1; k <= stem; k++) {
        const x = x1 + k;
        if (x < 0 || x >= W) break;
        if (my >= 0 && my < H && !col[my * W + x]) col[my * W + x] = tc;
      }
      for (let j = 1; j <= 3; j++) {
        for (let s = -1; s <= 1; s += 2) {
          const x = x1 + stem + j, y = my + s * j;
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          if (!col[y * W + x]) col[y * W + x] = tc;
        }
      }
    }
    // --- 巨顎與外露獠牙 ---
    // 原本的「嘴」只有吻端 4px 的一道暗痕，在掠食型魚王身上完全撐不起「顎」的印象。
    // 這裡把咬合線拉長到體長的兩成，再交錯插上亮色牙齒——牙齒畫在身體像素上（不外凸），
    // 因為 1px 的外凸尖刺在 4 倍放大後會被讀成雜點。
    if (sp.indexOf('jaw') >= 0) {
      const tooth = C.tooth || '#f8f4e6';
      const jawLen = Math.max(8, Math.round(bodyW * 0.20));
      const my = Math.round(cy + profile(0.92) * 0.34);
      for (let k = 0; k <= jawLen; k++) {
        const i = my * W + (x1 - k);
        if (col[i]) col[i] = FG.shade(outline, 0.12);
      }
      for (let k = 2; k < jawLen; k += 3) {
        const x = x1 - k;
        for (let d = 1; d <= 2; d++) {
          const up = (my - d) * W + x, dn = (my + d) * W + x;
          if (col[up]) col[up] = tooth;                       // 上排牙往下咬
          if (k % 6 === 2 && col[dn]) col[dn] = tooth;        // 下排牙較稀疏，避免糊成一條白帶
        }
      }
    }
    // --- 頭頂發光燈籠（鮟鱇式誘餌）---
    // 從頭頂往前上方畫一段弧，末端才是燈籠。弧線一定要「往上」長：
    // 從高處往下垂的細線在這個尺寸會被讀成雨絲（同地形系統踩過的坑）。
    if (sp.indexOf('lantern') >= 0) {
      const bulb = C.lantern || C.glow || '#9f6fff';
      const stalk = FG.shade(back, 0.08);
      const sx = Math.round(x0 + bodyW * 0.80);
      const sy = Math.round(cy - profile(0.80)) - 1;
      let bx = sx, by = sy;
      // 取樣要夠密（24 段）：步距超過 1px 會讓竿子斷成虛線，看起來像三顆浮在頭上的點
      for (let k = 0; k <= 24; k++) {
        const u = k / 24;
        bx = Math.round(sx + u * bodyW * 0.16);
        by = Math.round(sy - Math.sin(u * 1.9) * halfMax * 0.52);
        if (bx < 0 || bx >= W || by < 0 || by >= H) continue;
        const i = by * W + bx;
        if (!col[i]) col[i] = stalk;
      }
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > 1) continue;       // 菱形，方形會像顆螺絲
        const x = bx + dx, y = by + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        col[y * W + x] = bulb;
      }
    }
    // --- 尾柄離鰭（鮪魚科的識別特徵）---
    if (sp.indexOf('finlet') >= 0) {
      const fc = FG.shade(patC, 0.15);
      for (let k = 0; k < 4; k++) {
        const t = 0.04 + k * 0.04;
        const x = Math.round(x0 + bodyW * t);
        const half = profile(t);
        for (let d = 1; d <= 2; d++) {
          const up = (Math.round(cy - half) - d) * W + x;
          const dn = (Math.round(cy + half) + d) * W + x;
          if (up >= 0 && !col[up]) col[up] = fc;
          if (dn < W * H && !col[dn]) col[dn] = fc;
        }
      }
    }
    // --- 鬃（龍型的飄動纖毛）---
    // 長在背鰭上緣，短且往頭部方向斜，才有「在水裡飄」的動感。
    if (sp.indexOf('mane') >= 0) {
      const mc = C.mane || FG.shade(finC, 0.3);
      const dor = halfMax * S.dorsal;
      for (let k = 0; k < 8; k++) {
        const t = 0.20 + k * 0.075;
        const x = Math.round(x0 + bodyW * t);
        const base = Math.round(cy - profile(t) - dor * Math.pow(Math.sin(Math.PI * FG.clamp((t - S.dorsalAt[0]) / (S.dorsalAt[1] - S.dorsalAt[0]), 0, 1)), .55));
        const len = 3 + (k % 3);
        for (let j = 0; j < len; j++) {
          // 往尾部（左）斜：魚是朝右游的，纖毛要往後飄才有動感，往前斜會變成一排天線
          const xx = x - Math.round(j * 0.7), yy = base - 1 - j;
          if (xx < 0 || xx >= W || yy < 0) continue;
          const i = yy * W + xx;
          if (!col[i]) col[i] = mc;
        }
      }
    }
    // --- 霜晶（結冰體表）---
    // 十字形而不是單點：單點會跟 pattern:'speck' 的細碎雜訊混在一起看不出來。
    if (sp.indexOf('frost') >= 0) {
      const fr = C.frost || '#eaf7ff';
      // 只放 6 顆：跟 pattern 的斑點疊在一起時，再多就變成一團看不出結構的雜訊
      for (let k = 0; k < 6; k++) {
        const t = 0.14 + ((k * 7) % 9) * 0.075;
        const half = profile(t);
        const x = Math.round(x0 + bodyW * t);
        const y = Math.round(cy - half * (0.2 + ((k * 3) % 5) * 0.13));
        for (let d = -1; d <= 1; d++) {
          const a = (y + d) * W + x, b = y * W + (x + d);
          if (a >= 0 && a < W * H && col[a]) col[a] = fr;
          if (b >= 0 && b < W * H && col[b]) col[b] = FG.mix(col[b], fr, 0.75);
        }
      }
    }
    // --- 架在頭頂上的鼓眼（彈塗魚）---
    // 這是少數「必須往身體外凸」的特徵：彈塗魚的識別就在於**眼睛長在頭頂上面**，
    // 畫在輪廓內就只是一條普通的鰕虎。凸出只有 3px，而且做成 3-3-1 的半球
    // （不是方塊），4 倍放大後才讀得出是兩顆球而不是兩塊補丁。
    // 兩顆並排、瞳孔都朝上——那是牠趴在灘上看天空的樣子。
    if (sp.indexOf('stalkEye') >= 0) {
      const ew = C.eyeWhite || '#f6f2e0';
      const pu = C.pupil || '#141a20';
      [0.78, 0.90].forEach(function (t) {
        const ex = Math.round(x0 + bodyW * t);
        const top = Math.round(cy - profile(t));
        const rows = [3, 3, 1];
        for (let dy = 0; dy < rows.length; dy++) {
          const hw = rows[dy] >> 1;
          for (let dx = -hw; dx <= hw; dx++) {
            const x = ex + dx, y = top - 1 - dy;
            if (x < 0 || x >= W || y < 0 || y >= H) continue;
            col[y * W + x] = ew;
          }
        }
        for (let dy = 2; dy <= 3; dy++) {
          const y = top - dy;
          if (ex < 0 || ex >= W || y < 0 || y >= H) continue;
          col[y * W + ex] = pu;
        }
      });
    }
    // --- 鉤吻（產卵期的雄鮭）---
    // 往前伸再往上鉤，鉤尖必須**高過吻端**才讀得出是「鉤」而不是一根多出來的鬍鬚。
    // 兩格厚也是為了這件事：1px 的線在這個尺寸一律會被讀成鬚。
    // 它往身體外長，所以登記在 HEAD_ROOM（10px），否則會被畫布右緣切光。
    if (sp.indexOf('kype') >= 0) {
      const kc = C.kype || FG.shade(back, 0.10);
      const tooth = C.tooth || '#f4efdc';
      const my = Math.round(cy + profile(0.97) * 0.5);
      const rise = profile(0.97) * 1.4 + 4;
      const len = 8;
      for (let k = 1; k <= len; k++) {
        const x = x1 + k;
        if (x < 0 || x >= W) break;
        // u^1.8：前段幾乎水平、末段急速上翹，才是「鉤」的曲線；線性上升會變成一根斜刺
        const y = Math.round(my - Math.pow(k / len, 1.8) * rise);
        for (let d = 0; d < 2; d++) {
          const yy = y + d;
          if (yy < 0 || yy >= H) continue;
          col[yy * W + x] = d === 0 ? FG.shade(kc, 0.16) : kc;
        }
        if (k % 3 === 0 && y - 1 >= 0) col[(y - 1) * W + x] = tooth;
      }
    }
    // --- 肉質鰭柄（腔棘魚）---
    // 腔棘魚的招牌是「鰭長在一根肉柄上」，所以柄要有厚度（3px）、末端要有小扇。
    // 只畫柄會變成一根棒子，只畫扇就跟一般的胸鰭沒兩樣——兩段都要。
    // 三支：下方兩支（胸鰭、腹鰭）＋上方一支（第二背鰭），上下都有才看得出不是普通的鰭。
    if (sp.indexOf('lobeFin') >= 0) {
      const lc = C.lobe || FG.mix(body, finC, 0.4);
      [[0.62, 1], [0.30, 1], [0.34, -1]].forEach(function (s) {
        const t = s[0], side = s[1];
        const bx = Math.round(x0 + bodyW * t);
        const by = Math.round(cy + side * profile(t) * 0.86);
        for (let k = 0; k < 5; k++) {
          const x = bx - Math.round(k * 0.8), y = by + side * k;
          for (let d = -1; d <= 1; d++) {
            const xx = x + d;
            if (xx < 0 || xx >= W || y < 0 || y >= H) continue;
            const i = y * W + xx;
            if (k === 0 && !col[i]) continue;               // 柄根要黏在身上，不憑空浮著
            col[i] = d === -1 ? FG.shade(lc, -0.2) : lc;
          }
        }
        const ex = bx - 4, ey = by + side * 5;
        for (let k = 0; k < 4; k++) {
          const x = ex - k;
          for (let d = 0; d < 2; d++) {
            const y = ey + side * (Math.round(k * 0.5) + d);
            if (x < 0 || x >= W || y < 0 || y >= H) continue;
            const i = y * W + x;
            if (!col[i]) col[i] = FG.shade(lc, 0.12);
          }
        }
      });
    }
    // --- 腹面吸盤（貼石性的溪流魚）---
    // 識別完全靠**底緣是一條完全水平的直線**——魚身上不會有直線，所以只要出現
    // 就一定被讀成「壓在一個平面上」。這跟 TERRAIN.pond 用等距直線表達人造物
    // 是同一條規則的反向應用。兩端各留 18% 收角，不收角會變成一件裙子
    if (sp.indexOf('sucker') >= 0) {
      const su = C.sucker || FG.mix(body, belly, 0.55);
      const rim = FG.shade(su, -0.34);
      const t0 = 0.34, t1 = 0.90;
      // 2.4 倍半高：盤子必須明顯**低於身體最寬處**，否則它會跟腹部連成一塊，
      // 那條「完全水平的底緣」就沒有機會被看見（初版設 1.75，整條魚讀起來像潛艇）
      const flat = cy + halfMax * 2.4;
      const xa = Math.round(x0 + bodyW * t0), xb = Math.round(x0 + bodyW * t1);
      for (let x = xa; x <= xb; x++) {
        if (x < 0 || x >= W) continue;
        const t = (x - x0) / bodyW;
        const s = (x - xa) / Math.max(1, xb - xa);
        const taper = Math.min(1, Math.min(s, 1 - s) / 0.18);
        const top = cy + profile(t) - 1;
        const bot = top + (flat - top) * taper;
        if (bot <= top) continue;
        for (let y = Math.round(top); y <= Math.round(bot); y++) {
          if (y < 0 || y >= H) continue;
          col[y * W + x] = su;
        }
        const by = Math.round(bot);
        if (by >= 0 && by < H) col[by * W + x] = rim;          // 盤緣的厚度
      }
    }
    // --- 額隆（隆頭魚的頭上那一包）---
    // 峰值刻意落在 t≈0.8 而不是吻端：長在最前面會被讀成「嘴腫起來」，
    // 長在眼睛後上方才是額頭。用 sin^0.7 讓它前緣陡、後緣緩
    if (sp.indexOf('hump') >= 0) {
      const hc = C.hump || FG.shade(back, 0.14);
      const t0 = 0.62, t1 = 1.0;
      const xa = Math.round(x0 + bodyW * t0), xb = Math.round(x0 + bodyW * t1);
      for (let x = xa; x <= xb; x++) {
        if (x < 0 || x >= W) continue;
        const t = (x - x0) / bodyW;
        const s = FG.clamp((x - xa) / Math.max(1, xb - xa), 0, 1);
        const rise = halfMax * 0.62 * Math.pow(Math.sin(Math.PI * s), 0.7);
        const base = cy - profile(t);
        const ty = Math.round(base - rise);
        for (let y = ty; y < base; y++) {
          if (y < 0 || y >= H) continue;
          col[y * W + x] = hc;
        }
        if (ty >= 0 && ty < H) col[ty * W + x] = FG.shade(hc, 0.22);
      }
    }
    // --- 外鰓（洞穴兩棲類與低溶氧水域的幼體）---
    // 三叢往**後上方**張開（頭在 x 大的一端，所以往後是 x 變小）。
    // 柄一定要 2px：1px 的斜線在這個尺寸會被讀成鬍鬚，而鬍鬚是往前的，方向相反也救不回來。
    // 末端要岔開成羽狀，只有一根柄就只是三根刺
    if (sp.indexOf('gills') >= 0) {
      const gc = C.gill || '#d8606a';
      const gl = FG.shade(gc, 0.26);
      [0.60, 0.67, 0.74].forEach(function (t, k) {
        const bx = Math.round(x0 + bodyW * t);
        const by = Math.round(cy - profile(t) * 0.86);
        const len = 5 + k;
        let ex = bx, ey = by;
        for (let s = 0; s <= len; s++) {
          ex = bx - Math.round(s * 0.75); ey = by - s;
          for (let d = 0; d < 2; d++) {
            const x = ex - d;
            if (x < 0 || x >= W || ey < 0 || ey >= H) continue;
            col[ey * W + x] = d ? FG.shade(gc, -0.18) : gc;
          }
        }
        // 末端的羽：三根往上、往後、往前各岔 3px
        [[-3, -2], [-1, -3], [1, -2]].forEach(function (v) {
          for (let s = 1; s <= 3; s++) {
            const x = Math.round(ex + v[0] * s / 3), y = Math.round(ey + v[1] * s / 3);
            if (x < 0 || x >= W || y < 0 || y >= H) continue;
            col[y * W + x] = gl;
          }
        });
      });
    }
    // --- 四肢（洞螈這類仍留著腳的水生種）---
    // 側視只會看到兩條，所以同一對錯開 2px、遠的那條壓暗，才讀得出「四條」。
    // 末端一定要有 3px 的橫向「手」，沒有的話就只是四根往下的刺
    if (sp.indexOf('limbs') >= 0) {
      const lc = C.limb || FG.mix(body, belly, 0.5);
      const far = FG.shade(lc, -0.28);
      [[0.68, 0], [0.68, 3], [0.24, 0], [0.24, 3]].forEach(function (v) {
        const t = v[0];
        const bx = Math.round(x0 + bodyW * t) - v[1];
        const by = Math.round(cy + profile(t) * 0.82);
        const c = v[1] ? far : lc;
        let lx = bx, ly = by;
        for (let s = 0; s < 5; s++) {
          lx = bx - Math.round(s * 0.4); ly = by + s;
          for (let d = 0; d < 2; d++) {
            const x = lx + d;
            if (x < 0 || x >= W || ly < 0 || ly >= H) continue;
            if (s === 0 && !col[ly * W + x]) continue;     // 肢根要黏在身上
            col[ly * W + x] = c;
          }
        }
        for (let d = -1; d <= 1; d++) {
          const x = lx + d;
          if (x < 0 || x >= W || ly + 1 < 0 || ly + 1 >= H) continue;
          col[(ly + 1) * W + x] = c;
        }
      });
    }
    // --- 無眼（洞穴生物）---
    // 把眼睛填回**同一條混色**（眼睛落在 v≈0.36，正好是 mix(back, body, 0.55) 那一帶），
    // 用別的顏色會留下一塊方形補丁。填完還要留一道暗痕：整片塗平會被讀成「畫忘了」，
    // 要看得出那裡曾經有一顆眼睛、後來被皮膚蓋住了
    if (sp.indexOf('blind') >= 0) {
      const ex = Math.round(x0 + bodyW * 0.87);
      const ey = Math.round(cy - profile(0.87) * 0.28);
      const skin = FG.mix(back, body, 0.55);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const i = (ey + dy) * W + (ex + dx);
        if (i >= 0 && i < W * H && col[i]) col[i] = skin;
      }
      for (let dx = 0; dx <= 1; dx++) {
        const a = ey * W + (ex + dx), b = (ey - 1) * W + (ex + dx);
        if (a >= 0 && a < W * H && col[a]) col[a] = FG.shade(skin, -0.18);
        if (b >= 0 && b < W * H && col[b]) col[b] = FG.shade(skin, 0.14);
      }
    }
    // --- 腕足（頭足類）---
    // 八條從外套膜後緣往畫面左方散開的腕。三件事缺一不可，少一件就變成水母：
    //   1. **基部粗、末端細，而且末端要捲。** 等寬又直的線一律被讀成觸手或繩子。
    //   2. **一列吸盤。** 每三格點一顆淺色，這是「腕」跟「觸手」唯一的分界。
    //   3. **遠側的四條要壓暗。** 側視看到的八條若全同色會糊成一片扇形；一深一淺
    //      交錯排才數得出有很多條。這條跟 `limbs` 的處理是同一個道理。
    // 腕往**尾側**（x 變小）長，所以不必登記 HEAD_ROOM——那張表只管吻端前方。
    if (sp.indexOf('arms') >= 0) {
      const ac = C.arm || FG.mix(body, back, 0.3);
      const su = C.sucker || FG.shade(belly, 0.16);
      // [附著點的縱向比例(−上 +下), 長度, 每格的縱向漂移, 是否為遠側]
      const ARMS = [[-0.86, 20, -0.42, 0], [-0.58, 25, -0.24, 1], [-0.28, 28, -0.06, 0], [-0.04, 30, 0.06, 1],
                    [0.22, 29, 0.20, 0], [0.48, 26, 0.38, 1], [0.70, 22, 0.56, 0], [0.88, 18, 0.72, 1]];
      ARMS.forEach(function (a) {
        const c = a[3] ? FG.shade(ac, -0.30) : ac;
        const rim = FG.shade(c, -0.34);
        const t0 = 0.16;
        const bx = x0 + bodyW * t0;
        const by = cy + a[0] * profile(t0);
        // ⚠️ 取樣密度：步距要小於 1px，而且**每一步要把上一個取樣點的 y 補起來**。
        //    初版一格一格畫（步距 0.92px），末段的急彎讓 y 一次跳兩三格，八條腕
        //    全部斷成虛線——lantern 的弧形竿踩過同一個坑（見上方 §特殊特徵的三條經驗）
        const steps = a[1] * 2;
        let py = Math.round(by);
        for (let s = 1; s <= steps; s++) {
          const u = s / steps;
          // 末端捲起來：縱向漂移用 u^1.6 加權，前段幾乎是直的、末段急彎
          const x = Math.round(bx - u * a[1] * 0.92);
          // 蜿蜒的振幅往末端收掉：末端還在抖的話 1px 寬的腕尖會散成幾顆孤立的點
          const y = Math.round(by + a[2] * a[1] * Math.pow(u, 1.6) + Math.sin(s * 0.12) * 1.4 * (1 - u * 0.75));
          const th = Math.max(1, Math.round(3.4 * Math.pow(1 - u, 0.55)));
          const ya = Math.min(py, y), yb = Math.max(py, y) + th - 1;
          for (let yy = ya; yy <= yb; yy++) {
            if (x < 0 || x >= W || yy < 0 || yy >= H) continue;
            col[yy * W + x] = (yy === yb && th > 1) ? rim : c;
          }
          // 吸盤：貼在腕的上緣，每三格一顆。腕太細（末段）就不畫，1px 寬的腕上
          // 再點一顆淺色等於把那一格的腕擦掉
          if (s % 6 === 1 && th >= 2 && x >= 0 && x < W && y >= 0 && y < H) col[y * W + x] = su;
          py = y;
        }
      });
    }
    // --- 橫長瞳（頭足類）---
    // 章魚的眼睛是一條**水平的長方形瞳孔**，這是「這不是魚」最便宜的訊號——
    // 圓瞳配上圓身體會被讀成一顆有眼睛的球。眼球也要比魚眼大得多（7×5 而不是 3×3），
    // 頭足類的眼佔頭部的比例本來就誇張。位置刻意跟預設的眼睛完全重疊，直接蓋掉它
    if (sp.indexOf('slitEye') >= 0) {
      const ex = Math.round(x0 + bodyW * 0.87);
      const ey = Math.round(cy - profile(0.87) * 0.28);
      const eyeW = C.eyeWhite || '#f4f8fb';
      const pupil = C.pupil || '#141a20';
      for (let dy = -2; dy <= 2; dy++) for (let dx = -3; dx <= 3; dx++) {
        if (Math.abs(dx) === 3 && Math.abs(dy) === 2) continue;      // 切四個角＝眼球是圓的
        const x = ex + dx, y = ey + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const i = y * W + x;
        if (col[i]) col[i] = eyeW;
      }
      for (let dx = -2; dx <= 2; dx++) {                             // 水平長瞳
        const x = ex + dx;
        if (x < 0 || x >= W || ey < 0 || ey >= H) continue;
        const i = ey * W + x;
        if (col[i]) col[i] = pupil;
      }
      for (let dx = -3; dx <= 2; dx++) {                             // 上眼瞼的稜，讓眼睛鼓出來
        const x = ex + dx, y = ey - 3;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const i = y * W + x;
        if (col[i]) col[i] = FG.shade(back, -0.24);
      }
    }

    // --- 描邊 ---
    const outCol = new Array(W * H).fill(null);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (col[i]) continue;
        if ((x > 0 && col[i - 1]) || (x < W - 1 && col[i + 1]) ||
            (y > 0 && col[i - W]) || (y < H - 1 && col[i + W])) {
          outCol[i] = outline;
        }
      }
    }

    /* ---------- 輸出 ---------- */
    const cv = px.make(W, H);
    const g = cv.getContext('2d');

    // 發光（魚王 / 傳說）
    if (sp.indexOf('glow') >= 0) {
      const glow = C.glow || '#8fe6ff';
      g.globalAlpha = 0.18;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (outCol[i]) {
          g.fillStyle = glow;
          g.fillRect(x - 1, y - 1, 3, 3);
        }
      }
      g.globalAlpha = 1;
    }

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (outCol[i]) { g.fillStyle = outCol[i]; g.fillRect(x, y, 1, 1); }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (col[i]) { g.fillStyle = col[i]; g.fillRect(x, y, 1, 1); }
    }
    return cv;
  };

  function hashStr(s) {
    let h = 2166136261;
    s = String(s);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  px.hashStr = hashStr;

  /* ---------- 雜物（非魚類）字元圖 ---------- */

  const JUNK_MAPS = {
    boot: {
      pal: { X: '#2b2018', d: '#5a4030', l: '#7b5a42', s: '#c9b48a' },
      map: [
        '....XXXXX.......',
        '...XdddddX......',
        '...XdlllldX.....',
        '...XdddddX......',
        '...XdlllldX.....',
        '...XdddddX......',
        '...XdddddXXXX...',
        '...XdddddddddX..',
        '..XdlllllllllX..',
        '..XdddddddddddX.',
        '..XsssssssssssX.',
        '..XXXXXXXXXXXXX.'
      ]
    },
    can: {
      pal: { X: '#3a4550', a: '#8d9aa6', b: '#c4ced6', r: '#b4453f' },
      map: [
        '...XXXXXXX...',
        '..XbbbbbbbX..',
        '..XbaaaaabX..',
        '..XbarrrabX..',
        '..XbarrrabX..',
        '..XbaaaaabX..',
        '..XbbbbbbbX..',
        '..XbaaaaabX..',
        '..XbbbbbbbX..',
        '...XXXXXXX...'
      ]
    },
    weed: {
      pal: { X: '#1e3a24', g: '#2f6b3a', l: '#4d9450' },
      map: [
        '......ll......',
        '.....lgl......',
        '..l..lgl..l...',
        '.lgl.Xgl.lgl..',
        '.lgl.XgX.lgX..',
        '..XgXXgXXgX...',
        '...XgXgXgX....',
        '....XgXgX.....',
        '.....XgX......',
        '.....XXX......'
      ]
    },
    bottle: {
      pal: { X: '#1d3b3a', g: '#2f6f6a', l: '#5aa39a', c: '#8a6a3a' },
      map: [
        '.....cc.....',
        '.....cc.....',
        '....XggX....',
        '...XgllgX...',
        '..XgllllgX..',
        '..XgllllgX..',
        '..XgllllgX..',
        '..XgllllgX..',
        '..XgllllgX..',
        '..XXXXXXXX..'
      ]
    },
    // 冰湖用：稜角分明的浮冰，光從左上進來所以左上最亮
    ice: {
      pal: { X: '#3f6d86', a: '#7fb4cc', b: '#b6dcec', c: '#e8f8ff' },
      map: [
        '....XXXX....',
        '...XccccX...',
        '..XcccbbbX..',
        '.XccbbbbbaX.',
        'XcbbbbbaaaX.',
        'XbbbbbaaaaX.',
        'XbbbaaaaaaX.',
        '.XbaaaaaaX..',
        '..XaaaaaX...',
        '...XXXXX....'
      ]
    },
    // 神域用：繪馬（五角形的木製祈願牌，上緣的尖頂是它的識別特徵）
    ema: {
      pal: { X: '#4a2e1c', w: '#a87c4e', l: '#d0a871', k: '#2b1a10' },
      map: [
        '.....XX.....',
        '....XwwX....',
        '...XwllwX...',
        '..XwllllwX..',
        '.XwlkkkklwX.',
        'XwllkllklwwX',
        'XwlkkkllklwX',
        'XwllkllkklwX',
        'XwwlllllllwX',
        '.XwwwwwwwwX.',
        '..XXXXXXXX..'
      ]
    },
    // 蓮江用：青花碎碗。缺口刻意開在右上（不是正中），對稱的破損看起來像設計而不是破掉；
    // 碗內的藍色紋樣要「斷開」跨過缺口，才讀得出是碎片而不是一只完整的小碗
    porcelain: {
      pal: { X: '#2b3a4e', w: '#eef3f8', s: '#c3d2de', b: '#2f5fa8', l: '#6f9bd6' },
      map: [
        'Xww.......',
        'XwwbX.....',
        'Xwlbbw.X..',
        'XwbllbwXwX',
        'Xwwbllbwww',
        'XswwbllbwX',
        'XsswwbbwwX',
        '.XsswwwwsX',
        '..XssssssX',
        '...XXXXXX.'
      ]
    },
    // 世界樹根用：裂開的維京圓盾。同心圓（鐵緣 → 彩繪環 → 中央凸飾）是圓盾的識別結構，
    // 少了中央那顆凸飾就只是一個圓圈。裂縫從右緣往內咬進去、右下角整塊缺掉——
    // 破損刻意做成**不對稱**，對稱的缺口會被讀成「設計」而不是「壞了」
    shield: {
      pal: { X: '#2a2118', w: '#c8b491', r: '#8e3a30', b: '#8a8f98', B: '#d4dae2' },
      map: [
        '...XXXXXX...',
        '..XwwwwwwX..',
        '.XwrrrrrrwX.',
        'XwrrwwwwrrwX',
        'XwrwwbbwXrwX',
        'XwrwbBBbwrwX',
        'XwrwwbbwwrwX',
        'XwrrwwwXrrwX',
        '.XwrrrrX.wX.',
        '..XwwwX.....',
        '...XXX......'
      ]
    },
    // 冥河用：刻字陶片（ostracon，古埃及拿破陶片當便條紙）。
    // 辨識重點是「不規則的多邊形輪廓 + 上面幾行橫向刻痕」——
    // 規則的方形會被讀成木板或磚，一定要缺角
    ostracon: {
      pal: { X: '#6b4f2a', c: '#c8a86a', l: '#e0c48f', k: '#3a2a14' },
      map: [
        '...XXXXX..',
        '..XllllcX.',
        '.XlkkklcXX',
        'XlkllkkkcX',
        'XlkkkllkcX',
        'XlkllkkccX',
        'XccllkkcX.',
        '.XccccccX.',
        '..XXcccX..',
        '....XXX...'
      ]
    },
    // 方池用：沉在池底的許願硬幣。**堆疊**是重點——單獨一枚圓片會被讀成瓶蓋或鈕扣，
    // 三枚錯開疊起來、每一枚都露出一道側面厚度，才讀得出是硬幣
    coins: {
      pal: { X: '#4a4020', g: '#e0bc52', l: '#f6e2a0', d: '#9a7a24', s: '#7a5f18' },
      map: [
        '...XXXX...',
        '..XlllgX..',
        '.XglllggX.',
        '.XdggggdX.',
        'XXXXXXXXX.',
        'XlllgggdX.',
        'XdgggggdX.',
        '.XXXXXXXXX',
        '.XllgggddX',
        '.XsssssssX',
        '..XXXXXXX.'
      ]
    },
    // 礁灘用：空的笠貝殼。放射狀的殼肋 ＋ 偏心的殼頂是笠貝的識別結構；
    // 少了殼肋就只是一個半圓，會跟浮球混在一起
    shell: {
      pal: { X: '#4a3f34', s: '#d8c8a8', l: '#f2e8d0', r: '#a8927a', i: '#8a7c68' },
      map: [
        '.....X....',
        '....XlX...',
        '...XllrX..',
        '..XlsrssX.',
        '.XlsrsrsrX',
        'XlsrsrsrsX',
        'XsrsrsrsrX',
        'XiiiiiiiiX',
        '.XXXXXXXX.'
      ]
    },
    // 深潭用：從上面掉下來的登山水壺。凹陷刻意只做在右側（不對稱），
    // 而且瓶頸要比瓶身窄一半以上——等寬的圓筒會被讀成鐵罐
    flask: {
      pal: { X: '#2a2f34', m: '#8f9aa4', l: '#cfd8e0', d: '#5a646e', c: '#6b5a3a' },
      map: [
        '...XXX....',
        '...XcX....',
        '..XXcXX...',
        '..XmlmX...',
        '.XmllmdX..',
        'XmllmmddX.',
        'XlllmmdXX.',
        'XlllmmdX..',
        'XlllmmddX.',
        'XmmmmmddX.',
        '.XXXXXXX..'
      ]
    },
    // 湯湖用：硫磺結晶塊。晶體要有**平的切面 + 明顯的稜線**（左上受光、右下陰影），
    // 沒有稜線的話一團黃色只會被讀成海綿或麵包
    brimstone: {
      pal: { X: '#5f4a10', y: '#e8cf4a', l: '#fbf0a0', d: '#a8880e', o: '#c9a520' },
      map: [
        '....XXX...',
        '...XllyX..',
        '..XlllyoX.',
        '.XllyyooXX',
        'XlyyoodoyX',
        'XyyoodddoX',
        'XyoodddddX',
        '.XoodddoX.',
        '..XXddXX..',
        '....XX....'
      ]
    },
    // 急湍用：磨圓的漂流木。棍子跟漂流木的差別只有一樣——**斷面的年輪**，
    // 所以成本全部花在左端那幾圈同心弧上，木身只要縱向紋理帶過
    driftwood: {
      pal: { X: '#3a2c1e', d: '#6a5238', m: '#8f7048', l: '#b09068', r: '#d8bc90' },
      map: [
        '..XXXX..........',
        '.XdrdrX.XXXX....',
        'XdrlrldXXmmmXX..',
        'XrldldrXmlmlmmX.',
        'XdrlrldXmmlmlmmX',
        'XrldldrXmlmlmlmX',
        'XdrdrdXXmmlmlmmX',
        '.XXXXX.XmlmmmmX.',
        '.......XXmmmXX..',
        '.........XXX....'
      ]
    },
    // 珊瑚礁用：折斷的鹿角珊瑚枝。**至少分岔兩次**才讀得出是珊瑚——
    // 只有一根的話是骨頭，兩根的話是樹枝。白化的枝是灰白的，帶一點殘留的紫
    coralfrag: {
      pal: { X: '#6a6070', w: '#ece6ea', d: '#b8b0bc', p: '#9a7fb0' },
      map: [
        '..X....X..',
        '.XwX..XwX.',
        '.XdX..XwX.',
        '..XwXXwX..',
        '..XdwwdX..',
        'X..XwwX..X',
        'XwX.XdX.Xw',
        'XdXXXwXXXd',
        '.XXXdpdXX.',
        '...XdpdX..',
        '...XXpXX..'
      ]
    },
    // 暗穴用：斷落的鐘乳石。**斷面的同心層理**是它跟一根石筍／木樁的唯一差別，
    // 所以斷口畫在上方（朝著觀眾）並且一圈一圈；破損照慣例做不對稱（右下角缺一塊）
    dripstone: {
      pal: { X: '#3a352c', s: '#8f8574', l: '#c0b49c', d: '#5f594a', m: '#a09680' },
      map: [
        '.XXXXXX...',
        'XlmlmlmX..',
        'XmslslsmX.',
        'XlmslsmlX.',
        'XsmlslmsX.',
        '.XsmlmsXX.',
        '.XsmsmsX..',
        '.XdsmsdX..',
        '..XdsdX...',
        '..XdsdXX..',
        '...XdX....'
      ]
    },
    // 深淵用：辨識不出物種的魚骨。頭在左、脊椎往右、肋骨是垂直短線
    // 舷窗：辨識全靠**銅環 ＋ 一側的鉸鏈／蝶形螺栓**。少了那幾顆凸出來的螺栓，
    // 一個同心圓會被讀成硬幣或圓盾（shield 就是靠中央凸飾才分得出來）。
    // 破損照慣例做不對稱：裂縫從右上斜切下來，右下角的玻璃整塊不見了
    porthole: {
      pal: { R: '#7a5a24', B: '#d8b45a', g: '#5f7f8c', h: '#a8c8d4', k: '#1a1620', o: '#b89a48' },
      map: [
        '.....RRRR.....',
        '...BBBBBBBB...',
        '..BBggggggBB..',
        '..BBghhgkgBB..',
        'oBBgghhkgggRR.',
        'oBBgggkggggRR.',
        '.BBggkkggggRRo',
        '.RRgggkg...RR.',
        '..RRgggg..RR..',
        '..RRRRRRRRRR..',
        '...RRRRRRRR...',
        '.....RRRR.....'
      ]
    },
    bone: {
      pal: { b: '#e6e0cc', o: '#2a2822' },
      map: [
        '...bbbb.........',
        '..b....b........',
        '.b..o...b.b.b...',
        'b........b.b.b.b',
        'b.......bbbbbbbb',
        'b........b.b.b.b',
        '.b......b.b.b...',
        '..b....b........',
        '...bbbb.........'
      ]
    }
  };

  function buildJunk(f) {
    const def = JUNK_MAPS[f.junkArt] || JUNK_MAPS.boot;
    const s = px.mapSize(def.map);
    const cv = px.make(SPR_W, SPR_H);
    const g = cv.getContext('2d');
    const scale = Math.max(1, Math.floor(Math.min(SPR_W / s.w, SPR_H / s.h) * 0.85));
    px.drawMap(g, def.map, def.pal,
      Math.round((SPR_W - s.w * scale) / 2),
      Math.round((SPR_H - s.h * scale) / 2), scale);
    return cv;
  }

  // 取得（並快取）魚 / 雜物精靈
  px.sprite = function (f) {
    if (!fishCache[f.id]) fishCache[f.id] = f.junkArt ? buildJunk(f) : buildFish(f);
    return fishCache[f.id];
  };

  // 把精靈畫到任意 ctx（等比縮放置中）
  px.drawSprite = function (ctx, f, x, y, scale, flip) {
    const sp = px.sprite(f);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(sp, -sp.width * scale / 2, -sp.height * scale / 2, sp.width * scale, sp.height * scale);
    ctx.restore();
  };

  // 產生一張「精靈放大版」canvas，直接塞進 DOM 用
  px.spriteEl = function (f, scale) {
    const sp = px.sprite(f);
    const cv = px.make(sp.width * scale, sp.height * scale);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(sp, 0, 0, cv.width, cv.height);
    return cv;
  };

  /* ============================================================
     人物與配角
     ============================================================ */

  const ANGLER = {
    pal: { h: '#2b1d16', s: '#d8a37a', j: '#3f6b52', k: '#2c4b3a', p: '#3a4657', b: '#241c18', r: '#e4d7bd' },
    map: [
      '....hhhh...',
      '...hhhhhh..',
      '...hsssjh..',
      '...ssssh...',
      '....sss....',
      '...jjjjj...',
      '..jjjjjjj..',
      '..jkjjjjj..',
      '..jjjjjjjs.',
      '..jjjjjj...',
      '...ppppp...',
      '...ppppp...',
      '...pp.pp...',
      '...bb.bb...'
    ]
  };

  const CAPY = {
    pal: { b: '#9a6b45', d: '#6f4a2e', e: '#2a1b12', n: '#c99568', p: '#e8b9a0' },
    map: [
      '..dd....dd......',
      '.dbbd..dbbd.....',
      '.bbbbbbbbbb.....',
      '.beb.bb.beb.....',
      '.bbbbbbbbbb.....',
      '.bbbbnnbbbbbbb..',
      '.bbbbbbbbbbbbbb.',
      '..bbbbbbbbbbbbb.',
      '..bbbbbbbbbbbb..',
      '...dd......dd...'
    ]
  };

  const HEART = {
    pal: { r: '#e2555f', l: '#f18c93' },
    map: [
      '.rr.rr.',
      'rlrrrrr',
      'rrrrrrr',
      '.rrrrr.',
      '..rrr..',
      '...r...'
    ]
  };

  /* ============================================================
     釣點場景
     ============================================================ */

  const SCENE_W = 200, SCENE_H = 340;
  const bgCache = {};

  px.sceneSize = { w: SCENE_W, h: SCENE_H };

  /* ------------------------------------------------------------
     地形產生器 · TERRAIN

     每個釣點用 scene.terrain 指定一種。**只負責畫地平線以上的剪影**
     （天空漸層、水面、倒影、深水都是共用的，不必也不該各寫一份）。
     這樣設計的好處：倒影是把地平線上方逐列取出來疊回水面的，
     所以換地形，倒影會自動跟著換，不需要為每種地形另寫倒影碼。

     簽名：above(ctx, ctx物件) — 見 buildBackground 裡組出來的 T 物件。
     另有選用的 below(...)，畫「站在水面上」的物件（例如鳥居），
     會在水面、倒影、深水全部畫完之後才執行。
     ------------------------------------------------------------ */
  const TERRAIN = {};

  // 一 · 森林：起伏山稜 + 遠中近三層針葉林（晨霧湖）
  TERRAIN.forest = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      if (P.hill) {
        let hy = horizon - 46;
        for (let x = 0; x < W; x++) {
          hy += (R() - 0.5) * 2.4;
          hy = FG.clamp(hy, horizon - 62, horizon - 30);
          rect(x, hy, 1, horizon - hy, P.hill);
        }
      }
      T.forest(horizon - 12, 22, P.farTree, 90, P.accent);
      T.forest(horizon - 4, 26, P.midTree, 80, P.accent);
      T.forest(horizon + 1, 20, P.nearTree, 60, P.accent2 || P.accent);
    }
  };

  // 二 · 峽灣：兩側崖壁夾出中央水道 + 幾根海蝕柱（落霞峽灣）
  //   崖高用 pow 曲線從邊緣往中央衰減，中間留白才有「峽」的感覺
  TERRAIN.cliff = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;

      function wall(color, peak, reach, side, jag) {
        let noise = 0;
        for (let x = 0; x < W; x++) {
          const d = side < 0 ? x / reach : (W - 1 - x) / reach;    // 0 = 貼著畫面邊緣
          if (d > 1) continue;
          noise += (R() - 0.5) * jag;
          noise = FG.clamp(noise, -6, 6);
          const h = peak * Math.pow(1 - d, 1.7) + noise * (1 - d);
          if (h < 2) continue;
          rect(x, horizon - h, 1, h, color);
          // 崖面的垂直節理：每 7px 一道暗紋，讓平塗的剪影有岩壁質感
          if (x % 7 === 0) rect(x, horizon - h * 0.8, 1, h * 0.8, FG.shade(color, -0.22));
        }
      }
      // 遠側崖（淺）先畫，近側崖（深）後畫蓋上去，做出空氣透視
      wall(P.farTree, 74, 120, -1, 2.2);
      wall(P.farTree, 62, 96, 1, 2.2);
      wall(P.midTree, 92, 74, -1, 3.0);
      wall(P.nearTree, 104, 58, 1, 3.4);

      // 中央水道上的海蝕柱
      for (let i = 0; i < 3; i++) {
        const sx = 78 + Math.floor(R() * 46);
        const sh = 12 + R() * 22, sw = 3 + Math.floor(R() * 3);
        rect(sx, horizon - sh, sw, sh, P.midTree);
        rect(sx, horizon - sh, 1, sh, FG.shade(P.midTree, 0.18));
      }
    }
  };

  // 三 · 冰原：遠方冰川牆 + 擠壓冰脊（三角冰刺）+ 水面浮冰（幽藍冰湖）
  TERRAIN.ice = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;

      // 遠方冰川牆：一整條平頂的塊體，用垂直裂隙線做出厚度
      const wallTop = horizon - 34;
      rect(0, wallTop, W, horizon - wallTop, P.farTree);
      // 裂隙：只從冰川「底部」往上長，長度短。從頂端往下垂會被看成雨絲
      for (let x = 0; x < W; x += 3) {
        if (R() < 0.55) continue;
        const d = 3 + R() * 9;
        rect(x, horizon - d, 1, d, FG.shade(P.farTree, R() < 0.5 ? 0.16 : -0.24));
      }
      rect(0, wallTop, W, 2, FG.shade(P.farTree, 0.3));   // 冰川頂緣的受光面

      // 擠壓冰脊：**刻意畫成又寬又扁的斜面板塊**，而不是三角錐——
      // 尖三角在這個尺寸下會被誤讀成針葉樹，那就跟晨霧湖沒有分別了
      function ridge(baseY, maxH, color, n, lean) {
        for (let i = 0; i < n; i++) {
          const x = Math.floor(R() * (W + 30)) - 15;
          const h = maxH * (0.4 + R() * 0.7);
          const w = Math.max(10, Math.round(h * (1.8 + R() * 1.6)));   // 寬遠大於高
          const topW = w * (0.25 + R() * 0.3);                          // 頂面是平的，不收到一點
          for (let k = 0; k < h; k++) {
            const t = k / h;
            const ww = Math.max(2, Math.round(w + (topW - w) * t));
            const off = Math.round(k * lean);
            rect(x - ww / 2 + off, baseY - k - 1, ww, 1, color);
          }
          // 左上受光面 + 頂緣高光，是「冰」而不是「岩」的關鍵
          for (let k = 0; k < h; k++) {
            const t = k / h;
            const ww = Math.max(2, Math.round(w + (topW - w) * t));
            rect(x - ww / 2 + Math.round(k * lean), baseY - k - 1, Math.max(1, Math.round(ww * 0.28)), 1, FG.shade(color, 0.3));
          }
          rect(x - topW / 2 + Math.round(h * lean), baseY - h - 1, topW, 1, FG.shade(color, 0.42));
        }
      }
      ridge(horizon - 2, 13, P.midTree, 14, 0.5);
      ridge(horizon + 2, 18, P.nearTree, 11, -0.42);
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      // 水面浮冰：越靠近畫面下緣越大，做出景深。避開船身區域（x 40~150、y 225~260）
      for (let i = 0; i < 14; i++) {
        const y = horizon + 8 + R() * (H - horizon - 30);
        const near = (y - horizon) / (H - horizon);
        const w = Math.round(6 + near * 22 + R() * 8);
        const x = Math.round(R() * (W + 20)) - 10;
        if (x + w > 34 && x < 158 && y > 216 && y < 268) continue;
        const h = Math.max(2, Math.round(w * 0.28));
        rect(x, y, w, h, P.floe || '#cfe8f4');
        rect(x + 1, y, w - 2, 1, FG.shade(P.floe || '#cfe8f4', 0.25));
        rect(x, y + h, w, 1, FG.shade(P.floe || '#cfe8f4', -0.45));   // 貼水面的暗邊
      }
    }
  };

  // 四 · 夜海：星空 + 低矮海蝕柱 + 水面生物發光（深淵海溝）
  //   這裡沒有陸地可畫，改用「幾乎空無一物」來表達開闊與不安
  TERRAIN.night = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      // 星星：越靠近地平線越稀疏（大氣消光）
      for (let i = 0; i < 150; i++) {
        const y = Math.floor(Math.pow(R(), 0.7) * (horizon - 6));
        const x = Math.floor(R() * W);
        const bright = R();
        if (bright < 0.12) rect(x, y, 2, 1, P.star || '#dff2ff');
        else rect(x, y, 1, 1, bright < 0.5 ? FG.shade(P.star || '#dff2ff', -0.45) : (P.star || '#dff2ff'));
      }
      // 遠方海蝕柱：少而粗，成一小群。太多太細會變成一排欄杆
      const cluster = 20 + R() * 90;
      for (let i = 0; i < 4; i++) {
        const x = Math.floor(cluster + R() * 70);
        const h = 9 + R() * 22;
        const w = 5 + Math.floor(R() * 7);
        rect(x, horizon - h, w, h, P.nearTree);
        rect(x, horizon - h, 1, h, FG.shade(P.nearTree, 0.35));   // 迎光的那一側
      }
      // 貼著地平線的一層薄霧，把星空與海面分開
      for (let k = 0; k < 5; k++) {
        T.g.globalAlpha = 0.1 * (5 - k) / 5;
        rect(0, horizon - 6 + k, W, 1, P.hill || '#0a1622');
      }
      T.g.globalAlpha = 1;
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      // 生物發光：成團的靜態光點，密度往下增加
      for (let i = 0; i < 90; i++) {
        const y = horizon + 4 + Math.pow(R(), 0.6) * (H - horizon - 6);
        const x = Math.floor(R() * W);
        T.g.globalAlpha = 0.25 + R() * 0.5;
        rect(x, y, 1, 1, P.plankton || '#5fe0d8');
      }
      T.g.globalAlpha = 1;
    }
  };

  // 五 · 神域：錐形雪山 + 五重塔 + 櫻花林，鳥居立在水上（宵櫻神域）
  TERRAIN.shrine = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;

      // --- 錐形雪山：直線斜邊，跟 forest 的隨機遊走山稜是完全不同的輪廓 ---
      const peakX = 128, peakY = horizon - 86, slope = 1.45;
      for (let y = peakY; y < horizon; y++) {
        const half = (y - peakY) * slope;
        const snow = (y - peakY) < 22;
        // 山頂積雪的下緣做成不規則，避免一條死板的水平線
        const jag = snow && (y - peakY) > 15 ? Math.sin(y * 2.7) * 3 : 0;
        rect(peakX - half, y, half * 2, 1, snow ? (P.snow || '#eef4f8') : P.hill);
        if (snow && (y - peakY) > 14) {
          rect(peakX - half, y + jag, half * 0.5, 1, P.hill);        // 左側的雪線缺口
          rect(peakX + half * 0.6, y - jag, half * 0.4, 1, P.hill);  // 右側
        }
      }
      // 山體左側的陰影面
      for (let y = peakY; y < horizon; y++) {
        const half = (y - peakY) * slope;
        rect(peakX - half, y, Math.max(1, half * 0.22), 1, FG.shade(P.hill, -0.22));
      }

      // --- 五重塔剪影（左側）：五層屋簷，每層往上收窄 ---
      const tx = 34, tBase = horizon - 2;
      let ty = tBase;
      for (let lv = 0; lv < 5; lv++) {
        const w = 26 - lv * 3.4;              // 塔身寬度往上收
        const eaves = w + 9;                  // 屋簷比塔身寬，這是日式塔最明顯的特徵
        rect(tx - w / 2, ty - 11, w, 11, P.pagoda || '#3a2630');
        rect(tx - eaves / 2, ty - 14, eaves, 3, P.pagodaRoof || '#241a22');
        rect(tx - eaves / 2 + 1, ty - 15, eaves - 2, 1, FG.shade(P.pagodaRoof || '#241a22', 0.25));
        ty -= 14;
      }
      rect(tx - 1, ty - 9, 2, 9, P.pagodaRoof || '#241a22');   // 頂上的相輪

      // --- 櫻花林：圓形樹冠（不是針葉的三角形），花色為主、樹幹細 ---
      function sakura(baseY, n, size, canopy, trunk) {
        for (let i = 0; i < n; i++) {
          const x = Math.floor(R() * (W + 16)) - 8;
          const r = size * (0.6 + R() * 0.7);
          const cy = baseY - r - 3;
          rect(x - 1, cy, 2, r + 4, trunk);                       // 樹幹
          for (let dy = -r; dy <= r; dy++) {                      // 圓形樹冠
            const half = Math.sqrt(Math.max(0, r * r - dy * dy));
            rect(x - half, cy + dy, half * 2, 1, canopy);
          }
          for (let k = 0; k < 4; k++) {                           // 樹冠上緣的亮色花簇
            const a = R() * Math.PI;
            rect(x + Math.cos(a) * r * 0.6, cy - Math.sin(a) * r * 0.55, 2, 2, FG.shade(canopy, 0.28));
          }
        }
      }
      sakura(horizon - 6, 16, 7, P.farTree, FG.shade(P.farTree, -0.5));
      sakura(horizon + 1, 13, 10, P.midTree, P.trunk || '#4a3038');

      // --- 岸邊的石燈籠 ---
      for (let i = 0; i < 3; i++) {
        const lx = 8 + Math.floor(R() * (W - 16));
        if (lx > 100 && lx < 160) continue;
        rect(lx - 1, horizon - 9, 3, 9, P.stone || '#8a8378');
        rect(lx - 3, horizon - 14, 7, 4, P.stone || '#8a8378');
        rect(lx - 4, horizon - 16, 9, 2, FG.shade(P.stone || '#8a8378', -0.3));
      }
    },
    below: function (T) {
      const { P, W, horizon, rect } = T;
      // --- 立在水上的大鳥居 ---
      // 位置刻意偏右上（水平線後方一點），才不會跟船與浮標打架
      const cx = 156, baseY = horizon + 46, hgt = 54;
      const red = P.torii || '#c8442f';
      const dark = FG.shade(red, -0.34);
      const top = baseY - hgt;

      function post(x) {
        rect(x - 2, top + 6, 5, hgt - 6, red);
        rect(x - 2, top + 6, 1, hgt - 6, FG.shade(red, 0.22));   // 柱子的受光邊
        rect(x + 2, top + 6, 1, hgt - 6, dark);
      }
      post(cx - 17); post(cx + 17);

      // 笠木（最上面那根，兩端上翹是鳥居的識別特徵）＋島木
      rect(cx - 30, top, 60, 4, dark);
      rect(cx - 32, top + 1, 3, 2, dark);
      rect(cx + 29, top + 1, 3, 2, dark);
      rect(cx - 27, top + 4, 54, 3, red);
      // 貫（中間那根橫木）與額束
      rect(cx - 22, top + 17, 44, 3, red);
      rect(cx - 2, top + 6, 4, 12, red);

      // 倒影：往下鏡射、越遠越淡，讓鳥居真的「站在水裡」
      const g = T.g;
      for (let y = 0; y < hgt; y++) {
        const src = baseY - 1 - y, dst = baseY + 1 + y;
        if (dst >= T.H) break;
        const img = g.getImageData(cx - 34, src, 68, 1);
        const d = img.data;
        let any = false;
        for (let i = 0; i < d.length; i += 4) {
          // 只留下鳥居的朱色（R 明顯大於 B），水面本身不重複疊
          if (d[i] > d[i + 2] + 24 && d[i] > 90) { d[i + 3] = 120; any = true; }
          else d[i + 3] = 0;
        }
        if (!any) continue;
        const tmp = px.make(68, 1);
        tmp.getContext('2d').putImageData(img, 0, 0);
        g.globalAlpha = 0.75 * (1 - y / hgt);
        g.drawImage(tmp, cx - 34 + Math.round(Math.sin(y * 0.8) * 1.5), dst);
        g.globalAlpha = 1;
      }
    }
  };

  // 六 · 峰林水鄉：桂林式圓頂石灰岩塔峰 + 山腰霧帶 + 白牆黑瓦，月拱橋跨在水上（煙雨蓮江）
  //   輪廓要跟既有五種都不撞：塔峰是「垂直側壁 + 圓頂」，跟 cliff 貼邊的崖壁、
  //   shrine 的直線斜邊錐山、ice 的寬扁板塊、night 的矮胖海蝕柱都不一樣。
  //   真正把它變成「中國山水」的不是塔峰，是**橫向的霧帶**——把峰群切成上下兩截，
  //   遠近立刻分開，而且沒有別的地形用橫條。
  TERRAIN.karst = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      const g = T.g;

      // --- 塔峰產生器 ---
      // 側壁近乎垂直（往上只微微內收），頂部用半圓收頭。石灰岩溶蝕出來的就是這個形狀，
      // 也剛好是這個尺寸下唯一不會被誤讀成樹或雪山的山形。
      function tower(cx, h, w, color, streak) {
        const top = horizon - h;
        const capR = Math.max(2, Math.round(w * 0.5));    // 圓頂半徑 = 半個柱寬
        for (let y = top + capR; y < horizon; y++) {
          const t = (y - top) / h;
          const half = w * 0.5 * (0.82 + t * 0.18);       // 越往下越寬，但幅度很小
          rect(cx - half, y, half * 2, 1, color);
        }
        for (let dy = 0; dy < capR; dy++) {               // 半圓頂
          const half = Math.sqrt(Math.max(0, capR * capR - (capR - dy) * (capR - dy))) * (w * 0.5 / capR);
          rect(cx - half, top + dy, half * 2, 1, color);
        }
        // 迎光的左側亮邊 + 垂直溶蝕溝。溝要「從底部往上長」且長度不到全高，
        // 從頂端往下垂的細線在這個尺寸會被讀成雨絲（冰川裂隙踩過的坑）
        rect(cx - w * 0.5 * 0.98, top + capR, Math.max(1, w * 0.16), h - capR, FG.shade(color, 0.2));
        if (streak) {
          for (let i = 0; i < 3; i++) {
            const ox = (R() - 0.5) * w * 0.7;
            const sh = h * (0.25 + R() * 0.3);
            rect(cx + ox, horizon - sh, 1, sh, FG.shade(color, -0.26));
          }
        }
      }

      // 三層峰群，由遠而近。近層刻意留出中央的水道，不然船會被峰壁擋住
      const far = [22, 52, 86, 120, 152, 182];
      far.forEach(function (x) { tower(x + (R() - 0.5) * 10, 54 + R() * 30, 16 + R() * 12, P.farTree, false); });
      [8, 62, 138, 192].forEach(function (x) { tower(x + (R() - 0.5) * 12, 42 + R() * 26, 20 + R() * 14, P.midTree, true); });
      [-6, 206].forEach(function (x) { tower(x, 34 + R() * 20, 26 + R() * 14, P.nearTree, true); });

      // --- 山腰霧帶 ---
      // 三條半透明橫帶，越靠近峰腳越厚越白（霧會積在谷底）。
      // 這是整個地形的靈魂：山水畫的留白就是這樣做的，而且沒有別的地形用橫條。
      // 參數是 [峰高比例, 厚度px, 最大不透明度]
      const mist = P.mist || '#dfe8ee';
      [[0.30, 7, 0.34], [0.52, 6, 0.24], [0.74, 4, 0.15]].forEach(function (b) {
        const y = horizon - (horizon * b[0]);
        for (let k = 0; k < b[1]; k++) {
          g.globalAlpha = b[2] * Math.sin(Math.PI * (k + 0.5) / b[1]);
          rect(0, y + k, W, 1, mist);
        }
      });
      g.globalAlpha = 1;

      // --- 岸邊水鄉：白牆黑瓦。屋頂兩端往上翹是中式屋面的識別特徵 ---
      function house(hx, hw, hh) {
        const wall = P.wall || '#e4e8e6', tile = P.tile || '#2b3038';
        rect(hx, horizon - hh, hw, hh, wall);
        rect(hx, horizon - hh, 1, hh, FG.shade(wall, -0.16));            // 牆面的暗側
        rect(hx - 2, horizon - hh - 3, hw + 4, 3, tile);                 // 屋面
        rect(hx - 3, horizon - hh - 4, 2, 1, tile);                      // 左翹角
        rect(hx + hw + 1, horizon - hh - 4, 2, 1, tile);                 // 右翹角
        rect(hx - 2, horizon - hh - 3, hw + 4, 1, FG.shade(tile, 0.26)); // 屋脊受光
        if (hw >= 9) rect(hx + Math.round(hw / 2) - 1, horizon - hh + 2, 3, 4, FG.shade(tile, 0.1)); // 窗洞
      }
      // 左岸一叢、右岸一叢，中央（船的位置）留空
      house(14, 15, 13); house(30, 10, 9); house(4, 9, 8);
      house(160, 13, 11); house(174, 17, 14);

      // --- 竹叢：細直桿 + 頂端一小撮葉。刻意不用 T.forest()，針葉三角會撞到晨霧湖 ---
      for (let i = 0; i < 22; i++) {
        const x = Math.floor(R() * W);
        if (x > 78 && x < 150) continue;                  // 中央留給水道
        const h = 10 + R() * 12;
        rect(x, horizon - h, 1, h, P.trunk || '#4a5c3a');
        for (let k = 0; k < 3; k++) {
          rect(x - 2 + Math.floor(R() * 5), horizon - h - 1 + k, 2, 1, P.accent ? P.accent[0] : '#6f8a4a');
        }
      }
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;

      // --- 水面荷葉 ---
      // 扁橢圓（不是圓），越靠畫面下緣越大。少數幾片配一朵粉花就夠了——
      // 花太多會變成花田，這裡要的是水鄉而不是花園。
      // 先畫荷葉再畫橋，橋才會像個實體壓在葉子上面
      const pad = P.lotus || '#3f7a52';
      for (let i = 0; i < 26; i++) {
        const y = horizon + 10 + R() * (H - horizon - 26);
        const near = (y - horizon) / (H - horizon);
        const rw = Math.round(3 + near * 9 + R() * 3);
        const rh = Math.max(1, Math.round(rw * 0.42));
        const x = Math.round(R() * (W + 16)) - 8;
        if (x + rw > 34 && x - rw < 158 && y > 212 && y < 270) continue;   // 避開船
        for (let dy = -rh; dy <= rh; dy++) {
          const half = Math.sqrt(Math.max(0, 1 - (dy / rh) * (dy / rh))) * rw;
          rect(x - half, y + dy, half * 2, 1, dy < 0 ? FG.shade(pad, 0.16) : pad);
        }
        rect(x - 1, y - rh - 1, 2, 1, FG.shade(pad, -0.35));               // 葉柄接點
        if (R() < 0.22) {                                                   // 蓮花
          const bl = P.bloom || '#f0a8c4';
          rect(x - 1, y - rh - 4, 3, 3, bl);
          rect(x, y - rh - 5, 1, 1, FG.shade(bl, 0.3));
        }
      }

      // --- 月拱橋 ---
      // 半圓的橋拱是這個場景最強的識別物：全遊戲沒有別的東西是圓弧。
      // 位置偏右後方，避開船（x 40~150、y 216~268）與浮標（112,232 / 152,208）
      const bcx = 158, bTop = horizon + 16, span = 46, rise = 17;
      const bc = P.bridge || '#b8b0a4';
      for (let x = -span / 2; x <= span / 2; x++) {
        const t = x / (span / 2);
        const y = bTop + Math.round((1 - Math.sqrt(Math.max(0, 1 - t * t))) * rise);
        rect(bcx + x, y, 1, 3, bc);                       // 橋面
        rect(bcx + x, y, 1, 1, FG.shade(bc, 0.24));       // 橋面受光
        // 橋墩：只在兩端往下延伸到水面
        if (Math.abs(t) > 0.78) rect(bcx + x, y + 3, 1, bTop + rise + 6 - y - 3, FG.shade(bc, -0.3));
      }
      // 橋下的拱洞邊緣，讓「拱」不只是一條線
      for (let x = -span * 0.38; x <= span * 0.38; x++) {
        const t = x / (span * 0.38);
        const y = bTop + rise - Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * (rise - 3));
        rect(bcx + x, y, 1, 1, FG.shade(bc, -0.42));
      }

      // --- 貼水面的一層薄霧，把水鄉與水面接起來 ---
      for (let k = 0; k < 6; k++) {
        g.globalAlpha = 0.09 * (6 - k) / 6;
        rect(0, horizon + 2 + k, W, 1, P.mist || '#dfe8ee');
      }
      g.globalAlpha = 1;
    }
  };

  // 七 · 世界樹：極光帷幕 + 一根貫穿畫面的巨大樹幹 + 岸邊符文石，樹根拱出水面（世界樹根）
  //   構圖上跟前六種都不同：前六種都是「很多個小東西排開」，這一種是**單一巨物**。
  //   在 200×340 的畫布上，一個佔掉三分之一寬度的物件是最強的辨識手段。
  TERRAIN.yggdrasil = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      const g = T.g;

      // --- 星空：刻意稀疏，極光才是主角 ---
      for (let i = 0; i < 70; i++) {
        const y = Math.floor(Math.pow(R(), 0.8) * (horizon - 24));
        const s = P.star || '#dfeaff';
        rect(Math.floor(R() * W), y, 1, 1, R() < 0.3 ? s : FG.shade(s, -0.45));
      }

      // --- 極光帷幕 ---
      // 真實極光是**垂直的簾子**，不是橫向的帶。做法：先算一條 sin 疊 sin 的下緣，
      // 再從下緣往上畫垂直筆畫、alpha 隨高度衰減。每 3px 一道較亮的筆畫，
      // 筆畫之間的明暗差就是簾子的褶皺。
      // **刻意不用橫帶**——那會撞到 karst 的山腰霧帶。
      // 兩道簾子的 base 要拉開 40px 以上，否則會在中間疊成一團、分不出青綠與紫兩層。
      // 初版只差 30px、高度又設 34/46，結果整片糊在一起
      const cols = P.aurora || ['#5fe0a8', '#8f7fe0'];
      for (let b = 0; b < cols.length; b++) {
        const base = horizon - 22 - b * 40;
        const amp = 12 + b * 6, ph = b * 2.1, hgt = 30 + b * 4;
        for (let x = 0; x < W; x++) {
          const by = base + Math.sin(x * 0.035 + ph) * amp + Math.sin(x * 0.11 + ph * 2) * 4;
          const stroke = (x % 3) === 0 ? 1 : 0.5;
          for (let k = 0; k < hgt; k += 2) {
            const y = by - k;
            if (y < -1) break;
            g.globalAlpha = 0.27 * stroke * Math.pow(1 - k / hgt, 1.4);
            rect(x, y, 1, 2, cols[b]);
          }
        }
      }
      g.globalAlpha = 1;

      // --- 世界樹 ---
      // 樹幹貫穿整個畫面、樹冠畫到畫面外，用「裝不下」來表達尺度。
      // 位置偏左（tx=38），中央水道留給船與浮標
      const bark = P.bark || '#3a2a1e';
      const tx = 38;
      for (let y = 0; y < horizon; y++) {
        const t = y / horizon;
        const half = 9 + t * t * 14;                 // 往下逐漸變粗，接近根部才明顯張開
        rect(tx - half, y, half * 2, 1, bark);
        rect(tx - half, y, Math.max(1, half * 0.26), 1, FG.shade(bark, 0.24));   // 受光側
        if (y % 5 === 0) rect(tx + half * 0.1, y, Math.max(1, half * 0.45), 1, FG.shade(bark, -0.3));
      }
      // 往右上斜出的粗枝：只畫根部，末端出畫面（同樣是「裝不下」）
      [[0.10, 1.7, 7], [0.30, 1.15, 5], [0.52, 0.7, 4]].forEach(function (b) {
        const y0 = horizon * b[0];
        for (let k = 0; k < 60; k++) {
          const x = tx + 11 + k, y = y0 - k * b[1];
          if (x >= W || y < 0) break;
          rect(x, y, 1, Math.max(2, b[2] - k * 0.09), bark);
        }
      });

      // --- 岸邊符文石 ---
      // 石板要**微微傾斜**：立正的石板看起來像柱子，歪的才像「被人立起來很久了」
      const stn = P.stone || '#6f6a78';
      const rn = P.rune || '#d8c08f';
      [[92, 23, 0.14], [126, 17, -0.11], [178, 27, 0.08], [152, 13, 0.2]].forEach(function (s) {
        const sx = s[0], h = s[1], lean = s[2];
        for (let k = 0; k < h; k++) {
          const w = 6 - k * 0.06;
          rect(sx + k * lean - w / 2, horizon - 1 - k, w, 1, stn);
        }
        rect(sx + h * lean - 2, horizon - h - 1, 4, 1, FG.shade(stn, 0.26));
        // 刻痕：橫向短線加偶爾一道豎筆，構成「讀不懂但有規律」的字樣
        for (let k = 3; k < h - 3; k += 4) {
          rect(sx + k * lean - 2, horizon - 1 - k, 4, 1, rn);
          if (k % 8 === 3) rect(sx + k * lean, horizon - 2 - k, 1, 2, rn);
        }
      });
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;
      const bark = P.bark || '#3a2a1e';

      // --- 樹根拱出水面 ---
      // 樹在左，所以只畫左側；全部避開船（x 34~158、y 212~270）
      [[16, 36, 17], [32, 26, 12], [52, 20, 9]].forEach(function (r) {
        const cx = r[0], span = r[1], rise = r[2];
        const baseY = horizon + 16 + (rise - 9);
        for (let x = -span / 2; x <= span / 2; x++) {
          const t = x / (span / 2);
          const y = baseY - Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * rise);
          const th = Math.max(2, Math.round(3 + (1 - Math.abs(t)) * 2));
          rect(cx + x, y, 1, th, bark);
          rect(cx + x, y, 1, 1, FG.shade(bark, 0.22));
        }
      });

      // --- 水面上的符文光 ---
      // 幾組 3×3 的發光刻痕，暗示「這口泉水自己記著什麼」。
      // 數量刻意少（5 組），多了會變成裝飾圖案而不是遺跡
      const rn = P.rune || '#d8c08f';
      for (let i = 0; i < 5; i++) {
        const x = Math.round(20 + R() * (W - 50));
        const y = Math.round(horizon + 22 + R() * (H - horizon - 60));
        if (x > 24 && x < 168 && y > 206 && y < 276) continue;   // 避開船
        g.globalAlpha = 0.42 + R() * 0.3;
        rect(x, y + 1, 5, 1, rn);
        rect(x + 2, y, 1, 3, rn);
        rect(x + (R() < 0.5 ? 0 : 4), y + (R() < 0.5 ? 0 : 2), 1, 1, rn);
      }
      g.globalAlpha = 1;
    }
  };

  // 八 · 沙漠冥河：沙丘 + 大金字塔 + 方尖碑 + 棕櫚，半淹的石柱與紙莎草在水面（黃沙冥河）
  //   金字塔本來是「尖三角」的高風險輪廓（§16 說尖三角一律被讀成針葉樹），
  //   靠三件事把它救回來：**尺寸夠大**（70×46，是針葉樹的 4 倍）、
  //   **左右兩面明暗分明**（垂直中線一分為二，樹沒有這個）、
  //   **底邊坐在平坦的沙丘線上**（樹是插在起伏的林線裡）。
  TERRAIN.desert = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;

      // --- 沙丘：平滑的 sin 稜線，不是隨機遊走 ---
      // 沙丘的識別特徵是「迎風面長而緩、背風面短而陡」，所以每一層都畫成
      // 不對稱的曲線，並在背風側壓一道暗面
      function dune(baseY, amp, freq, ph, color, lit) {
        for (let x = 0; x < W; x++) {
          const u = x * freq + ph;
          // sin 疊一個半頻，做出不對稱的稜線
          const h = amp * (0.55 + 0.45 * Math.sin(u)) + amp * 0.22 * Math.sin(u * 0.5 + 1.1);
          const top = baseY - h;
          rect(x, top, 1, baseY - top + 2, color);
          rect(x, top, 1, 2, lit);                                 // 稜線受光
          // 背風面（稜線右側往下）壓暗
          const slope = Math.cos(u);
          if (slope < -0.3) rect(x, top + 2, 1, h * 0.5, FG.shade(color, -0.22));
        }
      }
      // ★ 保底沙地：先鋪一條實心沙帶接到岸線。
      // sin 曲線的波谷高度可能趨近 0，只靠沙丘曲線的話波谷處會露出一條天空色的縫
      // （初版就是這樣，地平線上方有 10px 的假天空）。有這條保底帶就跟曲線參數無關了。
      // 上緣要蓋過遠沙丘的 baseY（horizon-14），否則波谷處的 y=124~125 還是會漏
      rect(0, horizon - 17, W, 21, P.midTree);

      // 遠沙丘先畫；近沙丘要**最後**才畫，才能把金字塔與方尖碑的底部遮住做出景深
      dune(horizon - 14, 20, 0.030, 0.4, P.farTree, FG.shade(P.sandLit || '#e8c88f', 0.1));

      // --- 大金字塔（＋後方一座小的）---
      function pyramid(cx, base, h, half) {
        const lit = FG.shade(P.pyramid || '#c0975a', 0.22);
        const dark = FG.shade(P.pyramid || '#c0975a', -0.26);
        for (let k = 0; k < h; k++) {
          const w = Math.round(half * 2 * (1 - k / h));
          const x0p = cx - w / 2;
          // 垂直中線一分為二：左受光、右陰影。這是把它跟樹分開的關鍵
          rect(x0p, base - k, w / 2, 1, lit);
          rect(cx, base - k, w / 2, 1, dark);
          if (k % 6 === 0) rect(x0p, base - k, w, 1, FG.shade(P.pyramid || '#c0975a', -0.1));  // 層階
        }
        rect(cx - 1, base - h, 2, 2, FG.shade(P.pyramid || '#c0975a', 0.4));    // 頂石
      }
      pyramid(64, horizon - 14, 44, 36);
      pyramid(116, horizon - 16, 26, 21);

      // --- 方尖碑：高瘦筆直 + 頂端的小角錐 ---
      // 跟 yggdrasil 的符文石刻意分開：那個矮、歪、有刻痕；這個高、正、頂端收尖
      [[152, 30], [168, 22]].forEach(function (o) {
        const ox = o[0], oh = o[1];
        const st = P.stone || '#b8a478';
        rect(ox - 2, horizon - oh, 5, oh, st);
        rect(ox - 2, horizon - oh, 1, oh, FG.shade(st, 0.24));
        for (let k = 0; k < 4; k++) rect(ox - 2 + k * 0.6, horizon - oh - 4 + k, 5 - k * 1.2, 1, FG.shade(st, 0.12));
      });

      // 近沙丘：蓋住金字塔與方尖碑的底部
      dune(horizon + 1, 16, 0.045, 2.2, P.midTree, P.sandLit || '#e8c88f');

      // --- 棕櫚：彎曲的細幹 + 往四周下垂的葉。跟針葉樹（三角）、櫻花（圓冠）都不同 ---
      [[24, 26, 0.16], [190, 22, -0.2], [138, 18, 0.1]].forEach(function (p) {
        const px0 = p[0], ph = p[1], lean = p[2];
        for (let k = 0; k < ph; k++) rect(px0 + k * lean, horizon - 1 - k, 2, 1, P.trunk || '#5f4a2a');
        const tipX = px0 + ph * lean, tipY = horizon - 1 - ph;
        for (let a = 0; a < 7; a++) {
          const ang = Math.PI * (0.08 + a * 0.14);                 // 只往上半圈張開
          for (let k = 0; k < 8; k++) {
            const fx = tipX + Math.cos(ang) * k;
            // 葉子往下垂：k 越大越往下彎（k² 項）
            const fy = tipY - Math.sin(ang) * k * 0.55 + k * k * 0.055;
            rect(fx, fy, 1, 1, a % 2 ? P.palm || '#6f7a3a' : FG.shade(P.palm || '#6f7a3a', 0.18));
          }
        }
      });
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;

      // --- 半淹的石柱 ---
      // 有柱頭（比柱身寬）才讀得出是「柱子」而不是一根樁。避開船（x 34~158、y 212~270）
      const st = P.stone || '#b8a478';
      [[18, 30], [46, 22], [178, 26]].forEach(function (c) {
        const cx = c[0], ch = c[1];
        const baseY = horizon + 34;
        rect(cx - 4, baseY - ch, 9, ch, st);
        rect(cx - 4, baseY - ch, 2, ch, FG.shade(st, 0.2));
        rect(cx - 6, baseY - ch - 3, 13, 3, FG.shade(st, 0.1));          // 柱頭
        rect(cx - 6, baseY - ch - 4, 13, 1, FG.shade(st, 0.3));
        // 柱身的凹槽
        for (let k = 2; k < 8; k += 3) rect(cx - 4 + k, baseY - ch + 2, 1, ch - 2, FG.shade(st, -0.16));
      });

      // --- 紙莎草：細桿 + 頂端放射狀的傘形花序 ---
      // 基部 y 要夠低：桿頂是 y-h，如果 y 設得離岸線太近，花序會長到地平線**上面**
      // 去（初版 y = horizon+6、h 最長 24，桿頂落在 horizon-18，變成長在沙丘上）
      for (let i = 0; i < 16; i++) {
        const x = Math.round(R() * W);
        if (x > 30 && x < 162) continue;                                 // 中央留給船
        const y = horizon + 24 + R() * 18;
        const h = 10 + R() * 10;
        rect(x, y - h, 1, h, FG.shade(P.papyrus || '#8f9a4a', -0.2));
        for (let a = 0; a < 8; a++) {
          const ang = Math.PI * (0.1 + a * 0.1);
          for (let k = 1; k < 5; k++) {
            rect(x + Math.cos(ang) * k, y - h - Math.sin(ang) * k * 0.8 + k * 0.18, 1, 1, P.papyrus || '#8f9a4a');
          }
        }
      }
    }
  };

  // 九 · 人工池塘：修剪過的草坪 + 等距樹籬 + 筆直的石砌護岸與木棧道，水下看得見磁磚池底（澄澈方池）
  //   識別手段跟前八種完全不同：前八種靠「畫什麼」，這一種靠「**線是直的**」。
  //   等距、等寬、水平、垂直——自然界不會有這些，所以只要出現就一定讀成人造物。
  //   另一半在 below()：**其他八個釣點的水都是不透明的，只有這裡看得見底**。
  TERRAIN.pond = {
    above: function (T) {
      const { P, W, horizon, rect } = T;

      // --- 修剪過的草坪：一整條平的綠帶，刻意沒有任何起伏 ---
      rect(0, horizon - 34, W, 36, P.farTree);
      rect(0, horizon - 34, W, 2, FG.shade(P.farTree, 0.22));
      // 割草機留下的等寬條紋。這是最便宜也最有效的「有人在維護」訊號
      for (let x = 0; x < W; x += 18) rect(x, horizon - 32, 9, 30, FG.shade(P.farTree, -0.09));

      // --- 修剪成球的樹籬：**等距、等大**。其他地形的植被全是隨機散佈的 ---
      const hedge = P.midTree;
      for (let i = 0; i < 9; i++) {
        const cx = 8 + i * 23, r = 7;
        rect(cx - 1, horizon - 24, 2, 12, P.trunk || '#4a3a2a');
        for (let dy = -r; dy <= r; dy++) {
          const half = Math.sqrt(Math.max(0, r * r - dy * dy));
          rect(cx - half, horizon - 25 + dy, half * 2, 1, hedge);
        }
        rect(cx - 4, horizon - 29, 3, 3, FG.shade(hedge, 0.26));
      }

      // --- 石砌護岸 ---
      // 「規整水域邊界」的本體：一條完全水平、每 12px 一道接縫的人造線。
      // 亮度高於 150，所以倒影不會保留它（同 karst 的白牆），這是刻意接受的——
      // 護岸在水裡鏡射會亮到蓋掉水面，而且真實的池岸本來就在水面之上
      const cope = P.coping || '#b8b2a4';
      rect(0, horizon - 7, W, 7, cope);
      rect(0, horizon - 7, W, 1, FG.shade(cope, 0.28));
      rect(0, horizon - 1, W, 1, FG.shade(cope, -0.36));
      for (let x = 0; x < W; x += 12) rect(x, horizon - 6, 1, 5, FG.shade(cope, -0.2));

      // --- 木棧平台：從左岸伸出來，直角＋等距板縫 ---
      const deck = P.deck || '#8a6a44';
      rect(0, horizon - 11, 48, 5, deck);
      rect(0, horizon - 11, 48, 1, FG.shade(deck, 0.26));
      for (let x = 3; x < 48; x += 5) rect(x, horizon - 10, 1, 4, FG.shade(deck, -0.28));
      rect(44, horizon - 11, 2, 12, FG.shade(deck, -0.42));      // 欄杆柱
      rect(44, horizon - 18, 2, 8, deck);
      rect(20, horizon - 18, 2, 8, deck);
      rect(19, horizon - 19, 28, 2, FG.shade(deck, 0.14));       // 扶手
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;

      // --- 看得見的池底 ---
      // 做法是把底色疊在已經畫好的水面上，越近（越下面）越實、越遠越淡。
      // 這一層本身就是「清淺見底」的全部，後面的磁磚只是把它講得更清楚
      const bed = P.bed || '#c8bfa0';
      for (let y = horizon + 2; y < H; y++) {
        g.globalAlpha = 0.08 + ((y - horizon) / (H - horizon)) * 0.34;
        rect(0, y, W, 1, bed);
      }
      g.globalAlpha = 1;

      // --- 池底的方磚 ---
      // 正交網格是全遊戲唯一畫在水面下的直線。**格距一定要隨深度張開**：
      // 等距的格子會變成一張貼在鏡頭上的方格紙，張開才有「往下看」的透視
      const grout = P.grout || '#9a9078';
      let gy = horizon + 8;
      while (gy < H) {
        const t = (gy - horizon) / (H - horizon);
        g.globalAlpha = 0.16 + t * 0.24;
        rect(0, gy, W, 1, grout);
        gy += 7 + t * 26;
      }
      for (let k = -5; k <= 5; k++) {
        for (let y = horizon + 8; y < H; y++) {
          const t = (y - horizon) / (H - horizon);
          g.globalAlpha = 0.14 + t * 0.22;
          rect(W * 0.5 + k * (6 + t * 26), y, 1, 1, grout);
        }
      }
      g.globalAlpha = 1;

      // --- 一排等距的踏石：又一件「有人排過」的東西，同時把大片格線切斷 ---
      const stone = P.stepStone || '#a8a294';
      for (let i = 0; i < 7; i++) {
        const cx = 16 + i * 28, cy = horizon + 20;
        for (let dy = -3; dy <= 3; dy++) {
          const half = Math.sqrt(Math.max(0, 1 - (dy / 3.6) * (dy / 3.6))) * 9;
          rect(cx - half, cy + dy, half * 2, 1, dy < 0 ? FG.shade(stone, 0.14) : stone);
        }
        rect(cx - 6, cy + 4, 12, 1, FG.shade(stone, -0.4));      // 貼底的影子
      }

      // --- 沉在底的落葉：把規則的網格弄髒一點，否則整池看起來像泳池 ---
      for (let i = 0; i < 22; i++) {
        const x = Math.round(R() * W);
        const y = Math.round(horizon + 30 + R() * (H - horizon - 40));
        if (x > 34 && x < 158 && y > 212 && y < 270) continue;   // 避開船
        g.globalAlpha = 0.4 + R() * 0.3;
        rect(x, y, 2 + Math.round(R() * 2), 1, P.leaf || '#7f6a3a');
      }
      g.globalAlpha = 1;
    }
  };

  // 十 · 潮間帶：退潮後裸露的灘地 + 沙紋 + 星羅棋布的積水潭（潮落礁灘）
  //   這是**構圖層級**的差別而不是換配色：前九種地形的地平線以下都是一整片水，
  //   這一種把「陸地」畫回水面上，只在畫面下緣留一條深槽給船。
  //   退潮時真的會留下這樣一條水道，所以船待在那裡是合理的。
  TERRAIN.tidal = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;

      // --- 遠方沙洲：一條幾乎平的低帶。潮間帶的地平線就是空的，刻意不放高聳的東西 ---
      rect(0, horizon - 10, W, 12, P.farTree);
      for (let x = 0; x < W; x++) {
        const h = 3 + Math.sin(x * 0.06) * 2 + Math.sin(x * 0.021 + 2) * 3;
        rect(x, horizon - 10 - h, 1, h + 2, P.farTree);
        rect(x, horizon - 10 - h, 1, 1, FG.shade(P.farTree, 0.28));
      }

      // --- 海蝕平台：寬 ≫ 高、頂面平、側面有**水平層理**、底部一道深色潮痕 ---
      // ice 的冰脊也是寬扁的，分開的關鍵就是層理線與潮痕：冰脊是整片平塗＋單邊受光
      function reef(cx, w, h) {
        const c = P.nearTree;
        rect(cx - w / 2, horizon - h, w, h + 3, c);
        rect(cx - w / 2, horizon - h, w, 1, FG.shade(c, 0.32));
        for (let k = 3; k < h; k += 3) rect(cx - w / 2, horizon - h + k, w, 1, FG.shade(c, -0.2));
        rect(cx - w / 2, horizon - 3, w, 4, FG.shade(c, -0.45));               // 漲潮時的水位線
        rect(cx - w / 2, horizon - h, Math.max(2, w * 0.2), 2, FG.shade(c, -0.3));  // 被浪削掉的缺口（不對稱）
      }
      [[24, 46, 14], [88, 30, 9], [152, 54, 17], [192, 26, 11]].forEach(function (r) { reef(r[0], r[1], r[2]); });

      // --- 遠處的海鳥：兩格的 v 字。成本一格一格算，但「這是海邊」一秒就講完了 ---
      for (let i = 0; i < 7; i++) {
        const x = Math.floor(R() * W), y = Math.floor(R() * (horizon - 30)) + 6;
        const c = FG.shade(P.hill || '#5f6a70', -0.2);
        rect(x, y, 1, 1, c); rect(x + 1, y - 1, 1, 1, c); rect(x + 2, y, 1, 1, c);
      }
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;
      const sand = P.sand || '#cfc0a4', wet = P.wet || '#9c907a';

      // 退潮線：灘地與水道的交界。用兩個不同頻率的 sin 疊出來，避免變成一條規則的波浪
      function edgeAt(x) { return 188 + Math.sin(x * 0.037) * 11 + Math.sin(x * 0.11 + 1.7) * 4; }

      // --- 裸露的灘地 ---
      for (let x = 0; x < W; x++) {
        const e = edgeAt(x);
        rect(x, horizon + 2, 1, e - horizon - 2, wet);
        rect(x, horizon + 2, 1, 12, FG.shade(sand, -0.06));       // 離水最久的那一段乾一點
        rect(x, e - 3, 1, 3, FG.shade(wet, -0.3));                // 水邊的暗緣
        rect(x, e, 1, 2, P.highlight || '#f4f8f8');               // 退潮線的白沫
      }

      // --- 沙紋 ---
      // 平行、等距、微彎的波痕。這是潮間帶最好認的紋理，而且只要兩層 1px 的線
      // （亮的稜、暗的谷）就有立體感——沒有光照系統時這是最省的做法
      for (let k = 0; k < 13; k++) {
        const y0 = horizon + 10 + k * 5;
        for (let x = 0; x < W; x++) {
          const y = y0 + Math.sin(x * 0.09 + k) * 2;
          if (y > edgeAt(x) - 4) continue;
          rect(x, y, 1, 1, FG.shade(sand, 0.2));
          rect(x, y + 1, 1, 1, FG.shade(wet, -0.14));
        }
      }

      // --- 灘上的礁石與海藻 ---
      for (let i = 0; i < 20; i++) {
        const x = Math.round(R() * W), y = Math.round(horizon + 14 + R() * 56);
        if (y > edgeAt(x) - 10) continue;
        const w = 3 + Math.round(R() * 6), h = Math.max(2, Math.round(w * 0.5));
        rect(x - w / 2, y - h, w, h, P.nearTree);
        rect(x - w / 2, y - h, w, 1, FG.shade(P.nearTree, 0.3));
        rect(x - w / 2, y, w, 1, FG.shade(wet, -0.35));
        if (R() < 0.45) {                                          // 石頭背風面的一撮海藻
          const wd = P.weedC || '#4a6a3a';
          for (let k = 0; k < 4; k++) rect(x - w / 2 - 1 - k, y - 1 - Math.round(k * 0.6), 2, 1, wd);
        }
      }

      // --- 積水潭 ---
      // 「星羅棋布」＝數量多、尺寸小。放大就會被讀成水道的分支，灘地本身就不成立了。
      // 每個潭都要有一圈濕沙的暗邊，沒有邊的話只是灘上一塊藍色補丁
      const pool = P.pool || '#6fb4c0';
      for (let i = 0; i < 17; i++) {
        const x = Math.round(R() * W), y = Math.round(horizon + 12 + R() * 54);
        if (y > edgeAt(x) - 10) continue;
        const rw = 3 + Math.round(R() * 6), rh = Math.max(1, Math.round(rw * 0.42));
        for (let dy = -rh; dy <= rh; dy++) {
          const half = Math.sqrt(Math.max(0, 1 - (dy / (rh + 0.5)) * (dy / (rh + 0.5)))) * rw;
          rect(x - half - 1, y + dy, half * 2 + 2, 1, FG.shade(wet, -0.32));
          rect(x - half, y + dy, half * 2, 1, dy < 0 ? FG.shade(pool, 0.24) : pool);
        }
        rect(x - rw * 0.4, y - rh, Math.max(1, rw * 0.4), 1, P.highlight || '#f4f8f8');
      }
    }
  };

  // 十一 · 瀑布潭：多層岩壁 + 主瀑與側瀑 + 岩階植被與垂藤，落水點翻著泡沫（懸瀑深潭）
  //
  //   這一版是重畫的。初版的問題不在解析度（200×340 跟一般像素風場景圖是同一個量級），
  //   而在**資訊密度**：實測初版左半岩壁有 74% 的像素只落在兩個色階上，等於一塊平塗
  //   加幾條層理線。重畫的三個方向就是初版缺的三樣：
  //
  //     一 · 岩石要「一顆一顆各自受光」——六階明度 + 有序抖動，不是整片平塗
  //     二 · 植被是這種場景裡面積最大的元素之一——樹冠、岩階灌木、垂藤，初版完全沒有
  //     三 · 光——瀑布後方的逆光光暈與斜射光束，把整個構圖串起來
  //
  //   背景有 bgCache，一個釣點一輩子只跑一次，所以畫多細都不影響幀率。
  //   **這是「場景細緻度標準」的參考實作**，其他釣點要跟進時照這三個方向做。
  //
  //   跟 cliff 的分界仍然成立：cliff 是兩側崖壁夾出中央亮縫，這裡是整面岩壁被亮柱切開，
  //   而且岩壁用**水平**層理（cliff 是垂直節理）。
  const FALL_X = 100;
  TERRAIN.waterfall = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      const g = T.g;

      /* ---------- 基礎工具 ---------- */

      // 每一層岩壁展開成六階明度。平塗是初版最大的問題，色階要先備齊才談得上體積。
      function shades(base) {
        return [FG.shade(base, -0.45), FG.shade(base, -0.26), FG.shade(base, -0.10),
                base, FG.shade(base, 0.18), FG.shade(base, 0.38)];
      }
      const FAR = shades(P.farTree), MID = shades(P.midTree);

      // 有序抖動（4×4 Bayer）。像素風不能用真的漸層（放大後會糊），
      // 抖動是把 6 階在視覺上補成十幾階的標準做法，成本只有一次查表。
      const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      function dither(x0, y0, w, h, cA, cB, t) {
        for (let y = y0; y < y0 + h; y++) {
          for (let x = x0; x < x0 + w; x++) {
            if (x < 0 || x >= W || y < 0) continue;
            rect(x, y, 1, 1, (BAYER[((y & 3) << 2) + (x & 3)] / 16) < t ? cB : cA);
          }
        }
      }

      // 單顆石頭。三件事缺一不可：**上亮下暗的縱向分層**、**只有左半有頂緣高光**
      // （光從左上來，整圈都亮會變成一顆球）、**底部一道接觸陰影**（讓它「坐」在後面的岩上）。
      // 少了這三樣，一堆石頭會糊成一片麻點，跟平塗沒有分別。
      function boulder(cx, cy, rw, rh, S) {
        for (let dy = -rh; dy <= rh; dy++) {
          const half = rw * Math.sqrt(Math.max(0, 1 - (dy / rh) * (dy / rh)));
          if (half < 0.5) continue;
          const v = (dy + rh) / (2 * rh);
          const c = v < 0.16 ? S[4] : (v < 0.40 ? S[3] : (v < 0.76 ? S[2] : S[1]));
          rect(cx - half, cy + dy, half * 2, 1, c);
        }
        for (let dx = -rw; dx < 0; dx++) {
          const k = Math.sqrt(Math.max(0, 1 - (dx / rw) * (dx / rw)));
          rect(cx + dx, cy - rh * k, 1, 1, S[5]);
        }
        rect(cx - rw * 0.7, cy + rh * 0.9, rw * 1.4, 1, S[0]);
      }

      // 灌木叢：三四個重疊的圓。**單一個圓會被讀成石頭**，一定要重疊才有「叢」的感覺；
      // 再點幾撮受光的亮綠當葉尖，否則整叢是一團死綠。
      function bush(cx, cy, r) {
        const dk = P.canopy || '#24401f', md = P.leaf || '#4f8a4e', lt = P.leafLit || '#8fc46a';
        for (let i = 0; i < 4; i++) {
          const ox = (R() - 0.5) * r * 1.7, oy = (R() - 0.5) * r * 0.6;
          const rr = r * (0.55 + R() * 0.5);
          for (let dy = -rr; dy <= rr; dy++) {
            const half = Math.sqrt(Math.max(0, rr * rr - dy * dy));
            rect(cx + ox - half, cy + oy + dy, half * 2, 1, dy < -rr * 0.25 ? md : dk);
          }
        }
        for (let i = 0; i < 5; i++) {
          rect(cx + (R() - 0.5) * r * 1.9, cy - r * (0.2 + R() * 0.6), 2, 1, lt);
        }
      }

      // 垂藤：2px 寬 ＋ 沿途的葉節。**1px 的垂直細線在這個尺寸一律被讀成雨絲**
      // （冰川裂隙踩過這個坑），所以寬度與葉節兩樣缺一不可。
      function vine(x, y, len) {
        const c1 = P.vine || '#5f8a3f', c2 = P.leaf || '#4f8a4e';
        for (let k = 0; k < len; k++) {
          const xx = x + Math.round(Math.sin(k * 0.17 + x) * 2);
          rect(xx, y + k, 2, 1, k > len - 4 ? c2 : c1);
          if (k % 5 === 3) rect(xx + (k % 10 === 3 ? -2 : 2), y + k, 2, 2, c2);
        }
      }

      /* ---------- 一 · 瀑布後方的逆光 ---------- */
      // 先畫，之後岩壁蓋掉大部分，只在瀑布的缺口透出來——這樣光才像是「從後面來的」。
      const sun = P.sun || '#fff8dc';
      for (let r = 78; r > 0; r -= 2) {
        g.globalAlpha = 0.035 * (1 - r / 78);
        for (let a = 0; a < Math.PI * 2; a += 0.12) {
          rect(FALL_X + Math.cos(a) * r, 26 + Math.sin(a) * r * 0.8, 2, 2, sun);
        }
      }
      g.globalAlpha = 1;

      /* ---------- 二 · 遠層岩壁 ---------- */
      // 整面填滿再往上挖出稜線。稜線用兩個不同頻率的 sin，避免變成規則的波浪。
      function crestFar(x) { return 16 + Math.sin(x * 0.043) * 7 + Math.sin(x * 0.017 + 1.3) * 5; }
      for (let x = 0; x < W; x++) {
        const c = crestFar(x);
        rect(x, c, 1, horizon - c + 2, FAR[2]);
        rect(x, c, 1, 2, FAR[4]);                       // 稜線受光
      }
      // 水平層理 + 層間抖動。橫向的層理是這個地形跟 cliff（垂直節理）的分界
      for (let k = 0; k < 7; k++) {
        const y = 30 + k * 13;
        if (y >= horizon) break;
        for (let x = 0; x < W; x++) {
          if (y < crestFar(x)) continue;
          rect(x, y + Math.sin(x * 0.05 + k) * 2, 1, 3, k % 2 ? FAR[1] : FAR[3]);
        }
        dither(0, y + 3, W, 4, FAR[2], FAR[1], 0.45);
      }
      // 遠層的石塊：小、低對比，只是把平面打散
      for (let i = 0; i < 46; i++) {
        const x = R() * W, y = crestFar(x) + 6 + R() * (horizon - crestFar(x) - 10);
        boulder(x, y, 4 + R() * 7, 3 + R() * 4, FAR);
      }

      /* ---------- 三 · 中層岩壁：左右兩側的岩體與岩階 ---------- */
      // 中央留給瀑布，兩側往內收——這是「峽谷」的構圖，也讓主瀑有東西可以靠
      function massif(side, reach, peak, S) {
        for (let x = 0; x < W; x++) {
          const d = side < 0 ? x / reach : (W - 1 - x) / reach;
          if (d > 1) continue;
          const top = 10 + Math.pow(d, 1.5) * peak + Math.sin(x * 0.09) * 3;
          rect(x, top, 1, horizon - top + 2, S[2]);
          rect(x, top, 1, 2, S[4]);
        }
      }
      massif(-1, 74, 96, MID);
      massif(1, 82, 96, MID);
      // 岩階：四道橫向的平台，每一道的上緣受光、下方壓一道陰影。
      // 平台是植被能長的地方，也是側瀑能落腳的地方——沒有平台，岩壁只是一面牆
      const LEDGES = [[0, 66, 46, 9], [128, 72, 62, 8], [8, 108, 58, 8], [140, 116, 56, 9]];
      LEDGES.forEach(function (L) {
        const lx = L[0], ly = L[1], lw = L[2], lh = L[3];
        rect(lx, ly, lw, lh, MID[2]);
        rect(lx, ly, lw, 2, MID[5]);                          // 平台上緣（最亮）
        rect(lx, ly + lh, lw, 2, MID[0]);                     // 平台下方的陰影
        dither(lx, ly + 2, lw, lh - 2, MID[2], MID[1], 0.5);
        for (let i = 0; i < lw / 9; i++) boulder(lx + 4 + i * 9 + R() * 4, ly + lh * 0.55, 4 + R() * 4, 3 + R() * 2, MID);
      });
      // 中層的石塊：大顆、高對比，是「一顆一顆各自受光」最明顯的一層
      for (let i = 0; i < 40; i++) {
        const x = R() < 0.5 ? R() * 76 : W - R() * 80;
        const y = 22 + R() * (horizon - 26);
        boulder(x, y, 5 + R() * 10, 4 + R() * 7, MID);
      }
      // 垂直裂隙：從底部往上長、長度不到全高（往下垂會被讀成雨絲）
      for (let i = 0; i < 24; i++) {
        const x = Math.floor(R() * W);
        if (Math.abs(x - FALL_X) < 26) continue;
        const h = 10 + R() * 26;
        rect(x, horizon - h, 2, h, MID[0]);
        rect(x + 2, horizon - h, 1, h, MID[4]);               // 裂隙右緣的受光面
      }

      /* ---------- 四 · 瀑布 ---------- */
      // 主瀑分三股、側瀑四道，落在不同高度。細瀑一定要 3px 以上——
      // 1px 的垂直線會變成雨絲，而三股並排比一根粗柱更像「水在落」
      const wc = P.falls || '#f2fafa';
      function fall(cx, wid, yTop, yBot, tint) {
        const core = tint ? FG.mix(wc, P.waterTop, 0.35) : wc;
        for (let y = yTop; y < yBot; y++) {
          const t = (y - yTop) / Math.max(1, yBot - yTop);
          // 寬度不能是常數：頂端剛離開岩緣時要收窄，往下逐漸散開，中途再疊兩個不同頻率的
          // 起伏。初版是固定寬度，成品看起來是三根白色的水管而不是落下的水
          const flare = 0.5 + Math.pow(t, 0.55) * 0.85;
          const wob = 1 + Math.sin(y * 0.13 + cx) * 0.14 + Math.sin(y * 0.33 + cx * 2) * 0.08;
          const half = wid * 0.5 * flare * wob;
          const sway = Math.sin(y * 0.045 + cx) * 1.6;
          rect(cx - half + sway, y, half * 2, 1, core);
          rect(cx - half + sway, y, 2, 1, FG.shade(core, -0.26));           // 兩側較暗＝圓柱感
          rect(cx + half - 2 + sway, y, 2, 1, FG.shade(core, -0.14));
          // 橫向流束：這是「水在動」唯一的訊號，沒有它就只是一根白柱子
          if ((y + Math.round(Math.sin(y * 0.21) * 2)) % 6 === 0) {
            rect(cx - half + sway, y, half * 2, 1, FG.shade(core, -0.12));
          }
          if ((y * 7 + Math.round(cx)) % 23 === 0) rect(cx + sway - 1, y, 3, 1, '#ffffff');  // 高光碎點
        }
        // 落點的水花：一小撮往兩側散開的白點
        for (let i = 0; i < 14; i++) {
          const a = Math.PI + R() * Math.PI;
          const rr = 2 + R() * wid * 0.9;
          rect(cx + Math.cos(a) * rr, yBot + Math.abs(Math.sin(a)) * 3, 2, 1, wc);
        }
      }
      fall(FALL_X - 11, 8, 12, horizon, false);
      fall(FALL_X, 13, 8, horizon, false);
      fall(FALL_X + 11, 7, 14, horizon, false);
      fall(30, 5, 24, 66, true);            // 落在左上岩階
      fall(24, 4, 75, horizon, true);       // 接續往下
      fall(158, 6, 30, 72, true);           // 落在右上岩階
      fall(168, 5, 81, horizon, true);

      /* ---------- 五 · 水霧 ---------- */
      // 從落水點往上擴散的**扇形**。刻意不用橫帶——橫帶是 karst 山腰霧帶的招牌。
      const mist = P.mist || '#dfeaea';
      for (let k = 0; k < 64; k++) {
        const y = horizon - k;
        if (y < 0) break;
        const spread = 17 + k * 1.35;
        g.globalAlpha = 0.16 * (1 - k / 64);
        rect(FALL_X - spread, y, spread * 2, 1, mist);
      }
      // 貼著水線的一道亮霧，把瀑布與水面接起來
      for (let k = 0; k < 9; k++) {
        g.globalAlpha = 0.3 * (1 - k / 9);
        rect(FALL_X - 46 - k * 3, horizon - 9 + k, 92 + k * 6, 2, mist);
      }
      g.globalAlpha = 1;

      /* ---------- 六 · 岩階植被與垂藤 ---------- */
      // 植被在這種場景裡是面積最大的元素之一，初版完全沒有，那是它看起來空的主因。
      LEDGES.forEach(function (L) {
        const lx = L[0], ly = L[1], lw = L[2];
        for (let i = 0; i < lw / 13; i++) bush(lx + 6 + i * 13 + R() * 6, ly - 2, 4 + R() * 3);
        // 垂藤**要少**。初版每個岩階掛五六條、長度又都差不多，成品是一排綠色的蟲。
        // 一個岩階一到兩條、長度差距拉到三倍，才像是自然垂下來的
        for (let i = 0; i < 2; i++) {
          const vx = lx + 4 + R() * (lw - 8);
          if (Math.abs(vx - FALL_X) < 22 || R() < 0.35) continue;
          vine(vx, ly + L[3], 7 + R() * 26);
        }
      });
      // 岩壁上零星的草叢，讓岩面不會只有石頭
      for (let i = 0; i < 34; i++) {
        const x = R() * W, y = 24 + R() * (horizon - 30);
        if (Math.abs(x - FALL_X) < 22) continue;
        const c = R() < 0.5 ? (P.moss || '#3f6a44') : (P.leaf || '#4f8a4e');
        for (let k = 0; k < 4 + R() * 4; k++) rect(x + k * 0.8, y - Math.abs(Math.sin(k)) * 3, 1, 2 + R() * 2, c);
      }

      /* ---------- 七 · 頂部樹冠 ---------- */
      // 把畫面上緣框起來，而且刻意畫到畫面外——「裝不下」比畫完整棵樹更能表達尺度
      // （跟 yggdrasil 的樹幹同一招）。
      const cp = P.canopy || '#24401f';
      for (let i = 0; i < 30; i++) {
        const cx = R() * (W + 30) - 15, cy = -4 + R() * 14, r = 6 + R() * 11;
        for (let dy = -r; dy <= r; dy++) {
          const half = Math.sqrt(Math.max(0, r * r - dy * dy));
          rect(cx - half, cy + dy, half * 2, 1, cp);
        }
        if (R() < 0.5) {
          for (let k = 0; k < 4; k++) rect(cx - r * 0.4 + k * 2, cy - r * 0.5, 2, 1, FG.shade(cp, 0.3));
        }
      }
      for (let i = 0; i < 4; i++) vine(R() * W, 4 + R() * 12, 8 + R() * 26);   // 從樹冠垂下來的藤（同樣要少）

      /* ---------- 八 · 斜射光束 ---------- */
      // 要「寬而淡」。窄而亮會變成畫面上的刮痕，而不是穿過水霧的光。
      for (let b = 0; b < 3; b++) {
        const sx = FALL_X - 26 + b * 24, wid = 13 + b * 5;
        for (let k = 0; k < horizon; k++) {
          g.globalAlpha = 0.05 * (1 - k / horizon);
          rect(sx + k * 0.42, k, wid, 1, sun);
        }
      }
      g.globalAlpha = 1;
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;
      const foam = P.foam || '#eaf6f6';

      /* ---------- 一 · 落水點推出去的同心白沫 ---------- */
      // 只畫朝觀眾這一側的半圈，而且橫向拉長 1.6 倍——從斜上方看水面，
      // 圓形波紋一定是扁的，畫成正圓會像貼在垂直牆上的靶紙
      // ⚠️ **不要畫完整的同心圓。** 初版是一圈一圈完整的橢圓，成品像一張射箭靶紙——
      // 規則的同心圓是人造圖案，水面不會有。改成「隨機半徑的**弧段**、每一段各自抖動」
      // 之後才像被水推出去的泡沫。
      for (let i = 0; i < 30; i++) {
        const r = 8 + Math.pow(R(), 0.7) * 64;
        const a0 = R() * Math.PI, span = 0.4 + R() * 1.3;
        g.globalAlpha = 0.34 * (1 - r / 78) * (0.45 + R() * 0.75);
        for (let a = a0; a < a0 + span; a += 0.05) {
          const jr = r * (1 + Math.sin(a * 5 + i) * 0.07);
          const x = FALL_X + Math.cos(a) * jr * 1.6;
          const y = horizon + 4 + Math.sin(a) * jr * 0.5;
          if (x < 0 || x >= W || y >= H || y < horizon) continue;
          rect(x, y, 2, 1, foam);
        }
      }
      g.globalAlpha = 1;

      /* ---------- 二 · 翻湧的氣泡 ---------- */
      // 集中在落水點，離得越遠越稀。大小混三種——全一樣大會變成一片雜點
      for (let i = 0; i < 170; i++) {
        const x = Math.round(R() * W);
        const y = Math.round(horizon + 3 + Math.pow(R(), 0.8) * (H - horizon - 6));
        const d = Math.abs(x - FALL_X) / W + (y - horizon) / (H - horizon) * 0.7;
        if (R() < Math.pow(d, 0.8)) continue;
        if (x > 34 && x < 158 && y > 216 && y < 268) continue;      // 避開船
        const s = R() < 0.7 ? 1 : (R() < 0.85 ? 2 : 3);
        g.globalAlpha = 0.35 + R() * 0.45;
        rect(x, y, s, s, foam);
      }
      g.globalAlpha = 1;

      /* ---------- 三 · 水面下的魚影 ---------- */
      // 深潭要「看得出裡面有東西」。剪影要**壓得很暗又半透明**——畫清楚就變成貼圖，
      // 而且會跟真正釣起來的魚打架
      for (let i = 0; i < 7; i++) {
        const x = 14 + R() * (W - 28), y = horizon + 40 + R() * (H - horizon - 70);
        if (x > 20 && x < 172 && y > 200 && y < 282) continue;      // 避開船與浮標
        const len = 7 + R() * 9, flip = R() < 0.5 ? 1 : -1;
        g.globalAlpha = 0.2 + R() * 0.12;
        for (let k = 0; k < len; k++) {
          const th = Math.max(1, Math.round(Math.sin((k / len) * Math.PI) * 3));
          rect(x + k * flip, y - th / 2, 1, th, P.waterDeep);
        }
        rect(x - 2 * flip, y - 2, 2, 4, P.waterDeep);                // 尾鰭
      }
      g.globalAlpha = 1;

      /* ---------- 四 · 水面的橫向波紋 ---------- */
      for (let i = 0; i < 26; i++) {
        const y = horizon + 8 + R() * (H - horizon - 16);
        const x = R() * W, len = 5 + R() * 16;
        g.globalAlpha = 0.14 + R() * 0.12;
        rect(x, y, len, 1, P.highlight2 || '#a8d8dc');
      }
      g.globalAlpha = 1;

      /* ---------- 五 · 前景岩石與水草 ---------- */
      // 只放在左右兩側：中間 x 30～170 是船、浮標與 HUD 的位置。
      // 參考圖把前景植被壓到畫面下緣當框，這裡不能那樣做——那會蓋掉玩法。
      const NEAR = [FG.shade(P.nearTree, -0.45), FG.shade(P.nearTree, -0.26), FG.shade(P.nearTree, -0.10),
                    P.nearTree, FG.shade(P.nearTree, 0.18), FG.shade(P.nearTree, 0.38)];
      [[6, 300, 26, 13], [-6, 268, 20, 10], [196, 292, 24, 12], [186, 322, 30, 14], [22, 332, 22, 11]]
        .forEach(function (b) {
          const cx = b[0], cy = b[1], rw = b[2], rh = b[3];
          for (let dy = -rh; dy <= rh; dy++) {
            const half = rw * Math.sqrt(Math.max(0, 1 - (dy / rh) * (dy / rh)));
            const v = (dy + rh) / (2 * rh);
            rect(cx - half, cy + dy, half * 2, 1, v < 0.16 ? NEAR[4] : (v < 0.42 ? NEAR[3] : (v < 0.78 ? NEAR[2] : NEAR[1])));
          }
          for (let dx = -rw; dx < 0; dx++) {
            const k = Math.sqrt(Math.max(0, 1 - (dx / rw) * (dx / rw)));
            rect(cx + dx, cy - rh * k, 1, 1, NEAR[5]);
          }
          // 貼水面的一圈白沫，石頭才像泡在水裡而不是浮在畫面上
          rect(cx - rw * 0.8, cy + rh * 0.6, rw * 1.6, 1, foam);
        });
      // 岸邊的水草：只長在左右兩側
      for (let i = 0; i < 22; i++) {
        const x = R() < 0.5 ? R() * 34 : W - R() * 34;
        const y = horizon + 60 + R() * (H - horizon - 70);
        const h = 8 + R() * 16;
        const c = R() < 0.4 ? (P.canopy || '#24401f') : (P.moss || '#3f6a44');
        for (let k = 0; k < h; k++) rect(x + Math.sin(k * 0.22) * 2, y - k, 1, 1, c);
        rect(x + Math.sin(h * 0.22) * 2 - 1, y - h - 1, 3, 2, P.leaf || '#4f8a4e');
      }
    }
  };
  // 十二 · 火山口湖：凹的火口壁 + 平頂火山錐與煙柱 + 岸邊硫磺階地，水面蒸氣、湖底泛黃（硫煙湯湖）
  //   前十一種地形的天際線不是起伏就是「往上長的東西」；這一種是**兩側高、中間低的凹線**，
  //   那就是站在破火山口裡面往外看的樣子，也是這個尺寸下最省成本的「這裡是個坑」。
  TERRAIN.caldera = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      const g = T.g;

      // --- 火口壁：凹曲線 ---
      for (let x = 0; x < W; x++) {
        const d = Math.abs(x - W / 2) / (W / 2);
        const h = 11 + Math.pow(d, 1.6) * 54 + Math.sin(x * 0.08) * 3;
        rect(x, horizon - h, 1, h + 2, P.farTree);
        rect(x, horizon - h, 1, 2, FG.shade(P.farTree, 0.22));
        if (x % 9 === 0) rect(x, horizon - h * 0.7, 1, h * 0.7, FG.shade(P.farTree, -0.24));  // 熔岩流的縱溝
      }

      // --- 火山錐：**平頂**的截頭錐 ---
      // 尖三角在這個尺寸一律被讀成針葉樹（§16）。把頂削平、在頂緣放一條餘燼的暖色帶、
      // 再從平頂接一根煙柱——三件事一起做，就不會有人把它看成樹
      const cone = P.nearTree, cx = 52, ch = 60, cw = 32;
      for (let k = 0; k < ch; k++) {
        const half = cw * 0.5 + (ch - k) * 0.6;
        rect(cx - half, horizon - ch + k, half * 2, 1, cone);
        rect(cx - half, horizon - ch + k, Math.max(1, half * 0.3), 1, FG.shade(cone, 0.2));
      }
      rect(cx - cw * 0.5, horizon - ch, cw, 2, P.ember || '#e8703a');
      rect(cx - cw * 0.5 + 3, horizon - ch + 1, cw - 6, 1, FG.shade(P.ember || '#e8703a', 0.35));

      // --- 煙柱：往上加寬並隨高度往一側偏（風），alpha 遞減 ---
      const smoke = P.smoke || '#8f8a92';
      const top = horizon - ch;
      for (let k = 0; k < top; k++) {
        const y = top - k;
        const wgt = 4 + k * 0.42;
        const drift = k * 0.55 + Math.sin(k * 0.09) * 4;
        g.globalAlpha = 0.3 * (1 - k / top);
        rect(cx + drift - wgt, y, wgt * 2, 1, smoke);
      }
      g.globalAlpha = 1;

      // --- 硫磺結晶階地 ---
      // 沿著水線一道道的亮黃白階梯。這是全畫面唯一貼著岸線的亮色，也是「硫磺色澤」
      // 最直接的說法。它遠亮於倒影的門檻（150），所以水裡不會有它的影子——
      // 跟 karst 的白牆同一個理由，刻意接受
      const sul = P.sulfur || '#e0c85f';
      for (let k = 0; k < 5; k++) {
        for (let x = 0; x < W; x++) {
          const y = horizon - 13 + k * 3 + Math.sin(x * 0.04 + k * 0.8) * 3;
          rect(x, y, 1, 3, FG.mix(sul, '#ffffff', k / 7));
          rect(x, y + 3, 1, 1, FG.shade(sul, -0.34));
        }
      }

      // --- 噴氣孔：岸邊幾道細白汽。從**底部往上**長，這是「往下垂會變雨絲」的標準解法 ---
      for (let i = 0; i < 7; i++) {
        const x = Math.floor(R() * W);
        const h = 12 + R() * 20;
        for (let k = 0; k < h; k++) {
          g.globalAlpha = 0.24 * (1 - k / h);
          rect(x + Math.sin(k * 0.3) * 2 - 1, horizon - 14 - k, 3, 1, P.steam || '#e8eef0');
        }
      }
      g.globalAlpha = 1;
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;

      // --- 硫磺色的湖底 ---
      // 跟 pond 的「清澈見底」不是同一件事：那裡看得見底部的物件，這裡是**水本身被礦物染色**。
      // 所以只疊一層暖黃、不畫任何底部細節，中央（深水）最濃
      const sul = P.sulfur || '#e0c85f';
      for (let y = horizon + 2; y < H; y++) {
        const t = (y - horizon) / (H - horizon);
        g.globalAlpha = 0.1 + Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.22;
        rect(0, y, W, 1, sul);
      }
      g.globalAlpha = 1;

      // --- 礦環：溫泉水面上一圈圈的礦物膜 ---
      for (let i = 0; i < 9; i++) {
        const cx = Math.round(R() * W), cy = Math.round(horizon + 14 + R() * (H - horizon - 30));
        const rw = 8 + R() * 20;
        g.globalAlpha = 0.22 + R() * 0.16;
        for (let a = 0; a < Math.PI * 2; a += 0.08) {
          rect(cx + Math.cos(a) * rw, cy + Math.sin(a) * rw * 0.34, 1, 1, FG.shade(sul, 0.3));
        }
      }
      g.globalAlpha = 1;

      // --- 水面蒸氣 ---
      // 垂直的汽柱，但**成塊分佈**而不是滿版的簾子：滿版垂直筆畫是 yggdrasil 極光的做法，
      // 而且那是畫在天空、這是畫在水面上，兩件事不要混
      const steam = P.steam || '#e8eef0';
      for (let i = 0; i < 11; i++) {
        const cx = Math.round(R() * W);
        const cy = Math.round(horizon + 8 + R() * (H - horizon - 40));
        const wgt = 6 + R() * 12, hgt = 22 + R() * 34;
        for (let k = 0; k < hgt; k++) {
          const y = cy - k;
          if (y < horizon + 2) break;
          g.globalAlpha = 0.16 * (1 - k / hgt);
          const sw = wgt * (0.5 + k / hgt * 0.7);
          rect(cx - sw + Math.sin(k * 0.12 + i) * 3, y, sw * 2, 1, steam);
        }
      }
      g.globalAlpha = 1;
    }
  };

  // 十三 · 湍瀨：卵石河床 + 斜向流線 + 石頭尾流 + 前景巨石（亂石急湍）
  //
  //   這一種佔的是三條還沒有人用的辨識軸，三條都在**水面**上：
  //
  //     一 · **斜向的流動紋理**——其他十四種地形的水面全是水平的（反光橫線、
  //          倒影、深水帶都是橫的）。這裡整片水面是從畫面上方往下、往兩側散開的
  //          斜線，一眼就知道「這片水在跑」。
  //     二 · **石頭的尾流**——每顆露出水面的石頭，上游側一道堆水的白弧、下游側
  //          一個往下張開的 V。這是「水在繞過東西」唯一便宜又有效的畫法。
  //     三 · **前景遮擋**——畫面最下緣兩塊被裁掉的大石。其他地形沒有任何一種有
  //          前景層，所以光是「有東西比水更近」就構成識別。
  //
  //   地平線以上刻意低調（只有卵石堆與赤楊叢），因為三條軸全在水裡，
  //   上面再放高聳的東西只會分掉注意力。卵石堆用**重疊的橢圓群**——
  //   §16 的尖三角、ice 的寬扁板塊、karst 的圓頂柱都不是這個形狀。
  TERRAIN.rapids = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      const g = T.g;

      function shades(base) {
        return [FG.shade(base, -0.42), FG.shade(base, -0.24), FG.shade(base, -0.09),
                base, FG.shade(base, 0.16), FG.shade(base, 0.36)];
      }
      // 4×4 有序抖動：把六階明度之間的斷層補起來，避免大面積平塗
      const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
      function dither(x, y, sh, lv) {
        const i = FG.clamp(Math.round(lv) + (BAYER[y & 3][x & 3] > 7 ? 1 : 0), 0, sh.length - 1);
        return sh[i];
      }

      // --- 遠處谷壁：低矮起伏的一道，只是把天空收住 ---
      const far = shades(P.farTree);
      for (let x = 0; x < W; x++) {
        const h = 22 + Math.sin(x * 0.031) * 9 + Math.sin(x * 0.077 + 1.3) * 4;
        for (let y = horizon - h; y < horizon; y++) {
          const d = (y - (horizon - h)) / h;
          rect(x, y, 1, 1, dither(x, y, far, 4.4 - d * 2.4));
        }
      }

      const foam = P.foam || '#f4fafa';

      // --- 卵石堆：重疊的橢圓群。一顆石頭的三件事，少一件就糊成麻點 ---
      //   1. 上亮下暗的縱向分層  2. **只有左半**的頂緣高光（整圈都亮會變成球）
      //   3. 底部一道接觸陰影，讓它「坐」在後面那顆上
      const cob = P.cobble || '#a8ada6', cobLit = P.cobbleLit || '#d0d4cc';
      // ⚠️ 卵石的明度階要從 `cobble`（淺灰）展開，**不要用 midTree/nearTree**——
      //    那兩個是谷壁色，石頭跟背後的牆同一個色域就等於沒畫，初版整條岸只看得到
      //    一片灰帶加幾顆綠球。河床的卵石本來就比岸壁亮，這是它最好認的地方
      const mid = shades(cob), near = shades(FG.shade(cob, -0.22));
      function cobble(cx, cy, rw, rh, sh, lit) {
        for (let dy = -rh; dy <= rh; dy++) {
          const half = Math.sqrt(Math.max(0, 1 - (dy / (rh + 0.4)) * (dy / (rh + 0.4)))) * rw;
          const lv = 3.6 - (dy + rh) / (2 * rh) * 2.6;
          for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
            const y = Math.round(cy + dy);
            rect(x, y, 1, 1, dither(x, y, sh, lv));
          }
        }
        rect(cx - rw * 0.72, cy - rh, rw * 0.55, 1, lit);                   // 只有左半的頂緣高光
        rect(cx - rw * 0.8, cy + rh, rw * 1.6, 1, FG.shade(sh[0], -0.3));   // 接觸陰影
      }
      for (let i = 0; i < 30; i++) {                                        // 遠層
        cobble(R() * (W + 20) - 10, horizon - 8 - R() * 12, 6 + R() * 9, 4 + R() * 5, mid, FG.shade(cob, 0.1));
      }

      // --- 遠處那一階跌水：告訴玩家上面還有一段，水是從那裡來的 ---
      // 細瀑一定要 2px 以上，1px 的垂直線在這個尺寸一律被讀成雨絲（§冰川裂隙）。
      // ★ 畫在遠層與近層卵石**之間**：畫太早會被兩層石頭一起蓋掉（初版就是這樣，
      //   跌水完全看不見），畫太晚又會浮在近景石頭前面
      [[58, 5, 30], [142, 3, 22]].forEach(function (f) {
        for (let k = 0; k < f[2]; k++) {
          const w = f[1] * (0.7 + k / f[2] * 0.7);
          rect(f[0] - w / 2, horizon - f[2] + k, w, 1, k % 4 === 0 ? FG.shade(foam, -0.16) : foam);
        }
        for (let k = 0; k < 5; k++) {                                       // 落點的一小團白
          rect(f[0] - f[1] - k * 0.9, horizon - 5 + k, (f[1] + k * 0.9) * 2, 1, foam);
        }
      });

      for (let i = 0; i < 22; i++) {                                        // 近層（大顆、壓在前面）
        cobble(R() * (W + 20) - 10, horizon - 1 - R() * 7, 9 + R() * 13, 5 + R() * 7, near, cobLit);
      }

      // --- 岸上的赤楊叢與苔：植被佔比，順便把卵石堆的上緣打散 ---
      const alder = P.alder || '#4a6a44', moss = P.moss || '#54703f';
      for (let i = 0; i < 22; i++) {
        const cx = R() * W, cy = horizon - 10 - R() * 12, r = 3 + R() * 5;
        for (let dy = -r; dy <= r; dy++) {
          const half = Math.sqrt(Math.max(0, r * r - dy * dy));
          rect(cx - half, cy + dy, half * 2, 1, dy < -r * 0.3 ? FG.shade(alder, 0.24) : alder);
        }
      }
      for (let i = 0; i < 40; i++) {                                        // 石頭背面的苔
        const x = R() * W, y = horizon - 2 - R() * 8;
        rect(x, y, 1 + R() * 3, 1, R() < 0.4 ? FG.shade(moss, 0.2) : moss);
      }
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;
      const foam = P.foam || '#f4fafa', flow = P.flow || '#cfe8ec';

      // --- 斜向流線 ---
      // 這是這個地形的主角。每一條從水面上方出發往下走，x 隨深度往兩側散開
      // （越近越發散＝透視），並且**不等長不等寬**——等長等寬會變成一把梳子
      for (let i = 0; i < 170; i++) {
        const sx = R() * W;
        const sy = horizon + 2 + R() * (H - horizon - 20);
        const len = 10 + R() * 34;
        const spread = (sx - W / 2) / (W / 2) * 0.55;      // 往中線兩側散
        const wd = R() < 0.28 ? 2 : 1;
        g.globalAlpha = 0.16 + R() * 0.28;
        for (let k = 0; k < len; k++) {
          const y = sy + k;
          if (y >= H) break;
          rect(sx + spread * k + Math.sin(k * 0.22 + i) * 1.2, y, wd, 1, R() < 0.25 ? foam : flow);
        }
      }
      // 水舌：少數幾道全白的強流。沒有這幾道，整片只會是一潭有紋路的靜水
      for (let i = 0; i < 9; i++) {
        const sx = R() * W;
        const sy = horizon + 4 + R() * (H - horizon - 60);
        const len = 30 + R() * 60;
        const spread = (sx - W / 2) / (W / 2) * 0.5;
        for (let k = 0; k < len; k++) {
          const y = sy + k;
          if (y >= H) break;
          g.globalAlpha = 0.75 * Math.sin(Math.PI * (k / len));
          rect(sx + spread * k + Math.sin(k * 0.16 + i) * 2, y, 2 + Math.round(R()), 1, foam);
        }
      }
      g.globalAlpha = 1;

      // --- 露出水面的石塊 ---
      // 上游側一道堆水的白弧、下游側一個往下張開的 V。
      // 尾流的兩道邊**不要對稱到像字母 V**：兩側各自抖動，長度差三成
      // ⚠️ 初版在石頭上方畫了一道**比石頭寬的白弧**當堆水，結果每顆石頭都變成
      //    一個飛碟：一個深色橢圓頂著一圈白邊，那正是飛碟的畫法。改成「只沿著
      //    石頭上緣、比石頭窄的一道白」，堆水才會被讀成貼在石頭上的浪。
      //    真正該花力氣的是**下游的尾流**——那才是「水在動」的證據。
      // 石頭要**成群**：真實的亂石灘是一堆擠在一起再空一段，不是平均散開。
      // 平均散開會被讀成「湖上的幾座小島」
      // ⚠️ 群心刻意寫死而不是隨機：隨機的群心可能整個落在船的排除區裡，
      //    那樣「不合格就重抽」的迴圈會**永遠抽不到合格的點**而卡死（踩過一次，
      //    症狀是整個分頁沒有回應）。凡是「重抽直到合格」的寫法，
      //    都要先確認取樣範圍跟排除區沒有完全重疊
      const clusters = [[34, horizon + 46], [166, horizon + 92], [96, horizon + 24]];
      const stones = [];
      for (let i = 0, guard = 0; i < 14 && guard < 400; i++, guard++) {
        const c = clusters[i % clusters.length];
        const x = c[0] + (R() - 0.5) * 80;
        const y = c[1] + (R() - 0.5) * 70;
        // 避開船（x 40～150、y 216～268），不然石頭會從船身裡長出來
        if (x < 8 || x > W - 8 || y < horizon + 12 || y > H - 26 ||
            (x > 26 && x < 164 && y > 200 && y < 280)) { i--; continue; }
        // 尺寸差距要拉開（5～19），一整片同樣大的石頭會被讀成一串排開的浮標
        const rw = 5 + Math.pow(R(), 1.5) * 14, rh = Math.max(4, rw * (0.66 + R() * 0.24));
        stones.push([x, y, rw, rh]);
      }
      stones.sort(function (a, b) { return a[1] - b[1]; });          // 由遠而近畫，近的壓在前面
      stones.forEach(function (s) {
        const cx = s[0], cy = s[1], rw = s[2], rh = s[3];
        // ★ 先畫**水面下那一大塊**：比露出的部分寬一半、往下延伸，深色半透明。
        //   這是解決「石頭浮在半空」的關鍵——這個投影裡的水面是一整片平塗，
        //   沒有任何東西可以讓物件「站」上去，所以石頭必須自己帶著水下的體積。
        //   （初版沒有這一塊，只有一個圓頂加下方的白，讀起來就是飛碟加光束。）
        g.globalAlpha = 0.42;
        for (let dy = -rh * 0.2; dy <= rh * 1.7; dy++) {
          const t = dy / (rh * 1.75);
          const half = Math.sqrt(Math.max(0, 1 - t * t)) * rw * 1.45;
          rect(cx - half, cy + dy, half * 2, 1, FG.shade(P.waterDeep || '#3f6f78', -0.45));
        }
        g.globalAlpha = 1;
        //   露出水面的部分是**半沉的圓頂**：上半是弧、下緣被水線切平
        for (let dy = -rh; dy <= 0; dy++) {
          const half = Math.sqrt(Math.max(0, 1 - (dy / (rh + 0.4)) * (dy / (rh + 0.4)))) * rw;
          const c = dy < -rh * 0.5 ? FG.shade(P.nearTree, 0.26)
                  : dy < -rh * 0.15 ? P.nearTree : FG.shade(P.nearTree, -0.26);
          rect(cx - half, cy + dy, half * 2, 1, c);
        }
        rect(cx - rw * 0.52, cy - rh + 2, rw * 0.34, 1, P.cobbleLit || '#d0d4cc');   // 只有左半的頂緣高光
        if (R() < 0.6) rect(cx - rw * 0.2, cy - rh + 3, rw * 0.5, 1, P.moss || '#54703f');
        // 上游側的堆水：**兩小段偏一邊的白**，不要畫成一道置中對稱的弧。
        // 對稱的白弧壓在深色圓頂上就是一顆眼睛（或一台飛碟）的畫法，
        // 打散成不等長、偏一側的兩段之後才會被讀成撞在石頭上的浪
        const side = R() < 0.5 ? -1 : 1;
        g.globalAlpha = 0.8;
        rect(cx + side * rw * 0.1 - rw * 0.4, cy - rh - 1, rw * 0.6, 1, foam);
        rect(cx + side * rw * 0.34 - rw * 0.2, cy - rh - 2, rw * 0.32, 1, foam);
        g.globalAlpha = 1;
        // 下游只留幾顆散開的泡，**刻意畫得很少**。
        //   ⚠️ 這裡連續兩版栽在同一個坑：石頭下方只要出現一片夠亮、會往下擴散的
        //   東西（楔形也好、兩條線也好、一團密集的碎白也好），整顆石頭就會被讀成
        //   飛碟加光束。水在流這件事已經由整片斜向流線講完了，石頭這裡不必再講一次
        for (let k = 0; k < 7; k++) {
          g.globalAlpha = 0.25 + R() * 0.3;
          rect(cx + (R() - 0.5) * rw * 1.6, cy + rh * (0.4 + R() * 1.4), 1 + Math.round(R()), 1, foam);
        }
        g.globalAlpha = 1;
      });

      // --- 前景巨石：畫面最下緣兩塊被裁掉的大石 ---
      // 「有東西比水更近」是這個地形獨有的一層。刻意讓它們被畫面下緣切斷——
      // 完整的輪廓會被讀成「水裡的石頭」，被切斷才是「鏡頭前面的石頭」。
      // 位置避開船（x 40～150、y 216～268）
      const fore = P.fore || '#2e3330';
      [[6, H + 4, 44, 30], [176, H + 10, 52, 34]].forEach(function (f) {
        for (let dy = -f[3]; dy <= 0; dy++) {
          const half = Math.sqrt(Math.max(0, 1 - (dy / (f[3] + 2)) * (dy / (f[3] + 2)))) * f[2];
          const y = f[1] + dy;
          if (y >= H) continue;
          rect(f[0] - half, y, half * 2, 1, dy < -f[3] * 0.55 ? FG.shade(fore, 0.22) : fore);
        }
        // 上緣的苔與高光：沒有這一條的話它只是一塊黑
        for (let k = 0; k < 14; k++) {
          const dx = (R() - 0.5) * f[2] * 1.4;
          const dy = -f[3] + Math.abs(dx) / f[2] * f[3] * 0.5;
          rect(f[0] + dx, f[1] + dy, 1 + R() * 3, 1, R() < 0.5 ? P.moss || '#54703f' : FG.shade(fore, 0.4));
        }
      });
      // 前景石周圍的白沫：水撞上來的地方
      for (let i = 0; i < 40; i++) {
        g.globalAlpha = 0.3 + R() * 0.4;
        const s = R() < 0.5 ? 0 : 1;
        const cx = s ? 176 : 6, cw = s ? 52 : 44, ch = s ? 34 : 30, cyy = s ? H + 10 : H + 4;
        rect(cx + (R() - 0.5) * cw * 2.2, cyy - ch - R() * 8, 1 + R() * 3, 1, foam);
      }
      g.globalAlpha = 1;
    }
  };

  // 十四 · 珊瑚礁：環礁沙洲 + 碎浪線 + 側視的立體礁體與礁洞（琉璃珊瑚）
  //
  //   三個設計決定：
  //
  //   一 · **水下是「側視的立體結構」，不是「俯視的底面」。** pond 已經佔走
  //        「看得見水底」了，但它畫的是一張往下看、帶滅點的平面（磁磚 + 透視格線）。
  //        這裡的礁是**從畫面下緣往上長**的——有高度、有前後遮擋、有樹冠一樣的輪廓，
  //        讀起來像一片水下的森林而不是一塊地板。兩者放在一起不會混。
  //
  //   二 · **碎浪線把水面切成兩種水色。** 地平線下方一條白色破碎帶，上面是外洋的
  //        深藍（waterTop 刻意壓深），下面是礁湖的亮青。「同一個畫面裡有兩片不同的海」
  //        是這個地形獨有的，成本只有一條抖動過的橫帶。
  //
  //   三 · **這是全遊戲飽和度最高的一格，而且是刻意的。** 其他十四種地形不是偏冷
  //        就是偏灰，這裡六個珊瑚色全部拉到最滿。**不要因為「看起來太吵」把它調灰**——
  //        吵就是它的識別，調灰之後它會變成另一個潮落礁灘。
  TERRAIN.reef = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      const g = T.g;
      const sand = P.sand || '#eae0c4';

      // --- 環礁沙洲：一條低平的白沙帶。陸地在這個釣點只是背景，越少越好 ---
      for (let x = 0; x < W; x++) {
        const h = 7 + Math.sin(x * 0.028) * 3 + Math.sin(x * 0.09 + 2.1) * 1.6;
        rect(x, horizon - h, 1, h + 2, P.midTree);
        rect(x, horizon - h, 1, 2, FG.shade(sand, 0.1));
        if ((x * 7 + Math.round(h)) % 11 === 0) rect(x, horizon - h + 2, 1, 1, FG.shade(sand, -0.16));
      }
      // 遠處外洋的一線深藍：沙洲後面就是外海，這條讓沙洲有厚度
      rect(0, horizon - 22, W, 5, FG.shade(P.hill || '#a8b4a8', -0.36));

      // --- 沙洲上的海葡萄叢：低矮的圓團，不用椰子樹（那是 desert 的 palm 佔走的） ---
      for (let i = 0; i < 16; i++) {
        const cx = R() * W, cy = horizon - 8 - R() * 4, r = 2.5 + R() * 4;
        for (let dy = -r; dy <= r; dy++) {
          const half = Math.sqrt(Math.max(0, r * r - dy * dy));
          rect(cx - half, cy + dy, half * 2, 1, dy < -r * 0.35 ? FG.shade(P.nearTree, 0.26) : P.nearTree);
        }
      }
      // 海鳥
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(R() * W), y = Math.floor(R() * (horizon - 30)) + 5;
        const c = FG.shade(P.hill || '#a8b4a8', -0.5);
        rect(x, y, 1, 1, c); rect(x + 1, y - 1, 1, 1, c); rect(x + 2, y, 1, 1, c);
      }
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;
      const corals = P.coral || ['#e85f8f', '#f0913a', '#8f5fd8', '#3fc0a8', '#4a7fe0', '#e8d04a'];
      const sand = P.sand || '#eae0c4', cave = P.cave || '#141d24';
      const surf = P.surf || '#ffffff';

      // --- 碎浪帶：礁緣的浪打在這裡，外洋與礁湖的分界 ---
      // 帶緣要**破碎**（隨機的段落），連續的一條白線會變成一根桿子
      const surfY = horizon + 11;
      for (let x = 0; x < W; x++) {
        const y = surfY + Math.sin(x * 0.055) * 2 + Math.sin(x * 0.17 + 1) * 1.2;
        g.globalAlpha = 0.55 + R() * 0.4;
        rect(x, y, 1, 1 + Math.round(R() * 2), surf);
        if (R() < 0.4) rect(x, y - 1 - Math.round(R() * 2), 1, 1, surf);
      }
      g.globalAlpha = 1;
      // 礁湖那一側加一層亮青，讓兩片水的色差看得出來
      g.globalAlpha = 0.22;
      rect(0, surfY + 3, W, H - surfY - 3, P.waterBot);
      g.globalAlpha = 1;

      // --- 白沙底：越近越亮。礁叢之間露出來的部分 ---
      // ⚠️ 這一層的 alpha 上限只能到 0.3 左右。初版拉到 0.52，整片礁湖被洗成
      //    一種很淡的奶青色，珊瑚的高飽和度全部被吃掉——而高飽和正是這個地形的識別
      for (let y = surfY + 4; y < H; y++) {
        const t = (y - surfY) / (H - surfY);
        g.globalAlpha = 0.06 + t * 0.24;
        rect(0, y, W, 1, sand);
      }
      g.globalAlpha = 1;

      // --- 礁體：三層，由遠而近由小而大、由淡而濃 ---
      // 三種形態一定要都有：分枝（鹿角）、球（腦珊瑚）、桌形。
      // 只畫一種的話整片會變成同一個花紋，讀不出「礁」是很多種東西堆起來的
      function branchCoral(cx, baseY, hgt, c, alpha) {
        g.globalAlpha = alpha;
        const trunkW = Math.max(2, Math.round(hgt * 0.17));
        rect(cx - trunkW / 2, baseY - hgt * 0.55, trunkW, hgt * 0.55, c);
        const n = 2 + Math.floor(R() * 3);
        for (let i = 0; i < n; i++) {
          const dir = i % 2 ? 1 : -1;
          const off = (0.3 + R() * 0.5) * dir;
          const bh = hgt * (0.45 + R() * 0.45);
          for (let k = 0; k < bh; k++) {
            const w = Math.max(1, trunkW * 0.8 * (1 - k / bh * 0.5));
            rect(cx + off * k * 0.55, baseY - hgt * 0.5 - k, w, 1, k > bh * 0.7 ? FG.shade(c, 0.3) : c);
          }
        }
        g.globalAlpha = 1;
      }
      function brainCoral(cx, baseY, r, c, alpha) {
        g.globalAlpha = alpha;
        for (let dy = -r; dy <= 0; dy++) {
          const half = Math.sqrt(Math.max(0, r * r - dy * dy));
          rect(cx - half, baseY + dy, half * 2, 1, dy < -r * 0.5 ? FG.shade(c, 0.22) : c);
        }
        for (let k = 0; k < 4; k++) {                       // 腦紋：彎曲的溝
          for (let x = -r; x <= r; x += 1) {
            const y = baseY - r * 0.35 - k * r * 0.22 + Math.sin(x * 0.6 + k) * 1.2;
            if (Math.abs(x) > r * 0.85) continue;
            rect(cx + x, y, 1, 1, FG.shade(c, -0.32));
          }
        }
        g.globalAlpha = 1;
      }
      function tableCoral(cx, baseY, w, c, alpha) {
        g.globalAlpha = alpha;
        rect(cx - 1.5, baseY - w * 0.42, 3, w * 0.42, FG.shade(c, -0.24));   // 短柱
        rect(cx - w / 2, baseY - w * 0.5, w, 3, c);                          // 桌面
        rect(cx - w / 2, baseY - w * 0.5, w, 1, FG.shade(c, 0.32));
        g.globalAlpha = 1;
      }
      // --- 礁叢：一座礁石丘 + 長在丘上的珊瑚 + 挖進丘裡的洞 ---
      // ⚠️ 初版把珊瑚、洞口各自隨機灑在整片水裡，結果每一株都像**浮在半空**，
      //    黑色的洞口更像是畫面上破了幾個洞。問題不在數量也不在顏色，是**沒有地面**：
      //    珊瑚必須長在某個東西上面，洞必須挖在某個東西裡面。
      //    改成先堆一座礁丘，再讓那一叢的東西全部坐在同一座丘上，整片才站得住。
      const rockBase = FG.mix(cave, sand, 0.34);
      function reefClump(cx, baseY, scale, alpha) {
        // 每一座丘的岩色微微偏向那一叢的其中一個珊瑚色。全部同一個灰的話，
        // 十幾座丘會被讀成灑在沙上的一堆石頭，而不是連成一片的礁體
        const rock = FG.mix(rockBase, corals[Math.floor(R() * corals.length)], 0.12);
        const mw = (16 + R() * 20) * scale, mh = (7 + R() * 9) * scale;
        // 礁丘本體
        g.globalAlpha = alpha;
        for (let dy = -mh; dy <= 0; dy++) {
          const half = Math.sqrt(Math.max(0, 1 - (dy / (mh + 0.5)) * (dy / (mh + 0.5)))) * mw;
          rect(cx - half, baseY + dy, half * 2, 1, dy < -mh * 0.55 ? FG.shade(rock, 0.2) : rock);
        }
        rect(cx - mw * 0.9, baseY, mw * 1.8, 1, FG.shade(sand, -0.34));      // 接觸陰影
        g.globalAlpha = 1;
        // 挖進丘裡的洞：**開在丘的正面下緣**，上緣一圈受光的岩檐。
        // 洞口是這個釣點的招牌（「你不會知道哪一個裡面有東西」）
        if (scale > 0.7 && R() < 0.6) {
          const hw = mw * (0.2 + R() * 0.16), hh = mh * (0.5 + R() * 0.3);
          const hx = cx + (R() - 0.5) * mw * 0.7;
          for (let dy = -hh; dy <= 0; dy++) {
            const half = Math.sqrt(Math.max(0, 1 - (dy / (hh + 0.3)) * (dy / (hh + 0.3)))) * hw;
            rect(hx - half, baseY + dy, half * 2, 1, cave);
          }
          rect(hx - hw * 0.9, baseY - hh - 1, hw * 1.8, 1, FG.shade(rock, 0.44));
        }
        // 長在丘上的珊瑚：貼著丘的上緣排開，**同一叢混三種形態**
        const n = 3 + Math.floor(R() * 4);
        for (let i = 0; i < n; i++) {
          const ox = (R() - 0.5) * mw * 1.7;
          const oy = baseY - mh * Math.sqrt(Math.max(0, 1 - (ox / (mw + 0.5)) * (ox / (mw + 0.5)))) + 1;
          const c = corals[Math.floor(R() * corals.length)];
          const kind = R();
          if (kind < 0.42) branchCoral(cx + ox, oy, (9 + R() * 13) * scale, c, alpha);
          else if (kind < 0.76) brainCoral(cx + ox, oy, (3 + R() * 5) * scale, c, alpha);
          else tableCoral(cx + ox, oy, (9 + R() * 10) * scale, c, alpha);
        }
      }
      // 由遠而近：越近越大越實，近的壓在遠的前面
      const clumps = [];
      for (let i = 0; i < 23; i++) clumps.push([R() * (W + 30) - 15, surfY + 12 + Math.pow(R(), 0.85) * (H - surfY - 6)]);
      clumps.sort(function (a, b) { return a[1] - b[1]; });
      clumps.forEach(function (c) {
        const t = (c[1] - surfY) / (H - surfY);
        reefClump(c[0], c[1], 0.5 + t * 0.8, 0.72 + t * 0.28);
      });

      // --- 魚群：幾撮高飽和的小點。成本一格一格算，但「這片礁是活的」講得最快 ---
      for (let i = 0; i < 9; i++) {
        const cx = R() * W, cy = surfY + 10 + R() * (H - surfY - 40);
        const c = corals[Math.floor(R() * corals.length)];
        for (let k = 0; k < 7; k++) {
          rect(cx + (R() - 0.5) * 16, cy + (R() - 0.5) * 10, 2, 1, FG.shade(c, 0.24));
        }
      }
    }
  };

  // 十五 · 鐘乳洞：沒有天空的地形（鐘乳暗穴）
  //
  //   一 · **這是唯一一種把天空整片蓋掉的地形。** 前十四種的天際線再怎麼變，
  //        上緣一定是天空漸層；這裡上緣是岩，只在中央遠處留一個拱形洞口透光。
  //        「畫面被岩石框住」本身就是識別，不需要任何細節去解釋它是洞。
  //        `loc.scene.sky` 在這裡只有那個拱口看得見，所以它調的其實是「洞口的光」。
  //
  //   二 · **倒吊的尖錐是安全的。** §16 說這個尺寸下尖三角一律被讀成針葉樹——
  //        但那是**站著**的尖三角。從畫面頂端往下垂的尖錐沒有這個問題，
  //        因為沒有樹是倒著長的。這等於把一條被封死的軸重新打開。
  //
  //   三 · **窄水道靠 below() 的兩側岩壁做，不是靠 above()。** cliff 是地平線
  //        以上兩側崖壁夾出中央的亮縫；這裡把同一件事搬到水面以下——左右各一塊
  //        往中間侵入的暗岩，把可見的水面壓成中間一條帶。加上頭頂的岩，
  //        四個邊都是石頭，跟 cliff 站在一起不會認錯。
  const CAVE_MOUTH_X = 112;
  TERRAIN.cavern = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      const g = T.g;

      function shades(base) {
        return [FG.shade(base, -0.5), FG.shade(base, -0.3), FG.shade(base, -0.12),
                base, FG.shade(base, 0.2), FG.shade(base, 0.44)];
      }
      const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
      function dither(x, y, sh, lv) {
        const i = FG.clamp(Math.round(lv) + (BAYER[y & 3][x & 3] > 7 ? 1 : 0), 0, sh.length - 1);
        return sh[i];
      }

      // 先把天空整片吃掉。留著的那一塊等一下再挖回來
      const farS = shades(P.farTree);
      for (let y = 0; y < horizon; y++) {
        for (let x = 0; x < W; x++) {
          // 越靠近洞口越亮（散射光只到得了那一圈）
          const d = Math.min(1, Math.hypot((x - CAVE_MOUTH_X) / 70, (y - (horizon - 26)) / 46));
          rect(x, y, 1, 1, dither(x, y, farS, 4.6 - d * 3.4));
        }
      }

      // --- 洞口：中央遠處的拱。整個場景唯一的光源 ---
      const mw = 30, mh = 40, my = horizon;
      for (let y = my - mh; y < my; y++) {
        const t = (my - y) / mh;
        // 拱形：下半是直壁、上半收成半圓
        const half = t < 0.62 ? mw : mw * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.62) / 0.38, 2)));
        if (half < 1) continue;
        const sk = P.sky;
        const st = FG.clamp(1 - t * 0.9, 0, 1);
        const idx = FG.clamp(Math.floor(st * (sk.length - 1)), 0, sk.length - 2);
        const c = FG.mix(sk[idx], sk[idx + 1], st * (sk.length - 1) - idx);
        rect(CAVE_MOUTH_X - half, y, half * 2, 1, c);
      }
      // 洞口往內散出來的光暈：寬而淡，不要畫成一圈光環
      for (let k = 0; k < 26; k++) {
        g.globalAlpha = 0.06 * (1 - k / 26);
        rect(CAVE_MOUTH_X - mw - k * 1.6, my - mh - k * 0.9, (mw + k * 1.6) * 2, mh + k * 0.9, P.highlight || '#a8f0f0');
      }
      g.globalAlpha = 1;

      // --- 鐘乳石：從畫面頂端往下垂的尖錐 ---
      // 這個地形的招牌。長度差距要拉到三倍以上，等長的一排會變成柵欄；
      // 每根都要有**橫向層理**（它是一層一層長出來的），沒有層理只是一根釘子
      const st = shades(P.stalac || '#5f5a52');
      const lit = P.stalacLit || '#8f877a';
      for (let i = 0; i < 34; i++) {
        const cx = R() * (W + 8) - 4;
        const h = 6 + Math.pow(R(), 1.6) * 46;
        // ⚠️ 初版的 w 抓 0.16～0.30 倍高、收尖用 pow(.., 0.72)，結果每一根都又肥又鈍，
        //    加上層理的橫紋看起來像一排包裝好的糖果。鐘乳石要**細而尖**：
        //    收尖的指數要大於 1（前段收得慢、末段急收），寬度上限砍掉三分之一
        const w = Math.max(2, Math.round(h * (0.11 + R() * 0.08)));
        for (let k = 0; k < h; k++) {
          const ww = Math.max(1, w * Math.pow(1 - k / h, 1.15));
          for (let x = Math.round(cx - ww / 2); x <= Math.round(cx + ww / 2); x++) {
            rect(x, k, 1, 1, dither(x, k, st, x < cx ? 4.2 : 2.2));
          }
          if (k % 5 === 2) rect(cx - ww / 2, k, ww, 1, FG.shade(P.stalac || '#5f5a52', -0.34));  // 層理
        }
        rect(cx - w / 2, 0, Math.max(1, w * 0.45), 1, lit);
      }

      // --- 流石：牆面上一片片往下流的鈣華 ---
      // 從**底部往上**長不適用（它本來就是往下流的），但要讓寬度隨高度變化，
      // 等寬的垂直帶會被讀成柱子
      const flow = P.flowstone || '#6f6252';
      for (let i = 0; i < 9; i++) {
        const cx = R() * W, top = R() * horizon * 0.4, h = 20 + R() * 40;
        for (let k = 0; k < h; k++) {
          const w = 4 + Math.sin(k / h * Math.PI) * (5 + R() * 4);
          const y = top + k;
          if (y >= horizon) break;
          rect(cx - w / 2, y, w, 1, k % 4 === 0 ? FG.shade(flow, 0.2) : flow);
        }
      }

      // --- 近景洞壁：左右兩側往中間收，把畫面框住 ---
      const nearS = shades(P.nearTree);
      for (let x = 0; x < W; x++) {
        const d = Math.min(x / (W * 0.3), (W - 1 - x) / (W * 0.3));
        if (d > 1) continue;
        const h = horizon * (0.86 * Math.pow(1 - d, 1.3));
        for (let y = horizon - h; y < horizon; y++) {
          rect(x, y, 1, 1, dither(x, y, nearS, 2.6 - (1 - d) * 1.6));
        }
      }

      // --- 石筍：岸線上往上長的錐，短。有上有下才是一個洞 ---
      for (let i = 0; i < 13; i++) {
        const cx = R() * W, h = 4 + R() * 16;
        const w = Math.max(2, Math.round(h * 0.34));
        for (let k = 0; k < h; k++) {
          const ww = Math.max(1, w * Math.pow(k / h, 0.7));
          rect(cx - ww / 2, horizon - h + k, ww, 1, k < h * 0.3 ? FG.shade(P.stalagmite || '#4a463e', 0.26) : P.stalagmite || '#4a463e');
        }
      }
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;

      // --- 兩側往中間侵入的水下岩壁：把水面壓成中央一條窄帶 ---
      // 「狹窄水道」是這個釣點的文案第一句，所以它必須看得出來。
      // 右側刻意比左側寬（不對稱），對稱的話會變成一條運河
      for (let y = horizon + 2; y < H; y++) {
        const t = (y - horizon) / (H - horizon);
        const lw = 18 + t * 46 + Math.sin(y * 0.09) * 4;
        const rw = 26 + t * 58 + Math.sin(y * 0.07 + 2) * 5;
        rect(0, y, lw, 1, FG.shade(P.nearTree, 0.06 - t * 0.3));
        rect(W - rw, y, rw, 1, FG.shade(P.nearTree, -t * 0.34));
        // 岩腳的水線：只每隔幾列點一段。整條連續的亮線會被讀成一根拉緊的纜繩
        if ((y & 3) !== 3) {
          rect(lw - 1, y, 1, 1, FG.shade(P.nearTree, 0.24));
          rect(W - rw, y, 1, 1, FG.shade(P.nearTree, 0.24));
        }
      }

      // --- 洞口的光在水面拉出來的一道縱向亮帶 ---
      // 這是全畫面第二亮的東西（第一亮是洞口本身），也是唯一讓水面看得見的原因
      for (let y = horizon + 2; y < H; y++) {
        const t = (y - horizon) / (H - horizon);
        const w = 8 + t * 26;
        g.globalAlpha = 0.3 * (1 - t * 0.75);
        rect(CAVE_MOUTH_X - w / 2 + Math.sin(y * 0.06) * 3, y, w, 1, P.highlight || '#a8f0f0');
        g.globalAlpha = 0.16 * (1 - t * 0.7);
        rect(CAVE_MOUTH_X - w * 1.4 + Math.sin(y * 0.05) * 4, y, w * 2.8, 1, P.highlight2 || '#4f9a9a');
      }
      g.globalAlpha = 1;

      // --- 發光苔：水線附近幾點青綠。全場唯一的第二光源，克制才有效 ---
      const gm = P.glowmoss || '#3fa88f';
      for (let i = 0; i < 22; i++) {
        const x = R() * W, y = horizon + 2 + R() * 40;
        g.globalAlpha = 0.3 + R() * 0.5;
        rect(x, y, 1 + Math.round(R()), 1, gm);
        if (R() < 0.3) { g.globalAlpha = 0.14; rect(x - 1, y - 1, 3, 3, gm); }
      }
      g.globalAlpha = 1;

      // --- 水滴落點：頭頂的鐘乳石一直在滴 ---
      // 自然界沒有完整的同心圓（§落水點像射箭靶紙），所以只畫**弧段**
      for (let i = 0; i < 6; i++) {
        const cx = 30 + R() * (W - 60), cy = horizon + 14 + R() * (H - horizon - 40);
        const r = 3 + R() * 6;
        g.globalAlpha = 0.3 + R() * 0.3;
        const a0 = R() * Math.PI * 2, span = 1.4 + R() * 2.2;
        for (let a = a0; a < a0 + span; a += 0.14) {
          rect(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.36, 1, 1, P.highlight || '#a8f0f0');
        }
      }
      g.globalAlpha = 1;
    }
  };

  /* ------------------------------------------------------------
     wreck · 曉日沉港

     它佔的兩條辨識軸都是新的（見 wiki 06 §十五種地形各自佔了哪一條辨識軸）：

     一 · **地平線上一顆巨大的天體。** 前十五種地形沒有任何一種畫太陽或月亮——
          天空一律只有漸層（外加 night/yggdrasil 的星點與極光）。一顆半徑 34 的
          日盤壓在地平線上，一行公式就把「破曉」跟「逆光」同時講完，而且它
          順便解釋了為什麼港區全是剪影（＝畫得便宜）。

     二 · **同一個物件跨越水線。** yggdrasil 的樹幹畫到地平線就交給倒影，其他
          地形的物件也一律只在水上或只在水下。這裡的船殼是**一個**物件：上部
          構造在 above()，同一段 x 範圍的水下船身在 below()，中間用船底漆
          （redlead）與藤壺帶接起來。玩家讀到的是「這艘船有一半在水裡」。

     ★ 日盤的亮度遠高於倒影的門檻（150），所以它**不會有倒影**（同 karst 的白牆）。
       水面那道日照光路因此必須自己畫，就在 below() 裡。
     ------------------------------------------------------------ */
  const SUN_X = 128, SUN_R = 34;

  TERRAIN.wreck = {
    above: function (T) {
      const { P, R, W, horizon, rect } = T;
      const g = T.g;

      function shades(base) {
        return [FG.shade(base, -0.5), FG.shade(base, -0.3), FG.shade(base, -0.12),
                base, FG.shade(base, 0.2), FG.shade(base, 0.44)];
      }
      const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
      function dither(x, y, sh, lv) {
        const i = FG.clamp(Math.round(lv) + (BAYER[y & 3][x & 3] > 7 ? 1 : 0), 0, sh.length - 1);
        return sh[i];
      }

      const sunC = P.sun || '#ffe6a8';
      const sunS = shades(sunC);
      const sy = horizon - 18;              // 日心壓在地平線上方一點，盤的下緣被水切掉

      // --- 日暈：寬而淡，一圈一圈往外遞減。不要畫成一個亮環（那會變成靶紙）---
      for (let k = 0; k < 30; k++) {
        g.globalAlpha = 0.05 * (1 - k / 30);
        const r = SUN_R + k * 2.4;
        for (let y = Math.max(0, Math.round(sy - r)); y < Math.min(horizon, Math.round(sy + r)); y++) {
          const half = Math.sqrt(Math.max(0, r * r - (y - sy) * (y - sy)));
          rect(SUN_X - half, y, half * 2, 1, sunC);
        }
      }
      g.globalAlpha = 1;

      // --- 日盤：六階明度的圓，中心最亮。全畫面最亮的東西 ---
      for (let y = Math.max(0, Math.round(sy - SUN_R)); y < horizon; y++) {
        const dy = y - sy;
        const half = Math.sqrt(Math.max(0, SUN_R * SUN_R - dy * dy));
        if (half < 1) continue;
        for (let x = Math.round(SUN_X - half); x <= Math.round(SUN_X + half); x++) {
          const d = Math.hypot(x - SUN_X, dy) / SUN_R;
          // 邊緣偏橘、中心接近白：破曉的太陽在地平線上一定是這個方向
          rect(x, y, 1, 1, dither(x, y, sunS, 5.4 - d * 2.6));
        }
      }

      // --- 雲層：橫過整個天空的薄帶，會切過日盤 ---
      // 只畫在日盤上會被讀成「太陽有條紋」；橫貫整片天空才是雲。
      // 這也是這片天空色階數的主要來源
      [[0.24, 5, 0.30], [0.44, 3, 0.22], [0.62, 6, 0.26], [0.78, 4, 0.18]].forEach(function (c, ci) {
        const base = horizon * c[0];
        for (let x = 0; x < W; x++) {
          const th = c[1] * (0.5 + 0.5 * Math.sin(x * 0.045 + ci * 2.1));
          for (let k = 0; k < th; k++) {
            g.globalAlpha = c[2] * (1 - k / Math.max(1, th));
            rect(x, base + Math.sin(x * 0.03 + ci) * 4 + k, 1, 1, ci % 2 ? P.hill : sunC);
          }
        }
      });
      g.globalAlpha = 1;

      // --- 遠景：外港防波堤 + 一座導標塔。逆光所以只有輪廓 ---
      const farS = shades(P.farTree);
      for (let x = 0; x < W; x++) {
        const h = 4 + Math.sin(x * 0.02 + 1) * 1.6 + (x > 150 ? 3 : 0);
        for (let y = horizon - h; y < horizon; y++) rect(x, y, 1, 1, dither(x, y, farS, 3.4));
      }
      for (let k = 0; k < 22; k++) {          // 導標塔：往上收的窄塔，頂端一格燈
        const w = Math.max(2, 7 - Math.round(k / 5));
        rect(28 - w / 2, horizon - 4 - k, w, 1, dither(28, k, farS, k < 4 ? 4.6 : 2.6));
      }
      rect(27, horizon - 27, 3, 2, sunC);

      // --- 中景：倉庫群。鋸齒屋頂＋等距的窗，人造物靠規律辨認（同 pond 的原則）---
      const midS = shades(P.midTree);
      [[0, 44, 22], [46, 34, 17], [166, 34, 20]].forEach(function (b) {
        const bx = b[0], bw = b[1], bh = b[2];
        for (let x = bx; x < bx + bw; x++) {
          // 鋸齒屋頂：每 10px 一個斜面（工廠採光窗的形狀）
          const saw = ((x - bx) % 10) * 0.7;
          for (let y = horizon - bh - saw; y < horizon; y++) rect(x, y, 1, 1, dither(x, y, midS, 2.2));
        }
        for (let i = 0; i < Math.floor(bw / 8); i++) {
          rect(bx + 3 + i * 8, horizon - bh * 0.5, 3, 4, FG.shade(P.midTree, -0.42));
        }
      });

      // --- 中景：兩座門式起重機。垂直桁架 ＋ 斜的吊桿 ＋ 垂下來的鉤 ---
      // 「人造的鋼架」是這一格的第二個識別，桁架的交叉斜撐一定要畫，
      // 兩根光溜溜的柱子會被讀成電線桿
      const cr = P.crane || '#15121c';
      [[74, 46, 1], [188, 34, -1]].forEach(function (c) {
        const cx = c[0], ch = c[1], dir = c[2];
        rect(cx - 2, horizon - ch, 4, ch, cr);                       // 主柱
        for (let k = 0; k < ch; k += 6) {                            // 交叉斜撐
          rect(cx - 6, horizon - ch + k, 2, 2, cr);
          rect(cx + 4, horizon - ch + k + 3, 2, 2, cr);
        }
        for (let k = 0; k < 26; k++) rect(cx + dir * k, horizon - ch + k * 0.42, 2, 2, cr);   // 吊桿
        rect(cx + dir * 24, horizon - ch + 11, 1, 14, cr);                                    // 吊索
        rect(cx + dir * 23, horizon - ch + 25, 3, 3, cr);                                     // 吊鉤
      });

      // --- 主角：擱在防波堤內側的貨輪。上部構造在這裡，水下船身在 below() ---
      // 甲板線刻意往右上傾（船頭抬起＝擱淺的姿態）。傾斜是這艘船「壞了」的訊號，
      // 水平的甲板線只會讀成一艘停著的船
      const hull = P.hull || '#1f1a22';
      const hullS = shades(hull);
      const lit = P.hullLit || '#ffc478';
      const rust = P.rust || '#8a4326';
      const HX0 = 50, HX1 = 176;
      const deckY = function (x) { return horizon - 12 - (x - HX0) * 0.13; };

      for (let x = HX0; x <= HX1; x++) {
        const dy = deckY(x);
        for (let y = dy; y < horizon; y++) {
          // 越靠水線越暗（逆光下的船殼只有上緣受光）
          rect(x, y, 1, 1, dither(x, y, hullS, 1.9 - (y - dy) / 14));
        }
        rect(x, dy, 1, 1, lit);                                      // 甲板緣的逆光邊緣光
        // 縱向鏽流：每隔幾列從甲板往下淌一段。這是船殼上唯一的暖色，也是資訊密度的來源
        if ((x * 7) % 23 < 2) {
          const rl = 4 + ((x * 13) % 11);
          for (let k = 0; k < rl && dy + k < horizon; k++) {
            g.globalAlpha = 0.5 - k / rl * 0.35;
            rect(x, dy + k, 1, 1, rust);
          }
          g.globalAlpha = 1;
        }
        if ((x - HX0) % 9 === 0) {                                   // 鉚釘列
          for (let y = dy + 3; y < horizon; y += 5) rect(x, y, 1, 1, FG.shade(hull, 0.22));
        }
      }
      // 船頭：往右收的尖艏。少了它就是一塊長方形的鐵板
      for (let k = 0; k < 16; k++) {
        const x = HX1 + k;
        if (x >= W) break;
        const dy = deckY(HX1) + k * 1.5;
        for (let y = dy; y < horizon; y++) rect(x, y, 1, 1, dither(x, y, hullS, 1.4));
        rect(x, dy, 1, 1, lit);
      }

      // 上部構造（駕駛台）：三層，每層一排窗。窗要是**黑的**——逆光的建物開口
      // 一律比外殼更暗，畫成亮的會變成一棟有人住的房子
      const bx = 96, bw = 34, bTop = deckY(bx) - 30;
      for (let x = bx; x < bx + bw; x++) {
        for (let y = bTop; y < deckY(x); y++) rect(x, y, 1, 1, dither(x, y, hullS, 1.6));
        rect(x, bTop, 1, 1, lit);
      }
      for (let lv = 0; lv < 3; lv++) {
        for (let i = 0; i < 6; i++) {
          rect(bx + 3 + i * 5, bTop + 5 + lv * 8, 3, 3, FG.shade(hull, -0.55));
        }
      }
      // 煙囪：往上略收，頂緣一道逆光。它跟駕駛台的方塊擺在一起才像一艘船
      for (let k = 0; k < 24; k++) {
        const w = 13 - k * 0.16;
        rect(136 - w / 2 + k * 0.1, deckY(136) - k, w, 1, dither(136, k, hullS, k < 3 ? 3.0 : 1.5));
      }
      rect(130, deckY(136) - 24, 12, 1, lit);
      // 前桅：桅桿＋橫桁＋兩道支索。1px 的斜索在這個尺寸讀得出來，因為它有兩端
      rect(66, deckY(66) - 42, 2, 42, cr);
      rect(58, deckY(66) - 30, 18, 2, cr);
      for (let k = 0; k < 20; k++) rect(66 - k * 0.9, deckY(66) - 42 + k * 2.1, 1, 1, cr);
      for (let k = 0; k < 20; k++) rect(67 + k * 0.8, deckY(66) - 42 + k * 2.1, 1, 1, cr);
      // 斷掉的吊桿：斜插著、末端垂到甲板。它是「這艘船已經壞了」最直接的一筆
      for (let k = 0; k < 30; k++) rect(150 + k * 0.75, deckY(150) - 26 + k * 0.9, 2, 2, cr);

      // --- 海鳥：三筆一隻，全部朝同一個方向。逆光下只有輪廓 ---
      const bird = P.bird || '#120f18';
      for (let i = 0; i < 7; i++) {
        const x = 12 + R() * (W - 24), y = 12 + R() * (horizon * 0.5);
        const s = R() < 0.4 ? 2 : 1;
        rect(x, y, s, s, bird);
        rect(x - s * 2, y - s, s, s, bird);
        rect(x + s * 2, y - s, s, s, bird);
      }
    },
    below: function (T) {
      const { P, R, W, H, horizon, rect } = T;
      const g = T.g;

      const hull = P.hull || '#1f1a22';
      const HX0 = 50, HX1 = 176;
      const deckY = function (x) { return horizon - 12 - (x - HX0) * 0.13; };

      // --- 水下船身：跟 above() 同一段 x，接在水線下 ---
      // ★ 這是這個地形的第二條軸。三件事讓它讀起來是「同一個物件的延續」而不是倒影：
      //   1. 水線上一條**飽和的船底漆紅**（全畫面唯一的高彩度色）
      //   2. 紅帶下面一條藤壺白：船在同一個吃水線上停了很久
      //   3. 往下逐列變暗變藍，並且**船腹往內收**（船體是有形狀的，不是一塊板）
      const red = P.redlead || '#a4432a';
      const barn = P.barnacle || '#d8ccb4';
      const depth = 52;
      for (let k = 0; k < depth; k++) {
        const y = horizon + 2 + k;
        if (y >= H) break;
        const t = k / depth;
        // 船腹的收縮：前段幾乎垂直，後段快速往內收
        const inset = Math.pow(t, 2.2) * 46;
        const x0 = HX0 + inset * 0.55, x1 = HX1 + 14 - inset;
        if (x1 <= x0) break;
        // ⚠️ 明度必須從水線的**亮**一路走到深處的**暗**，不能整塊都用船殼色。
        //    初版用 shade(hull, 0.10 − t·0.5)，水下船身的亮度（≈48）跟 waterTop（≈44）
        //    差不到一階，整艘船的下半截等於沒畫——而「跨越水線」正是這個地形的第二條軸。
        //    現在的解釋也是物理的：低角度的陽光只穿得進水面下那一公尺。
        const b0 = 0.5 - t * 1.1;
        for (let x = Math.round(x0); x <= Math.round(x1); x++) {
          let c;
          if (k < 3) c = red;                                   // 船底漆
          else if (k < 5) c = ((x * 5) % 7 < 3) ? barn : FG.shade(red, -0.3);   // 藤壺帶（點狀，不要整條）
          else c = FG.shade(hull, b0);
          rect(x, y, 1, 1, c);
        }
        // 外板的接縫：每 7 列一道較暗的橫線，讓水下這一塊不是平塗
        if (k > 5 && k % 7 === 3) rect(x0, y, x1 - x0, 1, FG.shade(hull, b0 - 0.28));
      }
      // 破口：船殼上兩個往裡看的黑洞。有洞才解釋得通「魚住在船裡面」
      [[92, 22, 15, 11], [148, 34, 11, 8]].forEach(function (b) {
        for (let dy = 0; dy < b[3]; dy++) {
          const half = b[2] * 0.5 * Math.sqrt(Math.max(0, 1 - Math.pow((dy - b[3] / 2) / (b[3] / 2), 2)));
          rect(b[0] - half, horizon + b[1] + dy, half * 2, 1, '#0a0810');
        }
        rect(b[0] - b[2] * 0.4, horizon + b[1], b[2] * 0.8, 1, FG.shade(hull, 0.3));   // 破口上緣的翻邊
      });

      // --- 日照光路：從日盤正下方往觀者展開的一片碎光 ---
      // 刻意做成**斷開的橫向短劃**而不是一條連續亮帶（cavern 的洞口光是連續的，
      // 撞上去就等於白做一種地形）。真實的日照海路本來也是一片碎光
      const hi = P.highlight || '#ffdca0', hi2 = P.highlight2 || '#c8785a';
      for (let y = horizon + 2; y < H; y++) {
        const t = (y - horizon) / (H - horizon);
        const spread = 10 + t * 78;
        const n = 3 + Math.round(t * 7);
        for (let i = 0; i < n; i++) {
          const off = (R() * 2 - 1) * spread;
          const w = 1 + Math.round(R() * (1 + t * 4));
          g.globalAlpha = (0.55 - Math.abs(off) / spread * 0.42) * (1 - t * 0.45);
          if (g.globalAlpha <= 0.02) continue;
          rect(SUN_X + off, y, w, 1, R() < 0.35 ? hi2 : hi);
        }
      }
      g.globalAlpha = 1;

      // --- 半沉的木樁：碼頭剩下的那一排 ---
      // ⚠️ 這一版的水面是平塗，物件必須自己帶著水下的體積（wiki 11 §31）。
      //    所以每根樁先畫一塊往下的深色橢圓，再把露出水面的那一段畫在上面
      [[10, 16, 7], [24, 11, 5], [38, 7, 4]].forEach(function (p) {
        const px0 = p[0], up = p[1], pw = p[2];
        for (let k = 0; k < 20; k++) {                          // 水下的體積
          const half = pw * 0.9 * (1 - k / 26);
          g.globalAlpha = 0.5 - k / 40;
          rect(px0 - half, horizon + 4 + k, half * 2, 1, '#0d0a14');
        }
        g.globalAlpha = 1;
        for (let k = 0; k < up; k++) {
          const y = horizon + 3 - k;
          rect(px0 - pw / 2, y, pw, 1, FG.shade(hull, 0.14 - k * 0.01));
          rect(px0 - pw / 2, y, 1, 1, FG.shade(hull, 0.4));     // 受光的左緣
        }
        rect(px0 - pw / 2, horizon + 2, pw, 2, barn);            // 吃水線的藤壺環
      });

      // --- 蛸壺串：一條繩子上掛著四只陶壺，沉在船頭外側 ---
      // 這是這個釣點在說「這裡抓的是章魚」的地方。壺口一律朝外側（朝右），
      // 那個朝向就是它跟一串珠子的差別。位置避開船（x 40～150、y 216～268）
      const pot = P.pot || '#96694a';
      const ropeX = function (k) { return 182 + Math.sin(k * 0.5) * 3; };
      for (let k = 0; k < 96; k++) {
        const y = horizon + 6 + k;
        if (y >= H) break;
        rect(ropeX(k / 8), y, 1, 1, FG.shade(pot, -0.4));
      }
      [14, 38, 60, 84].forEach(function (k) {
        const cx = ropeX(k / 8) + 2, cy = horizon + 6 + k, r = 7;
        for (let dy = -r; dy <= r; dy++) {
          const half = r * Math.sqrt(Math.max(0, 1 - (dy / r) * (dy / r))) * 0.82;
          if (cy + dy >= H) break;
          rect(cx - half, cy + dy, half * 2, 1, dy < -r * 0.4 ? FG.shade(pot, 0.22) : pot);
        }
        rect(cx + r * 0.5, cy - 2, 3, 4, '#0d0a12');            // 朝外的壺口
        rect(cx - 3, cy - r + 1, 2, 2, FG.shade(pot, 0.36));    // 圓肚上的點高光
      });

      // --- 水面的油膜：幾塊虹彩。這是全畫面唯一的冷色，也是「這裡有船漏油」的證據 ---
      for (let i = 0; i < 5; i++) {
        const cx = 20 + R() * (W - 40), cy = horizon + 20 + R() * (H - horizon - 40);
        const rw = 10 + R() * 22, rh = 3 + R() * 5;
        for (let dy = -rh; dy <= rh; dy++) {
          const half = rw * Math.sqrt(Math.max(0, 1 - (dy / rh) * (dy / rh)));
          g.globalAlpha = 0.14;
          rect(cx - half, cy + dy, half * 2, 1, dy < 0 ? '#7f6ab0' : '#4a8f8a');
        }
      }
      g.globalAlpha = 1;
    }
  };

  function buildBackground(loc) {
    const P = loc.scene;
    const W = SCENE_W, H = SCENE_H;
    const cv = px.make(W, H);
    const g = cv.getContext('2d');
    const R = FG.seeded(loc.seed || 1234);
    const horizon = Math.round(H * (P.horizon || 0.30));

    function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

    // --- 天空 / 遠景漸層 ---
    const sky = P.sky;
    for (let y = 0; y < horizon; y++) {
      const t = y / horizon;
      const idx = FG.clamp(Math.floor(t * (sky.length - 1)), 0, sky.length - 2);
      const lt = t * (sky.length - 1) - idx;
      rect(0, y, W, 1, FG.mix(sky[idx], sky[idx + 1], lt));
    }

    // 傳給地形產生器的上下文
    const T = { g: g, P: P, R: R, W: W, H: H, horizon: horizon, rect: rect };
    // 針葉林產生器（forest 地形用，也開放給其他地形沿用）
    T.forest = function (baseY, height, color, density, accent) {
      for (let i = 0; i < density; i++) {
        const x = Math.floor(R() * (W + 12)) - 6;
        const h = height * (0.6 + R() * 0.7);
        const w = Math.max(2, Math.round(h * 0.42));
        for (let k = 0; k < h; k++) {
          const ww = Math.max(1, Math.round(w * (k / h)));
          rect(x - ww / 2, baseY - h + k, ww, 1, color);
        }
        // 秋葉點綴（只染樹冠上緣，避免整片看起來像火焰）
        if (accent && R() < 0.15) {
          const ac = accent[Math.floor(R() * accent.length)];
          for (let k = 0; k < h * 0.34; k++) {
            const ww = Math.max(1, Math.round(w * (k / h) * 0.9));
            rect(x - ww / 2, baseY - h + k, ww, 1, ac);
          }
        }
      }
    };

    const terrain = TERRAIN[P.terrain] || TERRAIN.forest;
    terrain.above(T);

    // --- 岸線 ---
    rect(0, horizon, W, 2, P.shore || FG.shade(P.nearTree, -0.35));

    // --- 水面底色（由遠而近分帶） ---
    for (let y = horizon + 2; y < H; y++) {
      const t = (y - horizon) / (H - horizon);
      const band = Math.floor(t * 5) / 5;
      rect(0, y, W, 1, FG.mix(P.waterTop, P.waterBot, band));
    }

    // --- 樹林在水面的倒影（帶抖動） ---
    for (let y = 0; y < 48; y++) {
      const srcY = horizon - 1 - y;
      const dstY = horizon + 2 + y;
      if (srcY < 0 || dstY >= H) break;
      const jitter = Math.round(Math.sin(y * 0.9) * 2 + (R() - 0.5) * 2);
      const img = g.getImageData(0, srcY, W, 1);
      const d = img.data;
      for (let x = 0; x < W; x++) {
        const i = x * 4;
        // 只保留較暗的樹影，讓水面保有底色
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (lum > 150) { d[i + 3] = 0; continue; }
        d[i] *= 0.72; d[i + 1] *= 0.78; d[i + 2] *= 0.86;
        d[i + 3] = 150;
      }
      const tmp = px.make(W, 1);
      tmp.getContext('2d').putImageData(img, 0, 0);
      g.globalAlpha = 0.85 * (1 - y / 56);
      g.drawImage(tmp, jitter, dstY);
      g.globalAlpha = 1;
    }

    // --- 深水區塊（畫面中央一片較深的水域） ---
    g.globalAlpha = 0.35;
    rect(0, horizon + 26, W, H - horizon - 26, P.waterDeep);
    g.globalAlpha = 1;

    // --- 地形的水面物件（浮冰、鳥居、發光浮游生物…） ---
    // 放在最後才畫，這樣它們不會被倒影與深水的半透明疊層洗掉
    if (terrain.below) terrain.below(T);

    return { canvas: cv, horizon: horizon };
  }

  function getBg(loc) {
    if (!bgCache[loc.id]) bgCache[loc.id] = buildBackground(loc);
    return bgCache[loc.id];
  }

  /* 水面反光橫線：位置固定（種子），隨時間左右緩慢漂移 */
  function drawSparkle(g, loc, horizon, time) {
    const P = loc.scene;
    const R = FG.seeded((loc.seed || 1234) + 77);
    const W = SCENE_W, H = SCENE_H;
    const n = 190;
    for (let i = 0; i < n; i++) {
      const yy = horizon + 3 + Math.pow(R(), 0.75) * (H - horizon - 6);
      const baseX = R() * W;
      const len = 2 + Math.floor(R() * 7 * (0.4 + (yy - horizon) / (H - horizon)));
      const spd = 1.5 + R() * 3;
      const x = (baseX + Math.sin(time * 0.00035 * spd + i) * 4) % W;
      const near = (yy - horizon) / (H - horizon);
      g.globalAlpha = 0.45 + near * 0.5;
      g.fillStyle = R() < 0.25 ? P.highlight2 || P.highlight : P.highlight;
      g.fillRect(Math.round(x), Math.round(yy), len, 1);
    }
    g.globalAlpha = 1;
  }

  /* 小船 + 釣手 + 水豚 */
  function drawBoat(g, loc, bx, by, time) {
    const P = loc.scene;
    function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

    const bw = 92, bh = 17;

    // 船身倒影
    g.globalAlpha = 0.3;
    for (let i = 0; i < 12; i++) {
      const l = Math.round(i * 1.4);
      rect(bx + 8 + l, by + bh + i, bw - 20 - l * 2, 1, '#0d2233');
    }
    g.globalAlpha = 1;

    // 人物與水豚（畫在船艙內，先畫免得被船緣蓋住頭）
    const bob = Math.sin(time * 0.0016) * 1;
    px.drawMap(g, CAPY.map, CAPY.pal, bx + 12, by - 12 + bob, 1);
    px.drawMap(g, ANGLER.map, ANGLER.pal, bx + 50, by - 15 + bob, 1);

    // 愛心（水豚偶爾冒出）
    const hp = (time % 6000) / 6000;
    if (hp < 0.35) {
      g.globalAlpha = hp < 0.28 ? 1 : (0.35 - hp) / 0.07;
      px.drawMap(g, HEART.map, HEART.pal, bx + 18, by - 24 - hp * 22 + bob, 1);
      g.globalAlpha = 1;
    }

    // 船身
    for (let i = 0; i < bh; i++) {
      const l = Math.round(i * 1.5), r = Math.round(i * 0.6);
      const c = i < 2 ? P.boatRim || '#7a5340' : (i < 5 ? P.boat || '#5b3b2e' : P.boatDark || '#3d281f');
      rect(bx + l, by + i + bob, bw - l - r, 1, c);
    }
    rect(bx + 2, by + bob, bw - 4, 1, FG.shade(P.boatRim || '#7a5340', 0.2));
    // 船外機
    rect(bx + bw - 6, by - 8 + bob, 8, 10, '#33404d');
    rect(bx + bw - 4, by - 10 + bob, 5, 3, '#5c6b78');
    rect(bx + bw - 3, by + 2 + bob, 3, 12, '#2a3540');
    rect(bx + bw - 5, by + 12 + bob, 6, 3, '#222c36');

    return bob;
  }

  /* 釣竿、釣線、浮標 */
  function drawRodAndLine(g, hx, hy, fx, fy) {
    // 釣竿（往右上延伸）
    let rx = hx, ry = hy;
    for (let i = 0; i < 30; i++) {
      rx = hx + i * 1.15;
      ry = hy - i * 0.95 + i * i * 0.006;
      g.fillStyle = i > 26 ? '#d8dde2' : '#2a2119';
      g.fillRect(Math.round(rx), Math.round(ry), 1, 1);
    }
    // 釣線（從竿尖垂到浮標）
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = FG.lerp(rx, fx, t);
      const y = FG.lerp(ry, fy, t) + Math.sin(t * Math.PI) * 6;
      g.fillStyle = 'rgba(235,245,250,.5)';
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  function drawFloat(g, fx, fy, sink) {
    // 浮標：上紅下白
    const h = 6 - sink * 4;
    for (let i = 0; i < h; i++) {
      g.fillStyle = i < h * 0.5 ? '#e04a4a' : '#f2f4f6';
      g.fillRect(fx, fy - h + i, 3, 1);
    }
    g.fillStyle = '#2b3540';
    g.fillRect(fx, fy, 3, 1);
    // 水波
    g.fillStyle = 'rgba(255,255,255,.45)';
    g.fillRect(fx - 4, fy + 1, 11, 1);
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.fillRect(fx - 8, fy + 3, 19, 1);
  }

  /* 對外：繪製釣點場景
     st = { time, floatSink, ripple, jump:{fish, t}, hideLine } */
  px.drawScene = function (g, loc, st) {
    const bg = getBg(loc);
    const time = st.time || 0;
    g.imageSmoothingEnabled = false;
    g.drawImage(bg.canvas, 0, 0);
    drawSparkle(g, loc, bg.horizon, time);

    const bx = 52, by = 236;
    const bob = drawBoat(g, loc, bx, by, time);

    const hx = bx + 60, hy = by - 8 + bob;
    const fx = st.floatX !== undefined ? st.floatX : 150;
    const fy = (st.floatY !== undefined ? st.floatY : 206) + Math.sin(time * 0.003) * 1.2;

    if (!st.hideLine) {
      drawRodAndLine(g, hx, hy, fx, fy);
      drawFloat(g, fx, fy, st.floatSink || 0);
    }

    // 咬鉤時的漣漪
    if (st.ripple) {
      for (let r = 0; r < 3; r++) {
        const rr = ((time * 0.03 + r * 8) % 24);
        g.globalAlpha = FG.clamp(1 - rr / 24, 0, 1) * 0.5;
        g.strokeStyle = '#eaf4f8';
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(fx + 1, fy + 1, rr, rr * 0.35, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    // 魚躍出水面
    if (st.jump && st.jump.fish) {
      const t = FG.clamp(st.jump.t, 0, 1);
      const jx = FG.lerp(fx + 6, fx - 26, t);
      const jy = fy - Math.sin(t * Math.PI) * 54 + 8;
      const rot = -0.9 + t * 1.9;
      g.save();
      g.translate(jx, jy);
      g.rotate(rot);
      px.drawSprite(g, st.jump.fish, 0, 0, 0.62, true);
      g.restore();
      // 水花
      if (t < 0.16 || t > 0.86) {
        for (let i = 0; i < 9; i++) {
          g.fillStyle = 'rgba(240,250,255,.75)';
          g.fillRect(fx - 8 + i * 2, fy - Math.abs(Math.sin(i + time * 0.02)) * 6, 1, 2);
        }
      }
    }
  };

  /* ---------- 地點縮圖 ---------- */
  px.locThumb = function (loc, w, h) {
    const cv = px.make(w || 76, h || 50);
    const g = cv.getContext('2d');
    const P = loc.scene;
    const W = cv.width, H = cv.height;
    const R = FG.seeded((loc.seed || 1) + 9);
    const hz = Math.round(H * 0.42);
    for (let y = 0; y < hz; y++) {
      const t = y / hz;
      const idx = FG.clamp(Math.floor(t * (P.sky.length - 1)), 0, P.sky.length - 2);
      g.fillStyle = FG.mix(P.sky[idx], P.sky[idx + 1], t * (P.sky.length - 1) - idx);
      g.fillRect(0, y, W, 1);
    }
    // 地平線以上的剪影：每種地形一份簡化版，讓釣點選單的縮圖一眼可辨
    // （不共用 TERRAIN，因為縮圖尺寸差 3 倍以上，等比縮放的細節會糊掉）
    function fill(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    const S = Math.max(1, H / 50);        // 相對於 76×50 基準的尺寸係數

    switch (P.terrain) {
      case 'cliff':
        // 兩側崖壁夾出中央水道
        for (let x = 0; x < W; x++) {
          const d = Math.min(x / (W * 0.42), (W - 1 - x) / (W * 0.36));
          if (d > 1) continue;
          const h = (x < W / 2 ? 15 : 19) * S * Math.pow(1 - d, 1.6);
          if (h < 1) continue;
          fill(x, hz - h, 1, h, x < W / 2 ? P.midTree : P.nearTree);
        }
        break;

      case 'ice':
        // 冰川牆 + 三角冰刺
        fill(0, hz - 9 * S, W, 9 * S, P.farTree);
        fill(0, hz - 9 * S, W, 1, FG.shade(P.farTree, 0.3));
        for (let i = 0; i < 7; i++) {
          const x = Math.floor(R() * W), hgt = (2 + R() * 4) * S, w = hgt * 2.4;
          for (let k = 0; k < hgt; k++) {
            const ww = Math.max(2, w * (1 - 0.55 * k / hgt));
            fill(x - ww / 2 + k * 0.5, hz - k - 1, ww, 1, P.nearTree);
          }
          fill(x - w * 0.22 + hgt * 0.5, hz - hgt - 1, w * 0.45, 1, FG.shade(P.nearTree, 0.4));
        }
        break;

      case 'night':
        // 星空 + 幾根海蝕柱
        for (let i = 0; i < 40; i++) fill(Math.floor(R() * W), Math.floor(Math.pow(R(), 0.7) * hz), 1, 1, P.star || '#dff2ff');
        for (let i = 0; i < 5; i++) fill(Math.floor(R() * W), hz - (2 + R() * 5) * S, 1 + R() * 2 * S, 6 * S, P.nearTree);
        break;

      case 'shrine': {
        // 錐形雪山 + 五重塔 + 櫻花樹
        const px0 = W * 0.62, pkY = hz - 20 * S;
        for (let y = pkY; y < hz; y++) {
          const half = (y - pkY) * 1.45;
          fill(px0 - half, y, half * 2, 1, (y - pkY) < 6 * S ? (P.snow || '#eef4f8') : P.hill);
        }
        let ty = hz - 1, tw = 9 * S;
        for (let lv = 0; lv < 4; lv++) {
          fill(W * 0.16 - tw / 2, ty - 3.4 * S, tw, 3.4 * S, P.pagoda || '#3a2630');
          fill(W * 0.16 - (tw + 3 * S) / 2, ty - 4.4 * S, tw + 3 * S, S, P.pagodaRoof || '#241a22');
          ty -= 4.4 * S; tw -= 1.6 * S;
        }
        for (let i = 0; i < 9; i++) {
          const x = Math.floor(R() * W), r = (2 + R() * 2.6) * S;
          for (let dy = -r; dy <= r; dy++) {
            const half = Math.sqrt(Math.max(0, r * r - dy * dy));
            fill(x - half, hz - r - S + dy, half * 2, 1, P.midTree);
          }
        }
        break;
      }

      case 'karst': {
        // 圓頂塔峰 + 一條霧帶。縮圖尺寸放不下水鄉與拱橋，留下這兩樣就夠認
        [0.16, 0.38, 0.58, 0.80].forEach(function (fx, i) {
          const cx = W * fx, hgt = (11 + R() * 8) * S, w = (4 + R() * 3) * S;
          const col = i % 2 ? P.midTree : P.farTree;
          const capR = Math.max(1, w * 0.5);
          for (let y = hz - hgt + capR; y < hz; y++) fill(cx - w / 2, y, w, 1, col);
          for (let dy = 0; dy < capR; dy++) {
            const half = Math.sqrt(Math.max(0, capR * capR - (capR - dy) * (capR - dy)));
            fill(cx - half, hz - hgt + dy, half * 2, 1, col);
          }
        });
        g.globalAlpha = 0.34;
        for (let k = 0; k < Math.max(2, 3 * S); k++) fill(0, hz - 7 * S + k, W, 1, P.mist || '#dfe8ee');
        g.globalAlpha = 1;
        break;
      }

      case 'yggdrasil': {
        // 極光 + 一根巨大樹幹。縮圖放不下符文石與樹根，留這兩樣就夠認
        const auc = (P.aurora && P.aurora[0]) || '#5fe0a8';
        const ah = hz * 0.5;
        for (let x = 0; x < W; x++) {
          const by = hz * 0.62 + Math.sin(x * 0.17) * hz * 0.16;
          for (let k = 0; k < ah; k++) {
            g.globalAlpha = 0.34 * (1 - k / ah) * ((x % 3) === 0 ? 1 : 0.55);
            fill(x, by - k, 1, 1, auc);
          }
        }
        g.globalAlpha = 1;
        for (let y = 0; y < hz; y++) {
          const half = (2.2 + (y / hz) * (y / hz) * 2.6) * S;
          fill(W * 0.24 - half, y, half * 2, 1, P.bark || '#3a2a1e');
        }
        break;
      }

      case 'desert': {
        // 沙丘稜線 + 一座兩面明暗分明的金字塔。縮圖放不下方尖碑與棕櫚
        for (let x = 0; x < W; x++) {
          const h = 5 * S * (0.55 + 0.45 * Math.sin(x * 0.09 + 1.2));
          fill(x, hz - h, 1, h + 2, P.midTree);
          fill(x, hz - h, 1, 1, P.sandLit || '#e8c88f');
        }
        const pcx = W * 0.42, ph = 13 * S, phalf = 11 * S;
        const lit = FG.shade(P.pyramid || '#c0975a', 0.22);
        const dark = FG.shade(P.pyramid || '#c0975a', -0.26);
        for (let k = 0; k < ph; k++) {
          const w = phalf * 2 * (1 - k / ph);
          fill(pcx - w / 2, hz - 2 * S - k, w / 2, 1, lit);
          fill(pcx, hz - 2 * S - k, w / 2, 1, dark);
        }
        break;
      }

      case 'pond': {
        // 平草坪 + 一排等距的樹籬球 + 一條筆直的護岸。縮圖放不下木棧道與池底磁磚，
        // 但「直線 + 等距」這件事在 76×50 也講得完，那就是這個釣點的全部
        fill(0, hz - 9 * S, W, 9 * S + 2, P.farTree);
        for (let x = 0; x < W; x += 7 * S) fill(x, hz - 9 * S, 3.5 * S, 9 * S, FG.shade(P.farTree, -0.1));
        for (let i = 0; i < 6; i++) {
          const cx = W * (0.08 + i * 0.17), r = 2.4 * S;
          for (let dy = -r; dy <= r; dy++) {
            const half = Math.sqrt(Math.max(0, r * r - dy * dy));
            fill(cx - half, hz - 8 * S + dy, half * 2, 1, P.midTree);
          }
        }
        fill(0, hz - 2.4 * S, W, 2.4 * S, P.coping || '#b8b2a4');
        fill(0, hz - 2.4 * S, W, 1, FG.shade(P.coping || '#b8b2a4', 0.28));
        break;
      }

      case 'tidal': {
        // 低平的沙洲 + 兩塊平頂礁。真正的招牌（灘地與積水潭）畫在水面那一段，見下方
        fill(0, hz - 3 * S, W, 3 * S + 2, P.farTree);
        [[W * 0.18, W * 0.26, 4 * S], [W * 0.72, W * 0.3, 5 * S]].forEach(function (r) {
          fill(r[0] - r[1] / 2, hz - r[2], r[1], r[2] + 2, P.nearTree);
          fill(r[0] - r[1] / 2, hz - r[2], r[1], 1, FG.shade(P.nearTree, 0.32));
          fill(r[0] - r[1] / 2, hz - 1, r[1], 2, FG.shade(P.nearTree, -0.45));
        });
        break;
      }

      case 'waterfall': {
        // 岩壁 + 中央亮瀑 + 兩道岩階與頂部樹冠。縮圖放不下石塊與垂藤，
        // 但「暗岩／亮柱／綠色岩階」這三塊面積關係要跟場景對得上，不然縮圖跟本人不像
        fill(0, hz * 0.16, W, hz, P.midTree);
        for (let k = 0; k < 4; k++) fill(0, hz * 0.32 + k * hz * 0.17, W, 1, FG.shade(P.midTree, -0.24));
        fill(0, hz * 0.16, W, 1, FG.shade(P.midTree, 0.3));
        // 兩道岩階
        [[0, W * 0.34, hz * 0.46], [W * 0.62, W * 0.38, hz * 0.62]].forEach(function (L) {
          fill(L[0], L[2], L[1], 2 * S, FG.shade(P.midTree, 0.16));
          fill(L[0], L[2], L[1], 1, FG.shade(P.midTree, 0.4));
          for (let i = 0; i < L[1] / (4 * S); i++) fill(L[0] + i * 4 * S, L[2] - 2 * S, 3 * S, 2 * S, P.leaf || '#4f8a4e');
        });
        const fw = 6 * S;
        for (let y = hz * 0.06; y < hz; y++) {
          const half = fw * 0.5 * (0.82 + (y / hz) * 0.3);
          fill(W * 0.5 - half, y, half * 2, 1, P.falls || '#f2fafa');
          if (y % 5 === 0) fill(W * 0.5 - half, y, half * 2, 1, FG.shade(P.falls || '#f2fafa', -0.14));
        }
        g.globalAlpha = 0.24;
        for (let k = 0; k < 12 * S; k++) fill(W * 0.5 - (5 + k) * S, hz - k, (10 + k * 2) * S, 1, P.mist || '#dfeaea');
        g.globalAlpha = 1;
        // 頂部樹冠：場景裡它框住上緣，縮圖沒有的話兩者看起來會是不同地方
        for (let i = 0; i < 7; i++) {
          const cx = R() * W, r = (2 + R() * 2.4) * S;
          for (let dy = -r; dy <= r; dy++) {
            const half = Math.sqrt(Math.max(0, r * r - dy * dy));
            fill(cx - half, r * 0.4 + dy, half * 2, 1, P.canopy || '#24401f');
          }
        }
        break;
      }

      case 'caldera': {
        // 凹的火口壁 + 平頂火山錐 + 煙柱。三樣缺一不可：少了平頂就是針葉樹，少了煙柱就是山
        for (let x = 0; x < W; x++) {
          const d = Math.abs(x - W / 2) / (W / 2);
          fill(x, hz - (2 * S + Math.pow(d, 1.6) * 11 * S), 1, hz, P.farTree);
        }
        const ccx = W * 0.28, cch = 11 * S, ccw = 6 * S;
        for (let k = 0; k < cch; k++) {
          const half = ccw * 0.5 + (cch - k) * 0.55;
          fill(ccx - half, hz - cch + k, half * 2, 1, P.nearTree);
        }
        fill(ccx - ccw * 0.5, hz - cch, ccw, 1, P.ember || '#e8703a');
        for (let k = 0; k < hz - cch; k++) {
          g.globalAlpha = 0.3 * (1 - k / Math.max(1, hz - cch));
          fill(ccx + k * 0.5 - (1.5 + k * 0.2) * S, hz - cch - k, (3 + k * 0.4) * S, 1, P.smoke || '#8f8a92');
        }
        g.globalAlpha = 1;
        // 岸邊的硫磺階地：這個釣點唯一的亮色，縮圖裡是最快的識別線索
        for (let k = 0; k < 3; k++) fill(0, hz - 2 * S + k * S, W, S, FG.mix(P.sulfur || '#e0c85f', '#ffffff', k / 5));
        break;
      }

      case 'rapids': {
        // 卵石堆 + 一小段跌水。真正的招牌（斜向流線與尾流）在水面那一段，見下方
        fill(0, hz - 6 * S, W, 6 * S + 2, P.farTree);
        for (let i = 0; i < 14; i++) {
          const cx = R() * W, cy = hz - 1 - R() * 4 * S, r = (1.6 + R() * 3) * S;
          for (let dy = -r; dy <= r; dy++) {
            const half = Math.sqrt(Math.max(0, r * r - dy * dy));
            fill(cx - half, cy + dy, half * 2, 1, dy < -r * 0.3 ? FG.shade(P.nearTree, 0.3) : P.nearTree);
          }
        }
        for (let i = 0; i < 5; i++) {
          const cx = R() * W, r = (1.2 + R() * 1.6) * S;
          for (let dy = -r; dy <= r; dy++) {
            const half = Math.sqrt(Math.max(0, r * r - dy * dy));
            fill(cx - half, hz - 6 * S + dy, half * 2, 1, P.alder || '#4a6a44');
          }
        }
        fill(W * 0.34, hz - 5 * S, 2 * S, 5 * S, P.foam || '#f4fafa');
        break;
      }

      case 'reef': {
        // 低平沙洲。礁與碎浪線是招牌，但它們都在水裡，畫在水面漸層之後
        for (let x = 0; x < W; x++) {
          const h = 2.4 * S + Math.sin(x * 0.1) * S * 0.6;
          fill(x, hz - h, 1, h + 2, P.midTree);
          fill(x, hz - h, 1, 1, FG.shade(P.sand || '#eae0c4', 0.1));
        }
        for (let i = 0; i < 5; i++) {
          const cx = R() * W, r = (1 + R() * 1.5) * S;
          for (let dy = -r; dy <= r; dy++) {
            const half = Math.sqrt(Math.max(0, r * r - dy * dy));
            fill(cx - half, hz - 3 * S + dy, half * 2, 1, P.nearTree);
          }
        }
        break;
      }

      case 'cavern': {
        // 岩頂 + 倒垂的鐘乳石 + 中央一個亮口。三樣缺一不可：
        // 少了鐘乳石就是一個山洞剪影，少了亮口整格是黑的
        fill(0, 0, W, hz, P.farTree);
        const mw = W * 0.16, mx = W * 0.5, mh = hz * 0.72;
        for (let y = hz - mh; y < hz; y++) {
          const t = (hz - y) / mh;
          const half = t < 0.6 ? mw : mw * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.6) / 0.4, 2)));
          if (half < 1) continue;
          g.fillStyle = FG.mix(P.sky[1], P.sky[P.sky.length - 1], 1 - t);
          g.fillRect(Math.round(mx - half), y, Math.round(half * 2), 1);
        }
        for (let i = 0; i < 16; i++) {
          const cx = R() * W, h = (1.5 + Math.pow(R(), 1.5) * 7) * S;
          const w = Math.max(1, h * 0.28);
          for (let k = 0; k < h; k++) {
            const ww = Math.max(1, w * (1 - k / h));
            fill(cx - ww / 2, k, ww, 1, k < h * 0.3 ? (P.stalacLit || '#8f877a') : (P.stalac || '#5f5a52'));
          }
        }
        for (let x = 0; x < W; x++) {
          const d = Math.min(x / (W * 0.3), (W - 1 - x) / (W * 0.3));
          if (d > 1) continue;
          const h = hz * 0.7 * Math.pow(1 - d, 1.3);
          fill(x, hz - h, 1, h, P.nearTree);
        }
        break;
      }

      case 'wreck': {
        // 一顆大日盤 ＋ 一段傾斜的船身剪影 ＋ 駕駛台方塊。三樣缺一不可：
        // 少了日盤這一格只是一片黑，少了傾斜的甲板線就只是一排倉庫
        const scx = W * 0.62, scy = hz * 0.62, sr = hz * 0.5;
        for (let dy = -sr; dy <= sr; dy++) {
          const half = Math.sqrt(Math.max(0, sr * sr - dy * dy));
          const y = scy + dy;
          if (y < 0 || y >= hz) continue;
          fill(scx - half, y, half * 2, 1, FG.mix(P.sun || '#ffe6a8', FG.shade(P.sun || '#ffe6a8', -0.3), Math.abs(dy) / sr));
        }
        for (let x = 0; x < W; x++) fill(x, hz - 2 * S, 1, 2 * S + 2, P.farTree);
        const hx0 = W * 0.18, hx1 = W * 0.94;
        for (let x = hx0; x < hx1; x++) {
          const dy = hz - 3 * S - (x - hx0) * 0.06;
          fill(x, dy, 1, hz - dy, P.hull || '#1f1a22');
          fill(x, dy, 1, 1, P.hullLit || '#ffc478');
        }
        fill(W * 0.46, hz - 9 * S, 8 * S, 6 * S, P.hull || '#1f1a22');          // 駕駛台
        fill(W * 0.46, hz - 9 * S, 8 * S, 1, P.hullLit || '#ffc478');
        fill(W * 0.30, hz - 12 * S, S, 9 * S, P.crane || '#15121c');            // 前桅
        break;
      }

      default:
        for (let i = 0; i < 40; i++) {
          const x = Math.floor(R() * W), hgt = 4 + R() * 8;
          g.fillStyle = R() < 0.2 ? (P.accent ? P.accent[0] : P.midTree) : P.midTree;
          for (let k = 0; k < hgt; k++) {
            const ww = Math.max(1, Math.round(hgt * 0.4 * (k / hgt)));
            g.fillRect(x - Math.floor(ww / 2), hz - hgt + k, ww, 1);
          }
        }
    }

    for (let y = hz; y < H; y++) {
      g.fillStyle = FG.mix(P.waterTop, P.waterBot, (y - hz) / (H - hz));
      g.fillRect(0, y, W, 1);
    }

    // 潮間帶的招牌在水面上：灘地 + 積水潭。必須畫在水面漸層之後才不會被蓋掉
    if (P.terrain === 'tidal') {
      const edge = function (x) { return hz + (H - hz) * 0.52 + Math.sin(x * 0.14) * 2.5 * S; };
      for (let x = 0; x < W; x++) {
        fill(x, hz, 1, edge(x) - hz, P.wet || '#9c907a');
        fill(x, edge(x) - 1, 1, 1, FG.shade(P.wet || '#9c907a', -0.3));
      }
      for (let k = 0; k < 4; k++) {
        for (let x = 0; x < W; x++) fill(x, hz + (1.5 + k * 2.2) * S + Math.sin(x * 0.2) * S, 1, 1, FG.shade(P.sand || '#cfc0a4', 0.2));
      }
      for (let i = 0; i < 9; i++) {
        const x = R() * W, y = hz + R() * ((H - hz) * 0.42);
        const rw = (1 + R() * 2) * S;
        fill(x - rw, y, rw * 2, Math.max(1, rw * 0.6), P.pool || '#6fb4c0');
      }
    }

    // 湍瀨的招牌在水面：斜向流線 + 石頭的 V 字尾流 + 前景巨石
    if (P.terrain === 'rapids') {
      const fm = P.foam || '#f4fafa';
      g.globalAlpha = 0.5;
      for (let i = 0; i < 26; i++) {
        const sx = R() * W, sy = hz + R() * (H - hz), len = (2 + R() * 5) * S;
        const spread = (sx - W / 2) / (W / 2) * 0.5;
        for (let k = 0; k < len; k++) fill(sx + spread * k, sy + k, 1, 1, P.flow || '#cfe8ec');
      }
      g.globalAlpha = 1;
      for (let i = 0; i < 4; i++) {
        const cx = R() * W, cy = hz + (2 + R() * 5) * S, r = (1.4 + R() * 2) * S;
        for (let dy = -r; dy <= r; dy++) {
          const half = Math.sqrt(Math.max(0, r * r - dy * dy)) * 1.5;
          fill(cx - half, cy + dy, half * 2, 1, dy < -r * 0.3 ? FG.shade(P.nearTree, 0.3) : P.nearTree);
        }
        g.globalAlpha = 0.6;
        for (let k = 0; k < 5 * S; k++) {
          fill(cx - r * 1.2 - k * 0.4, cy + r + k * 0.7, 1, 1, fm);
          fill(cx + r * 1.2 + k * 0.4, cy + r + k * 0.7, 1, 1, fm);
        }
        g.globalAlpha = 1;
      }
      const fore = P.fore || '#2e3330';
      [[W * 0.06, H + S, W * 0.22, 5 * S], [W * 0.94, H + 1.5 * S, W * 0.26, 6 * S]].forEach(function (f) {
        for (let dy = -f[3]; dy <= 0; dy++) {
          const half = Math.sqrt(Math.max(0, 1 - (dy / (f[3] + 1)) * (dy / (f[3] + 1)))) * f[2];
          if (f[1] + dy >= H) continue;
          fill(f[0] - half, f[1] + dy, half * 2, 1, fore);
        }
      });
    }

    // 珊瑚礁的招牌在水面下：碎浪線 + 側視的彩色礁體
    if (P.terrain === 'reef') {
      const sy = hz + 3 * S;
      g.globalAlpha = 0.85;
      for (let x = 0; x < W; x++) fill(x, sy + Math.sin(x * 0.16) * S * 0.6, 1, Math.max(1, S * 0.8), P.surf || '#ffffff');
      g.globalAlpha = 1;
      const cs = P.coral || ['#e85f8f', '#f0913a', '#8f5fd8', '#3fc0a8', '#4a7fe0', '#e8d04a'];
      g.globalAlpha = 0.5;
      for (let y = sy + S; y < H; y++) fill(0, y, W, 1, P.sand || '#eae0c4');
      g.globalAlpha = 1;
      for (let i = 0; i < 22; i++) {
        const cx = R() * W, base = sy + (1.5 + R() * 7) * S, hgt = (1.5 + R() * 4) * S;
        const c = cs[Math.floor(R() * cs.length)];
        if (R() < 0.45) {                                        // 分枝
          fill(cx - 0.5 * S, base - hgt, Math.max(1, S), hgt, c);
          fill(cx - 1.6 * S, base - hgt * 0.8, Math.max(1, S), hgt * 0.8, c);
          fill(cx + 0.8 * S, base - hgt * 0.7, Math.max(1, S), hgt * 0.7, c);
        } else {                                                 // 球／桌
          const r = hgt * 0.7;
          for (let dy = -r; dy <= 0; dy++) {
            const half = Math.sqrt(Math.max(0, r * r - dy * dy));
            fill(cx - half, base + dy, half * 2, 1, dy < -r * 0.5 ? FG.shade(c, 0.25) : c);
          }
        }
      }
      for (let i = 0; i < 3; i++) {                              // 礁洞
        const cx = R() * W, cy = sy + (4 + R() * 5) * S, r = (0.8 + R() * 1.2) * S;
        fill(cx - r - 1, cy - r, r * 2 + 2, r * 2, FG.shade(P.sand || '#eae0c4', -0.3));
        fill(cx - r, cy - r, r * 2, r * 2, P.cave || '#141d24');
      }
    }

    // 洞穴的招牌在水面：兩側夾進來的岩壁 + 洞口漏下來的那道光
    if (P.terrain === 'cavern') {
      for (let y = hz; y < H; y++) {
        const t = (y - hz) / (H - hz);
        fill(0, y, W * (0.12 + t * 0.2), 1, FG.shade(P.nearTree, 0.06 - t * 0.3));
        fill(W * (1 - (0.16 + t * 0.24)), y, W * (0.16 + t * 0.24), 1, FG.shade(P.nearTree, -t * 0.3));
      }
      for (let y = hz; y < H; y++) {
        const t = (y - hz) / (H - hz);
        g.globalAlpha = 0.34 * (1 - t * 0.7);
        fill(W * 0.5 - (2 + t * 6) * S, y, (4 + t * 12) * S, 1, P.highlight || '#a8f0f0');
      }
      g.globalAlpha = 1;
    }

    // 沉港的招牌有一半在水裡：水線的船底漆紅 + 水下船身 + 日照光路
    if (P.terrain === 'wreck') {
      const hx0 = W * 0.18, hx1 = W * 1.0;
      for (let k = 0; k < (H - hz) * 0.7; k++) {
        const t = k / ((H - hz) * 0.7);
        const inset = Math.pow(t, 2.2) * (W * 0.3);
        const a = hx0 + inset * 0.55, b = hx1 - inset;
        if (b <= a) break;
        fill(a, hz + k, b - a, 1, k < Math.max(1, S) ? (P.redlead || '#a4432a') : FG.shade(P.hull || '#1f1a22', 0.1 - t * 0.5));
      }
      for (let y = hz; y < H; y++) {
        const t = (y - hz) / (H - hz);
        for (let i = 0; i < 3; i++) {
          g.globalAlpha = 0.5 * (1 - t * 0.5) * (1 - R() * 0.6);
          fill(W * 0.62 + (R() * 2 - 1) * (2 + t * 14) * S, y, 1 + R() * 2 * S, 1, P.highlight || '#ffdca0');
        }
      }
      g.globalAlpha = 1;
    }

    // 神域的縮圖補一座鳥居——它是這個釣點最好認的招牌
    if (P.terrain === 'shrine') {
      const cx = W * 0.5, ty2 = hz + 2 * S, hh = 9 * S, red = P.torii || '#c8442f';
      fill(cx - 6 * S, ty2, 12 * S, S, FG.shade(red, -0.3));
      fill(cx - 5 * S, ty2 + S, 10 * S, S, red);
      fill(cx - 4 * S, ty2 + 3.5 * S, 8 * S, S, red);
      fill(cx - 3.4 * S, ty2 + S, 1.4 * S, hh, red);
      fill(cx + 2 * S, ty2 + S, 1.4 * S, hh, red);
    }

    for (let i = 0; i < 40; i++) {
      const y = hz + 2 + R() * (H - hz - 3);
      g.fillStyle = P.highlight;
      g.globalAlpha = 0.7;
      g.fillRect(Math.floor(R() * W), Math.floor(y), 1 + Math.floor(R() * 4), 1);
    }
    g.globalAlpha = 1;
    return cv;
  };

  /* ============================================================
     家園房間
     ============================================================ */

  const ROOM_W = 200, ROOM_H = 150;
  px.roomSize = { w: ROOM_W, h: ROOM_H };

  px.drawRoom = function (g, st) {
    const W = ROOM_W, H = ROOM_H;
    const time = st.time || 0;
    const level = st.tankLevel || 1;
    const deco = st.deco || {};
    g.imageSmoothingEnabled = false;

    function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

    const floorY = H - 38;

    // 牆
    rect(0, 0, W, floorY, '#3a3242');
    for (let x = 0; x < W; x += 8) rect(x, 0, 3, floorY, '#413848');
    rect(0, floorY - 5, W, 5, '#2b2530');
    // 地板
    rect(0, floorY, W, H - floorY, '#6b4a30');
    for (let y = floorY; y < H; y += 6) rect(0, y, W, 1, '#5a3d27');
    for (let x = 0; x < W; x += 14) rect(x, floorY, 1, H - floorY, '#5a3d27');

    // 窗戶（看得到湖景）
    rect(146, 14, 44, 34, '#241f2b');
    rect(148, 16, 40, 30, '#7fb2cf');
    rect(148, 30, 40, 16, '#5a86a8');
    for (let i = 0; i < 10; i++) rect(150 + (i * 7) % 34, 33 + (i * 3) % 12, 3, 1, '#dceef7');
    rect(167, 16, 2, 30, '#241f2b');
    rect(148, 30, 40, 2, '#241f2b');

    // 牆上掛畫（目前釣點的風景）
    if (st.poster) {
      const pw = st.poster.width, ph = st.poster.height;
      const pxx = 112, pyy = 54;
      rect(pxx - 3, pyy - 3, pw + 6, ph + 6, '#6b4a2c');
      rect(pxx - 2, pyy - 2, pw + 4, ph + 4, '#8a6238');
      rect(pxx - 1, pyy - 1, pw + 2, ph + 2, '#2a1e14');
      g.drawImage(st.poster, pxx, pyy);
      g.globalAlpha = 0.1;
      rect(pxx, pyy, pw, Math.round(ph / 2), '#ffffff');
      g.globalAlpha = 1;
    }

    // 壁掛（獎盃架）
    if (deco.trophy) {
      rect(96, 16, 40, 4, '#7a5a38');
      for (let i = 0; i < 3; i++) {
        rect(102 + i * 12, 8, 6, 8, '#e0b64a');
        rect(103 + i * 12, 6, 4, 2, '#f5db8a');
      }
    }

    // 魚缸（等級決定尺寸）
    const tw = 76 + (level - 1) * 12;
    const th = 52 + (level - 1) * 5;
    const tx = 12, ty = floorY - th - 12;
    rect(tx + 4, ty + th + 2, tw - 8, 10, '#4a3320');           // 缸架
    rect(tx + 2, ty + th + 10, 6, 6, '#3a2718');
    rect(tx + tw - 8, ty + th + 10, 6, 6, '#3a2718');
    rect(tx, ty, tw, th, '#123244');                             // 水
    for (let y = 0; y < th; y++) rect(tx, ty + y, tw, 1, FG.mix('#1b4f68', '#0e2a3a', y / th));
    // 缸內光紋
    for (let i = 0; i < 16; i++) {
      const yy = ty + 3 + ((i * 5 + Math.floor(time * 0.01)) % (th - 6));
      g.globalAlpha = 0.16;
      rect(tx + 2 + (i * 7) % (tw - 8), yy, 4, 1, '#bfeaff');
      g.globalAlpha = 1;
    }
    // 底砂與水草
    rect(tx, ty + th - 6, tw, 6, '#3d3a2c');
    for (let i = 0; i < Math.round(tw / 10); i++) {
      const gx = tx + 5 + i * 10;
      const gh = 8 + ((i * 37) % 9);
      for (let k = 0; k < gh; k++) {
        rect(gx + Math.round(Math.sin(k * 0.5 + time * 0.002 + i) * 1.5), ty + th - 6 - k, 1, 1, '#3f8a4d');
      }
    }
    // 玻璃外框
    rect(tx - 2, ty - 2, tw + 4, 2, '#c8d6de');
    rect(tx - 2, ty + th, tw + 4, 2, '#8fa2ad');
    rect(tx - 2, ty - 2, 2, th + 4, '#c8d6de');
    rect(tx + tw, ty - 2, 2, th + 4, '#8fa2ad');
    g.globalAlpha = 0.12;
    rect(tx, ty, tw, 6, '#ffffff');
    g.globalAlpha = 1;

    // 裝飾品
    if (deco.rug) {
      rect(104, floorY + 8, 60, 16, '#8c4a4a');
      rect(108, floorY + 11, 52, 10, '#a95c58');
      rect(116, floorY + 13, 36, 6, '#c9807a');
    }
    if (deco.plant) {
      rect(178, floorY - 14, 12, 16, '#8a5a3a');
      rect(180, floorY - 16, 8, 3, '#a5714a');
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        rect(184 + Math.cos(a) * 8, floorY - 22 + Math.sin(a) * 7, 3, 3, i % 3 ? '#3f8a4d' : '#57a95c');
      }
      rect(183, floorY - 26, 3, 10, '#2f6b3a');
    }
    if (deco.lamp) {
      rect(92, 0, 3, 24, '#3a3038');
      rect(84, 24, 19, 3, '#c9a24a');
      rect(86, 27, 15, 4, '#f2d98a');
      g.globalAlpha = 0.13;
      for (let i = 0; i < 26; i++) rect(93 - i * 0.8, 31 + i, 4 + i * 1.6, 1, '#ffe9a8');
      g.globalAlpha = 1;
    }
    if (deco.neon) {
      const on = Math.sin(time * 0.004) > -0.6;
      const c = on ? '#59d8ff' : '#2a5566';
      rect(104, 54, 30, 2, c);
      rect(104, 54, 2, 12, c);
      rect(132, 54, 2, 12, c);
      rect(104, 64, 30, 2, c);
      if (on) { g.globalAlpha = 0.12; rect(98, 48, 42, 24, '#59d8ff'); g.globalAlpha = 1; }
    }
    if (deco.sarco) {
      // 彩繪石棺：靠牆立著。上寬下窄的梯形外框 + 交叉的裹布帶 + 頂端的面具臉，
      // 面具是識別重點——少了它就只是一塊直立的木板
      const sx = 14, sy = floorY - 46, sw = 18, sh = 48;
      rect(sx, sy, sw, sh, '#b8934a');
      rect(sx, sy, 2, sh, '#d8b46a');
      rect(sx + sw - 2, sy, 2, sh, '#8a6a2a');
      rect(sx + 2, sy + 2, sw - 4, 12, '#2f3a58');            // 頭冠底色
      rect(sx + 5, sy + 5, 3, 2, '#f2e8c8');                  // 眼
      rect(sx + 10, sy + 5, 3, 2, '#f2e8c8');
      rect(sx + 6, sy + 9, 6, 2, '#c8a04a');                  // 口／假鬍
      for (let i = 0; i < 4; i++) {                           // 裹布帶
        rect(sx + 2, sy + 18 + i * 7, sw - 4, 2, '#2f3a58');
        rect(sx + 2, sy + 21 + i * 7, sw - 4, 1, '#c8a04a');
      }
    }
    if (deco.shishi) {
      // 竹添水：識別重點是**傾斜的竹筒**與底下那顆承石。竹筒會週期性地倒水再彈回，
      // 靜態的話跟一根斜靠在牆邊的棍子分不出來——這件裝飾的價值全在那個動作
      const sx = 60, sy = floorY - 4;
      const tip = Math.sin(time * 0.0011) > 0.82 ? 5 : 0;      // 大部分時間蓄水，短暫傾倒
      rect(sx - 2, sy - 14, 4, 14, '#6b5a34');                 // 立柱
      for (let k = 0; k < 14; k++) {
        rect(sx + k, sy - 14 + tip - Math.round(k * 0.28), 2, 2, k > 9 ? '#8fa04a' : '#a8b45f');
      }
      rect(sx + 12, sy - 12 + tip, 4, 3, '#7a8a3a');           // 竹筒開口
      rect(sx + 8, sy - 3, 12, 4, '#7f7a70');                  // 承石
      rect(sx + 8, sy - 3, 12, 1, '#9a958a');
      if (tip) for (let k = 0; k < 6; k++) rect(sx + 14, sy - 9 + k, 1, 1, '#bfe4f2');   // 落下的水
    }
    if (deco.shellrack) {
      // 貝殼標本架：三層層板，每層擺不同形狀的貝。**形狀要各不相同**——
      // 全部畫成半圓的話只是三排小丘，讀不出是「收集品」
      const rx = 96, ry = 12;
      for (let i = 0; i < 3; i++) rect(rx, ry + i * 11, 34, 2, '#7a5a38');
      const forms = ['#e8dcc0', '#d8b8a0', '#c8ccd8'];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const cx = rx + 4 + j * 11, cy = ry + i * 11 - 1;
          const c = forms[(i + j) % 3];
          if ((i + j) % 3 === 0) { rect(cx, cy - 4, 6, 5, c); rect(cx + 1, cy - 6, 4, 2, c); }        // 塔螺
          else if ((i + j) % 3 === 1) { rect(cx, cy - 3, 7, 4, c); rect(cx + 2, cy - 5, 3, 2, c); }   // 扇貝
          else { rect(cx + 1, cy - 4, 4, 5, c); rect(cx, cy - 2, 6, 3, c); }                          // 芋螺
        }
      }
    }
    if (deco.cascade) {
      // 循環水景：一道**會動的**細瀑從上盆流到下盆。水柱的橫紋每幀往下捲，
      // 這是「循環」唯一看得出來的地方，靜態的話只是兩個盆子中間一條白線
      const cx2 = 176, cy2 = floorY - 34;
      rect(cx2 - 10, cy2, 20, 5, '#6f6a60');                   // 上盆
      rect(cx2 - 10, cy2, 20, 1, '#8f8a80');
      rect(cx2 - 13, cy2 + 30, 26, 6, '#6f6a60');              // 下盆
      rect(cx2 - 13, cy2 + 30, 26, 1, '#8f8a80');
      for (let k = 0; k < 30; k++) {
        const phase = (k + Math.floor(time * 0.03)) % 5;
        rect(cx2 - 2, cy2 + 5 + k, 4, 1, phase === 0 ? '#9fd8e8' : '#dff2f8');
      }
      rect(cx2 - 8, cy2 + 30, 16, 2, '#bfe4f2');               // 下盆的水面
      for (let i = 0; i < 3; i++) rect(cx2 - 6 + i * 5, cy2 + 28 - (i % 2), 2, 2, '#dff2f8');  // 濺起的水花
    }
    if (deco.onsen) {
      // 檜木泡湯桶：桶要有**桶箍**（兩道深色橫帶）才讀得出是木桶而不是水桶，
      // 桶口冒的汽是它跟「盆栽」分開的地方
      const ox = 34, oy = floorY - 20;
      rect(ox, oy, 26, 20, '#c8a46a');
      rect(ox, oy, 26, 2, '#e0c48f');
      for (let x = ox; x < ox + 26; x += 4) rect(x, oy + 2, 1, 18, '#a8895a');   // 木板縫
      rect(ox - 1, oy + 5, 28, 2, '#7f6438');                                    // 桶箍
      rect(ox - 1, oy + 14, 28, 2, '#7f6438');
      rect(ox + 2, oy + 2, 22, 3, '#9fd0d8');                                    // 湯面
      for (let k = 0; k < 12; k++) {
        g.globalAlpha = 0.16 * (1 - k / 12);
        rect(ox + 6 + Math.sin(k * 0.5 + time * 0.002) * 3, oy - k, 8, 1, '#eef4f6');
        rect(ox + 15 + Math.sin(k * 0.4 + time * 0.0016 + 2) * 3, oy - k, 6, 1, '#eef4f6');
      }
      g.globalAlpha = 1;
    }
    if (deco.flybox) {
      // 毛鉤標本盒：攤開的木盒 + 兩排插著的毛鉤。**每個毛鉤要有不同的顏色與大小**——
      // 一排同色同大小的小點會被讀成螺絲或釘子，差異本身就是「這是收藏」的訊號
      const fx = 8, fy = 18;
      rect(fx, fy, 30, 20, '#6b4f30');
      rect(fx, fy, 30, 1, '#8f6c44');
      rect(fx + 1, fy + 1, 28, 18, '#2f2a24');
      rect(fx + 15, fy + 1, 1, 18, '#6b4f30');                 // 中間的合頁
      const fc = ['#c85f4a', '#e0c04a', '#5f9ad8', '#8fc85f', '#d88fb0', '#e8e4d8'];
      for (let i = 0; i < 12; i++) {
        const cx = fx + 3 + (i % 6) * 5, cy = fy + 5 + Math.floor(i / 6) * 8;
        rect(cx, cy, 1, 3 + (i % 3), '#b8b4a8');               // 鉤柄
        rect(cx - 1, cy - 2, 3, 3, fc[i % fc.length]);         // 綁的毛
      }
    }
    if (deco.floats) {
      // 玻璃浮球串：三顆**大小不同**的球疊在左下牆角。等大的三顆會被讀成一串珠子，
      // 大小差異加上麻繩網才是浮球。
      // ⚠️ 網格線一定要**裁進圓裡**（每一列只畫該列的弦長）。初版直接畫 r*2 的
      //    整條橫線與豎線，三顆球全變成方塊——圓形被自己的網格蓋掉了。
      // 位置在地板左下角：魚缸（x 12～136、上緣 y 28）與窗戶（x 146～190）
      // 把牆面佔滿了，掛在牆上一定會疊到其中一個
      [[14, 142, 7], [17, 128, 5], [12, 117, 4]].forEach(function (b) {
        const cx = b[0], cy = b[1], r = b[2];
        for (let dy = -r; dy <= r; dy++) {
          const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
          rect(cx - half, cy + dy, half * 2 + 1, 1, dy < -r * 0.4 ? '#bfe4e8' : '#7fb8bf');
          if (((dy + r) % 4) === 0) rect(cx - half, cy + dy, half * 2 + 1, 1, '#8a7a5c');   // 橫向網繩
        }
        for (let k = -r; k <= r; k += 4) {                     // 縱向網繩：同樣要裁進圓裡
          const h = Math.floor(Math.sqrt(Math.max(0, r * r - k * k)));
          rect(cx + k, cy - h, 1, h * 2 + 1, '#8a7a5c');
        }
        rect(cx - Math.round(r * 0.5), cy - Math.round(r * 0.6), 2, 2, '#eefaff');          // 玻璃的點高光
      });
    }
    if (deco.driplamp) {
      // 鐘乳石燈：倒吊的錐 + 內部透光。末端每隔一陣子凝一滴水掉下去——
      // 那滴水是它跟「一盞吊燈」唯一的差別，所以**必須會動**
      const dx = 118, dh = 26;
      for (let k = 0; k < dh; k++) {
        const w = Math.max(1, 9 * Math.pow(1 - k / dh, 0.7));
        rect(dx - w / 2, k, w, 1, k % 5 === 2 ? '#57503f' : '#7a705c');
        if (k > dh * 0.45) rect(dx - w / 2, k, Math.max(1, w * 0.4), 1, '#e0c88f');   // 透出來的光
      }
      const phase = (time * 0.0016) % 1;
      if (phase < 0.55) rect(dx, dh + phase * 30, 1, 2, '#cfeef8');                   // 落下的那一滴
      rect(dx - 1, dh - 1, 3, 2, '#f0e0a8');
      for (let k = 0; k < 5; k++) {                                                   // 燈暈
        g.globalAlpha = 0.09 * (1 - k / 5);
        rect(dx - 4 - k, dh - 4 - k, 9 + k * 2, 9 + k * 2, '#f0e0a8');
      }
      g.globalAlpha = 1;
    }
    if (deco.beacon) {
      // 船首航標燈：吊在天花板上。**那道週期性掃過房間的光是它的識別**——
      // 靜態的話它只是一盞菱形玻璃的怪吊燈（同 shishi / cascade / onsen / driplamp，
      // 這類「靠動作定義的物件」動畫是必要條件而不是加分項）。
      // 位置在天花板 x 50～78：牆面被魚缸（x 12～136、上緣 y 28）與窗戶佔滿了
      const bx = 64;
      rect(bx - 1, 0, 3, 6, '#3a3a44');                        // 吊桿
      rect(bx - 9, 6, 19, 3, '#5a5a66');                        // 上蓋
      rect(bx - 8, 9, 17, 10, '#2a2a34');                       // 燈室底色
      for (let i = 0; i < 4; i++) {                             // 菱形玻璃格（透鏡）
        rect(bx - 7 + i * 4, 10, 3, 8, i % 2 ? '#a8c8d0' : '#dff0f4');
        rect(bx - 7 + i * 4, 13, 3, 2, '#8fb0b8');
      }
      rect(bx - 9, 19, 19, 3, '#5a5a66');                        // 下座
      rect(bx - 4, 22, 9, 2, '#3a3a44');
      // 掃過去的光：一道往下張開的扇形，角度隨時間繞一圈
      const a = (time * 0.0009) % (Math.PI * 2);
      const dir = Math.sin(a);
      for (let k = 0; k < 46; k++) {
        g.globalAlpha = 0.11 * (1 - k / 46);
        const w = 4 + k * 0.5;
        rect(bx + dir * k * 1.6 - w / 2, 14 + k, w, 1, '#ffe9b8');
      }
      g.globalAlpha = 1;
      rect(bx - 1 + dir * 6, 13, 3, 3, '#fff4d0');               // 燈絲的亮點跟著轉
    }
    if (deco.cat) {
      const wave = Math.sin(time * 0.005) > 0 ? 0 : 1;
      const cx = 168, cy = floorY - 20;
      rect(cx, cy + 6, 14, 14, '#f2ece2');
      rect(cx + 2, cy, 10, 8, '#f2ece2');
      rect(cx + 1, cy - 2, 3, 3, '#f2ece2');
      rect(cx + 10, cy - 2, 3, 3, '#f2ece2');
      rect(cx + 4, cy + 3, 2, 2, '#2a2a2a');
      rect(cx + 8, cy + 3, 2, 2, '#2a2a2a');
      rect(cx + 13, cy + 2 + wave * 4, 3, 5, '#f2ece2');
      rect(cx + 3, cy + 12, 8, 5, '#d8a53a');
    }

    // 睡覺的水豚
    px.drawMap(g, CAPY.map, CAPY.pal, 126, floorY - 2, 1);
    if (Math.sin(time * 0.0012) > 0) {
      g.fillStyle = '#cfe0ea';
      g.fillRect(142, floorY - 8, 2, 2);
      g.fillRect(145, floorY - 12, 3, 3);
    }

    return { tank: { x: tx, y: ty, w: tw, h: th } };
  };

})(window.FG);
