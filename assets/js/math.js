/* ===========================================================
   数字王国：100以内加减法 / 竖式填空 / 九九乘法表
   =========================================================== */
(function () {
  const U = window.U, S = window.Store;
  let curTab = 'add';

  function render(container) {
    U.clear(container);
    container.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('h2', {}, [U.el('span', { class: 'title-emoji' }, '🔢 '), '数字王国']),
      U.el('span', { class: 'chip' }, '➕ 算对就得星星'),
    ]));
    const tabs = U.el('div', { class: 'sub-tabs' }, [
      mkTab('add', '🎲 加减法'),
      mkTab('vert', '📐 竖式填空'),
      mkTab('mul', '✖️ 乘法表'),
    ]);
    container.appendChild(tabs);
    const body = U.el('div', { class: 'sub-body' });
    container.appendChild(body);
    renderTab(body);
  }
  function mkTab(key, label) { const b = U.el('button', { class: 'sub-tab' + (curTab === key ? ' active' : ''), onclick: () => { curTab = key; renderTab(document.querySelector('#view-math .sub-body')); refreshTabs(); } }, label); b.dataset.tab = key; return b; }
  function refreshTabs() { document.querySelectorAll('#view-math .sub-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === curTab)); }
  function renderTab(body) { U.clear(body); if (curTab === 'add') renderAdd(body); else if (curTab === 'vert') renderVert(body); else renderMul(body); }

  /* ---------- 数字键盘 ---------- */
  function numPad(getVal, setVal, onEnter) {
    const display = U.el('input', { class: 'answer-input', readonly: 'readonly', placeholder: '点下面的数字', value: getVal() });
    display.addEventListener('focus', () => display.blur());
    const pad = U.el('div', { class: 'num-pad' });
    '123456789'.split('').forEach(n => pad.appendChild(U.el('button', { class: 'num-key', onclick: () => { setVal(getVal() + n); display.value = getVal(); } }, n)));
    pad.appendChild(U.el('button', { class: 'num-key del', onclick: () => { setVal(getVal().slice(0, -1)); display.value = getVal(); } }, '⌫'));
    pad.appendChild(U.el('button', { class: 'num-key', style: { background: 'var(--green-2)' }, onclick: () => { setVal(getVal() + '0'); display.value = getVal(); } }, '0'));
    pad.appendChild(U.el('button', { class: 'num-key ok', style: { gridColumn: 'span 2' }, onclick: () => onEnter() }, '✅ 确定'));
    return U.el('div', {}, [display, pad]);
  }

  /* ---------- 加减法 ---------- */
  function renderAdd(body) {
    let a, b, op;
    function next() {
      op = Math.random() < 0.5 ? '+' : '−';
      if (op === '+') { a = U.rand(1, 99); b = U.rand(1, 100 - a); }
      else { a = U.rand(2, 99); b = U.rand(1, a); }
    }
    next();
    let val = '';
    const fb = U.el('div', { class: 'feedback' });
    function check() {
      const ans = op === '+' ? a + b : a - b;
      if (parseInt(val, 10) === ans) {
        fb.textContent = '✅ 答对啦！太棒了！'; fb.className = 'feedback ok';
        S.addMathCorrect(1); S.addStars(1);
        U.confetti(900);
        setTimeout(() => { val = ''; next(); q.textContent = a + ' ' + op + ' ' + b + ' = ?'; p.querySelector('input').value = ''; fb.textContent = ''; }, 1100);
      } else {
        fb.textContent = '❌ 再想想～答案是 ' + ans; fb.className = 'feedback no';
        setTimeout(() => { val = ''; p.querySelector('input').value = ''; fb.textContent = ''; }, 1400);
      }
    }
    const q = U.el('div', { class: 'p-q' }, a + ' ' + op + ' ' + b + ' = ?');
    const p = U.el('div', { class: 'problem' }, [
      q,
      U.el('p', { style: { color: '#8A7C95' } }, '用下面的键盘算出答案吧！'),
      numPad(() => val, v => val = v, check),
      fb,
    ]);
    body.appendChild(p);
  }

  /* ---------- 竖式填空 ---------- */
  function renderVert(body) {
    // 生成正确的两位数加法，随机挖空一位
    function build() {
      const a = U.rand(11, 89), b = U.rand(10, 99 - a);
      const sum = a + b;
      const ad = String(a).padStart(2, '0').split(''), bd = String(b).padStart(2, '0').split(''), sd = String(sum).padStart(2, '0').split('');
      const slots = [['a', 0], ['a', 1], ['b', 0], ['b', 1], ['s', 0], ['s', 1]];
      const blank = U.pick(slots);
      return { a, b, sum, ad, bd, sd, blank };
    }
    let cur = build();
    let val = '';
    const fb = U.el('div', { class: 'feedback' });
    function answer() {
      const map = { a: cur.ad, b: cur.bd, s: cur.sd };
      return parseInt(map[cur.blank[0]][cur.blank[1]], 10); // 返回数字，便于与用户输入比较
    }
    function draw() {
      U.clear(vertBox);
      const map = { a: cur.ad, b: cur.bd, s: cur.sd };
      const row = (key) => U.el('div', { class: 'vrow' }, map[key].map((d, i) => {
        if (cur.blank[0] === key && cur.blank[1] === i) {
          return U.el('div', { class: 'vcell input' }, val || '' );
        }
        return U.el('div', { class: 'vcell' }, d);
      }));
      vertBox.appendChild(row('a'));
      const opRow = U.el('div', { class: 'vrow' }, [U.el('div', { class: 'op' }, '+'), ...map.b.map((d, i) => {
        if (cur.blank[0] === 'b' && cur.blank[1] === i) return U.el('div', { class: 'vcell input' }, val || '');
        return U.el('div', { class: 'vcell' }, d);
      })]);
      vertBox.appendChild(opRow);
      vertBox.appendChild(U.el('div', { class: 'line' }));
      vertBox.appendChild(row('s'));
    }
    const vertBox = U.el('div', { class: 'vertical' });
    draw();
    function check() {
      if (parseInt(val, 10) === answer()) {
        fb.textContent = '✅ 填对啦！'; fb.className = 'feedback ok';
        S.addMathCorrect(1); S.addStars(1); U.confetti(900);
        setTimeout(() => { val = ''; cur = build(); draw(); fb.textContent = ''; pad.querySelector('input').value = ''; }, 1100);
      } else {
        fb.textContent = '❌ 正确答案是 ' + answer(); fb.className = 'feedback no';
        setTimeout(() => { val = ''; draw(); fb.textContent = ''; pad.querySelector('input').value = ''; }, 1500);
      }
    }
    const pad = numPad(() => val, v => { val = v; draw(); }, check);
    body.appendChild(U.el('div', { class: 'problem' }, [
      U.el('p', {}, '把空格里的数字填出来吧！'),
      vertBox, pad, fb,
    ]));
  }

  /* ---------- 九九乘法表（可互动） ---------- */
  function renderMul(body) {
    let showAns = true;
    const tds = [];
    body.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('button', { class: 'btn btn-green', onclick: startMulQuiz }, '🎯 乘法闯关'),
      U.el('button', { class: 'btn btn-yellow', onclick: () => { showAns = !showAns; refresh(); } }, '🙈 隐藏答案'),
      U.el('span', { class: 'chip' }, '已学 ' + S.data.progress.math.mulSeen.length + ' / 81'),
    ]));
    const table = U.el('table', { class: 'mul-table' });
    const head = U.el('tr', {}, [U.el('td', { class: 'head' }, '×')]);
    for (let c = 1; c <= 9; c++) head.appendChild(U.el('td', { class: 'head' }, String(c)));
    table.appendChild(head);
    for (let r = 1; r <= 9; r++) {
      const tr = U.el('tr', {}, [U.el('td', { class: 'axis' }, String(r))]);
      for (let c = 1; c <= 9; c++) {
        const td = U.el('td', { class: 'cell', 'data-r': r, 'data-c': c }, showAns ? String(r * c) : '?');
        td.addEventListener('click', () => {
          S.markMul(r, c);
          U.speakZh(r + ' 乘 ' + c + ' 等于 ' + (r * c));
          U.toast(r + ' × ' + c + ' = ' + (r * c), '✖️');
          if (!showAns) td.textContent = String(r * c);
          document.querySelectorAll('#view-math .mul-table td').forEach(x => x.classList.remove('hl'));
          highlight(r, c);
          updateChip();
        });
        tds.push(td);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    body.appendChild(table);
    body.appendChild(U.el('p', { style: { textAlign: 'center', color: '#8A7C95', marginTop: '10px' } }, '👆 点格子听口诀，学完 81 格得「乘法小天才」徽章'));

    function refresh() {
      tds.forEach(td => {
        const r = +td.dataset.r, c = +td.dataset.c;
        td.textContent = showAns ? String(r * c) : '?';
      });
      const btn = body.querySelector('.btn-yellow');
      if (btn) btn.textContent = showAns ? '🙈 隐藏答案' : '👀 显示答案';
    }
    function highlight(r, c) {
      document.querySelectorAll('#view-math .mul-table tr').forEach((tr, ri) => {
        if (ri === 0) return;
        tr.querySelectorAll('td').forEach((td) => {
          if (td.classList.contains('axis') || td.classList.contains('head')) return;
          const rr = parseInt(td.dataset.r), cc = parseInt(td.dataset.c);
          if (rr === r || cc === c) td.classList.add('hl');
        });
      });
    }
    function updateChip() {
      const chip = body.querySelector('.chip');
      if (chip) chip.textContent = '已学 ' + S.data.progress.math.mulSeen.length + ' / 81';
    }
  }

  function startMulQuiz() {
    let i = 0, score = 0;
    function step() {
      if (i >= 8) {
        S.addStars(score);
        U.modal({ emoji: '🎉', title: '乘法闯关完成！', body: ['答对 ' + score + ' / 8', U.el('p', {}, '⭐ 获得 ' + score + ' 颗星星')], actions: [{ label: '再玩一次', cls: 'btn-blue', onClick: () => { U.closeModal(); startMulQuiz(); } }, { label: '返回', cls: 'btn-pink', onClick: () => U.closeModal() }] });
        return;
      }
      const a = U.rand(1, 9), b = U.rand(1, 9), ans = a * b;
      const opts = U.shuffle([ans, ans + U.rand(1, 3), ans - U.rand(1, 3), ans + 10].filter(x => x > 0 && x !== ans)).slice(0, 3);
      opts.push(ans);
      U.modal({
        emoji: '✖️', title: a + ' × ' + b + ' = ?',
        body: [U.el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' } }, U.shuffle(opts).map(o =>
          U.el('button', { class: 'btn btn-yellow', onclick: (e) => {
            if (o === ans) { score++; e.target.textContent = '✅ ' + o; U.speakWord(a + ' times ' + b + ' equals ' + ans); }
            else e.target.textContent = '❌ ' + o;
            setTimeout(() => { i++; step(); }, 700);
          } }, String(o))
        ))],
        actions: [{ label: '🔊 听', cls: 'btn-blue', onClick: () => U.speakWord(a + ' times ' + b) }],
      });
    }
    step();
  }

  window.Modules = window.Modules || {};
  window.Modules.math = { render };
})();
