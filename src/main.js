// ============================================================
// ANTES DE OLVIDARTE — juego 3D narrativo
// Motor: Three.js + GSAP + Tween.js · Audio procedural WebAudio
// Main: escena, bucle, jugador, cámara cine, capítulos.
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { gsap } from 'gsap';

import { UI } from './ui/ui.js';
import { initAudio, resumeAudio, setMood, sfx, duckMusic } from './game/audio.js';
import { makeKai, makeL, makeVega } from './game/characters.js';
import {
  makeStars, makeParticles, makeFragment, makePortal,
  makeLightTree, makeTower, makeCityBackdrop, makeRoom,
  makePropsLab, makePropsApartment,
} from './game/world.js';
import { CHAPTERS, DIALOGUES, LORE_TEXTS, GAME_LINES, CREDITS } from './data/lore.js';

// ---------------- estado global ----------------
const app = document.getElementById('app');
const uiRoot = document.getElementById('ui-root');
const ui = new UI(uiRoot);

let scene, camera, renderer, composer = null, clock;
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || innerWidth < 800;
const LOW_END = IS_MOBILE && ((navigator.hardwareConcurrency || 4) <= 6 || (navigator.deviceMemory || 4) <= 4);
const QUALITY = LOW_END ? 'low' : (IS_MOBILE ? 'medium' : 'high');
window.__ADO_QUALITY = QUALITY;
let lastFrameAt = 0;
const FRAME_INTERVAL = LOW_END ? 1000 / 30 : 1000 / 60;
let player, playerL, lNpc, vegaNpc;
let updatables = [];         // objetos con userData.update(dt,t)
let fragments = [];          // coleccionables del capítulo
let portal = null;
let collected = 0, fragTotal = 0;
let mode = 'menu';           // menu | play | cutscene
let chapterIdx = 0;
let camTarget = new THREE.Vector3();
let camLook = new THREE.Vector3();
const keys = {};
let interactable = null;     // objeto bajo [E]
let stepAcc = 0;
let savePoint = 0;

try { savePoint = parseInt(localStorage.getItem('ado_save') || '0', 10); } catch (e) {}

// ---------------- setup básico ----------------
function setup() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070a14, 0.02);

  camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
  camera.position.set(0, 3, 8);

  renderer = new THREE.WebGLRenderer({ antialias: !LOW_END, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LOW_END ? 1 : (IS_MOBILE ? 1.25 : 1.75)));
  renderer.shadowMap.enabled = !IS_MOBILE;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.info.autoReset = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.className = 'webgl';
  app.appendChild(renderer.domElement);

  // post-proceso: bloom cinematográfico (desactivable con ?nobloom para equipos lentos)
  const canBloom = !LOW_END && !IS_MOBILE && !new URLSearchParams(location.search).has('nobloom');
  window._canBloom = canBloom;
  // El postprocesado se reserva para escritorio: en móviles render directo.
  if (canBloom) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.65, 0.45, 0.7));
    composer.addPass(new OutputPass());
  }

  clock = new THREE.Clock();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LOW_END ? 1 : (IS_MOBILE ? 1.25 : 1.75)));
    renderer.setSize(innerWidth, innerHeight);
    if (composer) composer.setSize(innerWidth, innerHeight);
  });

  // luces base (se ajustan por capítulo)
  const hemi = new THREE.HemisphereLight(0x8899cc, 0x11121a, 0.5);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xbfd4ff, 1.1);
  dir.position.set(6, 12, 6);
  dir.castShadow = !IS_MOBILE;
  dir.shadow.mapSize.set(IS_MOBILE ? 512 : 1024, IS_MOBILE ? 512 : 1024);
  dir.shadow.camera.left = -20; dir.shadow.camera.right = 20;
  dir.shadow.camera.top = 20; dir.shadow.camera.bottom = -20;
  scene.add(dir);
  window._dirLight = dir;

  player = makeKai();
  player.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(player);

  const stars = makeStars(scene);
  updatables.push({ update: (dt) => { stars.rotation.y += dt * 0.005; } });

  makeCityBackdrop(scene);
}

