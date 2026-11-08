// ============================================================
// UI cinematográfica: menús, diálogos con typewriter, letterbox,
// tarjetas de capítulo, viñetas, transiciones y créditos.
// Todo en DOM + CSS sobre el canvas 3D.
// ============================================================
import { gsap } from 'gsap';
import { sfx } from '../game/audio.js';

const SPEAKERS = {
  KAI:      { name: 'Kai',          color: '#6ea8ff' },
  L:        { name: 'L',            color: '#ff8ec4' },
  DR_VEGA:  { name: 'Dra. Vega',    color: '#7dffd4' },
  NARRADOR: { name: '',             color: '#cfd6e4' },
  SYSTEM:   { name: 'MNEMOSYS',     color: '#c07dff' },
};

export class UI {
  constructor(root) {
    this.root = root;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div id="letterbox-top" class="lb"></div>
      <div id="letterbox-bot" class="lb"></div>
      <div id="vignette"></div>
      <div id="touch-controls" aria-label="Controles táctiles">
        <div class="touch-pad">
          <button data-key="KeyW" class="touch-btn touch-up" aria-label="Avanzar">▲</button>
          <button data-key="KeyA" class="touch-btn touch-left" aria-label="Izquierda">◀</button>
          <button data-key="KeyS" class="touch-btn touch-down" aria-label="Retroceder">▼</button>
          <button data-key="KeyD" class="touch-btn touch-right" aria-label="Derecha">▶</button>
        </div>
        <button id="touch-interact" class="touch-btn touch-action">INTERACTUAR</button>
      </div>

      <!-- HUD superior -->
      <div id="hud" class="hidden">
        <div id="chapter-tag"></div>
        <div id="frag-counter"><span class="orb"></span><span id="frag-text">0 / 3</span></div>
      </div>
      <div id="hint" class="hidden"></div>
      <div id="interact-prompt" class="hidden">[ E ] <span id="interact-label"></span></div>

      <!-- Tarjeta de capítulo -->
      <div id="chapter-card" class="overlay hidden">
        <div class="cc-num"></div>
        <div class="cc-title"></div>
        <div class="cc-sub"></div>
        <div class="cc-loc"></div>
      </div>

      <!-- Diálogo -->
      <div id="dialogue" class="hidden">
        <div id="dlg-box">
          <div id="dlg-speaker"></div>
          <div id="dlg-text"></div>
          <div id="dlg-next">ESPACIO / CLIC ▸</div>
        </div>
      </div>

      <!-- Fade a negro -->
      <div id="fade" class="overlay-black"></div>

      <!-- Menú principal -->
      <div id="menu" class="overlay hidden">
        <canvas id="menu-bg"></canvas>
        <div class="menu-inner">
          <div class="game-logo">
            <h1 id="logo-t1">ANTES DE</h1>
            <h1 id="logo-t2">OLVIDARTE</h1>
            <p class="tagline">un juego 3D sobre la memoria, el tiempo y L</p>
          </div>
          <nav class="menu-btns">
            <button data-act="new" class="mbtn">Nueva partida</button>
            <button data-act="continue" class="mbtn">Continuar</button>
            <button data-act="lore" class="mbtn">El Lore</button>
            <button data-act="credits" class="mbtn">Créditos</button>
          </nav>
          <div class="menu-foot">Three.js · Veraluna 2147 · para <b>L</b> ❤</div>
        </div>
      </div>

      <!-- Panel lore -->
      <div id="lore-panel" class="overlay hidden">
        <div class="panel-box">
          <h2>ARCHIVO MNÉMICO — VERALUNA</h2>
          <div class="lore-body"></div>
          <button class="mbtn back">Volver</button>
        </div>
      </div>

      <!-- Créditos -->
      <div id="credits" class="overlay hidden">
        <div class="credit-scroll"></div>
        <button class="mbtn back cr-back">Volver</button>
      </div>
    `;

    this.el = (id) => this.root.querySelector('#' + id);
    this.$ = (sel) => this.root.querySelector(sel);

    // animar logo con letras
    this.splitLogo();
    this.bindMenuSfx();
  }

  splitLogo() {
    ['#logo-t1', '#logo-t2'].forEach((sel, li) => {
      const h = this.$(sel);
      const text = h.textContent;
      h.textContent = '';
      [...text].forEach((ch, i) => {
        const s = document.createElement('span');
        s.textContent = ch === ' ' ? '\u00A0' : ch;
        s.style.display = 'inline-block';
        h.appendChild(s);
        gsap.fromTo(s,
          { y: 40, opacity: 0, rotateX: -90 },
          { y: 0, opacity: 1, rotateX: 0, duration: 0.9, delay: 0.15 * i + li * 0.4, ease: 'back.out(1.6)' });
      });
    });
  }

  bindMenuSfx() {
    this.root.querySelectorAll('.mbtn').forEach((b) => {
      b.addEventListener('mouseenter', () => sfx.uiHover());
      b.addEventListener('click', () => sfx.uiClick());
    });
  }

  // ---------- fades ----------
  fadeOut(dur = 0.8) {
    return gsap.to(this.el('fade'), { opacity: 1, duration: dur, ease: 'power2.inOut' });
  }
  fadeIn(dur = 0.8) {
    return gsap.to(this.el('fade'), { opacity: 0, duration: dur, ease: 'power2.inOut' });
  }

  // ---------- letterbox ----------
  letterbox(on) {
    const h = on ? '12vh' : '0vh';
    gsap.to([this.el('letterbox-top'), this.el('letterbox-bot')], { height: h, duration: 0.9, ease: 'power3.out' });
  }

  shake(intensity = 1) {
    gsap.fromTo(this.root, { x: intensity * 6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' });
  }

  // ---------- menú ----------
  showMenu() {
    this.el('menu').classList.remove('hidden');
    gsap.fromTo('#menu .menu-inner', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 });
  }
  hideMenu() {
    gsap.to('#menu', {
      opacity: 0, duration: 0.6, onComplete: () => {
        this.el('menu').classList.add('hidden');
        gsap.set('#menu', { opacity: 1 });
      },
    });
  }

  showPanel(id, html) {
    const p = this.el(id);
    if (html) p.querySelector('.lore-body, .credit-scroll').innerHTML = html;
    p.classList.remove('hidden');
    gsap.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.6 });
  }
  hidePanel(id) {
    const p = this.el(id);
    gsap.to(p, { opacity: 0, duration: 0.4, onComplete: () => p.classList.add('hidden') });
  }

  // ---------- tarjeta de capítulo ----------
  chapterCard(ch, done) {
    const c = this.el('chapter-card');
    c.querySelector('.cc-num').textContent = ch.title.toUpperCase();
    c.querySelector('.cc-title').textContent = ch.subtitle;
    c.querySelector('.cc-sub').textContent = '';
    c.querySelector('.cc-loc').textContent = ch.location;
    c.querySelector('.cc-title').style.color = ch.color;
    c.classList.remove('hidden');
    this.letterbox(true);
    const tl = gsap.timeline({
      onComplete: () => {
        c.classList.add('hidden');
        this.letterbox(false);
        if (done) done();
      },
    });
    tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 1 })
      .fromTo(c.querySelector('.cc-num'), { letterSpacing: '20px', opacity: 0 }, { letterSpacing: '6px', opacity: 1, duration: 1.2, ease: 'power2.out' }, 0)
      .fromTo(c.querySelector('.cc-title'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.4)
      .fromTo(c.querySelector('.cc-loc'), { opacity: 0 }, { opacity: 0.8, duration: 0.9 }, 0.8)
      .to(c, { opacity: 0, duration: 1 }, '+=1.6');
    return tl;
  }

  // ---------- HUD ----------
  setChapterTag(txt, color) {
    const t = this.el('chapter-tag');
    t.textContent = txt;
    t.style.color = color || '#fff';
  }
  showHud(show) { this.el('hud').classList.toggle('hidden', !show); }
  setFragments(n, total) { this.el('frag-text').textContent = `${n} / ${total}`; }

  hint(txt) {
    const h = this.el('hint');
    if (!txt) { h.classList.add('hidden'); return; }
    h.textContent = txt;
    h.classList.remove('hidden');
    gsap.fromTo(h, { opacity: 0, y: 10 }, { opacity: 0.9, y: 0, duration: 0.6 });
  }

  prompt(txt) {
    const p = this.el('interact-prompt');
    if (!txt) { p.classList.add('hidden'); return; }
    p.classList.remove('hidden');
    this.el('interact-label').textContent = txt;
  }

  toast(txt, color = '#ffe28a') {
    let t = this.$('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      this.root.appendChild(t);
    }
    t.textContent = txt;
    t.style.color = color;
    gsap.killTweensOf(t);
    gsap.fromTo(t, { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4 });
    gsap.to(t, { opacity: 0, y: -14, duration: 0.6, delay: 1.8 });
  }

  // ---------- diálogo cinematico ----------
  playDialogue(lines, { onLine, onEnd } = {}) {
    this._dlgLines = lines;
    this._dlgIdx = 0;
    this._onLine = onLine;
    this._onEnd = onEnd;
    this.el('dialogue').classList.remove('hidden');
    this.letterbox(true);
    gsap.fromTo('#dlg-box', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
    this._showCurrentLine();
  }

  _showCurrentLine() {
    const line = this._dlgLines[this._dlgIdx];
    const sp = SPEAKERS[line.s] || SPEAKERS.NARRADOR;
    const speakerEl = this.el('dlg-speaker');
    speakerEl.textContent = sp.name;
    speakerEl.style.color = sp.color;
    const box = this.$('#dlg-box');
    box.style.borderColor = sp.color + '55';
    box.classList.toggle('narrator', line.s === 'NARRADOR');
    box.classList.toggle('system', line.s === 'SYSTEM');

    const textEl = this.el('dlg-text');
    textEl.textContent = '';
    this._full = line.t;
    this._typed = 0;
    this._typing = true;
    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      if (this._typed >= this._full.length) {
        clearInterval(this._typeTimer);
        this._typing = false;
        return;
      }
      const ch = this._full[this._typed++];
      textEl.textContent += ch;
      if (ch !== ' ' && this._typed % 2 === 0) sfx.type();
    }, 24);
    if (this._onLine) this._onLine(line);
  }

  advanceDialogue() {
    if (this._typing) { // skip typing
      clearInterval(this._typeTimer);
      this.el('dlg-text').textContent = this._full;
      this._typing = false;
      return;
    }
    this._dlgIdx++;
    if (this._dlgIdx >= this._dlgLines.length) {
      clearInterval(this._typeTimer);
      gsap.to('#dlg-box', {
        y: 60, opacity: 0, duration: 0.4, onComplete: () => {
          this.el('dialogue').classList.add('hidden');
          this.letterbox(false);
          if (this._onEnd) this._onEnd();
        },
      });
      return;
    }
    this._showCurrentLine();
  }

  isDialogueOpen() { return !this.el('dialogue').classList.contains('hidden'); }
}
