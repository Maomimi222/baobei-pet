/* ===========================================================
   英语花园：剑桥少儿一级/二级词汇 + 初级阅读
   =========================================================== */
(function () {
  const U = window.U, D = window.Data, S = window.Store;
  let curTab = 'starters';

  function render(container) {
    U.clear(container);
    container.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('h2', {}, [U.el('span', { class: 'title-emoji' }, '🌸 '), '英语花园']),
      U.el('span', { class: 'chip' }, '🗣️ 点一点听发音'),
    ]));
    const tabs = U.el('div', { class: 'sub-tabs' }, [
      mkTab('starters', '⭐ 一级词汇'),
      mkTab('movers', '🌟 二级词汇'),
      mkTab('reading', '📖 初级阅读'),
      mkTab('story', '📚 Story fun'),
    ]);
    container.appendChild(tabs);
    const body = U.el('div', { class: 'sub-body' });
    container.appendChild(body);
    renderTab(body);
  }
  function mkTab(key, label) {
    const b = U.el('button', { class: 'sub-tab' + (curTab === key ? ' active' : ''), onclick: () => { curTab = key; renderTab(document.querySelector('#view-english .sub-body')); refreshTabs(); } }, label);
    b.dataset.tab = key; return b;
  }
  function refreshTabs() {
    document.querySelectorAll('#view-english .sub-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === curTab));
  }
  function renderTab(body) {
    U.clear(body);
    if (curTab === 'reading') renderReading(body);
    else if (curTab === 'story') renderStory(body);
    else renderWords(body, curTab);
  }

  function renderWords(body, level) {
    const list = D.english[level];
    body.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('button', { class: 'btn btn-green', onclick: () => startQuiz(level) }, '🎯 考考我'),
      U.el('button', { class: 'btn btn-blue', onclick: () => startListenQuiz(level) }, '🎧 听音选词'),
      U.el('span', { class: 'chip' }, '已学会 ' + S.data.progress.english.wordsLearned.length + ' 个'),
    ]));
    const grid = U.el('div', { class: 'grid-cards' });
    list.forEach(w => {
      const learned = S.data.progress.english.wordsLearned.includes(w.w);
      const card = U.el('div', {
        class: 'mini-card' + (learned ? ' done' : ''),
        onclick: () => {
          U.speakWord(w.w);
          S.markEnglish(w.w);
          card.classList.add('done');
        }
      }, [
        U.el('div', { class: 'mc-emoji' }, w.e),
        U.el('div', { class: 'mc-word', style: { fontSize: '20px' } }, w.w),
        U.el('div', { class: 'mc-trans' }, w.zh),
        U.el('button', { class: 'speak-btn', onclick: (e) => { e.stopPropagation(); U.speakWord(w.w); } }, '🔊'),
      ]);
      grid.appendChild(card);
    });
    body.appendChild(grid);
  }

  function startQuiz(level) {
    const pool = U.shuffle(D.english[level]).slice(0, 6);
    let i = 0, score = 0;
    function step() {
      if (i >= pool.length) {
        S.addStars(score);
        U.modal({ emoji: '🎉', title: '英语小测验完成！', body: ['答对 ' + score + ' / ' + pool.length, U.el('p', {}, '⭐ 获得 ' + score + ' 颗星星')], actions: [{ label: '再玩一次', cls: 'btn-blue', onClick: () => { U.closeModal(); startQuiz(level); } }, { label: '返回', cls: 'btn-pink', onClick: () => U.closeModal() }] });
        return;
      }
      const q = pool[i];
      const opts = U.shuffle([q.w, ...U.shuffle(D.english[level].filter(x => x.w !== q.w)).slice(0, 3).map(x => x.w)]);
      U.modal({
        emoji: q.e, title: q.zh + ' 用英语怎么说？',
        body: [U.el('p', { style: { color: '#8A7C95' } }, '（看图片，选英文）'),
          U.el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' } }, opts.map(o =>
            U.el('button', { class: 'btn btn-yellow', onclick: (e) => {
              if (o === q.w) { score++; S.markEnglish(q.w); U.speakWord(o); e.target.textContent = '✅ ' + o; }
              else { U.speakWord(o); e.target.textContent = '❌ ' + o; }
              setTimeout(() => { i++; step(); }, 700);
            } }, o)
          ))],
        actions: [{ label: '🔊 听', cls: 'btn-blue', onClick: () => U.speakWord(q.w) }],
      });
    }
    step();
  }

  function startListenQuiz(level) {
    const pool = U.shuffle(D.english[level]).slice(0, 6);
    let i = 0, score = 0;
    function step() {
      if (i >= pool.length) {
        S.addStars(score);
        U.modal({ emoji: '🎉', title: '听音测验完成！', body: ['答对 ' + score + ' / ' + pool.length, U.el('p', {}, '⭐ 获得 ' + score + ' 颗星星')], actions: [{ label: '再玩一次', cls: 'btn-blue', onClick: () => { U.closeModal(); startListenQuiz(level); } }, { label: '返回', cls: 'btn-pink', onClick: () => U.closeModal() }] });
        return;
      }
      const q = pool[i];
      const opts = U.shuffle([q.zh, ...U.shuffle(D.english[level].filter(x => x.w !== q.w)).slice(0, 3).map(x => x.zh)]);
      U.speakWord(q.w);
      U.modal({
        emoji: '🎧', title: '听一听，选中文意思',
        body: [U.el('p', { style: { color: '#8A7C95' } }, '（点 🔊 可再听一次）'),
          U.el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' } }, opts.map(o =>
            U.el('button', { class: 'btn btn-yellow', onclick: (e) => {
              if (o === q.zh) { score++; S.markEnglish(q.w); e.target.textContent = '✅ ' + o; }
              else { e.target.textContent = '❌ ' + o; }
              setTimeout(() => { i++; step(); }, 700);
            } }, o)
          ))],
        actions: [{ label: '🔊 再听', cls: 'btn-blue', onClick: () => U.speakWord(q.w) }],
      });
    }
    step();
  }

  function renderReading(body) {
    const list = U.el('div', { class: 'grid-cards' });
    D.english.readings.forEach((rd) => {
      const card = U.el('div', { class: 'mini-card', style: { minHeight: '120px', textAlign: 'left' }, onclick: () => openReading(rd) }, [
        U.el('div', { class: 'mc-emoji' }, '📖'),
        U.el('div', { class: 'mc-word', style: { fontSize: '20px' } }, rd.title),
        U.el('div', { class: 'mc-trans' }, rd.text.length + ' 句话'),
      ]);
      list.appendChild(card);
    });
    body.appendChild(list);
  }

  function openReading(rd) {
    const box = U.el('div', { style: { textAlign: 'left', fontSize: '20px', lineHeight: '2' } },
      rd.text.map(s => U.el('div', {}, [
        U.el('button', { class: 'speak-btn', style: { fontSize: '18px' }, onclick: (e) => { e.stopPropagation(); U.speakWord(s); } }, '🔊'),
        ' ' + s,
      ]))
    );
    U.modal({
      emoji: '📖', title: rd.title,
      body: [box, U.el('p', { style: { color: '#8A7C95' } }, '👆 点 🔊 一句句读')],
      actions: [
        { label: '🔊 全部朗读', cls: 'btn-blue', onClick: () => U.speakSeq(rd.text, 'en-US') },
        { label: '🧠 考考你', cls: 'btn-purple', onClick: () => askReading(rd) },
        { label: '🌟 读完啦', cls: 'btn-pink', onClick: () => { S.addStars(2); U.closeModal(); U.toast('阅读完成！+2⭐', '📖'); U.confetti(); } },
      ],
    });
  }

  function askReading(rd) {
    const q = rd.q;
    if (!q) { U.toast('这篇没有小问题哦', '📖'); return; }
    const opts = U.shuffle(q.opts);
    U.modal({
      emoji: '🧠', title: '考考你',
      body: [U.el('p', { style: { fontSize: '20px', color: 'var(--ink)' } }, q.ask),
        U.el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' } }, opts.map(o =>
          U.el('button', { class: 'btn btn-yellow', onclick: (e) => {
            if (o === q.opts[q.a]) { S.addStars(1); e.target.textContent = '✅ ' + o; U.toast('答对啦！+1⭐', '🧠'); }
            else { e.target.textContent = '❌ ' + o; }
            setTimeout(() => U.closeModal(), 900);
          } }, o)
        ))],
      actions: [],
    });
  }

  /* ---- Story fun：从 Word 文档按篇选取的故事 ---- */
  function renderStory(body) {
    body.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('span', { class: 'chip' }, '📚 已读 ' + S.data.progress.english.storiesRead.length + ' / ' + D.stories.length),
      U.el('span', { class: 'chip' }, '🔊 点喇叭听故事'),
    ]));
    const grid = U.el('div', { class: 'grid-cards' });
    D.stories.forEach((st) => {
      const read = S.data.progress.english.storiesRead.includes(st.id);
      const first = st.paras[0] || '';
      const card = U.el('div', {
        class: 'mini-card' + (read ? ' done' : ''),
        style: { minHeight: '120px', textAlign: 'left' },
        onclick: () => openStory(st)
      }, [
        U.el('div', { class: 'mc-emoji' }, '📚'),
        U.el('div', { class: 'mc-word', style: { fontSize: '18px' } }, st.name),
        U.el('div', { class: 'mc-trans' }, st.paras.length + ' 段 · ' + st.questions.length + ' 题'),
        U.el('div', { style: { fontSize: '13px', color: '#8A7C95', marginTop: '4px' } }, (first.length > 40 ? first.slice(0, 40) + '…' : first)),
      ]);
      grid.appendChild(card);
    });
    body.appendChild(grid);
  }

  function speakSequence(parts) {
    if (!window.Store.data.settings.soundOn) return;
    U.speakSeq(parts, 'en-US');
  }

  function openStory(st) {
    const box = U.el('div', { style: { textAlign: 'left', fontSize: '20px', lineHeight: '2.1' } },
      st.paras.map(p => U.el('div', { style: { margin: '6px 0' } }, [
        U.el('button', { class: 'speak-btn', style: { fontSize: '18px' }, onclick: (e) => { e.stopPropagation(); U.speak(p, 'en-US'); } }, '🔊'),
        ' ' + p,
      ]))
    );
    U.modal({
      emoji: '📚', title: st.name,
      body: [box, U.el('p', { style: { color: '#8A7C95' } }, '👆 点 🔊 一段段听；点「全部朗读」连着读')],
      actions: [
        { label: '🔊 全部朗读', cls: 'btn-blue', onClick: () => speakSequence(st.paras) },
        { label: '🧠 考考你', cls: 'btn-purple', onClick: () => askStory(st, 0) },
        { label: '🌟 读完啦', cls: 'btn-pink', onClick: () => {
          if (S.data.progress.english.storiesRead.includes(st.id)) { U.toast('这篇读过啦，复习一下吧～', '📚'); U.closeModal(); return; }
          S.markStory(st.id);
          S.addStars(2);
          U.confetti();
          U.closeModal();
          U.toast('读完一篇故事！+2⭐', '📚');
          const sb = document.querySelector('#view-english .sub-body');
          if (sb && curTab === 'story') renderStory(sb);
        } },
      ],
    });
  }

  function askStory(st, qi) {
    if (qi >= st.questions.length) {
      U.modal({
        emoji: '🎉', title: '故事题做完啦！',
        body: ['你真棒！', U.el('p', { style: { color: '#8A7C95' } }, '📚 读完故事 +2⭐，答题每题还有额外 +1⭐ 哦')],
        actions: [{ label: '返回故事', cls: 'btn-pink', onClick: () => { U.closeModal(); openStory(st); } }],
      });
      return;
    }
    const q = st.questions[qi];
    const opts = U.shuffle(q.opts);
    U.modal({
      emoji: '🧠', title: '考考你（第 ' + (qi + 1) + ' / ' + st.questions.length + ' 题）',
      body: [
        U.el('p', { style: { fontSize: '20px', color: 'var(--ink)' } }, q.ask),
        U.el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' } }, opts.map(o =>
          U.el('button', { class: 'btn btn-yellow', onclick: (e) => {
            if (o === q.opts[q.a]) { S.addStars(1); e.target.textContent = '✅ ' + o; U.toast('答对啦！+1⭐', '🧠'); }
            else { e.target.textContent = '❌ ' + o; }
            setTimeout(() => askStory(st, qi + 1), 850);
          } }, o)
        )),
      ],
      actions: [],
    });
  }

  window.Modules = window.Modules || {};
  window.Modules.english = { render };
})();