// ---------------- input ----------------
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space' && ui.isDialogueOpen()) { e.preventDefault(); ui.advanceDialogue(); }
  if (e.code === 'KeyE' && mode === 'play' && interactable) doInteract(interactable);
  if (e.code === 'Escape' && mode !== 'menu') backToMenu();
});
addEventListener('keyup', (e) => (keys[e.code] = false));
uiRoot.addEventListener('click', () => { if (ui.isDialogueOpen()) ui.advanceDialogue(); });
// Controles táctiles para Android/iOS; los botones solo aparecen en pantallas móviles.
uiRoot.querySelectorAll('[data-key]').forEach((button) => {
  const code = button.dataset.key;
  const release = (event) => { event.preventDefault(); keys[code] = false; button.classList.remove('pressed'); };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault(); keys[code] = true; button.classList.add('pressed');
    button.setPointerCapture?.(event.pointerId);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) => button.addEventListener(name, release));
});
uiRoot.querySelector('#touch-interact')?.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (mode === 'play' && interactable) doInteract(interactable);
});
addEventListener('pointerdown', () => { initAudio(); resumeAudio(); }, { once: true });

// ---------------- limpieza de escena por capítulo ----------------
function clearScene() {
  while (scene.children.length > 0) scene.remove(scene.children[0]);
  updatables = [];
  fragments = [];
  portal = null;
  interactable = null;
  collected = 0;
  // re-agregar elementos permanentes
  const hemi = new THREE.HemisphereLight(0x8899cc, 0x11121a, 0.5);
  scene.add(hemi);
  const dir = window._dirLight;
  dir.castShadow = !IS_MOBILE;
  scene.add(dir);
  const stars = makeStars(scene);
  updatables.push({ update: (dt) => { stars.rotation.y += dt * 0.005; } });
  scene.add(player);
}

// ---------------- construcción de capítulos ----------------
function buildChapter(idx) {
  clearScene();
  chapterIdx = idx;
  const ch = CHAPTERS[idx];
  ui.setChapterTag(`${ch.title.toUpperCase()} — ${ch.subtitle.toUpperCase()}`, ch.color);

  if (idx === 0) buildLab(ch);
  else if (idx === 1) buildApartment(ch);
  else if (idx === 2) buildPark(ch);
  else if (idx === 3) buildTowerLevel(ch);
  else buildRooftop(ch);
}

function groundFor(color, size = 40) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.25 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  return floor;
}

function addFragmentAt(x, y, z, color) {
  const f = makeFragment(scene, new THREE.Vector3(x, y, z), color);
  f.userData.interactLabel = 'Recoger recuerdo';
  f.userData.kind = 'fragment';
  fragments.push(f);
  // Los fragmentos se actualizan en su lista dedicada para evitar doble trabajo. 
}

function addPortalAt(x, y, z, color) {
  portal = makePortal(scene, new THREE.Vector3(x, y, z), color);
  portal.userData.interactLabel = 'Cruzar al siguiente recuerdo';
  portal.userData.kind = 'portal';
  // El portal se actualiza en su bloque dedicado del bucle principal. 
}

// ---- Prólogo: Laboratorio ----
function buildLab(ch) {
  scene.fog = new THREE.FogExp2(0x070b16, 0.02);
  makeRoom(scene, { w: 20, d: 20, h: 6, floorColor: 0x1a2236, wallColor: 0x121828 });
  makePropsLab(scene);
  makeParticles(scene, { count: 120, color: 0x6ea8ff, area: 18, height: 5, rise: true, speed: 0.3 });
  setMood('melancholy');
  addFragmentAt(0, 1.2, -6, 0xffe28a);
  addFragmentAt(-6, 1.2, 3, 0xffe28a);
  addFragmentAt(6, 1.2, 4, 0xffe28a);
  fragTotal = 3;
  addPortalAt(0, 1.8, -9, ch.color);
  player.position.set(0, 0, 6);
  player.rotation.y = Math.PI;
  vegaNpc = makeVega();
  vegaNpc.position.set(-6.5, 0, -6);
  vegaNpc.rotation.y = Math.PI / 2.6;
  scene.add(vegaNpc);
  updatables.push(vegaNpc);
}

