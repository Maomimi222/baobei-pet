/* ===========================================================
   App — 路由 / 导航 / 首页 / 顶栏更新 / 声音 / 徽章通知
   =========================================================== */
(function () {
  const U = window.U, S = window.Store, M = window.Modules;

  const VIEWS = ['home', 'chinese', 'english', 'math', 'sudoku', 'pet', 'selfcare', 'parent'];

  function inputStyle() {
    return { width: '100%', boxSizing: 'border-box', padding: '10px 12px', marginTop: '8px',
      fontSize: '15px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' };
  }

  const App = {
    // 家长后台解锁状态：仅存在于当前页面会话（刷新即失效，不写入存档）
    _parentUnlocked: false,

    init() {
      S.load();
      // 导航点击
      document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => this.switchView(btn.dataset.view));
      });
      // 声音开关
      const st = document.getElementById('soundToggle');
      st.textContent = S.data.settings.soundOn ? '🔊' : '🔇';
      st.addEventListener('click', () => {
        S.data.settings.soundOn = !S.data.settings.soundOn;
        S.save();
        st.textContent = S.data.settings.soundOn ? '🔊' : '🔇';
        if (S.data.settings.soundOn) U.speakZh('你好');
      });
      // 预载语音
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      }
      // 点遮罩任意处关闭弹窗，避免被卡住
      const mask = document.getElementById('modalMask');
      mask.addEventListener('click', (e) => { if (e.target === mask) U.closeModal(); });
      // 初始视图：#parent 不能直接放行（URL 里残留 hash 会绕过密码），统一走门禁
      const hash = (location.hash || '').replace('#', '');
      const start = VIEWS.includes(hash) ? hash : 'home';
      this.switchView(start === 'parent' ? 'home' : start);
      if (start === 'parent') this.openParent();
      // 新解锁徽章提示
      this._shownBadges = Object.keys(S.data.badges);
    },

    switchView(name) {
      if (!VIEWS.includes(name)) name = 'home';
      // 离开家长后台即重新上锁，下次进入仍需密码
      if (name !== 'parent') this._parentUnlocked = false;
      // 家长后台必须过密码门禁：侧边栏 / 底部导航 / 任何直接调用都会被拦截
      if (name === 'parent' && !this._parentUnlocked) { this.openParent(); return; }
      U.closeModal();
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      const view = document.getElementById('view-' + name);
      view.classList.add('active');
      document.querySelectorAll('.nav-item, .tab-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
      const c = view;
      if (name === 'home') renderHome(c);
      else if (M[name]) M[name].render(c);
      this.refreshChrome();
      try { document.querySelector('.content').scrollTop = 0; window.scrollTo(0, 0); } catch (e) {}
      if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    },

    /* 进入家长后台：先过密码门禁（未设则引导设置） */
    openParent() {
      // 校验通过后才置位解锁标记（内部刷新页面不会重复要求密码）
      const unlock = () => { this._parentUnlocked = true; this.switchView('parent'); };
      if (!S.hasParentPin()) {
        this._promptSetPin(unlock);
        return;
      }
      this._promptEnterPin(unlock);
    },
    _promptSetPin(done) {
      const i1 = U.el('input', { type: 'password', placeholder: '设置密码（如 4 位数字）', style: inputStyle() });
      const i2 = U.el('input', { type: 'password', placeholder: '再输一次确认', style: inputStyle() });
      U.modal({
        emoji: '🔐', title: '设置家长密码',
        body: [
          U.el('p', { style: { color: '#8A7C95', fontSize: '14px' } }, '为了保护家长后台，请先设置一个密码。以后进入家长后台都需要输入它。'),
          i1, i2,
          U.el('p', { style: { color: '#B488F5', fontSize: '12px', marginTop: '4px' } }, '⚠️ 密码仅保存在本设备，请牢记；忘记后需清除应用数据才能重置。'),
        ],
        actions: [
          { label: '确定', cls: 'btn-purple', onClick: () => {
            const a = i1.value, b = i2.value;
            if (!a) { U.toast('请输入密码', '⚠️'); return; }
            if (a !== b) { U.toast('两次输入不一致', '⚠️'); return; }
            S.setParentPin(a); U.closeModal(); U.toast('家长密码已设置', '✅'); done && done();
          } },
          { label: '取消', cls: 'btn-ghost', onClick: () => U.closeModal() },
        ],
      });
      setTimeout(() => { try { i1.focus(); } catch (e) {} }, 80);
    },
    _promptEnterPin(done) {
      const i = U.el('input', { type: 'password', placeholder: '请输入家长密码', style: inputStyle() });
      U.modal({
        emoji: '🔐', title: '请输入家长密码',
        body: [U.el('p', { style: { color: '#8A7C95', fontSize: '14px' } }, '这是家长专属区域，请输入密码继续。'), i],
        actions: [
          { label: '确定', cls: 'btn-purple', onClick: () => {
            if (S.verifyParentPin(i.value)) { U.closeModal(); done && done(); }
            else { U.toast('密码不正确', '⚠️'); i.value = ''; try { i.focus(); } catch (e) {} }
          } },
          { label: '取消', cls: 'btn-ghost', onClick: () => U.closeModal() },
        ],
      });
      setTimeout(() => { try { i.focus(); } catch (e) {} }, 80);
    },

    refreshChrome() {
      const stage = S.petStage();
      const avail = S.availableStars();
      const ts = document.getElementById('topbarStars');
      if (ts) ts.textContent = '⭐ ' + avail;
      const sp = document.getElementById('spStars'); if (sp) sp.textContent = avail;
      const se = document.getElementById('spEmoji'); if (se) se.textContent = stage.emoji;
      const sn = document.getElementById('spName'); if (sn) sn.textContent = S.activePet().name;
      const sstage = document.getElementById('spStage'); if (sstage) sstage.textContent = stage.name;
    },

    onBadges(list) {
      list.forEach((b, i) => {
        setTimeout(() => {
          U.confetti(1600);
          U.modal({
            emoji: b.emoji, title: '🏅 解锁新徽章！',
            body: [U.el('h2', { style: { color: '#B488F5' } }, b.name), U.el('p', {}, b.desc)],
            actions: [{ label: '太棒啦', cls: 'btn-pink', onClick: () => U.closeModal() }],
          });
        }, i * 400);
      });
    },
  };

  /* ---------- 首页仪表盘 ---------- */
  function renderHome(c) {
    U.clear(c);
    const stage = S.petStage();
    const p = S.data.progress;
    const hero = U.el('div', { class: 'home-hero' }, [
      U.el('div', { class: 'pet-big' }, stage.emoji),
      U.el('div', {}, [
        U.el('h1', {}, '嗨，' + S.activePet().name + ' 等你来玩！'),
        U.el('p', {}, [U.el('span', { class: 'star-big' }, '⭐ ' + S.availableStars()), ' 颗星星可以投喂宠物']),
        U.el('p', {}, '学一学、算一算，赢星星把宠物养大吧～'),
        U.el('div', { style: { marginTop: '10px' } }, [
          U.el('button', { class: 'btn btn-pink', onclick: () => App.switchView('pet') }, '🐾 去看宠物'),
          U.el('button', { class: 'btn btn-green', onclick: () => App.switchView('sudoku') }, '🔲 玩数独'),
          U.el('button', { class: 'btn btn-purple', onclick: () => App.openParent() }, '👨‍👩‍👧 家长查看'),
        ]),
      ]),
    ]);
    c.appendChild(hero);

    const cards = [
      { v: 'chinese', cls: 'mc-pink', ico: '📚', t: '语文乐园', s: '拼音·识字·古诗' },
      { v: 'english', cls: 'mc-blue', ico: '🌸', t: '英语花园', s: '剑桥少儿词汇' },
      { v: 'math', cls: 'mc-green', ico: '🔢', t: '数字王国', s: '加减·乘法表' },
      { v: 'sudoku', cls: 'mc-purple', ico: '🔲', t: '数独挑战', s: '6~9 宫格闯关' },
      { v: 'selfcare', cls: 'mc-green', ico: '🧹', t: '自理能手', s: '打卡得好星' },
      { v: 'pet', cls: 'mc-yellow', ico: '🐾', t: '宠物养成', s: '星星投喂·徽章墙' },
    ];
    const grid = U.el('div', { class: 'module-grid' });
    cards.forEach(card => {
      grid.appendChild(U.el('button', { class: 'module-card ' + card.cls, onclick: () => App.switchView(card.v) }, [
        U.el('div', { class: 'mc-emoji' }, card.ico),
        U.el('div', {}, [U.el('h3', {}, card.t), U.el('small', {}, card.s)]),
      ]));
    });
    c.appendChild(grid);

    // 学习进度
    const prog = U.el('div', { class: 'card', style: { marginTop: '22px' } }, [
      U.el('h3', { style: { color: '#B488F5' } }, '📊 我的学习脚印'),
      U.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px', marginTop: '8px' } }, [
        stat('🔤 拼音', p.chinese.pinyinSeen.length),
        stat('✏️ 汉字', p.chinese.charsLearned.length),
        stat('📜 古诗', p.chinese.poemsRecited.length),
        stat('🌸 英语词', p.english.wordsLearned.length),
        stat('➕ 数学对', p.math.correct),
        stat('🔲 数独', p.sudoku.completed),
        stat('⚔️ 闯关', p.challenge.completed),
        stat('🏅 徽章', Object.keys(S.data.badges).length + '/' + S.BADGES.length),
      ]),
    ]);
    c.appendChild(prog);
  }
  function stat(label, val) {
    return U.el('div', { style: { background: 'var(--bg2)', borderRadius: '14px', padding: '10px 12px' } }, [
      U.el('div', { style: { fontSize: '13px', color: '#8A7C95' } }, label),
      U.el('div', { style: { fontSize: '24px', fontWeight: '800', color: '#B488F5' } }, String(val)),
    ]);
  }

  window.App = App;
  document.addEventListener('DOMContentLoaded', () => App.init());
})();
