/* ===========================================================
   Util — DOM 辅助 / 发音(TTS) / 弹窗 / 撒花 / 工具函数
   =========================================================== */
(function () {
  const U = {
    /* 创建元素：el('div', {class:'x', onclick:fn}, [children]) */
    el(tag, props, children) {
      const e = document.createElement(tag);
      if (props) {
        for (const k in props) {
          const v = props[k];
          if (k === 'class') e.className = v;
          else if (k === 'html') e.innerHTML = v;
          else if (k === 'text') e.textContent = v;
          else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
          else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
          else if (v !== null && v !== undefined) e.setAttribute(k, v);
        }
      }
      if (children != null) {
        (Array.isArray(children) ? children : [children]).forEach(c => {
          if (c == null) return;
          e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
      }
      return e;
    },
    clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; },
    rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },

    /* ---- 发音（文字转语音）---- */
    speak(text, lang) {
      if (!window.Store || !window.Store.data.settings.soundOn) return Promise.resolve();
      text = (text == null ? '' : String(text)).trim();
      if (!text) return Promise.resolve();
      const key = (lang || 'en-US') + '|' + text;
      const fn = window.AUDIO_MAP && window.AUDIO_MAP[key];
      if (fn) return this.playMp3('assets/audio/' + fn, text, lang);
      return this.synthSpeak(text, lang);
    },
    playMp3(src, text, lang) {
      return new Promise((resolve) => {
        const a = new Audio(src);
        a.preload = 'auto';
        let done = false;
        const fin = () => { if (done) return; done = true; try { a.onended = null; a.onerror = null; } catch (e) {} resolve(); };
        a.onended = fin;
        a.onerror = () => { this.synthSpeak(text, lang).then(fin); };
        const p = a.play();
        if (p && p.catch) p.catch(() => { this.synthSpeak(text, lang).then(fin); });
        setTimeout(fin, 12000);
      });
    },
    synthSpeak(text, lang) {
      return new Promise((resolve) => {
        try {
          if (!window.speechSynthesis) return resolve();
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang || 'en-US';
          u.rate = 0.85; u.pitch = 1.1;
          const voices = window.speechSynthesis.getVoices();
          const match = voices.find(v => v.lang && v.lang.toLowerCase().startsWith((lang || 'en').toLowerCase()));
          if (match) u.voice = match;
          u.onend = () => resolve();
          u.onerror = () => resolve();
          window.speechSynthesis.speak(u);
          setTimeout(resolve, 8000);
        } catch (e) { resolve(); }
      });
    },
    speakSeq(texts, lang) {
      let chain = Promise.resolve();
      (texts || []).forEach(t => { chain = chain.then(() => this.speak(t, lang)); });
      return chain;
    },
    speakWord(word) { return this.speak(word, 'en-US'); },
    speakZh(text) { return this.speak(text, 'zh-CN'); },

    /* ---- Toast ---- */
    toast(msg, emoji) {
      const wrap = document.getElementById('toastWrap');
      const t = this.el('div', { class: 'toast' }, (emoji ? emoji + ' ' : '') + msg);
      wrap.appendChild(t);
      setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 1800);
      setTimeout(() => t.remove(), 2300);
    },

    /* ---- 弹窗（成就/奖励）---- */
    modal({ emoji, title, body, actions }) {
      const mask = document.getElementById('modalMask');
      this.clear(mask);
      const m = this.el('div', { class: 'modal' }, [
        emoji ? this.el('div', { class: 'm-emoji' }, emoji) : null,
        title ? this.el('h2', {}, title) : null,
        body ? this.el('div', {}, body) : null,
        this.el('div', { class: 'm-actions' }, (actions || [{ label: '好嘞', cls: 'btn-pink', onClick: () => U.closeModal() }]).map(a =>
          this.el('button', { class: 'btn ' + (a.cls || 'btn-ghost'), onclick: () => { if (a.onClick) a.onClick(); } }, a.label)
        )),
      ]);
      mask.appendChild(m);
      mask.classList.add('show');
    },
    closeModal() { document.getElementById('modalMask').classList.remove('show'); },

    /* ---- 撒花 ---- */
    confetti(duration) {
      const cv = document.getElementById('confetti');
      const ctx = cv.getContext('2d');
      cv.width = window.innerWidth; cv.height = window.innerHeight;
      cv.style.display = 'block';
      const colors = ['#FF8FB8', '#5CC0FF', '#FFCE3A', '#5FD38A', '#B488F5'];
      const N = 140;
      const parts = [];
      for (let i = 0; i < N; i++) {
        parts.push({
          x: Math.random() * cv.width,
          y: -20 - Math.random() * cv.height,
          r: this.rand(6, 14),
          c: this.pick(colors),
          vy: this.rand(3, 7),
          vx: this.rand(-2, 2),
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          shape: Math.random() < 0.5 ? 'rect' : 'circle',
        });
      }
      const end = Date.now() + (duration || 1600);
      function frame() {
        ctx.clearRect(0, 0, cv.width, cv.height);
        let alive = false;
        parts.forEach(p => {
          p.y += p.vy; p.x += p.vx; p.rot += p.vr;
          if (p.y < cv.height + 20) alive = true;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
          if (p.shape === 'rect') ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
          else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, 7); ctx.fill(); }
          ctx.restore();
        });
        if (alive && Date.now() < end) requestAnimationFrame(frame);
        else { ctx.clearRect(0, 0, cv.width, cv.height); cv.style.display = 'none'; }
      }
      requestAnimationFrame(frame);
    },
  };

  window.U = U;
})();