// ---- Capítulo I: apartamento ----
function buildApartment(ch) {
  scene.fog = new THREE.FogExp2(0x120d10, 0.025);
  makeRoom(scene, { w: 18, d: 18, h: 5, floorColor: 0x2a2030, wallColor: 0x241a26 });
  makePropsApartment(scene).forEach((h) => updatables.push(h));
  window._dirLight.color.set(0xffc9a0);
  setMood('melancholy');
  lNpc = makeL();
  lNpc.position.set(2, 0, -2);
  lNpc.rotation.y = Math.PI;
  scene.add(lNpc);
  updatables.push(lNpc);
  addFragmentAt(-6, 1.2, 5, 0xffd1e8);
  addFragmentAt(7, 1.2, 2, 0xffd1e8);
  addFragmentAt(0, 1.2, -7, 0xffd1e8);
  fragTotal = 3;
  addPortalAt(8, 1.8, -7, ch.color);
  player.position.set(-4, 0, 6);
  player.rotation.y = 0;
}

// ---- Capítulo II: parque ----
function buildPark(ch) {
  scene.fog = new THREE.FogExp2(0x0a1410, 0.016);
  groundFor(0x14261c, 60);
  makeLightTree(scene, 0, -6);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    makeLightTree(scene, Math.cos(ang) * 16, Math.sin(ang) * 16);
  }
  makeParticles(scene, { count: 220, color: 0xffe28a, area: 40, height: 7, rise: true, speed: 0.5 });
  window._dirLight.color.set(0xa0ffc9);
  setMood('hopeful');
  lNpc = makeL();
  lNpc.position.set(2.5, 0, -3);
  lNpc.rotation.y = Math.PI * 0.9;
  scene.add(lNpc);
  updatables.push(lNpc);
  addFragmentAt(-8, 1.2, 6, 0x7dff9e);
  addFragmentAt(9, 1.2, -2, 0x7dff9e);
  addFragmentAt(-3, 1.2, -12, 0x7dff9e);
  fragTotal = 3;
  addPortalAt(0, 1.8, 12, ch.color);
  player.position.set(0, 0, 8);
  player.rotation.y = Math.PI;
}

// ---- Capítulo III: torre ----
function buildTowerLevel(ch) {
  scene.fog = new THREE.FogExp2(0x0d0818, 0.014);
  groundFor(0x1c1430, 70);
  makeTower(scene);
  makeCityBackdrop(scene, 0xc07dff);
  makeParticles(scene, { count: 260, color: 0xc07dff, area: 50, height: 20, rise: true, speed: 1.2 });
  window._dirLight.color.set(0xd9b8ff);
  setMood('tension');
  vegaNpc = makeVega();
  vegaNpc.position.set(-4, 0, -12);
  vegaNpc.rotation.y = Math.PI / 2.2;
  scene.add(vegaNpc);
  updatables.push(vegaNpc);
  lNpc = makeL();
  lNpc.position.set(4, 0, -12);
  lNpc.rotation.y = -Math.PI / 2.2;
  scene.add(lNpc);
  updatables.push(lNpc);
  addFragmentAt(-10, 1.2, 4, 0xe9d9ff);
  addFragmentAt(10, 1.2, 4, 0xe9d9ff);
  addFragmentAt(0, 1.2, 10, 0xe9d9ff);
  fragTotal = 3;
  addPortalAt(0, 1.8, -18, ch.color);
  player.position.set(0, 0, 14);
  player.rotation.y = Math.PI;
}

// ---- Epílogo: azotea amanecer ----
function buildRooftop(ch) {
  scene.fog = new THREE.FogExp2(0x2a1a20, 0.012);
  groundFor(0x33243a, 40);
  // sol naciente
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(4, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd76e })
  );
  sun.position.set(0, 6, -60);
  scene.add(sun);
  const sunLight = new THREE.PointLight(0xffd76e, 60, 120);
  sunLight.position.copy(sun.position);
  scene.add(sunLight);
  gsap.to(sun.position, { y: 18, duration: 40, ease: 'sine.inOut' });
  gsap.to(sunLight.position, { y: 20, duration: 40, ease: 'sine.inOut' });
  makeCityBackdrop(scene, 0xffb36e);
  makeParticles(scene, { count: 150, color: 0xffd1e8, area: 30, height: 8, rise: true, speed: 0.35 });
  window._dirLight.color.set(0xffdcb0);
  setMood('hopeful');
  lNpc = makeL();
  lNpc.position.set(2.2, 0, -4);
  lNpc.rotation.y = Math.PI;
  scene.add(lNpc);
  updatables.push(lNpc);
  player.position.set(0, 0, 2);
  player.rotation.y = Math.PI;
  fragTotal = 0;
  // sin portal: la escena termina en créditos tras el diálogo final
}

