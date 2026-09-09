/* ===========================================================
   数独挑战：6×6 / 7×7 / 8×8 / 9×9 分档出题
   生成完整解 → 挖空并保持唯一解
   =========================================================== */
(function () {
  const U = window.U, S = window.Store;

  const CFG = {
    6: { boxH: 2, boxW: 3, givens: 20 },
    7: { boxH: 1, boxW: 7, givens: 28 },
    8: { boxH: 2, boxW: 4, givens: 38 },
    9: { boxH: 3, boxW: 3, givens: 46 },
  };

  let N = 6, boxH = 2, boxW = 3;
  let solution = [], puzzle = [], given = [], selected = null;

  function ok(g, r, c, v) {
    for (let i = 0; i < N; i++) { if (g[r][i] === v || g[i][c] === v) return false; }
    const br = Math.floor(r / boxH) * boxH, bc = Math.floor(c / boxW) * boxW;
    for (let i = 0; i < boxH; i++) for (let j = 0; j < boxW; j++) if (g[br + i][bc + j] === v) return false;
    return true;
  }

  function genSolved() {
    const g = Array.from({ length: N }, () => Array(N).fill(0));
    function fill() {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (g[r][c] === 0) {
          for (const v of U.shuffle([...Array(N).keys()].map(x => x + 1))) {
            if (ok(g, r, c, v)) { g[r][c] = v; if (fill()) return true; g[r][c] = 0; }
          }
          return false;
        }
      }
      return true;
    }
    fill();
    return g;
  }

  function countSolutions(g, limit) {
    let r = -1, c = -1;
    outer: for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (g[i][j] === 0) { r = i; c = j; break outer; }
    if (r === -1) return 1;
    let cnt = 0;
    for (let v = 1; v <= N; v++) {
      if (ok(g, r, c, v)) {
        g[r][c] = v; cnt += countSolutions(g, limit); g[r][c] = 0;
        if (cnt >= limit) return cnt;
      }
    }
    return cnt;
  }

  function generate(size) {
    N = size; boxH = CFG[size].boxH; boxW = CFG[size].boxW;
    solution = genSolved();
    puzzle = solution.map(r => r.slice());
    given = solution.map(r => r.map(() => true));
    const positions = U.shuffle([...Array(N * N).keys()]);
    let removed = 0;
    for (const pos of positions) {
      if (N * N - removed <= CFG[size].givens) break;
      const r = Math.floor(pos / N), c = pos % N;
      const bak = puzzle[r][c];
      puzzle[r][c] = 0; given[r][c] = false;
      const copy = puzzle.map(row => row.slice());
      if (countSolutions(copy, 2) === 1) removed++;
      else { puzzle[r][c] = bak; given[r][c] = true; }
    }
    selected = null;
  }

  function render(container) {
    U.clear(container);
    container.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('h2', {}, [U.el('span', { class: 'title-emoji' }, '🔲 '), '数独挑战']),
      U.el('span', { class: 'chip' }, '完成得 ⭐ 星星'),
    ]));
    const diff = U.el('div', { class: 'sub-tabs' }, [6, 7, 8, 9].map(s =>
      U.el('button', { class: 'sub-tab' + (s === N ? ' active' : ''), 'data-s': s, onclick: () => { N = s; document.querySelectorAll('#view-sudoku .sub-tab').forEach(t => t.classList.toggle('active', +t.dataset.s === s)); newGame(); } }, s + '×' + s)
    ));
    container.appendChild(diff);
    const body = U.el('div', { class: 'sub-body' });
    container.appendChild(body);
    newGame(body);
  }

  function newGame(body) {
    body = body || document.querySelector('#view-sudoku .sub-body');
    generate(N);
    draw(body);
  }

  function draw(body) {
    U.clear(body);
    const grid = U.el('div', { class: 'sudoku-grid' });
    grid.style.gridTemplateColumns = 'repeat(' + N + ', auto)';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const cell = U.el('div', { class: 'cell' + (given[r][c] ? ' given' : ''), 'data-r': r, 'data-c': c }, puzzle[r][c] ? String(puzzle[r][c]) : '');
      cell.addEventListener('click', () => { if (given[r][c]) return; selected = [r, c]; highlight(grid); });
      grid.appendChild(cell);
    }
    const palette = U.el('div', { class: 'sudoku-palette' });
    for (let v = 1; v <= N; v++) palette.appendChild(U.el('button', { class: 'pal-key', onclick: () => input(v) }, String(v)));
    palette.appendChild(U.el('button', { class: 'pal-key', style: { background: 'var(--pink-2)' }, onclick: () => input(0) }, '⌫'));

    const info = U.el('div', { class: 'sudoku-info' }, [
      U.el('button', { class: 'btn btn-blue', onclick: () => check() }, '✅ 检查'),
      U.el('button', { class: 'btn btn-yellow', onclick: () => hint() }, '💡 提示'),
      U.el('button', { class: 'btn btn-green', onclick: () => newGame() }, '🔄 新一题'),
    ]);
    body.appendChild(U.el('div', { class: 'sudoku-wrap' }, [
      U.el('p', { style: { color: '#8A7C95' } }, '每行、每列、每个彩色方块里，数字 1～' + N + ' 都不能重复哦！'),
      grid, palette, info,
    ]));
    highlight(grid);
  }

  function highlight(grid) {
    const sel = selected ? puzzle[selected[0]][selected[1]] : 0;
    const sameBox = (r, c) => selected &&
      Math.floor(r / boxH) === Math.floor(selected[0] / boxH) &&
      Math.floor(c / boxW) === Math.floor(selected[1] / boxW);
    grid.querySelectorAll('.cell').forEach(cell => {
      const r = +cell.dataset.r, c = +cell.dataset.c;
      cell.className = 'cell' + (given[r][c] ? ' given' : '') + (selected && selected[0] === r && selected[1] === c ? ' sel' : '');
      if (sel && puzzle[r][c] === sel) cell.classList.add('same');
      if (sameBox(r, c)) cell.classList.add('box');
    });
  }

  function input(v) {
    if (!selected) { U.toast('先点一个空格哦', '👆'); return; }
    const [r, c] = selected;
    if (given[r][c]) return;
    puzzle[r][c] = v;
    const cell = document.querySelector('#view-sudoku .sudoku-grid .cell[data-r="' + r + '"][data-c="' + c + '"]');
    cell.textContent = v ? String(v) : '';
    cell.classList.remove('bad');
    highlight(document.querySelector('#view-sudoku .sudoku-grid'));
  }

  function hint() {
    if (!selected) { // 自动选一个空位
      outer: for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!given[r][c] && puzzle[r][c] === 0) { selected = [r, c]; break outer; }
    }
    if (!selected) { U.toast('已经填满啦', '🎉'); return; }
    const [r, c] = selected;
    puzzle[r][c] = solution[r][c];
    const cell = document.querySelector('#view-sudoku .sudoku-grid .cell[data-r="' + r + '"][data-c="' + c + '"]');
    cell.textContent = String(solution[r][c]); cell.classList.add('given');
    given[r][c] = true;
    highlight(document.querySelector('#view-sudoku .sudoku-grid'));
  }

  function check() {
    let full = true, wrong = 0;
    const grid = document.querySelector('#view-sudoku .sudoku-grid');
    grid.querySelectorAll('.cell').forEach(cell => {
      const r = +cell.dataset.r, c = +cell.dataset.c;
      cell.classList.remove('bad');
      if (puzzle[r][c] === 0) full = false;
      else if (puzzle[r][c] !== solution[r][c]) { cell.classList.add('bad'); wrong++; }
    });
    if (!full) { U.toast('还有空格没填哦', '✏️'); return; }
    if (wrong > 0) { U.toast('有 ' + wrong + ' 个填错啦，再看看', '🤔'); return; }
    // 完成！
    const reward = N; // 尺寸即星星数
    if (N === 9) S.setSudoku9();
    S.addStars(reward);
    S.addSudokuDone(N);
    U.confetti(2200);
    U.modal({
      emoji: '🏆', title: N + '×' + N + ' 数独完成！',
      body: ['你真厉害！', U.el('p', {}, '⭐ 获得 ' + reward + ' 颗星星')],
      actions: [{ label: '🌟 去喂宠物', cls: 'btn-pink', onClick: () => { U.closeModal(); window.App.switchView('pet'); } }, { label: '再来一题', cls: 'btn-blue', onClick: () => { U.closeModal(); newGame(); } }],
    });
  }

  window.Modules = window.Modules || {};
  window.Modules.sudoku = { render };
})();
