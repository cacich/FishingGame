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
    { id: 'ml_minnow', name: '銀條鰷', rarity: 'common', shape: 'long', scale: .62, pattern: 'stripe', value: 84, minLen: 6, maxLen: 16,
      colors: { body: '#b6c6d4', back: '#6c7f90', belly: '#f2f6f8', fin: '#93a5b4', pattern: '#7f93a4' },
      desc: '整群一起翻身的時候，湖面像被人撒了一把碎銀。' },
    { id: 'ml_smelt', name: '霧香胡瓜魚', rarity: 'common', shape: 'long', scale: .66, pattern: 'none', value: 92, minLen: 8, maxLen: 18,
      colors: { body: '#9fb6ae', back: '#5c7a72', belly: '#eef4f0', fin: '#7d968e' },
      desc: '剛離水時帶著一股清淡的瓜香，湖畔人家拿它下酒。' },

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
    { id: 'ml_perch', name: '赤鰭河鱸', rarity: 'good', shape: 'normal', scale: .84, pattern: 'stripe', value: 305, minLen: 18, maxLen: 40,
      colors: { body: '#6d8a5f', back: '#3b5333', belly: '#e2dfb8', fin: '#c1512f', pattern: '#2f4429' },
      desc: '背上七條深色橫紋，胸鰭紅得像剛沾過朱砂。' },
    { id: 'ml_catfish', name: '短鬚鯰', rarity: 'good', shape: 'wide', scale: .88, pattern: 'speck', value: 340, minLen: 25, maxLen: 55,
      special: ['whisker'],
      colors: { body: '#6a6353', back: '#3a362b', belly: '#ccc6ae', fin: '#524c3f', pattern: '#8d8574' },
      desc: '白天壓在沉木底下不動，天一暗就出來巡湖。' },

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
    { id: 'ml_char', name: '霧斑紅點鮭', rarity: 'rare', shape: 'wide', scale: 1.0, pattern: 'spot', value: 1260, minLen: 28, maxLen: 62,
      colors: { body: '#5f7a86', back: '#33484f', belly: '#f2d9c0', fin: '#c96a4a', pattern: '#ff9a6a' },
      desc: '腹側點著一排橘紅斑點，只在水最冷的清晨靠岸。' },

    /* --- 史詩 --- */
    { id: 'ml_eel', name: '月光鰻', rarity: 'epic', shape: 'long', scale: 1.06, pattern: 'speck', value: 5000, minLen: 60, maxLen: 130,
      special: ['glow'],
      colors: { body: '#5a4a86', back: '#2e2450', belly: '#c3b6e8', fin: '#463a68', pattern: '#cbb8ff', glow: '#a68cff' },
      desc: '只在滿月的夜裡浮上水面，鱗片會映出月色。' },
    { id: 'ml_sturgeon', name: '琉璃鱘', rarity: 'epic', shape: 'wide', scale: 1.1, pattern: 'net', value: 5600, minLen: 70, maxLen: 150,
      special: ['spike'],
      colors: { body: '#7fb3c4', back: '#3f6d80', belly: '#e2f2f6', fin: '#5b8ea0', pattern: '#a9dbe8' },
      desc: '背上的硬鱗排列如琉璃瓦，據說活了上百年。' },
    { id: 'ml_gar', name: '霧刃雀鱔', rarity: 'epic', shape: 'long', scale: 1.08, pattern: 'net', value: 5300, minLen: 60, maxLen: 135,
      special: ['spike'],
      colors: { body: '#6b7a52', back: '#38452a', belly: '#d8dcb4', fin: '#4c5a38', pattern: '#9fb07a' },
      desc: '吻部像一把長鑷子，咬住的東西從來沒有掉過。' },

    /* --- 傳說 --- */
    { id: 'ml_arowana', name: '霧紗龍魚', rarity: 'legend', shape: 'long', scale: 1.18, pattern: 'scale', value: 15000, minLen: 80, maxLen: 150,
      special: ['glow', 'whisker'],
      colors: { body: '#c9a6d8', back: '#6d4d86', belly: '#f2e6f7', fin: '#9c7cb5', pattern: '#e4c9f0', glow: '#e2b6ff' },
      legend: '晨霧最濃的那一刻，牠會貼著水面滑行，鱗片把霧氣切成一縷一縷的紗。老釣手說：看見霧紗龍魚的人，會忘記自己來湖邊做什麼。',
      desc: '傳說中撥開晨霧的長影。' },
    { id: 'ml_spirit', name: '湖靈白鱗', rarity: 'legend', shape: 'flat', scale: 1.16, pattern: 'scale', value: 14500, minLen: 50, maxLen: 105,
      special: ['glow'],
      colors: { body: '#e4eef4', back: '#a9c0cf', belly: '#ffffff', fin: '#c6d9e4', pattern: '#ffffff', glow: '#cfe9ff' },
      legend: '有人在起霧的清晨看過牠：整條魚是半透明的，霧可以從身體裡穿過去。老一輩說那是湖水自己長出來的形狀，所以釣起來只能放回去——因為秤上永遠是零。',
      desc: '從霧裡浮出來的半透明身影。' },

    /* --- 魚王 --- */
    { id: 'ml_king_onde', name: '霧語巨鯰「翁德」', rarity: 'king', shape: 'catfish', scale: 1.3, pattern: 'speck', value: 52000, minLen: 150, maxLen: 260,
      special: ['glow', 'whisker', 'scar'], cyOffset: 1,
      colors: { body: '#5f6b73', back: '#2f383f', belly: '#c2ccd2', fin: '#454f57', pattern: '#8d9aa2', glow: '#8fe6ff', scar: '#f0dcc4' },
      legend: '沒有人知道翁德在晨霧湖底待了多久。牠背上那道疤，是四十年前一位老釣手留下的——那天老人只帶回一根斷竿，說：「牠在水裡對我說話。」湖邊從此立了塊碑，寫著「不要回答牠」。',
      desc: '晨霧湖之王。體長可及兩人身高。' }
  ];

  /* ============================================================
     地點二：落霞峽灣
     ============================================================ */
  const FJORD_FISH = [
    /* --- 雜物 --- */
    { id: 'fj_bottle', name: '漂流玻璃瓶', rarity: 'junk', junkArt: 'bottle', value: 20, minLen: 12, maxLen: 24, unit: 'cm', desc: '裡面的紙條早就被海水泡爛了。' },
    { id: 'fj_can',    name: '海蝕鐵罐',   rarity: 'junk', junkArt: 'can',    value: 14, minLen: 8,  maxLen: 15, unit: 'cm', desc: '被浪打得凹凸不平。' },
    { id: 'fj_net',    name: '廢棄流刺網', rarity: 'junk', junkArt: 'weed',   value: 18, minLen: 30, maxLen: 80, unit: 'cm', desc: '纏成一大團，拖上來比真的中魚還累。' },

    /* --- 普通 --- */
    { id: 'fj_sardine', name: '霞光沙丁', rarity: 'common', shape: 'long', scale: .72, pattern: 'band', value: 160, minLen: 10, maxLen: 24,
      colors: { body: '#9fb8c6', back: '#4c6b7d', belly: '#f2f6f8', fin: '#7893a4', pattern: '#d8a45c' },
      desc: '夕陽下整群翻身時，海面像撒了一把金箔。' },
    { id: 'fj_goby', name: '岩礁鰕虎', rarity: 'common', shape: 'long', scale: .66, pattern: 'spot', value: 145, minLen: 8, maxLen: 18,
      colors: { body: '#a8846a', back: '#5f4433', belly: '#e6d6c2', fin: '#856248', pattern: '#3f2d20' },
      desc: '死守自己那一塊岩縫，兇得很。' },
    { id: 'fj_anchovy', name: '金邊鯷', rarity: 'common', shape: 'long', scale: .64, pattern: 'stripe', value: 150, minLen: 7, maxLen: 16,
      colors: { body: '#a9c0cc', back: '#52707f', belly: '#f4f8fa', fin: '#7e98a6', pattern: '#e0b25f' },
      desc: '整群壓在船底下的時候，海面看起來會自己發光。' },
    { id: 'fj_horsemackerel', name: '竹筴魚', rarity: 'common', shape: 'long', scale: .74, pattern: 'band', value: 168, minLen: 14, maxLen: 30,
      colors: { body: '#86a1a8', back: '#445f68', belly: '#eef3f4', fin: '#6a848c', pattern: '#cfa15a' },
      desc: '側線上有一排硬棘，摸下去像鋸子。' },
    { id: 'fj_flounder', name: '崖底鰈', rarity: 'common', shape: 'flat', scale: .78, pattern: 'speck', value: 175, minLen: 15, maxLen: 34,
      colors: { body: '#8a7a5e', back: '#4d422f', belly: '#e8ded0', fin: '#6d6049', pattern: '#3a3124' },
      desc: '兩隻眼睛長在同一側，貼著砂地一動也不動。' },
    { id: 'fj_wrasse', name: '霞紋隆頭魚', rarity: 'common', shape: 'flat', scale: .72, pattern: 'band2', value: 158, minLen: 12, maxLen: 26,
      colors: { body: '#4f8a8f', back: '#275257', belly: '#e6d9b8', fin: '#d97a4a', pattern: '#ffd28a' },
      desc: '天一黑就在砂裡挖個洞把自己埋起來睡覺。' },

    /* --- 優良 --- */
    { id: 'fj_scorpion', name: '赤鮋', rarity: 'good', shape: 'flat', scale: .88, pattern: 'spot', value: 520, minLen: 18, maxLen: 38,
      special: ['spike'],
      colors: { body: '#c4553f', back: '#7d2c22', belly: '#f0c8a8', fin: '#9c3d2e', pattern: '#5e1f18' },
      desc: '鰭上有毒棘，處理時務必小心。' },
    { id: 'fj_mackerel', name: '條紋鯖', rarity: 'good', shape: 'wide', scale: .92, pattern: 'stripe', value: 560, minLen: 24, maxLen: 48,
      colors: { body: '#6d93a6', back: '#2f5265', belly: '#eef4f7', fin: '#4d7387', pattern: '#1f3a49' },
      desc: '速度極快，中鉤後會把線拉得筆直。' },
    { id: 'fj_bonito', name: '齒鰹', rarity: 'good', shape: 'wide', scale: .9, pattern: 'stripe', value: 545, minLen: 25, maxLen: 52,
      colors: { body: '#55788f', back: '#26414f', belly: '#eef2f5', fin: '#3d5f72', pattern: '#1c333f' },
      desc: '一停下來就會沉，所以牠一輩子沒有真正休息過。' },
    { id: 'fj_needlefish', name: '針嘴鱵', rarity: 'good', shape: 'long', scale: .9, pattern: 'none', value: 500, minLen: 25, maxLen: 55,
      colors: { body: '#93aeb8', back: '#4c6773', belly: '#f6f9fa', fin: '#ffc46a' },
      desc: '下顎細長如針。受驚時會貼著海面連續彈跳。' },
    { id: 'fj_grouper', name: '岩壁石斑', rarity: 'good', shape: 'wide', scale: .86, pattern: 'spot', value: 580, minLen: 22, maxLen: 48,
      colors: { body: '#7a6a52', back: '#43382a', belly: '#ddd0b4', fin: '#5d5140', pattern: '#2e2519' },
      desc: '一輩子守著同一個岩洞，體色會慢慢染成岩壁的顏色。' },

    /* --- 稀有 --- */
    { id: 'fj_seabream', name: '落日真鯛', rarity: 'rare', shape: 'flat', scale: 1.02, pattern: 'speck', value: 2100, minLen: 30, maxLen: 70,
      colors: { body: '#e08a86', back: '#a24a4c', belly: '#fbe3dc', fin: '#c26a68', pattern: '#7fb9d6' },
      desc: '峽灣落日時分才會靠岸，紅得像被夕陽染過。' },
    { id: 'fj_cutlass', name: '銀刀魚', rarity: 'rare', shape: 'long', scale: 1.14, pattern: 'none', value: 2300, minLen: 60, maxLen: 130,
      colors: { body: '#d6e2ea', back: '#8ea3b3', belly: '#ffffff', fin: '#b2c4d0' },
      desc: '像一把豎立的長刀，直挺挺地懸在水中。' },
    { id: 'fj_amberjack', name: '霞色紅甘', rarity: 'rare', shape: 'wide', scale: 1.04, pattern: 'band', value: 2200, minLen: 40, maxLen: 90,
      colors: { body: '#7f8f6f', back: '#4a5840', belly: '#f2ead0', fin: '#5f6f52', pattern: '#e8b45c' },
      desc: '從眼睛拉到尾柄的那道金線，在夕照下會整條亮起來。' },
    { id: 'fj_lionfish', name: '焰鰭蓑鮋', rarity: 'rare', shape: 'flat', scale: 1.0, pattern: 'stripe', value: 2050, minLen: 22, maxLen: 48,
      special: ['spike'],
      colors: { body: '#c85a44', back: '#7a2c20', belly: '#f6d8b8', fin: '#e0855c', pattern: '#f2e2c0' },
      desc: '鰭條張得像一團火。牠不逃，因為牠不需要逃。' },

    /* --- 史詩 --- */
    { id: 'fj_sailfish', name: '潮汐旗魚', rarity: 'epic', shape: 'wide', scale: 1.16, pattern: 'band', value: 9000, minLen: 120, maxLen: 250,
      special: ['spike'],
      colors: { body: '#3f6f9c', back: '#1e3c5c', belly: '#dfeaf2', fin: '#2c5580', pattern: '#79b6dd' },
      desc: '背鰭張開時像一面藍色的帆。' },
    { id: 'fj_sunfish', name: '落日翻車魚', rarity: 'epic', shape: 'round', scale: 1.14, pattern: 'speck', value: 8800, minLen: 90, maxLen: 200,
      colors: { body: '#9aa8b4', back: '#5a6874', belly: '#e4eaee', fin: '#7a8894', pattern: '#c8d4dc' },
      desc: '傍晚會翻過來躺在海面曬太陽，看起來像一塊漂走的門板。' },
    { id: 'fj_moray', name: '崖穴裸胸鱔', rarity: 'epic', shape: 'long', scale: 1.1, pattern: 'net', value: 9200, minLen: 70, maxLen: 160,
      special: ['spike'],
      colors: { body: '#6b5a3a', back: '#3a3020', belly: '#d2c49a', fin: '#55482f', pattern: '#c4a86a' },
      desc: '整條身體留在洞裡，只把頭伸出來，一開一合地呼吸。' },

    /* --- 傳說 --- */
    { id: 'fj_oarfish', name: '霞帶皇帶魚', rarity: 'legend', shape: 'long', scale: 1.22, pattern: 'none', value: 25000, minLen: 200, maxLen: 420,
      special: ['glow'],
      colors: { body: '#cfd9e2', back: '#8b9aa8', belly: '#ffffff', fin: '#e05a6a', glow: '#ffd0a0' },
      legend: '漁民叫牠「地震的信使」。牠一年只上浮一次，看起來像一條被拉直的霞光，紅色的背鰭在水裡一開一合。看過的人都說：那不是魚在游，那是海在呼吸。',
      desc: '峽灣深處浮上來的長帶。' },

    { id: 'fj_ray', name: '霞光魟', rarity: 'legend', shape: 'ray', scale: 1.2, pattern: 'spot', value: 24000, minLen: 100, maxLen: 220,
      special: ['glow'],
      colors: { body: '#c98a5c', back: '#8a5030', belly: '#f6dcc0', fin: '#a86a42', pattern: '#ffd98a', glow: '#ffbf7a' },
      legend: '黃昏時牠會浮到水面下一尺處滑行，翼緣透著光，像有人在海裡點了一盞燈。漁民不捕牠——據說牠在替沉船的人引路。',
      desc: '峽灣的黃昏引路者。' },

    /* --- 魚王 --- */
    { id: 'fj_king_helio', name: '落日巨鮪「赫利歐」', rarity: 'king', shape: 'tuna', scale: 1.34, pattern: 'band2', value: 96000, minLen: 200, maxLen: 340,
      special: ['glow', 'finlet'],
      colors: { body: '#3d6b93', back: '#1b3450', belly: '#f0c66a', fin: '#2b5077', pattern: '#ffb347', glow: '#ffc861' },
      legend: '赫利歐每天只在太陽貼上海平面的那七分鐘出現。牠沿著霞光的邊界游，像在追那條逐漸熄滅的線。峽灣的老船長說，牠追了幾百年，一次都沒追上。',
      desc: '落霞峽灣之王。追逐夕陽的巨獸。' }
  ];

  /* ============================================================
     地點三：宵櫻神域
     汽水域（河海交會的神社潟湖），所以魚種刻意淡水鹹水混編。
     配色走「朱紅 × 櫻粉 × 墨黑」的和風三色，稀有以上多用金與朱，
     跟晨霧湖的自然灰藍拉開距離。
     ============================================================ */
  const SHRINE_FISH = [
    /* --- 雜物 --- */
    { id: 'sk_ema',  name: '舊繪馬',     rarity: 'junk', junkArt: 'ema',  value: 90, minLen: 12, maxLen: 20, unit: 'cm', desc: '墨跡被水泡開了，只看得出最後一個「願」字。' },
    { id: 'sk_can',  name: '供品空罐',   rarity: 'junk', junkArt: 'can',  value: 70, minLen: 8,  maxLen: 15, unit: 'cm', desc: '有人把祭品連罐一起丟進了潟湖。' },
    { id: 'sk_moss', name: '一束水藻',   rarity: 'junk', junkArt: 'weed', value: 60, minLen: 20, maxLen: 55, unit: 'cm', desc: '纏在鳥居柱腳上的那種，滑得抓不住。' },

    /* --- 普通 --- */
    { id: 'sk_ayu', name: '香魚', rarity: 'common', shape: 'long', scale: .74, pattern: 'none', value: 230, minLen: 12, maxLen: 30,
      colors: { body: '#8fa88c', back: '#4e6a52', belly: '#f0f4ea', fin: '#6d8670' },
      desc: '身上帶著西瓜般的清香，一年就結束一生。' },
    { id: 'sk_oikawa', name: '追河', rarity: 'common', shape: 'normal', scale: .7, pattern: 'stripe', value: 225, minLen: 8, maxLen: 18,
      colors: { body: '#7f92a8', back: '#44546a', belly: '#f2f5f8', fin: '#c85a7a', pattern: '#5f7fa8' },
      desc: '繁殖期的雄魚會換上紅紫相間的婚姻色，是溪裡最花俏的一段日子。' },
    { id: 'sk_funa', name: '真鮒', rarity: 'common', shape: 'round', scale: .74, pattern: 'scale', value: 240, minLen: 12, maxLen: 30,
      colors: { body: '#9aa38a', back: '#5b6350', belly: '#e8ecd8', fin: '#77806a', pattern: '#7d8770' },
      desc: '「釣魚始於鮒、終於鮒」——神社前的老人這樣教小孩。' },
    { id: 'sk_haze', name: '真鰕虎', rarity: 'common', shape: 'long', scale: .68, pattern: 'spot', value: 215, minLen: 8, maxLen: 20,
      colors: { body: '#a89478', back: '#5f5340', belly: '#ece2cc', fin: '#867059', pattern: '#4a3d2c' },
      desc: '退潮後留在灘上的水窪裡，一戳就彈起來。' },
    { id: 'sk_tanago', name: '虹鱊', rarity: 'common', shape: 'flat', scale: .64, pattern: 'band', value: 250, minLen: 5, maxLen: 12,
      colors: { body: '#8fb0c4', back: '#4a6a80', belly: '#f4f0e2', fin: '#d88a9c', pattern: '#5fd0b8' },
      desc: '把卵產進河蚌的鰓裡。小得像一枚會游的和菓子。' },
    { id: 'sk_dojo', name: '泥鰍', rarity: 'common', shape: 'long', scale: .7, pattern: 'speck', value: 220, minLen: 10, maxLen: 22,
      special: ['whisker'],
      colors: { body: '#6e6350', back: '#3d3628', belly: '#c8bfa4', fin: '#57503f', pattern: '#918872' },
      desc: '天氣要變的時候會浮上來換氣，比氣象預報準。' },

    /* --- 優良 --- */
    { id: 'sk_yamame', name: '山女鱒', rarity: 'good', shape: 'wide', scale: .84, pattern: 'band2', value: 760, minLen: 18, maxLen: 40,
      colors: { body: '#7f8f9c', back: '#46545f', belly: '#f2f0e6', fin: '#63727e', pattern: '#3a4650' },
      desc: '溪流的女王。側面那排橢圓斑叫「小判紋」。' },
    { id: 'sk_iwana', name: '岩魚', rarity: 'good', shape: 'wide', scale: .86, pattern: 'spot', value: 780, minLen: 20, maxLen: 45,
      colors: { body: '#6a6f5e', back: '#3a4034', belly: '#f0e4cc', fin: '#525848', pattern: '#f2e8d0' },
      desc: '住在溪流最上游、瀑布也上得去的地方。山裡的人說牠會變成人。' },
    { id: 'sk_kurodai', name: '黑鯛', rarity: 'good', shape: 'flat', scale: .88, pattern: 'stripe', value: 800, minLen: 22, maxLen: 50,
      colors: { body: '#6b7078', back: '#33383f', belly: '#dfe3e6', fin: '#4c5259', pattern: '#282d33' },
      desc: '極度謹慎，能認出釣線。汽水域的老油條。' },
    { id: 'sk_suzuki', name: '鱸', rarity: 'good', shape: 'normal', scale: .92, pattern: 'speck', value: 820, minLen: 30, maxLen: 65,
      colors: { body: '#93a6b2', back: '#4f6270', belly: '#f4f7f9', fin: '#73868f', pattern: '#3d4d58' },
      desc: '一生會換三個名字，長到這個尺寸才配叫「鱸」。' },
    { id: 'sk_unagi', name: '青鰻', rarity: 'good', shape: 'long', scale: .9, pattern: 'none', value: 745, minLen: 35, maxLen: 80,
      colors: { body: '#4f5f4a', back: '#283224', belly: '#d4d8be', fin: '#3d4a39' },
      desc: '沒有人在這條河裡看過牠產卵——牠們會一路游到幾千公里外的海溝去。' },

    /* --- 稀有 --- */
    { id: 'sk_nishikigoi', name: '三色錦鯉', rarity: 'rare', shape: 'normal', scale: 1.02, pattern: 'spot', value: 3150, minLen: 30, maxLen: 70,
      special: ['whisker'],
      colors: { body: '#f4f0ea', back: '#cfc6ba', belly: '#ffffff', fin: '#e0d6ca', pattern: '#c8392f' },
      desc: '神社放生池滿出來時流進潟湖的。牠們在這裡長得比池子裡大兩倍。' },
    { id: 'sk_kinme', name: '金目鯛', rarity: 'rare', shape: 'flat', scale: 1.0, pattern: 'none', value: 3200, minLen: 25, maxLen: 55,
      colors: { body: '#d0483f', back: '#8a2620', belly: '#f6d4c4', fin: '#b03a32', eyeWhite: '#ffd766', pupil: '#20140c' },
      desc: '那雙金色的大眼睛在燈下會整個亮起來，像兩枚小判。' },
    { id: 'sk_ishidai', name: '石鯛', rarity: 'rare', shape: 'flat', scale: 1.0, pattern: 'stripe', value: 3080, minLen: 25, maxLen: 60,
      colors: { body: '#c8cdd2', back: '#7d848c', belly: '#f2f5f7', fin: '#9aa1a8', pattern: '#20262c' },
      desc: '七條黑橫紋。牙齒能咬碎貝殼，也能咬斷鉤子。' },
    { id: 'sk_sakuramasu', name: '櫻鱒', rarity: 'rare', shape: 'wide', scale: 1.04, pattern: 'speck', value: 3260, minLen: 35, maxLen: 75,
      colors: { body: '#e0a0a8', back: '#9c5460', belly: '#faeae8', fin: '#c47f8a', pattern: '#7f3a46' },
      desc: '櫻花開的時候溯河而上，整條魚會轉成花瓣的顏色。' },

    /* --- 史詩 --- */
    { id: 'sk_koryu', name: '登龍門鯉', rarity: 'epic', shape: 'normal', scale: 1.12, pattern: 'scale', value: 12300, minLen: 60, maxLen: 130,
      special: ['glow', 'whisker', 'horn'],
      colors: { body: '#e8b845', back: '#a2761a', belly: '#faedbe', fin: '#c9962a', pattern: '#b88620', glow: '#ffd970', hornColor: '#fff0b4' },
      desc: '傳說跳過瀑布的鯉魚會化成龍。這一條額頭上已經長出東西了。' },
    { id: 'sk_hanzaki', name: '大山椒魚「半裂」', rarity: 'epic', shape: 'long', scale: 1.14, pattern: 'speck', value: 12000, minLen: 70, maxLen: 150,
      special: ['whisker'],
      colors: { body: '#5f5a4a', back: '#332f26', belly: '#b0a890', fin: '#4a4638', pattern: '#8a8470' },
      desc: '名字來自「劈成兩半也能活下去」的傳說。牠已經在這條河待了六十年。' },

    /* --- 傳說 --- */
    { id: 'sk_ningyo', name: '人魚', rarity: 'legend', shape: 'flat', scale: 1.18, pattern: 'scale', value: 34000, minLen: 60, maxLen: 130,
      special: ['glow'],
      colors: { body: '#f0d8dc', back: '#b07f8c', belly: '#fdf4f6', fin: '#d8aab4', pattern: '#ffffff', glow: '#ffc0cf' },
      legend: '吃了牠的肉可以活八百年。八百比丘尼就是這樣來的——她走遍全國種下椿樹，最後回到海邊的洞窟裡坐著，等那八百年過完。所以這一帶的漁民釣到了都放回去，沒有人想要那種東西。',
      desc: '不該吃的那種魚。' },
    { id: 'sk_shinshi', name: '神使白魚', rarity: 'legend', shape: 'long', scale: 1.16, pattern: 'none', value: 33000, minLen: 50, maxLen: 110,
      special: ['glow'],
      colors: { body: '#f6f8fa', back: '#c4cdd6', belly: '#ffffff', fin: '#dde4ea', glow: '#e8f4ff' },
      legend: '祭典的前一晚，牠們會排成一列穿過鳥居下方，從海往神社的方向游。宮司說那是神明在點名。整個過程沒有聲音，水面也不會動。',
      desc: '祭典前夜穿過鳥居的白色隊伍。' },

    /* --- 魚王 --- */
    { id: 'sk_king_yahiro', name: '淵之主「八尋」', rarity: 'king', shape: 'dragon', scale: 1.32, pattern: 'scale', value: 135000, minLen: 180, maxLen: 300,
      special: ['glow', 'whisker', 'horn', 'mane'], cyOffset: 1,
      colors: { body: '#c8402f', back: '#7a2018', belly: '#f6dca8', fin: '#a02e22', pattern: '#ffd76a', glow: '#ff9a5f', hornColor: '#ffe9a8', mane: '#ffcf6b' },
      legend: '八尋是長度單位，大概十四公尺——當然沒有人真的量過。神社的緣起寫著：這片潟湖本來是海，八尋來的那天，海退開了，留下這座湖給牠住。鳥居是後來蓋的，蓋在牠進出的那條水路上，用意不是迎神，是攔。',
      desc: '宵櫻神域之主。鳥居攔的就是牠。' }
  ];

  /* ============================================================
     地點四：幽藍冰湖
     配色統一走「藍白冷調」，暖色只留給稀有以上的魚，
     讓玩家在結果卡上一眼就能認出「這條不一樣」。
     ============================================================ */
  const FROST_FISH = [
    /* --- 雜物 --- */
    { id: 'fr_ice',  name: '浮冰碎塊',   rarity: 'junk', junkArt: 'ice',  value: 30, minLen: 20, maxLen: 60, unit: 'cm', desc: '拉上來就開始融化，最後什麼都不剩。' },
    { id: 'fr_can',  name: '凍結罐頭',   rarity: 'junk', junkArt: 'can',  value: 41, minLen: 8,  maxLen: 15, unit: 'cm', desc: '整罐凍成一塊冰，敲不開也賣不掉。' },
    { id: 'fr_rope', name: '斷裂雪橇繩', rarity: 'junk', junkArt: 'weed', value: 33, minLen: 30, maxLen: 90, unit: 'cm', desc: '結頭還在，另一端不在了。' },

    /* --- 普通 --- */
    { id: 'fr_smelt', name: '冰下胡瓜魚', rarity: 'common', shape: 'long', scale: .66, pattern: 'none', value: 280, minLen: 8, maxLen: 20,
      colors: { body: '#b8ccd6', back: '#6d8794', belly: '#f4fafc', fin: '#94aab6' },
      desc: '冰釣最常見的收穫，小孩在冰洞旁一整天能釣上百條。' },
    { id: 'fr_whitefish', name: '霜鱗白鮭', rarity: 'common', shape: 'long', scale: .8, pattern: 'scale', value: 320, minLen: 18, maxLen: 38,
      colors: { body: '#c8d8e2', back: '#7f97a6', belly: '#fbfdfe', fin: '#a3b8c4', pattern: '#dfe9f0' },
      desc: '離水幾秒鱗片就結霜，看起來像裹了一層糖。' },
    { id: 'fr_perch', name: '藍紋河鱸', rarity: 'common', shape: 'normal', scale: .78, pattern: 'stripe', value: 305, minLen: 14, maxLen: 32,
      colors: { body: '#5f7f9c', back: '#2f4a63', belly: '#e6eef4', fin: '#4a6884', pattern: '#23394d' },
      desc: '冰層下光線少，牠的橫紋比溫帶的同類深上一號。' },
    { id: 'fr_ruffe', name: '冰砂杜父魚', rarity: 'common', shape: 'round', scale: .7, pattern: 'speck', value: 265, minLen: 8, maxLen: 18,
      colors: { body: '#7c8a86', back: '#444f4d', belly: '#d8e0dc', fin: '#5f6c68', pattern: '#3a4442' },
      desc: '趴在湖底的碎石上，不動的時候跟砂子一模一樣。' },
    { id: 'fr_dace', name: '雪腹雅羅魚', rarity: 'common', shape: 'normal', scale: .76, pattern: 'none', value: 290, minLen: 15, maxLen: 34,
      colors: { body: '#a8bcc8', back: '#61798a', belly: '#f6fafc', fin: '#859cab' },
      desc: '腹部白得發亮，從冰洞往下看只看得見一片一片閃動的白。' },
    { id: 'fr_burbot', name: '冰穴江鱈', rarity: 'common', shape: 'long', scale: .84, pattern: 'speck', value: 330, minLen: 22, maxLen: 48,
      special: ['whisker'],
      colors: { body: '#6f6a54', back: '#3b382a', belly: '#ccc8ae', fin: '#56513f', pattern: '#9a937a' },
      desc: '唯一在結冰季產卵的淡水鱈。越冷牠越活躍。' },

    /* --- 優良 --- */
    { id: 'fr_grayling', name: '藍鰭茴魚', rarity: 'good', shape: 'wide', scale: .86, pattern: 'band', value: 1000, minLen: 22, maxLen: 46,
      colors: { body: '#6f8fb0', back: '#3a5570', belly: '#eaf2f8', fin: '#8f6fc0', pattern: '#4a6a8c' },
      desc: '背鰭張開時像一面淡紫色的帆，只有離水的那一瞬間看得到。' },
    { id: 'fr_char', name: '極地紅點鮭', rarity: 'good', shape: 'wide', scale: .9, pattern: 'spot', value: 1070, minLen: 26, maxLen: 56,
      colors: { body: '#55707f', back: '#2d4450', belly: '#f4dcc4', fin: '#d4704e', pattern: '#ff9e70' },
      desc: '在這片死白裡，牠腹側那排橘點是唯一的暖色。' },
    { id: 'fr_pike', name: '冰河狗魚', rarity: 'good', shape: 'long', scale: .96, pattern: 'band2', value: 1110, minLen: 35, maxLen: 75,
      colors: { body: '#6f8470', back: '#3a4a3c', belly: '#d8e0d4', fin: '#4d5f50', pattern: '#a8bca8' },
      desc: '守在冰洞正下方，等著吞掉任何被光吸引過來的東西。' },
    { id: 'fr_lenok', name: '霜紋細鱗鮭', rarity: 'good', shape: 'normal', scale: .88, pattern: 'speck', value: 1020, minLen: 24, maxLen: 50,
      colors: { body: '#8a9aa4', back: '#4e5e68', belly: '#f0f4f6', fin: '#6d7d88', pattern: '#c4d2da' },
      desc: '鱗片細到摸起來像磨砂玻璃。' },
    { id: 'fr_sculpin', name: '甲殼杜父魚', rarity: 'good', shape: 'round', scale: .82, pattern: 'net', value: 960, minLen: 16, maxLen: 34,
      special: ['spike'],
      colors: { body: '#7a6f7f', back: '#443c48', belly: '#ded6e0', fin: '#5e5563', pattern: '#a89ab0' },
      desc: '頭部覆著一層骨板，被冰塊砸到也不痛不癢。' },

    /* --- 稀有 --- */
    { id: 'fr_taimen', name: '冰河哲羅鮭', rarity: 'rare', shape: 'wide', scale: 1.04, pattern: 'spot', value: 4590, minLen: 50, maxLen: 110,
      colors: { body: '#7f6f5f', back: '#45392e', belly: '#eee0cc', fin: '#b45a4a', pattern: '#d88a6a' },
      desc: '淡水鮭裡最大的一支。會把落水的小型獸類一併吞掉。' },
    { id: 'fr_sturgeon', name: '霜背小鱘', rarity: 'rare', shape: 'wide', scale: 1.06, pattern: 'net', value: 4740, minLen: 55, maxLen: 120,
      special: ['spike', 'whisker'],
      colors: { body: '#8fb0bc', back: '#4c6d7a', belly: '#e6f2f6', fin: '#6d8f9c', pattern: '#b8dce8' },
      desc: '背上五列骨板結著霜，像一排小小的冰山。' },
    { id: 'fr_glasscarp', name: '透鱗玻璃魚', rarity: 'rare', shape: 'flat', scale: 1.0, pattern: 'none', value: 4440, minLen: 30, maxLen: 65,
      special: ['glow'],
      colors: { body: '#cfe4ee', back: '#93b4c6', belly: '#ffffff', fin: '#b0cddb', glow: '#a8dcf4' },
      desc: '整條魚半透明，對著光看得見裡面的骨架與心跳。' },
    { id: 'fr_bluetrout', name: '深藍湖鱒', rarity: 'rare', shape: 'normal', scale: 1.0, pattern: 'speck', value: 4510, minLen: 35, maxLen: 72,
      colors: { body: '#3f6a92', back: '#1f3c58', belly: '#dceaf4', fin: '#2f5578', pattern: '#7fb0d4' },
      desc: '住在冰湖最深的那個坑裡，體色深到接近夜空。' },

    /* --- 史詩 --- */
    { id: 'fr_unicorn', name: '冰角獨角魚', rarity: 'epic', shape: 'wide', scale: 1.1, pattern: 'scale', value: 17800, minLen: 80, maxLen: 170,
      special: ['horn', 'glow'],
      colors: { body: '#b4c8d8', back: '#6a8296', belly: '#f2f8fc', fin: '#8ea6b8', pattern: '#dceaf4', glow: '#9fd8ff', hornColor: '#f2e8c8' },
      desc: '額頭那根角是冰做的，離水之後會慢慢化掉，沒有人帶回過完整的標本。' },
    { id: 'fr_iceeel', name: '霜脈冰鰻', rarity: 'epic', shape: 'long', scale: 1.1, pattern: 'speck', value: 17000, minLen: 90, maxLen: 190,
      special: ['glow'],
      colors: { body: '#5a7a92', back: '#2c4458', belly: '#cfe2ee', fin: '#446076', pattern: '#bfe4f8', glow: '#8fd0ff' },
      desc: '身上的紋路會沿著同一個方向緩緩流動，像冰裂縫在生長。' },

    /* --- 傳說 --- */
    { id: 'fr_aurora', name: '極光鱗鮭', rarity: 'legend', shape: 'wide', scale: 1.18, pattern: 'scale', value: 48800, minLen: 100, maxLen: 200,
      special: ['glow'],
      colors: { body: '#6fd8b8', back: '#2f7f6e', belly: '#eafaf4', fin: '#4fb098', pattern: '#b8f4dc', glow: '#7fffd8' },
      legend: '極光壓到冰面上的那幾分鐘，湖底會跟著亮起來——不是反光，是牠們整群浮上來。冰上的人只能站著看，因為那時候誰也不想動手。',
      desc: '只在極光下浮出的綠色魚群。' },
    { id: 'fr_wraith', name: '冰隙白影', rarity: 'legend', shape: 'long', scale: 1.2, pattern: 'none', value: 47400, minLen: 120, maxLen: 240,
      special: ['glow'],
      colors: { body: '#eef6fa', back: '#b0c8d6', belly: '#ffffff', fin: '#d4e4ee', glow: '#cfeeff' },
      legend: '冰層裂開一道縫的時候，縫底會有東西經過。看不清形狀，只知道白色的、很長、很慢。有經驗的人會立刻收竿走人——不是怕，是覺得不該在那裡打擾。',
      desc: '冰縫底下經過的白色長影。' },

    /* --- 魚王 --- */
    { id: 'fr_king_kold', name: '霜牙巨狗魚「寇爾德」', rarity: 'king', shape: 'pike', scale: 1.32, pattern: 'spot', value: 196000, minLen: 180, maxLen: 320,
      special: ['glow', 'jaw', 'frost'], cyOffset: 1,
      colors: { body: '#5e7a86', back: '#2b3f4a', belly: '#d8e8ee', fin: '#415a66', pattern: '#a8d4e4', glow: '#a8e8ff', tooth: '#f4fbff', frost: '#eaf7ff' },
      legend: '破冰洞開得再小，寇爾德也找得到。牠不是從水裡上來的——先是冰面下傳來像腳步一樣的悶響，然後整塊冰從中間裂開。有人說牠在冰下經營一整片獵場，湖裡消失的每一條魚都在那裡排隊。',
      desc: '幽藍冰湖之王。冰層底下的那個聲音。' }
  ];

  /* ============================================================
     地點五：煙雨蓮江
     配色規則：整片壓在「水墨」色域——墨青、灰藍、青瓷綠。
     暖色（朱紅、胭脂、金）只留給稀有以上，讓它在一片灰綠裡跳出來。
     魚種全部取自中國江河的真實物種，這是這個釣點的識別方式：
     其他四個釣點是「什麼環境」，這裡是「哪條江」。
     ============================================================ */
  const LOTUS_FISH = [
    /* --- 雜物 --- */
    { id: 'lr_porcelain', name: '青花碎碗',   rarity: 'junk', junkArt: 'porcelain', value: 78, minLen: 8,  maxLen: 22, unit: 'cm', desc: '缺了一角。碗底還看得出半個模糊的字。' },
    { id: 'lr_can',       name: '鏽蝕茶葉罐', rarity: 'junk', junkArt: 'can',       value: 62, minLen: 8,  maxLen: 16, unit: 'cm', desc: '倒出來的不是茶葉，是江底的泥。' },
    { id: 'lr_caltrop',   name: '纏繞菱角藤', rarity: 'junk', junkArt: 'weed',      value: 68, minLen: 25, maxLen: 80, unit: 'cm', desc: '菱角早就被摘走了，只剩藤纏在鉤上。' },

    /* --- 普通 --- */
    { id: 'lr_topmouth', name: '麥穗魚', rarity: 'common', shape: 'long', scale: .62, pattern: 'none', value: 488, minLen: 4, maxLen: 11,
      colors: { body: '#9aa8a4', back: '#5a6a6a', belly: '#e4eae4', fin: '#7c8a88' },
      desc: '整條江裡最不值錢也最抓不完的一種。小孩用竹篩就能撈起一整碗。' },
    { id: 'lr_bitterling', name: '彩鰟鮍', rarity: 'common', shape: 'flat', scale: .58, pattern: 'band', value: 526, minLen: 3, maxLen: 8,
      colors: { body: '#8fa2a8', back: '#4f6470', belly: '#eef2f0', fin: '#6f858c', pattern: '#6a8f9c' },
      desc: '產卵時會把卵託給河蚌照顧。體側那道藍線在陽光下會轉色。' },
    { id: 'lr_hemiculter', name: '白鰷', rarity: 'common', shape: 'long', scale: .74, pattern: 'none', value: 502, minLen: 10, maxLen: 22,
      colors: { body: '#c0ccc8', back: '#76888a', belly: '#f6faf8', fin: '#9aa8a6' },
      desc: '成群在水面下十公分處游，太陽一照整片江面像撒了碎銀。' },
    { id: 'lr_crucian', name: '土鯽', rarity: 'common', shape: 'round', scale: .8, pattern: 'scale', value: 550, minLen: 12, maxLen: 30,
      colors: { body: '#8d8a68', back: '#54523c', belly: '#ded8b8', fin: '#6d6a50', pattern: '#a8a480' },
      desc: '哪裡都活得下去。江水再濁，牠都還在。' },
    { id: 'lr_loach', name: '青泥鰍', rarity: 'common', shape: 'long', scale: .78, pattern: 'speck', value: 512, minLen: 10, maxLen: 24,
      special: ['whisker'],
      colors: { body: '#5f6a55', back: '#333a2c', belly: '#c4c8ac', fin: '#48513c', pattern: '#8a9478' },
      desc: '滑到抓不住。整個冬天埋在泥裡不動，開春再爬出來。' },
    { id: 'lr_yellowcat', name: '黃顙魚', rarity: 'common', shape: 'wide', scale: .7, pattern: 'none', value: 536, minLen: 8, maxLen: 20,
      special: ['whisker'],
      colors: { body: '#a8903f', back: '#5f4f1e', belly: '#e8dca8', fin: '#8a7430' },
      desc: '背鰭前那根硬刺會扎人，江邊的孩子都被扎過一次才學會怎麼拿。' },

    /* --- 優良 --- */
    { id: 'lr_grass', name: '青草魚', rarity: 'good', shape: 'wide', scale: .92, pattern: 'scale', value: 1834, minLen: 30, maxLen: 75,
      colors: { body: '#7d8a66', back: '#454e35', belly: '#dee4c8', fin: '#5f6b4c', pattern: '#9aa880' },
      desc: '一天能吃掉自己體重一半的水草。江邊的水草到哪裡斷，就知道牠在哪裡。' },
    { id: 'lr_bream', name: '武昌魴', rarity: 'good', shape: 'flat', scale: .86, pattern: 'band', value: 1766, minLen: 20, maxLen: 45,
      colors: { body: '#9aa8b0', back: '#586a76', belly: '#eef2f4', fin: '#76888f', pattern: '#67797f' },
      desc: '側扁得像一片瓦。當地人說隔水就能認出牠游動的角度。' },
    { id: 'lr_culter', name: '翹嘴鮊', rarity: 'good', shape: 'long', scale: .96, pattern: 'none', value: 1882, minLen: 30, maxLen: 70,
      colors: { body: '#b4c0be', back: '#5f7276', belly: '#f4f8f6', fin: '#8d9c9c' },
      desc: '嘴往上翹，專門從下往上撞水面的小魚。追餌時整條江面會炸開。' },
    { id: 'lr_xenocypris', name: '黃尾鯝', rarity: 'good', shape: 'normal', scale: .84, pattern: 'band', value: 1804, minLen: 18, maxLen: 40,
      colors: { body: '#a4aca0', back: '#5f6a5e', belly: '#eaeee4', fin: '#c8a848', pattern: '#7f8a7c' },
      desc: '只有尾鰭是黃的，其餘一片灰。在濁水裡就靠那點黃認同伴。' },
    { id: 'lr_sleeper', name: '沙塘鱧', rarity: 'good', shape: 'round', scale: .78, pattern: 'net', value: 1920, minLen: 10, maxLen: 22,
      special: ['spike'],
      colors: { body: '#6a6053', back: '#3a352b', belly: '#c8c0aa', fin: '#514a3e', pattern: '#8f8672' },
      desc: '趴在石縫裡等，一整天只動一次。動的那一次不會失手。' },

    /* --- 稀有 --- */
    { id: 'lr_mandarin', name: '花斑鱖', rarity: 'rare', shape: 'wide', scale: 1.0, pattern: 'spot', value: 8106, minLen: 25, maxLen: 60,
      colors: { body: '#a89050', back: '#5c4b22', belly: '#eee0b4', fin: '#7f6a34', pattern: '#2e2a1c' },
      desc: '「桃花流水鱖魚肥」寫的就是牠。只吃活魚，餌不動牠就不理。' },
    { id: 'lr_blackcarp', name: '墨背青魚', rarity: 'rare', shape: 'wide', scale: 1.06, pattern: 'none', value: 7961, minLen: 50, maxLen: 120,
      colors: { body: '#4a5560', back: '#1e252d', belly: '#c0c8cc', fin: '#333e48' },
      desc: '咽喉裡有一塊像磨盤的骨板，河蚌的殼在牠嘴裡會發出聲音。' },
    { id: 'lr_sucker', name: '胭脂魚', rarity: 'rare', shape: 'flat', scale: 1.04, pattern: 'band2', value: 8396, minLen: 40, maxLen: 100,
      colors: { body: '#d8b0a4', back: '#8a4a44', belly: '#f8e8de', fin: '#c25a4e', pattern: '#a8342c' },
      desc: '幼魚背鰭高得像一面帆，身上三道胭脂色斜帶。長大之後帆會收起來，帶也淡掉。' },
    { id: 'lr_eel', name: '江鰻', rarity: 'rare', shape: 'long', scale: 1.0, pattern: 'none', value: 7836, minLen: 40, maxLen: 90,
      colors: { body: '#4f5a4c', back: '#262d24', belly: '#c4c4a8', fin: '#3a4236' },
      desc: '在江裡長大，回海裡產卵，然後就不再回來了。沒有人在江裡見過牠的卵。' },

    /* --- 史詩 --- */
    { id: 'lr_sturgeon', name: '中華鱘', rarity: 'epic', shape: 'wide', scale: 1.1, pattern: 'net', value: 31460, minLen: 90, maxLen: 200,
      special: ['spike', 'whisker'],
      colors: { body: '#7f8a8f', back: '#414c52', belly: '#e0e6e4', fin: '#5f6a70', pattern: '#adb8ba' },
      desc: '背上五列骨板，這個形狀從一億四千萬年前就沒改過。牠比這條江老。' },
    { id: 'lr_shad', name: '銀鱗鰣', rarity: 'epic', shape: 'flat', scale: 1.08, pattern: 'scale', value: 30880, minLen: 40, maxLen: 80,
      special: ['glow'],
      colors: { body: '#dce6e8', back: '#8fa2aa', belly: '#ffffff', fin: '#b8c8cc', pattern: '#f4fafc', glow: '#e8f4f8' },
      desc: '出水就死，鱗片絕不能刮——這是吃過的人才知道的規矩。每年只來一次，來的那幾天江邊沒人睡覺。' },

    /* --- 傳說 --- */
    { id: 'lr_koi', name: '躍門金鯉', rarity: 'legend', shape: 'round', scale: 1.18, pattern: 'scale', value: 87330, minLen: 60, maxLen: 130,
      special: ['glow', 'horn'],
      colors: { body: '#e0a838', back: '#8f5c14', belly: '#fbe8b0', fin: '#c88a24', pattern: '#fff0c0', glow: '#ffd76a', hornColor: '#fff4c8' },
      legend: '額頭上那兩個突起還不算角。老人說那是快要成的樣子——鯉魚跳過那道門就化龍，跳不過就摔回水裡，額頭上留下這個。江上每年都有人看到牠往上游衝，沒有人看過牠成功。',
      desc: '額上已經長出角的雛形。' },
    { id: 'lr_salamander', name: '夜啼大鯢', rarity: 'legend', shape: 'long', scale: 1.22, pattern: 'spot', value: 85400, minLen: 80, maxLen: 180,
      colors: { body: '#6a6a4e', back: '#38382a', belly: '#b4b48c', fin: '#4e4e3a', pattern: '#26261c' },
      legend: '牠會在半夜叫，聲音跟嬰兒一模一樣。沿岸的規矩是聽到就把窗關上，不要應聲、不要出去看。至於為什麼——問了也只會得到同一句：「就是不要。」',
      desc: '不是魚，但每年都有人從江裡拉起來。' },

    /* --- 魚王 --- */
    { id: 'lr_king_dujiang', name: '江神白鱘「渡江」', rarity: 'king', shape: 'paddle', scale: 1.3, pattern: 'net', value: 335800, minLen: 250, maxLen: 520,
      special: ['glow', 'rostrum', 'spike'],
      colors: { body: '#8fa6b0', back: '#3f5660', belly: '#f0f6f6', fin: '#647f88', pattern: '#c4d8dc', glow: '#ffe6a8', rostrum: '#7c94a0' },
      legend: '牠那根吻可以有一個人高，古書裡管牠叫「象魚」。最後一次有人親眼看見是很久以前的事了，之後只剩下聲納紀錄——一個沿著江心緩慢上行、比船還長的訊號，每年春天出現一次，然後停了。江邊的廟裡還供著牠，供桌上是空的，因為沒有人知道該供什麼給一條要渡江的神。',
      desc: '煙雨蓮江之王。廟裡供的就是牠。' }
  ];

  /* ============================================================
     地點六：深淵海溝
     這裡的設計規則：底色一律壓到接近黑，辨識度全靠 glow 與 pattern 的冷光。
     沒有陽光的地方不會有保護色，所以幾乎每一種都帶生物發光。
     ============================================================ */
  const ABYSS_FISH = [
    /* --- 雜物 --- */
    { id: 'ab_bone',   name: '不明骨骸',     rarity: 'junk', junkArt: 'bone',   value: 125, minLen: 20, maxLen: 70, unit: 'cm', desc: '拼不出是什麼生物。排列方式讓人不太舒服。' },
    { id: 'ab_bottle', name: '沉船玻璃浮球', rarity: 'junk', junkArt: 'bottle', value: 165, minLen: 15, maxLen: 35, unit: 'cm', desc: '在這個水深居然沒被壓碎，本身就是件怪事。' },
    { id: 'ab_can',    name: '壓扁的深潛罐', rarity: 'junk', junkArt: 'can',    value: 115, minLen: 8,  maxLen: 16, unit: 'cm', desc: '被水壓捏成一團，像有人用手握過。' },

    /* --- 普通 --- */
    { id: 'ab_lanternfish', name: '燈籠魚', rarity: 'common', shape: 'normal', scale: .68, pattern: 'speck', value: 945, minLen: 6, maxLen: 16,
      special: ['glow'],
      colors: { body: '#2f3a4a', back: '#16202c', belly: '#4a5a6e', fin: '#26303e', pattern: '#7fe0ff', glow: '#4fb0d8' },
      desc: '全世界數量最多的脊椎動物之一，只是沒人看得到牠們。' },
    { id: 'ab_bristlemouth', name: '巨口鬚魚', rarity: 'common', shape: 'long', scale: .7, pattern: 'speck', value: 915, minLen: 5, maxLen: 14,
      special: ['glow'],
      colors: { body: '#2a2f38', back: '#13161c', belly: '#3e4753', fin: '#1f242c', pattern: '#6fd0e8', glow: '#3f90b0' },
      desc: '身體只有一根手指長，嘴巴卻能張開到跟身體一樣寬。' },
    { id: 'ab_hatchetfish', name: '銀斧魚', rarity: 'common', shape: 'flat', scale: .66, pattern: 'none', value: 1020, minLen: 4, maxLen: 12,
      special: ['glow'],
      colors: { body: '#b8c6d2', back: '#5c6a78', belly: '#e8f0f6', fin: '#8fa0ae', glow: '#9fd8f0' },
      desc: '腹部的發光器會模擬上方微弱的天光，讓底下的掠食者看不見牠。' },
    { id: 'ab_snailfish', name: '深溝獅子魚', rarity: 'common', shape: 'round', scale: .7, pattern: 'none', value: 975, minLen: 10, maxLen: 24,
      colors: { body: '#d8a8b0', back: '#8a5f6a', belly: '#f4dce0', fin: '#bc8a94' },
      desc: '沒有鱗片也沒有魚鰾，全身像一團果凍。海溝最深處的常住居民。' },
    { id: 'ab_cusk', name: '深海鼬魚', rarity: 'common', shape: 'long', scale: .8, pattern: 'none', value: 1070, minLen: 18, maxLen: 40,
      colors: { body: '#4a5460', back: '#232a33', belly: '#8d99a6', fin: '#374049' },
      desc: '一輩子貼著海底泥面滑行，眼睛退化到只剩兩個凹點。' },
    { id: 'ab_tripodfish', name: '三腳架魚', rarity: 'common', shape: 'long', scale: .74, pattern: 'speck', value: 995, minLen: 12, maxLen: 28,
      colors: { body: '#3f4a52', back: '#1e252b', belly: '#7d8a94', fin: '#2c353c', pattern: '#8fa8b4' },
      desc: '用三根特化的長鰭條站在泥上，面對水流一動也不動地等。' },

    /* --- 優良 --- */
    { id: 'ab_viperfish', name: '蝰魚', rarity: 'good', shape: 'long', scale: .9, pattern: 'speck', value: 3720, minLen: 20, maxLen: 45,
      special: ['spike', 'glow'],
      colors: { body: '#28323e', back: '#121820', belly: '#3f4c5a', fin: '#1c242e', pattern: '#7fe8d8', glow: '#4fc8b0' },
      desc: '牙齒長到閉不上嘴，只能維持著咬住空氣的姿勢。' },
    { id: 'ab_dragonfish', name: '黑巨口魚', rarity: 'good', shape: 'long', scale: .92, pattern: 'none', value: 3840, minLen: 22, maxLen: 48,
      special: ['whisker', 'glow'],
      colors: { body: '#1c1f26', back: '#0b0d11', belly: '#2e343d', fin: '#14171d', glow: '#e0506a' },
      desc: '下顎垂著一根發光的鬚。牠打的是紅光——深海裡幾乎沒有東西看得見紅色。' },
    { id: 'ab_grenadier', name: '長尾鱈', rarity: 'good', shape: 'long', scale: .94, pattern: 'net', value: 3530, minLen: 30, maxLen: 70,
      colors: { body: '#4e5a64', back: '#252d34', belly: '#96a4ae', fin: '#3a444c', pattern: '#6e7d88' },
      desc: '頭大尾細，像一顆頭後面拖著一條鞭子。' },
    { id: 'ab_fangtooth', name: '尖牙魚', rarity: 'good', shape: 'round', scale: .84, pattern: 'net', value: 3590, minLen: 12, maxLen: 28,
      special: ['spike'],
      colors: { body: '#3a3038', back: '#1a1418', belly: '#5e5158', fin: '#281f26', pattern: '#6d5c68' },
      desc: '相對體型而言，牠擁有全海洋最長的牙。頭骨上還特地開了兩個孔給下顎的牙收納。' },
    { id: 'ab_slickhead', name: '平頭魚', rarity: 'good', shape: 'wide', scale: .86, pattern: 'none', value: 3470, minLen: 25, maxLen: 55,
      colors: { body: '#333c46', back: '#171d24', belly: '#5b6874', fin: '#232b33' },
      desc: '受到驚嚇時會噴出一團發光的黏液，然後趁對方發愣時離開。' },

    /* --- 稀有 --- */
    { id: 'ab_anglerfish', name: '深淵鮟鱇', rarity: 'rare', shape: 'round', scale: 1.02, pattern: 'net', value: 15800, minLen: 20, maxLen: 60,
      special: ['horn', 'spike', 'glow'],
      colors: { body: '#2b2630', back: '#120f16', belly: '#453d4c', fin: '#1d1922', pattern: '#5f5468', glow: '#8fe0ff', hornColor: '#bff0ff' },
      desc: '額前那盞燈是牠身上唯一會動的東西。燈亮的時候，嘴已經張開了。' },
    { id: 'ab_gulper', name: '寬咽鰻', rarity: 'rare', shape: 'long', scale: 1.12, pattern: 'none', value: 15100, minLen: 60, maxLen: 140,
      special: ['glow'],
      colors: { body: '#1a1c22', back: '#0a0b0e', belly: '#2c3038', fin: '#111318', glow: '#7fa8ff' },
      desc: '嘴巴佔了身體的三分之一，可以吞下比自己還大的東西。尾端有一盞粉紅色的燈。' },
    { id: 'ab_chimaera', name: '幽光銀鮫', rarity: 'rare', shape: 'wide', scale: 1.04, pattern: 'speck', value: 14500, minLen: 50, maxLen: 110,
      special: ['spike'],
      colors: { body: '#8f9aa8', back: '#4a5460', belly: '#dde5ec', fin: '#6b7683', pattern: '#c0cdd8' },
      desc: '比鯊魚更古老的一支。背鰭前緣有根帶毒的硬棘，牠自己好像也不太會用。' },
    { id: 'ab_frilledshark', name: '皺鰓古鮫', rarity: 'rare', shape: 'long', scale: 1.16, pattern: 'band2', value: 15400, minLen: 80, maxLen: 180,
      colors: { body: '#4a4238', back: '#221e18', belly: '#8c8272', fin: '#342e26', pattern: '#6b6152' },
      desc: '八千萬年沒改過設計。游動方式不像鯊魚，比較像一條鰻。' },

    /* --- 史詩 --- */
    { id: 'ab_goblin', name: '哥布林鮫', rarity: 'epic', shape: 'wide', scale: 1.16, pattern: 'none', value: 59900, minLen: 150, maxLen: 330,
      special: ['spike', 'scar'],
      colors: { body: '#c89aa0', back: '#7a5460', belly: '#f0d8dc', fin: '#a87a84' },
      desc: '皮膚薄到看得見底下的血色。捕食時整組上下顎會往前彈出來，然後再縮回去。' },
    { id: 'ab_manta', name: '幽藍深海魟', rarity: 'epic', shape: 'ray', scale: 1.2, pattern: 'spot', value: 61700, minLen: 120, maxLen: 260,
      special: ['glow'],
      colors: { body: '#1e2a3a', back: '#0c1219', belly: '#8fa8c0', fin: '#16202c', pattern: '#5fb8e8', glow: '#4f9fd8' },
      desc: '翼展開闔一次要好幾秒。經過的時候上方的光會整片消失，那是唯一能察覺牠的方式。' },

    /* --- 傳說 --- */
    { id: 'ab_starcarrier', name: '載星者', rarity: 'legend', shape: 'flat', scale: 1.2, pattern: 'speck', value: 161000, minLen: 90, maxLen: 190,
      special: ['glow'],
      colors: { body: '#1c2438', back: '#0a0e18', belly: '#3a4560', fin: '#141a29', pattern: '#ffffff', glow: '#7fd8ff' },
      legend: '牠身上的光點不是隨機的。有人把照片拿去比對，發現那是海面上正在轉的那片星空——而且是即時的。沒有人願意去想這代表什麼。',
      desc: '身上帶著一整片星圖的深海魚。' },
    { id: 'ab_endless', name: '無盡長鰻', rarity: 'legend', shape: 'long', scale: 1.24, pattern: 'none', value: 167000, minLen: 250, maxLen: 500,
      special: ['glow'],
      colors: { body: '#141a24', back: '#070a0e', belly: '#28323f', fin: '#0d1116', glow: '#6fe8c8' },
      legend: '所有的紀錄都只拍到中段。牠從畫面的一邊進來，從另一邊出去，中間可以持續四十分鐘。沒有人拍到過頭，也沒有人拍到過尾。',
      desc: '沒有人看過牠的兩端。' },

    /* --- 魚王 --- */
    { id: 'ab_king_nyx', name: '深淵之顎「尼克斯」', rarity: 'king', shape: 'abyss', scale: 1.34, pattern: 'net', value: 617000, minLen: 400, maxLen: 700,
      special: ['glow', 'jaw', 'lantern'], cyOffset: 1,
      colors: { body: '#1a2030', back: '#080b12', belly: '#3c4860', fin: '#121826', pattern: '#4f6a8c', glow: '#9f6fff', tooth: '#e8e2d0', lantern: '#c9a6ff' },
      legend: '探測船的聲納在海溝底部收到過一次回音。依照回波時間換算，那個東西的長度是七公尺——問題是聲納打的是海底，回音卻從半途折回來。第二次施測時，那個位置什麼都沒有了。船長在報告上只寫了一行：牠移動了。',
      desc: '深淵海溝之王。聲納唯一一次撒謊的原因。' }
  ];

  /* ============================================================
     地點七：世界樹根
     配色規則：底色是極夜的深藍黑，**唯一的亮色來源是極光**（青綠 × 紫）。
     所以這裡的魚分成兩派——一般魚是北大西洋的真實冷水魚種、用銀白灰；
     稀有以上換成神話生物、帶 glow 並吃極光的青綠紫。
     那道分界本身就是玩家讀到的「越過某條線之後就不是普通魚了」。
     ============================================================ */
  const WORLD_ROOT_FISH = [
    /* --- 雜物 --- */
    { id: 'wr_shield', name: '裂開的圓盾', rarity: 'junk', junkArt: 'shield', value: 290, minLen: 30, maxLen: 70, unit: 'cm', desc: '中央的凸飾還在，木板已經散了一半。有人在這裡打過架，或者只是把它丟了。' },
    { id: 'wr_can',    name: '鏽蝕的祭器', rarity: 'junk', junkArt: 'can',    value: 245, minLen: 8,  maxLen: 18, unit: 'cm', desc: '形狀像個杯子。裡面的東西早就沒了，也不確定原本裝的是不是能喝的。' },
    { id: 'wr_root',   name: '纏繞的根鬚', rarity: 'junk', junkArt: 'weed',   value: 265, minLen: 30, maxLen: 95, unit: 'cm', desc: '從上面掉下來的。拉起來的時候還在動——大概是水流。' },

    /* --- 普通（北大西洋的真實冷水魚，全部走銀白灰） --- */
    { id: 'wr_herring', name: '銀鯡', rarity: 'common', shape: 'long', scale: .68, pattern: 'none', value: 1730, minLen: 15, maxLen: 32,
      colors: { body: '#b8c4cc', back: '#5f7180', belly: '#f4f8fa', fin: '#8fa0ac' },
      desc: '一群能有幾十萬條。極光亮起來的時候整片水面會跟著閃。' },
    { id: 'wr_capelin', name: '毛鱗魚', rarity: 'common', shape: 'long', scale: .6, pattern: 'none', value: 1765, minLen: 8, maxLen: 18,
      colors: { body: '#a8b4b8', back: '#556468', belly: '#eef4f4', fin: '#7f8c90' },
      desc: '產卵之後就成片死在岸邊。這裡的每一種大魚都靠牠們過冬。' },
    { id: 'wr_lumpsucker', name: '圓鰭魚', rarity: 'common', shape: 'round', scale: .72, pattern: 'speck', value: 1800, minLen: 10, maxLen: 24,
      colors: { body: '#6f7f8a', back: '#3c4850', belly: '#c8d4d8', fin: '#54626b', pattern: '#94a4ac' },
      desc: '腹部有個吸盤，能整天吸在同一塊石頭上不動。' },
    { id: 'wr_plaice', name: '北海鰈', rarity: 'common', shape: 'flat', scale: .8, pattern: 'spot', value: 1840, minLen: 20, maxLen: 45,
      colors: { body: '#8a8470', back: '#4e4a3c', belly: '#eae6d8', fin: '#6b6658', pattern: '#c88f4a' },
      desc: '趴在砂上，只有那排橘點看得出牠在哪。' },
    { id: 'wr_whiting', name: '藍身鱈', rarity: 'common', shape: 'long', scale: .84, pattern: 'none', value: 1780, minLen: 22, maxLen: 48,
      colors: { body: '#7f8fa4', back: '#3f4d60', belly: '#dce4ec', fin: '#5f6e80' },
      desc: '白天沉在深處，天一暗就整群浮上來。這裡的天沒有真的亮過，所以牠們一直在上面。' },
    { id: 'wr_goby', name: '符文鰕虎', rarity: 'common', shape: 'round', scale: .64, pattern: 'net', value: 1810, minLen: 6, maxLen: 14,
      colors: { body: '#8a8478', back: '#4c4840', belly: '#dad4c4', fin: '#6a6558', pattern: '#c0b48f' },
      desc: '體側的花紋跟岸上石板的刻痕很像。當然只是巧合。' },

    /* --- 優良 --- */
    { id: 'wr_cod', name: '北洋鱈', rarity: 'good', shape: 'wide', scale: .94, pattern: 'speck', value: 6900, minLen: 40, maxLen: 90,
      colors: { body: '#8a8f78', back: '#4a4f3f', belly: '#e4e8d8', fin: '#686d58', pattern: '#b4b898' },
      desc: '一整個時代的人靠這種魚活下來，也為了牠打過仗。' },
    { id: 'wr_salmon', name: '銀腹鮭', rarity: 'good', shape: 'wide', scale: .92, pattern: 'spot', value: 6750, minLen: 35, maxLen: 80,
      colors: { body: '#a4aeb8', back: '#54606c', belly: '#f4f6f8', fin: '#7f8b96', pattern: '#3c4650' },
      desc: '牠們一路往上游，撞到瀑布也不轉彎。' },
    { id: 'wr_wolffish', name: '狼牙魚', rarity: 'good', shape: 'long', scale: .96, pattern: 'band2', value: 7050, minLen: 40, maxLen: 95,
      special: ['jaw'],
      colors: { body: '#5f5a6a', back: '#332f3c', belly: '#bab4c4', fin: '#474254', pattern: '#8a8498', tooth: '#f0ead8' },
      desc: '嘴裡的牙一年換一次，換牙那幾週牠什麼都不吃。' },
    { id: 'wr_turbot', name: '盾鱗鮃', rarity: 'good', shape: 'flat', scale: .88, pattern: 'net', value: 6860, minLen: 25, maxLen: 55,
      colors: { body: '#7a7264', back: '#443f36', belly: '#e0dacc', fin: '#5c5649', pattern: '#a89c84' },
      desc: '身上的骨質突起排得像一面小盾。拿起來手會被刮。' },
    { id: 'wr_spurdog', name: '角鯊', rarity: 'good', shape: 'long', scale: 1.0, pattern: 'none', value: 7120, minLen: 45, maxLen: 100,
      special: ['spike'],
      colors: { body: '#6a7480', back: '#3a424c', belly: '#c4ccd4', fin: '#505a66' },
      desc: '背鰭前那兩根刺帶毒。牠可以活一百年，慢到讓人以為牠不會死。' },

    /* --- 稀有 --- */
    { id: 'wr_halibut', name: '巨舌鮃', rarity: 'rare', shape: 'flat', scale: 1.08, pattern: 'spot', value: 30100, minLen: 60, maxLen: 170,
      colors: { body: '#5a5f5a', back: '#2e332f', belly: '#dfe4de', fin: '#42473f', pattern: '#8f9488' },
      desc: '拉上船之前最好先確認船比牠大。不是每次都是。' },
    { id: 'wr_ray', name: '雷紋電鰩', rarity: 'rare', shape: 'ray', scale: 1.04, pattern: 'net', value: 30900, minLen: 50, maxLen: 120,
      special: ['glow'],
      colors: { body: '#4a5570', back: '#242c40', belly: '#c4cee0', fin: '#343e54', pattern: '#8fd8ff', glow: '#7fc0ff' },
      desc: '摸到牠的人說那不像被電到，像被人用力推了一下。' },
    { id: 'wr_eel', name: '銀牙海鰻', rarity: 'rare', shape: 'long', scale: 1.02, pattern: 'none', value: 29600, minLen: 50, maxLen: 110,
      colors: { body: '#4f5a5f', back: '#272e32', belly: '#c0c8c8', fin: '#3a4348' },
      desc: '從石縫裡出來的時候只看得到頭。後面有多長要等牠自己決定。' },
    { id: 'wr_lump', name: '盾牌魨', rarity: 'rare', shape: 'round', scale: 1.0, pattern: 'net', value: 30400, minLen: 30, maxLen: 70,
      special: ['spike'],
      colors: { body: '#7f6a5a', back: '#453a30', belly: '#ddcdb8', fin: '#5f5044', pattern: '#b09878' },
      desc: '整條魚外面裹著一層骨板，敲下去是硬的。牠不游，牠滾。' },

    /* --- 史詩（開始換成神話生物，配色吃極光） --- */
    { id: 'wr_nidhogg', name: '噬根幼龍', rarity: 'epic', shape: 'long', scale: 1.12, pattern: 'speck', value: 118000, minLen: 90, maxLen: 200,
      special: ['glow', 'jaw'],
      colors: { body: '#3a4a3f', back: '#1a2420', belly: '#7f9484', fin: '#28342c', pattern: '#6fe0a8', glow: '#5fd898', tooth: '#eef4e4' },
      desc: '樹根上的咬痕不是一天造成的，而牠們還很小。上面那條有多大，沒有人往下看過。' },
    { id: 'wr_lyngbakr', name: '島鯨幼體', rarity: 'epic', shape: 'wide', scale: 1.14, pattern: 'none', value: 120400, minLen: 100, maxLen: 240,
      special: ['glow'],
      colors: { body: '#4a5566', back: '#222b38', belly: '#aab6c4', fin: '#333d4c', glow: '#8fa8e0' },
      desc: '成體背上會長出土和草，看起來就是一座島。上去生火的人再也沒回來——牠只是覺得燙。' },

    /* --- 傳說 --- */
    { id: 'wr_loki', name: '詭火鮭「洛基」', rarity: 'legend', shape: 'wide', scale: 1.2, pattern: 'scale', value: 326000, minLen: 70, maxLen: 150,
      special: ['glow'],
      colors: { body: '#c85f3a', back: '#7a2f18', belly: '#f6dcb4', fin: '#a04524', pattern: '#ffb86a', glow: '#ff9a4f' },
      legend: '被追到走投無路的時候，牠變成一條鮭魚躲進瀑布下面。追的人張了一張網——牠算準了要從網上跳過去，於是那個人改用手，在牠躍起的半空中抓住了尾巴。從那天起所有的鮭魚尾巴都是往內收的。牠現在還在這裡，還是那個形狀，還是在算什麼時候跳。',
      desc: '尾巴上有一圈握過的痕跡。' },
    { id: 'wr_mead', name: '詩人蜜酒鰻', rarity: 'legend', shape: 'long', scale: 1.2, pattern: 'speck', value: 331000, minLen: 90, maxLen: 190,
      special: ['glow'],
      colors: { body: '#a8823f', back: '#5f451a', belly: '#f0dca8', fin: '#84642c', pattern: '#ffe6a8', glow: '#ffcf6a' },
      legend: '喝過那桶蜜酒的人開口就是詩。這條鰻魚在桶被搬走的那晚一直待在下游，把漏出來的那幾滴喝了。牠不會說話，但釣起牠的人那天晚上會做一個很長的夢，醒來記得每一句。',
      desc: '漏出來的那幾滴，被牠喝掉了。' },

    /* --- 魚王 --- */
    { id: 'wr_king_jormungandr', name: '世界蛇「耶夢加得」', rarity: 'king', shape: 'serpent', scale: 1.3, pattern: 'scale', value: 1140000, minLen: 500, maxLen: 900,
      special: ['glow', 'forkTongue'],
      colors: { body: '#3f6a58', back: '#16302a', belly: '#a8ccb4', fin: '#2a4a40', pattern: '#7fe0b0', glow: '#5fffc0', tongue: '#e0566a' },
      legend: '牠被扔進海裡的時候還很小。牠長到繞完整個世界，然後咬住自己的尾巴——不是因為想，是因為沒有別的地方可以放了。所以牠鬆口的那一天，就是世界不再是一個圈的那一天。這口泉在世界樹的根上，而牠的身體從這裡經過。你釣起來的只是其中一段，而牠沒有掙扎，因為牠知道你放不下整條。',
      desc: '世界樹根之王。你釣起來的只是其中一段。' }
  ];

  /* ============================================================
     地點八：黃沙冥河
     配色規則：**日落沙漠的暖色域**——赭黃、砂金、落日橘，陰影壓成紫褐。
     這是全遊戲唯一「整片暖色」的釣點（其他七個都偏冷或偏灰），
     所以冷色（青金石藍、綠松石）反過來成為稀有以上的訊號。
     魚種取自尼羅河的真實物種，稀有以上換成古埃及神話。
     ============================================================ */
  const DUAT_FISH = [
    /* --- 雜物 --- */
    { id: 'du_shard',  name: '刻字陶片',     rarity: 'junk', junkArt: 'ostracon', value: 560, minLen: 6,  maxLen: 18, unit: 'cm', desc: '上面寫了字。看得懂的人早就不在了。' },
    { id: 'du_can',    name: '空的卡諾卜罐', rarity: 'junk', junkArt: 'can',      value: 480, minLen: 10, maxLen: 24, unit: 'cm', desc: '本來該裝內臟的。裡面只有沙。' },
    { id: 'du_reed',   name: '腐爛的莎草束', rarity: 'junk', junkArt: 'weed',     value: 520, minLen: 30, maxLen: 90, unit: 'cm', desc: '捆得很整齊。捆的人大概以為自己還會回來拿。' },

    /* --- 普通（尼羅河的真實魚種，全部走赭黃砂金） --- */
    { id: 'du_tilapia', name: '尼羅口孵魚', rarity: 'common', shape: 'flat', scale: .76, pattern: 'scale', value: 3600, minLen: 15, maxLen: 35,
      colors: { body: '#b4945a', back: '#6e5528', belly: '#f0e2b8', fin: '#8f7038', pattern: '#d8bc7a' },
      desc: '把卵含在嘴裡孵。壁畫上畫的就是牠，畫了三千年。' },
    { id: 'du_mormyrus', name: '象鼻長頜魚', rarity: 'common', shape: 'long', scale: .8, pattern: 'none', value: 3700, minLen: 20, maxLen: 45,
      colors: { body: '#8f7f6a', back: '#4e4436', belly: '#ded0b4', fin: '#6b5f4e' },
      desc: '用微弱的電流在濁水裡認路。牠的世界沒有形狀，只有訊號。' },
    { id: 'du_barbel',  name: '沙底鬚䰾', rarity: 'common', shape: 'normal', scale: .78, pattern: 'speck', value: 3520, minLen: 14, maxLen: 32,
      special: ['whisker'],
      colors: { body: '#a89060', back: '#605030', belly: '#e8dcbc', fin: '#84703f', pattern: '#c8b284' },
      desc: '整天用鬍鬚在沙裡撥。撥到什麼吃什麼。' },
    { id: 'du_elephant', name: '皺鰭象魚', rarity: 'common', shape: 'round', scale: .72, pattern: 'net', value: 3800, minLen: 10, maxLen: 26,
      colors: { body: '#9a8468', back: '#544636', belly: '#dccfb0', fin: '#75634c', pattern: '#bfa982' },
      desc: '游起來像一片被風吹著的葉子，但轉向比誰都快。' },
    { id: 'du_catlet',  name: '河床小鯰', rarity: 'common', shape: 'long', scale: .74, pattern: 'speck', value: 3580, minLen: 12, maxLen: 30,
      special: ['whisker'],
      colors: { body: '#7f6f58', back: '#453b2c', belly: '#cfc0a0', fin: '#5f5240', pattern: '#a89478' },
      desc: '白天埋在泥裡，晚上整條河床都是牠們。' },
    { id: 'du_puffer',  name: '尼羅河魨', rarity: 'common', shape: 'round', scale: .7, pattern: 'spot', value: 3660, minLen: 8, maxLen: 20,
      special: ['spike'],
      colors: { body: '#c8a860', back: '#7f6428', belly: '#f4ecc8', fin: '#a08840', pattern: '#4a3c20' },
      desc: '被抓起來會鼓成一顆球。鼓完就不肯消，只能等牠自己想通。' },

    /* --- 優良 --- */
    { id: 'du_perch',   name: '尼羅河鱸', rarity: 'good', shape: 'wide', scale: .96, pattern: 'none', value: 13800, minLen: 40, maxLen: 100,
      colors: { body: '#b0a888', back: '#5f5a44', belly: '#f2eed8', fin: '#8a8368' },
      desc: '這條河最大的普通魚。牠不需要傳說，牠光是重量就夠嚇人。' },
    { id: 'du_bichir',  name: '多鰭蘆魚', rarity: 'good', shape: 'long', scale: .98, pattern: 'net', value: 14100, minLen: 35, maxLen: 80,
      special: ['spike'],
      colors: { body: '#7a7048', back: '#413b22', belly: '#cfc898', fin: '#5c5434', pattern: '#a89c68' },
      desc: '背上一排各自分開的小旗。這個設計比恐龍更早。' },
    { id: 'du_synodontis', name: '倒游鯰', rarity: 'good', shape: 'wide', scale: .9, pattern: 'spot', value: 13500, minLen: 20, maxLen: 48,
      special: ['whisker'],
      colors: { body: '#6a5f50', back: '#3a332a', belly: '#c8bca4', fin: '#4e4538', pattern: '#241f18' },
      desc: '習慣肚子朝上游。牠不覺得有問題，是你的方向反了。' },
    { id: 'du_tigerfish', name: '虎齒魚', rarity: 'good', shape: 'long', scale: 1.0, pattern: 'band2', value: 14400, minLen: 30, maxLen: 70,
      special: ['jaw'],
      colors: { body: '#c0b490', back: '#6e6444', belly: '#f4f0dc', fin: '#948a66', pattern: '#5f5638', tooth: '#fbf6e0' },
      desc: '牙齒閉起來的時候會露在唇外。漁夫不用手取鉤。' },
    { id: 'du_lates',   name: '金鱗巨鱸', rarity: 'good', shape: 'wide', scale: 1.02, pattern: 'scale', value: 13950, minLen: 45, maxLen: 110,
      colors: { body: '#c8b070', back: '#7f6a30', belly: '#f8f0cc', fin: '#a08c48', pattern: '#e4d09a' },
      desc: '出水的那一秒鱗片會反光，整條船的人都會安靜一下。' },

    /* --- 稀有 --- */
    { id: 'du_electric', name: '雷紋電鯰', rarity: 'rare', shape: 'wide', scale: 1.06, pattern: 'speck', value: 60500, minLen: 40, maxLen: 100,
      special: ['whisker', 'glow'],
      colors: { body: '#5f5a4a', back: '#332f26', belly: '#b8b09a', fin: '#464032', pattern: '#8fd8e8', glow: '#7fc8e0' },
      desc: '醫生曾經拿牠治頭痛。做法是叫病人把手放進水裡。' },
    { id: 'du_lapis',   name: '青金石鯉', rarity: 'rare', shape: 'round', scale: 1.0, pattern: 'scale', value: 59400, minLen: 30, maxLen: 70,
      special: ['glow'],
      colors: { body: '#3a5a9a', back: '#1c2c58', belly: '#c0d0ea', fin: '#2a4478', pattern: '#7f9fd8', glow: '#6f8fd0' },
      desc: '整條魚是青金石的顏色。那種藍在這條河的兩岸都挖不到。' },
    { id: 'du_ray',     name: '沙埋魟', rarity: 'rare', shape: 'ray', scale: 1.04, pattern: 'speck', value: 61200, minLen: 45, maxLen: 110,
      colors: { body: '#b49a68', back: '#6e5c34', belly: '#eee0bc', fin: '#8f7a48', pattern: '#7f6c40' },
      desc: '埋在沙裡只露出兩顆眼睛。踩到牠的人會記住一輩子。' },
    { id: 'du_moon',    name: '月影銀刀', rarity: 'rare', shape: 'flat', scale: 1.02, pattern: 'none', value: 58900, minLen: 35, maxLen: 85,
      special: ['glow'],
      colors: { body: '#dce4ea', back: '#8f9aa4', belly: '#ffffff', fin: '#b4c0ca', glow: '#e8f0f8' },
      desc: '薄到能透光。滿月的夜裡整群浮上來，遠看像水面裂了一道縫。' },

    /* --- 史詩（換成神話生物） --- */
    { id: 'du_ammit',   name: '吞心獸魚', rarity: 'epic', shape: 'wide', scale: 1.08, pattern: 'net', value: 237000, minLen: 90, maxLen: 200,
      special: ['glow', 'jaw'],
      colors: { body: '#4a3a2e', back: '#241b14', belly: '#a89078', fin: '#33281e', pattern: '#c8a05f', glow: '#ffb45f', tooth: '#f8f0d8' },
      desc: '天秤那一頭如果比較重，心就歸牠。牠在河底等，等的不是魚。' },
    { id: 'du_bennu',   name: '貝努鷺鰭魚', rarity: 'epic', shape: 'flat', scale: 1.1, pattern: 'band', value: 240000, minLen: 70, maxLen: 160,
      special: ['glow', 'finlet'],
      colors: { body: '#d88f4a', back: '#8a4a18', belly: '#f8dcac', fin: '#b06a28', pattern: '#ffd88f', glow: '#ff9f4f' },
      desc: '每隔很久燒起來一次，燒完從灰裡再游出來。沒有人算得準週期。' },

    /* --- 傳說 --- */
    { id: 'du_sobek',   name: '鱗甲河神「索貝克」', rarity: 'legend', shape: 'long', scale: 1.22, pattern: 'net', value: 656000, minLen: 120, maxLen: 260,
      special: ['glow', 'jaw', 'spike'],
      colors: { body: '#5f7a4a', back: '#2c3a20', belly: '#c8d4a8', fin: '#44583a', pattern: '#9fbc70', glow: '#8fd85f', tooth: '#f4f8e0' },
      legend: '牠既是保護的神也是吞噬的神，同一座廟裡兩種祭品都要放。船夫下水前會對著水面說一句話，內容各家不同，但每一家都有一句。牠不一定會聽，但沒說過的人，據說就沒再上過船。',
      desc: '同一位神，兩種祭品。' },
    { id: 'du_wadjet',  name: '聖眼金鱗「瓦吉特」', rarity: 'legend', shape: 'wide', scale: 1.18, pattern: 'spot', value: 663000, minLen: 100, maxLen: 220,
      special: ['glow', 'horn'],
      colors: { body: '#e0c05f', back: '#8f6a18', belly: '#fbf0c0', fin: '#b8963a', pattern: '#2f4a8a', glow: '#ffe08f', hornColor: '#fff8d8' },
      legend: '牠側身上的那一圈紋路是一隻眼睛，而且會跟著你移動——不是錯覺，換個角度它還是看著你。捕到牠的人通常會放回去。不是因為敬畏，是因為被那樣看著沒辦法動手。',
      desc: '身上那隻眼睛會跟著你。' },

    /* --- 魚王 --- */
    { id: 'du_king_osiris', name: '不死肺魚「歐西里斯」', rarity: 'king', shape: 'lungfish', scale: 1.3, pattern: 'speck', value: 2280000, minLen: 300, maxLen: 620,
      special: ['glow', 'filaments'],
      colors: { body: '#6a6a4a', back: '#332f1e', belly: '#c0bc90', fin: '#4a4830', pattern: '#c8a05f', glow: '#ffd07f', filament: '#e0c88f' },
      legend: '旱季來的時候河會整條乾掉，乾到裂開、乾到看不出這裡曾經有水。牠就埋在裂縫底下，把自己包起來，心跳降到一年幾次。然後洪水回來，牠從泥裡出來，跟去年一模一樣。牠被切成十四塊丟到各處的那次也是這樣回來的——所以這條河的人不太相信「死」這個字。',
      desc: '黃沙冥河之王。河乾了牠也還在。' }
  ];

  /* ============================================================
     地點九：澄澈方池（castCost 700，插在晨霧湖與落霞峽灣之間）
     識別方式跟前八個都不同：不是「什麼環境」也不是「哪條江」，而是
     **「這裡的每一條魚都是有人養的」**。所以配色規則反過來——
     人工選育的鮮豔色（紅白、朱、金、白）是**高階**的訊號，
     普通階全是灰褐色的野雜魚與飼料魚（那些是自己混進來的）。
     ============================================================ */
  const POND_FISH = [
    /* --- 雜物 --- */
    { id: 'gp_coins', name: '沉底的許願硬幣', rarity: 'junk', junkArt: 'coins', value: 9, minLen: 2, maxLen: 6, unit: 'cm', desc: '有人對著這座池子許過願。銅鏽把願望黏成了一塊。' },
    { id: 'gp_can',   name: '掉進池裡的空罐', rarity: 'junk', junkArt: 'can',   value: 6, minLen: 8, maxLen: 15, unit: 'cm', desc: '管理員每週撈一次，還是撈不完。' },
    { id: 'gp_duckweed', name: '一把浮萍',   rarity: 'junk', junkArt: 'weed',  value: 5, minLen: 10, maxLen: 30, unit: 'cm', desc: '長得比誰都快。三天不管，整池就是綠的。' },

    /* --- 普通（自己混進來的野雜魚與飼料魚，一律灰褐土色） --- */
    { id: 'gp_feeder', name: '飼料金魚', rarity: 'common', shape: 'round', scale: .70, pattern: 'none', value: 197, minLen: 4, maxLen: 12,
      colors: { body: '#a89a72', back: '#6a5f40', belly: '#ded4b4', fin: '#8a7c58' },
      desc: '一整袋幾十塊錢，本來是拿來餵別的魚的。這幾條活下來了。' },
    { id: 'gp_mosquito', name: '大肚魚', rarity: 'common', shape: 'long', scale: .56, pattern: 'none', value: 188, minLen: 2, maxLen: 6,
      colors: { body: '#9aa4a0', back: '#5a6460', belly: '#e4e8e4', fin: '#7c8684' },
      desc: '當初是為了吃孑孓才放的。現在牠們什麼都吃。' },
    { id: 'gp_bitterling', name: '石鮒', rarity: 'common', shape: 'flat', scale: .60, pattern: 'band', value: 202, minLen: 3, maxLen: 9,
      colors: { body: '#8f9488', back: '#525648', belly: '#e2e4d8', fin: '#6f7468', pattern: '#6a7a72' },
      desc: '沒有人放過牠。大概是黏在水草上被一起搬進來的。' },
    { id: 'gp_wakin', name: '和金', rarity: 'common', shape: 'normal', scale: .72, pattern: 'none', value: 213, minLen: 6, maxLen: 16,
      colors: { body: '#c88a4a', back: '#8a5620', belly: '#eed8ac', fin: '#a87038' },
      desc: '最不講究的一種金魚。廟會撈金魚撈到的就是牠，養得活的人不多。' },
    { id: 'gp_tilapia', name: '吳郭魚苗', rarity: 'common', shape: 'flat', scale: .70, pattern: 'stripe', value: 206, minLen: 5, maxLen: 14,
      colors: { body: '#8a8470', back: '#4e4a3a', belly: '#dcd8c0', fin: '#6a6554', pattern: '#3f3c30' },
      desc: '不知道誰倒進來的。管理員每年撈一次，每年還是有。' },
    { id: 'gp_paradise', name: '蓋斑鬥魚', rarity: 'common', shape: 'flat', scale: .62, pattern: 'stripe', value: 199, minLen: 3, maxLen: 8,
      colors: { body: '#7f8a94', back: '#485058', belly: '#e0e4e8', fin: '#c07050', pattern: '#5a6a80' },
      desc: '本來就住在這一帶的水田裡。池子蓋起來以後，牠們搬了進來。' },

    /* --- 優良（開始出現「養的」——但都還是便宜的品系） --- */
    { id: 'gp_hikoi', name: '緋鯉', rarity: 'good', shape: 'normal', scale: .86, pattern: 'none', value: 413, minLen: 18, maxLen: 42,
      colors: { body: '#d4703a', back: '#8f3e14', belly: '#f6dcb0', fin: '#b45526' },
      desc: '整條都是橘紅色，沒有花紋。錦鯉裡最不值錢的那一種，也是最耐活的。' },
    { id: 'gp_ryukin', name: '琉金', rarity: 'good', shape: 'round', scale: .80, pattern: 'scale', value: 404, minLen: 8, maxLen: 20,
      colors: { body: '#e0803a', back: '#9a4a12', belly: '#f8e0b0', fin: '#c06428', pattern: '#f0a860' },
      desc: '背高、尾長、游得慢。牠不是為了活下去被養成這樣的。' },
    { id: 'gp_oranda', name: '蘭壽', rarity: 'good', shape: 'round', scale: .78, pattern: 'speck', value: 420, minLen: 8, maxLen: 22,
      colors: { body: '#e8e2d4', back: '#a89e8a', belly: '#ffffff', fin: '#cfc6b4', pattern: '#d0603a' },
      desc: '頭上那團肉瘤要養三年才長得出來。有人為了那三年一整年不出門。' },
    { id: 'gp_grasscarp', name: '白鯇', rarity: 'good', shape: 'wide', scale: .88, pattern: 'scale', value: 399, minLen: 25, maxLen: 55,
      colors: { body: '#a0a688', back: '#5f6548', belly: '#e8ecd4', fin: '#7f856a', pattern: '#8a9070' },
      desc: '放牠進來是為了吃水草。牠吃完水草，然後開始吃睡蓮。' },
    { id: 'gp_pondcat', name: '池底鯰', rarity: 'good', shape: 'wide', scale: .84, pattern: 'speck', value: 425, minLen: 22, maxLen: 50,
      special: ['whisker'],
      colors: { body: '#6f6858', back: '#3d382c', belly: '#cfc8b0', fin: '#565040', pattern: '#928a76' },
      desc: '白天貼在排水口底下。管理員知道牠在，也知道抓不到。' },

    /* --- 稀有（有名字有血統的品系，配色開始「乾淨」） --- */
    { id: 'gp_kohaku', name: '紅白錦鯉', rarity: 'rare', shape: 'normal', scale: 1.00, pattern: 'spot', value: 1654, minLen: 30, maxLen: 66,
      special: ['whisker'],
      colors: { body: '#f6f2ec', back: '#d0c8bc', belly: '#ffffff', fin: '#e4dcd0', pattern: '#d0392c' },
      desc: '紅白兩色，界線要利落。這一條的界線很利落。' },
    { id: 'gp_platinum', name: '白金鯉', rarity: 'rare', shape: 'normal', scale: 1.00, pattern: 'scale', value: 1619, minLen: 28, maxLen: 64,
      colors: { body: '#dfe4e8', back: '#a8b0b8', belly: '#ffffff', fin: '#c4ccd4', pattern: '#f4f8fa' },
      desc: '沒有任何花紋，整條是一片金屬白。花紋是加分，沒有花紋是另一種考試。' },
    { id: 'gp_ranchu', name: '獅頭蘭壽', rarity: 'rare', shape: 'round', scale: .96, pattern: 'scale', value: 1595, minLen: 10, maxLen: 26,
      colors: { body: '#e8603a', back: '#9a3410', belly: '#fbe8c8', fin: '#c04a20', pattern: '#ffa068' },
      desc: '沒有背鰭，只能靠尾巴一晃一晃地走。比賽是從上往下看的，所以牠一輩子只被人看過背。' },
    { id: 'gp_shubunkin', name: '朱文金', rarity: 'rare', shape: 'normal', scale: .98, pattern: 'spot', value: 1677, minLen: 14, maxLen: 34,
      colors: { body: '#dfe6ea', back: '#98a4ac', belly: '#ffffff', fin: '#c0ccd4', pattern: '#3f6aa8' },
      desc: '白底上灑著藍、紅、黑三種斑。每一條的花色都不會重複，所以沒辦法配對重現。' },

    /* --- 史詩 --- */
    { id: 'gp_showa', name: '昭和三色', rarity: 'epic', shape: 'normal', scale: 1.06, pattern: 'spot', value: 6627, minLen: 45, maxLen: 95,
      special: ['whisker'],
      colors: { body: '#2a2620', back: '#141210', belly: '#e8e0d0', fin: '#3a352c', pattern: '#d0392c' },
      desc: '黑底上壓紅白。要三種顏色同時漂亮，養到第五年才知道成不成——不成的那些，早就被挑掉了。' },
    { id: 'gp_butterfly', name: '蝶尾長鰭鯉', rarity: 'epic', shape: 'long', scale: 1.08, pattern: 'scale', value: 6498, minLen: 40, maxLen: 90,
      special: ['glow'],
      colors: { body: '#e8d8a0', back: '#a89250', belly: '#fbf4dc', fin: '#f0e4b8', pattern: '#fff0c8', glow: '#ffe8a8' },
      desc: '鰭長到游動時像一塊布在飄。好看是好看，但在野外牠活不過一個晚上。' },

    /* --- 傳說 --- */
    { id: 'gp_ghost', name: '幽靈鯉', rarity: 'legend', shape: 'normal', scale: 1.16, pattern: 'scale', value: 17947, minLen: 60, maxLen: 120,
      special: ['glow', 'whisker'],
      colors: { body: '#cfd8dc', back: '#8a969c', belly: '#f6fafc', fin: '#b0bcc2', pattern: '#eef6f8', glow: '#dff0f8' },
      legend: '普通鯉魚跟白金鯉配出來的雜種，本來被當成失敗品。牠白天沉在底下完全看不見，只有半夜燈全關掉的時候才會浮上來——整條是灰白的，在黑水裡發著一點光。管理員說他當班二十年只看過三次，三次都不是同一個地方。',
      desc: '半夜才浮上來的那一條。' },
    { id: 'gp_tancho', name: '丹頂', rarity: 'legend', shape: 'normal', scale: 1.14, pattern: 'none', value: 18182, minLen: 55, maxLen: 115,
      special: ['glow', 'whisker'],
      colors: { body: '#fbfafa', back: '#d4d0cc', belly: '#ffffff', fin: '#e8e4e0', glow: '#ffd0c8' },
      legend: '全白的身體，額頭正中央一個正圓的紅點——那個點不能歪、不能大、不能小。育種的人可以控制紅色出現的機率，但控制不了它出現在哪裡。所以每一條丹頂都是意外，而每一個養錦鯉的人一輩子都在等那個意外。',
      desc: '額頭上那個正圓的紅點是意外。' },

    /* --- 魚王 --- */
    { id: 'gp_king_hyaku', name: '白鱗池主「百年」', rarity: 'king', shape: 'koi', scale: 1.28, pattern: 'scale', value: 69794, minLen: 110, maxLen: 200,
      special: ['glow', 'whisker'], cyOffset: 1,
      colors: { body: '#e4e8ea', back: '#9aa4aa', belly: '#ffffff', fin: '#c4d0d6', pattern: '#f6fafc', glow: '#bfe4f0' },
      legend: '這座池子是六十年前挖的，牠比池子還老——原本住在被填掉的那條野溪裡，施工時被人用網子撈起來放進來。錦鯉可以活兩百年，這件事本身不算稀奇；稀奇的是這六十年間換過十一位管理員，每一位交接時都會講同一句話：「那條白的不要餵，牠不吃你給的東西。」沒有人問過為什麼，也沒有人試過。',
      desc: '澄澈方池之王。牠比這座池子還老。' }
  ];

  /* ============================================================
     地點十：潮落礁灘（castCost 2,300，插在宵櫻神域與幽藍冰湖之間）
     配色規則：礁岩的褐綠 × 濕沙的灰白。稀有以上換成**潮池裡的螢光色**
     （海葵的桃紅、孔雀藍、鸚哥的青綠）——在一整片灰褐裡那些顏色會直接跳出來。
     魚種的共同點是「困在水窪裡等漲潮」：耐乾、能爬、能鑽沙、能吸附。
     ============================================================ */
  const TIDAL_FISH = [
    /* --- 雜物 --- */
    { id: 'tf_shell',  name: '空的笠貝殼',   rarity: 'junk', junkArt: 'shell',  value: 28, minLen: 3,  maxLen: 9,  unit: 'cm', desc: '裡面的東西不在了。殼還牢牢吸在石頭上，被你連石頭一起撬起來。' },
    { id: 'tf_float',  name: '卡住的浮球',   rarity: 'junk', junkArt: 'bottle', value: 24, minLen: 12, maxLen: 30, unit: 'cm', desc: '塞在礁縫裡不知道幾年，拔出來時下面壓死了一片藤壺。' },
    { id: 'tf_kelp',   name: '乾掉的馬尾藻', rarity: 'junk', junkArt: 'weed',   value: 22, minLen: 20, maxLen: 70, unit: 'cm', desc: '退潮曬了半天，脆得一碰就碎。' },

    /* --- 普通 --- */
    { id: 'tf_skipper', name: '彈塗魚', rarity: 'common', shape: 'long', scale: .62, pattern: 'speck', value: 241, minLen: 5, maxLen: 14,
      colors: { body: '#7f7460', back: '#453e30', belly: '#cfc6ac', fin: '#5f5748', pattern: '#3a3428' },
      desc: '退潮以後牠不躲，牠出來。用兩隻胸鰭在泥上撐著走，看到人才慢慢挪開。' },
    { id: 'tf_blenny', name: '岩鳚', rarity: 'common', shape: 'long', scale: .66, pattern: 'band2', value: 248, minLen: 6, maxLen: 16,
      colors: { body: '#6f7a5a', back: '#3c4430', belly: '#d8dcc0', fin: '#54604a', pattern: '#2e3524' },
      desc: '整條塞在石縫裡，只把頭伸出來。你走過去牠縮回去，你走遠牠又伸出來。' },
    { id: 'tf_stickle', name: '潮池刺魚', rarity: 'common', shape: 'flat', scale: .58, pattern: 'stripe', value: 235, minLen: 3, maxLen: 8,
      special: ['spike'],
      colors: { body: '#9aa49c', back: '#565f58', belly: '#e8ece4', fin: '#7a847c', pattern: '#464f48' },
      desc: '背上三根硬刺。體型跟一節手指一樣，卻會為了一個水窪跟任何東西打架。' },
    { id: 'tf_shanny', name: '礁窟幼鮨', rarity: 'common', shape: 'round', scale: .64, pattern: 'spot', value: 254, minLen: 4, maxLen: 11,
      colors: { body: '#8a7460', back: '#4e4034', belly: '#ded0bc', fin: '#6a5848', pattern: '#332a20' },
      desc: '長大以後會去外海。現在牠只知道這一個水窪有多大。' },
    { id: 'tf_sandeel', name: '玉筋魚', rarity: 'common', shape: 'long', scale: .60, pattern: 'none', value: 243, minLen: 5, maxLen: 15,
      colors: { body: '#c0c8c4', back: '#76807c', belly: '#f6faf8', fin: '#98a29e' },
      desc: '受驚就整條鑽進沙裡，一秒都不到。你要挖到牠，得比牠快。' },
    { id: 'tf_clingfish', name: '吸盤魚', rarity: 'common', shape: 'round', scale: .60, pattern: 'net', value: 250, minLen: 3, maxLen: 8,
      colors: { body: '#a88a7a', back: '#5f4a3e', belly: '#e8d8cc', fin: '#846a5c', pattern: '#6a544a' },
      desc: '腹部整片是吸盤，浪打過來牠一動也不動。你要用鏟子才撬得下來。' },

    /* --- 優良 --- */
    { id: 'tf_rockfish', name: '礁石鮋', rarity: 'good', shape: 'flat', scale: .86, pattern: 'spot', value: 843, minLen: 14, maxLen: 32,
      special: ['spike'],
      colors: { body: '#8a6a52', back: '#4e3a28', belly: '#e0cbb0', fin: '#6a5040', pattern: '#2e2218' },
      desc: '長得就是一塊石頭。每年都有人一腳踩上去，然後被抬走。' },
    { id: 'tf_mullet', name: '灘頭鯔', rarity: 'good', shape: 'wide', scale: .90, pattern: 'none', value: 824, minLen: 22, maxLen: 48,
      colors: { body: '#a4b0b4', back: '#5a666a', belly: '#f2f6f8', fin: '#818d92' },
      desc: '漲潮第一批進來的就是牠們，退潮最後一批走的也是。' },
    { id: 'tf_eelpout', name: '潮溝鰻鳚', rarity: 'good', shape: 'long', scale: .92, pattern: 'speck', value: 854, minLen: 25, maxLen: 55,
      colors: { body: '#5f6a5a', back: '#333a2e', belly: '#c4ccb8', fin: '#485144', pattern: '#8a9480' },
      desc: '離開水以後還能撐好幾個小時。牠不是在等你放手，牠是在等漲潮。' },
    { id: 'tf_flounder', name: '沙潛鰈', rarity: 'good', shape: 'flat', scale: .88, pattern: 'speck', value: 811, minLen: 16, maxLen: 38,
      colors: { body: '#a89880', back: '#5f5442', belly: '#eee4d4', fin: '#847660', pattern: '#4a4034' },
      desc: '把自己抖進沙裡只要三下。抖完你就找不到牠了，就算你一直看著。' },
    { id: 'tf_wrasse', name: '潮池隆頭魚', rarity: 'good', shape: 'flat', scale: .84, pattern: 'band2', value: 839, minLen: 12, maxLen: 28,
      colors: { body: '#4f8a7a', back: '#28504a', belly: '#e0e8d8', fin: '#c07a4a', pattern: '#7fc0a8' },
      desc: '天一黑就找個縫把自己塞進去，還會分泌一層黏膜把自己包起來睡。' },

    /* --- 稀有（潮池的螢光色開始出現） --- */
    { id: 'tf_anemonefish', name: '礁窟小丑魚', rarity: 'rare', shape: 'flat', scale: 1.00, pattern: 'band', value: 3714, minLen: 6, maxLen: 14,
      colors: { body: '#e8843a', back: '#a04a10', belly: '#f8dcb0', fin: '#2a2620', pattern: '#fbf6ec' },
      desc: '牠住的那顆海葵被留在退潮的水窪裡。海葵不會走，所以牠也不走。' },
    { id: 'tf_moray', name: '石縫裸胸鱔', rarity: 'rare', shape: 'long', scale: 1.06, pattern: 'net', value: 3650, minLen: 40, maxLen: 95,
      special: ['jaw'],
      colors: { body: '#6a6a4a', back: '#3a3a28', belly: '#cfc8a0', fin: '#50503a', pattern: '#c8bc84', tooth: '#f6f0dc' },
      desc: '整條在石頭底下，只有頭伸出來一開一合。那不是威嚇，牠只是在呼吸。' },
    { id: 'tf_parrot', name: '青嘴鸚哥', rarity: 'rare', shape: 'flat', scale: 1.02, pattern: 'scale', value: 3735, minLen: 20, maxLen: 45,
      colors: { body: '#3fa8a0', back: '#1f5f5c', belly: '#d8f0e8', fin: '#d86a8a', pattern: '#7fe0cc' },
      desc: '嘴是一塊硬骨板，專門啃珊瑚。這片礁灘的沙有一半是牠們拉出來的。' },
    { id: 'tf_pipefish', name: '潮池海龍', rarity: 'rare', shape: 'long', scale: 1.04, pattern: 'stripe', value: 3618, minLen: 10, maxLen: 26,
      colors: { body: '#8f9a5a', back: '#4e5528', belly: '#e0e8c0', fin: '#6f7a40', pattern: '#c8d888' },
      desc: '直挺挺地立在海草中間，隨著水擺。你會先看到海草有一根不太對。' },

    /* --- 史詩 --- */
    { id: 'tf_boxfish', name: '藍點箱魨', rarity: 'epic', shape: 'round', scale: 1.08, pattern: 'spot', value: 14300, minLen: 15, maxLen: 34,
      special: ['glow'],
      colors: { body: '#e8c84a', back: '#9a7a10', belly: '#fbf0b8', fin: '#c0a030', pattern: '#2f5fc8', glow: '#ffe07f' },
      desc: '整條魚外面是一個硬殼盒子，只有嘴和鰭會動。被逼急了會從皮膚放毒，把整個水窪一起帶走。' },
    { id: 'tf_frogfish', name: '擬態躄魚', rarity: 'epic', shape: 'round', scale: 1.06, pattern: 'net', value: 14172, minLen: 12, maxLen: 30,
      special: ['lantern', 'glow'],
      colors: { body: '#c05a4a', back: '#7a2a20', belly: '#f0c8a8', fin: '#9a3f30', pattern: '#5f1f18', glow: '#ff9a7f', lantern: '#ffd8a0' },
      desc: '牠不游，牠用鰭在石頭上走。頭上那根是釣竿，垂下來的那一小塊在水裡看起來像一隻蝦。' },

    /* --- 傳說 --- */
    { id: 'tf_mandarin', name: '螢紋連鰭䲗', rarity: 'legend', shape: 'flat', scale: 1.14, pattern: 'net', value: 39060, minLen: 8, maxLen: 18,
      special: ['glow'],
      colors: { body: '#2f5fa8', back: '#16305f', belly: '#a8d0e8', fin: '#e88f3a', pattern: '#5fe0a8', glow: '#7fd8ff' },
      legend: '牠身上的藍不是色素，是皮膚裡一層排列整齊的細胞在折射光——所以那個藍在標本上會消失，只有活著、在水裡、有光的時候才存在。潮池的水淺，太陽一斜整窪水就變成一面鏡子，那幾分鐘裡牠會亮得不像真的。看過的人回去查圖鑑，都覺得照片拍錯了。',
      desc: '牠的藍只在活著的時候存在。' },
    { id: 'tf_stranded', name: '擱淺者', rarity: 'legend', shape: 'long', scale: 1.20, pattern: 'none', value: 39486, minLen: 90, maxLen: 190,
      special: ['glow'],
      colors: { body: '#e0e8ea', back: '#98a4aa', belly: '#ffffff', fin: '#c0ccd0', glow: '#e8f4f8' },
      legend: '大退潮的隔天早上，灘上偶爾會出現一條很長的銀色的魚，躺在一個明明裝不下牠的水窪裡。牠還活著，而且不掙扎。老一輩的說法是牠自己上來的，因為在深處看見了不該看的東西；比較新的說法是牠只是算錯了潮汐。兩種說法都解釋不了為什麼牠總是頭朝著海。',
      desc: '躺在裝不下牠的水窪裡，頭朝著海。' },

    /* --- 魚王 --- */
    { id: 'tf_king_kotaku', name: '灘王巨彈塗「涸澤」', rarity: 'king', shape: 'skipper', scale: 1.30, pattern: 'speck', value: 159546, minLen: 80, maxLen: 170,
      special: ['glow', 'stalkEye'], cyOffset: 1,
      colors: { body: '#6a6046', back: '#332e20', belly: '#c8c0a0', fin: '#4e4634', pattern: '#a89a70', glow: '#ffcf7f', eyeWhite: '#f6f2e0', pupil: '#141a20' },
      legend: '「涸澤之鮒」講的是一條困在乾掉的車轍裡的魚，等著誰給牠一斗水。這一條沒有在等。牠在灘上已經待了不知道多久，漲潮時牠不回海裡，退潮時牠也不著急——牠只是換一個水窪。有人在夜裡看過牠橫越整片灘地，用鰭撐著走，中間停下來一次，把兩顆眼睛轉過來看了那個人很久。',
      desc: '潮落礁灘之王。牠不等漲潮。' }
  ];

  /* ============================================================
     地點十一：懸瀑深潭（castCost 4,400，插在幽藍冰湖與煙雨蓮江之間）
     配色規則：深潭的墨綠 × 白沫，稀有以上開始出現**婚姻色**（緋紅、青綠）。
     魚種的共同點是「每一條都在往上」：能逆流、能跳、能吸附在垂直的岩面上。
     這是這個釣點跟其他釣點的分界——別的地方講「住在哪」，這裡講「要去哪」。
     ============================================================ */
  const FALL_FISH = [
    /* --- 雜物 --- */
    { id: 'fp_flask', name: '凹陷的水壺',   rarity: 'junk', junkArt: 'flask', value: 52, minLen: 15, maxLen: 26, unit: 'cm', desc: '從上面掉下來的。凹的那一面告訴你它撞過幾次岩壁。' },
    { id: 'fp_can',   name: '捲成一團的鋁罐', rarity: 'junk', junkArt: 'can',  value: 44, minLen: 6,  maxLen: 12, unit: 'cm', desc: '被水沖了很久，捲得像一朵金屬做的花。' },
    { id: 'fp_rope',  name: '沖下來的登山繩', rarity: 'junk', junkArt: 'weed', value: 48, minLen: 40, maxLen: 120, unit: 'cm', desc: '斷面是整齊的，不是磨斷的。有人在上面切斷了它。' },

    /* --- 普通 --- */
    { id: 'fp_dace', name: '溪哥仔', rarity: 'common', shape: 'long', scale: .68, pattern: 'stripe', value: 393, minLen: 6, maxLen: 16,
      colors: { body: '#9fb0b4', back: '#546468', belly: '#f0f6f6', fin: '#7c8c90', pattern: '#5f7480' },
      desc: '整條溪最吵的一種。餌一落水牠們就衝過來，衝到你以為底下全是牠。' },
    { id: 'fp_hillstream', name: '爬岩鰍', rarity: 'common', shape: 'long', scale: .62, pattern: 'speck', value: 402, minLen: 4, maxLen: 11,
      colors: { body: '#6a6250', back: '#3a352a', belly: '#c8c0a8', fin: '#514a3c', pattern: '#8f8874' },
      desc: '整片胸鰭腹鰭癒合成一個吸盤，吸在瀑布正下方那塊岩上。水從牠背上過，牠不動。' },
    { id: 'fp_whitefin', name: '白甲魚', rarity: 'common', shape: 'normal', scale: .72, pattern: 'none', value: 390, minLen: 10, maxLen: 24,
      colors: { body: '#b0bcbc', back: '#667274', belly: '#f4f8f8', fin: '#8f9c9c' },
      desc: '嘴長在下面，橫著在石頭上刮藻。刮過的地方會留下一道一道白痕。' },
    { id: 'fp_bullhead', name: '潭底杜父魚', rarity: 'common', shape: 'round', scale: .68, pattern: 'speck', value: 408, minLen: 5, maxLen: 13,
      colors: { body: '#5f5f52', back: '#333330', belly: '#c0c0b0', fin: '#464638', pattern: '#8a8a74' },
      desc: '趴在潭底的碎石堆裡，沒有魚鰾，所以牠沉得住。' },
    { id: 'fp_stone', name: '石賓', rarity: 'common', shape: 'normal', scale: .74, pattern: 'band2', value: 395, minLen: 8, maxLen: 20,
      colors: { body: '#8a9088', back: '#4c5250', belly: '#e4e8e0', fin: '#6a7068', pattern: '#3a4040' },
      desc: '身上七八條淡淡的橫紋。放進水桶裡半小時，紋就淡到看不見了。' },
    { id: 'fp_shiner', name: '苦花', rarity: 'common', shape: 'flat', scale: .70, pattern: 'none', value: 404, minLen: 8, maxLen: 22,
      colors: { body: '#c4ccc8', back: '#7a8480', belly: '#f8fafa', fin: '#a0aaa6' },
      desc: '翻身刮藻的那一瞬間側面會反光。整潭一起翻的時候，水底像有人在打閃。' },

    /* --- 優良 --- */
    { id: 'fp_squaliobarbus', name: '赤眼鱒', rarity: 'good', shape: 'normal', scale: .88, pattern: 'scale', value: 1407, minLen: 20, maxLen: 46,
      colors: { body: '#a8b0a4', back: '#5c6458', belly: '#eef2ea', fin: '#848c80', pattern: '#c85a3a' },
      desc: '眼睛上緣一抹紅。除此之外沒有任何地方引人注意，牠似乎也知道。' },
    { id: 'fp_hemibarbus', name: '花鮕', rarity: 'good', shape: 'wide', scale: .90, pattern: 'spot', value: 1428, minLen: 22, maxLen: 50,
      special: ['whisker'],
      colors: { body: '#9a9078', back: '#544e3c', belly: '#e8e2cc', fin: '#78705c', pattern: '#3a3428' },
      desc: '在急流跟緩流的交界處守著。水一慢，牠就把頭轉過去。' },
    { id: 'fp_torrent', name: '激流吸盤鰍', rarity: 'good', shape: 'long', scale: .84, pattern: 'net', value: 1394, minLen: 12, maxLen: 28,
      colors: { body: '#6f6a5f', back: '#3c3830', belly: '#cfc8b8', fin: '#565048', pattern: '#a09680' },
      desc: '水流越急牠貼得越牢。把牠從石頭上撕下來，石頭上會留下一個乾淨的圓。' },
    { id: 'fp_climber', name: '禿頭鯊', rarity: 'good', shape: 'long', scale: .86, pattern: 'speck', value: 1446, minLen: 10, maxLen: 24,
      colors: { body: '#6a7060', back: '#3a3e34', belly: '#d0d4c4', fin: '#505648', pattern: '#8f9480' },
      desc: '牠是從海裡游上來的，一路逆流，遇到瀑布就用腹部的吸盤一寸一寸爬上去。這座瀑布二十公尺高，牠爬上來了。' },
    { id: 'fp_anguilla', name: '潭底鱸鰻', rarity: 'good', shape: 'long', scale: .94, pattern: 'speck', value: 1413, minLen: 40, maxLen: 90,
      colors: { body: '#5a5f4a', back: '#2e332a', belly: '#c0c4a8', fin: '#42473a', pattern: '#8a8f70' },
      desc: '白天塞在瀑布後面的岩洞裡。那個洞有多深，沒有人量過，因為沒有人想把手伸進去。' },

    /* --- 稀有（婚姻色出現） --- */
    { id: 'fp_landlocked', name: '陸封櫻花鉤吻鮭', rarity: 'rare', shape: 'wide', scale: 1.02, pattern: 'spot', value: 6223, minLen: 25, maxLen: 55,
      colors: { body: '#8fa0a8', back: '#4e5c64', belly: '#f2eee2', fin: '#6e7e86', pattern: '#3a4650' },
      desc: '牠的祖先本來要回海裡。冰河退了，路斷了，牠們就留在這一段溪裡，留了一萬年。' },
    { id: 'fp_mahseer', name: '金鱗結魚', rarity: 'rare', shape: 'wide', scale: 1.04, pattern: 'scale', value: 6140, minLen: 35, maxLen: 80,
      special: ['whisker'],
      colors: { body: '#c8ac60', back: '#7f6828', belly: '#f6ecc0', fin: '#a08c40', pattern: '#e0c888' },
      desc: '鱗片有指甲那麼大，一片一片數得出來。上鉤之後牠會直接往瀑布衝，很多人的線就是這樣斷的。' },
    { id: 'fp_snakehead', name: '潭中鱧', rarity: 'rare', shape: 'long', scale: 1.02, pattern: 'band2', value: 6202, minLen: 30, maxLen: 70,
      special: ['jaw'],
      colors: { body: '#4f5a48', back: '#282e24', belly: '#c0c8ac', fin: '#3a4234', pattern: '#8f9a78', tooth: '#f0f4e0' },
      desc: '會浮上來換氣，所以水再濁牠都活得下去。護幼的時候誰靠近牠咬誰，包括你的浮標。' },
    { id: 'fp_bigeye', name: '深潭大眼鱒', rarity: 'rare', shape: 'normal', scale: 1.00, pattern: 'speck', value: 6150, minLen: 28, maxLen: 62,
      colors: { body: '#5f7480', back: '#324048', belly: '#dfe8ec', fin: '#485c66', pattern: '#9fb8c4', eyeWhite: '#e8f4f8' },
      desc: '潭底沒什麼光，所以牠的眼睛長得比別的鱒大上一號。牠看得見你，你看不見牠。' },

    /* --- 史詩 --- */
    { id: 'fp_thunder', name: '雷紋巨鱒', rarity: 'epic', shape: 'wide', scale: 1.10, pattern: 'band2', value: 24142, minLen: 70, maxLen: 150,
      special: ['glow'],
      colors: { body: '#5f6a7a', back: '#2e3642', belly: '#dfe6ee', fin: '#454f5c', pattern: '#8fd0e8', glow: '#9fd8ff' },
      desc: '側線那兩道會在暗處泛光，形狀每次都不一樣。瀑布的水聲蓋掉一切聲音，所以牠上鉤的時候你只會看到竿子彎下去。' },
    { id: 'fp_veil', name: '白沫幻鰭', rarity: 'epic', shape: 'flat', scale: 1.08, pattern: 'none', value: 23934, minLen: 40, maxLen: 90,
      special: ['glow'],
      colors: { body: '#eef4f4', back: '#b4c0c0', belly: '#ffffff', fin: '#d8e4e4', glow: '#f0fafa' },
      desc: '只在落水點那一片翻湧的白沫裡出現。一游出泡沫區就看不見了——不是躲起來，是牠本來就跟泡沫一個顏色。' },

    /* --- 傳說 --- */
    { id: 'fp_curtain', name: '水簾白魚', rarity: 'legend', shape: 'flat', scale: 1.18, pattern: 'none', value: 66182, minLen: 50, maxLen: 110,
      special: ['glow'],
      colors: { body: '#dfe8ea', back: '#98a8ac', belly: '#ffffff', fin: '#bcc8cc', glow: '#dff2f8' },
      legend: '瀑布後面有一段空的，寬到可以站三個人。裡面的水很靜，因為整道瀑布把它跟外面隔開了。牠住在那裡，整條半透明，貼著岩壁不動。從外面看不到裡面，從裡面看得到外面——所以第一個進去的人說，牠當時正對著水簾，像在看一場放了很久的電影。',
      desc: '住在瀑布後面那一段。' },
    { id: 'fp_roar', name: '轟聲巨鮠', rarity: 'legend', shape: 'long', scale: 1.20, pattern: 'speck', value: 66598, minLen: 100, maxLen: 220,
      special: ['glow', 'whisker'],
      colors: { body: '#4a4f4a', back: '#242824', belly: '#b4bcb0', fin: '#363a36', pattern: '#8a9284', glow: '#a8d8b0' },
      legend: '瀑布的聲音是連續的，所以任何規律的東西都會被聽出來。潭邊的人偶爾會聽到水聲底下有一組低頻的、每隔幾秒一次的悶響——像很大的東西在很深的地方換氣。錄下來拿去分析，週期是穩定的。但只要有人下水，那個週期就停了，一整天都不會回來。',
      desc: '你只會聽到牠，聽到那組規律的悶響。' },

    /* --- 魚王 --- */
    { id: 'fp_king_gyakuryu', name: '躍瀑巨鮭「逆流」', rarity: 'king', shape: 'leaper', scale: 1.30, pattern: 'band', value: 256404, minLen: 150, maxLen: 290,
      special: ['glow', 'kype'], cyOffset: 1,
      colors: { body: '#a8483a', back: '#5f1e16', belly: '#f0dcc0', fin: '#7f3024', pattern: '#3f6a5a', glow: '#ff9f6a', kype: '#8a2f22', tooth: '#f8f0dc' },
      legend: '每年秋天牠都會來一次，在潭裡繞三圈，然後開始跳。二十公尺的瀑布，牠跳得到的高度大概是六公尺——所以牠一次都沒有成功過，而牠已經來了不知道多少年。潭邊的人不阻止牠，也不幫牠；有人試著在中段架過梯道，牠繞開了。牠要的顯然不是上去，是跳。',
      desc: '懸瀑深潭之王。牠一次都沒成功過。' }
  ];

  /* ============================================================
     地點十二：硫煙湯湖（castCost 9,000，插在煙雨蓮江與深淵海溝之間）
     配色規則：玄武岩的黑紫 × 硫磺黃 × 溫泉的乳青。
     稀有以上一律帶 glow，而且是**暖光**——這是刻意跟深淵海溝對照的：
     那裡是「沒有光所以自己發冷光」，這裡是「太燙所以自己在發熱」。
     兩個釣點在圖鑑裡並排時，一眼就分得出誰是哪一邊。
     神話取自玻里尼西亞的火山女神佩蕾一系，是這個遊戲第五種文化來源。
     ============================================================ */
  const CALDERA_FISH = [
    /* --- 雜物 --- */
    { id: 'cd_brimstone', name: '硫磺結晶塊', rarity: 'junk', junkArt: 'brimstone', value: 105, minLen: 5,  maxLen: 18, unit: 'cm', desc: '拿在手上會沾一層黃粉，洗三次才洗得掉，味道洗不掉。' },
    { id: 'cd_can',       name: '熔了一半的鐵罐', rarity: 'junk', junkArt: 'can',   value: 92, minLen: 6,  maxLen: 14, unit: 'cm', desc: '不知道掉進哪個噴氣孔又被推出來的。上半截還是罐子，下半截已經不是了。' },
    { id: 'cd_algae',     name: '一團嗜熱藻',   rarity: 'junk', junkArt: 'weed',    value: 98, minLen: 15, maxLen: 50, unit: 'cm', desc: '在七十度的水裡活得很好。撈上來遇到冷空氣，兩分鐘就變成一團灰。' },

    /* --- 普通（真的活在鹼湖與溫泉裡的魚種） --- */
    { id: 'cd_alcolapia', name: '鹼湖麗魚', rarity: 'common', shape: 'flat', scale: .74, pattern: 'band', value: 716, minLen: 5, maxLen: 12,
      colors: { body: '#a89858', back: '#5f5424', belly: '#e8dcae', fin: '#84763c', pattern: '#4a4220' },
      desc: '這片水的 pH 值接近漂白水。牠不只活著，牠還在這裡產卵。' },
    { id: 'cd_pupfish', name: '溫泉鱂', rarity: 'common', shape: 'long', scale: .58, pattern: 'speck', value: 732, minLen: 2, maxLen: 6,
      colors: { body: '#7f8f9a', back: '#465058', belly: '#dfe8ec', fin: '#64727c', pattern: '#8fc0c8' },
      desc: '全世界只有這一池有。整個物種加起來不到兩百條，而牠們從來沒想過要離開。' },
    { id: 'cd_hottilapia', name: '湯口吳郭', rarity: 'common', shape: 'flat', scale: .78, pattern: 'scale', value: 710, minLen: 10, maxLen: 26,
      colors: { body: '#8f8468', back: '#4e4634', belly: '#dcd4b8', fin: '#6c634c', pattern: '#b0a684' },
      desc: '別的地方牠只是普通的吳郭魚。在這裡牠是唯一撐得住四十度水溫的大型魚。' },
    { id: 'cd_mudloach', name: '泥火山鰍', rarity: 'common', shape: 'long', scale: .70, pattern: 'speck', value: 738, minLen: 6, maxLen: 18,
      special: ['whisker'],
      colors: { body: '#6a5f4a', back: '#3a3428', belly: '#c8c0a4', fin: '#514a38', pattern: '#948a6c' },
      desc: '住在會冒泡的那一區。泡是硫化氫，牠聞不到，或者牠不在意。' },
    { id: 'cd_gudgeon', name: '硫底鰕虎', rarity: 'common', shape: 'round', scale: .66, pattern: 'spot', value: 722, minLen: 3, maxLen: 9,
      colors: { body: '#a89a5a', back: '#5f5624', belly: '#e8e0b0', fin: '#847838', pattern: '#3a3418' },
      desc: '趴在黃色的結晶上，體色跟結晶一模一樣。撈起來以後才發現手上多了一條。' },
    { id: 'cd_killifish', name: '蒸氣鱂', rarity: 'common', shape: 'long', scale: .60, pattern: 'stripe', value: 726, minLen: 3, maxLen: 8,
      colors: { body: '#b0bcb8', back: '#647070', belly: '#f2f8f6', fin: '#8c9894', pattern: '#7f9490' },
      desc: '整群貼在水面下一公分處，蒸氣從牠們背上飄過去。那是這座湖最涼的一層。' },

    /* --- 優良 --- */
    { id: 'cd_hotcarp', name: '湯鯉', rarity: 'good', shape: 'normal', scale: .88, pattern: 'scale', value: 2695, minLen: 22, maxLen: 50,
      special: ['whisker'],
      colors: { body: '#b09858', back: '#655324', belly: '#eee0b0', fin: '#8a7640', pattern: '#c8b078' },
      desc: '在這種水溫裡牠長得比別處快一倍，也老得比別處快一倍。' },
    { id: 'cd_venteel', name: '熱泉鰻', rarity: 'good', shape: 'long', scale: .94, pattern: 'none', value: 2756, minLen: 35, maxLen: 80,
      colors: { body: '#5a4f48', back: '#2e2824', belly: '#bcb0a4', fin: '#443c36' },
      desc: '整條纏在噴氣孔的邊上。那裡的水燙到手伸不進去，牠待了一整個晚上。' },
    { id: 'cd_basalt', name: '玄武岩杜父魚', rarity: 'good', shape: 'round', scale: .80, pattern: 'net', value: 2675, minLen: 10, maxLen: 24,
      special: ['spike'],
      colors: { body: '#4a4650', back: '#26242c', belly: '#aaa4b0', fin: '#363340', pattern: '#6f6a78' },
      desc: '黑得跟湖底的石頭一樣，連表面那些六角形的裂紋都學到了。' },
    { id: 'cd_barb', name: '硫紋䰾', rarity: 'good', shape: 'normal', scale: .86, pattern: 'band2', value: 2727, minLen: 15, maxLen: 36,
      colors: { body: '#c8b060', back: '#7f6a24', belly: '#f4ecc0', fin: '#a08c3c', pattern: '#4e4218' },
      desc: '身上兩道深黃的橫帶，位置跟岸邊結晶階地的層次剛好對得上。' },
    { id: 'cd_hotcat', name: '湯底鯰', rarity: 'good', shape: 'wide', scale: .88, pattern: 'speck', value: 2742, minLen: 25, maxLen: 55,
      special: ['whisker'],
      colors: { body: '#6f6350', back: '#3d3628', belly: '#cfc6a8', fin: '#565040', pattern: '#948a70' },
      desc: '湖底最深那一層水是冷的。牠白天待在那裡，晚上才上來，上來的時候身上會冒煙。' },

    /* --- 稀有（暖光開始出現） --- */
    { id: 'cd_ember', name: '餘燼緋鱗', rarity: 'rare', shape: 'wide', scale: 1.02, pattern: 'speck', value: 11867, minLen: 30, maxLen: 70,
      special: ['glow'],
      colors: { body: '#c05a2a', back: '#7a2a0c', belly: '#f6d4a8', fin: '#9a4018', pattern: '#ffb45f', glow: '#ff8f3a' },
      desc: '鱗片邊緣泛著橘紅，像一塊還沒完全熄掉的炭。摸起來是溫的——不是水的溫度，是牠自己的。' },
    { id: 'cd_malachite', name: '孔雀石鯉', rarity: 'rare', shape: 'normal', scale: 1.00, pattern: 'scale', value: 11666, minLen: 30, maxLen: 68,
      special: ['glow'],
      colors: { body: '#3f9a7a', back: '#1c5040', belly: '#c8ecd8', fin: '#2c7058', pattern: '#7fe0b0', glow: '#5fd8a0' },
      desc: '那個綠是銅的顏色。湖底的礦脈裡有銅，而牠吃湖底的東西吃了一輩子。' },
    { id: 'cd_obsidian', name: '黑曜刀魚', rarity: 'rare', shape: 'flat', scale: 1.04, pattern: 'none', value: 11787, minLen: 35, maxLen: 80,
      colors: { body: '#2a2630', back: '#131118', belly: '#6a6478', fin: '#1e1c24' },
      desc: '薄、黑、邊緣鋒利。從側面看幾乎看不見牠，從正面看只有一條線。' },
    { id: 'cd_vent', name: '噴氣孔盲魚', rarity: 'rare', shape: 'long', scale: 1.00, pattern: 'none', value: 11716, minLen: 20, maxLen: 46,
      special: ['glow'],
      colors: { body: '#e0d4c4', back: '#a89a86', belly: '#f8f2e8', fin: '#c4b8a4', glow: '#ffd8a8' },
      desc: '沒有眼睛，皮膚是透明的偏白。牠靠側線感覺水溫的變化，往燙的那一邊走。' },

    /* --- 史詩 --- */
    { id: 'cd_magma', name: '熔岩紋巨鯙', rarity: 'epic', shape: 'long', scale: 1.10, pattern: 'net', value: 46262, minLen: 90, maxLen: 200,
      special: ['glow', 'jaw'],
      colors: { body: '#3a2a2a', back: '#1a1212', belly: '#8f7060', fin: '#282020', pattern: '#e8703a', glow: '#ff8f4f', tooth: '#f8f0dc' },
      desc: '黑底上一條條橘紅的網紋，像冷卻中的熔岩表面那些還沒閉合的縫。牠不咬人，牠只是不肯鬆口。' },
    { id: 'cd_geyser', name: '間歇泉躍魚', rarity: 'epic', shape: 'wide', scale: 1.08, pattern: 'band', value: 46061, minLen: 60, maxLen: 140,
      special: ['glow'],
      colors: { body: '#c8c0b0', back: '#787064', belly: '#f8f4ec', fin: '#a09888', pattern: '#ffb45f', glow: '#ffd8a0' },
      desc: '間歇泉每隔四十分鐘噴一次，牠每隔四十分鐘被噴出水面一次。牠不躲，牠好像很期待那一下。' },

    /* --- 傳說 --- */
    { id: 'cd_pele', name: '佩蕾之髮', rarity: 'legend', shape: 'long', scale: 1.20, pattern: 'speck', value: 126517, minLen: 80, maxLen: 180,
      special: ['glow', 'filaments'],
      colors: { body: '#8f3a2a', back: '#4e1408', belly: '#e8b08f', fin: '#6a2416', pattern: '#ffb45f', glow: '#ff7f3a', filament: '#ffd8a8' },
      legend: '火山噴發時，熔岩被風扯成極細的玻璃絲飄到很遠的地方，當地人管那個叫「佩蕾的頭髮」。這種魚身上垂著同樣的東西——不是鰭，是真正的玻璃絲，會割手。傳說佩蕾住在火山口裡，脾氣壞、記仇、談過很多次戀愛而且每一次都以災難收場。你拉起這條魚的時候，最好不要看牠的眼睛。',
      desc: '牠身上那幾條會割手。' },
    { id: 'cd_namaka', name: '娜瑪卡', rarity: 'legend', shape: 'wide', scale: 1.18, pattern: 'scale', value: 127120, minLen: 90, maxLen: 200,
      special: ['glow'],
      colors: { body: '#3f8fa8', back: '#1a4a5c', belly: '#cfeef6', fin: '#2c6d84', pattern: '#8fe0f0', glow: '#7fd8f0' },
      legend: '娜瑪卡是海，佩蕾是火，她們是姊妹。傳說裡姊姊追著妹妹從一座島打到另一座島，每打一次就多一座火山。這座湖是她們最後一次交手的地方——火贏了，所以這裡是熱的；但水沒有走，所以這裡還是一座湖。牠在最深的那一層冷水裡，一年只上來一次，上來的那一天整座湖的溫度會降兩度。',
      desc: '牠上來的那天，整座湖會涼兩度。' },

    /* --- 魚王 --- */
    { id: 'cd_king_yobi', name: '不滅腔棘魚「餘火」', rarity: 'king', shape: 'coelacanth', scale: 1.30, pattern: 'net', value: 461616, minLen: 190, maxLen: 360,
      special: ['glow', 'lobeFin'], cyOffset: 1,
      colors: { body: '#3a4a52', back: '#1a2428', belly: '#9fb0b4', fin: '#2a373d', pattern: '#e8a04a', glow: '#ff9f4f', lobe: '#5f6f74' },
      legend: '腔棘魚應該在六千五百萬年前就跟著恐龍一起消失了，直到一九三八年有人在漁獲堆裡認出一條。牠們住在火山島的斜坡上，那裡的水又深又冷。這一條不一樣：牠在這座湯湖裡，水是溫的，而牠的鰭長在四根肉柄上，走起來像在爬。有人說牠是被火山推上來的，也有人說牠一直都在，只是這座湖比牠年輕太多，年輕到不值得牠換地方。',
      desc: '硫煙湯湖之王。牠比這座湖老六千五百萬年。' }
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
        terrain: 'forest',
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
      id: 'garden_pond',
      name: '澄澈方池',
      subtitle: '庭園釣場 · 清淺',
      desc: '有人挖的、有人砌邊的、有人每週來撈落葉的一座池子。水淺到看得見底下的方磚，魚也看得見你。這裡不會有意外，除了那條白色的。',
      seed: 41208,
      castCost: 700,
      unlock: { free: true },
      scene: {
        terrain: 'pond',
        horizon: 0.32,
        // 晴天正午：這是全遊戲最亮、最沒有戲劇性的天空。人工池塘不需要氣氛，
        // 它需要的是「什麼都看得清楚」
        sky: ['#7fa8c8', '#a8c8dc', '#d4e4ea'],
        hill: '#7f9a86',
        farTree: '#5f8a52', midTree: '#3f6a3a', nearTree: '#2f5230',
        trunk: '#5f4a30',
        coping: '#b8b2a4', deck: '#8a6a44',
        bed: '#c8bfa0', grout: '#9a9078', stepStone: '#a8a294', leaf: '#7f6a3a',
        shore: '#4a4a3a',
        waterTop: '#6fa8b4', waterBot: '#a8d4d8', waterDeep: '#4f8a94',
        highlight: '#ffffff', highlight2: '#cfeef4',
        boat: '#7a5c38', boatRim: '#9a7848', boatDark: '#4e3a24'
      },
      fish: POND_FISH
    },
    {
      id: 'sunset_fjord',
      name: '落霞峽灣',
      subtitle: '進階釣場 · 鹹水',
      desc: '兩側崖壁夾著一道深海灣，黃昏時整片水面被染成金紅色。大魚多，成本也高。',
      seed: 77123,
      castCost: 1100,
      unlock: { free: true },
      scene: {
        terrain: 'cliff',
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
      id: 'sakura_shrine',
      name: '宵櫻神域',
      subtitle: '神域釣場 · 汽水',
      desc: '海水漲進來就淹過鳥居腳下的那座潟湖。岸上有五重塔與整排夜櫻，遠方是終年戴雪的錐形山。這裡的魚不怕人——沒有人敢在神域裡動粗。',
      seed: 88301,
      castCost: 1800,
      unlock: { free: true },
      scene: {
        terrain: 'shrine',
        horizon: 0.38,
        sky: ['#221a33', '#4a3352', '#8a5670', '#d98a8a'],
        hill: '#4a3f5c',
        snow: '#e8e2ee',
        farTree: '#8a5a76', midTree: '#a86d84', trunk: '#3f2a35',
        accent: ['#e8a8c0'],
        pagoda: '#3a2630', pagodaRoof: '#20161e', stone: '#7d7684',
        torii: '#c8442f',
        shore: '#241a26',
        waterTop: '#4a3a5e', waterBot: '#9a6a80', waterDeep: '#2e2140',
        highlight: '#ffe0ea', highlight2: '#d8a8c8',
        boat: '#4a3328', boatRim: '#6b4a38', boatDark: '#2e2019'
      },
      fish: SHRINE_FISH
    },
    {
      id: 'tide_flat',
      name: '潮落礁灘',
      subtitle: '潮間釣場 · 汐灘',
      desc: '大退潮之後，海往後退了三百公尺，留下一整片攤開的灘地。裸露的礁石、平行的沙紋、還有數不清的積水潭。水道只剩中間那一條，船就停在那裡等漲潮。',
      seed: 62409,
      castCost: 2300,
      unlock: { free: true },
      scene: {
        terrain: 'tidal',
        // 地平線壓高（0.30）：這個釣點的重點全在水面以下那一大片灘地
        horizon: 0.30,
        sky: ['#5f7f9a', '#98b4c0', '#d8d4c0', '#f0dcb8'],
        hill: '#5f6a70',
        farTree: '#9a8f74', midTree: '#7f7460', nearTree: '#5f5a4c',
        sand: '#cfc0a4', wet: '#9c907a', pool: '#6fb4c0', weedC: '#4a6a3a',
        shore: '#7f7460',
        waterTop: '#4a7f8a', waterBot: '#8fc0c4', waterDeep: '#2f5f6a',
        highlight: '#fbf6ea', highlight2: '#cfe4e4',
        boat: '#6a5238', boatRim: '#8a6c48', boatDark: '#443424'
      },
      fish: TIDAL_FISH
    },
    {
      id: 'frost_lake',
      name: '幽藍冰湖',
      subtitle: '寒帶釣場 · 冰釣',
      desc: '終年不化的冰層下藏著透明的魚群。破冰、鑿洞、把餌垂進那片幽藍——這裡的魚不多，但每一條都值錢。',
      seed: 30011, castCost: 3000,
      unlock: { free: true },
      scene: {
        terrain: 'ice',
        horizon: 0.36,
        sky: ['#1e2a3e', '#3c5a78', '#9dc0d6'],
        hill: '#4a6a84',
        farTree: '#5b7c92', midTree: '#3f5e74', nearTree: '#2c4658',
        accent: ['#dfeef7'], shore: '#20323f', floe: '#cfe8f4',
        waterTop: '#2f5b78', waterBot: '#67a5c4', waterDeep: '#1d3d55',
        highlight: '#ffffff', highlight2: '#bfe4f7',
        boat: '#3f4a58', boatRim: '#5a6b7c', boatDark: '#2a323c'
      },
      fish: FROST_FISH
    },
    {
      id: 'fall_pool',
      name: '懸瀑深潭',
      subtitle: '瀑潭釣場 · 湍流',
      desc: '一整面濕黑的岩壁，被一道二十公尺高的白水從中間切開。水砸下來的地方永遠翻著泡沫，霧散不掉，說話要用喊的。潭很深，深到聲納打下去要等一下才回來。',
      seed: 74615,
      castCost: 4400,
      unlock: { free: true },
      scene: {
        terrain: 'waterfall',
        horizon: 0.34,
        sky: ['#4a5f68', '#7f959a', '#b4c8c4'],
        hill: '#3f5052',
        farTree: '#3a4a4c', midTree: '#2e3c3f', nearTree: '#222e30',
        falls: '#e8f4f6', foam: '#eaf6f6', mist: '#dfeaea', moss: '#3f6a44',
        accent: ['#4f7a4a'],
        shore: '#1a2426',
        waterTop: '#2a4a52', waterBot: '#5f8f94', waterDeep: '#16303a',
        highlight: '#f4fcfc', highlight2: '#a8d8dc',
        boat: '#4a4438', boatRim: '#6a6250', boatDark: '#2e2a22'
      },
      fish: FALL_FISH
    },
    {
      id: 'lotus_river',
      name: '煙雨蓮江',
      subtitle: '水鄉釣場 · 緩流',
      desc: '峰林從水裡直接長出來，山腰整年掛著霧。白牆黑瓦的屋子沿岸排開，一座石拱橋跨過江面，橋下浮著成片荷葉。這裡的水很慢，慢到你會忘記自己在等什麼。',
      seed: 51224, castCost: 6000,
      unlock: { free: true },
      scene: {
        terrain: 'karst',
        horizon: 0.34,
        // 陰天的煙雨天光：整條漸層都壓在灰綠白，不出現藍天，這是水墨感的來源
        sky: ['#5f7484', '#93a8b2', '#c8d4d4', '#e2e6dc'],
        hill: '#6e8290',
        farTree: '#7f95a0', midTree: '#5b7480', nearTree: '#3f5560',
        mist: '#eef2f0',
        wall: '#e6e9e4', tile: '#2b3138', bridge: '#b4b0a2',
        lotus: '#3f7a52', bloom: '#f0a8c4',
        trunk: '#4a5c3a', accent: ['#6f8a4a'],
        shore: '#2a3630',
        waterTop: '#5a7280', waterBot: '#93a8a8', waterDeep: '#3a4e54',
        highlight: '#f4f8f4', highlight2: '#c4d4cc',
        boat: '#4a3a28', boatRim: '#6b5438', boatDark: '#2e2419'
      },
      fish: LOTUS_FISH
    },
    {
      id: 'caldera',
      name: '硫煙湯湖',
      subtitle: '火山釣場 · 溫湯',
      desc: '破火山口積水成湖。水是溫的，越靠岸越燙；湖底泛著硫磺的黃，水面整天飄著散不掉的蒸氣。左邊那座錐子還活著，頂上那道煙從來沒有停過。',
      seed: 85821,
      castCost: 9000,
      unlock: { free: true },
      scene: {
        terrain: 'caldera',
        horizon: 0.38,
        // 火山灰把天空壓成一片黃濁，最上方留一點冷色當對比
        sky: ['#3a3040', '#6a5450', '#a8845f', '#d8b878'],
        hill: '#4a3f48',
        farTree: '#3f3644', midTree: '#332c3a', nearTree: '#282230',
        sulfur: '#e0c85f', ember: '#e8703a', smoke: '#8f8a92', steam: '#e8eef0',
        shore: '#2a2430',
        waterTop: '#3f5a5a', waterBot: '#8fb4ac', waterDeep: '#2a4046',
        highlight: '#fbf4dc', highlight2: '#d8c88f',
        boat: '#4a3a34', boatRim: '#6a5448', boatDark: '#2e2420'
      },
      fish: CALDERA_FISH
    },
    {
      id: 'abyss', name: '深淵海溝', subtitle: '深海釣場 · 未知',
      desc: '光線到不了的地方。那裡的東西，不一定能稱作「魚」。放下去的線有多長，沒有人量過。',
      seed: 66607, castCost: 12000,
      unlock: { free: true },
      scene: {
        terrain: 'night',
        horizon: 0.22,
        sky: ['#050a12', '#0b1826', '#123048'],
        hill: '#0a1622',
        farTree: '#0d1c28', midTree: '#091520', nearTree: '#060f18',
        accent: ['#2f7f9c'], shore: '#04090f', star: '#cfe8ff', plankton: '#5fe0d8',
        waterTop: '#0a2033', waterBot: '#12405e', waterDeep: '#04101c',
        highlight: '#6fd8ff', highlight2: '#2f8fb8',
        boat: '#2a3038', boatRim: '#3f4750', boatDark: '#1a1e24'
      },
      fish: ABYSS_FISH
    },
    {
      id: 'world_root',
      name: '世界樹根',
      subtitle: '神話釣場 · 極夜',
      desc: '沒有人說得清這裡還算不算人間。一根巨大的樹幹從水裡直接長上去，樹冠在雲層之外，看不到頂。岸邊立著幾塊刻滿符文的石板，字沒有人讀得懂。極光整夜不停，水面跟著一起亮。',
      seed: 91130, castCost: 24000,
      unlock: { free: true },
      scene: {
        terrain: 'yggdrasil',
        // 地平線刻意壓到最低（0.44）：極光與樹幹都在水面以上，要把天空的空間讓出來
        horizon: 0.44,
        sky: ['#070b1a', '#101a33', '#1d2c4a', '#2c3f58'],
        hill: '#141d30',
        farTree: '#1a2436', midTree: '#131b2a', nearTree: '#0d141f',
        aurora: ['#5fe0a8', '#8f7fe0'],
        bark: '#3a2a1e', stone: '#6f6a78', rune: '#d8c08f',
        star: '#dfeaff',
        shore: '#0a1018',
        waterTop: '#0e1b30', waterBot: '#28405c', waterDeep: '#060d18',
        highlight: '#9fffd8', highlight2: '#7f8fe0',
        boat: '#4a3a2a', boatRim: '#6b5440', boatDark: '#2e2419'
      },
      fish: WORLD_ROOT_FISH
    },
    {
      id: 'duat',
      name: '黃沙冥河',
      subtitle: '冥界釣場 · 日沒',
      desc: '沙漠底下有一條河，太陽每天晚上從這裡通過。岸上是金字塔、方尖碑與幾株撐著的棕櫚，水裡插著半淹的石柱。白天這裡什麼都沒有，日落之後水面才會出現。',
      seed: 13072, castCost: 48000,
      unlock: { free: true },
      scene: {
        terrain: 'desert',
        horizon: 0.40,
        // 全遊戲唯一整片暖色的天空：日沒的赭紫 → 落日橘 → 砂金
        sky: ['#2e1e3a', '#5f2f42', '#a8543a', '#d88f4a', '#f0c87f'],
        hill: '#8f6a44',
        farTree: '#c8a068', midTree: '#a87f4a', nearTree: '#7f5c34',
        sandLit: '#e8c88f',
        pyramid: '#c0975a', stone: '#b8a478', palm: '#6f7a3a', trunk: '#5f4a2a',
        papyrus: '#8f9a4a',
        shore: '#4a3620',
        waterTop: '#4a3a3a', waterBot: '#a8785a', waterDeep: '#2e2020',
        highlight: '#ffe8bc', highlight2: '#d8a06a',
        boat: '#5a4028', boatRim: '#7f5c38', boatDark: '#38281a'
      },
      fish: DUAT_FISH
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

  /* ------------------------------------------------------------
     釣竿：**同一時間只有一支生效**，所以加竿子不會讓倍率疊乘失控。
     陣列依 price 遞增排列（= 圖示配色順序，見 screen-shop.js › rodIcon）。
     每個釣點各有一支「主題竿」，價格落在該釣點的門檻附近；
     原本的五支通用竿保留，插在主題竿之間，構成 13 段的細緻曲線。
     ------------------------------------------------------------ */
  FG.RODS = [
    { id: 'rod_bamboo', name: '竹製釣竿',   price: 0,      rareMul: 1.00, sizeBonus: 0,    kingMul: 1,    loc: 'mist_lake',     desc: '祖父留下的舊竿子，堪用。' },
    { id: 'rod_reed',   name: '蘆葦手竿',   price: 900,    rareMul: 1.07, sizeBonus: 0.02, kingMul: 1,    loc: 'mist_lake',     desc: '晨霧湖岸邊割來的，輕到感覺不出手上有東西。' },
    { id: 'rod_tenkara',name: '池畔短節竿', price: 1600,   rareMul: 1.11, sizeBonus: 0.035,kingMul: 1,    loc: 'garden_pond',   desc: '沒有捲線器，線就綁在竿尖。池子那麼小，本來也不需要放線。' },
    { id: 'rod_glass',  name: '玻纖磯竿',   price: 2400,   rareMul: 1.15, sizeBonus: 0.05, kingMul: 1,    desc: '韌性不錯，稀有魚上鉤率 +15%。' },
    { id: 'rod_tide',   name: '趕海長竿',   price: 3400,   rareMul: 1.19, sizeBonus: 0.065,kingMul: 1,    loc: 'tide_flat',     desc: '特別長，讓你站在乾的地方就搆得到水窪。' },
    { id: 'rod_drift',  name: '浮木海竿',   price: 4800,   rareMul: 1.24, sizeBonus: 0.08, kingMul: 1,    loc: 'sunset_fjord',  desc: '峽灣漂上岸的木料削的。泡過鹹水反而更韌。' },
    { id: 'rod_falls',  name: '逆流硬調竿', price: 7000,   rareMul: 1.30, sizeBonus: 0.10, kingMul: 1.1,  loc: 'fall_pool',     desc: '調性硬得幾乎不彎。潭裡的東西上鉤就往瀑布衝，軟竿只會被拖進去。' },
    { id: 'rod_carbon', name: '碳纖維遠投竿', price: 9800, rareMul: 1.35, sizeBonus: 0.12, kingMul: 1.2,  desc: '輕又硬，能把餌拋到魚群正中央。' },
    { id: 'rod_pumice', name: '浮石隔熱竿', price: 13000,  rareMul: 1.39, sizeBonus: 0.14, kingMul: 1.18, loc: 'caldera',       desc: '握把裹了一層火山浮石。沒有這一層，竿子在湯湖上放十分鐘就拿不起來了。' },
    { id: 'rod_sakura', name: '櫻枝祭竿',   price: 16000,  rareMul: 1.42, sizeBonus: 0.10, kingMul: 1.15, loc: 'sakura_shrine', desc: '祭典用過的櫻枝。宮司說這種竿子不該用來賺錢。' },
    { id: 'rod_ice',    name: '冰晶短竿',   price: 26000,  rareMul: 1.48, sizeBonus: 0.16, kingMul: 1.3,  loc: 'frost_lake',    desc: '短到能在冰洞邊坐著用。竿身結著一層永不融的霜。' },
    { id: 'rod_mithril',name: '秘銀磯釣竿', price: 42000,  rareMul: 1.55, sizeBonus: 0.22, kingMul: 1.5,  desc: '導環用秘銀打造，線出得順到不可思議。' },
    { id: 'rod_jade',   name: '碧玉竹竿',   price: 68000,  rareMul: 1.62, sizeBonus: 0.25, kingMul: 1.4,  loc: 'lotus_river',   desc: '整支竿只有一節竹子，節與節之間沒有接痕。' },
    { id: 'rod_winch',  name: '深海絞盤竿', price: 110000, rareMul: 1.70, sizeBonus: 0.30, kingMul: 1.7,  loc: 'abyss',         desc: '不是用來甩的，是用來把東西從很深的地方搖上來的。' },
    { id: 'rod_dragon', name: '龍骨釣竿',   price: 180000, rareMul: 1.80, sizeBonus: 0.35, kingMul: 2.0,  desc: '取自某條不該被釣起的東西的脊骨。' },
    { id: 'rod_ash',    name: '世界樹枝竿', price: 320000, rareMul: 1.83, sizeBonus: 0.36, kingMul: 2.02, loc: 'world_root',    desc: '一根掉下來的枝。它到現在還在長。' },
    { id: 'rod_sceptre',name: '黃金權杖竿', price: 780000, rareMul: 1.86, sizeBonus: 0.36, kingMul: 2.05, loc: 'duat',          desc: '陪葬品。原本的用途不是釣魚，但它顯然不介意。' }
  ];

  /* ------------------------------------------------------------
     餌料：**同一時間只有一種生效**，同樣不會疊乘。
     `price` 是單價，`pack` 是一次購買的數量。
     一釣點一種主題餌，插在原本五種通用餌之間。
     ------------------------------------------------------------ */
  FG.BAITS = [
    { id: 'bait_bread', name: '麵包屑',     price: 25,   pack: 10, rareMul: 1.00, junkMul: 1.00, valueMul: 1.00, kingMul: 1,    desc: '便宜、堪用、什麼都釣得到一點。' },
    { id: 'bait_moss',  name: '湖苔團',     price: 45,   pack: 10, rareMul: 1.09, junkMul: 0.85, valueMul: 1.00, kingMul: 1,    loc: 'mist_lake',     desc: '從湖底石頭上刮下來搓成團。晨霧湖的魚從小吃這個。' },
    { id: 'bait_pellet',name: '沉底飼料錠', price: 55,   pack: 10, rareMul: 1.13, junkMul: 0.78, valueMul: 1.00, kingMul: 1,    loc: 'garden_pond',   desc: '池子裡的魚從小吃這個長大。牠們認得袋子的聲音。' },
    { id: 'bait_worm',  name: '紅蚯蚓',     price: 70,   pack: 10, rareMul: 1.18, junkMul: 0.70, valueMul: 1.00, kingMul: 1,    desc: '萬用活餌，雜物明顯變少。' },
    { id: 'bait_crab',  name: '碎潮蟹',     price: 95,   pack: 10, rareMul: 1.25, junkMul: 0.62, valueMul: 1.02, kingMul: 1.05, loc: 'tide_flat',     desc: '退潮時翻石頭抓的，直接連殼敲碎。腥味在水窪裡散得特別快。' },
    { id: 'bait_squid', name: '花枝切段',   price: 130,  pack: 10, rareMul: 1.32, junkMul: 0.55, valueMul: 1.05, kingMul: 1.1,  loc: 'sunset_fjord',  desc: '切得越不整齊越有效，沒有人知道為什麼。' },
    { id: 'bait_caddis',name: '石蠶蛹',     price: 165,  pack: 10, rareMul: 1.39, junkMul: 0.47, valueMul: 1.07, kingMul: 1.15, loc: 'fall_pool',     desc: '從瀑布下的石頭底面剝下來的。逆流上來的魚一輩子只認得這個味道。' },
    { id: 'bait_shrimp',name: '活蝦',       price: 200,  pack: 10, rareMul: 1.45, junkMul: 0.40, valueMul: 1.10, kingMul: 1.2,  desc: '大魚最愛，賣價也跟著漂亮。' },
    { id: 'bait_petal', name: '鹽漬櫻餌',   price: 280,  pack: 10, rareMul: 1.55, junkMul: 0.30, valueMul: 1.08, kingMul: 1.3,  loc: 'sakura_shrine', desc: '祭典的供品，隔天用鹽醃起來。神域的魚認得這個味道。' },
    { id: 'bait_sulfur',name: '硫泉菌毯',   price: 330,  pack: 10, rareMul: 1.62, junkMul: 0.22, valueMul: 1.09, kingMul: 1.35, loc: 'caldera',       desc: '從噴氣孔邊上刮下來的一層菌膜。湯湖裡的食物鏈最底下就是它。' },
    { id: 'bait_lure',  name: '螢光假餌',   price: 380,  pack: 10, rareMul: 1.70, junkMul: 0.15, valueMul: 1.10, kingMul: 1.4,  desc: '在暗處會發光，專門激怒掠食者。' },
    { id: 'bait_krill', name: '冰海磷蝦',   price: 520,  pack: 10, rareMul: 1.75, junkMul: 0.12, valueMul: 1.12, kingMul: 1.6,  loc: 'frost_lake',    desc: '冰層底下整片都是。撈上來要立刻用，退冰就爛了。' },
    { id: 'bait_lees',  name: '酒糟米團',   price: 680,  pack: 10, rareMul: 1.82, junkMul: 0.08, valueMul: 1.15, kingMul: 1.9,  loc: 'lotus_river',   desc: '釀酒剩下的糟捏成團。江裡的魚會醉，醉了就不掙扎。' },
    { id: 'bait_king',  name: '魚王秘餌',   price: 900,  pack: 5,  rareMul: 1.90, junkMul: 0.00, valueMul: 1.20, kingMul: 3.0,  desc: '配方不明。魚王等級的傢伙聞到就會失去理智。' },
    { id: 'bait_glow',  name: '深海發光蟲', price: 1300, pack: 5,  rareMul: 1.92, junkMul: 0.00, valueMul: 1.21, kingMul: 3.05, loc: 'abyss',         desc: '拿上船之後還會亮三天。三天後就只是一團灰。' },
    { id: 'bait_mead',  name: '蜜酒浸餌',   price: 1800, pack: 5,  rareMul: 1.93, junkMul: 0.00, valueMul: 1.21, kingMul: 3.05, loc: 'world_root',    desc: '泡過那桶酒的餌。連不該上鉤的東西都會來看一眼。' },
    { id: 'bait_scarab',name: '聖甲蟲餌',   price: 2600, pack: 5,  rareMul: 1.94, junkMul: 0.00, valueMul: 1.22, kingMul: 3.1,  loc: 'duat',          desc: '從石棺裡拿出來的。它在你手上動了一下。' }
  ];

  /* ------------------------------------------------------------
     裝備：買了就永久生效、效果**全部相乘**，所以這裡是唯一會疊乘失控的地方
     （[10 平衡調參] 記錄過一次倍率疊乘失控的事故）。
     原本五件是通用的；**每個釣點的專屬裝備一律加 `effect.loc`**，
     只在該釣點生效。這樣一釣點一件、加多少件都只多一個乘數。
     ------------------------------------------------------------ */
  FG.EQUIPS = [
    { id: 'eq_hat',    name: '漁夫帽',     price: 4000,   effect: { valueMul: 1.10 }, desc: '賣魚價格 +10%。看起來也比較像樣。' },
    { id: 'eq_basket', name: '大型魚簍',   price: 7000,   effect: { sizeBonus: 0.08 },desc: '釣到的魚體型 +8%。' },
    { id: 'eq_vest',   name: '防水背心',   price: 11000,  effect: { costMul: 0.85 },  desc: '拋竿費用 −15%。' },
    { id: 'eq_clover', name: '幸運四葉草', price: 22000,  effect: { rareMul: 1.20 },  desc: '稀有度加權 +20%。' },
    { id: 'eq_sonar',  name: '聲納探測器', price: 60000,  effect: { rareMul: 1.15, showHint: true }, desc: '咬鉤前顯示魚影提示，並提升稀有度 +15%。' },

    /* --- 釣點專屬（只在對應釣點生效） ---
       ★ **每件只給一個有意義的效果**，不要 rareMul 又 valueMul。
       兩個乘數疊在同一件裝備上，八件加完就是把整條倍率曲線往上推兩成
       （初版就是這樣做的，黃沙冥河跑出 ×3.13）。一件一個效果同時也讓
       每件裝備有自己的個性，玩家看得出「這件是幹什麼的」。 */
    { id: 'eq_mistlens', name: '晨霧偏光鏡', price: 6000,   effect: { loc: 'mist_lake',     rareMul: 1.12 },    desc: '透過霧看得見水下的影子。稀有度 +12%，只在晨霧湖生效。' },
    { id: 'eq_feeder',   name: '自動投餌桶', price: 10000,  effect: { loc: 'garden_pond',   sizeBonus: 0.05 },  desc: '每天定時撒一次。撒久了，池裡的魚就一條比一條肥。體型 +5%，只在澄澈方池生效。' },
    { id: 'eq_tidechart', name: '潮汐圖板',  price: 14000,  effect: { loc: 'sunset_fjord',  valueMul: 1.08 },   desc: '記著峽灣每天的漲退時刻，挑對時間賣得比較好。售價 +8%，只在落霞峽灣生效。' },
    { id: 'eq_charm',    name: '神域護符',   price: 24000,  effect: { loc: 'sakura_shrine', rareMul: 1.14 },    desc: '宮司給的。他說「別跟牠們對看」。稀有度 +14%，只在宵櫻神域生效。' },
    { id: 'eq_creel',    name: '碎冰保冷箱', price: 30000,  effect: { loc: 'tide_flat',     valueMul: 1.085 },  desc: '灘上曬四個小時，有沒有這一箱差很多。售價 +8.5%，只在潮落礁灘生效。' },
    { id: 'eq_auger',    name: '破冰鑽',     price: 38000,  effect: { loc: 'frost_lake',    costMul: 0.90 },    desc: '開洞快一倍，省下來的力氣就是省下來的錢。拋竿費 −10%，只在幽藍冰湖生效。' },
    { id: 'eq_mask',     name: '潛水面鏡',   price: 50000,  effect: { loc: 'fall_pool',     rareMul: 1.15 },    desc: '把臉埋進去就看得見潭底有什麼。看得見，才知道要把餌放哪。稀有度 +15%，只在懸瀑深潭生效。' },
    { id: 'eq_teapot',   name: '溫酒壺',     price: 62000,  effect: { loc: 'lotus_river',   valueMul: 1.09 },   desc: '手不冷，線就穩，魚也拉得完整。售價 +9%，只在煙雨蓮江生效。' },
    { id: 'eq_raft',     name: '溫泉浮台',   price: 95000,  effect: { loc: 'caldera',       costMul: 0.91 },    desc: '固定在湖心，省掉每次划出去的工夫。拋竿費 −9%，只在硫煙湯湖生效。' },
    { id: 'eq_winch',    name: '耐壓絞盤',   price: 120000, effect: { loc: 'abyss',         sizeBonus: 0.06 },  desc: '拉得動不該拉得動的東西。體型 +6%，只在深淵海溝生效。' },
    { id: 'eq_runeplate',name: '符文銘板',   price: 240000, effect: { loc: 'world_root',    rareMul: 1.16 },    desc: '照著石板抄下來的。抄的人說抄完手抖了三天。稀有度 +16%，只在世界樹根生效。' },
    { id: 'eq_ankh',     name: '生命之符',   price: 480000, effect: { loc: 'duat',          rareMul: 1.17 },    desc: '掛在胸前，河裡的東西就會當你已經死了。稀有度 +17%，只在黃沙冥河生效。' }
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
    { id: 'lamp',   name: '吊燈',       price: 8000,  effect: {},              desc: '純裝飾。讓房間亮一點。' },
    // 釣點主題裝飾一律**純裝飾（effect 空）**：裝飾的效果是全域相乘且全部同時生效，
    // 跟通用裝備一樣會疊乘失控，而「家園擺設」在語意上又不適合綁定某個釣點。
    { id: 'shishi',    name: '竹添水',     price: 9000,  effect: {}, desc: '純裝飾。澄澈方池那種庭園裡都有一支。每隔一陣子「叩」一聲，水豚每次都會醒。' },
    { id: 'shellrack', name: '貝殼標本架', price: 14000, effect: {}, desc: '純裝飾。從潮落礁灘一趟一趟撿回來的，九個格子花了很久才填滿。' },
    { id: 'cascade',   name: '循環水景',   price: 22000, effect: {}, desc: '純裝飾。懸瀑深潭的迷你版，水從上面的盆流到下面的盆，再被打上去。' },
    { id: 'onsen',     name: '檜木泡湯桶', price: 34000, effect: {}, desc: '純裝飾。裝的是從硫煙湯湖運回來的水。水豚看到的第一天就跳進去了。' },
    { id: 'sarco',  name: '彩繪石棺',   price: 90000, effect: {},              desc: '純裝飾。從黃沙冥河搬回來的，裡面是空的——搬之前就是空的。' }
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