// ---------------- interacción ----------------
function doInteract(obj) {
  const kind = obj.userData.kind;
  if (kind === 'fragment') {
    collectFragment(obj);
  } else if (kind === 'portal') {
    nextChapter();
  }
}

function collectFragment(f) {
  const i = fragments.indexOf(f);
  if (i >= 0) fragments.splice(i, 1);
  updatables.splice(updatables.indexOf(f), 1);
  scene.remove(f);
  collected++;
  sfx.collect();
  ui.setFragments(collected, fragTotal);
  ui.toast(GAME_LINES.collected(collected, fragTotal));
  // destello ascendente
  const spark = new THREE.PointLight(0xffe28a, 20, 10);
  spark.position.copy(player.position).add(new THREE.Vector3(0, 1.5, 0));
  scene.add(spark);
  gsap.to(spark, {
    intensity: 0, duration: 1, onComplete: () => scene.remove(spark),
  });
  if (player.userData.gesture) player.userData.gesture('offer');
  if (collected === fragTotal) {
    ui.hint(GAME_LINES.allDone);
    if (lNpc?.userData?.gesture) lNpc.userData.gesture('heart');
    sfx.chapter();
  }
}

function nextChapter() {
  sfx.portal();
  mode = 'cutscene';
  ui.fadeOut(1).then(() => {
    const next = chapterIdx + 1;
    if (next >= CHAPTERS.length) { showCredits(); return; }
    try { localStorage.setItem('ado_save', String(next)); } catch (e) {}
    enterChapter(next);
  });
}

// ---------------- flujo de capítulos ----------------
function enterChapter(idx) {
  buildChapter(idx);
  const ch = CHAPTERS[idx];
  ui.showHud(true);
  ui.setFragments(0, fragTotal);
  ui.fadeIn(1.2);
  mode = 'cutscene';
  cinematicIntro(idx, () => {
    ui.chapterCard(ch, () => startPlayPhase(idx));
  });
}

/** Secuencia de apertura de cada capítulo: movimientos de cámara + diálogo */
function cinematicIntro(idx, done) {
  const dlgKey = ['intro', 'cap1', 'cap2', 'cap3', 'final'][idx];
  const lines = DIALOGUES[dlgKey];
  // cámara orbital inicial
  const startPos = camera.position.clone();
  const t = { a: 0 };
  const focus = new THREE.Vector3().copy(player.position).add(new THREE.Vector3(0, 1.2, 0));
  gsap.to(t, {
    a: Math.PI * 0.6,
    duration: 4,
    ease: 'power2.inOut',
    onUpdate: () => {
      const r = 9;
      camera.position.set(focus.x + Math.sin(t.a) * r, 3.5 + Math.sin(t.a) * 1.5, focus.z + Math.cos(t.a) * r);
      camera.lookAt(focus);
    },
    onComplete: () => {
      ui.playDialogue(lines, {
        onLine: (line) => {
          if (lNpc) lNpc.userData.setTalking(line.s === 'L');
          if (vegaNpc) vegaNpc.userData.setTalking(line.s === 'DR_VEGA');
          player.userData.setTalking(line.s === 'KAI');
          if (line.s === 'L' && lNpc && Math.random() < 0.3) lNpc.userData.gesture('wave');
          if (line.s === 'KAI' && Math.random() < 0.25) player.userData.gesture('wave');
        },
        onEnd: () => {
          if (lNpc) lNpc.userData.setTalking(false);
          if (vegaNpc) vegaNpc.userData.setTalking(false);
          player.userData.setTalking(false);
          done();
        },
      });
    },
  });
}

