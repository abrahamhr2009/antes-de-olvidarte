// ============================================================
// Motor de audio procedural (sin assets externos):
// música ambiental generativa + efectos sintetizados.
// ============================================================

let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let musicTimer = null;
let padVoices = [];

const SCALES = {
  melancholy: [220, 261.63, 293.66, 329.63, 392, 440, 523.25], // Am pentatónica-ish
  hopeful:    [261.63, 293.66, 349.23, 392, 440, 523.25, 587.33],
  tension:    [220, 233.08, 293.66, 311.13, 369.99, 440, 466.16],
};

export function initAudio() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.9;
  masterGain.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = 0.0;
  musicGain.connect(masterGain);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.5;
  sfxGain.connect(masterGain);
}

export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function env(node, t0, attack, decay, peak = 0.3) {
  node.gain.cancelScheduledValues(t0);
  node.gain.setValueAtTime(0.0001, t0);
  node.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  node.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

// ---------- SFX ----------

export function playTone(freq, dur = 0.3, type = 'sine', vol = 0.2, dest = null) {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  env(g, t0, 0.01, dur, vol);
  osc.connect(g).connect(dest || sfxGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.1);
}

export const sfx = {
  uiClick()   { playTone(660, 0.08, 'triangle', 0.15); },
  uiHover()   { playTone(440, 0.05, 'sine', 0.06); },
  type()      { playTone(1200 + Math.random() * 400, 0.02, 'square', 0.02); },
  step()      { playTone(90 + Math.random() * 20, 0.06, 'triangle', 0.05); },
  collect() {
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.35, 'sine', 0.18), i * 90));
  },
  chapter() {
    if (!ctx) return;
    [392, 523.25, 659.25].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.8, 'triangle', 0.15), i * 160));
  },
  portal() {
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t0);
    osc.frequency.exponentialRampToValueAtTime(900, t0 + 1.2);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
    osc.connect(g).connect(sfxGain);
    osc.start(t0); osc.stop(t0 + 1.5);
  },
  heart() {
    playTone(60, 0.25, 'sine', 0.3);
    setTimeout(() => playTone(55, 0.3, 'sine', 0.25), 220);
  },
};

// ---------- Música generativa ----------

function startPad(mood) {
  stopMusic();
  if (!ctx) return;
  const base = mood === 'hopeful' ? 130.81 : mood === 'tension' ? 110 : 110;
  const intervals = [1, 1.5, 2, 2.66];
  intervals.forEach((mul, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    osc.type = i % 2 ? 'sine' : 'triangle';
    osc.frequency.value = base * mul;
    lfo.frequency.value = 0.07 + i * 0.03;
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain).connect(g.gain);
    g.gain.value = 0.03;
    osc.connect(g).connect(musicGain);
    osc.start(); lfo.start();
    padVoices.push(osc, lfo);
  });
  fadeMusic(0.8, 3);

  // Arpegios lentos sobre la escala
  const scale = SCALES[mood] || SCALES.melancholy;
  let step = 0;
  musicTimer = setInterval(() => {
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const note = scale[Math.floor(Math.random() * scale.length)];
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = note * (Math.random() < 0.3 ? 2 : 1);
    env(g, t0, 0.05, 1.8, 0.07);
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.45;
    const fb = ctx.createGain(); fb.gain.value = 0.35;
    osc.connect(g).connect(musicGain);
    g.connect(delay).connect(fb).connect(delay);
    delay.connect(musicGain);
    osc.start(t0); osc.stop(t0 + 2.2);
    step++;
  }, 1400);
}

function fadeMusic(vol, time) {
  if (!ctx || !musicGain) return;
  const t0 = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(t0);
  musicGain.gain.setValueAtTime(musicGain.gain.value, t0);
  musicGain.gain.linearRampToValueAtTime(vol, t0 + time);
}

export function setMood(mood) {
  if (!ctx) return;
  stopMusic();
  startPad(mood);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  padVoices.forEach((n) => { try { n.stop(); } catch (e) {} });
  padVoices = [];
}

export function duckMusic(on) { fadeMusic(on ? 0.25 : 0.8, 1); }
