/* ===========================================================
   PetArt — 宠物「整只动物」SVG 美术 / 场景背景 / 换装道具
   纯字符串生成，无依赖。坐标系：宠物 200x220，场景 400x240

   设计要点：
   1) 体积感：身体/头部用径向渐变 + 柔和描边，不再是纯色图形堆叠
   2) 分阶段：10 个成长阶段在「头身比 / 眼睛样式 / 专属部件」上各不相同
   3) 可动部件：.pet-eyes / .pet-eyes-shut / .pet-tail / .pet-arm-l|r /
      .pet-legs / .pet-breathe 供 CSS 动画驱动
   =========================================================== */
(function () {
  let _uid = 0;
  const uid = (p) => p + '_' + (++_uid);

  /* ---------------- 颜色工具 ---------------- */
  function hex2rgb(h) {
    h = String(h || '#000000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.substring(0, 2), 16) || 0, parseInt(h.substring(2, 4), 16) || 0, parseInt(h.substring(4, 6), 16) || 0];
  }
  const c255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const hx = (v) => c255(v).toString(16).padStart(2, '0');
  function mixWhite(color, amt) {
    const c = hex2rgb(color);
    return '#' + c.map(v => hx(v + (255 - v) * amt)).join('');
  }
  function darken(color, amt) {
    const c = hex2rgb(color);
    return '#' + c.map(v => hx(v * (1 - amt))).join('');
  }

  /* ---------------- 物种外观配置 ----------------
     fur: 是否有毛发（决定呆毛/胸绒/鬃毛 是否适用；蛙、鸭用光环/闪光替代） */
  const SKIN = {
    cat:    { body: '#FFB86B', belly: '#FFF1DC', dark: '#E0894A', ear: 'triangle', tail: 'long',   muzzle: true,  whiskers: true, cheeks: true, fur: true },
    // 布偶猫：重点色——奶白身体 + 深棕面罩/耳/尾尖，蓝眼睛、粉鼻头
    ragdoll: { body: '#FFF1DC', belly: '#FFFFFF', dark: '#4A2C1A', ear: 'triangle', tail: 'long',   muzzle: true,  whiskers: true, cheeks: true, fur: true, mask: true, eye: '#2C6BC9', nose: '#F5A2B8', brow: '#FFF7EE' },
    // 熊猫：darkLimbs=四肢纯黑（不画肉垫）、darkEar=整只耳朵纯黑
    panda:  { body: '#FFFFFF', belly: '#FFFFFF', dark: '#38323F', ear: 'round',    tail: 'stub',   eyePatch: true, darkEar: true, darkLimbs: true, fur: true },
    dog:    { body: '#DCA36B', belly: '#FBE7CC', dark: '#A97640', ear: 'floppy',   tail: 'short',  muzzle: true,  cheeks: true, fur: true },
    rabbit: { body: '#F7F2FF', belly: '#FFFFFF', dark: '#C9BCDD', ear: 'long',     tail: 'fluff',  cheeks: true, fur: true },
    tiger:  { body: '#FFA940', belly: '#FFF0D6', dark: '#3A2E28', ear: 'round',    tail: 'long',   stripes: true, muzzle: true, whiskers: true, cheeks: true, fur: true },
    frog:   { body: '#6FD38A', belly: '#D9F7E2', dark: '#3FA961', ear: 'none',     tail: 'none',   frogEyes: true, spots: true, cheeks: true, fur: false },
    duck:   { body: '#FFD84D', belly: '#FFF2BE', dark: '#E8A800', ear: 'none',     tail: 'none',   beak: true,    duckFeet: true, fur: false },
    pig:    { body: '#FFB3C6', belly: '#FFE3EA', dark: '#E88AA3', ear: 'pig',      tail: 'curl',   snout: true,   cheeks: true, fur: true },
  };

  /* ---------------- 成长阶段形象表（index 1..9；0 为蛋）----------------
     head: 头部缩放（幼年大头，成年收敛）  body: 躯干缩放
     eye:  眼睛样式                        extras: 该阶段专属部件 */
  const STAGE_STYLE = [
    null,
    { head: 1.14, body: 0.88, eye: 'baby',    extras: [] },                                  // 1 小奶猫
    { head: 1.10, body: 0.93, eye: 'round',   extras: ['tuft'] },                            // 2 调皮
    { head: 1.06, body: 0.97, eye: 'shine',   extras: ['fluff'] },                           // 3 神气
    { head: 1.03, body: 1.00, eye: 'heart',   extras: ['fluff', 'spark'] },                  // 4 活力
    { head: 1.00, body: 1.02, eye: 'shine',   extras: ['fluff', 'collar'] },                 // 5 机灵
    { head: 0.99, body: 1.04, eye: 'elegant', extras: ['collar', 'spark'] },                 // 6 优雅
    { head: 0.98, body: 1.05, eye: 'cool',    extras: ['collar', 'tuft'] },                  // 7 酷酷
    { head: 0.97, body: 1.06, eye: 'brave',   extras: ['collar', 'mane'] },                  // 8 勇敢
    { head: 0.96, body: 1.08, eye: 'royal',   extras: ['collar', 'mane', 'crown'] },         // 9 大王
  ];
  // 非毛茸茸物种（蛙/鸭）用这些部件替代
  const FUR_ALT = { tuft: 'spark', fluff: 'spark', mane: 'glow' };

  /* ---------------- 换装：槽位与目录 ---------------- */
  const SLOTS = [
    { id: 'head', name: '头部' },
    { id: 'face', name: '脸部' },
    { id: 'neck', name: '颈部' },
    { id: 'body', name: '身体' },
    { id: 'hand', name: '手部' },
  ];

  // layer: 'behind' 表示画在身体之后（如披风）
  const OUTFITS = [
    { id: 'bow',     slot: 'neck', name: '蝴蝶结', emoji: '🎀', cost: 10 },
    { id: 'glasses', slot: 'face', name: '小眼镜', emoji: '👓', cost: 15 },
    { id: 'bib',     slot: 'body', name: '爱心兜兜', emoji: '💖', cost: 20 },
    { id: 'cap',     slot: 'head', name: '棒球帽', emoji: '🧢', cost: 20 },
    { id: 'scarf',   slot: 'neck', name: '小围巾', emoji: '🧣', cost: 25 },
    { id: 'tophat',  slot: 'head', name: '小礼帽', emoji: '🎩', cost: 30 },
    { id: 'wreath',  slot: 'head', name: '小花环', emoji: '🌸', cost: 35 },
    { id: 'grad',    slot: 'head', name: '学士帽', emoji: '🎓', cost: 40 },
    { id: 'cape',    slot: 'body', name: '小披风', emoji: '🦸', cost: 45, layer: 'behind' },
    { id: 'crown',   slot: 'head', name: '小王冠', emoji: '👑', cost: 60 },
    { id: 'basket',  slot: 'hand', name: '花篮',   emoji: '🧺', cost: 20 },
    { id: 'balloon', slot: 'hand', name: '小气球', emoji: '🎈', cost: 15 },
  ];
  const OUTFIT_MAP = {};
  OUTFITS.forEach(o => { OUTFIT_MAP[o.id] = o; });

  /* ---------------- 场景目录 ---------------- */
  const SCENES = [
    { id: 'meadow', name: '草地小屋', emoji: '🏡' },
    { id: 'forest', name: '森林小径', emoji: '🌳' },
    { id: 'night',  name: '星空夜色', emoji: '🌙' },
    { id: 'beach',  name: '海边沙滩', emoji: '🏖️' },
    { id: 'bedroom', name: '温馨卧室', emoji: '🛏️', cost: 10 },
  ];
  const SCENE_MAP = {};
  SCENES.forEach(s => { SCENE_MAP[s.id] = s; });

  /* ---------------- 几何常量 ---------------- */
  const CX = 100;
  const HEAD_CY = 82, HEAD_RX = 45, HEAD_RY = 42;   // 头（略扁更可爱）
  const BODY_CY = 146, BODY_RX = 43, BODY_RY = 38;  // 躯干
  const GROUND = 200;                                // 脚底
  // 缩放锚点：头以「颈部」为锚，身体以「下部」为锚，保证不会脱节
  const HEAD_ANCHOR = [CX, 118];
  const BODY_ANCHOR = [CX, 182];

  const tfOf = (k, a) => 'translate(' + a[0] + ',' + a[1] + ') scale(' + k.toFixed(4) + ') translate(' + (-a[0]) + ',' + (-a[1]) + ')';

  /* ---- 卧室「横卧」换算基准（设计空间单位，未经阶段缩放） ---- */
  const LIE_H = 186;       // 头顶→脚底高度，用来把身长换算到场景尺度
  const LIE_W = 128;       // 宠物宽度，用来换算横卧时的厚度
  const LIE_MAX = 184;     // 身长上限（受 100~300 的床面长度约束）
  const LIE_RATIO = 0.35;  // 厚度 / 身长（比站立时略扁，像贴在床上）
  const LIE_HEAD_X = 229;  // 头部中心落点 = 枕头中心
  const LIE_HEAD_K = 0.656;// 头中心距脚底占身长的比例（122 / LIE_H）
  const LIE_BOTTOM_Y = 183;// 身体下沿（压在床面上）
  // 各物种各阶段「实际横卧身长 / 基准身长」实测系数（长耳/长尾的宠物会略长，用于对位修正）
  const LIE_TALL = {
    cat:     [1.048,1.042,1.007,0.991,0.976,0.971,0.979,0.960,1.022],
    ragdoll: [1.048,1.042,1.007,0.991,0.976,0.971,0.979,0.960,1.022],
    tiger:   [1.030,1.042,0.990,0.975,0.960,0.955,0.979,0.945,1.022],
    panda:   [1.030,1.042,0.990,0.975,0.960,0.955,0.979,0.945,1.022],
    pig:     [1.008,1.042,0.969,0.955,0.940,0.936,0.979,0.938,1.022],
    frog:    [1.017,0.998,0.978,0.964,0.949,0.944,0.939,0.997,1.022],
    duck:    [0.948,0.932,0.915,0.902,0.890,0.886,0.881,1.008,1.033],
    dog:     [0.938,1.042,0.904,0.892,0.879,0.875,0.979,0.938,1.022],
    rabbit:  [1.171,1.146,1.121,1.102,1.083,1.077,1.071,1.065,1.058]
  };

  /* ---------------- 小工具 ---------------- */
  function heartPath(cx, cy, s) {
    return 'M ' + cx + ',' + (cy + 24 * s) +
      ' C ' + (cx - 22 * s) + ',' + (cy + 6 * s) + ' ' + (cx - 28 * s) + ',' + (cy - 8 * s) + ' ' + (cx - 14 * s) + ',' + (cy - 17 * s) +
      ' C ' + (cx - 6 * s) + ',' + (cy - 23 * s) + ' ' + cx + ',' + (cy - 14 * s) + ' ' + cx + ',' + (cy - 8 * s) +
      ' C ' + cx + ',' + (cy - 14 * s) + ' ' + (cx + 6 * s) + ',' + (cy - 23 * s) + ' ' + (cx + 14 * s) + ',' + (cy - 17 * s) +
      ' C ' + (cx + 28 * s) + ',' + (cy - 8 * s) + ' ' + (cx + 22 * s) + ',' + (cy + 6 * s) + ' ' + cx + ',' + (cy + 24 * s) + ' Z';
  }
  function flower(cx, cy, s, petal, core) {
    let out = '';
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      out += '<circle cx="' + (cx + Math.cos(a) * 5.5 * s).toFixed(1) + '" cy="' + (cy + Math.sin(a) * 5.5 * s).toFixed(1) + '" r="' + (4 * s).toFixed(1) + '" fill="' + petal + '"/>';
    }
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (3.2 * s).toFixed(1) + '" fill="' + core + '"/>';
    return out;
  }
  // 四角星闪光
  function sparkle(cx, cy, r, fill) {
    return '<path d="M ' + cx + ',' + (cy - r) +
      ' Q ' + cx + ',' + cy + ' ' + (cx + r) + ',' + cy +
      ' Q ' + cx + ',' + cy + ' ' + cx + ',' + (cy + r) +
      ' Q ' + cx + ',' + cy + ' ' + (cx - r) + ',' + cy +
      ' Q ' + cx + ',' + cy + ' ' + cx + ',' + (cy - r) + ' Z" fill="' + fill + '"/>';
  }

  /* ---------------- 渐变定义（每只宠物唯一 id，避免互相污染）---------------- */
  function defsSvg(s, gid) {
    return '<defs>' +
      '<radialGradient id="' + gid + '_body" cx="36%" cy="26%" r="82%">' +
        '<stop offset="0%" stop-color="' + mixWhite(s.body, 0.42) + '"/>' +
        '<stop offset="62%" stop-color="' + s.body + '"/>' +
        '<stop offset="100%" stop-color="' + darken(s.body, 0.10) + '"/></radialGradient>' +
      '<radialGradient id="' + gid + '_head" cx="34%" cy="22%" r="84%">' +
        '<stop offset="0%" stop-color="' + mixWhite(s.body, 0.40) + '"/>' +
        '<stop offset="60%" stop-color="' + s.body + '"/>' +
        '<stop offset="100%" stop-color="' + darken(s.body, 0.09) + '"/></radialGradient>' +
      '<radialGradient id="' + gid + '_belly" cx="50%" cy="34%" r="72%">' +
        '<stop offset="0%" stop-color="#ffffff"/>' +
        '<stop offset="100%" stop-color="' + s.belly + '"/></radialGradient>' +
      '<radialGradient id="' + gid + '_blush" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#FF7FB0" stop-opacity=".62"/>' +
        '<stop offset="70%" stop-color="#FF9DBB" stop-opacity=".26"/>' +
        '<stop offset="100%" stop-color="#FF9DBB" stop-opacity="0"/></radialGradient>' +
      '</defs>';
  }

  /* ---------------- 各部件 ---------------- */
  function tailSvg(kind, s) {
    const c = s.body, d = s.dark;
    if (kind === 'long') {
      // 布偶猫：长尾整条深棕（重点色）
      const tcol = s.mask ? s.dark : darken(c, 0.06);
      const ttip = s.mask ? darken(s.dark, 0.12) : mixWhite(c, 0.3);
      return '<g class="pet-tail">' +
        '<path d="M 136,170 C 180,176 188,120 158,102" fill="none" stroke="' + tcol + '" stroke-width="15" stroke-linecap="round"/>' +
        '<path d="M 158,104 C 167,96 174,100 176,108" fill="none" stroke="' + ttip + '" stroke-width="11" stroke-linecap="round"/></g>';
    }
    if (kind === 'short') {
      return '<g class="pet-tail">' +
        '<path d="M 136,166 C 168,162 172,128 152,122" fill="none" stroke="' + darken(c, 0.06) + '" stroke-width="13" stroke-linecap="round"/>' +
        '<path d="M 152,124 C 160,120 164,124 163,130" fill="none" stroke="' + mixWhite(c, 0.3) + '" stroke-width="9" stroke-linecap="round"/></g>';
    }
    if (kind === 'stub') {
      return '<g class="pet-tail">' +
        '<path d="M 136,174 C 156,176 158,152 147,146" fill="none" stroke="' + darken(c, 0.08) + '" stroke-width="12" stroke-linecap="round"/></g>';
    }
    if (kind === 'fluff') {
      return '<g class="pet-tail">' +
        '<circle cx="150" cy="174" r="16" fill="' + mixWhite(c, 0.5) + '"/>' +
        '<circle cx="152" cy="172" r="10" fill="#FFFFFF" opacity=".85"/></g>';
    }
    if (kind === 'curl') {
      return '<g class="pet-tail">' +
        '<path d="M 134,166 c 18,-3 20,-18 6,-20 c -10,-2 -10,10 2,10" fill="none" stroke="' + darken(c, 0.06) + '" stroke-width="9" stroke-linecap="round"/></g>';
    }
    return '';
  }

  function earsSvg(kind, s) {
    const c = s.body, d = s.dark, line = darken(c, 0.16);
    if (kind === 'triangle') {
      // 耳朵画在头部之前：耳根刻意埋进头部椭圆内，被头遮住，只露出头顶以上的部分
      // 尺寸约为原来的 80%，并整体向两侧外扩（耳尖 54→50，内侧角 96→84）
      // 布偶猫：耳内用深棕（重点色），其余猫用粉色
      const innerCol = s.mask ? s.dark : '#FFD0DE';
      return '<g class="pet-ears">' +
        '<path d="M 66,76 L 50,22 L 84,46 Z" fill="' + c + '" stroke="' + line + '" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M 65.2,61.8 L 56,30.4 L 75.7,44.4 Z" fill="' + innerCol + '"/>' +
        '<path d="M 134,76 L 150,22 L 116,46 Z" fill="' + c + '" stroke="' + line + '" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M 134.8,61.8 L 144,30.4 L 124.3,44.4 Z" fill="' + innerCol + '"/></g>';
    }
    if (kind === 'round') {
      // 熊猫：真实熊猫耳朵是整只纯黑的圆耳，没有浅色内耳
      if (s.darkEar) {
        const eLine = darken(d, 0.3);
        return '<g class="pet-ears">' +
          '<circle cx="68" cy="44" r="19" fill="' + d + '" stroke="' + eLine + '" stroke-width="2.4"/>' +
          '<circle cx="132" cy="44" r="19" fill="' + d + '" stroke="' + eLine + '" stroke-width="2.4"/></g>';
      }
      const inner = s.eyePatch ? darken(d, 0.1) : '#F2E7F8';
      return '<g class="pet-ears">' +
        '<circle cx="68" cy="44" r="19" fill="' + c + '" stroke="' + line + '" stroke-width="2.4"/><circle cx="68" cy="44" r="10.5" fill="' + inner + '"/>' +
        '<circle cx="132" cy="44" r="19" fill="' + c + '" stroke="' + line + '" stroke-width="2.4"/><circle cx="132" cy="44" r="10.5" fill="' + inner + '"/></g>';
    }
    if (kind === 'floppy') {
      return '<g class="pet-ears">' +
        '<ellipse cx="56" cy="94" rx="15" ry="32" fill="' + darken(c, 0.2) + '" transform="rotate(13 56 94)"/>' +
        '<ellipse cx="60" cy="96" rx="8" ry="24" fill="' + darken(c, 0.34) + '" opacity=".5" transform="rotate(13 60 96)"/>' +
        '<ellipse cx="144" cy="94" rx="15" ry="32" fill="' + darken(c, 0.2) + '" transform="rotate(-13 144 94)"/>' +
        '<ellipse cx="140" cy="96" rx="8" ry="24" fill="' + darken(c, 0.34) + '" opacity=".5" transform="rotate(-13 140 96)"/></g>';
    }
    if (kind === 'long') {
      return '<g class="pet-ears">' +
        '<rect x="74" y="2" width="19" height="56" rx="9.5" fill="' + c + '" stroke="' + line + '" stroke-width="2.2"/>' +
        '<rect x="79" y="11" width="9" height="37" rx="4.5" fill="#FFC2D6"/>' +
        '<rect x="107" y="2" width="19" height="56" rx="9.5" fill="' + c + '" stroke="' + line + '" stroke-width="2.2"/>' +
        '<rect x="112" y="11" width="9" height="37" rx="4.5" fill="#FFC2D6"/></g>';
    }
    if (kind === 'pig') {
      return '<g class="pet-ears">' +
        '<path d="M 68,50 Q 54,20 92,32 Z" fill="' + c + '" stroke="' + line + '" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M 132,50 Q 146,20 108,32 Z" fill="' + c + '" stroke="' + line + '" stroke-width="2.6" stroke-linejoin="round"/></g>';
    }
    return '';
  }

  function legsSvg(kind, s) {
    const c = s.body, d = s.dark;
    const padCol = mixWhite(d, 0.45);
    const toes = (cx) => '<circle cx="' + (cx - 5) + '" cy="194" r="1.9"/><circle cx="' + cx + '" cy="193" r="1.9"/><circle cx="' + (cx + 5) + '" cy="194" r="1.9"/>';
    // 熊猫四肢纯黑：腿/脚掌都用 dark，且不画浅色肉垫（真熊猫脚掌是纯黑的）
    const legCol = s.darkLimbs ? d : c;
    const feet = kind === 'duck'
      ? '<ellipse cx="79" cy="197" rx="18" ry="8.5" fill="#FF9A3D" stroke="#E87A00" stroke-width="2"/>' +
        '<ellipse cx="121" cy="197" rx="18" ry="8.5" fill="#FF9A3D" stroke="#E87A00" stroke-width="2"/>'
      : '<ellipse cx="81.5" cy="196" rx="13" ry="7.5" fill="' + d + '"/>' +
        (s.darkLimbs ? '' : '<g fill="' + padCol + '">' + toes(81.5) + '</g>') +
        '<ellipse cx="118.5" cy="196" rx="13" ry="7.5" fill="' + d + '"/>' +
        (s.darkLimbs ? '' : '<g fill="' + padCol + '">' + toes(118.5) + '</g>');
    return '<g class="pet-legs">' +
      '<g class="pet-leg pet-leg-l"><rect x="72" y="168" width="19" height="32" rx="9.5" fill="' + legCol + '"/></g>' +
      '<g class="pet-leg pet-leg-r"><rect x="109" y="168" width="19" height="32" rx="9.5" fill="' + legCol + '"/></g>' +
      feet + '</g>';
  }

  function bodySvg(s, gid) {
    const line = darken(s.body, 0.16);
    // 熊猫：手臂（前肢）也是纯黑的
    const armCol = s.darkLimbs ? s.dark : s.body;
    const armLine = s.darkLimbs ? darken(s.dark, 0.28) : line;
    return '<g class="pet-body">' +
      // 下摆（略宽，形成稳妥的梨形；底边不能压到脚掌）
      '<ellipse cx="' + CX + '" cy="162" rx="44" ry="24" fill="url(#' + gid + '_body)" stroke="' + line + '" stroke-width="2.4"/>' +
      '<ellipse cx="' + CX + '" cy="' + BODY_CY + '" rx="' + BODY_RX + '" ry="' + BODY_RY + '" fill="url(#' + gid + '_body)" stroke="' + line + '" stroke-width="2.4"/>' +
      '<ellipse cx="' + CX + '" cy="158" rx="27" ry="25" fill="url(#' + gid + '_belly)"/>' +
      '<g class="pet-arm pet-arm-l"><ellipse cx="56" cy="148" rx="12.5" ry="19" fill="' + armCol + '" stroke="' + armLine + '" stroke-width="2.2" transform="rotate(-13 56 148)"/></g>' +
      '<g class="pet-arm pet-arm-r"><ellipse cx="144" cy="148" rx="12.5" ry="19" fill="' + armCol + '" stroke="' + armLine + '" stroke-width="2.2" transform="rotate(13 144 148)"/></g>' +
      '</g>';
  }

  function headSvg(s, gid) {
    const line = darken(s.body, 0.16);
    // 脸颊绒毛：先画带描边的绒球，再用头部覆盖其内侧，
    // 露在外面的弧线就成了蓬松的轮廓（描边连续，不会有断层）
    return '<circle cx="68" cy="102" r="15" fill="url(#' + gid + '_head)" stroke="' + line + '" stroke-width="2.6"/>' +
      '<circle cx="132" cy="102" r="15" fill="url(#' + gid + '_head)" stroke="' + line + '" stroke-width="2.6"/>' +
      '<ellipse cx="' + CX + '" cy="' + HEAD_CY + '" rx="' + HEAD_RX + '" ry="' + HEAD_RY + '" fill="url(#' + gid + '_head)" stroke="' + line + '" stroke-width="2.6"/>' +
      // 顶部高光，增加体积感
      '<ellipse cx="86" cy="58" rx="17" ry="10" fill="#ffffff" opacity=".28" transform="rotate(-18 86 58)"/>';
  }

  function marksSvg(s) {
    let out = '';
    if (s.stripes) {
      out += '<g class="pet-marks" stroke="' + s.dark + '" stroke-width="5" stroke-linecap="round" fill="none" opacity=".85">' +
        '<path d="M 62,118 q 10,6 7,17"/><path d="M 138,118 q -10,6 -7,17"/>' +
        '<path d="M 66,162 q 11,4 15,-3"/><path d="M 134,162 q -11,4 -15,-3"/>' +
        '<path d="M 72,52 q 7,-8 15,-8"/><path d="M 128,52 q -7,-8 -15,-8"/></g>';
    }
    if (s.spots) {
      out += '<g class="pet-marks" fill="' + s.dark + '" opacity=".3">' +
        '<circle cx="74" cy="158" r="7.5"/><circle cx="126" cy="154" r="5.5"/><circle cx="100" cy="176" r="4.5"/></g>';
    }
    if (s.eyePatch) {
      out += '<g class="pet-marks">' +
        '<ellipse cx="84" cy="78" rx="18" ry="21" fill="' + s.dark + '" transform="rotate(-14 84 78)"/>' +
        '<ellipse cx="116" cy="78" rx="18" ry="21" fill="' + s.dark + '" transform="rotate(14 116 78)"/></g>';
    }
    return out;
  }

  /* 布偶猫重点色面罩：深棕覆盖双眼+口鼻，中间留一道奶白火焰纹（鼻梁到额头） */
  function maskSvg(s) {
    const m = s.dark, cream = s.body;
    return '<g class="pet-mask">' +
      '<ellipse cx="83" cy="80" rx="21" ry="23" fill="' + m + '"/>' +
      '<ellipse cx="117" cy="80" rx="21" ry="23" fill="' + m + '"/>' +
      '<ellipse cx="100" cy="99" rx="17" ry="15" fill="' + m + '"/>' +
      '<path d="M 100,58 C 95,72 95,86 100,100 C 105,86 105,72 100,58 Z" fill="' + cream + '"/></g>';
  }

  /* 眼睛：8 种样式，随成长阶段变化 */
  function eyesSvg(kind, s) {
    const d = s.dark;
    const CY = 78, LX = 84, RX = 116;
    const white = '#FFFFFF';
    // 眼形
    const shape = {
      baby:    { rx: 11,  ry: 13.5 },
      round:   { rx: 9.5, ry: 12 },
      shine:   { rx: 9.5, ry: 12 },
      heart:   { rx: 9.5, ry: 12 },
      elegant: { rx: 8,   ry: 12.5 },
      cool:    { rx: 9.5, ry: 9 },
      brave:   { rx: 9.5, ry: 12 },
      royal:   { rx: 9.5, ry: 12 },
    }[kind] || { rx: 9.5, ry: 12 };
    // 瞳孔颜色：布偶猫用蓝眼 s.eye，其余默认深紫
    const pupil = s.eyePatch ? white : (s.eye || '#3B3550');
    const glint = white;
    // 眉/睫细节描边：布偶猫面罩是深棕，需用浅色 s.brow 才看得清
    const detail = s.brow || s.dark;

    let out = '<g class="pet-eyes">';
    [LX, RX].forEach((cx) => {
      out += '<ellipse cx="' + cx + '" cy="' + CY + '" rx="' + shape.rx + '" ry="' + shape.ry + '" fill="' + pupil + '"/>';
      if (kind === 'heart') {
        out += '<path d="' + heartPath(cx + 1, CY - 2, 0.19) + '" fill="#FF8FB8"/>';
      } else if (kind === 'shine' || kind === 'royal') {
        out += '<circle cx="' + (cx + 2.2) + '" cy="' + (CY - 4) + '" r="2.8" fill="' + glint + '"/>';
        out += sparkle(cx - 2.5, CY + 3.5, 2.6, glint);
      } else {
        out += '<circle cx="' + (cx + 2.4) + '" cy="' + (CY - 4) + '" r="' + (kind === 'baby' ? 3.6 : 3.1) + '" fill="' + glint + '"/>';
        out += '<circle cx="' + (cx - 2.6) + '" cy="' + (CY + 3.8) + '" r="1.7" fill="' + glint + '" opacity=".85"/>';
      }
      if (kind === 'baby') {
        out += '<circle cx="' + (cx - 4.5) + '" cy="' + (CY + 5.5) + '" r="1.6" fill="' + glint + '" opacity=".7"/>';
      }
    });
    // 附加细节
    if (kind === 'elegant') {
      out += '<g stroke="' + detail + '" stroke-width="2.6" stroke-linecap="round" fill="none">' +
        '<path d="M 72,66 q -5,-4 -7,-9"/><path d="M 79,62 q -1,-5 -3,-9"/>' +
        '<path d="M 128,66 q 5,-4 7,-9"/><path d="M 121,62 q 1,-5 3,-9"/></g>';
    }
    if (kind === 'cool') {
      out += '<g stroke="' + detail + '" stroke-width="3" stroke-linecap="round" fill="none">' +
        '<path d="M 74,68 l 20,-2"/><path d="M 126,68 l -20,-2"/></g>';
    }
    if (kind === 'brave') {
      out += '<g stroke="' + detail + '" stroke-width="3.2" stroke-linecap="round" fill="none">' +
        '<path d="M 74,62 q 10,-6 20,-2"/><path d="M 126,62 q -10,-6 -20,-2"/></g>';
    }
    if (kind === 'royal') {
      out += '<g stroke="#E8A800" stroke-width="3" stroke-linecap="round" fill="none">' +
        '<path d="M 74,62 q 10,-5 20,-1"/><path d="M 126,62 q -10,-5 -20,-1"/></g>';
    }
    out += '</g>';

    // 闭眼（眨眼 / 睡觉）
    out += '<g class="pet-eyes-shut" fill="none" stroke="' + d + '" stroke-width="4" stroke-linecap="round">' +
      '<path d="M ' + (LX - 9) + ',' + CY + ' q 9,9 18,0"/><path d="M ' + (RX - 9) + ',' + CY + ' q 9,9 18,0"/></g>';
    return out;
  }

  /* 青蛙凸眼单独处理（眼睛长在头顶） */
  function frogEyesSvg(s) {
    const d = s.dark, CY = 46;
    return '<g class="pet-eyes">' +
      '<circle cx="74" cy="' + CY + '" r="19" fill="' + s.body + '" stroke="' + darken(s.body, 0.16) + '" stroke-width="2.4"/>' +
      '<circle cx="74" cy="' + CY + '" r="12.5" fill="#fff"/><circle cx="77" cy="45" r="6.2" fill="' + d + '"/>' +
      '<circle cx="79.5" cy="42" r="2.4" fill="#fff"/>' +
      '<circle cx="126" cy="' + CY + '" r="19" fill="' + s.body + '" stroke="' + darken(s.body, 0.16) + '" stroke-width="2.4"/>' +
      '<circle cx="126" cy="' + CY + '" r="12.5" fill="#fff"/><circle cx="129" cy="45" r="6.2" fill="' + d + '"/>' +
      '<circle cx="131.5" cy="42" r="2.4" fill="#fff"/></g>' +
      '<g class="pet-eyes-shut" fill="none" stroke="' + d + '" stroke-width="4" stroke-linecap="round">' +
      '<path d="M 64,' + CY + ' q 10,9 20,0"/><path d="M 116,' + CY + ' q 10,9 20,0"/></g>';
  }

  function faceSvg(s, gid, eyeKind) {
    const d = s.dark;
    let out = '';

    out += s.frogEyes ? frogEyesSvg(s) : eyesSvg(eyeKind, s);

    // 口鼻：先铺浅色口鼻垫，再画鼻 / 嘴 / 喙 / 猪鼻，保证层次正确
    // 布偶猫有面罩（mask），口鼻区域已是深棕，不再铺白色口鼻垫
    if (s.muzzle && !s.mask) {
      out += '<ellipse cx="100" cy="102" rx="23" ry="16" fill="' + s.belly + '" opacity=".95"/>';
    }
    if (s.beak) {
      out += '<path d="M 82,92 Q 100,84 118,92 Q 116,110 100,112 Q 86,110 82,92 Z" fill="#FF9A3D" stroke="#E87A00" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M 86,99 Q 100,104 114,99" fill="none" stroke="#E87A00" stroke-width="2.5" stroke-linecap="round"/>';
    } else if (s.snout) {
      out += '<ellipse cx="100" cy="98" rx="18" ry="13" fill="' + d + '"/>' +
        '<ellipse cx="94" cy="98" rx="2.8" ry="4.5" fill="#B85F75"/><ellipse cx="106" cy="98" rx="2.8" ry="4.5" fill="#B85F75"/>' +
        '<path d="M 88,118 q 12,9 24,0" fill="none" stroke="#B85F75" stroke-width="3" stroke-linecap="round"/>';
    } else if (s.frogEyes) {
      // 青蛙：宽宽的大笑嘴
      out += '<path d="M 76,104 q 24,20 48,0" fill="none" stroke="' + d + '" stroke-width="3.4" stroke-linecap="round"/>';
    } else {
      out += '<path d="M 95,94 Q 100,88 105,94 Q 100,102 95,94 Z" fill="' + (s.nose || s.dark) + '"/>' +
        '<g class="pet-mouth"><path d="M 90,102 q 10,10 20,0" fill="none" stroke="' + d + '" stroke-width="3" stroke-linecap="round"/></g>';
    }

    if (s.whiskers) {
      // 布偶猫面罩是深棕，胡须用白色才看得清
      out += '<g stroke="' + (s.mask ? '#FFFFFF' : s.dark) + '" stroke-width="2.2" stroke-linecap="round" opacity=".65" fill="none">' +
        '<path d="M 78,102 L 46,96"/><path d="M 78,107 L 47,108"/>' +
        '<path d="M 122,102 L 154,96"/><path d="M 122,107 L 153,108"/></g>';
    }
    if (s.cheeks) {
      out += '<ellipse cx="66" cy="98" rx="12" ry="10" fill="url(#' + gid + '_blush)"/>' +
        '<ellipse cx="134" cy="98" rx="12" ry="10" fill="url(#' + gid + '_blush)"/>';
    }
    return out;
  }

  /* ---------------- 阶段专属部件 ---------------- */
  function extraSvg(name, s) {
    switch (name) {
      case 'tuft': // 头顶呆毛
        return '<g class="pet-tuft" stroke="' + darken(s.body, 0.22) + '" stroke-width="2.4" stroke-linejoin="round" fill="' + s.body + '">' +
          '<path d="M 92,46 C 87,27 99,17 108,20 C 99,26 103,36 103,46 Z"/>' +
          '<path d="M 105,46 C 108,31 118,25 124,30 C 114,33 111,39 111,46 Z"/></g>';
      case 'fluff': // 胸前绒毛
        return '<g class="pet-fluff" fill="' + mixWhite(s.body, 0.5) + '">' +
          '<circle cx="83" cy="130" r="11"/><circle cx="100" cy="136" r="13"/><circle cx="117" cy="130" r="11"/></g>';
      case 'collar': // 项圈 + 铃铛
        return '<g class="pet-collar">' +
          '<path d="M 74,122 Q 100,136 126,122 L 128,132 Q 100,147 72,132 Z" fill="#FF6B9D" stroke="#E8407C" stroke-width="2"/>' +
          '<circle cx="100" cy="140" r="8.5" fill="#FFD24D" stroke="#E8A800" stroke-width="2"/>' +
          '<path d="M 95.5,140 h 9" stroke="#E8A800" stroke-width="2" stroke-linecap="round"/>' +
          '<circle cx="100" cy="143.5" r="2.2" fill="#E8A800"/></g>';
      case 'mane': { // 鬃毛（画在头后，形成一圈蓬松；不挡耳朵）
          let bumps = '';
          // 留出顶部耳区（角度 -2π/3 .. -π/3 跳过），保证耳朵探出来
          const N = 17, skipFrom = -Math.PI * 0.62, skipTo = -Math.PI * 0.38;
          for (let i = 0; i < N; i++) {
            const a = (Math.PI * 2 * i) / N - Math.PI / 2;
            if (a > skipFrom && a < skipTo) continue;
            const r = 49, ry = 47;
            bumps += '<circle cx="' + (CX + Math.cos(a) * r).toFixed(1) + '" cy="' + (HEAD_CY + Math.sin(a) * ry).toFixed(1) + '" r="12" fill="' + s.dark + '"/>';
          }
          return '<g class="pet-mane">' + bumps + '</g>';
        }
      case 'glow': // 光环（非毛茸茸物种替代鬃毛）
        return '<g class="pet-glow">' +
          '<circle cx="100" cy="82" r="57" fill="none" stroke="#FFE97A" stroke-width="7" opacity=".5"/>' +
          '<circle cx="100" cy="82" r="67" fill="none" stroke="#FFF3B0" stroke-width="3.5" opacity=".32"/></g>';
      case 'crown': // 金冠（终极形态）
        return '<g class="pet-crown">' +
          '<path d="M 66,46 L 66,14 L 84,31 L 100,9 L 116,31 L 134,14 L 134,46 Z" fill="#FFD24D" stroke="#E8A800" stroke-width="3" stroke-linejoin="round"/>' +
          '<circle cx="100" cy="39" r="4.5" fill="#FF5C8A"/><circle cx="78" cy="41" r="3.5" fill="#5CC0FF"/><circle cx="122" cy="41" r="3.5" fill="#5FD38A"/></g>';
      case 'spark': // 身边小闪光
        return '<g class="pet-spark">' +
          sparkle(34, 104, 6.5, '#FFF3B0') + sparkle(166, 84, 5.5, '#FFE97A') +
          sparkle(158, 132, 4.2, '#FFF3B0') + sparkle(46, 62, 4, '#FFE97A') + '</g>';
      default:
        return '';
    }
  }

  /* ---------------- 装扮绘制 ---------------- */
  function outfitSvg(id, s) {
    switch (id) {
      case 'bow':
        return '<g class="outfit-bow">' +
          '<path d="M 100,122 L 73,106 L 73,138 Z" fill="#FF6B9D"/>' +
          '<path d="M 100,122 L 127,106 L 127,138 Z" fill="#FF6B9D"/>' +
          '<ellipse cx="100" cy="122" rx="7.5" ry="9" fill="#E8407C"/></g>';
      case 'glasses':
        return '<g class="outfit-glasses" fill="none" stroke="#3B3550" stroke-width="4">' +
          '<circle cx="84" cy="78" r="16" fill="rgba(255,255,255,.3)"/>' +
          '<circle cx="116" cy="78" r="16" fill="rgba(255,255,255,.3)"/>' +
          '<path d="M 100,78 h 0"/><path d="M 68,74 L 54,68"/><path d="M 132,74 L 146,68"/></g>';
      case 'bib':
        return '<g class="outfit-bib"><path d="' + heartPath(100, 152, 1.05) + '" fill="#FF8FB8" stroke="#E8608F" stroke-width="2.5"/></g>';
      case 'cap':
        return '<g class="outfit-cap">' +
          '<path d="M 58,54 Q 100,12 142,54 Z" fill="#5CC0FF"/>' +
          '<path d="M 130,54 Q 174,54 178,64 Q 142,71 126,60 Z" fill="#3FA9E0"/>' +
          '<circle cx="100" cy="20" r="6" fill="#3FA9E0"/></g>';
      case 'scarf':
        return '<g class="outfit-scarf">' +
          '<path d="M 64,116 Q 100,134 136,116 L 138,133 Q 100,151 62,133 Z" fill="#5CC0FF"/>' +
          '<path d="M 118,134 L 137,134 L 132,174 L 113,170 Z" fill="#3FA9E0"/></g>';
      case 'tophat':
        return '<g class="outfit-tophat">' +
          '<rect x="74" y="2" width="52" height="46" fill="#3B3550"/>' +
          '<rect x="74" y="30" width="52" height="11" fill="#FF6B9D"/>' +
          '<ellipse cx="100" cy="48" rx="49" ry="9" fill="#4A4363"/></g>';
      case 'wreath':
        return '<g class="outfit-wreath">' +
          '<path d="M 56,66 A 46,46 0 0 1 144,66" fill="none" stroke="#5FD38A" stroke-width="7" stroke-linecap="round"/>' +
          flower(62, 56, 1.15, '#FF8FB8', '#FFCE3A') +
          flower(79, 36, 1.15, '#FFB3D9', '#FFCE3A') +
          flower(100, 27, 1.2, '#FF8FB8', '#FFF3B0') +
          flower(121, 36, 1.15, '#FFB3D9', '#FFCE3A') +
          flower(138, 56, 1.15, '#FF8FB8', '#FFCE3A') + '</g>';
      case 'grad':
        return '<g class="outfit-grad">' +
          '<path d="M 58,46 L 100,27 L 142,46 L 100,65 Z" fill="#3B3550"/>' +
          '<path d="M 142,46 L 154,68" stroke="#FFCE3A" stroke-width="3.5" fill="none"/>' +
          '<circle cx="155" cy="71" r="5" fill="#FFCE3A"/></g>';
      case 'cape':
        return '<g class="outfit-cape">' +
          '<path d="M 56,112 Q 100,86 144,112 L 166,194 Q 100,214 34,194 Z" fill="#8B6BD9"/>' +
          '<path d="M 56,112 Q 100,86 144,112 L 138,122 Q 100,100 62,122 Z" fill="#6F52BE"/></g>';
      case 'crown':
        return '<g class="outfit-crown">' +
          '<path d="M 62,50 L 62,18 L 82,34 L 100,12 L 118,34 L 138,18 L 138,50 Z" fill="#FFD24D" stroke="#E8A800" stroke-width="3" stroke-linejoin="round"/>' +
          '<circle cx="100" cy="42" r="4.5" fill="#FF5C8A"/><circle cx="76" cy="44" r="3.5" fill="#5CC0FF"/><circle cx="124" cy="44" r="3.5" fill="#5FD38A"/></g>';
      case 'basket':
        return '<g class="outfit-basket">' +
          // 提手
          '<path d="M 126,170 Q 140,142 154,170" fill="none" stroke="#A86A35" stroke-width="3.4" stroke-linecap="round"/>' +
          // 花茎
          '<path d="M 140,168 L 140,150" stroke="#5FB36A" stroke-width="2.4"/>' +
          '<path d="M 132,168 L 131,153" stroke="#5FB36A" stroke-width="2.4"/>' +
          '<path d="M 148,168 L 149,153" stroke="#5FB36A" stroke-width="2.4"/>' +
          // 花朵（从篮口探出）
          flower(132, 151, 1.05, '#FF8FB8', '#FFCE3A') +
          flower(140, 144, 1.18, '#FFB3D9', '#FFF3B0') +
          flower(148, 151, 1.05, '#FF8FB8', '#FFCE3A') +
          // 篮身
          '<path d="M 126,170 Q 124,184 140,186 Q 156,184 154,170 Z" fill="#D89A5B" stroke="#A86A35" stroke-width="2.5" stroke-linejoin="round"/>' +
          // 篮口
          '<ellipse cx="140" cy="170" rx="15" ry="4.6" fill="#B5793F" stroke="#8A5A2C" stroke-width="2"/>' +
          // 编织纹
          '<path d="M 133,172 L 132,184 M 140,173 L 140,186 M 147,172 L 148,184" stroke="#9A6630" stroke-width="1.5" opacity=".55"/>' +
          '<path d="M 127,177 Q 140,183 153,177 M 126,182 Q 140,188 154,182" fill="none" stroke="#9A6630" stroke-width="1.4" opacity=".5"/>' +
        '</g>';
      case 'balloon':
        return '<g class="outfit-balloon">' +
          // 牵线（从右手牵出）
          '<path d="M 140,167 Q 150,135 156,110" fill="none" stroke="#B9A892" stroke-width="1.6"/>' +
          // 气球
          '<ellipse cx="158" cy="94" rx="16" ry="20" fill="#FF7BAC"/>' +
          '<ellipse cx="152" cy="88" rx="4.5" ry="6.5" fill="rgba(255,255,255,.55)"/>' +
          '<path d="M 158,114 L 154,121 L 162,121 Z" fill="#FF7BAC"/>' +
          sparkle(150, 96, 4, 'rgba(255,255,255,.7)') +
        '</g>';
      default:
        return '';
    }
  }

  /* ---------------- 阶段形象参数 ---------------- */
  function stageStyle(stageIndex, s) {
    const i = Math.max(1, Math.min(9, stageIndex || 1));
    const base = STAGE_STYLE[i];
    const furry = s.fur !== false;
    let extras = base.extras.map(e => (furry ? e : (FUR_ALT[e] || e)));
    extras = extras.filter((e, idx) => extras.indexOf(e) === idx); // 去重
    return { head: base.head, body: base.body, eye: base.eye, extras: extras };
  }

  /* ---------------- 宠物主入口 ---------------- */
  // 生成宠物的「部件」：defs（渐变定义）+ actor（带呼吸的整体组）。
  // 既用于独立站立的宠物 SVG，也用于场景中「横卧」的宠物（外再套一层 transform 摆放）。
  function petParts(opt) {
    opt = opt || {};
    const species = opt.species || 'cat';
    const stageIndex = (opt.stageIndex == null ? 1 : opt.stageIndex);
    const s = SKIN[species] || SKIN.cat;
    const st = stageStyle(stageIndex, s);
    const gid = uid('pg');

    const wearing = opt.wearing || {};
    const equipped = [];
    SLOTS.forEach(sl => {
      const id = wearing[sl.id];
      if (id && OUTFIT_MAP[id]) equipped.push(OUTFIT_MAP[id]);
    });
    const pick = (slots) => equipped.filter(o => slots.indexOf(o.slot) >= 0);
    const cape = equipped.filter(o => o.layer === 'behind');
    const bodyFront = pick(['body']).filter(o => o.layer !== 'behind');
    const neckWear = pick(['neck']);
    const headWear = pick(['head']);
    const faceWear = pick(['face']);
    const handWear = pick(['hand']);

    // 整体随阶段长大（脚底固定）
    const step = Math.min(8, Math.max(0, stageIndex - 1));
    const overall = (0.84 + step * 0.028).toFixed(3);
    const tf = 'translate(' + CX + ',204) scale(' + overall + ') translate(-' + CX + ',-204)';
    const headTf = tfOf(st.head, HEAD_ANCHOR);
    const bodyTf = tfOf(st.body, BODY_ANCHOR);

    const wraps = (inner, t) => (t ? '<g transform="' + t + '">' + inner + '</g>' : inner);

    // 阶段专属部件按绘制层级归类
    const has = (n) => st.extras.indexOf(n) >= 0;
    const behindHead = [];  // 头后
    const inBody = [];      // 躯干（会被头遮住）
    const onHead = [];      // 头顶/脸上
    if (has('mane')) behindHead.push(extraSvg('mane', s));
    if (has('glow')) behindHead.push(extraSvg('glow', s));
    if (has('fluff')) inBody.push(extraSvg('fluff', s));
    if (has('tuft')) onHead.push(extraSvg('tuft', s));
    if (has('crown')) onHead.push(extraSvg('crown', s));
    const spark = has('spark') ? extraSvg('spark', s) : '';

    const inner =
      // 1. 披风（最后面）
      wraps(cape.map(o => outfitSvg(o.id, s)).join(''), bodyTf) +
      // 2. 尾巴
      wraps(tailSvg(s.tail, s), bodyTf) +
      // 3. 腿（固定坐标，脚必须踩地）
      legsSvg(s.duckFeet ? 'duck' : 'normal', s) +
      // 4. 躯干 + 手臂 + 身体装扮 + 胸绒
      '<g transform="' + bodyTf + '">' + bodySvg(s, gid) + inBody.join('') +
        handWear.map(o => outfitSvg(o.id, s)).join('') +
        bodyFront.map(o => outfitSvg(o.id, s)).join('') + '</g>' +
      // 5. 项圈（在头下方，像贴着下巴）
      (has('collar') ? extraSvg('collar', s) : '') +
      // 6. 头部整体（头后装饰 → 耳朵 → 头 → 斑纹 → 五官 → 头顶装饰）
      '<g transform="' + headTf + '">' + behindHead.join('') + earsSvg(s.ear, s) +
        headSvg(s, gid) + (s.mask ? maskSvg(s) : '') + marksSvg(s) + faceSvg(s, gid, st.eye) + onHead.join('') +
        neckWear.map(o => outfitSvg(o.id, s)).join('') +
        headWear.map(o => outfitSvg(o.id, s)).join('') +
        faceWear.map(o => outfitSvg(o.id, s)).join('') + '</g>' +
      // 7. 身边闪光
      spark;

    const defs = defsSvg(s, gid);
    const actor = '<g class="pet-actor" transform="' + tf + '"><g class="pet-breathe">' + inner + '</g></g>';
    return { defs, actor };
  }

  function petSvg(opt) {
    opt = opt || {};
    const stageIndex = (opt.stageIndex == null ? 1 : opt.stageIndex);
    if (stageIndex <= 0) return eggSvg(opt);
    const p = petParts(opt);
    return '<svg class="pet-svg" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet" role="img">' +
      p.defs +
      '<ellipse class="pet-shadow" cx="100" cy="204" rx="50" ry="9" fill="rgba(0,0,0,.13)"/>' +
      p.actor + '</svg>';
  }

  /* ---------------- 蛋形态（第 0 阶段）---------------- */
  function eggSvg(opt) {
    opt = opt || {};
    const scale = (opt.eggScale || 1).toFixed(3);
    const tf = 'translate(100,204) scale(' + scale + ') translate(-100,-204)';
    const gid = uid('eg');
    return '<svg class="pet-svg" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet" role="img">' +
      '<defs><radialGradient id="' + gid + '_e" cx="36%" cy="26%" r="80%">' +
        '<stop offset="0%" stop-color="#FFFDF6"/><stop offset="60%" stop-color="#FFF1DC"/><stop offset="100%" stop-color="#F3DCB8"/>' +
      '</radialGradient></defs>' +
      '<ellipse class="pet-shadow" cx="100" cy="204" rx="44" ry="8" fill="rgba(0,0,0,.13)"/>' +
      '<g class="pet-actor" transform="' + tf + '"><g class="pet-breathe">' +
      '<ellipse cx="100" cy="140" rx="50" ry="62" fill="url(#' + gid + '_e)" stroke="#E0C79E" stroke-width="3"/>' +
      '<path d="M 74,92 q 26,-16 52,0" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity=".55"/>' +
      '<ellipse cx="80" cy="122" rx="12" ry="9" fill="#FFE3C4"/><ellipse cx="124" cy="160" rx="9" ry="7" fill="#FFE3C4"/>' +
      '<ellipse cx="118" cy="112" rx="7" ry="5" fill="#FFE3C4"/>' +
      '<g class="pet-eyes"><ellipse cx="86" cy="136" rx="7" ry="9.5" fill="#3B3550"/><circle cx="88" cy="132" r="2.8" fill="#fff"/>' +
      '<ellipse cx="114" cy="136" rx="7" ry="9.5" fill="#3B3550"/><circle cx="116" cy="132" r="2.8" fill="#fff"/></g>' +
      '<g class="pet-eyes-shut" fill="none" stroke="#3B3550" stroke-width="4" stroke-linecap="round">' +
      '<path d="M 78,136 q 8,8 16,0"/><path d="M 106,136 q 8,8 16,0"/></g>' +
      '<path d="M 92,156 q 8,8 16,0" fill="none" stroke="#3B3550" stroke-width="3.5" stroke-linecap="round"/>' +
      '<circle cx="70" cy="152" r="9" fill="#FF9DBB" opacity=".5"/><circle cx="130" cy="152" r="9" fill="#FF9DBB" opacity=".5"/>' +
      '</g></g></svg>';
  }

  /* ---------------- 场景背景 ---------------- */
  function cloud(x, y, sc) {
    return '<g class="sc-cloud" transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
      '<ellipse cx="0" cy="0" rx="26" ry="16" fill="#fff" opacity=".92"/>' +
      '<ellipse cx="22" cy="4" rx="20" ry="13" fill="#fff" opacity=".92"/>' +
      '<ellipse cx="-20" cy="5" rx="17" ry="11" fill="#fff" opacity=".92"/></g>';
  }
  function tree(x, y, sc, trunk, leaf) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
      '<rect x="-6" y="-40" width="12" height="46" rx="4" fill="' + trunk + '"/>' +
      '<circle cx="0" cy="-52" r="26" fill="' + leaf + '"/>' +
      '<circle cx="-18" cy="-38" r="19" fill="' + leaf + '"/>' +
      '<circle cx="18" cy="-38" r="19" fill="' + leaf + '"/></g>';
  }
  function house(x, y, sc, wall, roof) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
      '<rect x="-46" y="-40" width="92" height="52" rx="6" fill="' + wall + '"/>' +
      '<path d="M -58,-40 L 0,-78 L 58,-40 Z" fill="' + roof + '"/>' +
      '<rect x="-14" y="-16" width="28" height="28" rx="4" fill="#B9724A"/>' +
      '<rect x="-38" y="-30" width="20" height="18" rx="3" fill="#FFF0B8" stroke="#E0C98A" stroke-width="2"/>' +
      '<rect x="20" y="-30" width="20" height="18" rx="3" fill="#FFF0B8" stroke="#E0C98A" stroke-width="2"/>' +
      '<rect x="24" y="-72" width="12" height="22" rx="3" fill="#C0705A"/>' +
      '</g>';
  }
  function fence(x, y, sc, color) {
    let out = '';
    for (let i = 0; i < 9; i++) {
      const px = x + i * 16 * sc;
      out += '<rect x="' + px + '" y="' + y + '" width="' + (7 * sc) + '" height="' + (30 * sc) + '" rx="' + (3 * sc) + '" fill="' + color + '"/>';
      out += '<path d="M ' + px + ',' + y + ' l ' + (7 * sc) + ',0 l 0,' + (5 * sc) + ' l ' + (-7 * sc) + ',0 Z" fill="' + color + '"/>';
    }
    return out;
  }

  function sceneSvg(id, opts) {
    opts = opts || {};
    const night = opts.night !== false; // 仅卧室区分昼夜，默认夜晚
    const asleep = !!opts.asleep;
    const pet = opts.pet || null; // 入睡时横卧在床上的宠物信息
    const gid = uid('sky');
    let defs = '', sky = '', far = '', near = '', props = '';
    let extraDefs = '', lyingSvg = ''; // 横卧宠物及其渐变定义

    if (id === 'forest') {
      defs = '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#CFF0FF"/><stop offset="100%" stop-color="#EAFBEA"/></linearGradient>';
      sky = '<rect x="0" y="0" width="400" height="240" fill="url(#' + gid + ')"/>';
      sky += cloud(70, 44, .9) + cloud(300, 34, .7);
      far = '<path d="M 0,130 Q 100,104 200,128 T 400,120 L 400,240 L 0,240 Z" fill="#8FD98F"/>';
      near = '<path d="M 0,168 Q 120,146 240,172 T 400,164 L 400,240 L 0,240 Z" fill="#6CC47A"/>';
      props = tree(56, 196, .95, '#8B5E3C', '#4FA85F') + tree(340, 200, 1.05, '#8B5E3C', '#3F9450') +
        tree(180, 176, .6, '#7A5233', '#57B268') +
        '<ellipse cx="120" cy="206" rx="16" ry="10" fill="#4FA85F"/><ellipse cx="286" cy="214" rx="20" ry="11" fill="#4FA85F"/>' +
        '<g><ellipse cx="240" cy="222" rx="11" ry="8" fill="#F5E6C8"/><rect x="236" y="222" width="8" height="12" rx="3" fill="#EFDCB4"/></g>';
    } else if (id === 'night') {
      defs = '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#2B2A5E"/><stop offset="100%" stop-color="#5B5AA0"/></linearGradient>';
      sky = '<rect x="0" y="0" width="400" height="240" fill="url(#' + gid + ')"/>';
      sky += '<circle cx="330" cy="46" r="26" fill="#FFF3B0"/><circle cx="318" cy="38" r="22" fill="#5B5AA0"/>';
      let stars = '';
      for (let i = 0; i < 22; i++) {
        const sx = (i * 71 + 23) % 390 + 6, sy = (i * 47 + 13) % 110 + 8, r = (i % 3) * .7 + 1.1;
        stars += '<circle cx="' + sx + '" cy="' + sy + '" r="' + r + '" fill="#fff" opacity="' + (0.5 + (i % 4) * 0.13) + '"/>';
      }
      sky += stars;
      far = '<path d="M 0,140 Q 100,116 200,138 T 400,132 L 400,240 L 0,240 Z" fill="#2F5C46"/>';
      near = '<path d="M 0,176 Q 120,154 240,180 T 400,172 L 400,240 L 0,240 Z" fill="#264A38"/>';
      props = tree(48, 200, .9, '#3B3020', '#1F5C3A') + tree(352, 204, 1, '#3B3020', '#1F5C3A') +
        '<g class="sc-firefly"><circle cx="130" cy="196" r="3.4" fill="#FFE97A"/><circle cx="268" cy="206" r="3" fill="#FFE97A"/><circle cx="200" cy="188" r="2.6" fill="#FFE97A"/></g>';
    } else if (id === 'beach') {
      defs = '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#8FD8FF"/><stop offset="100%" stop-color="#DFF4FF"/></linearGradient>' +
        '<linearGradient id="' + gid + '_sea" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#3FA9E0"/><stop offset="100%" stop-color="#7FD0F5"/></linearGradient>';
      sky = '<rect x="0" y="0" width="400" height="240" fill="url(#' + gid + ')"/>';
      sky += '<circle cx="60" cy="40" r="22" fill="#FFE06A"/>' + cloud(300, 40, .75);
      far = '<rect x="0" y="120" width="400" height="52" fill="url(#' + gid + '_sea)"/>';
      far += '<path d="M 0,124 q 20,-8 40,0 t 40,0 t 40,0 t 40,0 t 40,0 t 40,0 t 40,0 t 40,0 t 40,0" fill="none" stroke="#fff" stroke-width="3" opacity=".55"/>' +
        '<path d="M 0,146 q 22,-9 44,0 t 44,0 t 44,0 t 44,0 t 44,0 t 44,0 t 44,0 t 44,0 t 44,0" fill="none" stroke="#fff" stroke-width="3" opacity=".4"/>';
      near = '<path d="M 0,170 Q 100,158 200,172 T 400,166 L 400,240 L 0,240 Z" fill="#F6E2B8"/>';
      props = '<g transform="translate(340,206) scale(1.05)">' +
        '<rect x="-6" y="-58" width="12" height="62" rx="5" fill="#A97640"/>' +
        '<path d="M -4,-58 q -34,-16 -48,6 q 22,4 48,-6 Z" fill="#4FA85F"/>' +
        '<path d="M 4,-58 q 34,-16 48,6 q -22,4 -48,-6 Z" fill="#57B268"/>' +
        '<path d="M -4,-58 q -20,-20 -6,-30 q 14,8 6,30 Z" fill="#3F9450"/></g>' +
        '<g><circle cx="96" cy="212" r="13" fill="#FF6B9D"/><path d="M 83,212 a 13,13 0 0 1 26,0 Z" fill="#FFF3B0"/><circle cx="96" cy="212" r="4" fill="#fff"/></g>' +
        '<ellipse cx="230" cy="220" rx="14" ry="7" fill="#FFD9E4"/>';
    } else if (id === 'bedroom') {
      // 温馨卧室：夜晚默认（深蓝墙面 + 月光窗），白天为暖色墙 + 阳光窗；含可点击小床
      const wallTop = night ? '#2A2350' : '#FFE7D2';
      const wallBot = night ? '#3C2F60' : '#FFF6EC';
      const floorCol = night ? '#1E1838' : '#F0D9C0';
      const wood = night ? '#5B3F26' : '#C98A5E';
      const woodDark = night ? '#432C19' : '#A9714A';
      const sheet = night ? '#E7DEF4' : '#FFFFFF';
      const blanket = night ? '#B9A7E0' : '#FFC9D6';
      const pillow = night ? '#F3EEFB' : '#FFFFFF';
      const frameStroke = night ? '#2C1E10' : '#8A5C3C';
      defs = '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + wallTop + '"/><stop offset="100%" stop-color="' + wallBot + '"/></linearGradient>' +
        '<linearGradient id="' + gid + '_fl" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + floorCol + '"/><stop offset="100%" stop-color="' + floorCol + '"/></linearGradient>' +
        '<radialGradient id="' + gid + '_lamp" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#FFE9A8" stop-opacity=".7"/><stop offset="100%" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>';
      sky = '<rect x="0" y="0" width="400" height="240" fill="url(#' + gid + ')"/>';
      // 窗户（右）
      sky += '<rect x="300" y="36" width="74" height="78" rx="8" fill="' + (night ? '#101A3A' : '#BFE9FF') + '" stroke="' + wood + '" stroke-width="6"/>';
      if (night) {
        sky += '<circle cx="350" cy="62" r="14" fill="#FFF3B0"/><circle cx="343" cy="57" r="11" fill="#101A3A"/>';
        let wstars = '';
        [[312,52],[326,84],[368,90],[338,46],[360,76]].forEach(p => { wstars += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.4" fill="#fff" opacity=".85"/>'; });
        sky += wstars;
      } else {
        sky += '<circle cx="352" cy="60" r="13" fill="#FFE06A"/>' + cloud(316, 86, .6) + cloud(360, 50, .5);
      }
      // 地板
      far = '<rect x="0" y="196" width="400" height="44" fill="url(#' + gid + '_fl)"/>';
      near = '';
      const furWood = night ? '#6A4527' : '#D79A67';
      const furWoodD = night ? '#4A2E18' : '#B2794B';
      const curtain = night ? '#6C5BA8' : '#FFD2E0';
      const shelfIn = night ? '#332343' : '#F7E6CC';
      const lampOn = night;
      // 小地毯
      props = '<ellipse cx="200" cy="226" rx="150" ry="14" fill="' + (night ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.5)') + '"/>';
      // 窗帘（挂在窗户上）
      props += '<g class="rm-curtain" pointer-events="none">' +
        '<rect x="286" y="26" width="102" height="6" rx="3" fill="' + woodDark + '"/>' +
        '<path d="M 292,30 h 22 v 80 q -11,10 -22,0 Z" fill="' + curtain + '"/>' +
        '<path d="M 360,30 h 22 v 80 q -11,10 -22,0 Z" fill="' + curtain + '"/>' +
        '</g>';
      // 墙上挂画
      props += '<g class="rm-pic" pointer-events="none">' +
        '<rect x="30" y="44" width="72" height="56" rx="7" fill="' + furWood + '" stroke="' + frameStroke + '" stroke-width="2.5"/>' +
        '<rect x="37" y="51" width="58" height="42" rx="4" fill="' + (night ? '#1B2A55' : '#CFEEFF') + '"/>' +
        '<path d="' + heartPath(66, 70, .58) + '" fill="' + (night ? '#FFB3C7' : '#FF8FB8') + '"/>' +
        '<circle cx="48" cy="60" r="1.8" fill="#fff" opacity=".75"/>' +
        '<circle cx="86" cy="86" r="1.5" fill="#fff" opacity=".65"/></g>';
      // 小书架（左侧）
      props += '<g class="rm-shelf" pointer-events="none">' +
        '<rect x="20" y="142" width="66" height="80" rx="8" fill="' + furWood + '" stroke="' + frameStroke + '" stroke-width="2.5"/>' +
        '<rect x="26" y="149" width="54" height="30" rx="4" fill="' + shelfIn + '"/>' +
        '<rect x="26" y="185" width="54" height="31" rx="4" fill="' + shelfIn + '"/>' +
        '<rect x="30" y="154" width="7" height="21" rx="2" fill="#FF8FB8"/>' +
        '<rect x="39" y="158" width="7" height="17" rx="2" fill="#FFCE3A"/>' +
        '<rect x="48" y="152" width="7" height="23" rx="2" fill="#8FD8FF"/>' +
        '<rect x="57" y="157" width="7" height="18" rx="2" fill="#A5E39A"/>' +
        '<rect x="66" y="160" width="7" height="15" rx="2" fill="#C9A6FF"/>' +
        '<rect x="30" y="196" width="22" height="16" rx="4" fill="#8FD8FF"/>' +
        '<rect x="56" y="192" width="20" height="20" rx="6" fill="#FFCE3A"/>' +
        '<rect x="66" y="128" width="16" height="14" rx="3" fill="#C0705A"/>' +
        '<circle cx="74" cy="122" r="9" fill="#57B268"/><circle cx="66" cy="126" r="6" fill="#4FA85F"/><circle cx="82" cy="126" r="6" fill="#6CC47A"/>' +
        '</g>';
      // 床头柜 + 小台灯（右侧）
      props += '<g class="rm-stand" pointer-events="none">' +
        (lampOn ? '<circle cx="352" cy="150" r="30" fill="url(#' + gid + '_lamp)"/>' : '') +
        '<rect x="326" y="170" width="52" height="52" rx="8" fill="' + furWood + '" stroke="' + frameStroke + '" stroke-width="2.5"/>' +
        '<rect x="332" y="178" width="40" height="16" rx="4" fill="' + furWoodD + '"/>' +
        '<circle cx="352" cy="186" r="2.4" fill="#FFE9A8"/>' +
        '<rect x="332" y="200" width="40" height="16" rx="4" fill="' + furWoodD + '"/>' +
        '<circle cx="352" cy="208" r="2.4" fill="#FFE9A8"/>' +
        '<rect x="345" y="164" width="14" height="7" rx="3" fill="' + woodDark + '"/>' +
        '<rect x="350" y="146" width="4" height="20" fill="' + woodDark + '"/>' +
        '<path d="M 338,146 L 366,146 L 359,126 L 345,126 Z" fill="' + (lampOn ? '#FFE9A8' : '#F3D9B0') + '" stroke="' + frameStroke + '" stroke-width="1.5"/>' +
        '</g>';
      // 小床（头在右、脚在左；枕头按宠物头部的实际落点摆放）
      props += '<g class="pet-bed">' +
        '<rect x="92" y="186" width="216" height="34" rx="12" fill="' + wood + '" stroke="' + frameStroke + '" stroke-width="2.5"/>' +            // 床架
        '<rect x="300" y="150" width="16" height="70" rx="7" fill="' + woodDark + '"/>' +                                              // 床头板
        '<rect x="92" y="160" width="12" height="60" rx="5" fill="' + woodDark + '"/>' +                                              // 床尾板
        '<rect x="100" y="170" width="200" height="22" rx="11" fill="' + sheet + '"/>' +                                             // 床垫
        '<rect x="100" y="182" width="134" height="16" rx="8" fill="' + blanket + '"/>' +                                            // 被子
        '<rect x="180" y="158" width="98" height="26" rx="13" fill="' + pillow + '" stroke="' + frameStroke + '" stroke-width="1.5"/>' + // 枕头
        '<rect x="280" y="168" width="22" height="18" rx="9" fill="' + blanket + '" stroke="' + frameStroke + '" stroke-width="1.2"/>' + // 靠枕
        '</g>';
      // 地上的小皮球
      props += '<g class="rm-ball" pointer-events="none">' +
        '<circle cx="56" cy="230" r="10" fill="#FF8FB8"/>' +
        '<path d="M 48,227 q 8,7 16,0" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="52" cy="225" r="2.4" fill="#fff" opacity=".9"/></g>';
      // 可点击热区（透明，覆盖床面，pointer-events:all 保证可点）
      props += '<rect class="bed-hit" x="88" y="146" width="236" height="84" fill="transparent" pointer-events="all"/>';
      // 操作提示（昼夜文案不同）
      const hint = night
        ? (asleep ? '🌙 轻触小床，让它起床' : '👆 轻触小床，哄它睡觉')
        : '🌞 轻触小床，让它睡觉';
      props += '<g class="bed-hint"><rect x="10" y="12" width="' + (hint.length * 13 + 18) + '" height="24" rx="12" fill="rgba(0,0,0,.28)"/>' +
        '<text x="22" y="29" font-size="13" fill="#fff" font-family="sans-serif">' + hint + '</text></g>';
      // 入睡：宠物横卧在床上（身长按床长换算，头枕枕头、脚近床尾），头部旁显示 zzz
      if (asleep && pet && (pet.stageIndex == null ? 1 : pet.stageIndex) > 0) {
        const lp = petParts(pet);
        extraDefs += lp.defs;
        const si = Math.max(1, Math.min(9, pet.stageIndex == null ? 1 : pet.stageIndex));
        const a = 0.84 + Math.min(8, si - 1) * 0.028;           // 阶段整体缩放，与站立时一致
        const L = Math.min(LIE_MAX, LIE_H * a * 1.03);          // 横卧身长（场景单位）
        const T = L * LIE_RATIO;                                // 横卧厚度（贴床，略压扁）
        const sx = T / (a * LIE_W);
        const sy = L / (a * LIE_H);
        const sp = SKIN[pet.species] ? pet.species : 'cat';
        const tall = (LIE_TALL[sp] || [1,1,1,1,1,1,1,1,1])[si - 1] || 1;
        const Lact = L * tall;                                  // 该物种实际横卧身长
        // 头中心对准枕头，同时保证耳朵/头顶基本不越过床头板（300，允许 4 单位贴靠）
        const TX = Math.min(LIE_HEAD_X - LIE_HEAD_K * L, 304 - Lact);
        const TY = LIE_BOTTOM_Y - 0.54 * T;                     // 身体下沿压在床面上
        const lieTf = 'translate(' + TX.toFixed(1) + ',' + TY.toFixed(1) + ') rotate(90) scale(' +
          sx.toFixed(4) + ',' + sy.toFixed(4) + ') translate(-100,-204)';
        lyingSvg += '<g class="lying-pet" pointer-events="none" transform="' + lieTf + '">' + lp.actor + '</g>';
        const zc = night ? '#EAD9FF' : '#A98BD6';
        lyingSvg += '<g class="zzz" pointer-events="none" fill="' + zc + '" font-family="sans-serif" font-weight="800">' +
          '<text x="246" y="130" font-size="13">z</text>' +
          '<text x="260" y="112" font-size="17">z</text>' +
          '<text x="276" y="90" font-size="22">z</text></g>';
      }
    } else {
      // meadow 草地小屋（默认）
      defs = '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#9FDDFF"/><stop offset="100%" stop-color="#E6F7FF"/></linearGradient>';
      sky = '<rect x="0" y="0" width="400" height="240" fill="url(#' + gid + ')"/>';
      sky += '<circle cx="336" cy="48" r="24" fill="#FFE06A"/>' +
        '<g stroke="#FFCE3A" stroke-width="4" stroke-linecap="round" opacity=".85">' +
        '<path d="M 336,14 v -10"/><path d="M 336,92 v 10"/><path d="M 300,48 h -10"/><path d="M 382,48 h 10"/>' +
        '<path d="M 311,23 l -7,-7"/><path d="M 361,73 l 7,7"/><path d="M 361,23 l 7,-7"/><path d="M 311,73 l -7,7"/></g>';
      sky += cloud(72, 42, 1) + cloud(230, 30, .7);
      far = '<path d="M 0,132 Q 100,106 200,130 T 400,122 L 400,240 L 0,240 Z" fill="#A5E39A"/>';
      near = '<path d="M 0,170 Q 120,148 240,174 T 400,166 L 400,240 L 0,240 Z" fill="#7FD273"/>';
      props = house(90, 176, 1, '#FFF3DC', '#E8735A') +
        tree(320, 198, 1, '#8B5E3C', '#57B268') +
        fence(150, 196, .85, '#E8D3B0') +
        flower(60, 214, 1.1, '#FF8FB8', '#FFCE3A') + flower(210, 224, 1.2, '#FFF3B0', '#FF8FB8') +
        flower(268, 212, 1, '#C9A6FF', '#FFCE3A') + flower(370, 220, 1.05, '#FF8FB8', '#FFF3B0');
    }

    return '<svg class="scene-svg" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice" role="img">' +
      '<defs>' + defs + extraDefs + '</defs>' + sky + far + near + props + lyingSvg + '</svg>';
  }

  window.PetArt = { petSvg, eggSvg, sceneSvg, OUTFITS, OUTFIT_MAP, SLOTS, SCENES, SCENE_MAP, SKIN, STAGE_STYLE };
})();