function startPlayPhase(idx) {
  mode = 'play';
  duckMusic(false);
  ui.hint(idx === 4 ? '' : GAME_LINES.hintStart);
  if (idx === 4) finaleScene();
}

/** Animación final: Kai y L se acercan, corazón, fundido a créditos */
function finaleScene() {
  mode = 'cutscene';
  const target = new THREE.Vector3().copy(player.position).lerp(lNpc.position, 0.5);
  gsap.to(player.position, { x: target.x - 0.7, duration: 3, ease: 'power2.inOut' });
  gsap.to(lNpc.position, { x: target.x + 0.7, duration: 3, ease: 'power2.inOut' });
  gsap.to(camera.position, { y: 2.2, z: player.position.z + 6, duration: 3, ease: 'power2.inOut' });
  setTimeout(() => {
    player.userData.gesture('heart');
    lNpc.userData.gesture('heart');
    sfx.heart();
  }, 3000);
  setTimeout(() => showCredits(), 7000);
}

function showCredits() {
  mode = 'menu';
  ui.showHud(false);
  ui.letterbox(true);
  const html = CREDITS.map(([a, b]) => `<div class="cr-line"><div class="a">${a}</div><div class="b">${b}</div></div>`).join('');
  ui.showPanel('credits', html);
  sfx.chapter();
  setMood('hopeful');
  ui.$('.cr-back').onclick = () => {
    ui.hidePanel('credits');
    ui.letterbox(false);
    backToMenu();
  };
}

function backToMenu() {
  mode = 'menu';
  ui.showHud(false);
  ui.hint('');
  ui.prompt('');
  ui.showMenu();
  ui.fadeIn(0.8);
  setMenuCamera();
}

// ---------------- menú: cámara orbitando la torre en miniatura ----------------
let kaiMenu = null, lMenu = null;
function buildMenuScene() {
  clearScene();
  groundFor(0x10182c, 60);
  makeTower(scene);
  makeLightTree(scene, -6, 2);
  makeCityBackdrop(scene, 0x6ea8ff);
  makeParticles(scene, { count: 200, color: 0x8fb5ff, area: 40, height: 14, rise: true, speed: 0.5 });
  kaiMenu = makeKai();
  kaiMenu.position.set(0, 0, 4);
  scene.add(kaiMenu);
  updatables.push(kaiMenu);
  lMenu = makeL();
  lMenu.position.set(1.6, 0, 3.2);
  lMenu.rotation.y = -0.5;
  scene.add(lMenu);
  updatables.push(lMenu);
  setMood('melancholy');
}

let menuAngle = 0.4;
function setMenuCamera() { menuAngle = 0.4; }

// ---------------- jugador: movimiento tercera persona ----------------
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();

function updatePlayer(dt) {
  if (mode !== 'play') {
    player.userData.update(dt, 0);
    return;
  }
  _fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
  _fwd.y = 0; _fwd.normalize();
  _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
  _right.y = 0; _right.normalize();

  _move.set(0, 0, 0);
  if (keys['KeyW']) _move.add(_fwd);
  if (keys['KeyS']) _move.sub(_fwd);
  if (keys['KeyD']) _move.add(_right);
  if (keys['KeyA']) _move.sub(_right);

  const run = keys['ShiftLeft'] || keys['ShiftRight'];
  const speed = run ? 6.2 : 3.4;
  const len = _move.length();
  if (len > 0.01) {
    _move.normalize();
    player.position.addScaledVector(_move, speed * dt);
    // rotación suave hacia la dirección
    const targetRot = Math.atan2(_move.x, _move.z);
    let d = targetRot - player.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    player.rotation.y += d * Math.min(1, dt * 12);
    // sonido de pasos
    stepAcc += dt * (run ? 1.6 : 1);
    if (stepAcc > 0.45) { stepAcc = 0; sfx.step(); }
    // limitar a la arena
    player.position.x = THREE.MathUtils.clamp(player.position.x, -28, 28);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -28, 28);
    player.userData.update(dt, run ? 1.4 : 0.8);
  } else {
    player.userData.update(dt, 0);
  }

  // ¿cerca de algo interactuable?
  interactable = null;
  let bestDist = 2.4;
  for (const f of fragments) {
    const d = f.position.distanceTo(player.position);
    if (d < bestDist) { bestDist = d; interactable = f; }
  }
  if (portal && collected === fragTotal) {
    const d = portal.position.distanceTo(player.position);
    if (d < 3) interactable = portal;
  }
  ui.prompt(interactable ? interactable.userData.interactLabel : null);
}

