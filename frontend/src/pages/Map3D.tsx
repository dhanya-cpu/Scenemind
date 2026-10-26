import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './Map3D.css';

// ─── Room objects ──────────────────────────────────────────────────────────
const ROOM_OBJECTS = [
  {
    id: 'desk',      label: 'Desk',         color: 0x8b5e3c,
    position: { x: -2,   y: 0.4,  z: 1    }, size: { w: 2.4, h: 0.1,  d: 1.0 }, shape: 'box',
    emoji: '🖥️',
    description: 'The desk is on the left side of the room, close to the window.',
  },
  {
    id: 'chair',     label: 'Chair',        color: 0x3b4a6b,
    position: { x: -2,   y: 0.45, z: 2.2  }, size: { w: 0.6, h: 0.9,  d: 0.6 }, shape: 'chair',
    emoji: '🪑',
    description: 'The chair is in front of the desk on the left side of the room.',
  },
  {
    id: 'sofa',      label: 'Sofa',         color: 0x6b4c7a,
    position: { x: 2.5,  y: 0.45, z: 1.5  }, size: { w: 2.0, h: 0.9,  d: 0.9 }, shape: 'box',
    emoji: '🛋️',
    description: 'The sofa is on the right side of the room, against the wall.',
  },
  {
    id: 'tv',        label: 'TV',           color: 0x111111,
    position: { x: 0,    y: 1.2,  z: -3.6 }, size: { w: 1.6, h: 0.9,  d: 0.08 }, shape: 'box',
    emoji: '📺',
    description: 'The TV is mounted on the back wall at the center of the room.',
  },
  {
    id: 'bookshelf', label: 'Bookshelf',    color: 0x5c3d1a,
    position: { x: -3.5, y: 1.0,  z: -2.5 }, size: { w: 0.4, h: 2.0,  d: 1.2 }, shape: 'box',
    emoji: '📚',
    description: 'The bookshelf is in the back-left corner of the room.',
  },
  {
    id: 'table',     label: 'Coffee Table', color: 0xa0784a,
    position: { x: 2.5,  y: 0.25, z: 0.3  }, size: { w: 1.2, h: 0.1,  d: 0.7 }, shape: 'box',
    emoji: '☕',
    description: 'The coffee table is in front of the sofa on the right side.',
  },
  {
    id: 'plant',     label: 'Plant',        color: 0x2d7a3a,
    position: { x: 3.5,  y: 0.6,  z: -3.5 }, size: { w: 0.4, h: 1.2,  d: 0.4 }, shape: 'cylinder',
    emoji: '🌿',
    description: 'The plant is in the back-right corner of the room.',
  },
  {
    id: 'lamp',      label: 'Floor Lamp',   color: 0xf5c518,
    position: { x: -3.5, y: 1.0,  z: 2.5  }, size: { w: 0.1, h: 2.0,  d: 0.1 }, shape: 'cylinder',
    emoji: '💡',
    description: 'The floor lamp is in the front-left corner of the room.',
  },
  {
    id: 'bed',       label: 'Bed',          color: 0x607d8b,
    position: { x: 1.5,  y: 0.3,  z: -2.5 }, size: { w: 1.8, h: 0.6,  d: 2.4 }, shape: 'box',
    emoji: '🛏️',
    description: 'The bed is in the back-right area of the room.',
  },
  {
    id: 'wardrobe',  label: 'Wardrobe',     color: 0x4e342e,
    position: { x: -1.0, y: 1.0,  z: -3.6 }, size: { w: 1.6, h: 2.0,  d: 0.5 }, shape: 'box',
    emoji: '🚪',
    description: 'The wardrobe is along the back wall, slightly left of center.',
  },
];

type RoomObj = typeof ROOM_OBJECTS[0];

