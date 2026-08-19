/* ============================================================
   generate-image-prompts.js — 從 data.js 產生全圖鑑產圖描述索引

   用法：node tools/generate-image-prompts.js
   驗證：node tools/generate-image-prompts.js --check
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'js', 'data.js');
const OUTPUT_PATH = path.join(ROOT, 'wiki', '15-image-prompts.md');

// 這些詞彙刻意描述「剪影」而非生物分類，讓產圖模型能保留遊戲裡的辨識度。
const SHAPES = {
  normal: '標準紡錘魚身，圓鈍頭部、略深的軀幹與分叉尾鰭',
  long: '細長梭形魚身，尖頭、收窄尾柄與小型分叉尾鰭',
  round: '短而高的橢圓魚身，厚實腹部與小扇形尾鰭',
  flat: '側扁圓盤魚身，背鰭和臀鰭沿身緣延展',
  wide: '寬厚的掠食魚身，大頭、大嘴、飽滿胸腹與強壯尾鰭',
  ray: '扁平菱形的魟魚輪廓，寬翼狀胸鰭和細長尾巴',
  slim: '刀片般極細長的鰻型身體，尾端自然收尖',
  crest: '短身高背的圓盤輪廓，頭頂有醒目的高冠背鰭',
  boxy: '稜角分明的箱型短身，方正腹部與很小的尾鰭',
  torpedo: '小型流線魚雷輪廓，前端圓潤、後段快速收束',
  catfish: '巨大的無鱗鯰魚身，寬頭闊嘴與長而厚的尾部',
  oni_catfish: '短而高的鬼面巨鯰輪廓，頭部像兜鍪般寬重，鬚長、尾扇厚實',
  tuna: '厚實月牙尾的高速巡游魚身，胸鰭短而有力',
  dragon: '修長蛇形龍魚身，長鬚、飄帶狀背鰭與華麗尾鰭',
  kitsune_dragon: '纖細對稱的白狐龍魚身，長背鬃與九尾般的深叉大尾扇',
  pike: '長吻伏擊者輪廓，扁長頭部、細長身軀與靠後的背鰭',
  abyss: '不成比例的大頭深海魚身，巨大嘴部和短小尾部',
  paddle: '長槳狀吻部的古老魚形，寬厚身體與大尾鰭',
  serpent: '巨型海蛇般的長身輪廓，連續背鰭延伸到尾端',
  coelacanth: '古老腔棘魚輪廓，厚鱗、粗壯肉質葉狀鰭與三葉尾',
  octopus: '圓潤外套膜與八條舒展腕足的巨型章魚輪廓',
  koi: '巨大錦鯉輪廓，圓潤高背、飄長鰭與分叉尾',
  clinger: '低伏貼石的短扁魚身，寬腹面與吸附姿勢',
  wrasse: '厚唇、弧形額頭的隆頭魚輪廓，背鰭連成一線',
  skipper: '能撐起身體的彈塗魚輪廓，突出的眼睛與強壯胸鰭',
  leaper: '為躍瀑而生的修長魚身，強壯尾柄與後掠鰭',
  lungfish: '古老肺魚輪廓，粗長圓筒身體與絲狀成對鰭',
  olm: '蒼白半透明的洞穴蠑螈輪廓，細長身軀與小四肢',
  jianlong: '青龍般極細的劍身輪廓，吻端如無鞘古劍、背有長鬃、尾鰭高而深叉',
  moon_koi: '短而高的神異天鯉輪廓，身後張開一面近乎滿月的巨型深叉尾'
};

const PATTERNS = {
  none: '表面乾淨，讓主體色塊與輪廓成為焦點',
  scale: '規律、清楚可辨的鱗片紋理',
  stripe: '沿身體延伸的細條紋',
  band: '高對比的寬橫帶',
  band2: '兩段式色帶與較亮的邊緣',
  spot: '散落的圓形斑點',
  speck: '細碎、密集的雀斑點紋',
  net: '交錯的網格或甲片紋理',
  gradient: '從背部往腹部自然過渡的漸層色塊',
  saddle: '只落在背脊上的深色鞍斑',
  ocellus: '尾柄或背部一枚醒目的假眼圓斑',
  chevron: '規律的人字形斜紋'
};

const SPECIALS = {
  glow: '身體輪廓內沿用一像素實色冷光，不畫輪廓外光暈或半透明 bloom',
  whisker: '口邊有可辨識的長觸鬚',
  spike: '背部或鰭緣長出明顯硬棘',
  scar: '身側保留一條醒目的舊傷疤',
  horn: '額頭或吻端有突出的角狀構造',
  wing: '胸鰭延展成寬大的翼狀輪廓',
  lure: '頭前有發光誘餌器官',
  teeth: '半張的口中可看見細密尖牙',
  frill: '鰓部或背部有飄動的絲狀褶飾',
  tentacle: '身體周圍有觸手般的附肢',
  sucker: '腹面有明顯的吸盤構造',
  finlet: '尾柄前排著一列小離鰭',
  jaw: '下顎或嘴裂特別修長、銳利',
  hump: '頭後隆起一道厚實駝峰',
  mane: '頭頸周圍有飄散的鬃狀長鰭',
  lantern: '頭前垂著清楚的生物發光誘餌',
  stalkEye: '兩眼長在高高突出的眼柄上',
  frost: '鰭緣與背部結著冰晶般的霜紋',
  kype: '下顎彎成繁殖期鮭魚般的鉤狀吻',
  rostrum: '吻部延伸成寬扁的長槳狀突起',
  filaments: '鰭緣拖著多根細長飄帶',
  lobeFin: '四片鰭是粗壯、肉質的葉狀肢',
  forkTongue: '微張口時可見蛇類分叉舌',
  blind: '眼睛退化成淡色小點或完全不可見',
  gills: '頭後露出鮮明的外鰓或鰓絲',
  limbs: '身側長出可辨識的小型肢體',
  arms: '八條腕足帶清晰吸盤與流動姿態',
  slitEye: '眼睛為冷靜、狹長的橫向瞳孔'
};

const JUNK_ART = {
  boot: '一隻浸水後變形的舊皮長靴，鞋口垂著水草',
  can: '鏽蝕、凹陷、邊緣捲曲的金屬罐',
  weed: '纏結的植物或繩網團，保留濕重、凌亂的質感',
  bottle: '蒙著水垢與刮痕的玻璃瓶或玻璃浮球',
  ema: '褪色木製繪馬，繩結磨損、墨跡被水暈開',
  ice: '半透明藍白浮冰碎塊，邊緣有裂紋',
  porcelain: '帶藍色紋樣、缺角的瓷器碎片',
  bone: '潮濕泛白、形狀難辨的骨骸',
  shield: '裂開的木質圓盾，中央還留著金屬凸飾',
  ostracon: '風化陶片，表面有模糊古老刻字',
  coins: '被銅綠黏成小堆的許願硬幣',
  shell: '粗糙、帶海藻附著物的空笠貝殼',
  flask: '撞凹的金屬水壺，刮痕沿著一側延伸',
  brimstone: '不規則的亮黃硫磺晶塊，表面有粉末',
  driftwood: '被水流磨得圓滑的深色漂流木，年輪可見',
  coralfrag: '白化、折斷的鹿角珊瑚枝',
  dripstone: '帶同心層理的斷落鐘乳石',
  porthole: '銅環仍完整、玻璃裂成蛛網的船舷窗',
  ml_notebook: '封皮長綠藻、紙頁泡皺的湖泊觀察筆記，留幾道暈開的藍色水位線',
  ml_reedfloat: '軟木、紅線與兩截蘆葦手工綁成的老式湖釣浮標',
  fj_buoytag: '鹽霧磨蝕的橘粉色浮標編號牌，留一碼殘缺的白色數字',
  fj_tidebottle: '厚實海綠玻璃的密封潮汐瓶，瓶中困著橘金海藻與一張捲起紙條，瓶口封蠟完整',
  fj_cleat: '纏著斷纜、縫裡長滿白藤壺與海藻的金屬繫纜扣',
  sk_bell: '朱繩褪白、銅面氧化的日式小鈴鐺，鈴口卡一粒黑石',
  sk_crane: '吸飽水而半透明的折紙鶴，翅尖黏著淡粉色藻膜',
  fr_thermos: '覆著厚霜的藍灰保溫瓶，裂開的腕帶垂在瓶蓋旁',
  fr_jig: '黏滿冰屑的銀色小魚形冰釣亮片，拖著鈍掉的三叉鉤',
  lr_jarstopper: '褪成灰紫的紅布封口與吸水膨脹木塞，帶濃厚米酒罈感',
  lr_lotuspod: '深褐蓮蓬與長梗，蓮孔塞泥、外圈纏細藻',
  ab_logger: '深海紀錄器的裂殼圓筒，幽暗外殼上只剩一粒綠色指示燈',
  ab_cable: '捲成硬圈的黑色聲納纜線，斷口露出被擠扁的彩色芯線',
  wr_runestone: '覆著苔痕的灰綠符文石，斜杠與折線刻紋被根鬚磨鈍',
  wr_amulet: '鹿角形金屬吊墜，被活根穿過並以北方皮繩打結的護符',
  du_canopic: '胡狼頭罐蓋歪落、罐腹裂開並灌滿細沙的卡諾卜罐',
  du_papyrus: '邊緣鬆散的淡黃莎草卷，墨線被河水拖成昆蟲腳印般的細痕',
  gp_skimmer: '破了半面的撈葉網，短柄卡著方池底的白色方磚碎角',
  gp_feedcup: '邊緣有硬水垢、杯底壓著褐色飼料錠的裂紋飼料杯',
  tf_crabshell: '粉白石灰藻染色的寄居蟹空殼，殼口留一截斷蟹鉗',
  tf_seaglass: '被海浪磨成厚實圓角的海藍玻璃片，霧面半透明',
  fp_carabiner: '陽極橘色褪去、卡榫永久張開的變形登山扣',
  fp_mapcase: '撞出白痕的透明防水地圖筒，筒內等高線圖暈成綠灰',
  cd_obsidian: '邊緣銳利的黑曜石碎片，在硫煙中泛一瞬金綠反光',
  cd_goggles: '被黃白礦物封住的護目鏡，只露焦黑橡膠鼻樑',
  rp_piton: '被卵石敲彎的溪谷岩釘，金屬裂縫長出細苔',
  rp_mayflycase: '木製蜉蝣假餌盒掀開一角，羽毛假餌被急流沖成褐色團',
  cr_weight: '長出亮紫小珊瑚的釣組鉛墜，金屬底座仍從珊瑚下露出',
  cr_mask: '內側蒙白霧、矽膠帶留有小魚齒印的遺失潛水面鏡',
  cv_lamp: '反光罩覆滿鐘乳垢、燈芯泡黑的熄滅乙炔燈',
  cv_ropeanchor: '拴著三截發白斷繩的鏽蝕岩釘環，繩端沒入黑暗',
  dp_signallamp: '黃銅護框完整、紅玻璃裂成四瓣的沉船信號燈',
  dp_compass: '透明蓋下壓著艙藍漆屑、指針永久偏向東北的黃銅羅盤',
  mk_kawara: '帶朱漆殘痕與金色家紋的黑灰城瓦碎片，斷面粗糙不對稱',
  mk_hairpin: '一支楓葉造型的赤銅髮簪，簪腳纏著濕紅葉與細藻',
  mk_leafnet: '竹框細網兜住一團紅橙楓葉，網線破開一角',
  fs_yunohana: '乳白與淡藍層疊的湯之花礦物結晶，表面仍冒細小氣泡',
  fs_ema: '畫著白狐的濕木繪馬，紅繩打結、墨線被溫泉水暈開',
  fs_geta: '單隻深色木屐，紅鼻緒斷了一邊，木齒沾著雪與溫泉礦垢',
  sp_brokenblade: '折斷的古劍殘刃，青黑劍身留冷亮刃口，劍格纏著褪色布條',
  sp_bambutag: '削成劍牌形的青竹木牌，紅繩穿孔，墨字已被寒潭水暈開',
  sp_gourd: '棕黃酒葫蘆，腰間纏紅繩，葫蘆口缺一角並滲出淡淡酒色',
  dh_silkfrag: '赭金、絳紫與青綠交織的殘破長綾，邊緣像壁畫顏料般剝落',
  dh_lampcup: '小型赭陶燈盞，盞口焦黑，殘油仍映著一點暖金色燈芯',
  dh_pipapeg: '琵琶形制的深紅木弦軫，金色端飾磨損，纏著一小截斷弦'
};

const LOCATION_MOODS = {
  mist_lake: '薄霧冷灰藍的靜水氛圍', garden_pond: '人工池塘與乾淨方磚的安靜氛圍',
  rapids: '冷冽急流與濕潤卵石的氛圍', sunset_fjord: '金紅暮光映在峽灣海面的氛圍',
  coral_reef: '明亮清澈、飽和珊瑚色的淺礁氛圍', sakura_shrine: '夜櫻、鳥居與幽藍潟湖的神域氛圍',
  tide_flat: '退潮礁池、濕石與鹽霧的潮間帶氛圍', frost_lake: '冰下幽藍、霜白邊緣的極寒氛圍',
  fall_pool: '飛瀑水霧、暗岩與激流的深潭氛圍', lotus_river: '煙雨、蓮葉與墨青水色的江南氛圍',
  caldera: '硫黃蒸氣、礦物黃與火山水色的氛圍', abyss: '近乎全黑、深海冷光的壓迫氛圍',
  world_root: '巨根、苔蘚與北境冷水的古樹氛圍', duat: '赭黃沙、古埃及遺物與河水的氛圍',
  cavern: '鐘乳岩、無光水面與蒼白半透明感的洞穴氛圍', dawn_port: '鏽蝕沉船、鉛丹橘與黎明海水的棄港氛圍',
  maple_keep: '朱橋、石垣、天守與赤橙楓葉倒映護城河的晚秋氛圍',
  fox_springs: '雪山藍夜、暖橙旅館、露天湯蒸氣與白狐信仰的溫泉氛圍',
  sword_pool: '冷青峭壁、孤瀑、竹影、山巔小亭與劍光掠水的武俠寒潭氛圍',
  dunhuang_spring: '靛紫暮空、鳴沙丘、千佛窟燈火與赭金飛天長綾的敦煌月泉氛圍'
};

function loadData() {
  const sandbox = { window: { FG: {} } };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(fs.readFileSync(DATA_PATH, 'utf8'), sandbox, { filename: DATA_PATH });
  return sandbox.window.FG.LOCATIONS;
}

function colorDetail(colors) {
  const parts = [];
  if (colors.body) parts.push(`主體 ${colors.body}`);
  if (colors.back) parts.push(`背部較深的 ${colors.back}`);
  if (colors.belly) parts.push(`腹部 ${colors.belly}`);
  if (colors.fin) parts.push(`鰭 ${colors.fin}`);
  if (colors.pattern) parts.push(`花紋 ${colors.pattern}`);
  if (colors.glow) parts.push(`發光色 ${colors.glow}`);
  if (colors.scar) parts.push(`疤痕色 ${colors.scar}`);
  return parts.join('、');
}

function fishPrompt(fish, loc) {
  const lore = (fish.desc || '').replace(/[。！？!?]+$/, '');
  if (fish.rarity === 'junk') {
    const object = JUNK_ART[fish.junkArt] || '被水浸泡、長期磨耗的雜物';
    return `像素風遊戲道具，單一主體、三分之四側視角、透明背景、無文字無水印。${object}；表現「${fish.name}」的辨識細節，尺寸感約 ${fish.minLen}–${fish.maxLen} ${fish.unit || 'cm'}，搭配${LOCATION_MOODS[loc.id]}。${lore}。`;
  }

  const special = (fish.special || []).map(key => SPECIALS[key] || key).join('；');
  const detail = [
    `像素風遊戲魚類素材，單一完整主體、右向側身、透明背景、無文字無水印`,
    SHAPES[fish.shape] || `${fish.shape} 輪廓`,
    `${PATTERNS[fish.pattern] || `${fish.pattern} 花紋`}`, colorDetail(fish.colors || {})
  ];
  if (special) detail.push(special);
  detail.push(`尺寸感約 ${fish.minLen}–${fish.maxLen} cm`, `搭配${LOCATION_MOODS[loc.id]}`);
  if (lore) detail.push(lore);
  return `${detail.join('；')}。`;
}

function documentFor(locations) {
  const total = locations.reduce((sum, loc) => sum + loc.fish.length, 0);
  const junk = locations.reduce((sum, loc) => sum + loc.fish.filter(fish => fish.rarity === 'junk').length, 0);
  const lines = [
    '# 15 · 全圖鑑產圖外觀描述',
    '',
    `> 自動由 \`js/data.js\` 產生；目前共 **${total}** 個可釣項目（${total - junk} 種魚／${junk} 件雜物）。`,
    '> 重建指令：`node tools/generate-image-prompts.js`。請勿直接編輯本檔，應修改產生器的詞彙或資料表後重建。',
    '',
    '## 使用方式',
    '',
    '每一條都是可直接複製給產圖模型的短提示詞。它固定了遊戲素材所需的構圖（單一主體、右向側身、透明背景、無文字），再從資料表帶入輪廓、花紋、精確色碼、特殊器官、尺寸與釣點氛圍；這樣產出的圖既有共同規格，又不會抹掉各魚的識別點。若要生成場景插畫，可把「透明背景」改成需要的場景，保留其餘描述。',
    '',
    '整站批量產圖可把 12 條提示依 row-major 排成 3×4 規格表、使用精確 `#FF00FF` 純洋紅鍵色背景，再以 `tools/split-sprite-sheet.py` 按 id 名單縮進 96×56 RGBA 畫布。主體完全留在格內時可用預設幾何切格；主體越過格線時，先把母版做 soft-matte 去背與 despill，再加 `--component-cells`，讓完整連通主體依重心歸屬格位。工具還會把與透明區相連的鍵色混色邊緣改成最近的主體色，並清掉最外圈高亮紫／桃紅 glow，同時保持 alpha 輪廓不變。提示詞仍須禁止輪廓外光暈／半透明 bloom，發光限制在輪廓內或緊貼輪廓的實色像素。成品必須排成遊戲同款深色底 contact sheet，逐張確認頭尾、鰭鬚、特效完整、沒有相鄰格碎片或洋紅／亮紫邊；尺寸與連通元件數不能取代目視驗收。',
    '',
    '**新增地圖完成門檻**：`fish[]` 每一項（包含三件雜物）都必須把對應提示詞產成 `assets/sprites/<location-id-kebab>/<fish-id>.png` 的 96×56 RGBA 正式精靈，並連同 200×340 場景、76×50 縮圖逐張列入 `sw.js › ASSETS`、提升 `VERSION`。程序化精靈與地形只能當載入失敗備援，不算正式美術已交付。',
    ''
  ];
  for (const loc of locations) {
    lines.push(`## ${loc.name} · \`${loc.id}\``, '');
    for (const fish of loc.fish) {
      lines.push(`### ${fish.name} · \`${fish.id}\``, '', fishPrompt(fish, loc), '');
    }
  }
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

const locations = loadData();
const output = documentFor(locations);

if (process.argv.includes('--check')) {
  const existing = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, 'utf8') : '';
  if (existing !== output) {
    console.error('wiki/15-image-prompts.md 已過期；請執行 node tools/generate-image-prompts.js');
    process.exitCode = 1;
  } else {
    console.log(`描述索引已同步：${locations.length} 個釣點、${locations.reduce((n, loc) => n + loc.fish.length, 0)} 筆。`);
  }
} else {
  fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
  console.log(`已寫入 ${path.relative(ROOT, OUTPUT_PATH)}（${locations.length} 個釣點）。`);
}