// ---------------- cámara tercera persona con suavizado ----------------
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _behind = new THREE.Vector3(0, 2.6, 5.2);
const _upAxis = new THREE.Vector3(0, 1, 0);
const _npcLook = new THREE.Vector3();
const _playerLookOffset = new THREE.Vector3(0, 1.4, 0);

function updateCamera(dt) {
  if (mode !== 'play') return;
  // detrás del hombro del personaje
  _behind.set(0, 2.6, 5.2).applyAxisAngle(_upAxis, player.rotation.y);
  _camGoal.copy(player.position).add(_behind);
  _camGoal.y = 2.6;
  camera.position.lerp(_camGoal, Math.min(1, dt * 4));
  _lookGoal.copy(player.position).add(_playerLookOffset);
  camLook.lerp(_lookGoal, Math.min(1, dt * 6));
  camera.lookAt(camLook);
}

// ---------------- bucle principal ----------------
let elapsed = 0;
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  if (document.hidden) { lastFrameAt = now; return; }
  if (now - lastFrameAt < FRAME_INTERVAL) return;
  lastFrameAt = now;
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  updatables.forEach((u) => u.userData?.update?.(dt, elapsed));
  fragments.forEach((f) => f.userData.update(dt, elapsed));
  if (portal) portal.userData.update(dt, elapsed);

  updatePlayer(dt);
  if (mode === 'menu') {
    menuAngle += dt * 0.075;
    camera.position.set(Math.sin(menuAngle) * 13, 4.5 + Math.sin(menuAngle * 2) * 1.2, Math.cos(menuAngle) * 13);
    camera.lookAt(0, 2.5, 0);
  } else updateCamera(dt);

  // NPC miran al jugador cuando está cerca
  [lNpc, vegaNpc].forEach((n) => {
    if (n && mode === 'play') {
      const look = _npcLook.subVectors(player.position, n.position);
      if (look.length() < 8) {
        const targetRot = Math.atan2(look.x, look.z);
        n.rotation.y += (targetRot - n.rotation.y) * Math.min(1, dt * 3);
      }
    }
  });

  if (composer) composer.render();
  else renderer.render(scene, camera);
}

// ---------------- arranque ----------------
function boot() {
  setup();
  buildMenuScene();
  document.getElementById('loading-note')?.remove();

  // botones del menú
  ui.root.querySelector('[data-act="new"]').addEventListener('click', () => {
    initAudio(); resumeAudio();
    ui.hideMenu();
    ui.fadeOut(0.8).then(() => enterChapter(0));
  });
  ui.root.querySelector('[data-act="continue"]').addEventListener('click', () => {
    initAudio(); resumeAudio();
    ui.hideMenu();
    ui.fadeOut(0.8).then(() => enterChapter(Math.min(savePoint, CHAPTERS.length - 1)));
  });
  ui.root.querySelector('[data-act="lore"]').addEventListener('click', () => {
    initAudio(); resumeAudio();
    const body = `
      <p>${LORE_TEXTS.world.replaceAll('\n', '<br>')}</p>
      <p>${LORE_TEXTS.disease.replaceAll('\n', '<br>')}</p>
      <p class="quote">${LORE_TEXTS.promise.replaceAll('\n', '<br>')}</p>`;
    ui.showPanel('lore-panel', body);
    ui.$('#lore-panel .back').onclick = () => ui.hidePanel('lore-panel');
  });
  ui.root.querySelector('[data-act="credits"]').addEventListener('click', () => {
    initAudio(); resumeAudio();
    const html = CREDITS.map(([a, b]) => `<div class="cr-line"><div class="a">${a}</div><div class="b">${b}</div></div>`).join('');
    ui.showPanel('credits', html);
    ui.$('#credits .back').onclick = () => ui.hidePanel('credits');
  });

  ui.showMenu();
  ui.fadeIn(1.5);
  setMenuCamera();
  loop();
}

boot();