// ─── Speech ────────────────────────────────────────────────────────────────
function speak(text: string, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.92; utt.pitch = 1.05; utt.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const pref = voices.find(v =>
    v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural'))
  );
  if (pref) utt.voice = pref;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

// ─── Scene builder ─────────────────────────────────────────────────────────
function buildScene(
  canvas: HTMLCanvasElement,
  onObjectClick: (obj: RoomObj) => void,
  onRobotReady: (goTo: (id: string) => void) => void,
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f18);
  scene.fog = new THREE.FogExp2(0x0b0f18, 0.04);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
  camera.position.set(0, 12, 0.01);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  controls.minDistance = 2; controls.maxDistance = 20;
  controls.maxPolarAngle = Math.PI / 1.85;
  controls.target.set(0, 0.5, 0); controls.update();

  // ── Lights ────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x8090b0, 0.45));

  const sun = new THREE.DirectionalLight(0xfff5e0, 1.6);
  sun.position.set(5, 10, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { near: 0.1, far: 40, left: -10, right: 10, top: 10, bottom: -10 });
  scene.add(sun);

  const fillL = new THREE.PointLight(0x4080ff, 0.6, 18);
  fillL.position.set(-4, 5, 3); scene.add(fillL);

  const lampGlow = new THREE.PointLight(0xffe580, 1.4, 9);
  lampGlow.position.set(-3.5, 2.2, 2.5); scene.add(lampGlow);

  const tvGlow = new THREE.PointLight(0x1a6aff, 0.8, 4);
  tvGlow.position.set(0, 1.2, -3.3); scene.add(tvGlow);

  // ── Room shell ────────────────────────────────────────────────────────
  const RW = 9, RH = 3.5, RD = 9;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a2535, roughness: 0.88, side: THREE.BackSide });
  const room = new THREE.Mesh(new THREE.BoxGeometry(RW, RH, RD), wallMat);
  room.position.y = RH / 2; room.receiveShadow = true; scene.add(room);

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x121c28, roughness: 0.92 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const grid = new THREE.GridHelper(RW, 18, 0x1e3050, 0x172030);
  grid.position.y = 0.002; scene.add(grid);

  // Window light patches on walls
  const winMat = new THREE.MeshStandardMaterial({ color: 0xbcddff, emissive: 0x3c7abf, emissiveIntensity: 0.4, transparent: true, opacity: 0.55 });
  [[-3.0, 2.0, -4.48], [3.0, 2.0, -4.48]].forEach(([wx, wy, wz]) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), winMat);
    win.position.set(wx, wy, wz); scene.add(win);
  });

  // ── Highlight material pool ────────────────────────────────────────────
  const highlightMap = new Map<string, THREE.MeshStandardMaterial[]>();

  function addMesh(def: RoomObj) {
    const { position: p, size: s, color, id, shape } = def;
    const mats: THREE.MeshStandardMaterial[] = [];
    const mkMat = (c = color) => {
      const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.72, metalness: 0.08 });
      mats.push(m); return m;
    };

    if (shape === 'cylinder') {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(s.w / 2, s.w / 2 + 0.05, s.h, 14), mkMat());
      mesh.position.set(p.x, p.y, p.z); mesh.castShadow = true; mesh.userData = { objectDef: def };
      scene.add(mesh); meshMap.set(id, mesh);

      if (id === 'plant') {
        const bushM = mkMat(0x27ae60);
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), bushM);
        bush.position.set(p.x, p.y + s.h / 2 + 0.28, p.z); bush.userData = { objectDef: def }; scene.add(bush);
        const sm2 = mkMat(0x1e8a4a);
        const bush2 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), sm2);
        bush2.position.set(p.x + 0.22, p.y + s.h / 2 + 0.14, p.z - 0.1); bush2.userData = { objectDef: def }; scene.add(bush2);
      }
      if (id === 'lamp') {
        const shadeM = mkMat(0xffe09a);
        shadeM.emissive = new THREE.Color(0xffcc44); shadeM.emissiveIntensity = 0.6;
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.45, 10), shadeM);
        shade.position.set(p.x, p.y + s.h / 2 - 0.1, p.z); shade.userData = { objectDef: def }; scene.add(shade);
      }

    } else if (shape === 'chair') {
      const g = new THREE.Group();
      const mat = mkMat();
      const addBox = (wx: number, hy: number, dz: number, px = 0, py = 0, pz = 0) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(wx, hy, dz), mat);
        m.position.set(px, py, pz); m.castShadow = true; m.userData = { objectDef: def }; g.add(m);
      };
      addBox(s.w, 0.09, s.d, 0, 0.3, 0);
      addBox(s.w, 0.55, 0.07, 0, 0.6, -s.d / 2 + 0.035);
      const legG = new THREE.CylinderGeometry(0.03, 0.03, 0.32, 6);
      [[-0.25, -0.25],[0.25, -0.25],[-0.25, 0.25],[0.25, 0.25]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legG, mat); leg.position.set(lx, 0.16, lz);
        leg.castShadow = true; leg.userData = { objectDef: def }; g.add(leg);
      });
      g.position.set(p.x, p.y - 0.45, p.z);
      g.userData = { objectDef: def };
      g.traverse(c => { if (c !== g) c.userData = { objectDef: def }; });
      scene.add(g); meshMap.set(id, g);

    } else {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), mkMat());
      mesh.position.set(p.x, p.y, p.z); mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = { objectDef: def }; scene.add(mesh); meshMap.set(id, mesh);

      // Desk legs
      if (id === 'desk') {
        const legMat = mkMat(0x5c3d1a);
        const legG = new THREE.CylinderGeometry(0.04, 0.04, 0.82, 6);
        [[-1.0,-0.4],[1.0,-0.4],[-1.0,0.4],[1.0,0.4]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legG, legMat);
          leg.position.set(p.x + lx, 0.39, p.z + lz);
          leg.castShadow = true; leg.userData = { objectDef: def }; scene.add(leg);
        });
        // Monitor on desk
        const monMat = mkMat(0x1a1a2e);
        const mon = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.05), monMat);
        mon.position.set(p.x, p.y + 0.35, p.z - 0.3); mon.userData = { objectDef: def }; scene.add(mon);
        const scrMat = mkMat(0x1a5aff); scrMat.emissive = new THREE.Color(0x0033cc); scrMat.emissiveIntensity = 0.5;
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.52), scrMat);
        scr.position.set(p.x, p.y + 0.35, p.z - 0.27); scr.userData = { objectDef: def }; scene.add(scr);
      }

      // TV
      if (id === 'tv') {
        const standM = mkMat(0x222222);
        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), standM);
        stand.position.set(p.x, 0.3, p.z + 0.1); stand.userData = { objectDef: def }; scene.add(stand);
        const scrM = mkMat(0x1a6aff); scrM.emissive = new THREE.Color(0x0044cc); scrM.emissiveIntensity = 0.9;
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.82), scrM);
        scr.position.set(p.x, p.y, p.z + 0.05); scr.userData = { objectDef: def }; scene.add(scr);
      }

      // Bed pillow & blanket
      if (id === 'bed') {
        const pillowM = mkMat(0xd0e0f0);
        const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.55), pillowM);
        pillow.position.set(p.x, p.y + 0.37, p.z - 0.85); pillow.userData = { objectDef: def }; scene.add(pillow);
        const blanketM = mkMat(0x3a5080);
        const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.09, 1.4), blanketM);
        blanket.position.set(p.x, p.y + 0.37, p.z + 0.32); blanket.userData = { objectDef: def }; scene.add(blanket);
      }

      // Wardrobe handles
      if (id === 'wardrobe') {
        const hMat = mkMat(0xc0a060);
        [-0.35, 0.35].forEach(hx => {
          const h = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), hMat);
          h.position.set(p.x + hx, p.y, p.z + 0.26); h.userData = { objectDef: def }; scene.add(h);
        });
        // Shelf line
        const shelfM = mkMat(0x3a2010);
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.04, 0.46), shelfM);
        shelf.position.set(p.x, p.y + 0.2, p.z); shelf.userData = { objectDef: def }; scene.add(shelf);
      }
    }

    highlightMap.set(id, mats);
  }

  const meshMap = new Map<string, THREE.Object3D>();
  ROOM_OBJECTS.forEach(addMesh);

  // ── Robot sphere ──────────────────────────────────────────────────────
  const robotGroup = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.35, metalness: 0.6 });
  const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), bodyMat);
  bodyMesh.castShadow = true;
  robotGroup.add(bodyMesh);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00ffee, emissiveIntensity: 1.2 }));
  eyeL.position.set(-0.09, 0.06, 0.18);
  const eyeR = eyeL.clone(); eyeR.position.set(0.09, 0.06, 0.18);
  robotGroup.add(eyeL, eyeR);

  // Halo ring
  const haloMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 0.9, transparent: true, opacity: 0.45, wireframe: true });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 6, 24), haloMat);
  halo.rotation.x = Math.PI / 2;
  robotGroup.add(halo);

  // Shadow disc
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = -0.21;
  robotGroup.add(shadowDisc);

  robotGroup.position.set(0, 0.35, 4);
  scene.add(robotGroup);

  // ── Robot animation state ─────────────────────────────────────────────
  let robotTarget = new THREE.Vector3(0, 0.35, 4);
  let robotMoving = false;
  let robotBob = 0;
  let lastHighlightId = '';
  const activeMeshMats = new Map<string, { mat: THREE.MeshStandardMaterial; origColor: THREE.Color; origEmissive: THREE.Color }[]>();

  function clearHighlight(id: string) {
    const entries = activeMeshMats.get(id);
    if (!entries) return;
    entries.forEach(({ mat, origColor, origEmissive }) => {
      mat.color.copy(origColor);
      mat.emissive.copy(origEmissive);
      mat.emissiveIntensity = 0;
    });
    activeMeshMats.delete(id);
  }

  function highlightObject(id: string) {
    if (lastHighlightId) clearHighlight(lastHighlightId);
    lastHighlightId = id;
    const mats = highlightMap.get(id);
    if (!mats) return;
    const entries = mats.map(mat => ({
      mat,
      origColor: mat.color.clone(),
      origEmissive: mat.emissive.clone(),
    }));
    activeMeshMats.set(id, entries);
    entries.forEach(({ mat }) => {
      mat.emissive.set(0x22d3ee);
      mat.emissiveIntensity = 0.55;
    });
  }

  function goToObject(id: string) {
    const obj = meshMap.get(id);
    if (!obj) return;
    const tp = new THREE.Vector3();
    tp.copy(obj.position);
    tp.y = 0.35;
    // offset slightly toward center
    tp.lerp(new THREE.Vector3(0, 0.35, 0), 0.28);
    robotTarget = tp;
    robotMoving = true;
    highlightObject(id);
  }

  onRobotReady(goToObject);

  // ── Raycaster ─────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onCanvasClick(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    if (!hits.length) return;
    let hit: THREE.Object3D | null = hits[0].object;
    while (hit && !hit.userData.objectDef) hit = hit.parent;
    if (hit?.userData.objectDef) onObjectClick(hit.userData.objectDef as RoomObj);
  }

  function onCanvasMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    const def = hits.length > 0 ? hits[0].object.userData.objectDef : null;
    canvas.style.cursor = def ? 'pointer' : 'default';
  }

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mousemove', onCanvasMove);

  // ── Resize ────────────────────────────────────────────────────────────
  function onResize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  // Use ResizeObserver — no layout thrash
  let resizePending = false;
  const ro = new ResizeObserver(() => {
    if (resizePending) return;
    resizePending = true;
    requestAnimationFrame(() => {
      resizePending = false;
      onResize();
    });
  });
  ro.observe(canvas);
  onResize();
  // ── Animate ───────────────────────────────────────────────────────────
  let animId = 0;
  const clock = new THREE.Clock();
  let paused = false;

  function onVisibility() { paused = document.hidden; }
  document.addEventListener('visibilitychange', onVisibility);

  function animate() {
    animId = requestAnimationFrame(animate);
    if (paused) return;
    const dt = clock.getDelta();
    const t = clock.getElapsedTime();

    // Bob the robot
    robotBob = Math.sin(t * 2.5) * 0.05;
    robotGroup.position.y = robotTarget.y + robotBob + (robotMoving ? 0.06 : 0);

    // Move toward target
    if (robotMoving) {
      const dist = robotGroup.position.distanceTo(robotTarget);
      if (dist > 0.08) {
        const step = Math.min(dist, 2.4 * dt);
        robotGroup.position.lerp(robotTarget, step / dist);
        // Face direction of travel
        const dir = robotTarget.clone().sub(robotGroup.position).normalize();
        if (dir.length() > 0.01) {
          const angle = Math.atan2(dir.x, dir.z);
          robotGroup.rotation.y = THREE.MathUtils.lerp(robotGroup.rotation.y, angle, 0.12);
        }
      } else {
        robotMoving = false;
      }
    }

    // Pulse halo
    halo.rotation.z = t * 0.7;
    haloMat.opacity = 0.3 + 0.2 * Math.sin(t * 3);

    // Pulse highlighted object emissive
    if (lastHighlightId) {
      const entries = activeMeshMats.get(lastHighlightId);
      entries?.forEach(({ mat }) => {
        mat.emissiveIntensity = 0.4 + 0.25 * Math.sin(t * 4);
      });
    }

    // Gentle TV glow flicker
    tvGlow.intensity = 0.7 + 0.15 * Math.sin(t * 7.3);

    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // ── Camera presets ────────────────────────────────────────────────────
  function setTopView() {
    camera.position.set(0, 13, 0.01);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }
  function setInsideView() {
    camera.position.set(0, 1.7, 5.5);
    controls.target.set(0, 1.2, 0);
    controls.update();
  }
  function focusObject(id: string) {
    const obj = meshMap.get(id);
    if (!obj) return;
    const p = obj.position.clone();
    camera.position.set(p.x + 2.5, p.y + 2.5, p.z + 3.5);
    controls.target.set(p.x, p.y, p.z);
    controls.update();
  }

  return {
    dispose() {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('mousemove', onCanvasMove);
      controls.dispose(); renderer.dispose();
    },
    setTopView, setInsideView, focusObject, goToObject,
  };
}

