/* ============================================================
   data.js — 遊戲資料表
   新增地點只要往 LOCATIONS 加一筆（含 scene 調色盤與 fish 清單）即可，
   其餘系統（場景繪製、圖鑑、抽獎、費率表）都會自動吃到。
   ============================================================ */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  /* ---------------- 稀有度 ---------------- */
  // weight：基礎權重（總和 1000，方便換算成百分比）
  FG.RARITY = {
    junk:   { key: 'junk',   name: '雜物', color: '#8b8f96', weight: 90,  order: 0 },
    common: { key: 'common', name: '普通', color: '#c8d3dd', weight: 520, order: 1 },
    good:   { key: 'good',   name: '優良', color: '#5fd08a', weight: 260, order: 2 },
    rare:   { key: 'rare',   name: '稀有', color: '#59a6ff', weight: 90,  order: 3 },
    epic:   { key: 'epic',   name: '史詩', color: '#b775ff', weight: 30,  order: 4 },
    legend: { key: 'legend', name: '傳說', color: '#ffc44d', weight: 8,   order: 5 },
    king:   { key: 'king',   name: '魚王', color: '#ff5f6d', weight: 2,   order: 6 }
  };
  FG.RARITY_ORDER = ['junk', 'common', 'good', 'rare', 'epic', 'legend', 'king'];

  /* ============================================================
     地點一：晨霧湖
     ============================================================ */
  const MIST_LAKE_FISH = [
    /* --- 雜物 --- */
    { id: 'ml_boot',  name: '破舊長靴',   rarity: 'junk', junkArt: 'boot',   value: 12, minLen: 20, maxLen: 34, unit: 'cm', desc: '不知道被丟在湖裡幾年了，裡面還有水草。' },
    { id: 'ml_can',   name: '生鏽鐵罐',   rarity: 'junk', junkArt: 'can',    value: 8,  minLen: 8,  maxLen: 14, unit: 'cm', desc: '標籤早就爛光，回收價聊勝於無。' },
    { id: 'ml_weed',  name: '一團水草',   rarity: 'junk', junkArt: 'weed',   value: 5,  minLen: 15, maxLen: 40, unit: 'cm', desc: '重量十足，價值零蛋。' },

    /* --- 普通 --- */
    { id: 'ml_crucian', name: '銀鯽', rarity: 'common', shape: 'round', scale: .72, pattern: 'scale', value: 95, minLen: 12, maxLen: 28,
      colors: { body: '#b9c7d2', back: '#6e808f', belly: '#eef3f6', fin: '#8b9aa7', pattern: '#93a5b2' },
      desc: '晨霧湖最常見的魚，成群結隊在淺灘啄食。' },
    { id: 'ml_bluegill', name: '藍鰓太陽魚', rarity: 'common', shape: 'flat', scale: .68, pattern: 'stripe', value: 88, minLen: 10, maxLen: 22,
      colors: { body: '#5b8f8a', back: '#2f5f63', belly: '#e6c46a', fin: '#3f6f72', pattern: '#274f52' },
      desc: '鰓蓋有一抹靛藍，孩子們最愛的入門魚。' },
    { id: 'ml_loach', name: '溪石斑', rarity: 'common', shape: 'long', scale: .74, pattern: 'spot', value: 78, minLen: 8, maxLen: 20,
      colors: { body: '#9b8663', back: '#5f5039', belly: '#ded0b0', fin: '#7a6a4c', pattern: '#4a3d29' },
      desc: '貼著石縫游動，體色隨溪底變化。' },
    { id: 'ml_smallcarp', name: '小鯉魚', rarity: 'common', shape: 'normal', scale: .76, pattern: 'scale', value: 110, minLen: 14, maxLen: 30,
      colors: { body: '#a8945c', back: '#6a5a32', belly: '#e8dcae', fin: '#8a7742', pattern: '#7d6c3c' },
      desc: '長大以後會變成很有份量的傢伙。' },

    /* --- 優良 --- */
    { id: 'ml_trout', name: '虹鱒', rarity: 'good', shape: 'wide', scale: .84, pattern: 'spot', value: 300, minLen: 22, maxLen: 45,
      colors: { body: '#8fa9b4', back: '#4f6a76', belly: '#f0ece2', fin: '#6f8894', pattern: '#3b4d57' },
      desc: '側線泛著彩虹光澤，喜歡清冷的活水。' },
    { id: 'ml_bass', name: '黑鱸', rarity: 'good', shape: 'normal', scale: .9, pattern: 'band', value: 330, minLen: 25, maxLen: 50,
      colors: { body: '#6f8a56', back: '#3c5230', belly: '#dfe3c4', fin: '#4f6b3c', pattern: '#2b3d22' },
      desc: '掠食性強，咬餌的瞬間手感十足。' },
    { id: 'ml_whitefish', name: '湖白鮭', rarity: 'good', shape: 'long', scale: .86, pattern: 'none', value: 285, minLen: 20, maxLen: 42,
      colors: { body: '#c3d2dc', back: '#7d92a3', belly: '#f4f8fa', fin: '#9aacba' },
      desc: '在深水層洄游，霧氣最濃時才會上鉤。' },

    /* --- 稀有 --- */
    { id: 'ml_goldcarp', name: '金鱗鯉', rarity: 'rare', shape: 'normal', scale: 1.0, pattern: 'scale', value: 1200, minLen: 30, maxLen: 65,
      colors: { body: '#e0a83a', back: '#a3701c', belly: '#f6e0a2', fin: '#c58c26', pattern: '#b07d20' },
      desc: '傳說釣起牠的人整年順遂，湖畔老人都這麼說。' },
    { id: 'ml_pike', name: '霧紋梭子魚', rarity: 'rare', shape: 'long', scale: 1.0, pattern: 'band2', value: 1350, minLen: 40, maxLen: 85,
      colors: { body: '#6f8478', back: '#3b4d45', belly: '#d6ded4', fin: '#4d635a', pattern: '#8fa79a' },
      desc: '像一根沉在霧裡的槍，靜止時幾乎看不見。' },
    { id: 'ml_koi', name: '緋紋錦鯉', rarity: 'rare', shape: 'normal', scale: 1.0, pattern: 'spot', value: 1150, minLen: 28, maxLen: 60,
      colors: { body: '#f0ece6', back: '#c8bfb4', belly: '#ffffff', fin: '#ded6cc', pattern: '#d94f45' },
      desc: '不知從哪座庭園逃出來的，在野湖裡活得很好。' },

    /* --- 史詩 --- */
    { id: 'ml_eel', name: '月光鰻', rarity: 'epic', shape: 'long', scale: 1.06, pattern: 'speck', value: 5000, minLen: 60, maxLen: 130,
      special: ['glow'],
      colors: { body: '#5a4a86', back: '#2e2450', belly: '#c3b6e8', fin: '#463a68', pattern: '#cbb8ff', glow: '#a68cff' },
      desc: '只在滿月的夜裡浮上水面，鱗片會映出月色。' },
    { id: 'ml_sturgeon', name: '琉璃鱘', rarity: 'epic', shape: 'wide', scale: 1.1, pattern: 'net', value: 5600, minLen: 70, maxLen: 150,
      special: ['spike'],
      colors: { body: '#7fb3c4', back: '#3f6d80', belly: '#e2f2f6', fin: '#5b8ea0', pattern: '#a9dbe8' },
      desc: '背上的硬鱗排列如琉璃瓦，據說活了上百年。' },

    /* --- 傳說 --- */
    { id: 'ml_arowana', name: '霧紗龍魚', rarity: 'legend', shape: 'long', scale: 1.18, pattern: 'scale', value: 15000, minLen: 80, maxLen: 150,
      special: ['glow', 'whisker'],
      colors: { body: '#c9a6d8', back: '#6d4d86', belly: '#f2e6f7', fin: '#9c7cb5', pattern: '#e4c9f0', glow: '#e2b6ff' },
      legend: '晨霧最濃的那一刻，牠會貼著水面滑行，鱗片把霧氣切成一縷一縷的紗。老釣手說：看見霧紗龍魚的人，會忘記自己來湖邊做什麼。',
      desc: '傳說中撥開晨霧的長影。' },

    /* --- 魚王 --- */
    { id: 'ml_king_onde', name: '霧語巨鯰「翁德」', rarity: 'king', shape: 'wide', scale: 1.3, pattern: 'speck', value: 52000, minLen: 150, maxLen: 260,
      special: ['glow', 'whisker', 'scar'], cyOffset: 1,
      colors: { body: '#5f6b73', back: '#2f383f', belly: '#c2ccd2', fin: '#454f57', pattern: '#8d9aa2', glow: '#8fe6ff' },
      legend: '沒有人知道翁德在晨霧湖底待了多久。牠背上那道疤，是四十年前一位老釣手留下的——那天老人只帶回一根斷竿，說：「牠在水裡對我說話。」湖邊從此立了塊碑，寫著「不要回答牠」。',
      desc: '晨霧湖之王。體長可及兩人身高。' }
  ];

  /* ============================================================
     地點二：落霞峽灣（需以籌碼解鎖，示範多地點切換）
     ============================================================ */
  const FJORD_FISH = [
    { id: 'fj_bottle', name: '漂流玻璃瓶', rarity: 'junk', junkArt: 'bottle', value: 20, minLen: 12, maxLen: 24, unit: 'cm', desc: '裡面的紙條早就被海水泡爛了。' },
    { id: 'fj_can',    name: '海蝕鐵罐',   rarity: 'junk', junkArt: 'can',    value: 14, minLen: 8,  maxLen: 15, unit: 'cm', desc: '被浪打得凹凸不平。' },

    { id: 'fj_sardine', name: '霞光沙丁', rarity: 'common', shape: 'long', scale: .72, pattern: 'band', value: 160, minLen: 10, maxLen: 24,
      colors: { body: '#9fb8c6', back: '#4c6b7d', belly: '#f2f6f8', fin: '#7893a4', pattern: '#d8a45c' },
      desc: '夕陽下整群翻身時，海面像撒了一把金箔。' },
    { id: 'fj_goby', name: '岩礁鰕虎', rarity: 'common', shape: 'long', scale: .66, pattern: 'spot', value: 145, minLen: 8, maxLen: 18,
      colors: { body: '#a8846a', back: '#5f4433', belly: '#e6d6c2', fin: '#856248', pattern: '#3f2d20' },
      desc: '死守自己那一塊岩縫，兇得很。' },

    { id: 'fj_scorpion', name: '赤鮋', rarity: 'good', shape: 'flat', scale: .88, pattern: 'spot', value: 520, minLen: 18, maxLen: 38,
      special: ['spike'],
      colors: { body: '#c4553f', back: '#7d2c22', belly: '#f0c8a8', fin: '#9c3d2e', pattern: '#5e1f18' },
      desc: '鰭上有毒棘，處理時務必小心。' },
    { id: 'fj_mackerel', name: '條紋鯖', rarity: 'good', shape: 'wide', scale: .92, pattern: 'stripe', value: 560, minLen: 24, maxLen: 48,
      colors: { body: '#6d93a6', back: '#2f5265', belly: '#eef4f7', fin: '#4d7387', pattern: '#1f3a49' },
      desc: '速度極快，中鉤後會把線拉得筆直。' },

    { id: 'fj_seabream', name: '落日真鯛', rarity: 'rare', shape: 'flat', scale: 1.02, pattern: 'speck', value: 2100, minLen: 30, maxLen: 70,
      colors: { body: '#e08a86', back: '#a24a4c', belly: '#fbe3dc', fin: '#c26a68', pattern: '#7fb9d6' },
      desc: '峽灣落日時分才會靠岸，紅得像被夕陽染過。' },
    { id: 'fj_cutlass', name: '銀刀魚', rarity: 'rare', shape: 'long', scale: 1.14, pattern: 'none', value: 2300, minLen: 60, maxLen: 130,
      colors: { body: '#d6e2ea', back: '#8ea3b3', belly: '#ffffff', fin: '#b2c4d0' },
      desc: '像一把豎立的長刀，直挺挺地懸在水中。' },

    { id: 'fj_sailfish', name: '潮汐旗魚', rarity: 'epic', shape: 'wide', scale: 1.16, pattern: 'band', value: 9000, minLen: 120, maxLen: 250,
      special: ['spike'],
      colors: { body: '#3f6f9c', back: '#1e3c5c', belly: '#dfeaf2', fin: '#2c5580', pattern: '#79b6dd' },
      desc: '背鰭張開時像一面藍色的帆。' },

    { id: 'fj_ray', name: '霞光魟', rarity: 'legend', shape: 'ray', scale: 1.2, pattern: 'spot', value: 24000, minLen: 100, maxLen: 220,
      special: ['glow'],
      colors: { body: '#c98a5c', back: '#8a5030', belly: '#f6dcc0', fin: '#a86a42', pattern: '#ffd98a', glow: '#ffbf7a' },
      legend: '黃昏時牠會浮到水面下一尺處滑行，翼緣透著光，像有人在海裡點了一盞燈。漁民不捕牠——據說牠在替沉船的人引路。',
      desc: '峽灣的黃昏引路者。' },

    { id: 'fj_king_helio', name: '落日巨鮪「赫利歐」', rarity: 'king', shape: 'wide', scale: 1.34, pattern: 'band2', value: 96000, minLen: 200, maxLen: 340,
      special: ['glow', 'scar'],
      colors: { body: '#3d6b93', back: '#1b3450', belly: '#f0c66a', fin: '#2b5077', pattern: '#ffb347', glow: '#ffc861' },
      legend: '赫利歐每天只在太陽貼上海平面的那七分鐘出現。牠沿著霞光的邊界游，像在追那條逐漸熄滅的線。峽灣的老船長說，牠追了幾百年，一次都沒追上。',
      desc: '落霞峽灣之王。追逐夕陽的巨獸。' }
  ];

  /* ============================================================
     地點列表
     ============================================================ */
  FG.LOCATIONS = [
    {
      id: 'mist_lake',
      name: '晨霧湖',
      subtitle: '新手釣場 · 靜水',
      desc: '被赤楊與白樺圍繞的高原湖泊，清晨總是浮著一層薄霧。水面平靜，適合剛拿起釣竿的人。',
      seed: 20250803,
      castCost: 400,
      unlock: { free: true },
      scene: {
        horizon: 0.30,
        sky: ['#2f4a5e', '#4d6f7f', '#7d9aa2'],
        hill: '#3d5560',
        farTree: '#33534b',
        midTree: '#2c4a3f',
        nearTree: '#22392f',
        accent: ['#d9a441', '#c8722f', '#e0b95c'],
        accent2: ['#b8532a', '#d9a441'],
        shore: '#1b2c26',
        waterTop: '#4e7d9c',
        waterBot: '#79aecb',
        waterDeep: '#2f5c7e',
        highlight: '#eef7fb',
        highlight2: '#bcdcec',
        boat: '#5b3b2e', boatRim: '#7a5340', boatDark: '#3a271e'
      },
      fish: MIST_LAKE_FISH
    },
    {
      id: 'sunset_fjord',
      name: '落霞峽灣',
      subtitle: '進階釣場 · 鹹水',
      desc: '兩側崖壁夾著一道深海灣，黃昏時整片水面被染成金紅色。大魚多，成本也高。',
      seed: 77123,
      castCost: 1100,
      unlock: { chips: 120000 },
      scene: {
        horizon: 0.34,
        sky: ['#3a2a4a', '#8a4a52', '#e08a52', '#f2c06a'],
        hill: '#4a3145',
        farTree: '#3c2c3e',
        midTree: '#2e2130',
        nearTree: '#241a26',
        accent: ['#c9603a', '#e09a4a'],
        accent2: ['#8a3f30'],
        shore: '#1a1218',
        waterTop: '#6a4a62',
        waterBot: '#c9825a',
        waterDeep: '#3d2c46',
        highlight: '#ffe8c2',
        highlight2: '#ffb877',
        boat: '#4a3348', boatRim: '#6b4a5e', boatDark: '#2e2030'
      },
      fish: FJORD_FISH
    },
    {
      id: 'frost_lake',
      name: '幽藍冰湖',
      subtitle: '寒帶釣場 · 冰釣',
      desc: '終年不化的冰層下藏著透明的魚群。需要特製的破冰裝備。',
      seed: 30011, comingSoon: true, castCost: 3000,
      unlock: { chips: 800000 },
      scene: {
        horizon: 0.36,
        sky: ['#1e2a3e', '#3c5a78', '#9dc0d6'],
        hill: '#4a6a84',
        farTree: '#5b7c92', midTree: '#3f5e74', nearTree: '#2c4658',
        accent: ['#dfeef7'], shore: '#20323f',
        waterTop: '#2f5b78', waterBot: '#67a5c4', waterDeep: '#1d3d55',
        highlight: '#ffffff', highlight2: '#bfe4f7',
        boat: '#3f4a58', boatRim: '#5a6b7c', boatDark: '#2a323c'
      },
      fish: []
    },
    {
      id: 'abyss', name: '深淵海溝', subtitle: '深海釣場 · 未知',
      desc: '光線到不了的地方。那裡的東西，不一定能稱作「魚」。',
      seed: 66607, comingSoon: true, castCost: 12000,
      unlock: { chips: 5000000 },
      scene: {
        horizon: 0.22,
        sky: ['#050a12', '#0b1826', '#123048'],
        hill: '#0a1622',
        farTree: '#0d1c28', midTree: '#091520', nearTree: '#060f18',
        accent: ['#2f7f9c'], shore: '#04090f',
        waterTop: '#0a2033', waterBot: '#12405e', waterDeep: '#04101c',
        highlight: '#6fd8ff', highlight2: '#2f8fb8',
        boat: '#2a3038', boatRim: '#3f4750', boatDark: '#1a1e24'
      },
      fish: []
    }
  ];

  FG.locById = function (id) {
    for (let i = 0; i < FG.LOCATIONS.length; i++) if (FG.LOCATIONS[i].id === id) return FG.LOCATIONS[i];
    return FG.LOCATIONS[0];
  };
  FG.fishById = function (fid) {
    for (let i = 0; i < FG.LOCATIONS.length; i++) {
      const fl = FG.LOCATIONS[i].fish;
      for (let j = 0; j < fl.length; j++) if (fl[j].id === fid) return fl[j];
    }
    return null;
  };

  /* ============================================================
     商店：釣竿 / 餌料 / 裝備
     ============================================================ */

  FG.RODS = [
    { id: 'rod_bamboo', name: '竹製釣竿',   price: 0,      rareMul: 1.00, sizeBonus: 0,    kingMul: 1, desc: '祖父留下的舊竿子，堪用。' },
    { id: 'rod_glass',  name: '玻纖磯竿',   price: 2400,   rareMul: 1.15, sizeBonus: 0.05, kingMul: 1, desc: '韌性不錯，稀有魚上鉤率 +15%。' },
    { id: 'rod_carbon', name: '碳纖維遠投竿', price: 9800, rareMul: 1.35, sizeBonus: 0.12, kingMul: 1.2, desc: '輕又硬，能把餌拋到魚群正中央。' },
    { id: 'rod_mithril',name: '秘銀磯釣竿', price: 42000,  rareMul: 1.55, sizeBonus: 0.22, kingMul: 1.5, desc: '導環用秘銀打造，線出得順到不可思議。' },
    { id: 'rod_dragon', name: '龍骨釣竿',   price: 180000, rareMul: 1.80, sizeBonus: 0.35, kingMul: 2.0, desc: '取自某條不該被釣起的東西的脊骨。' }
  ];

  FG.BAITS = [
    { id: 'bait_bread', name: '麵包屑',     price: 25,   pack: 10, rareMul: 1.00, junkMul: 1.00, valueMul: 1.00, kingMul: 1, desc: '便宜、堪用、什麼都釣得到一點。' },
    { id: 'bait_worm',  name: '紅蚯蚓',     price: 70,   pack: 10, rareMul: 1.18, junkMul: 0.70, valueMul: 1.00, kingMul: 1, desc: '萬用活餌，雜物明顯變少。' },
    { id: 'bait_shrimp',name: '活蝦',       price: 200,  pack: 10, rareMul: 1.45, junkMul: 0.40, valueMul: 1.10, kingMul: 1.2, desc: '大魚最愛，賣價也跟著漂亮。' },
    { id: 'bait_lure',  name: '螢光假餌',   price: 380,  pack: 10, rareMul: 1.70, junkMul: 0.15, valueMul: 1.10, kingMul: 1.4, desc: '在暗處會發光，專門激怒掠食者。' },
    { id: 'bait_king',  name: '魚王秘餌',   price: 900,  pack: 5,  rareMul: 1.90, junkMul: 0.00, valueMul: 1.20, kingMul: 3.0, desc: '配方不明。魚王等級的傢伙聞到就會失去理智。' }
  ];

  FG.EQUIPS = [
    { id: 'eq_hat',    name: '漁夫帽',     price: 4000,   effect: { valueMul: 1.10 }, desc: '賣魚價格 +10%。看起來也比較像樣。' },
    { id: 'eq_vest',   name: '防水背心',   price: 11000,  effect: { costMul: 0.85 },  desc: '拋竿費用 −15%。' },
    { id: 'eq_basket', name: '大型魚簍',   price: 7000,   effect: { sizeBonus: 0.08 },desc: '釣到的魚體型 +8%。' },
    { id: 'eq_clover', name: '幸運四葉草', price: 22000,  effect: { rareMul: 1.20 },  desc: '稀有度加權 +20%。' },
    { id: 'eq_sonar',  name: '聲納探測器', price: 60000,  effect: { rareMul: 1.15, showHint: true }, desc: '咬鉤前顯示魚影提示，並提升稀有度 +15%。' }
  ];

  /* ============================================================
     家園
     ============================================================ */

  FG.TANK_LEVELS = [
    { level: 1, cap: 3,  price: 0 },
    { level: 2, cap: 6,  price: 6000 },
    { level: 3, cap: 10, price: 24000 },
    { level: 4, cap: 16, price: 80000 },
    { level: 5, cap: 24, price: 260000 }
  ];

  FG.DECOS = [
    { id: 'rug',    name: '手織地毯',   price: 3500,  effect: {},              desc: '純裝飾。踩起來很舒服。' },
    { id: 'plant',  name: '角落盆栽',   price: 5000,  effect: {},              desc: '純裝飾。水豚偶爾會偷咬一口。' },
    { id: 'trophy', name: '獎盃層架',   price: 18000, effect: { rareMul: 1.05 },desc: '展示戰績，稀有度 +5%。' },
    { id: 'cat',    name: '招財貓',     price: 26000, effect: { valueMul: 1.06 },desc: '賣魚價格 +6%。' },
    { id: 'neon',   name: '霓虹燈管',   price: 12000, effect: {},              desc: '純裝飾。深夜的房間需要一點顏色。' },
    { id: 'lamp',   name: '吊燈',       price: 8000,  effect: {},              desc: '純裝飾。讓房間亮一點。' }
  ];

  /* ============================================================
     籌碼包（示範用，點擊直接發放，未串接金流）
     ============================================================ */
  FG.PACKS = [
    { id: 'p1', name: '小袋籌碼',   chips: 5000,   bonus: 0,      price: 'NT$30' },
    { id: 'p2', name: '一疊籌碼',   chips: 30000,  bonus: 3000,   price: 'NT$150' },
    { id: 'p3', name: '一箱籌碼',   chips: 100000, bonus: 15000,  price: 'NT$490' },
    { id: 'p4', name: '寶箱籌碼',   chips: 350000, bonus: 80000,  price: 'NT$1,590' },
    { id: 'p5', name: '新手禮包',   chips: 20000,  bonus: 0,      price: 'NT$90', once: true,
      extra: { rod: 'rod_carbon', baits: { bait_shrimp: 20 } }, note: '附贈碳纖維遠投竿 + 活蝦 x20' }
  ];

  /* ============================================================
     每日：簽到與任務
     ============================================================ */
  FG.SIGNIN = [
    { day: 1, chips: 1500 },
    { day: 2, chips: 2500 },
    { day: 3, chips: 4000 },
    { day: 4, chips: 6000, bait: { id: 'bait_worm', n: 10 } },
    { day: 5, chips: 9000 },
    { day: 6, chips: 14000, bait: { id: 'bait_lure', n: 10 } },
    { day: 7, chips: 30000, bait: { id: 'bait_king', n: 3 } }
  ];

  FG.MISSIONS = [
    { id: 'm_cast', name: '拋竿 10 次',        target: 10, reward: 3000,  track: 'casts' },
    { id: 'm_sell', name: '賣出 5 條漁獲',      target: 5,  reward: 4000,  track: 'sells' },
    { id: 'm_rare', name: '釣到 1 條稀有以上',  target: 1,  reward: 6000,  track: 'rares' },
    { id: 'm_new',  name: '新增 1 筆圖鑑紀錄',  target: 1,  reward: 5000,  track: 'newCodex' }
  ];

})(window.FG);
