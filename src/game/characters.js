// ============================================================
// Personajes 3D estilizados construidos con primitivas de Three.js
// + sistema de animación procedural (idle, caminar, gestos).
// ============================================================
import * as THREE from 'three';

function mkMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: opts.rough ?? 0.7, metalness: opts.metal ?? 0.1,
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: !!opts.opacity, opacity: opts.opacity ?? 1,
  });
}

function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function sph(r, mat, seg = 16) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat); }
function cyl(rt, rb, h, mat, seg = 12) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); }

/**
 * Crea un humanoide stylized.
 * palette: { skin, hair, shirt, pants, accent, hairStyle:'short'|'long' }
 */
export function createHumanoid(palette) {
  const root = new THREE.Group();
  const G = {};

  const skin = mkMat(palette.skin);
  const hair = mkMat(palette.hair, { rough: 0.9 });
  const shirt = mkMat(palette.shirt, { emissive: palette.accent, emissiveIntensity: 0.08 });
  const pants = mkMat(palette.pants);
  const accent = mkMat(palette.accent, { emissive: palette.accent, emissiveIntensity: 0.6 });

  // --- cadera: raíz de animación ---
  const hips = new THREE.Group();
  hips.position.y = 0.92;
  root.add(hips);
  G.hips = hips;

  // torso
  const torso = box(0.42, 0.55, 0.24, shirt);
  torso.position.y = 0.34;
  hips.add(torso);
  // detalle luminoso en el pecho (núcleo de memoria)
  const core = sph(0.05, accent);
  core.position.set(0, 0.42, 0.13);
  hips.add(core);
  G.core = core;

  // cuello + cabeza
  const neckHead = new THREE.Group();
  neckHead.position.y = 0.68;
  hips.add(neckHead);
  G.head = neckHead;

  const head = sph(0.17, skin, 20);
  head.scale.set(1, 1.12, 0.95);
  neckHead.add(head);

  // cabello
  if (palette.hairStyle === 'long') {
    const hairTop = sph(0.185, hair, 20);
    hairTop.scale.set(1, 0.95, 1);
    hairTop.position.y = 0.05;
    neckHead.add(hairTop);
    const hairBack = box(0.3, 0.5, 0.12, hair);
    hairBack.position.set(0, -0.18, -0.1);
    neckHead.add(hairBack);
    G.hairFlow = hairBack;
  } else {
    const hairTop = sph(0.18, hair, 20);
    hairTop.scale.set(1.02, 0.75, 1.02);
    hairTop.position.y = 0.08;
    neckHead.add(hairTop);
    const fringe = box(0.26, 0.08, 0.1, hair);
    fringe.position.set(0, 0.12, 0.13);
    neckHead.add(fringe);
  }

  // ojos (se iluminan al hablar)
  const eyeMat = mkMat(0x112233, { emissive: palette.accent, emissiveIntensity: 0.8 });
  const eyeL = sph(0.025, eyeMat, 8); eyeL.position.set(-0.06, 0.02, 0.155);
  const eyeR = sph(0.025, eyeMat, 8); eyeR.position.set(0.06, 0.02, 0.155);
  neckHead.add(eyeL, eyeR);
  G.eyes = [eyeL, eyeR]; G.eyeMat = eyeMat;

  // parpadeo: párpados
  const lidMat = mkMat(palette.skin);
  const lidL = box(0.06, 0.03, 0.02, lidMat); lidL.position.set(-0.06, 0.045, 0.16);
  const lidR = box(0.06, 0.03, 0.02, lidMat); lidR.position.set(0.06, 0.045, 0.16);
  neckHead.add(lidL, lidR);
  G.lids = [lidL, lidR];

  // brazos con pivotes en hombros
  function arm(side) {
    const g = new THREE.Group();
    g.position.set(0.26 * side, 0.55, 0);
    const upper = box(0.11, 0.3, 0.11, shirt);
    upper.position.y = -0.16;
    g.add(upper);
    const foreG = new THREE.Group();
    foreG.position.y = -0.31;
    const fore = box(0.09, 0.28, 0.09, skin);
    fore.position.y = -0.14;
    foreG.add(fore);
    g.add(foreG);
    hips.add(g);
    return { g, foreG };
  }
  G.armL = arm(-1); G.armR = arm(1);

  // piernas con pivotes en cadera
  function leg(side) {
    const g = new THREE.Group();
    g.position.set(0.12 * side, 0.02, 0);
    const up = box(0.14, 0.4, 0.14, pants);
    up.position.y = -0.21;
    g.add(up);
    const lowG = new THREE.Group();
    lowG.position.y = -0.42;
    const low = box(0.12, 0.4, 0.12, pants);
    low.position.y = -0.2;
    lowG.add(low);
    const foot = box(0.13, 0.07, 0.22, mkMat(0x222233));
    foot.position.set(0, -0.42, 0.04);
    lowG.add(foot);
    g.add(lowG);
    hips.add(g);
    return { g, lowG };
  }
  G.legL = leg(-1); G.legR = leg(1);

  root.userData.anim = { t: 0, blinkAt: 1.5, state: 'idle', gestureT: -1, gesture: null };

  // API de animación por frame
  root.userData.update = (dt, speed01 = 0) => {
    const a = root.userData.anim;
    a.t += dt;
    const t = a.t;

    // parpadeo aleatorio
    a.blinkAt -= dt;
    let blink = 0;
    if (a.blinkAt < 0.12 && a.blinkAt > 0) blink = 1;
    if (a.blinkAt <= 0) a.blinkAt = 1.5 + Math.random() * 3;
    G.lids.forEach((l) => (l.scale.y = blink ? 1.6 : 0.25));

    if (speed01 > 0.05) {
      // --- caminar ---
      const sw = Math.sin(t * 9) * 0.7 * Math.min(1, speed01 + 0.35);
      G.legL.g.rotation.x = sw;
      G.legR.g.rotation.x = -sw;
      G.legL.lowG.rotation.x = Math.max(0, -sw) * 0.9;
      G.legR.lowG.rotation.x = Math.max(0, sw) * 0.9;
      G.armL.g.rotation.x = -sw * 0.7;
      G.armR.g.rotation.x = sw * 0.7;
      G.armL.foreG.rotation.x = -0.3 - Math.max(0, sw) * 0.4;
      G.armR.foreG.rotation.x = -0.3 - Math.max(0, -sw) * 0.4;
      G.hips.position.y = 0.92 + Math.abs(Math.sin(t * 9)) * 0.03;
      G.hips.rotation.z = Math.sin(t * 9) * 0.04;
      G.head.rotation.y = Math.sin(t * 2.2) * 0.08;
    } else {
      // --- idle respirando ---
      G.legL.g.rotation.x *= 0.85; G.legR.g.rotation.x *= 0.85;
      G.legL.lowG.rotation.x *= 0.85; G.legR.lowG.rotation.x *= 0.85;
      G.armL.g.rotation.x *= 0.85; G.armR.g.rotation.x *= 0.85;
      G.armL.g.rotation.z = 0.08 + Math.sin(t * 1.4) * 0.03;
      G.armR.g.rotation.z = -0.08 - Math.sin(t * 1.4) * 0.03;
      G.armL.foreG.rotation.x = -0.15;
      G.armR.foreG.rotation.x = -0.15;
      G.hips.position.y = 0.92 + Math.sin(t * 1.8) * 0.012;
      G.hips.rotation.z = Math.sin(t * 0.9) * 0.015;
      G.head.rotation.x = Math.sin(t * 1.3) * 0.03;
      G.head.rotation.y = Math.sin(t * 0.6) * 0.12;
    }

    // gesto especial (saludar / ofrecer mano / corazón)
    if (a.gestureT >= 0) {
      a.gestureT += dt;
      const p = Math.min(1, a.gestureT / 0.6);
      const back = a.gestureT > 2 ? Math.max(0, 1 - (a.gestureT - 2) / 0.6) : 1;
      const k = p * back;
      if (a.gesture === 'wave') {
        G.armR.g.rotation.x = -2.4 * k;
        G.armR.g.rotation.z = -0.6 * k;
        G.armR.foreG.rotation.x = -0.6 + Math.sin(a.gestureT * 10) * 0.5 * k;
      } else if (a.gesture === 'offer') {
        G.armR.g.rotation.x = -1.35 * k;
        G.armR.foreG.rotation.x = -0.2 * k;
        G.armL.g.rotation.x = -1.35 * k;
        G.armL.foreG.rotation.x = -0.2 * k;
      } else if (a.gesture === 'heart') {
        G.armL.g.rotation.x = -1.1 * k; G.armL.g.rotation.z = 0.5 * k;
        G.armR.g.rotation.x = -1.1 * k; G.armR.g.rotation.z = -0.5 * k;
        G.armL.foreG.rotation.x = -1.2 * k; G.armR.foreG.rotation.x = -1.2 * k;
      }
      if (a.gestureT > 2.8) { a.gestureT = -1; a.gesture = null; }
    }

    // núcleo del pecho late
    G.core.scale.setScalar(1 + Math.sin(t * 3) * 0.15);

    if (G.hairFlow) G.hairFlow.rotation.x = Math.sin(t * 2) * 0.04 - speed01 * 0.1;
  };

  root.userData.gesture = (name) => {
    root.userData.anim.gesture = name;
    root.userData.anim.gestureT = 0;
  };
  root.userData.setTalking = (on) => {
    G.eyeMat.emissiveIntensity = on ? 1.6 : 0.8;
  };

  return root;
}

export function makeKai() {
  return createHumanoid({
    skin: 0xe8b98f, hair: 0x2b2b35, shirt: 0x2e4a7a, pants: 0x22262e,
    accent: 0x6ea8ff, hairStyle: 'short',
  });
}

export function makeL() {
  return createHumanoid({
    skin: 0xf2c9a5, hair: 0x7a3b5e, shirt: 0xd98bb0, pants: 0x3a3350,
    accent: 0xffd1e8, hairStyle: 'long',
  });
}

export function makeVega() {
  return createHumanoid({
    skin: 0xc98e6a, hair: 0x1a1a22, shirt: 0x9aa7b5, pants: 0x2f3540,
    accent: 0x7dffd4, hairStyle: 'long',
  });
}
