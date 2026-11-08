// ============================================================
// Escenarios 3D por capítulo + efectos (partículas, portales,
// fragmentos de memoria) construidos con Three.js.
// ============================================================
import * as THREE from 'three';

const _t0 = performance.now();

export function makeStars(scene) {
  const N = window.__ADO_QUALITY === 'low' ? 350 : (window.__ADO_QUALITY === 'medium' ? 650 : 1200);
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 90 + Math.random() * 160;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * 0.7 + 5;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xbfd4ff, size: 0.5, transparent: true, opacity: 0.8 });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
}

/** Sistema de partículas reutilizable (polvo, luciérnagas, lluvia de sinapsis) */
export function makeParticles(scene, { count = 200, color = 0xffffff, area = 30, height = 8, rise = false, speed = 0.4, size = 0.12 }) {
  const quality = window.__ADO_QUALITY || 'high';
  count = Math.max(12, Math.round(count * (quality === 'low' ? 0.18 : quality === 'medium' ? 0.45 : 1)));
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * area;
    pos[i * 3 + 1] = Math.random() * height;
    pos[i * 3 + 2] = (Math.random() - 0.5) * area;
    vel[i] = 0.2 + Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.userData.update = (dt) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      p[i * 3 + 1] += (rise ? 1 : -1) * vel[i] * speed * dt;
      p[i * 3] += Math.sin((performance.now() - _t0) / 1000 + i) * 0.003;
      if (p[i * 3 + 1] > height) p[i * 3 + 1] = 0;
      if (p[i * 3 + 1] < 0) p[i * 3 + 1] = height;
    }
    geo.attributes.position.needsUpdate = true;
  };
  scene.add(pts);
  return pts;
}

/** Fragmento de memoria coleccionable: cristal girando con halo */
export function makeFragment(scene, position, color = 0xffe28a) {
  const group = new THREE.Group();
  group.position.copy(position);

  const coreGeo = new THREE.OctahedronGeometry(0.35, 0);
  const coreMat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.4,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  const ringGeo = new THREE.TorusGeometry(0.65, 0.03, 8, 40);
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const halo = new THREE.PointLight(color, 8, 8);
  group.add(halo);

  const beamGeo = new THREE.CylinderGeometry(0.06, 0.25, 10, 8, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 5;
  group.add(beam);

  group.userData.baseY = position.y;
  group.userData.update = (dt, t) => {
    core.rotation.y += dt * 1.5;
    core.rotation.x += dt * 0.7;
    ring.rotation.z += dt * 0.8;
    group.position.y = group.userData.baseY + Math.sin(t * 2) * 0.15;
    const s = 1 + Math.sin(t * 3) * 0.08;
    core.scale.setScalar(s);
  };
  scene.add(group);
  return group;
}

/** Portal entre capítulos */
export function makePortal(scene, position, color = 0x6ea8ff) {
  const group = new THREE.Group();
  group.position.copy(position);

  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.12, 16, 60),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: 0.3 })
  );
  group.add(torus);

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
  );
  group.add(disc);

  const inner = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
  );
  group.add(inner);

  const light = new THREE.PointLight(color, 12, 12);
  group.add(light);

  group.userData.update = (dt, t) => {
    torus.rotation.z += dt * 0.6;
    disc.rotation.z -= dt * 0.3;
    inner.rotation.z += dt * 0.9;
    const s = 1 + Math.sin(t * 2.4) * 0.04;
    torus.scale.setScalar(s);
    light.intensity = 10 + Math.sin(t * 3) * 4;
  };
  scene.add(group);
  return group;
}

// ---------- helpers de construcción ----------

function emissiveBox(w, h, d, color, emi = 0.4) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: emi, roughness: 0.6 })
  );
}

/** Árbol de luz (Parque Meridiana) */
export function makeLightTree(scene, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.6, 5, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a3b52, roughness: 0.9 })
  );
  trunk.position.y = 2.5;
  g.add(trunk);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x7dff9e, emissive: 0x2fae5f, emissiveIntensity: 0.8, roughness: 0.4 });
  for (let i = 0; i < 6; i++) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random(), 10, 10), canopyMat);
    blob.position.set((Math.random() - 0.5) * 2.5, 5 + Math.random() * 1.6, (Math.random() - 0.5) * 2.5);
    g.add(blob);
  }
  const glow = window.__ADO_QUALITY === 'low' ? null : new THREE.PointLight(0x7dff9e, 15, 20);
  if (glow) { glow.position.y = 5.5; g.add(glow); }
  g.userData.update = (dt, t) => {
    if (glow) glow.intensity = 13 + Math.sin(t * 1.5) * 4;
    g.children.forEach((c, i) => { if (c.isMesh && i > 0 && i < 7) c.position.y += Math.sin(t + i) * 0.0015; });
  };
  scene.add(g);
  return g;
}