// ─── Component ────────────────────────────────────────────────────────────
export function Map3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ReturnType<typeof buildScene> | null>(null);
  const goToRef = useRef<((id: string) => void) | null>(null);

  const [activeObj, setActiveObj] = useState<RoomObj | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [view, setView] = useState<'top' | 'inside'>('top');
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [robotMovingTo, setRobotMovingTo] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);

  const handleObjectClick = useCallback((obj: RoomObj) => {
    setActiveObj(obj);
    goToRef.current?.(obj.id);
    setRobotMovingTo(obj.id);
    const msg = `${obj.label} detected. ${obj.description}`;
    setSpeaking(true);
    speak(msg, () => setSpeaking(false));
    sceneRef.current?.focusObject(obj.id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tid = setTimeout(() => {
      sceneRef.current = buildScene(
        canvas,
        handleObjectClick,
        (goTo) => { goToRef.current = goTo; },
      );
    }, 60);
    return () => { clearTimeout(tid); sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [handleObjectClick]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  function doFind(label: string) {
    const found = ROOM_OBJECTS.find(o =>
      o.label.toLowerCase().includes(label.toLowerCase()) ||
      o.id.toLowerCase().includes(label.toLowerCase())
    );
    if (found) {
      setActiveObj(found);
      setRobotMovingTo(found.id);
      goToRef.current?.(found.id);
      sceneRef.current?.focusObject(found.id);
      const msg = `${found.label} found. ${found.description}`;
      setSpeaking(true);
      speak(msg, () => setSpeaking(false));
    } else {
      setSpeaking(true);
      speak(`Sorry, I could not find ${label} in this room.`, () => setSpeaking(false));
      setActiveObj(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    doFind(q);
    setQuery('');
  }

  function handleVoiceInput() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser.'); return; }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const r = new SR(); recogRef.current = r;
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (ev: any) => {
      const t = ev.results[0][0].transcript;
      setQuery(t);
      doFind(t);
    };
    r.start();
  }

  return (
    <div className="room3d-page">
      <div className="room3d-header">
        <div className="room3d-title-row">
          <h1 className="room3d-title">🏠 3D Room Explorer</h1>
          <span className="room3d-badge">Interactive · Voice</span>
        </div>
        <p className="room3d-subtitle">
          Click any object or ask the robot to find it · Robot navigates and speaks the location
        </p>
      </div>

      <div className="room3d-layout">
        {/* ── Canvas ── */}
        <div className="room3d-canvas-wrap">
          <canvas ref={canvasRef} className="room3d-canvas" />

          <div className="view-controls">
            <button className={`view-btn ${view === 'top' ? 'active' : ''}`} onClick={() => { setView('top'); sceneRef.current?.setTopView(); }}>⬆ Top View</button>
            <button className={`view-btn ${view === 'inside' ? 'active' : ''}`} onClick={() => { setView('inside'); sceneRef.current?.setInsideView(); }}>👁 Inside View</button>
          </div>

          {speaking && (
            <div className="speaking-badge">
              <span className="speaking-dot" />
              🤖 Robot Speaking…
            </div>
          )}
          {robotMovingTo && !speaking && (
            <div className="moving-badge">
              🤖 → {ROOM_OBJECTS.find(o => o.id === robotMovingTo)?.emoji} {ROOM_OBJECTS.find(o => o.id === robotMovingTo)?.label}
            </div>
          )}
        </div>

        {/* ── Side panel ── */}
        <div className="room3d-panel">
          {/* Search */}
          <div className="panel-section">
            <h3 className="panel-heading">🔍 Find Object</h3>
            <form className="search-row" onSubmit={handleSearch}>
              <input className="search-input" placeholder="e.g. sofa, TV, bed…" value={query} onChange={e => setQuery(e.target.value)} />
              <button type="submit" className="search-btn">Go</button>
              <button type="button" className={`mic-btn ${listening ? 'listening' : ''}`} onClick={handleVoiceInput} title="Speak to find">
                {listening ? '🔴' : '🎙️'}
              </button>
            </form>
            {listening && <p className="listening-hint">Listening… say an object name</p>}
          </div>

          {/* Quick find */}
          <div className="panel-section">
            <h3 className="panel-heading">⚡ Quick Find</h3>
            <div className="quick-grid">
              {ROOM_OBJECTS.map(obj => (
                <button key={obj.id} className={`quick-obj-btn ${activeObj?.id === obj.id ? 'selected' : ''}`} onClick={() => doFind(obj.label)}>
                  {obj.emoji} {obj.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active object */}
          {activeObj && (
            <div className="panel-section">
              <h3 className="panel-heading">📍 Detected</h3>
              <div className="obj-card">
                <div className="obj-color-swatch" style={{ background: `#${activeObj.color.toString(16).padStart(6, '0')}` }} />
                <div className="obj-info">
                  <p className="obj-name">{activeObj.emoji} {activeObj.label}</p>
                  <p className="obj-desc">{activeObj.description}</p>
                  <button className="replay-btn" onClick={() => { setSpeaking(true); speak(`${activeObj.label}. ${activeObj.description}`, () => setSpeaking(false)); }}>
                    🔊 Replay
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="panel-section">
            <h3 className="panel-heading">🗺️ Room Objects</h3>
            <ul className="legend-list">
              {ROOM_OBJECTS.map(obj => (
                <li key={obj.id} className={`legend-item ${activeObj?.id === obj.id ? 'highlighted' : ''}`} onClick={() => doFind(obj.label)}>
                  <span className="legend-dot" style={{ background: `#${obj.color.toString(16).padStart(6, '0')}` }} />
                  <span>{obj.emoji}</span>
                  <span>{obj.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
