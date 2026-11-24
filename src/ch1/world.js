import { CH1_CONFIG, getTerrainHeight, getWalkableHeight, getZoneAt, isInInkSwamp, getDryRiverCenterX } from './data.js';

export function createOpenWorld(THREE, RoomEnvironment, renderer, isSoftwareGl, initialPreset = 'medium') {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x13151a);
  scene.fog = new THREE.FogExp2(0x13151a, 0.013);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const hemiLight = new THREE.HemisphereLight(0x7a8cb2, 0x221c18, 0.96);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffcfa0, 1.85);
  sunLight.position.set(28, 42, 24);
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x6f94cc, 0.62);
  rimLight.position.set(-28, 18, -32);
  scene.add(rimLight);

  let viewPreset = isSoftwareGl ? 'low' : initialPreset;
  function applyViewPreset(presetName) {
    viewPreset = CH1_CONFIG.world.viewPresets[presetName] ? presetName : 'medium';
    const spec = CH1_CONFIG.world.viewPresets[viewPreset];
    const allowShadows = !isSoftwareGl && spec.shadows;
    renderer.shadowMap.enabled = allowShadows;
    sunLight.castShadow = allowShadows;
    if (allowShadows) {
      sunLight.shadow.mapSize.set(1024, 1024);
      const d = 32;
      Object.assign(sunLight.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 2, far: 96 });
      sunLight.shadow.bias = -0.0005;
    }
    rebuildVisibleChunks(lastChunkX, lastChunkZ, true);
  }

  // Texture đá/tro thủ công
  function createContactShadowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const ctx = c.getContext('2d'), g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    g.addColorStop(0, 'rgba(0,0,0,0.72)'); g.addColorStop(0.6, 'rgba(0,0,0,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const contactShadowTex = createContactShadowTexture();

  // Vật liệu chia sẻ
  const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.04 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3b383f, roughness: 0.88, metalness: 0.08 });
  const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x242228, roughness: 0.72, metalness: 0.25 });
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x453e38, roughness: 0.94, metalness: 0.02 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3424, roughness: 0.88, metalness: 0.05 });
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.82, side: THREE.DoubleSide });
  const inkMat = new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: 0.14, metalness: 0.45 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0x9b7e48, roughness: 0.42, metalness: 0.65 });

  // Geometries chia sẻ cho InstancedMesh theo chunk
  const treeTrunkGeo = new THREE.CylinderGeometry(0.18, 0.36, 4.2, 6);
  treeTrunkGeo.translate(0, 2.1, 0);
  const treeCrownGeo = new THREE.DodecahedronGeometry(1.45, 0);
  treeCrownGeo.translate(0, 4.4, 0);
  const rockGeo = new THREE.DodecahedronGeometry(0.85, 0);
  const pageGeo = new THREE.PlaneGeometry(0.42, 0.56);
  pageGeo.rotateX(-Math.PI / 2);

  // Hệ thống Streaming 64x64 chunk
  const chunkSize = CH1_CONFIG.world.chunkSize;
  const activeChunks = new Map();
  let lastChunkX = 9999, lastChunkZ = 9999;

  function chunkHash(cx, cz, idx) {
    let n = Math.imul(cx * 73856093 ^ cz * 19349663, idx + 17) + CH1_CONFIG.world.seed;
    n = (n ^ (n >>> 13)) >>> 0;
    return ((Math.imul(n, 1274126177) >>> 0) % 10000) / 10000;
  }

  function buildChunk(cx, cz, isFarLod) {
    const group = new THREE.Group();
    const segs = isFarLod ? 8 : 16;
    const geo = new THREE.PlaneGeometry(chunkSize, chunkSize, segs, segs);
    geo.rotateX(-Math.PI / 2);
    const ox = cx * chunkSize + chunkSize * 0.5;
    const oz = cz * chunkSize + chunkSize * 0.5;
    group.position.set(ox, 0, oz);

    const posAttr = geo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const col = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const wx = ox + posAttr.getX(i);
      const wz = oz + posAttr.getZ(i);
      const wy = getTerrainHeight(wx, wz);
      posAttr.setY(i, wy);

      const zone = getZoneAt(wx, wz);
      const inSwamp = isInInkSwamp(wx, wz);
      const dRiver = Math.abs(wx - getDryRiverCenterX(wz));

      if (inSwamp) col.setHex(0x101316);
      else if (dRiver < 19) col.setHex(0x1c1c21);
      else if (zone.id === 'withered_woods') col.setHex(0x282d26);
      else if (zone.id === 'old_binding_village') col.setHex(0x342c24);
      else if (zone.id === 'broken_tower') col.setHex(0x2b2932);
      else if (zone.id === 'origin_pit') col.setHex(0x222520);
      else col.setHex(0x2c2b30);

      const n = (Math.sin(wx * 0.08) * Math.cos(wz * 0.08)) * 0.04;
      colors[i * 3] = Math.max(0.03, col.r + n);
      colors[i * 3 + 1] = Math.max(0.03, col.g + n);
      colors[i * 3 + 2] = Math.max(0.03, col.b + n);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, terrainMat);
    mesh.receiveShadow = !isSoftwareGl;
    group.add(mesh);

    // LOD Near: Thêm cây chữ úa, đá và mảnh giấy rơi bằng InstancedMesh
    if (!isFarLod) {
      const density = CH1_CONFIG.world.viewPresets[viewPreset].propDensity;
      const treeCap = Math.round(10 * density);
      const rockCap = Math.round(8 * density);
      const pageCap = Math.round(9 * density);

      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), vPos = new THREE.Vector3(), vScale = new THREE.Vector3(), eul = new THREE.Euler();

      // Cây
      const trunks = new THREE.InstancedMesh(treeTrunkGeo, barkMat, Math.max(1, treeCap));
      const crowns = new THREE.InstancedMesh(treeCrownGeo, stoneMat, Math.max(1, treeCap));
      let tCount = 0;
      for (let i = 0; i < treeCap; i++) {
        const lx = (chunkHash(cx, cz, i * 3 + 1) - 0.5) * (chunkSize - 6);
        const lz = (chunkHash(cx, cz, i * 3 + 2) - 0.5) * (chunkSize - 6);
        const wx = ox + lx, wz = oz + lz;
        if (Math.hypot(wx, wz + 680) < 46 || Math.hypot(wx + 340, wz + 300) < 22 || Math.hypot(wx - 320, wz - 160) < 32 || Math.hypot(wx, wz - 600) < 28) continue;
        const wy = getTerrainHeight(wx, wz);
        const s = 0.75 + chunkHash(cx, cz, i * 3 + 3) * 0.75;
        eul.set((chunkHash(cx, cz, i + 40) - 0.5) * 0.16, chunkHash(cx, cz, i + 50) * Math.PI * 2, (chunkHash(cx, cz, i + 60) - 0.5) * 0.16);
        q.setFromEuler(eul);
        m4.compose(vPos.set(lx, wy - 0.2, lz), q, vScale.set(s, s * 1.15, s));
        trunks.setMatrixAt(tCount, m4);
        crowns.setMatrixAt(tCount, m4);
        tCount++;
      }
      trunks.count = crowns.count = tCount;
      if (tCount > 0) {
        trunks.instanceMatrix.needsUpdate = crowns.instanceMatrix.needsUpdate = true;
        group.add(trunks, crowns);
      }

      // Đá
      const rocks = new THREE.InstancedMesh(rockGeo, darkStoneMat, Math.max(1, rockCap));
      let rCount = 0;
      for (let i = 0; i < rockCap; i++) {
        const lx = (chunkHash(cx, cz, 100 + i * 3) - 0.5) * (chunkSize - 4);
        const lz = (chunkHash(cx, cz, 101 + i * 3) - 0.5) * (chunkSize - 4);
        const wx = ox + lx, wz = oz + lz;
        if (Math.hypot(wx, wz + 680) < 43) continue;
        const wy = getTerrainHeight(wx, wz);
        const sx = 0.8 + chunkHash(cx, cz, 120 + i) * 1.5;
        eul.set(chunkHash(cx, cz, 140 + i) * 2, chunkHash(cx, cz, 160 + i) * 3, 0);
        q.setFromEuler(eul);
        m4.compose(vPos.set(lx, wy + 0.1, lz), q, vScale.set(sx, sx * 0.75, sx));
        rocks.setMatrixAt(rCount++, m4);
      }
      rocks.count = rCount;
      if (rCount > 0) { rocks.instanceMatrix.needsUpdate = true; group.add(rocks); }

      // Trang giấy rơi
      const pages = new THREE.InstancedMesh(pageGeo, pageMat, Math.max(1, pageCap));
      let pCount = 0;
      for (let i = 0; i < pageCap; i++) {
        const lx = (chunkHash(cx, cz, 200 + i * 2) - 0.5) * (chunkSize - 4);
        const lz = (chunkHash(cx, cz, 201 + i * 2) - 0.5) * (chunkSize - 4);
        const wx = ox + lx, wz = oz + lz;
        const wy = getTerrainHeight(wx, wz);
        eul.set(0, chunkHash(cx, cz, 220 + i) * Math.PI * 2, 0);
        q.setFromEuler(eul);
        m4.compose(vPos.set(lx, wy + 0.08, lz), q, vScale.set(1, 1, 1));
        pages.setMatrixAt(pCount++, m4);
      }
      pages.count = pCount;
      if (pCount > 0) { pages.instanceMatrix.needsUpdate = true; group.add(pages); }
    }

    scene.add(group);
    return { group, geo, isFarLod };
  }

  function disposeChunk(entry) {
    scene.remove(entry.group);
    entry.geo.dispose();
  }

  function rebuildVisibleChunks(pcx, pcz, force = false) {
    if (!force && pcx === lastChunkX && pcz === lastChunkZ) return;
    lastChunkX = pcx; lastChunkZ = pcz;
    const rad = CH1_CONFIG.world.viewPresets[viewPreset].radius;
    const needed = new Map();
    for (let dx = -rad; dx <= rad; dx++) {
      for (let dz = -rad; dz <= rad; dz++) {
        const cx = pcx + dx, cz = pcz + dz;
        if (Math.abs(cx * chunkSize) > CH1_CONFIG.world.halfSize + chunkSize || Math.abs(cz * chunkSize) > CH1_CONFIG.world.halfSize + chunkSize) continue;
        const isFar = Math.max(Math.abs(dx), Math.abs(dz)) >= Math.max(2, rad);
        needed.set(`${cx},${cz}`, { cx, cz, isFar });
      }
    }
    for (const [key, entry] of activeChunks) {
      const req = needed.get(key);
      if (!req || req.isFar !== entry.isFarLod) {
        disposeChunk(entry);
        activeChunks.delete(key);
      }
    }
    for (const [key, req] of needed) {
      if (!activeChunks.has(key)) {
        activeChunks.set(key, buildChunk(req.cx, req.cz, req.isFar));
      }
    }
  }

  // =========================================================================
  // Landmarks cố định cho 6 khu vực + Colliders tĩnh
  // =========================================================================
  const staticColliders = [];
  const landmarksGroup = new THREE.Group();
  scene.add(landmarksGroup);

  // 1. Bãi Trang Rách: Cổng đá vỡ & phiến đá dẫn đường
  {
    const gy = getTerrainHeight(0, 610);
    const arch = new THREE.Group();
    arch.position.set(0, gy, 610);
    const pL = new THREE.Mesh(new THREE.BoxGeometry(2.2, 7.5, 2.2), stoneMat); pL.position.set(-4.6, 3.75, 0);
    const pR = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6.2, 2.2), stoneMat); pR.position.set(4.6, 3.1, 0);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.3, 2.4), darkStoneMat); lintel.position.set(0, 7.6, 0); lintel.rotation.z = -0.06;
    arch.add(pL, pR, lintel);
    landmarksGroup.add(arch);
    staticColliders.push({ x: -4.6, z: 610, r: 1.3, h: 8 }, { x: 4.6, z: 610, r: 1.3, h: 7 });
  }

  // 2. Rừng Chữ Úa: Vòng cây cổ thụ khổng lồ quanh G2
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = -340 + Math.cos(a) * 28, z = 260 + Math.sin(a) * 28;
    const y = getTerrainHeight(x, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.0, 9.5, 7), barkMat);
    trunk.position.set(x, y + 4.5, z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 6, 12), goldTrimMat);
    ring.position.set(x, y + 3.0, z); ring.rotation.x = Math.PI / 2;
    landmarksGroup.add(trunk, ring);
    staticColliders.push({ x, z, r: 1.0, h: 10 });
  }

  // 3. Làng Bìa Cũ: 5 túp lều đóng sách đổ nát quanh (320, 160)
  const hutOffsets = [[-16, -12], [18, -14], [-18, 16], [16, 18], [0, -26]];
  for (const [hx, hz] of hutOffsets) {
    const x = 320 + hx, z = 160 + hz, y = getTerrainHeight(x, z);
    const hut = new THREE.Group(); hut.position.set(x, y, z); hut.rotation.y = hx * 0.1;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3.4, 5.4), woodMat); wall.position.y = 1.7;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.5, 4), darkStoneMat); roof.position.y = 4.6; roof.rotation.y = Math.PI * 0.25;
    hut.add(wall, roof); landmarksGroup.add(hut);
    staticColliders.push({ x, z, r: 3.4, h: 6.2 });
  }

  // 4. Đầm Mực: Hồ mực đen bóng rộng tại (420, -280)
  {
    const sy = getTerrainHeight(420, -280);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(72, 32), inkMat);
    pool.rotation.x = -Math.PI / 2; pool.position.set(420, sy + 0.08, -280);
    landmarksGroup.add(pool);
  }

  // 5. Tháp Trang Sách Gãy (-340, -300): 3 tầng đi bộ được bằng cầu dốc xoắn
  {
    const tx = -340, tz = -300, gy = getTerrainHeight(tx, tz);
    const towerGrp = new THREE.Group(); towerGrp.position.set(tx, gy, tz);
    const f1Plate = new THREE.Mesh(new THREE.CylinderGeometry(11.4, 12.2, 0.7, 16), stoneMat); f1Plate.position.y = 0.0;
    const f2Plate = new THREE.Mesh(new THREE.CylinderGeometry(11.2, 11.2, 0.55, 16), stoneMat); f2Plate.position.y = 4.82;
    const f3Plate = new THREE.Mesh(new THREE.CylinderGeometry(11.0, 11.0, 0.55, 16), darkStoneMat); f3Plate.position.y = 9.58;
    const centerPillar = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 12.8, 10), darkStoneMat); centerPillar.position.y = 6.4;
    towerGrp.add(f1Plate, f2Plate, f3Plate, centerPillar);
    staticColliders.push({ x: tx, z: tz, r: 1.7, h: 14 });

    // Trụ viền tháp & cầu dốc bậc thang trực quan
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      if (Math.abs(a) < 0.45) continue; // chừa cửa vào hướng Đông
      const px = Math.cos(a) * 10.6, pz = Math.sin(a) * 10.6;
      const colMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 11.5, 1.1), stoneMat);
      colMesh.position.set(px, 5.7, pz);
      towerGrp.add(colMesh);
    }
    // Bậc cầu dốc 1 (-0.25 -> 1.95) và cầu dốc 2 (2.0 -> 4.35)
    for (let s = 0; s < 16; s++) {
      const t = s / 15;
      const a1 = -0.25 + t * 2.2;
      const step1 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.35, 1.7), darkStoneMat);
      step1.position.set(Math.cos(a1) * 12.0, 0.35 + t * 4.75, Math.sin(a1) * 12.0);
      step1.rotation.y = -a1;
      towerGrp.add(step1);

      const a2 = 2.0 + t * 2.35;
      const step2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.35, 1.7), darkStoneMat);
      step2.position.set(Math.cos(a2) * 12.0, 5.1 + t * 4.75, Math.sin(a2) * 12.0);
      step2.rotation.y = -a2;
      towerGrp.add(step2);
    }
    landmarksGroup.add(towerGrp);
  }

  // 6. Hố Khởi Nguyên (0, -680): Đấu trường Boss tròn R=40m, 14 trụ đá, Cổng Sương & Cổng Chương 2
  const bossArenaCenter = CH1_CONFIG.boss.rottingOne.arenaCenter;
  const fogGateMeshMat = new THREE.MeshBasicMaterial({ color: 0xdab86b, transparent: true, opacity: 0.48, side: THREE.DoubleSide });
  let fogGateGroup = null;
  let northPassBlockedCollider = null;
  let northSealMesh = null;
  {
    const ax = bossArenaCenter.x, az = bossArenaCenter.z, R = CH1_CONFIG.boss.rottingOne.arenaRadius;
    const arenaFloor = new THREE.Mesh(new THREE.CircleGeometry(R + 1.5, 48), darkStoneMat);
    arenaFloor.rotation.x = -Math.PI / 2; arenaFloor.position.set(ax, 0.03, az);
    const sigilRing = new THREE.Mesh(new THREE.RingGeometry(R - 3.2, R - 2.6, 48), goldTrimMat);
    sigilRing.rotation.x = -Math.PI / 2; sigilRing.position.set(ax, 0.05, az);
    landmarksGroup.add(arenaFloor, sigilRing);

    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const px = ax + Math.cos(a) * R, pz = az + Math.sin(a) * R;
      // Chừa cổng vào phía Nam (a ~ PI/2) và cổng Chương 2 phía Bắc (a ~ -PI/2)
      if (Math.abs(pz - (az + R)) < 7.5 && Math.abs(px - ax) < 7.5) continue;
      if (Math.abs(pz - (az - R)) < 7.5 && Math.abs(px - ax) < 7.5) continue;
      const h = i % 2 === 0 ? 9.5 : 5.8;
      const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, h, 8), stoneMat);
      pMesh.position.set(px, h * 0.5, pz);
      landmarksGroup.add(pMesh);
      staticColliders.push({ x: px, z: pz, r: 1.5, h: h + 1 });
    }

    // Cổng Sương phía Nam (0, -640)
    fogGateGroup = new THREE.Group();
    fogGateGroup.position.set(0, 0, az + R);
    const gL = new THREE.Mesh(new THREE.BoxGeometry(2.0, 9.5, 2.2), stoneMat); gL.position.set(-5.2, 4.75, 0);
    const gR = new THREE.Mesh(new THREE.BoxGeometry(2.0, 9.5, 2.2), stoneMat); gR.position.set(5.2, 4.75, 0);
    const gTop = new THREE.Mesh(new THREE.BoxGeometry(12.6, 1.6, 2.5), darkStoneMat); gTop.position.set(0, 9.8, 0);
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.8), fogGateMeshMat); veil.position.set(0, 4.4, 0);
    fogGateGroup.add(gL, gR, gTop, veil);
    landmarksGroup.add(fogGateGroup);
    staticColliders.push({ x: -5.2, z: az + R, r: 1.3, h: 10 }, { x: 5.2, z: az + R, r: 1.3, h: 10 });

    // Cổng Chương 2 phía Bắc (0, -720)
    const nL = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10, 2.4), stoneMat); nL.position.set(-5.4, 5, az - R);
    const nR = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10, 2.4), stoneMat); nR.position.set(5.4, 5, az - R);
    const nTop = new THREE.Mesh(new THREE.BoxGeometry(13.2, 1.8, 2.6), goldTrimMat); nTop.position.set(0, 10.4, az - R);
    northSealMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 9.0), new THREE.MeshBasicMaterial({ color: 0x385e46, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
    northSealMesh.position.set(0, 4.5, az - R);
    landmarksGroup.add(nL, nR, nTop, northSealMesh);
    staticColliders.push({ x: -5.4, z: az - R, r: 1.4, h: 11 }, { x: 5.4, z: az - R, r: 1.4, h: 11 });
    northPassBlockedCollider = { x: 0, z: az - R, r: 4.4, h: 10 };
    staticColliders.push(northPassBlockedCollider);
  }

  function setBossArenaState(bossActive, bossDefeated) {
    if (fogGateGroup) {
      fogGateMeshMat.opacity = bossDefeated ? 0.0 : (bossActive ? 0.72 : 0.44);
      fogGateMeshMat.color.setHex(bossActive ? 0xe09638 : 0xdab86b);
    }
    if (northSealMesh) northSealMesh.visible = !bossDefeated;
    if (bossDefeated && northPassBlockedCollider) {
      const idx = staticColliders.indexOf(northPassBlockedCollider);
      if (idx >= 0) staticColliders.splice(idx, 1);
      northPassBlockedCollider = null;
    }
  }

  // Pool hạt tia lửa / tro
  const poolSize = 110;
  const pInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: 0xffffff }), poolSize);
  pInst.frustumCulled = false;
  scene.add(pInst);
  const particles = Array.from({ length: poolSize }, () => ({ life: 0, maxLife: 0.4, px: 0, py: -200, pz: 0, vx: 0, vy: 0, vz: 0, scale: 1 }));
  let pCursor = 0;
  const _m4 = new THREE.Matrix4(), _q1 = new THREE.Quaternion(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _c1 = new THREE.Color();

  function spawnSparks(x, y, z, count = 12, speed = 6.5, colorHex = 0xffc864) {
    for (let i = 0; i < count; i++) {
      const p = particles[pCursor]; pCursor = (pCursor + 1) % poolSize;
      p.life = 0.25 + Math.random() * 0.35; p.maxLife = p.life;
      p.px = x; p.py = y; p.pz = z;
      const a = Math.random() * Math.PI * 2, up = 0.35 + Math.random() * 0.9, sp = speed * (0.45 + Math.random() * 0.8);
      p.vx = Math.cos(a) * sp; p.vy = up * sp * 0.7; p.vz = Math.sin(a) * sp; p.scale = 0.7 + Math.random() * 0.95;
      pInst.setColorAt(pCursor, _c1.setHex(colorHex));
    }
    if (pInst.instanceColor) pInst.instanceColor.needsUpdate = true;
  }

  // Chu kỳ ngày - đêm & sương mù chuyển vùng
  let timeOfDay = 0.34; // 0.34 ~ 08:10 sáng sương mờ
  const currentFogColor = new THREE.Color(0x16171d);

  function advanceTimeHours(hours) {
    timeOfDay = (timeOfDay + hours / 24 + 1) % 1;
  }
  function getTimeLabel() {
    const totalMin = Math.floor(timeOfDay * 24 * 60);
    const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const mm = String(totalMin % 60).padStart(2, '0');
    const phase = (timeOfDay > 0.22 && timeOfDay < 0.76) ? 'Ban ngày' : 'Đêm sương';
    return `${hh}:${mm} · ${phase}`;
  }

  function resolveMove(pos, radius, bossFightActive = false) {
    const bound = CH1_CONFIG.world.halfSize - 14;
    pos.x = Math.max(-bound, Math.min(bound, pos.x));
    pos.z = Math.max(-bound, Math.min(bound, pos.z));

    for (const col of staticColliders) {
      const dx = pos.x - col.x, dz = pos.z - col.z, minD = radius + col.r, dSq = dx * dx + dz * dz;
      if (dSq < minD * minD && dSq > 1e-6) {
        const d = Math.sqrt(dSq);
        pos.x = col.x + (dx / d) * minD;
        pos.z = col.z + (dz / d) * minD;
      }
    }

    // Nếu đang đánh Boss, giữ người chơi trong đấu trường Hố Khởi Nguyên R = 39
    if (bossFightActive) {
      const dx = pos.x - bossArenaCenter.x, dz = pos.z - bossArenaCenter.z;
      const dist = Math.hypot(dx, dz), maxR = CH1_CONFIG.boss.rottingOne.arenaRadius - 1.2;
      if (dist > maxR) {
        pos.x = bossArenaCenter.x + (dx / dist) * maxR;
        pos.z = bossArenaCenter.z + (dz / dist) * maxR;
      }
    }

    pos.y = getWalkableHeight(pos.x, pos.z, pos.y);
  }

  function updateWorld(dt, elapsed, playerPos) {
    if (playerPos) {
      const pcx = Math.floor(playerPos.x / chunkSize);
      const pcz = Math.floor(playerPos.z / chunkSize);
      rebuildVisibleChunks(pcx, pcz, false);
    }

    timeOfDay = (timeOfDay + dt / CH1_CONFIG.world.dayDurationSec) % 1;
    const sunAngle = (timeOfDay - 0.25) * Math.PI * 2;
    const dayFactor = Math.max(0, Math.sin(sunAngle));
    const isNight = dayFactor < 0.12;

    const zone = playerPos ? getZoneAt(playerPos.x, playerPos.z) : CH1_CONFIG.zones[0];
    _c1.setHex(zone.fogColor);
    const nightTint = isNight ? 0.45 : 0.72 + dayFactor * 0.45;
    _c1.multiplyScalar(nightTint);
    currentFogColor.lerp(_c1, 1 - Math.exp(-2.2 * dt));
    scene.background.copy(currentFogColor);
    scene.fog.color.copy(currentFogColor);

    const targetDensity = zone.fogDensity * (isNight ? CH1_CONFIG.world.nightFogMult : 1.0);
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetDensity, 1 - Math.exp(-2.0 * dt));

    sunLight.intensity = 0.42 + dayFactor * 1.65;
    sunLight.color.setHex(dayFactor < 0.28 ? 0x9ab0db : 0xffcfa0);
    hemiLight.intensity = 0.52 + dayFactor * 0.56;
    if (playerPos) {
      sunLight.position.set(playerPos.x + Math.cos(sunAngle) * 32, 22 + dayFactor * 28, playerPos.z + 24);
      sunLight.target.position.copy(playerPos);
      sunLight.target.updateMatrixWorld();
    }

    // Hạt
    for (let i = 0; i < poolSize; i++) {
      const p = particles[i];
      if (p.life > 0) {
        p.life -= dt; p.vy -= 13 * dt; p.px += p.vx * dt; p.py += p.vy * dt; p.pz += p.vz * dt;
        const groundY = getTerrainHeight(p.px, p.pz) + 0.04;
        if (p.py < groundY) { p.py = groundY; p.vy *= -0.3; }
        const s = Math.max(0.01, (p.life / p.maxLife) * p.scale);
        _m4.compose(_v1.set(p.px, p.py, p.pz), _q1.identity(), _v2.set(s, s, s));
      } else {
        _m4.compose(_v1.set(0, -250, 0), _q1.identity(), _v2.set(0.001, 0.001, 0.001));
      }
      pInst.setMatrixAt(i, _m4);
    }
    pInst.instanceMatrix.needsUpdate = true;

    return { zone, isNight, fogGatePos: CH1_CONFIG.boss.rottingOne.fogGatePos };
  }

  applyViewPreset(viewPreset);
  rebuildVisibleChunks(0, Math.floor(CH1_CONFIG.playerStart.z / chunkSize), true);

  return {
    scene,
    staticColliders,
    contactShadowTex,
    spawnSparks,
    resolveMove,
    updateWorld,
    applyViewPreset,
    getViewPreset: () => viewPreset,
    advanceTimeHours,
    getTimeLabel,
    setBossArenaState,
    signPos: new THREE.Vector3(0, getTerrainHeight(0, 616), 616),
    get timeOfDay() { return timeOfDay; },
    set timeOfDay(v) { timeOfDay = v; },
  };
}