/** Torre del Olvido */
export function makeTower(scene) {
  const g = new THREE.Group();
  g.position.set(0, 0, -38);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 5, 34, 6),
    new THREE.MeshStandardMaterial({ color: 0x2a2440, emissive: 0xc07dff, emissiveIntensity: 0.25, roughness: 0.4, metalness: 0.5 })
  );
  body.position.y = 17;
  g.add(body);
  for (let i = 0; i < 8; i++) {
    const ringH = new THREE.Mesh(
      new THREE.TorusGeometry(4.6 - i * 0.18, 0.08, 8, 40),
      new THREE.MeshStandardMaterial({ color: 0xc07dff, emissive: 0xc07dff, emissiveIntensity: 1.2 })
    );
    ringH.rotation.x = Math.PI / 2;
    ringH.position.y = 3 + i * 4;
    g.add(ringH);
  }
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe9d9ff, emissiveIntensity: 1.6 })
  );
  orb.position.y = 36;
  g.add(orb);
  const light = new THREE.PointLight(0xc07dff, 30, 60);
  light.position.y = 36;
  g.add(light);
  g.userData.update = (dt, t) => {
    g.children.forEach((c, i) => { if (c.geometry?.type === 'TorusGeometry') c.rotation.z = t * (0.2 + i * 0.05); });
    orb.scale.setScalar(1 + Math.sin(t * 1.2) * 0.08);
    light.intensity = 26 + Math.sin(t * 2) * 8;
  };
  scene.add(g);
  return g;
}

/** Ciudad skyline de fondo (neón) */
export function makeCityBackdrop(scene, tint = 0x6ea8ff) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x141826, emissive: tint, emissiveIntensity: 0.12, roughness: 0.8 });
  const winMat = new THREE.MeshBasicMaterial({ color: tint });
  for (let i = 0; i < 40; i++) {
    const w = 2 + Math.random() * 4;
    const h = 6 + Math.random() * 22;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
    const ang = (i / 40) * Math.PI * 2;
    const rad = 55 + Math.random() * 25;
    b.position.set(Math.cos(ang) * rad, h / 2, Math.sin(ang) * rad);
    g.add(b);
    // ventanas brillantes
    const wins = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, h * 0.8, 0.05), winMat);
    wins.material = new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.15 + Math.random() * 0.2 });
    wins.position.copy(b.position);
    wins.position.z += w / 2 + 0.03;
    wins.lookAt(0, h / 2, 0);
    g.add(wins);
  }
  scene.add(g);
  return g;
}

/** Habitación genérica con paredes y suelo */
export function makeRoom(scene, { w = 16, d = 16, h = 5, floorColor = 0x1d2333, wallColor = 0x151a28 }) {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.85, metalness: 0.2 })
  );
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9, side: THREE.DoubleSide });
  const mkWall = (ww, x, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ww, h), wallMat);
    m.position.set(x, h / 2, z);
    m.rotation.y = ry;
    g.add(m);
    return m;
  };
  mkWall(w, 0, -d / 2, 0);
  mkWall(w, 0, d / 2, Math.PI);
  mkWall(d, -w / 2, 0, Math.PI / 2);
  mkWall(d, w / 2, 0, -Math.PI / 2);
  scene.add(g);
  return { group: g, floor };
}

/** Mesa / mobiliario simple */
export function makePropsLab(scene) {
  const props = [];
  const desk = emissiveBox(3, 0.9, 1.2, 0x2e4a7a, 0.15);
  desk.position.set(-4, 0.45, -4);
  scene.add(desk); props.push(desk);
  const screen = emissiveBox(1.6, 1, 0.08, 0x6ea8ff, 1.2);
  screen.position.set(-4, 1.6, -4.4);
  scene.add(screen); props.push(screen);
  for (let i = 0; i < 4; i++) {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 2.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a2f4a, emissive: 0x6ea8ff, emissiveIntensity: 0.5, transparent: true, opacity: 0.6 })
    );
    tank.position.set(4.5, 1.1, -5 + i * 2.2);
    scene.add(tank); props.push(tank);
    const l = new THREE.PointLight(0x6ea8ff, 4, 6);
    l.position.copy(tank.position);
    scene.add(l);
  }
  return props;
}

export function makePropsApartment(scene) {
  const sofa = emissiveBox(3, 0.9, 1.2, 0x7a4a5a, 0.1);
  sofa.position.set(-4, 0.45, -3);
  scene.add(sofa);
  const table = emissiveBox(1.6, 0.5, 1, 0x5a4a3a, 0.05);
  table.position.set(-4, 0.25, -0.5);
  scene.add(table);
  // reloj de arena gigante (símbolo del juego)
  const glass = new THREE.MeshStandardMaterial({ color: 0xffd1e8, emissive: 0xffb0d0, emissiveIntensity: 0.7, transparent: true, opacity: 0.8 });
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 20), glass);
  top.position.set(4, 2.2, -4); top.rotation.x = Math.PI;
  const bot = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 20), glass);
  bot.position.set(4, 1.0, -4);
  scene.add(top, bot);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 24), new THREE.MeshStandardMaterial({ color: 0xc9a86a, metalness: 0.8, roughness: 0.3 }));
  frame.position.set(4, 1.6, -4); frame.rotation.x = Math.PI / 2;
  scene.add(frame);
  const hourglass = { top, bot, frame, update(dt, t) { frame.rotation.z = t * 0.2; bot.rotation.y = t * 0.3; } };
  return [hourglass];
}
