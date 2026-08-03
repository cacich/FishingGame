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
     地點二：落霞峽灣（需以籌碼解鎖，示範多地點切換）
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
     地點四：深淵海溝
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
