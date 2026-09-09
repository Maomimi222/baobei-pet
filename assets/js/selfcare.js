/* ===========================================================
   自理能手：每日打卡（好好吃饭/乖乖洗漱/整理物品/独立睡觉）
   每项每天只能打卡一次，次日 0 点自动刷新。
   =========================================================== */
(function () {
  const U = window.U, S = window.Store, D = window.Data;

  function render(container) {
    U.clear(container);
    const doneToday = S.selfcareDoneToday();
    container.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('h2', {}, [U.el('span', { class: 'title-emoji' }, '🧹 '), '自理能手']),
      U.el('span', { class: 'chip' }, '今天已打卡 ' + doneToday.length + ' / ' + D.selfcareTasks.length + '（自理打卡不占每日答题上限）'),
    ]));

    // 任务卡片
    const grid = U.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '14px' } });
    D.selfcareTasks.forEach(t => grid.appendChild(taskCard(t)));
    container.appendChild(grid);

    // 打卡说明
    container.appendChild(U.el('p', { style: { textAlign: 'center', color: '#8A7C95', marginTop: '12px' } }, '🌙 每项每天只能打卡一次，明天 0 点会自动刷新哦'));

    // 累计统计
    const sc = S.data.progress.selfcare;
    const book = [ stat('⭐ 累计自理星星', sc.stars) ];
    D.selfcareTasks.forEach(t => book.push(stat(t.e + ' ' + t.name, (sc.counts[t.id] || 0) + ' 次')));
    const statBox = U.el('div', { class: 'card', style: { marginTop: '20px' } }, [
      U.el('h3', { style: { color: '#B488F5' } }, '📈 我的自理小账本'),
      U.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px', marginTop: '8px' } }, book),
    ]);
    container.appendChild(statBox);

    // 全部完成提示
    if (doneToday.length >= D.selfcareTasks.length) {
      container.appendChild(U.el('div', { class: 'card', style: { marginTop: '16px', textAlign: 'center', background: 'linear-gradient(135deg,var(--green-2),var(--yellow-2))' } }, [
        U.el('div', { style: { fontSize: '40px' } }, '🏅'),
        U.el('h3', { style: { color: 'var(--purple)' } }, '今天真棒！' + D.selfcareTasks.length + ' 项全都完成啦！'),
      ]));
    }
  }

  function taskCard(t) {
    const done = S.selfcareIsDone(t.id);
    return U.el('div', { class: 'card', style: { textAlign: 'center', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', opacity: done ? 0.7 : 1 } }, [
      U.el('div', { style: { fontSize: '52px' } }, t.e),
      U.el('div', { style: { fontSize: '20px', fontWeight: '800', color: 'var(--purple)' } }, t.name),
      U.el('div', { style: { fontSize: '18px', color: 'var(--ink-soft)' } }, '+' + t.stars + ' ⭐'),
      U.el('button', { class: 'btn ' + (done ? 'btn-green' : 'btn-pink'), onclick: () => doCheck(t) }, done ? '✅ 今日已打卡' : '📝 打卡'),
    ]);
  }

  function doCheck(t) {
    const got = S.checkinSelfcare(t.id, t.stars);
    if (got === false) {
      U.toast('今天已经完成啦，明天再来～', '🌙');
      return;
    }
    U.confetti(1200);
    if (got > 0) U.toast(t.name + ' +' + got + '⭐', t.e);
    else U.toast(t.name + ' 打卡成功！今天星星到上限 40 啦～', '🌟');
    render(document.getElementById('view-selfcare'));
    window.App.refreshChrome();
  }

  function stat(label, val) {
    return U.el('div', { style: { background: 'var(--bg2)', borderRadius: '14px', padding: '10px 12px' } }, [
      U.el('div', { style: { fontSize: '13px', color: '#8A7C95' } }, label),
      U.el('div', { style: { fontSize: '22px', fontWeight: '800', color: '#B488F5' } }, String(val)),
    ]);
  }

  window.Modules = window.Modules || {};
  window.Modules.selfcare = { render };
})();
