/* ===========================================================
   Store — 本地存储 / 全局状态 / 星星 / 宠物成长 / 成就徽章
   所有数据存于 localStorage，跨会话持久化。
   =========================================================== */
(function () {
  const KEY = 'baobei_pet_v4';

  // 宠物成长门槛（10 级，升满累计 1000 星），所有物种共用
  const STAGE_MINS = [0, 40, 100, 180, 270, 380, 500, 640, 800, 1000];

  // 小猫的专属 10 级形态（保留原有可爱描述）
  const CAT_STAGES = [
    { name: '神秘蛋',   emoji: '🥚',  min: 0,    desc: '一颗神奇的小蛋，里面藏着一只小猫！' },
    { name: '小奶猫',   emoji: '🐱',  min: 40,   desc: '咔嚓！一只软软的小奶猫钻出来啦～' },
    { name: '调皮小猫', emoji: '😺',  min: 100,  desc: '调皮的小猫，最爱蹦蹦跳跳！' },
    { name: '神气小猫', emoji: '😸',  min: 180,  desc: '笑眯眯的小猫，越来越神气！' },
    { name: '活力小猫', emoji: '😻',  min: 270,  desc: '爱心满满，活力四射的小猫！' },
    { name: '机灵小猫', emoji: '🐈',  min: 380,  desc: '聪明机灵的猫咪，会好多本领！' },
    { name: '优雅小猫', emoji: '🐈‍⬛', min: 500,  desc: '黑亮的猫咪，优雅又神秘。' },
    { name: '酷酷小猫', emoji: '😼',  min: 640,  desc: '自带气场的酷酷小猫！' },
    { name: '勇敢小猫', emoji: '🦁',  min: 800,  desc: '像小狮子一样勇敢的小猫！' },
    { name: '猫大王',   emoji: '👑',  min: 1000, desc: '威风凛凛的猫大王，你最棒的伙伴！' },
  ];

  // 物种库：每只宠物有自己的基础形象；小猫用专属形态，其余自动生成 10 级
  const SPECIES = {
    cat:    { label: '小猫', base: '🐱', stages: CAT_STAGES },
    panda:  { label: '熊猫', base: '🐼' },
    dog:    { label: '小狗', base: '🐶' },
    rabbit: { label: '小兔', base: '🐰' },
    tiger:  { label: '小虎', base: '🐯' },
    frog:   { label: '小蛙', base: '🐸' },
    duck:   { label: '小鸭', base: '🦆' },
    pig:    { label: '小猪', base: '🐷' },
    ragdoll:{ label: '布偶猫', base: '🐱' },
  };
  const RANDOM_POOL = ['cat', 'ragdoll', 'panda', 'dog', 'rabbit', 'tiger', 'frog', 'duck', 'pig'];

  // 通用物种（小猫以外）自动生成 10 级形态：蛋 → 宝宝… → 大王
  function buildStages(species) {
    const sp = SPECIES[species] || SPECIES.cat;
    return STAGE_MINS.map((min, i) => {
      const last = i === STAGE_MINS.length - 1;
      const first = i === 0;
      return {
        min,
        emoji: first ? '🥚' : (last ? '👑' : sp.base),
        name: first ? '神秘蛋' : (last ? sp.label + '大王' : '小' + sp.label),
        desc: first ? ('一颗神奇的小蛋，里面藏着一只' + sp.label + '！')
                    : (last ? ('威风凛凛的' + sp.label + '大王，你最棒的伙伴！') : ('可爱的' + sp.label + '，越来越棒啦！')),
      };
    });
  }

  // 成就徽章定义
  const BADGES = [
    { id: 'pinyin10', emoji: '🔤', name: '拼音小能手', desc: '认读 10 个拼音' },
    { id: 'char20',   emoji: '📝', name: '识字小状元', desc: '认识 20 个汉字' },
    { id: 'poem3',    emoji: '📜', name: '古诗小诗人', desc: '背诵 3 首古诗' },
    { id: 'eng50',    emoji: '🌟', name: '英语小新星', desc: '学会 50 个英语单词' },
    { id: 'eng100',   emoji: '🏆', name: '英语小达人', desc: '学会 100 个英语单词' },
    { id: 'math10',   emoji: '➕', name: '计算小能手', desc: '做对 10 道数学题' },
    { id: 'mul',      emoji: '✖️', name: '乘法小天才', desc: '学完九九乘法表' },
    { id: 'sudoku1',  emoji: '🔢', name: '数独小新手', desc: '完成 1 个数独' },
    { id: 'sudoku9',  emoji: '🧩', name: '数独小高手', desc: '完成 9×9 数独' },
    { id: 'pet1',     emoji: '🥚', name: '孵化时刻', desc: '第一次投喂宠物' },
    { id: 'pet3',     emoji: '😸', name: '宠物好朋友', desc: '宠物长到第 3 阶段' },
    { id: 'challenge5',emoji:'⚔️', name: '闯关小勇士', desc: '完成 5 次综合闯关' },
    { id: 'star100',  emoji: '💎', name: '百星小富翁', desc: '累计获得 100 颗星星' },
    { id: 'selfcare', emoji: '🧹', name: '自理小能手', desc: '一天完成全部自理打卡' },
    { id: 'pets3',    emoji: '🐾', name: '宠物大家庭', desc: '领养 3 只以上宠物' },
  ];

  function defaultData() {
    return {
      version: 4,
      // 可用 = earned - fed - spent；fed=投喂宠物，spent=换装消费；daily 为每日获得上限计数
      stars: { earned: 0, fed: 0, spent: 0, daily: { date: '', earned: 0 } },
      pets: [ { species: 'cat', name: '小喵', fedTotal: 0, wardrobe: [], wearing: {} } ], // 多宠物：阶段由各自 fedTotal 推导
      activePet: 0,
      scene: 'meadow',                     // 宠物背景场景 id
      purchasedScenes: [],                 // 已购买的付费场景 id（如卧室）
      homework: {                          // 今日作业（家长后台布置，宠物页查看；图片为家长本机上传的 dataURL）
        date: '',
        title: '',
        images: [],
        note: '',
      },
      homeworkViewed: '',                  // 孩子最后查看作业的日期（用于「新作业」小红点）
      badges: {},                          // id -> true
      settings: { soundOn: true, petName: '小喵', parentPin: '' }, // parentPin 为空=未设家长密码
      progress: {
        chinese: { pinyinSeen: [], charsLearned: [], poemsRecited: [] },
        english: { wordsLearned: [], storiesRead: [] },
        math: { correct: 0, mulSeen: [] },
        sudoku: { completed: 0 },
        challenge: { completed: 0, starsEarned: 0 },
        selfcare: { date: '', done: [], counts: { eat: 0, wash: 0, tidy: 0, bath: 0, sleep: 0, wake: 0, bekind: 0, reading: 0, homework: 0, calm: 0, piano: 0, exercise: 0 }, stars: 0 },
      },
    };
  }

  const Store = {
    data: null,
    BADGES, SPECIES,

    // 把任意存档对象规范化为当前版本的完整结构（旧档/备份通用）
    _normalize(parsed) {
      const d = defaultData();
      const data = Object.assign({}, d, parsed || {});
      // 浅合并嵌套对象，避免旧版本缺字段
      data.stars = Object.assign(d.stars, (parsed && parsed.stars) || {});
      data.settings = Object.assign(d.settings, (parsed && parsed.settings) || {});
      data.progress = {};
      for (const k in d.progress) {
        data.progress[k] = Object.assign({}, d.progress[k], (parsed && parsed.progress && parsed.progress[k]) || {});
      }
      // 补齐自理打卡各计数字段（兼容旧档缺少的新任务：wake/bekind/reading）
      const sc = data.progress.selfcare;
      const dsc = d.progress.selfcare.counts;
      for (const id in dsc) if (sc.counts[id] === undefined) sc.counts[id] = dsc[id];

      // 多宠物结构迁移（保留已有进度，不重置）
      const hadPets = parsed && Array.isArray(parsed.pets);
      if (!hadPets) {
        const old = (parsed && parsed.pet) ? parsed.pet : {};
        data.pets = [ { species: 'cat', name: old.name || '小喵', fedTotal: old.fedTotal || 0 } ];
        data.activePet = 0;
      }
      // 规范化宠物数组，补齐字段
      if (!Array.isArray(data.pets) || data.pets.length === 0) {
        data.pets = [ { species: 'cat', name: '小喵', fedTotal: 0 } ];
      }
      data.pets = data.pets.map(p => ({
        species: p.species || 'cat',
        name: p.name || ((SPECIES[p.species || 'cat'] || SPECIES.cat).label + '宝宝'),
        fedTotal: p.fedTotal || 0,
        wardrobe: Array.isArray(p.wardrobe) ? p.wardrobe.slice() : [],
        wearing: (p.wearing && typeof p.wearing === 'object') ? Object.assign({}, p.wearing) : {},
      }));
      // 场景：缺省回退草地；若 PetArt 已加载则校验合法性
      const SCENE_IDS = (window.PetArt && window.PetArt.SCENE_MAP) ? Object.keys(window.PetArt.SCENE_MAP) : ['meadow', 'forest', 'night', 'beach'];
      if (!SCENE_IDS.includes(data.scene)) data.scene = 'meadow';
      // 已购买付费场景：确保为数组
      if (!Array.isArray(data.purchasedScenes)) data.purchasedScenes = [];
      // 今日作业：补齐结构（旧档自动获得预置作业）
      if (!data.homework || typeof data.homework !== 'object') data.homework = d.homework;
      else data.homework = {
        date: String(data.homework.date || ''),
        title: String(data.homework.title || ''),
        images: Array.isArray(data.homework.images) ? data.homework.images.filter(s => typeof s === 'string').slice(0, 6) : [],
        note: String(data.homework.note || ''),
      };
      data.homeworkViewed = String(data.homeworkViewed || '');
      if (typeof data.activePet !== 'number' || data.activePet < 0 || data.activePet >= data.pets.length) {
        data.activePet = 0;
      }
      if (data.pet) delete data.pet; // 清理旧单宠物字段
      return data;
    },

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.data = this._normalize(parsed);
        } else {
          this.data = defaultData();
        }
      } catch (e) {
        console.warn('读取存档失败，重置', e);
        this.data = defaultData();
      }
      return this.data;
    },

    /* ---- 进度备份 / 恢复（换设备、清缓存、浏览器更新不再丢档）---- */
    // 导出：返回完整进度的 JSON 字符串
    exportData() {
      try { return JSON.stringify(this.data); }
      catch (e) { console.warn('导出失败', e); return null; }
    },
    // 导入：用备份字符串覆盖当前进度。返回 {ok, msg}
    importData(str) {
      let parsed;
      try { parsed = JSON.parse(str); }
      catch (e) { return { ok: false, msg: '备份内容无法识别，请检查是否完整' }; }
      if (!parsed || typeof parsed !== 'object') return { ok: false, msg: '这不是有效的进度备份' };
      // 允许当前多宠物格式（pets 数组）或旧版单宠物格式（pet 对象）
      const hasPets = Array.isArray(parsed.pets) || typeof parsed.pet === 'object';
      if (!hasPets) return { ok: false, msg: '这不是有效的进度备份' };
      this.data = this._normalize(parsed);
      this.save();
      this.checkBadges();
      return { ok: true, msg: '进度已恢复！' };
    },

    // 返回是否真正写入成功（容量超限时 localStorage 会抛错，需要上层提示用户）
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); this.lastSaveOk = true; }
      catch (e) { console.warn('保存失败', e); this.lastSaveOk = false; }
      return this.lastSaveOk;
    },

    /* ---- 星星 ---- */
    availableStars() { return this.data.stars.earned - this.data.stars.fed - this.data.stars.spent; },
    DAILY_CAP: 40,
    // 今日已获得的星星数（按本地日期重置）
    dailyStars() {
      const t = this._today();
      if (!this.data.stars.daily || this.data.stars.daily.date !== t) return 0;
      return this.data.stars.daily.earned;
    },

    // 加星：默认计入「每日答题上限 40」。options.uncapped=true 时不计上限（如自理打卡）。
    // 无论是否封顶，都计入累计 earned（可用于投喂宠物）。
    addStars(n, opts) {
      n = Math.max(0, Math.floor(n) || 0);
      if (n <= 0) return 0;
      const capped = !(opts && opts.uncapped);
      const t = this._today();
      if (!this.data.stars.daily || this.data.stars.daily.date !== t) {
        this.data.stars.daily = { date: t, earned: 0 };
      }
      let add = n;
      if (capped) {
        const room = Math.max(0, this.DAILY_CAP - this.data.stars.daily.earned);
        add = Math.min(n, room);
        if (add <= 0) return 0; // 今日答题已达上限
        this.data.stars.daily.earned += add;
      }
      this.data.stars.earned += add;
      this.save();
      this.checkBadges();
      return add; // 实际加上的星星（封顶时可能小于请求值）
    },

    /* 家长自定义加减星星：delta 可正可负。
       earned 不能低于已消耗（fed+spent），以保证「可用星星」永不为负。
       返回实际生效的增减量（可能小于请求值，因受下限约束）。 */
    adjustStars(delta) {
      delta = Math.floor(delta) || 0;
      const s = this.data.stars;
      const min = s.fed + s.spent; // 已投喂 + 已换装消费，earned 不应低于此
      const target = Math.max(min, s.earned + delta);
      const applied = target - s.earned;
      s.earned = target;
      this.save();
      this.checkBadges();
      return applied;
    },

    /* ---- 家长密码（仅本地 localStorage，保护家长后台入口）---- */
    hasParentPin() { return !!(this.data.settings.parentPin && String(this.data.settings.parentPin).length > 0); },
    verifyParentPin(pin) { return String(pin || '') === String(this.data.settings.parentPin || ''); },
    setParentPin(pin) {
      pin = String(pin || '').trim();
      this.data.settings.parentPin = pin;
      this.save();
    },
    clearParentPin() {
      this.data.settings.parentPin = '';
      this.save();
    },

    /* 投喂宠物：消耗 n 颗可用星星 */
    feedPet(n) {
      n = Math.min(n, this.availableStars());
      if (n <= 0) return 0;
      const p = this.activePet();
      this.data.stars.fed += n;
      p.fedTotal += n;
      this.save();
      this.checkBadges();
      return n;
    },

    /* ---- 宠物（多宠物）---- */
    activePet() { return this.data.pets[this.data.activePet]; },
    petStages(species) {
      const sp = SPECIES[species] || SPECIES.cat;
      return sp.stages ? sp.stages : buildStages(species);
    },
    activePetStages() { return this.petStages(this.activePet().species); },
    petStage(pet) {
      pet = pet || this.activePet();
      const stages = this.petStages(pet.species);
      let stage = 0;
      for (let i = 0; i < stages.length; i++) {
        if (pet.fedTotal >= stages[i].min) stage = i;
      }
      return {
        index: stage, species: pet.species, label: (SPECIES[pet.species] || SPECIES.cat).label,
        name: stages[stage].name, emoji: stages[stage].emoji, min: stages[stage].min, desc: stages[stage].desc,
      };
    },
    nextStage(pet) {
      pet = pet || this.activePet();
      const stages = this.petStages(pet.species);
      const cur = this.petStage(pet).index;
      return cur + 1 < stages.length ? stages[cur + 1] : null;
    },
    renamePet(name) {
      name = (name || '').trim() || '小喵';
      this.activePet().name = name;
      this.data.settings.petName = name;
      this.save();
    },
    // 当前宠物是否满级（可领养新宠物蛋）
    canAdopt() {
      const p = this.activePet();
      const stages = this.petStages(p.species);
      return this.petStage(p).index >= stages.length - 1;
    },
    // 下一只宠物物种：第 2 只熊猫、第 3 只小狗、之后随机
    nextAdoptSpecies() {
      const n = this.data.pets.length;
      if (n <= 1) return 'panda';
      if (n === 2) return 'dog';
      return RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
    },
    adoptPet() {
      if (!this.canAdopt()) return null;
      const sp = this.nextAdoptSpecies();
      const sameCount = this.data.pets.filter(p => p.species === sp).length;
      const name = (SPECIES[sp] || SPECIES.cat).label + (sameCount > 0 ? (sameCount + 1) + '号' : '宝宝');
      const pet = { species: sp, name, fedTotal: 0 };
      this.data.pets.push(pet);
      this.data.activePet = this.data.pets.length - 1;
      this.save();
      this.checkBadges();
      return pet;
    },
    switchPet(idx) {
      if (idx >= 0 && idx < this.data.pets.length) { this.data.activePet = idx; this.save(); }
    },

    /* ---- 换装 ---- */
    _outfit(id) { return (window.PetArt && window.PetArt.OUTFIT_MAP) ? window.PetArt.OUTFIT_MAP[id] : null; },
    hasOutfit(id) { return this.activePet().wardrobe.includes(id); },
    // 限定装扮是否在兑换期内（无 limitedUntil 视为常驻；否则以该日期 23:59:59 为截止）
    outfitAvailable(o) {
      if (!o) return false;
      if (o.limitedUntil) {
        const dl = new Date(o.limitedUntil + 'T23:59:59').getTime();
        if (Date.now() >= dl) return false;
      }
      return true;
    },
    // 花费星星购买并自动穿上（占用对应槽位）
    buyOutfit(id) {
      const o = this._outfit(id);
      if (!o) return { ok: false, msg: '没有这个装扮' };
      const pet = this.activePet();
      if (pet.wardrobe.includes(id)) return { ok: false, msg: '已经拥有啦' };
      if (!this.outfitAvailable(o)) return { ok: false, msg: '「' + o.name + '」是中秋限定，10月1日后已下架' };
      const avail = this.availableStars();
      if (avail < o.cost) return { ok: false, msg: '星星不够（还差 ' + (o.cost - avail) + ' 颗）' };
      this.data.stars.spent += o.cost;
      pet.wardrobe.push(id);
      pet.wearing[o.slot] = id;
      this.save();
      return { ok: true, msg: '获得「' + o.name + '」并穿上啦！', outfit: o };
    },
    // 穿上已拥有的装扮（占用其槽位）
    equipOutfit(id) {
      const o = this._outfit(id);
      if (!o) return { ok: false, msg: '没有这个装扮' };
      const pet = this.activePet();
      if (!pet.wardrobe.includes(id)) return { ok: false, msg: '还没拥有，先去购买吧' };
      pet.wearing[o.slot] = id;
      this.save();
      return { ok: true, msg: '穿上「' + o.name + '」' };
    },
    // 脱下某槽位的装扮
    unequipOutfit(slot) {
      const pet = this.activePet();
      if (pet.wearing[slot]) { delete pet.wearing[slot]; this.save(); }
      return { ok: true, msg: '已脱下' };
    },
    // 场景是否可用（免费场景恒为 true；付费场景需已购买）
    hasScene(id) {
      const sc = (window.PetArt && window.PetArt.SCENE_MAP) ? window.PetArt.SCENE_MAP[id] : null;
      if (!sc || !sc.cost) return true; // 无 cost 视为免费场景
      return (this.data.purchasedScenes || []).includes(id);
    },
    // 花费星星购买付费场景
    buyScene(id) {
      const sc = (window.PetArt && window.PetArt.SCENE_MAP) ? window.PetArt.SCENE_MAP[id] : null;
      if (!sc) return { ok: false, msg: '没有这个场景' };
      if (!sc.cost) return { ok: false, msg: '这个场景是免费的哦' };
      if (this.hasScene(id)) return { ok: false, msg: '已经拥有啦' };
      const avail = this.availableStars();
      if (avail < sc.cost) return { ok: false, msg: '星星不够（还差 ' + (sc.cost - avail) + ' 颗）' };
      this.data.stars.spent += sc.cost;
      if (!Array.isArray(this.data.purchasedScenes)) this.data.purchasedScenes = [];
      this.data.purchasedScenes.push(id);
      this.save();
      return { ok: true, msg: '购买成功！已解锁「' + sc.name + '」', scene: sc };
    },
    // 切换宠物背景场景
    setScene(id) {
      const valid = (window.PetArt && window.PetArt.SCENE_MAP) ? window.PetArt.SCENE_MAP[id] : null;
      if (!valid) return { ok: false, msg: '没有这个场景' };
      this.data.scene = id;
      this.save();
      return { ok: true, msg: '已切换到「' + valid.name + '」' };
    },

    /* ---- 今日作业（家长布置，孩子在宠物页查看）---- */
    getHomework() { return this.data.homework; },
    // 保存作业：日期自动记为布置当天，标题/说明做长度截断，图片最多 6 张
    setHomework(h) {
      h = h || {};
      this.data.homework = {
        date: h.date || this._today(),
        title: String(h.title || '').trim().slice(0, 200),
        images: (Array.isArray(h.images) ? h.images : []).filter(s => typeof s === 'string').slice(0, 6),
        note: String(h.note || '').trim().slice(0, 300),
      };
      this.save();
      return this.data.homework;
    },
    // 今天是否布置了作业（有标题或有图片即算）
    hasHomeworkToday() {
      const hw = this.data.homework;
      return !!(hw && hw.date === this._today() && (String(hw.title || '').trim() || (hw.images && hw.images.length)));
    },
    // 今天有作业且孩子还没打开看过 → 宠物页按钮显示小红点
    homeworkUnseen() { return this.hasHomeworkToday() && this.data.homeworkViewed !== this._today(); },
    markHomeworkSeen() { this.data.homeworkViewed = this._today(); this.save(); },

    /* ---- 进度记录 ---- */
    markPinyin(code) { this._push('progress.chinese.pinyinSeen', code); },
    markChar(c) { this._push('progress.chinese.charsLearned', c); },
    markPoem(id) { this._push('progress.chinese.poemsRecited', id); },
    markEnglish(word) { this._push('progress.english.wordsLearned', word); },
    markStory(id) { this._push('progress.english.storiesRead', id); },
    addMathCorrect(n) { this.data.progress.math.correct += (n || 1); this.save(); this.checkBadges(); },
    markMul(a, b) {
      const key = a + 'x' + b;
      this._push('progress.math.mulSeen', key);
      if (this.data.progress.math.mulSeen.length >= 81) this.checkBadges();
    },
    addSudokuDone(size) {
      this.data.progress.sudoku.completed += 1;
      if (size === 9) this.checkBadges();
      this.checkBadges();
      this.save();
    },
    addChallenge() {
      this.data.progress.challenge.completed += 1;
      this.checkBadges();
      this.save();
    },

    /* ---- 自理能手：每日打卡 ---- */
    _today() {
      const d = new Date();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '-' + m + '-' + day;
    },
    _ensureSelfcareDay() {
      const t = this._today();
      if (this.data.progress.selfcare.date !== t) {
        this.data.progress.selfcare.date = t;
        this.data.progress.selfcare.done = [];
      }
    },
    selfcareIsDone(id) { this._ensureSelfcareDay(); return this.data.progress.selfcare.done.includes(id); },
    selfcareDoneToday() { this._ensureSelfcareDay(); return this.data.progress.selfcare.done.slice(); },
    checkinSelfcare(id, stars) {
      this._ensureSelfcareDay();
      if (this.data.progress.selfcare.done.includes(id)) return false; // 今日已打卡
      this.data.progress.selfcare.done.push(id);
      const c = this.data.progress.selfcare.counts;
      c[id] = (c[id] || 0) + 1;
      const got = this.addStars(stars, { uncapped: true }); // 自理打卡不计入每日答题上限，但计入累计
      this.data.progress.selfcare.stars += got;
      return got; // false=已打卡；>0=实际获得星星（自理打卡不受上限影响）
    },

    _push(path, val) {
      const parts = path.split('.');
      let o = this.data;
      for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
      const arr = o[parts[parts.length - 1]];
      if (!arr.includes(val)) { arr.push(val); this.save(); this.checkBadges(); }
    },

    /* ---- 成就检测 ---- */
    checkBadges() {
      const p = this.data.progress;
      const newOnes = [];
      const tryUnlock = (id, cond) => {
        if (cond && !this.data.badges[id]) {
          this.data.badges[id] = true;
          newOnes.push(BADGES.find(b => b.id === id));
        }
      };
      tryUnlock('pinyin10', p.chinese.pinyinSeen.length >= 10);
      tryUnlock('char20',   p.chinese.charsLearned.length >= 20);
      tryUnlock('poem3',    p.chinese.poemsRecited.length >= 3);
      tryUnlock('eng50',    p.english.wordsLearned.length >= 50);
      tryUnlock('eng100',   p.english.wordsLearned.length >= 100);
      tryUnlock('math10',   p.math.correct >= 10);
      tryUnlock('mul',      p.math.mulSeen.length >= 81);
      tryUnlock('sudoku1',  p.sudoku.completed >= 1);
      tryUnlock('sudoku9',  p.sudoku.completed >= 1 && this._did9());
      tryUnlock('pet1',     this.data.pets.some(p => p.fedTotal >= 1));
      tryUnlock('pet3',     this.data.pets.some(p => this.petStage(p).index >= 2));
      tryUnlock('challenge5', p.challenge.completed >= 5);
      tryUnlock('star100',  this.data.stars.earned >= 100);
      const SC_COUNT = (window.Data && window.Data.selfcareTasks) ? window.Data.selfcareTasks.length : 5;
      tryUnlock('selfcare',  this.data.progress.selfcare.done.length >= SC_COUNT);
      tryUnlock('pets3',     this.data.pets.length >= 3);
      if (newOnes.length) this.save();
      if (newOnes.length && window.App && window.App.onBadges) window.App.onBadges(newOnes);
      return newOnes; // 返回新解锁，供 UI 弹窗
    },
    _did9() { return this.data.progress.sudoku.last9 === true; },

    badgeStatus() {
      return BADGES.map(b => ({ ...b, unlocked: !!this.data.badges[b.id] }));
    },
    setSudoku9() { this.data.progress.sudoku.last9 = true; this.save(); },
  };

  window.Store = Store;
})();
