// Thực thể thế giới 6x6 km: 9 Đài Lửa, NPC (JSON), 12 Mảnh Thánh Kiếm, 3 Megid, Quái 3 Vùng Sách, Cổng Dịch Chuyển & Ngựa
// Quy tắc Asset: Chỉ nạp .glb qua assetManager.instantiate; thiếu file -> Group ẩn kèm collider + ánh sáng/decal shader.
import { getTerrainHeight, getBookContinentAt } from './world.js';

export function createWorldEntities(THREE, world, assetManager, questMgr) {
  const worldData = questMgr.worldData || {};
  const graces = (worldData.graces || []).map((g) => ({
    ...g,
    y: getTerrainHeight(g.x, g.z, 'surface'),
    unlocked: !!g.unlockedByDefault,
  }));

  // Shader đĩa rune phát sáng cho Đài Lửa / Mảnh Kiếm / Đấu trường
  const graceRingMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color(0xf4c45a) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uCol; varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float ring = smoothstep(0.96, 0.84, r) * smoothstep(0.68, 0.80, r);
        float core = smoothstep(0.32, 0.0, r) * (0.65 + 0.35 * sin(uTime * 3.5));
        gl_FragColor = vec4(uCol, clamp(ring * 0.75 + core, 0.0, 0.9));
      }
    `,
  });

  // 9 Đài Lửa Trang Sách
  for (const g of graces) {
    const grp = assetManager.instantiate('env_grace_brazier', { radius: 0.75, height: 1.2 });
    grp.position.set(g.x, g.y, g.z);
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), graceRingMat);
    decal.rotation.x = -Math.PI / 2;
    decal.position.y = 0.06;
    grp.add(decal);
    world.scene.add(grp);
    g.group = grp;
  }

  // NPC từ content/npcs.json
  const npcList = (questMgr.npcs || []).map((n) => {
    const y = getTerrainHeight(n.x, n.z, 'surface');
    const grp = assetManager.instantiate(n.assetKey || 'npc_bookbinder', { radius: 0.55, height: 1.8 });
    grp.position.set(n.x, y, n.z);
    const aura = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), graceRingMat);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.05;
    grp.add(aura);
    world.scene.add(grp);
    return { ...n, y, group: grp };
  });

  // 12 Mảnh Thánh Kiếm (4 mỗi vùng sách)
  const shardMat = graceRingMat.clone();
  shardMat.uniforms.uCol.value.setHex(0x88e6ff);
  const shardPickups = (worldData.sacredShards || []).map((s) => {
    const y = getTerrainHeight(s.x, s.z, 'surface');
    const grp = assetManager.instantiate('weapon_sacred_shard', { radius: 0.5, height: 1.3 });
    grp.position.set(s.x, y, s.z);
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), shardMat);
    decal.rotation.x = -Math.PI / 2;
    decal.position.y = 0.06;
    grp.add(decal);
    world.scene.add(grp);
    return { ...s, y, group: grp, collected: questMgr.progress.collectedShards.has(s.id) };
  });

  // 3 Boss Megid
  const megidBosses = (worldData.megids || []).map((m) => {
    const y = getTerrainHeight(m.x, m.z, 'surface');
    const root = assetManager.instantiate(m.assetKey, { radius: 1.6, height: 4.8 });
    root.position.set(m.x, y, m.z);
    const arenaDecal = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.6), graceRingMat);
    arenaDecal.rotation.x = -Math.PI / 2;
    arenaDecal.position.y = 0.08;
    root.add(arenaDecal);
    world.scene.add(root);

    const defeated = questMgr.progress.defeatedMegids.has(m.id);
    if (defeated) root.visible = false;

    return {
      id: m.id,
      name: m.name,
      bookId: m.bookId,
      homeX: m.x,
      homeZ: m.z,
      arenaRadius: m.arenaRadius || 44,
      rewardRunes: m.rewardRunes || 3500,
      pos: root.position,
      root,
      hp: m.maxHp || 2400,
      maxHp: m.maxHp || 2400,
      ghostHp: m.maxHp || 2400,
      poise: m.maxPoise || 120,
      maxPoise: m.maxPoise || 120,
      bleed: 0,
      maxBleed: 160,
      bleedTimer: 0,
      hurtRadius: 1.65,
      dead: defeated,
      permanentlyDead: defeated,
      active: false,
      phase: 1,
      aiState: 'idle',
      aiTimer: 0,
      attackCooldown: 1.2,
      hudVisibleTimer: 0,
      hitFlashTimer: 0,
      wobbleAxis: new THREE.Vector3(1, 0, 0),
      wobbleVel: 0,
      isMegid: true,
      hasDealtHit: false,
      spec: { runes: m.rewardRunes || 3500 },
    };
  });

  // Quái thường theo 3 vùng Sách
  const regularSpawns = [
    { id: 'e_story_1', type: 'paper_husk', assetKey: 'enemy_paper_husk', name: 'Xác Giấy Mục', x: -1336, z: 1595, hp: 165, poise: 35, dmg: 52, runes: 95 },
    { id: 'e_story_2', type: 'paper_husk', assetKey: 'enemy_paper_husk', name: 'Xác Giấy Mục', x: -1362, z: 1550, hp: 165, poise: 35, dmg: 52, runes: 95 },
    { id: 'e_story_3', type: 'echo_villager', assetKey: 'enemy_echo_villager', name: 'Thôn Dân Lặp Thoại', x: -1195, z: 930, hp: 220, poise: 46, dmg: 64, runes: 140 },
    { id: 'e_story_4', type: 'script_branch', assetKey: 'enemy_script_branch', name: 'Cành Cốt Khắc Chữ', x: -1530, z: 185, hp: 260, poise: 62, dmg: 78, runes: 175 },
    { id: 'e_story_elite', type: 'ink_devourer', assetKey: 'enemy_ink_devourer', name: 'Kẻ Nuốt Mực Cổ', x: -1305, z: -510, hp: 640, poise: 110, dmg: 108, runes: 650, isElite: true },
    { id: 'e_creat_1', type: 'script_branch', assetKey: 'enemy_script_branch', name: 'Dã Thú Rừng Olive', x: -495, z: 1780, hp: 460, poise: 78, dmg: 96, runes: 320 },
    { id: 'e_creat_2', type: 'ink_devourer', assetKey: 'enemy_ink_devourer', name: 'Bò Cạp Cát Đỏ', x: 590, z: 1720, hp: 580, poise: 95, dmg: 118, runes: 460 },
    { id: 'e_myth_1', type: 'script_branch', assetKey: 'enemy_script_branch', name: 'Vệ Binh Đền Rồng', x: 1125, z: -875, hp: 820, poise: 115, dmg: 142, runes: 720 },
    { id: 'e_myth_2', type: 'ink_devourer', assetKey: 'enemy_ink_devourer', name: 'Hộ Vệ Đỉnh Tuyết', x: 1685, z: -1525, hp: 960, poise: 130, dmg: 160, runes: 940 },
  ];

  const enemies = regularSpawns.map((sp) => {
    const y = getTerrainHeight(sp.x, sp.z, 'surface');
    const grp = assetManager.instantiate(sp.assetKey, { radius: sp.isElite ? 1.1 : 0.65, height: sp.isElite ? 3.0 : 1.9 });
    grp.position.set(sp.x, y, sp.z);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(sp.isElite ? 2.6 : 1.5, sp.isElite ? 2.6 : 1.5), shardMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    grp.add(ring);
    world.scene.add(grp);

    return {
      ...sp,
      homeX: sp.x,
      homeZ: sp.z,
      group: grp,
      pos: grp.position,
      maxHp: sp.hp,
      ghostHp: sp.hp,
      maxPoise: sp.poise,
      bleed: 0,
      maxBleed: 120,
      bleedTimer: 0,
      hurtRadius: sp.isElite ? 1.15 : 0.72,
      dead: false,
      permanentlyDead: false,
      aiState: 'idle',
      aiTimer: 0,
      attackCooldown: 1.0,
      hasDealtHit: false,
      hudVisibleTimer: 0,
      hitFlashTimer: 0,
      wobbleAxis: new THREE.Vector3(1, 0, 0),
      wobbleVel: 0,
      spec: { runes: sp.runes },
    };
  });

  // Thú cưỡi Tàn Mã Chỉ Vàng (gắn .glb nếu có, thiếu file thì Group ẩn)
  const mountGroup = assetManager.instantiate('animal_gold_steed', { radius: 0.9, height: 1.65 });
  mountGroup.visible = false;

  const portals = worldData.portals || [];

  function respawnRegularEnemies() {
    for (const e of enemies) {
      if (e.permanentlyDead) continue;
      e.dead = false;
      e.hp = e.maxHp;
      e.ghostHp = e.maxHp;
      e.poise = e.maxPoise;
      e.aiState = 'idle';
      e.pos.set(e.homeX, getTerrainHeight(e.homeX, e.homeZ, 'surface'), e.homeZ);
      e.group.visible = world.activeLayer === 'surface';
    }
  }

  function updateEntities(dt, elapsed, player, onHitPlayer) {
    graceRingMat.uniforms.uTime.value = elapsed;
    shardMat.uniforms.uTime.value = elapsed;

    const pPos = player.root.position;
    const isSurface = world.activeLayer === 'surface';
    const activeTargets = [];
    const nearLights = [];

    // Đèn Đài lửa & Mảnh kiếm
    for (const g of graces) {
      g.group.visible = isSurface;
      if (isSurface && Math.hypot(g.x - pPos.x, g.z - pPos.z) < 60) {
        nearLights.push({ x: g.x, y: g.y, z: g.z, color: g.unlocked ? 0xf6c358 : 0x8f7445, intensity: g.unlocked ? 3.0 : 1.4 });
      }
    }
    for (const s of shardPickups) {
      s.group.visible = isSurface && !s.collected;
      if (s.group.visible && Math.hypot(s.x - pPos.x, s.z - pPos.z) < 50) {
        nearLights.push({ x: s.x, y: s.y, z: s.z, color: 0x72dcff, intensity: 2.2 });
      }
    }
    for (const n of npcList) n.group.visible = isSurface;

    // AI quái thường + Elite (distance culling 95m)
    for (const e of enemies) {
      if (!isSurface || e.dead) { e.group.visible = false; continue; }
      const d = Math.hypot(pPos.x - e.pos.x, pPos.z - e.pos.z);
      if (d > 95) { e.group.visible = false; continue; }
      e.group.visible = true;
      e.ghostHp = THREE.MathUtils.lerp(e.ghostHp, e.hp, 1 - Math.exp(-3.5 * dt));
      if (e.hudVisibleTimer > 0) e.hudVisibleTimer -= dt;
      if (e.attackCooldown > 0) e.attackCooldown -= dt;

      if (e.poise <= 0 && e.aiState !== 'staggered_riposte') {
        e.aiState = 'staggered_riposte';
        e.aiTimer = 2.4;
      }

      if (e.aiState === 'staggered_riposte') {
        e.aiTimer -= dt;
        if (e.aiTimer <= 0) { e.aiState = 'idle'; e.poise = e.maxPoise; }
      } else if (e.aiState === 'windup') {
        e.aiTimer -= dt;
        if (e.aiTimer <= 0) { e.aiState = 'active'; e.aiTimer = 0.22; e.hasDealtHit = false; }
      } else if (e.aiState === 'active') {
        e.aiTimer -= dt;
        if (!e.hasDealtHit && d <= 2.65) {
          e.hasDealtHit = true;
          const res = onHitPlayer(e.dmg, 24, true, e.pos, e.isElite ? 2.0 : 0, false);
          if (res === 'parried') {
            e.aiState = 'staggered_riposte';
            e.aiTimer = 2.6;
            e.poise = 0;
          }
        }
        if (e.aiTimer <= 0) { e.aiState = 'recover'; e.aiTimer = 0.72; }
      } else if (e.aiState === 'recover') {
        e.aiTimer -= dt;
        if (e.aiTimer <= 0) { e.aiState = 'chase'; e.attackCooldown = 0.8; }
      } else if (d < 22) {
        const dx = pPos.x - e.pos.x, dz = pPos.z - e.pos.z;
        e.group.rotation.y = Math.atan2(dx, dz);
        if (d <= 2.35 && e.attackCooldown <= 0) {
          e.aiState = 'windup';
          e.aiTimer = 0.56;
        } else if (d > 1.8) {
          const spd = e.isElite ? 3.5 : 3.9;
          e.pos.x += (dx / d) * spd * dt;
          e.pos.z += (dz / d) * spd * dt;
          e.pos.y = getTerrainHeight(e.pos.x, e.pos.z, 'surface');
        }
      }

      activeTargets.push(e);
    }

    // AI 3 Megid Boss
    let activeBoss = null;
    for (const m of megidBosses) {
      if (!isSurface || m.dead) { m.root.visible = false; continue; }
      const d = Math.hypot(pPos.x - m.pos.x, pPos.z - m.pos.z);
      m.root.visible = d < 160;
      if (!m.active && d < m.arenaRadius - 4) {
        m.active = true;
      }
      if (m.active) {
        activeBoss = m;
        m.ghostHp = THREE.MathUtils.lerp(m.ghostHp, m.hp, 1 - Math.exp(-3.5 * dt));
        if (m.attackCooldown > 0) m.attackCooldown -= dt;
        if (m.hp < m.maxHp * 0.5 && m.phase === 1) m.phase = 2;
        if (m.poise <= 0 && m.aiState !== 'staggered_riposte') {
          m.aiState = 'staggered_riposte';
          m.aiTimer = 2.6;
        }
        const spdMult = m.phase === 2 ? 1.2 : 1.0;
        if (m.aiState === 'staggered_riposte') {
          m.aiTimer -= dt;
          if (m.aiTimer <= 0) { m.aiState = 'chase'; m.poise = m.maxPoise; }
        } else if (m.aiState === 'windup') {
          m.aiTimer -= dt;
          if (m.aiTimer <= 0) { m.aiState = 'active'; m.aiTimer = 0.25; m.hasDealtHit = false; }
        } else if (m.aiState === 'active') {
          m.aiTimer -= dt;
          if (!m.hasDealtHit && d <= 4.8) {
            m.hasDealtHit = true;
            const res = onHitPlayer(95, 38, true, m.pos, 0, false);
            if (res === 'parried') {
              m.aiState = 'staggered_riposte';
              m.aiTimer = 2.8;
              m.poise = 0;
            }
          }
          if (m.aiTimer <= 0) { m.aiState = 'recover'; m.aiTimer = 0.78 / spdMult; }
        } else if (m.aiState === 'recover') {
          m.aiTimer -= dt;
          if (m.aiTimer <= 0) { m.aiState = 'chase'; m.attackCooldown = 0.85 / spdMult; }
        } else {
          const dx = pPos.x - m.pos.x, dz = pPos.z - m.pos.z;
          m.root.rotation.y = Math.atan2(dx, dz);
          if (d <= 4.5 && m.attackCooldown <= 0) {
            m.aiState = 'windup';
            m.aiTimer = 0.68 / spdMult;
          } else if (d > 3.2) {
            m.pos.x += (dx / d) * 4.4 * spdMult * dt;
            m.pos.z += (dz / d) * 4.4 * spdMult * dt;
            m.pos.y = getTerrainHeight(m.pos.x, m.pos.z, 'surface');
          }
        }
        nearLights.push({ x: m.pos.x, y: m.pos.y + 1, z: m.pos.z, color: 0xd9603b, intensity: 3.4 });
        activeTargets.push(m);
      }
    }

    return { activeTargets, activeBoss, nearLights };
  }

  function findNearestInteractable(playerPos) {
    if (world.activeLayer === 'under1') {
      if (Math.hypot(playerPos.x - 2380, playerPos.z + 1420) < 6.0) {
        return { kind: 'layer', targetLayer: 'under2', label: '[E] Xuống Thế Giới Ngầm Tầng II' };
      }
    } else if (world.activeLayer === 'under2') {
      if (Math.hypot(playerPos.x - 2380, playerPos.z + 1420) < 6.0) {
        return { kind: 'layer', targetLayer: 'surface', label: '[E] Trở về Cổng Xoáy Xanh (Mặt Đất)' };
      }
    }

    let best = null;
    let bestDist = 3.8;
    for (const g of graces) {
      const d = Math.hypot(playerPos.x - g.x, playerPos.z - g.z);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'grace', data: g, label: `[E] Nghỉ & Thắp ${g.name}` };
      }
    }
    for (const n of npcList) {
      const d = Math.hypot(playerPos.x - n.x, playerPos.z - n.z);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'npc', data: n, label: `[E] Trò chuyện: ${n.name}` };
      }
    }
    for (const s of shardPickups) {
      if (s.collected) continue;
      const d = Math.hypot(playerPos.x - s.x, playerPos.z - s.z);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'shard', data: s, label: `[E] Nhặt ${s.name}` };
      }
    }
    for (const pt of portals) {
      const d = Math.hypot(playerPos.x - pt.from.x, playerPos.z - pt.from.z);
      if (d < 4.5) {
        bestDist = d;
        best = { kind: 'portal', data: pt, label: `[E] ${pt.label}` };
      }
    }
    return best;
  }

  return {
    graces,
    npcs: npcList,
    shardPickups,
    megidBosses,
    enemies,
    mountGroup,
    respawnRegularEnemies,
    updateEntities,
    findNearestInteractable,
  };
}
