/* ===========================================================
   家长后台：查看星星分值表 + 孩子学习/自理进度
   =========================================================== */
(function () {
  const U = window.U, S = window.Store, D = window.Data;

  function render(container) {
    U.clear(container);
    container.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('h2', {}, [U.el('span', { class: 'title-emoji' }, '👨‍👩‍👧 '), '家长后台']),
      U.el('span', { class: 'chip' }, '累计获得 ' + S.data.stars.earned + ' ⭐'),
    ]));

    // 星星总览
    container.appendChild(U.el('div', { class: 'card', style: { marginBottom: '18px' } }, [
      U.el('h3', { style: { color: '#B488F5' } }, '🌟 星星总览'),
      U.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '10px', marginTop: '8px' } }, [
        stat('⭐ 累计获得', S.data.stars.earned),
        stat('🍬 已投喂', S.data.stars.fed),
        stat('✨ 可用星星', S.availableStars()),
        stat('🏅 解锁徽章', Object.keys(S.data.badges).length + '/' + S.BADGES.length),
      ]),
    ]));

    // 各任务星星分值表
    const rewardCard = U.el('div', { class: 'card', style: { marginBottom: '18px' } }, [
      U.el('h3', { style: { color: '#B488F5' } }, '⭐ 每个任务得多少星星'),
      U.el('p', { style: { color: '#8A7C95', marginTop: '2px' } }, '小朋友完成任务就能得到下面的星星：'),
    ]);
    D.REWARDS.forEach(group => {
      rewardCard.appendChild(U.el('div', { style: { marginTop: '12px', fontWeight: '800', color: 'var(--purple)' } }, group.cat));
      const rows = U.el('div', { style: { marginTop: '4px' } });
      group.tasks.forEach(t => {
        rows.appendChild(U.el('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '6px 4px', borderBottom: '1px dashed #eee' } }, [
          U.el('span', { style: { color: 'var(--ink)' } }, t.name),
          U.el('span', { style: { fontWeight: '800', color: 'var(--green)' } }, '+' + t.stars + ' ⭐'),
        ]));
      });
      rewardCard.appendChild(rows);
    });
    container.appendChild(rewardCard);

    // 自定义加减星星（家长手动调整）
    container.appendChild(starAdjustCard());

    // 布置今日作业（孩子在宠物页「今日作业」按钮查看）
    container.appendChild(homeworkCard());

    // 宠物成长里程碑
    const petStages = S.activePetStages();
    const petTop = petStages[petStages.length - 1].min;
    const petLabel = S.activePet().name;
    const petCard = U.el('div', { class: 'card', style: { marginBottom: '18px' } }, [
      U.el('h3', { style: { color: '#B488F5' } }, '🐾 宠物成长里程碑（' + petLabel + '）'),
      U.el('p', { style: { color: '#8A7C95', marginTop: '2px' } }, '把星星投喂给宠物，累计达到下面数量就升级（共 ' + petStages.length + ' 级，升满 ' + petTop + ' ⭐）：'),
      U.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '8px', marginTop: '8px' } },
        petStages.map(st => U.el('div', { style: { background: 'var(--bg2)', borderRadius: '12px', padding: '8px 6px', textAlign: 'center' } }, [
          U.el('div', { style: { fontSize: '26px' } }, st.emoji),
          U.el('div', { style: { fontWeight: '800', color: 'var(--ink)' } }, st.name),
          U.el('div', { style: { fontSize: '12px', color: '#8A7C95' } }, st.min === 0 ? '起点' : '累计 ' + st.min + ' ⭐'),
        ]))
      )
    ]);
    container.appendChild(petCard);

    // 自理打卡（今天）
    const sc = S.data.progress.selfcare;
    const scCard = U.el('div', { class: 'card', style: { marginBottom: '18px' } }, [
      U.el('h3', { style: { color: '#B488F5' } }, '🧹 自理打卡情况'),
      U.el('p', { style: { color: '#8A7C95' } }, '今天已完成 ' + S.selfcareDoneToday().length + ' / ' + D.selfcareTasks.length + ' · 累计自理 ' + sc.stars + ' ⭐'),
    ]);
    const scRows = U.el('div', { style: { marginTop: '6px' } });
    D.selfcareTasks.forEach(t => {
      const done = S.selfcareIsDone(t.id);
      scRows.appendChild(U.el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', borderBottom: '1px dashed #eee' } }, [
        U.el('span', {}, (done ? '✅ ' : '⬜ ') + t.e + ' ' + t.name),
        U.el('span', { style: { color: 'var(--ink-soft)' } }, (sc.counts[t.id] || 0) + ' 次 · +' + t.stars + '⭐/天'),
      ]));
    });
    scCard.appendChild(scRows);
    container.appendChild(scCard);

    // 各模块学习进度
    const p = S.data.progress;
    container.appendChild(U.el('div', { class: 'card', style: { marginBottom: '18px' } }, [
      U.el('h3', { style: { color: '#B488F5' } }, '📊 学习进度'),
      U.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '10px', marginTop: '8px' } }, [
        stat('🔤 拼音', p.chinese.pinyinSeen.length),
        stat('✏️ 识字', p.chinese.charsLearned.length + ' / ' + D.chars.length),
        stat('📜 古诗', p.chinese.poemsRecited.length),
        stat('🌸 英语词', p.english.wordsLearned.length),
        stat('➕ 数学对', p.math.correct),
        stat('🔲 数独', p.sudoku.completed),
        stat('⚔️ 闯关', p.challenge.completed),
      ]),
    ]));

    // 进度备份与恢复（换设备/清缓存/浏览器更新不再丢档）
    container.appendChild(backupCard());

    // 家长密码管理
    container.appendChild(pinCard());

    // 返回
    container.appendChild(U.el('div', { style: { textAlign: 'center', margin: '8px 0 20px' } }, [
      U.el('button', { class: 'btn btn-pink', onclick: () => window.App.switchView('home') }, '🏠 返回小朋友界面'),
    ]));
  }

  /* ---- 进度备份 / 恢复 ---- */
  function backupCard() {
    return U.el('div', { class: 'card', style: { marginBottom: '18px', border: '2px dashed #B488F5' } }, [
      U.el('h3', { style: { color: '#B488F5' } }, '💾 进度备份与恢复'),
      U.el('p', { style: { color: '#8A7C95', marginTop: '2px' } }, '怕换设备、清缓存、浏览器更新丢记录？先「备份」一份进度码，需要时「恢复」即可。'),
      U.el('div', { style: { display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' } }, [
        U.el('button', { class: 'btn btn-purple', onclick: openExport }, '📤 备份进度'),
        U.el('button', { class: 'btn btn-green', onclick: openImport }, '📥 恢复进度'),
      ]),
    ]);
  }

  /* ---- 自定义加减星星 ---- */
  function pinInputStyle() {
    return { width: '100%', boxSizing: 'border-box', padding: '10px 12px', marginTop: '8px',
      fontSize: '15px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' };
  }
  function starAdjustCard() {
    const num = U.el('input', { type: 'number', min: '1', value: '1',
      style: { width: '74px', padding: '8px 10px', fontSize: '15px', borderRadius: '10px', border: '1px solid #ddd', textAlign: 'center' } });
    const amt = () => { let v = parseInt(num.value, 10); if (!v || v < 1) v = 1; return v; };
    const doAdjust = (sign) => {
      const applied = S.adjustStars(sign * amt());
      if (sign < 0 && applied === 0) U.toast('可用星星已是 ' + S.availableStars() + '，无法再减', '⚠️');
      else U.toast((sign > 0 ? '加上 ' : '减去 ') + Math.abs(applied) + ' 颗星星', '✨');
      window.App.switchView('parent'); // 刷新本页（不会重新要求密码）
    };
    return U.el('div', { class: 'card', style: { marginBottom: '18px', border: '2px dashed #FFC83D' } }, [
      U.el('h3', { style: { color: '#E8A33D' } }, '✨ 自定义加减星星'),
      U.el('p', { style: { color: '#8A7C95', marginTop: '2px' } }, '需要手动给孩子加星或减星就在这里操作。减星时不会让「可用星星」变成负数。'),
      U.el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' } }, [
        U.el('span', { style: { color: 'var(--ink)' } }, '数量'),
        num,
        U.el('button', { class: 'btn btn-green', onclick: () => doAdjust(1) }, '➕ 加星'),
        U.el('button', { class: 'btn btn-ghost', onclick: () => doAdjust(-1) }, '➖ 减星'),
      ]),
      U.el('div', { style: { display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' } },
        [1, 5, 10, 20].map(v => U.el('button', { class: 'btn btn-ghost', style: { padding: '6px 10px' }, onclick: () => { num.value = String(v); } }, '快捷 ' + v))
      ),
    ]);
  }

  /* ---- 布置今日作业 ---- */
  const HW_MAX_IMGS = 6;      // 最多 6 张
  const HW_MAX_SIDE = 1000;   // 上传后最长边（像素），控制体积
  const HW_QUALITY = 0.72;    // JPEG 质量

  // 本地图片 → 等比压缩 → dataURL（图片存在 localStorage，必须控体积）
  function hwFileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('read-fail'));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('decode-fail'));
        img.onload = () => {
          try {
            const sw = img.naturalWidth || img.width, sh = img.naturalHeight || img.height;
            const k = Math.min(1, HW_MAX_SIDE / Math.max(sw, sh || 1));
            const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const g = c.getContext('2d');
            g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
            g.drawImage(img, 0, 0, w, h);
            resolve(c.toDataURL('image/jpeg', HW_QUALITY));
          } catch (e) { reject(e); }
        };
        img.src = String(fr.result);
      };
      fr.readAsDataURL(file);
    });
  }

  function homeworkCard() {
    const hw = S.getHomework();
    const titleIn = U.el('input', { class: 'hw-input', value: String(hw.title || ''), placeholder: '作业标题，如：拼读菜单：', maxLength: '200' });
    const noteIn = U.el('input', { class: 'hw-input', value: String(hw.note || ''), placeholder: '给孩子的说明（可选），如：大声把菜名拼读出来', maxLength: '300' });
    // 本地暂存，点「布置为今日作业」后才写入存档
    let imgs = (hw.images || []).slice(0, HW_MAX_IMGS);

    const gridEl = U.el('div', { class: 'hw-ups' });
    const hintEl = U.el('p', { class: 'hw-hint' });
    function renderImgs() {
      U.clear(gridEl);
      if (!imgs.length) {
        gridEl.appendChild(U.el('div', { class: 'hw-empty' }, '还没有图片，点下面按钮从本机选'));
      } else {
        imgs.forEach((src, i) => {
          gridEl.appendChild(U.el('div', { class: 'hw-up' }, [
            U.el('img', { src: src, alt: '作业图片 ' + (i + 1) }),
            U.el('button', { class: 'hw-del', type: 'button', title: '移除这张', onclick: () => { imgs.splice(i, 1); renderImgs(); } }, '✕'),
          ]));
        });
      }
      hintEl.textContent = '已选 ' + imgs.length + '/' + HW_MAX_IMGS + ' 张（自动压缩后保存，建议不超过 6 张）';
    }

    const fileIn = U.el('input', { type: 'file', accept: 'image/*', multiple: 'multiple', style: { display: 'none' } });
    fileIn.addEventListener('change', async (e) => {
      const files = Array.prototype.slice.call(e.target.files || []);
      if (!files.length) return;
      let added = 0, failed = 0;
      for (const f of files) {
        if (imgs.length >= HW_MAX_IMGS) break;
        try { imgs.push(await hwFileToDataUrl(f)); added++; } catch (err) { failed++; }
      }
      renderImgs();
      fileIn.value = '';
      if (added) U.toast('已添加 ' + added + ' 张图片', '🖼️');
      if (imgs.length >= HW_MAX_IMGS && files.length > added + failed) U.toast('最多 ' + HW_MAX_IMGS + ' 张，多余的已忽略', '⚠️');
      if (failed) U.toast(failed + ' 张读不出来，换张图试试', '⚠️');
    });

    const statusEl = U.el('p', { class: 'hw-status' });
    const showStatus = () => {
      const h = S.getHomework();
      const n = (h.images || []).length;
      statusEl.textContent = S.hasHomeworkToday()
        ? '当前：今天已布置「' + (h.title || '（无标题）') + '」，' + n + ' 张图片'
        : (h.date ? '当前：最近一次布置于 ' + h.date + '（今天还没布置）' : '当前：还没有布置过作业');
    };
    renderImgs();
    showStatus();

    return U.el('div', { class: 'card', style: { marginBottom: '18px', border: '2px dashed #FFA94D' } }, [
      U.el('h3', { style: { color: '#E8853D' } }, '📚 布置今日作业'),
      U.el('p', { style: { color: '#8A7C95', marginTop: '2px' } }, '保存后，孩子在「宠物养成 → 今日作业」按钮里就能看到；新作业会有小红点提醒。'),
      statusEl,
      titleIn,
      noteIn,
      U.el('div', { style: { fontWeight: '800', color: 'var(--purple)', marginTop: '12px', fontSize: '14px' } }, '作业图片（从本机上传）：'),
      gridEl,
      hintEl,
      U.el('div', { style: { display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' } }, [
        U.el('button', { class: 'btn btn-ghost', style: { fontSize: '15px' }, onclick: () => fileIn.click() }, '📷 选择本地图片'),
        fileIn,
      ]),
      U.el('div', { style: { display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' } }, [
        U.el('button', { class: 'btn btn-pink', onclick: () => {
          const h = { title: titleIn.value, note: noteIn.value, images: imgs.slice(0, HW_MAX_IMGS) };
          if (!h.title.trim() && h.images.length === 0) { U.toast('作业内容不能全空哦', '⚠️'); return; }
          S.setHomework(h);
          if (S.lastSaveOk === false) { U.toast('图片太多保存不下，请删掉几张再试', '⚠️'); return; }
          U.toast('已布置今天的作业（' + h.images.length + ' 张图片）', '📚');
          showStatus();
        } }, '📚 布置为今日作业'),
        U.el('button', { class: 'btn btn-ghost', onclick: () => {
          U.modal({
            emoji: '🗑️', title: '清空今天的作业？',
            body: [U.el('p', { style: { color: '#8A7C95', fontSize: '14px' } }, '清空后孩子在「今日作业」里会看到"今天还没有作业"。')],
            actions: [
              { label: '确定清空', cls: 'btn-pink', onClick: () => { S.setHomework({ title: '', note: '', images: [] }); titleIn.value = ''; noteIn.value = ''; imgs = []; renderImgs(); showStatus(); U.closeModal(); U.toast('已清空今天的作业', '🗑️'); } },
              { label: '再想想', cls: 'btn-ghost', onClick: () => U.closeModal() },
            ],
          });
        } }, '🗑️ 清空作业'),
      ]),
    ]);
  }

  /* ---- 家长密码管理 ---- */
  function pinCard() {
    const set = S.hasParentPin();
    const btns = [];
    if (set) {
      btns.push(U.el('button', { class: 'btn btn-purple', onclick: changePin }, '🔑 修改密码'));
      btns.push(U.el('button', { class: 'btn btn-ghost', onclick: clearPin }, '🔓 关闭密码'));
    } else {
      btns.push(U.el('button', { class: 'btn btn-purple', onclick: () => window.App._promptSetPin(() => window.App.switchView('parent')) }, '🔐 设置密码'));
    }
    return U.el('div', { class: 'card', style: { marginBottom: '18px', border: '2px dashed #B488F5' } }, [
      U.el('h3', { style: { color: '#B488F5' } }, '🔐 家长密码'),
      U.el('p', { style: { color: '#8A7C95', marginTop: '2px' } }, set ? '已开启：每次进入家长后台都需要密码。' : '未开启：任何人都能直接进入家长后台，建议设置密码。'),
      U.el('div', { style: { display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' } }, btns),
    ]);
  }
  function changePin() {
    const i0 = U.el('input', { type: 'password', placeholder: '当前密码', style: pinInputStyle() });
    const i1 = U.el('input', { type: 'password', placeholder: '新密码', style: pinInputStyle() });
    const i2 = U.el('input', { type: 'password', placeholder: '再输一次', style: pinInputStyle() });
    U.modal({
      emoji: '🔑', title: '修改家长密码',
      body: [i0, i1, i2],
      actions: [
        { label: '确定', cls: 'btn-purple', onClick: () => {
          if (!S.verifyParentPin(i0.value)) { U.toast('当前密码不正确', '⚠️'); return; }
          const a = i1.value, b = i2.value;
          if (!a) { U.toast('请输入新密码', '⚠️'); return; }
          if (a !== b) { U.toast('两次输入不一致', '⚠️'); return; }
          S.setParentPin(a); U.closeModal(); U.toast('密码已修改', '✅'); window.App.switchView('parent');
        } },
        { label: '取消', cls: 'btn-ghost', onClick: () => U.closeModal() },
      ],
    });
    setTimeout(() => { try { i0.focus(); } catch (e) {} }, 80);
  }
  function clearPin() {
    U.modal({
      emoji: '🔓', title: '关闭家长密码？',
      body: [U.el('p', { style: { color: '#8A7C95', fontSize: '14px' } }, '关闭后任何人都能直接进入家长后台，确定吗？')],
      actions: [
        { label: '确定关闭', cls: 'btn-pink', onClick: () => { S.clearParentPin(); U.closeModal(); U.toast('已关闭密码', '✅'); window.App.switchView('parent'); } },
        { label: '再想想', cls: 'btn-ghost', onClick: () => U.closeModal() },
      ],
    });
  }

  function openExport() {
    const txt = S.exportData();
    const ta = U.el('textarea', {
      readonly: true,
      style: { width: '100%', height: '160px', fontSize: '11px', borderRadius: '10px', border: '1px solid #ddd', padding: '8px', boxSizing: 'border-box' },
    });
    ta.value = txt || '';
    U.modal({
      emoji: '📤',
      title: '备份进度',
      body: [
        U.el('p', { style: { color: '#8A7C95', fontSize: '14px' } }, '下面这串是孩子的全部进度，请复制保存好（发到微信 / 存进备忘录都行）。换设备或清缓存后，用它就能恢复。'),
        ta,
        U.el('p', { style: { color: '#B488F5', fontSize: '13px', marginTop: '6px' } }, '⚠️ 备份码包含全部进度，请勿随意发给他人。'),
      ],
      actions: [
        { label: '📋 复制', cls: 'btn-purple', onClick: () => copyText(ta.value, ta) },
        { label: '💾 下载', cls: 'btn-green', onClick: () => downloadJson(ta.value) },
        { label: '关闭', cls: 'btn-ghost', onClick: () => U.closeModal() },
      ],
    });
    setTimeout(() => { try { ta.focus(); ta.select(); } catch (e) {} }, 80); // 自动全选，方便复制
  }

  function openImport() {
    const ta = U.el('textarea', {
      placeholder: '在这里粘贴备份码，或从下方选择备份文件…',
      style: { width: '100%', height: '150px', fontSize: '12px', borderRadius: '10px', border: '1px solid #ddd', padding: '8px', boxSizing: 'border-box' },
    });
    const fileInput = U.el('input', { type: 'file', accept: '.json,.txt,application/json', style: { marginTop: '8px' } });
    fileInput.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => { ta.value = String(r.result || ''); };
      r.readAsText(f);
    });
    U.modal({
      emoji: '📥',
      title: '恢复进度',
      body: [
        U.el('p', { style: { color: '#8A7C95', fontSize: '14px' } }, '粘贴之前保存的备份码，或选择备份文件。恢复会覆盖当前设备上的进度，请确保这是你想恢复的那一份。'),
        ta,
        fileInput,
      ],
      actions: [
        { label: '🔄 恢复', cls: 'btn-green', onClick: () => confirmImport(ta.value) },
        { label: '取消', cls: 'btn-ghost', onClick: () => U.closeModal() },
      ],
    });
  }

  function confirmImport(text) {
    text = (text || '').trim();
    if (!text) { U.toast('请先粘贴备份码或选文件', '⚠️'); return; }
    U.modal({
      emoji: '⚠️',
      title: '确定要恢复吗？',
      body: [U.el('p', { style: { color: '#8A7C95', fontSize: '14px' } }, '这会用备份里的进度覆盖当前设备的数据，且无法撤销。确定继续？')],
      actions: [
        { label: '✅ 确定恢复', cls: 'btn-green', onClick: () => {
            const res = S.importData(text);
            if (res.ok) {
              U.closeModal();
              window.App.switchView('parent');
              U.toast(res.msg, '✅');
            } else {
              U.toast(res.msg, '⚠️');
            }
          } },
        { label: '再想想', cls: 'btn-ghost', onClick: () => U.closeModal() },
      ],
    });
  }

  function copyText(text, taEl) {
    const fallback = () => {
      try { taEl.select(); taEl.setSelectionRange(0, taEl.value.length); document.execCommand('copy'); U.toast('备份码已复制', '📋'); }
      catch (e) { U.toast('请手动长按全选后复制', '⚠️'); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => U.toast('备份码已复制', '📋')).catch(fallback);
    } else fallback();
  }

  function downloadJson(text) {
    try {
      const blob = new Blob([text || ''], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = U.el('a', { href: url, download: 'baobei-pet-backup.json' });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      U.toast('已生成备份文件', '💾');
    } catch (e) { U.toast('下载失败，请用「复制」方式', '⚠️'); }
  }

  function stat(label, val) {
    return U.el('div', { style: { background: 'var(--bg2)', borderRadius: '14px', padding: '10px 12px' } }, [
      U.el('div', { style: { fontSize: '13px', color: '#8A7C95' } }, label),
      U.el('div', { style: { fontSize: '22px', fontWeight: '800', color: '#B488F5' } }, String(val)),
    ]);
  }

  window.Modules = window.Modules || {};
  window.Modules.parent = { render };
})();
