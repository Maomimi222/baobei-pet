/* ===========================================================
   宠物养成：宠物成长 + 星星投喂 + 宠物互动 + 领养 + 成就徽章墙 + 综合闯关
   - 宠物以「整只动物」SVG 呈现（见 petart.js），不再只是头像
   - 无互动时随机待机：走路 / 休息 / 张望 / 摇尾巴 / 眨眼
   - 支持场景背景切换与花费星星换装
   =========================================================== */
(function () {
  const U = window.U, S = window.Store, D = window.Data;
  const PA = window.PetArt;

  // 渲染时指向的场景 DOM 引用
  let petSceneEl = null, petBgEl = null, petWrapEl = null, petSvgEl = null, petFloatEl = null;
  let idleTimer = null, busy = false;
  // 卧室场景状态：进入默认夜晚、宠物清醒；点击小床 → 入睡（仍夜晚），再点 → 起床且变白天
  let bedNight = true, petAsleep = false;

  function render(container) {
    U.clear(container);
    const pets = S.data.pets;
    const active = S.activePet();
    const stage = S.petStage();

    container.appendChild(U.el('div', { class: 'section-head' }, [
      U.el('h2', {}, [U.el('span', { class: 'title-emoji' }, '🐾 '), '宠物养成']),
      U.el('span', { class: 'chip' }, '⭐ 可用 ' + S.availableStars() + ' · 今日答题 ' + S.dailyStars() + '/' + S.DAILY_CAP),
    ]));

    const next = S.nextStage();
    const petBox = U.el('div', { class: 'pet-stage' });

    /* ---- 宠物场景：背景 + 整只动物 + 浮动层 ---- */
    const petScene = U.el('div', { class: 'pet-scene' });
    const petBg = U.el('div', { class: 'pet-scene-bg' });
    petBg.innerHTML = PA.sceneSvg(S.data.scene, { night: nightFor(), asleep: petAsleep, pet: petSceneInfo() });
    const petWrap = U.el('div', { class: 'pet-svg-wrap' });
    petWrap.innerHTML = PA.petSvg({ species: active.species, stageIndex: stage.index, wearing: active.wearing });
    const petFloat = U.el('div', { class: 'pet-float' });
    petScene.appendChild(petBg); petScene.appendChild(petWrap); petScene.appendChild(petFloat);
    petBox.appendChild(petScene);

    // 把引用挂到模块变量，供互动/待机动画使用
    petSceneEl = petScene; petBgEl = petBg; petWrapEl = petWrap;
    petSvgEl = petWrap.querySelector('svg.pet-svg'); petFloatEl = petFloat;

    // 卧室睡眠态：站立宠物隐藏，改由场景内横卧的宠物呈现
    if (petWrapEl) petWrapEl.style.display = (S.data.scene === 'bedroom' && petAsleep) ? 'none' : '';
    // 卧室小床点击：切换睡眠 / 起床（昼夜联动）
    if (petBgEl) {
      petBgEl.addEventListener('click', onBedClick);
    }

    /* ---- 名字 + 阶段说明 ---- */
    const nameInput = U.el('input', { class: 'answer-input', style: { maxWidth: '220px', margin: '6px auto', textAlign: 'center', minHeight: '48px' }, value: active.name });
    nameInput.addEventListener('change', () => { S.renamePet(nameInput.value); U.toast('宠物改名：' + active.name, '🐾'); });
    petBox.appendChild(U.el('div', { class: 'pet-name' }, active.name));
    petBox.appendChild(nameInput);
    petBox.appendChild(U.el('div', { class: 'pet-stage-name' }, stage.name + ' · ' + stage.desc));

    /* ---- 进度条（到下个阶段）---- */
    const barFill = U.el('i', { style: { width: '0%' } });
    if (next) {
      const span = next.min - stage.min;
      const got = active.fedTotal - stage.min;
      barFill.style.width = Math.min(100, Math.round(got / span * 100)) + '%';
      petBox.appendChild(U.el('div', { class: 'food-bar' }, barFill));
      petBox.appendChild(U.el('small', { style: { color: '#8A7C95' } }, '再投喂 ' + (next.min - active.fedTotal) + ' 颗星星，就变成「' + next.name + '」'));
    } else {
      barFill.style.width = '100%';
      petBox.appendChild(U.el('div', { class: 'food-bar' }, barFill));
      petBox.appendChild(U.el('small', { style: { color: '#8A7C95' } }, '已经是终极形态啦，超棒！'));
    }

    /* ---- 投喂按钮 ---- */
    petBox.appendChild(U.el('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px' } }, [
      U.el('button', { class: 'btn btn-pink', onclick: () => doFeed(1) }, '🍬 喂 1 颗'),
      U.el('button', { class: 'btn btn-purple', onclick: () => doFeed(5) }, '🍰 喂 5 颗'),
      U.el('button', { class: 'btn btn-blue', onclick: () => doFeed(S.availableStars()) }, '🌟 全部投喂'),
    ]));

    /* ---- 互动按钮（动画）---- */
    petBox.appendChild(U.el('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' } }, [
      U.el('button', { class: 'btn btn-ghost', onclick: () => interact('sleep') }, '💤 睡觉'),
      U.el('button', { class: 'btn btn-ghost', onclick: () => interact('wake') }, '🌞 起床'),
      U.el('button', { class: 'btn btn-ghost', onclick: () => interact('brush') }, '🪥 刷牙'),
      U.el('button', { class: 'btn btn-ghost', onclick: () => interact('play') }, '🎾 玩耍'),
      U.el('button', { class: 'btn btn-ghost', onclick: () => interact('candy') }, '🍬 喂糖'),
    ]));
    /* ---- 换装 / 场景 ---- */
    petBox.appendChild(U.el('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' } }, [
      U.el('button', { class: 'btn btn-ghost', onclick: openDress }, '🎀 换装'),
      U.el('button', { class: 'btn btn-ghost', onclick: openScene }, '🏞️ 场景'),
    ]));

    /* ---- 领养新宠物蛋（当前宠物满级后出现）---- */
    if (S.canAdopt()) {
      const sp = S.nextAdoptSpecies();
      petBox.appendChild(U.el('button', { class: 'btn btn-green', style: { marginTop: '12px' }, onclick: doAdopt },
        '🥚 领养新宠物蛋（' + (S.SPECIES[sp] ? S.SPECIES[sp].label : '神秘') + '）'));
    }
    container.appendChild(petBox);

    /* ---- 我的宠物们（切换查看）---- */
    if (pets.length > 1) {
      container.appendChild(U.el('div', { style: { textAlign: 'center', marginTop: '16px', color: '#8A7C95', fontSize: '14px' } }, '你已经有 ' + pets.length + ' 只宠物啦，点一点切换看别的～'));
      const picker = U.el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' } });
      pets.forEach((p, i) => {
        const ps = S.petStage(p);
        picker.appendChild(U.el('button', {
          class: 'pet-thumb' + (i === S.data.activePet ? ' on' : ''),
          onclick: () => { S.switchPet(i); render(document.getElementById('view-pet')); window.App.refreshChrome(); },
        }, [
          U.el('div', { class: 'pt-emoji' }, ps.emoji),
          U.el('div', { class: 'pt-name' }, p.name),
          U.el('div', { class: 'pt-stage' }, ps.name),
        ]));
      });
      container.appendChild(picker);
    }

    /* ---- 成长阶段条 ---- */
    const stages = S.activePetStages();
    const track = U.el('div', { class: 'stage-track' });
    stages.forEach((st, i) => {
      track.appendChild(U.el('div', { class: 'stage-dot' + (i === stage.index ? ' on' : '') }, [
        U.el('div', { class: 'sd-emoji' }, st.emoji),
        U.el('small', {}, st.name),
      ]));
    });
    container.appendChild(track);

    /* ---- 综合闯关 + 今日作业 ---- */
    container.appendChild(U.el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', margin: '22px 0' } }, [
      U.el('button', { class: 'btn btn-green', style: { fontSize: '20px' }, onclick: startChallenge }, '⚔️ 综合闯关（赢星星）'),
      U.el('button', { class: 'btn btn-orange hw-btn', style: { fontSize: '20px' }, onclick: openHomework },
        [S.homeworkUnseen() ? U.el('i', { class: 'hw-new' }) : null, '📚 今日作业']),
    ]));

    /* ---- 成就徽章墙 ---- */
    container.appendChild(U.el('div', { class: 'section-head' }, [U.el('h2', {}, [U.el('span', { class: 'title-emoji' }, '🏅 '), '成就徽章墙'])]));
    const wall = U.el('div', { class: 'badge-wall' });
    S.badgeStatus().forEach(b => {
      wall.appendChild(U.el('div', { class: 'badge' + (b.unlocked ? '' : ' locked'), title: b.desc }, [
        U.el('div', { class: 'b-ico' }, b.unlocked ? b.emoji : '🔒'),
        U.el('small', {}, b.name),
      ]));
    });
    container.appendChild(wall);
    container.appendChild(U.el('p', { style: { textAlign: 'center', color: '#8A7C95', marginTop: '10px' } }, '已获得 ' + Object.keys(S.data.badges).length + ' / ' + S.BADGES.length + ' 枚徽章'));

    startIdle(); // 进入页面即开始随机待机
  }

  function doFeed(n) {
    if (S.availableStars() <= 0) { U.toast('还没有星星哦，先去闯关得星星吧！', '⭐'); return; }
    const fed = S.feedPet(n);
    const stage = S.petStage();
    U.confetti(1200);
    U.toast('投喂 ' + fed + ' 颗星星！', '🍬');
    render(document.getElementById('view-pet'));
    window.App.refreshChrome();
  }

  /* ===================== 待机 / 互动动画 ===================== */
  function idleDur(a) { return { walk: 2400, rest: 2600, look: 1800, tail: 1900 }[a] || 1500; }

  function startIdle() {
    stopIdle();
    if (!petWrapEl) return;
    const loop = () => {
      if (busy || !petWrapEl) return;
      const acts = ['walk', 'rest', 'look', 'tail', 'blink', 'blink']; // 眨眼概率更高
      const a = acts[Math.floor(Math.random() * acts.length)];
      if (a === 'blink') {
        if (petSvgEl) { petSvgEl.classList.add('blink'); setTimeout(() => { if (petSvgEl) petSvgEl.classList.remove('blink'); }, 170); }
      } else {
        const cls = 'idle-' + a;
        ['idle-walk', 'idle-rest', 'idle-look', 'idle-tail'].forEach(c => petWrapEl.classList.remove(c));
        void petWrapEl.offsetWidth; // 触发重排以重启动画
        petWrapEl.classList.add(cls);
        setTimeout(() => { if (petWrapEl) petWrapEl.classList.remove(cls); }, idleDur(a));
      }
      // 间隔缩短：配合常驻呼吸动画，动作之间不再有「定格」的空档
      idleTimer = setTimeout(loop, idleDur(a) + 500 + Math.random() * 900);
    };
    idleTimer = setTimeout(loop, 900);
  }
  function stopIdle() { if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; } }

  function interact(type) {
    if (!petWrapEl || busy) return;
    busy = true; stopIdle();
    ['idle-walk', 'idle-rest', 'idle-look', 'idle-tail'].forEach(c => petWrapEl.classList.remove(c));
    void petWrapEl.offsetWidth;
    petWrapEl.classList.add('act-' + type);
    // 多段浮动 emoji，营造丰富细节
    const map = {
      sleep: [['💤', -8], ['💤', 14], ['🌟', 28]],
      wake:  [['🌞', 0], ['✨', 16], ['☀️', -14]],
      brush: [['🪥', -6], ['🫧', 10], ['✨', 22]],
      play:  [['🎾', -12], ['💛', 12], ['⭐', 26]],
      candy: [['🍬', -6], ['💖', 12], ['🌟', 26]],
    };
    const emojis = map[type] || map.play;
    emojis.forEach((e, i) => setTimeout(() => spawnFloat(e[0], e[1]), i * 220));
    const msg = {
      sleep: '晚安，做个好梦～', wake: '早上好！精神满满！', brush: '刷刷刷，牙齿亮晶晶！',
      play: '耶！一起玩球球～', candy: '甜甜的，谢谢你！',
    };
    U.toast(msg[type] || '好耶！', (emojis[0] && emojis[0][0]) || '🐾');
    // 时长需与 style.css 里 .act-* 的 animation-duration 保持一致
    const dur = { sleep: 2800, wake: 1200, brush: 1600, play: 2000, candy: 1800 }[type] || 1600;
    setTimeout(() => { petWrapEl.classList.remove('act-' + type); busy = false; startIdle(); }, dur);
  }

  function spawnFloat(emoji, x) {
    if (!petFloatEl) return;
    const f = U.el('div', { class: 'float-emoji' }, emoji);
    f.style.left = 'calc(50% + ' + (x || 0) + 'px)';
    f.style.bottom = '42%';
    petFloatEl.appendChild(f);
    setTimeout(() => { if (f) f.remove(); }, 1700);
  }

  // 当前场景是否渲染为夜晚（仅卧室区分；进入默认夜晚）
  function nightFor() { return S.data.scene === 'bedroom' ? bedNight : true; }

  // 入睡时画在床上的宠物信息（物种 / 阶段 / 穿戴）
  function petSceneInfo() {
    const p = S.activePet(); const st = S.petStage();
    return { species: p.species, stageIndex: st.index, wearing: p.wearing };
  }

  // 卧室小床点击处理
  function onBedClick(e) {
    if (S.data.scene !== 'bedroom') return;
    if (!e.target.closest || !e.target.closest('.bed-hit')) return;
    toggleBed();
  }

  // 切换睡眠 / 起床，昼夜联动：入睡→夜晚；起床→白天
  function toggleBed() {
    if (S.data.scene !== 'bedroom') return;
    if (busy && !petAsleep) return; // 起床动画进行中忽略；睡着时允许点击唤醒
    petAsleep = !petAsleep;
    bedNight = petAsleep;
    if (petBgEl) petBgEl.innerHTML = PA.sceneSvg('bedroom', { night: bedNight, asleep: petAsleep, pet: petSceneInfo() });
    if (petAsleep) {
      // 入睡：隐藏站立宠物，场景中已绘制横卧的宠物 + zzz
      busy = true; stopIdle();
      if (petWrapEl) petWrapEl.style.display = 'none';
      U.toast('晚安，宝贝睡啦～', '💤');
    } else {
      // 起床：恢复站立宠物并播放伸懒腰回弹
      if (petWrapEl) {
        petWrapEl.style.display = '';
        void petWrapEl.offsetWidth;
        petWrapEl.classList.add('act-wake');
      }
      U.toast('早上好！天亮啦～', '🌞');
      setTimeout(() => { if (petWrapEl) petWrapEl.classList.remove('act-wake'); busy = false; startIdle(); }, 1200);
    }
  }

  // 换装 / 场景切换后，重画宠物 SVG 并重启待机
  function refreshPetSvg() {
    const p = S.activePet(); const st = S.petStage();
    // 睡眠态下站立宠物被隐藏，只需更新场景内横卧的宠物
    if (petAsleep && petBgEl) {
      petBgEl.innerHTML = PA.sceneSvg('bedroom', { night: bedNight, asleep: true, pet: petSceneInfo() });
      return;
    }
    if (!petWrapEl) return;
    petWrapEl.innerHTML = PA.petSvg({ species: p.species, stageIndex: st.index, wearing: p.wearing });
    petSvgEl = petWrapEl.querySelector('svg.pet-svg');
    startIdle();
  }

  /* ===================== 换装商店 ===================== */
  function openDress() {
    const pet = S.activePet();
    const wrap = U.el('div', { class: 'shop-grid' });
    PA.SLOTS.forEach(slot => {
      wrap.appendChild(U.el('div', { class: 'shop-slot' }, slot.name));
      PA.OUTFITS.filter(o => o.slot === slot.id).forEach(o => {
        const owned = pet.wardrobe.includes(o.id);
        const wearing = pet.wearing[slot.id] === o.id;
        const item = U.el('div', { class: 'shop-item' + (owned ? ' owned' : '') + (wearing ? ' wearing' : '') }, [
          U.el('div', { class: 'si-emoji' }, o.emoji),
          U.el('div', { class: 'si-name' }, o.name),
          U.el('div', { class: 'si-tag' + (owned ? (wearing ? ' on' : ' lock') : ' lock') }, owned ? (wearing ? '穿戴中' : '点此穿戴') : ('⭐' + o.cost)),
        ]);
        item.onclick = () => {
          let r;
          if (owned) { r = wearing ? S.unequipOutfit(slot.id) : S.equipOutfit(o.id); }
          else { r = S.buyOutfit(o.id); if (r.ok) U.confetti(800); }
          if (!r.ok) { U.toast(r.msg, '⭐'); return; }
          U.toast((wearing ? '脱下「' + o.name + '」' : '穿上「' + o.name + '」'), o.emoji);
          refreshPetSvg();
          window.App.refreshChrome();
          U.closeModal(); openDress(); // 重开以刷新星星/状态
        };
        wrap.appendChild(item);
      });
    });
    const avail = U.el('div', { class: 'shop-avail' }, '⭐ 可用星星：' + S.availableStars());
    U.modal({ emoji: '🎀', title: '宠物换装店', body: [avail, wrap], actions: [{ label: '完成', cls: 'btn-pink', onClick: () => U.closeModal() }] });
  }

  /* ===================== 场景选择 ===================== */
  function openScene() {
    const grid = U.el('div', { class: 'scene-grid' });
    PA.SCENES.forEach(sc => {
      const owned = S.hasScene(sc.id);
      const cost = sc.cost || 0;
      const children = [
        U.el('div', { class: 'sc-emoji' }, owned ? sc.emoji : '🔒'),
        U.el('div', { class: 'sc-name' }, sc.name),
      ];
      if (!owned && cost > 0) children.push(U.el('div', { class: 'sc-cost' }, '⭐' + cost + ' 购买'));
      const card = U.el('div', { class: 'scene-card' + (S.data.scene === sc.id ? ' on' : '') + (owned ? '' : ' locked') }, children);
      card.onclick = () => {
        if (!owned) {
          const r = S.buyScene(sc.id);
          if (!r.ok) { U.toast(r.msg, '⭐'); return; }
          U.confetti(900);
          // 进入付费场景：默认夜晚、宠物清醒
          bedNight = true; petAsleep = false; busy = false;
          S.setScene(sc.id);
          if (petBgEl) petBgEl.innerHTML = PA.sceneSvg(sc.id, { night: nightFor(), asleep: petAsleep, pet: petSceneInfo() });
          if (petWrapEl) petWrapEl.style.display = '';
          U.toast('解锁「' + sc.name + '」，已切换～', sc.emoji);
          U.closeModal(); openScene(); // 刷新卡片状态
          return;
        }
        // 已拥有：切换
        const from = S.data.scene;
        S.setScene(sc.id);
        // 离开卧室时复位睡眠态，避免影响其他场景的待机动画
        if (from === 'bedroom') { petAsleep = false; bedNight = true; busy = false; }
        // 进入卧室：默认夜晚、宠物清醒
        if (sc.id === 'bedroom') { bedNight = true; petAsleep = false; busy = false; }
        if (petBgEl) petBgEl.innerHTML = PA.sceneSvg(sc.id, { night: nightFor(), asleep: petAsleep, pet: petSceneInfo() });
        if (petWrapEl) petWrapEl.style.display = '';
        U.toast('切换到「' + sc.name + '」', sc.emoji);
        U.closeModal();
      };
      grid.appendChild(card);
    });
    U.modal({ emoji: '🏞️', title: '选择背景场景', body: [grid], actions: [{ label: '关闭', cls: 'btn-pink', onClick: () => U.closeModal() }] });
  }

  /* ===================== 领养新宠物 ===================== */
  function doAdopt() {
    const pet = S.adoptPet();
    if (!pet) { U.toast('要先把当前宠物养到满级哦～', '🥚'); return; }
    const emoji = (S.SPECIES[pet.species] || S.SPECIES.cat).base;
    U.confetti(2000);
    U.modal({
      emoji: '🥚', title: '领养成功！',
      body: ['你领到了一只 ' + (S.SPECIES[pet.species] ? S.SPECIES[pet.species].label : '神秘') + '宝宝！', U.el('p', {}, emoji + ' ' + pet.name)],
      actions: [{ label: '去看看', cls: 'btn-pink', onClick: () => { U.closeModal(); render(document.getElementById('view-pet')); window.App.refreshChrome(); } }],
    });
  }

  /* ===================== 今日作业（家长布置） ===================== */
  function openHomework() {
    const hw = S.getHomework();
    const has = hw && (String(hw.title || '').trim() || (hw.images && hw.images.length));
    if (!has) {
      U.modal({
        emoji: '📚', title: '今日作业',
        body: [U.el('p', { style: { color: '#8A7C95', fontSize: '15px', lineHeight: '1.7' } }, '今天还没有作业哦～', U.el('br'), '先去综合闯关赢星星吧！')],
        actions: [{ label: '好嘞', cls: 'btn-pink', onClick: () => U.closeModal() }],
      });
      return;
    }
    // 打开即记为「已看」，摘掉按钮上的小红点
    if (S.homeworkUnseen()) {
      S.markHomeworkSeen();
      const dot = document.querySelector('.hw-btn .hw-new');
      if (dot) dot.remove();
    }
    const isToday = hw.date === S._today();
    const body = [U.el('div', { style: { margin: '0 0 8px' } },
      U.el('span', { class: 'chip' }, isToday ? '✨ 今天的新作业' : '📅 布置于 ' + hw.date))];
    if (String(hw.title || '').trim()) body.push(U.el('div', { class: 'hw-title' }, hw.title));
    if (String(hw.note || '').trim()) body.push(U.el('p', { class: 'hw-note' }, hw.note));
    (hw.images || []).forEach(src => {
      const img = U.el('img', { class: 'hw-img', src: src, alt: '作业图片（点击放大）' });
      img.addEventListener('click', () => openLightbox(src));
      body.push(img);
    });
    if ((hw.images || []).length) body.push(U.el('p', { style: { color: '#B488F5', fontSize: '12px', marginTop: '6px' } }, '👆 点图片可以放大看'));
    const actions = [];
    if (String(hw.title || '').trim()) {
      actions.push({ label: '🔊 听一听', cls: 'btn-purple', onClick: () => { U.speakZh(String(hw.title).replace(/[：:]/g, '，')); } });
    }
    actions.push({ label: '我看完啦', cls: 'btn-pink', onClick: () => U.closeModal() });
    U.modal({ emoji: '📚', title: '今日作业', body, actions });
  }

  // 全屏查看大图（点击任意处关闭）
  function openLightbox(src) {
    const box = U.el('div', { class: 'hw-lightbox' }, [
      U.el('img', { src: src, alt: '作业大图' }),
      U.el('span', { class: 'hw-close' }, '✕ 点一下关闭'),
    ]);
    box.addEventListener('click', () => box.remove());
    document.body.appendChild(box);
  }

  /* ===================== 综合闯关 ===================== */
  function startChallenge() {
    const qs = buildQuestions(5);
    let i = 0, score = 0;
    U.modal({ emoji: '⚔️', title: '综合闯关开始！', body: ['一共 5 题，答对越多星星越多！', U.el('p', {}, '🌟 每题 2 颗星星（每日上限 ' + S.DAILY_CAP + '）')], actions: [{ label: '开始', cls: 'btn-pink', onClick: () => { U.closeModal(); step(); } }] });
    function step() {
      if (i >= qs.length) {
        const got = S.addStars(score * 2);
        S.addChallenge();
        U.confetti(2200);
        U.modal({ emoji: '🎉', title: '闯关完成！', body: ['答对 ' + score + ' / ' + qs.length + ' 题', U.el('p', {}, '⭐ 获得 ' + got + ' 颗星星' + (got < score * 2 ? '（今日已到上限）' : ''))], actions: [{ label: '🌟 去喂宠物', cls: 'btn-pink', onClick: () => { U.closeModal(); window.App.switchView('pet'); } }, { label: '再闯一次', cls: 'btn-blue', onClick: () => { U.closeModal(); startChallenge(); } }] });
        return;
      }
      qs[i]((correct) => { if (correct) score++; i++; setTimeout(step, 500); });
    }
  }

  function buildQuestions(n) {
    const pool = [];
    for (let k = 0; k < n; k++) pool.push(Math.random());
    return pool.map(rand => {
      if (rand < 0.34) return mathQ;
      if (rand < 0.67) return englishQ;
      return charQ;
    });
  }

  function mathQ(onDone) {
    const op = Math.random() < 0.5 ? '+' : '−';
    let a, b, ans;
    if (op === '+') { a = U.rand(1, 99); b = U.rand(1, 100 - a); ans = a + b; }
    else { a = U.rand(2, 99); b = U.rand(1, a); ans = a - b; }
    let val = '';
    const disp = U.el('input', { class: 'answer-input', readonly: true, value: '' });
    disp.addEventListener('focus', () => disp.blur());
    const fb = U.el('div', { class: 'feedback' });
    const pad = U.el('div', { class: 'num-pad' });
    '123456789'.split('').forEach(d => pad.appendChild(U.el('button', { class: 'num-key', onclick: () => { val += d; disp.value = val; } }, d)));
    pad.appendChild(U.el('button', { class: 'num-key del', onclick: () => { val = val.slice(0, -1); disp.value = val; } }, '⌫'));
    pad.appendChild(U.el('button', { class: 'num-key', style: { background: 'var(--green-2)' }, onclick: () => { val += '0'; disp.value = val; } }, '0'));
    pad.appendChild(U.el('button', { class: 'num-key ok', style: { gridColumn: 'span 2' }, onclick: () => {
      const correct = parseInt(val, 10) === ans;
      if (correct) { fb.textContent = '✅ 对啦！'; fb.className = 'feedback ok'; } else { fb.textContent = '❌ 答案 ' + ans; fb.className = 'feedback no'; }
      setTimeout(() => onDone(correct), 900);
    } }, '✅ 确定'));
    U.modal({ emoji: '🔢', title: a + ' ' + op + ' ' + b + ' = ?', body: [disp, pad, fb], actions: [] });
  }

  function englishQ(onDone) {
    const list = U.shuffle(D.english.starters.concat(D.english.movers)).slice(0, 1)[0];
    const opts = U.shuffle([list.w, ...U.shuffle(D.english.starters.concat(D.english.movers).filter(x => x.w !== list.w)).slice(0, 2).map(x => x.w)]);
    U.modal({
      emoji: list.e, title: list.zh + ' 用英语怎么说？',
      body: [U.el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' } }, U.shuffle(opts).map(o =>
        U.el('button', { class: 'btn btn-yellow', onclick: (e) => {
          if (o === list.w) { U.speakWord(o); e.target.textContent = '✅ ' + o; setTimeout(() => onDone(true), 700); }
          else { e.target.textContent = '❌ ' + o; setTimeout(() => onDone(false), 700); }
        } }, o)
      ))],
      actions: [{ label: '🔊 听', cls: 'btn-blue', onClick: () => U.speakWord(list.w) }],
    });
  }

  function charQ(onDone) {
    const list = U.pick(D.chars);
    const opts = U.shuffle([list.p, ...U.shuffle(D.chars.filter(x => x.c !== list.c)).slice(0, 2).map(x => x.p)]);
    U.modal({
      emoji: list.e || '🔤', title: '这个字怎么读？',
      body: [U.el('div', { style: { fontSize: '56px', fontWeight: '800', color: '#B488F5' } }, list.c),
        U.el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' } }, U.shuffle(opts).map(o =>
          U.el('button', { class: 'btn btn-yellow', onclick: (e) => {
            if (o === list.p) { U.speakZh(list.c); e.target.textContent = '✅ ' + o; setTimeout(() => onDone(true), 700); }
            else { e.target.textContent = '❌ ' + o; setTimeout(() => onDone(false), 700); }
          } }, o)
        ))],
      actions: [{ label: '🔊 听', cls: 'btn-blue', onClick: () => U.speakZh(list.c) }],
    });
  }

  window.Modules = window.Modules || {};
  window.Modules.pet = { render };
})();
