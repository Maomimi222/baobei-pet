/* ===========================================================
   语文乐园：拼音认知 / 识字 / 古诗
   =========================================================== */
(function () {
  const U = window.U, D = window.Data, S = window.Store;

  let curTab = 'pinyin';

  function render(container) {
    U.clear(container);
    container.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('h2', {}, [U.el('span', { class: 'title-emoji' }, '📚 '), '语文乐园']),
      U.el('span', { class: 'chip' }, '🌟 学一学就得星星'),
    ]));

    const tabs = U.el('div', { class: 'sub-tabs' }, [
      mkTab('pinyin', '🔤 拼音认知'),
      mkTab('char', '✏️ 识字'),
      mkTab('poem', '📜 古诗'),
    ]);
    container.appendChild(tabs);

    const body = U.el('div', { class: 'sub-body' });
    container.appendChild(body);
    renderTab(body);
  }

  function mkTab(key, label) {
    const b = U.el('button', { class: 'sub-tab' + (curTab === key ? ' active' : ''), onclick: () => { curTab = key; renderTab(document.querySelector('#view-chinese .sub-body')); refreshTabs(); } }, label);
    b.dataset.tab = key;
    return b;
  }
  function refreshTabs() {
    document.querySelectorAll('#view-chinese .sub-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === curTab));
  }

  function renderTab(body) {
    U.clear(body);
    if (curTab === 'pinyin') renderPinyin(body);
    else if (curTab === 'char') renderChar(body);
    else renderPoem(body);
  }

  /* ---------- 拼音认知 ---------- */
  function renderPinyin(body) {
    ['shengmu', 'yunmu'].forEach((type, idx) => {
      const title = idx === 0 ? '声母（23个）' : '韵母（24个）';
      body.appendChild(U.el('h3', { style: { color: '#5CC0FF', margin: '14px 0 8px' } }, title));
      const grid = U.el('div', { class: 'grid-cards' });
      D.pinyin[type].forEach(p => {
        const seen = S.data.progress.chinese.pinyinSeen.includes(p.c);
        const card = U.el('div', {
          class: 'mini-card' + (seen ? ' done' : ''),
          onclick: () => openPinyin(p, card)
        }, [
          U.el('div', { class: 'mc-word' }, p.c),
          U.el('div', { class: 'mc-emoji' }, p.e),
          U.el('div', { class: 'mc-trans' }, p.w),
          U.el('button', { class: 'speak-btn', onclick: (e) => { e.stopPropagation(); playPinyin(p); } }, '🔊'),
        ]);
        grid.appendChild(card);
      });
      body.appendChild(grid);
    });
    body.appendChild(U.el('p', { style: { color: '#8A7C95', textAlign: 'center', marginTop: '12px' } }, '👆 点一点拼音卡片，弹出大卡片听一听怎么读～'));
  }

  // 播放示例词发音（正确读音：用中文朗读示例词，而不是把拼音字母当中文读）
  function playPinyin(p) { U.speakZh(p.w); }

  function openPinyin(p, card) {
    S.markPinyin(p.c);
    card.classList.add('done');
    U.speakZh(p.w);
    U.modal({
      emoji: p.e,
      title: p.c,
      body: [
        U.el('div', { style: { fontSize: '64px', fontWeight: '800', color: '#5CC0FF' } }, p.c),
        U.el('div', { style: { fontSize: '22px', color: 'var(--blue)' } }, p.ex),
        U.el('div', { style: { fontSize: '24px', color: 'var(--ink)' } }, p.w),
        U.el('button', { class: 'btn btn-blue', style: { marginTop: '12px' }, onclick: () => U.speakZh(p.w) }, '🔊 听一听'),
      ],
      actions: [
        { label: '🏠 回小屋', cls: 'btn-pink', onClick: () => { U.closeModal(); window.App.switchView('home'); } },
        { label: '继续看', cls: 'btn-ghost', onClick: () => U.closeModal() },
      ],
    });
  }

  /* ---------- 识字 ---------- */
  function renderChar(body) {
    body.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('button', { class: 'btn btn-green', onclick: startCharQuiz }, '🎯 考考我'),
      U.el('span', { class: 'chip' }, '已认识 ' + S.data.progress.chinese.charsLearned.length + ' / ' + D.chars.length + ' 个'),
    ]));
    const grid = U.el('div', { class: 'grid-cards' });
    D.chars.forEach(c => {
      const learned = S.data.progress.chinese.charsLearned.includes(c.c);
      const card = U.el('button', {
        class: 'mini-card' + (learned ? ' done' : ''),
        onclick: () => {
          U.speakZh(c.c);
          U.modal({ emoji: c.e || '🔤', title: c.c + '  ' + c.p, body: [U.el('p', {}, c.t)], actions: [{ label: '🔊 再听一次', cls: 'btn-blue', onClick: () => { U.speakZh(c.c); } }, { label: '我记住啦', cls: 'btn-pink', onClick: () => { S.markChar(c.c); card.classList.add('done'); U.closeModal(); U.toast('记住啦！' + c.c, c.e || '🔤'); } }] });
        }
      }, [
        U.el('div', { class: 'mc-word' }, c.c),
        U.el('div', { class: 'mc-phon' }, c.p),
        c.e ? U.el('div', { class: 'mc-emoji' }, c.e) : null,
        U.el('div', { class: 'mc-trans' }, c.t),
      ]);
      grid.appendChild(card);
    });
    body.appendChild(grid);
  }

  function startCharQuiz() {
    const pool = U.shuffle(D.chars).slice(0, 6);
    let i = 0, score = 0;
    function step() {
      if (i >= pool.length) {
        S.addStars(score);
        U.modal({ emoji: '🎉', title: '识字小测验完成！', body: ['你答对 ' + score + ' / ' + pool.length + ' 个', U.el('p', {}, '⭐ 获得 ' + score + ' 颗星星')], actions: [{ label: '再玩一次', cls: 'btn-blue', onClick: () => { U.closeModal(); startCharQuiz(); } }, { label: '返回', cls: 'btn-pink', onClick: () => U.closeModal() }] });
        return;
      }
      const q = pool[i];
      const opts = U.shuffle([q.p, ...U.shuffle(D.chars.filter(x => x.c !== q.c).map(x => x.p)).slice(0, 3)]);
      U.modal({
        emoji: q.e, title: '这个字怎么读？',
        body: [U.el('div', { style: { fontSize: '56px', fontWeight: '800', color: '#B488F5' } }, q.c), U.el('p', {}, q.t),
          U.el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' } }, opts.map(o =>
            U.el('button', { class: 'btn btn-yellow', onclick: (e) => {
              if (o === q.p) { score++; S.markChar(q.c); U.speakZh(q.c); e.target.textContent = '✅ ' + o; }
              else { e.target.textContent = '❌ ' + o; }
              setTimeout(() => { i++; step(); }, 700);
            } }, o)
          ))],
        actions: [],
      });
    }
    step();
  }

  /* ---------- 古诗 ---------- */
  function renderPoem(body) {
    const list = U.el('div', { class: 'grid-cards' });
    D.poems.forEach(pm => {
      const done = S.data.progress.chinese.poemsRecited.includes(pm.id);
      const card = U.el('button', { class: 'mini-card' + (done ? ' done' : ''), style: { minHeight: '120px' }, onclick: () => openPoem(pm, card) }, [
        U.el('div', { class: 'mc-emoji' }, '📜'),
        U.el('div', { class: 'mc-word', style: { fontSize: '20px' } }, pm.title),
        U.el('div', { class: 'mc-trans' }, pm.author),
        U.el('div', { class: 'mc-phon' }, done ? '✅ 已背诵' : '点我学习'),
      ]);
      list.appendChild(card);
    });
    body.appendChild(list);
  }

  function openPoem(pm, card) {
    const linesBox = U.el('div', { style: { textAlign: 'left', fontSize: '20px', lineHeight: '2' } },
      pm.lines.map((ln, i) => U.el('div', {}, [
        U.el('button', { class: 'speak-btn', style: { fontSize: '18px' }, onclick: (e) => { e.stopPropagation(); U.speakZh(ln.t); } }, '🔊'),
        U.el('b', {}, ln.t),
        U.el('br', {}),
        U.el('small', { style: { color: '#5CC0FF' } }, ln.p),
      ]))
    );
    U.modal({
      emoji: '📜', title: pm.title + ' · ' + pm.author,
      body: [linesBox, U.el('p', { style: { color: '#8A7C95' } }, '👆 点 🔊 一句句听读')],
      actions: [
        { label: '🔊 整首朗读', cls: 'btn-blue', onClick: () => U.speakSeq(pm.lines.map(l => l.t), 'zh-CN') },
        { label: '🌟 我会背啦', cls: 'btn-pink', onClick: () => { S.markPoem(pm.id); S.addStars(2); card.classList.add('done'); U.closeModal(); U.toast('背诵成功！+2⭐', '📜'); U.confetti(); } },
      ],
    });
  }

  window.Modules = window.Modules || {};
  window.Modules.chinese = { render };
})();
