import { CH1_CONFIG, getTerrainHeight, getWalkableHeight } from './data.js';

export function createWorldEntities(THREE, world, isSoftwareGl) {
  const interactables = [];

  // 1. 5 Đài Lửa Trang Sách (Graces)
  const emberMat = new THREE.MeshStandardMaterial({ color: 0xffa838, emissive: 0xff7018, emissiveIntensity: 2.1, roughness: 0.35 });
  const graceStoneMat = new THREE.MeshStandardMaterial({ color: 0x353238, roughness: 0.85, metalness: 0.18 });
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xebdcb8, emissive: 0x553b16, emissiveIntensity: 0.6, side: THREE.DoubleSide });

  const graces = CH1_CONFIG.graces.map((g) => {
    const gy = getTerrainHeight(g.x, g.z);
    const grp = new THREE.Group();
    grp.position.set(g.x, gy, g.z);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.15, 0.4, 8), graceStoneMat);
    base.position.y = 0.2;
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.52), pageMat);
    book.position.y = 0.52; book.rotation.x = 0.25;
    const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), emberMat);
    flame.position.y = 1.05;
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.32, 24), new THREE.MeshBasicMaterial({ color: 0xe6be68, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04;
    grp.add(base, book, flame, ring);
    world.scene.add(grp);

    return {
      ...g, y: gy, group: grp, flame, ring,
      unlocked: !!g.unlockedByDefault,
    };
  });

  // 2. 3 NPCs
  const npcMeshes = CH1_CONFIG.npcs.map((n, idx) => {
    const gy = getTerrainHeight(n.x, n.z);
    const grp = new THREE.Group();
    grp.position.set(n.x, gy, n.z);
    const robeCol = idx === 0 ? 0x4b3b2c : (idx === 1 ? 0x2d2d34 : 0xd2d6dc);
    const trimCol = idx === 2 ? 0xd9c28c : 0x8f7448;
    const robeMat = new THREE.MeshStandardMaterial({ color: robeCol, roughness: 0.88 });
    const trimMat = new THREE.MeshStandardMaterial({ color: trimCol, roughness: 0.45, metalness: 0.5 });

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 16),
      new THREE.MeshBasicMaterial({ map: world.contactShadowTex, transparent: true, depthWrite: false, opacity: 0.65 })
    );
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.02;
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.45, 8), robeMat);
    body.position.y = 0.72;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), trimMat);
    head.position.y = 1.6;
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.38, 7), robeMat);
    hat.position.y = 1.82;
    grp.add(disc, body, head, hat);
    world.scene.add(grp);
    return { ...n, y: gy, group: grp };
  });

  // 3. 4 Bia đá Lore
  const steleMat = new THREE.MeshStandardMaterial({ color: 0x3b3d44, roughness: 0.78, metalness: 0.16 });
  const runeGlowMat = new THREE.MeshBasicMaterial({ color: 0xd9b86c, transparent: true, opacity: 0.75 });
  const steles = CH1_CONFIG.loreSteles.map((st) => {
    const gy = getTerrainHeight(st.x, st.z);
    const grp = new THREE.Group(); grp.position.set(st.x, gy, st.z);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.25, 0.36), steleMat); slab.position.y = 1.12;
    const rune = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.36, 6), runeGlowMat); rune.position.set(0, 1.35, 0.19);
    grp.add(slab, rune);
    world.scene.add(grp);
    return { ...st, y: gy, group: grp };
  });

  // 4. Vật phẩm nhặt ngoài thế giới (Loot Pickups)
  const towerGroundY = getTerrainHeight(-340, -300);
  const pickupDefs = [
    { id: 'pk_dagger', itemId: 'ink_rust_dagger', x: -16, z: 604, y: getTerrainHeight(-16, 604) },
    { id: 'pk_reins', itemId: 'old_paper_reins', x: -326, z: 252, y: getTerrainHeight(-326, 252) },
    { id: 'pk_cloak', itemId: 'moss_cloak', x: 334, z: 146, y: getTerrainHeight(334, 146) },
    { id: 'pk_chalk', itemId: 'gold_chalk_powder', x: 382, z: -220, y: getTerrainHeight(382, -220), qty: 2 },
    { id: 'pk_talisman', itemId: 'dry_paper_talisman', x: -302, z: -266, y: getTerrainHeight(-302, -266), qty: 2 },
    { id: 'pk_truth_sword', itemId: 'truth_remnant_sword', x: -340, z: -300, y: towerGroundY + 9.85, isChest: true },
  ];
  const pickups = pickupDefs.map((pk) => {
    const grp = new THREE.Group(); grp.position.set(pk.x, pk.y, pk.z);
    if (pk.isChest) {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.72), graceStoneMat);
      chest.position.y = 0.32;
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.12, 0.76), emberMat);
      band.position.y = 0.56;
      grp.add(chest, band);
    }
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshBasicMaterial({ color: pk.isChest ? 0xffe082 : 0xa6e3ff })
    );
    orb.position.y = pk.isChest ? 1.08 : 0.65;
    grp.add(orb);
    world.scene.add(grp);
    return { ...pk, group: grp, orb, looted: false };
  });

  // 5. Mô hình Ngựa Tàn Mã Chỉ Vàng gắn dưới người chơi khi cưỡi
  const mountGroup = new THREE.Group();
  {
    const horseMat = new THREE.MeshStandardMaterial({ color: 0x3b3530, roughness: 0.75, metalness: 0.18 });
    const spectralTrim = new THREE.MeshStandardMaterial({ color: 0xc9a66b, emissive: 0x5c4218, emissiveIntensity: 0.8 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.62, 1.78), horseMat); torso.position.y = 1.05;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.78, 0.38), horseMat); neck.position.set(0, 1.55, 0.78); neck.rotation.x = 0.45;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.62), spectralTrim); head.position.set(0, 1.88, 1.06); head.rotation.x = 0.3;
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.64), spectralTrim); saddle.position.set(0, 1.38, 0);
    mountGroup.add(torso, neck, head, saddle);
    for (const lx of [-0.24, 0.24]) {
      for (const lz of [-0.66, 0.66]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.92, 0.14), horseMat);
        leg.position.set(lx, 0.46, lz);
        mountGroup.add(leg);
      }
    }
  }
  mountGroup.visible = false;

  // 6. Quái thường (3 loại) & Elite Đầm Mực (Kẻ Nuốt Mực Cổ)
  const enemyPlacements = [
    // Bãi Trang Rách
    { type: 'paper_husk', x: -10, z: 575 },
    { type: 'paper_husk', x: 14, z: 562 },
    { type: 'paper_husk', x: -24, z: 510 },
    // Rừng Chữ Úa
    { type: 'paper_husk', x: -280, z: 320 },
    { type: 'script_branch', x: -355, z: 210 },
    { type: 'script_branch', x: -395, z: 275 },
    { type: 'paper_husk', x: -310, z: 195 },
    // Làng Bìa Cũ
    { type: 'echo_villager', x: 295, z: 150 },
    { type: 'echo_villager', x: 342, z: 168 },
    { type: 'echo_villager', x: 318, z: 122 },
    { type: 'paper_husk', x: 260, z: 210 },
    // Đầm Mực + Elite
    { type: 'paper_husk', x: 375, z: -215 },
    { type: 'script_branch', x: 455, z: -245 },
    { type: 'ink_devourer', x: 420, z: -285 },
    // Tháp Trang Sách Gãy & Đường lên Hố Khởi Nguyên
    { type: 'script_branch', x: -338, z: -255 },
    { type: 'echo_villager', x: -322, z: -332 },
    { type: 'script_branch', x: 24, z: -480 },
    { type: 'echo_villager', x: -22, z: -530 },
  ];

  function buildEnemyMesh(type, scale) {
    const grp = new THREE.Group();
    const bodyCol = type === 'ink_devourer' ? 0x0d1014 : (type === 'script_branch' ? 0x4b4232 : (type === 'echo_villager' ? 0x5c4b3c : 0xb8ad93));
    const accentCol = type === 'ink_devourer' ? 0x3ec29e : (type === 'script_branch' ? 0xc9a66b : 0x8d2a2e);
    const matA = new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.72, metalness: 0.14 });
    const matB = new THREE.MeshStandardMaterial({ color: accentCol, roughness: 0.45, emissive: 0x000000 });

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.75 * scale, 16),
      new THREE.MeshBasicMaterial({ map: world.contactShadowTex, transparent: true, depthWrite: false, opacity: 0.65 })
    );
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.03; grp.add(disc);

    const swingPivot = new THREE.Group(); swingPivot.position.y = 0.9 * scale; grp.add(swingPivot);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56 * scale, 0.85 * scale, 0.36 * scale), matA);
    torso.position.y = 0.2 * scale;
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24 * scale, 0), matB);
    head.position.y = 0.82 * scale;
    const armR = new THREE.Group(); armR.position.set(0.38 * scale, 0.48 * scale, 0);
    const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.14 * scale, 1.05 * scale, 0.14 * scale), matB);
    weapon.position.set(0, -0.32 * scale, 0.35 * scale); weapon.rotation.x = Math.PI * 0.35;
    armR.add(weapon);

    const armL = new THREE.Group(); armL.position.set(-0.38 * scale, 0.48 * scale, 0);
    const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16 * scale, 0.68 * scale, 0.16 * scale), matA);
    armLMesh.position.y = -0.32 * scale;
    armL.add(armLMesh);

    swingPivot.add(torso, head, armR, armL);
    return { grp, swingPivot, armR, armL, mats: [matA, matB] };
  }

  const enemies = enemyPlacements.map((ep, idx) => {
    const spec = CH1_CONFIG.enemies[ep.type];
    const visual = buildEnemyMesh(ep.type, spec.scale);
    const spawnY = getTerrainHeight(ep.x, ep.z);
    visual.grp.position.set(ep.x, spawnY, ep.z);
    world.scene.add(visual.grp);

    return {
      id: `enemy_${ep.type}_${idx}`,
      type: ep.type,
      name: spec.name,
      isElite: !!spec.isElite,
      spec,
      group: visual.grp,
      swingPivot: visual.swingPivot,
      armR: visual.armR,
      armL: visual.armL,
      mats: visual.mats,
      pos: visual.grp.position,
      spawnPos: new THREE.Vector3(ep.x, spawnY, ep.z),
      hurtRadius: 0.78 * spec.scale,
      hp: spec.hp,
      maxHp: spec.hp,
      ghostHp: spec.hp,
      poise: spec.poise,
      maxPoise: spec.poise,
      bleed: 0,
      maxBleed: 100,
      bleedTimer: 0,
      dead: false,
      permanentlyDead: false,
      aiState: 'idle', // idle | chase | windup | active | recover | staggered_riposte
      aiTimer: 0,
      aiDuration: 0,
      moveKind: 'slash',
      parryableWindow: false,
      hitPlayerThisSwing: false,
      hudVisibleTimer: 0,
      hudEl: null,
      hitFlashTimer: 0,
      wobbleVel: 0,
      wobbleAngle: 0,
      wobbleAxis: new THREE.Vector3(1, 0, 0),
    };
  });

  // Đạn mực từ Thôn Dân Lặp Thoại & Kẻ Nuốt Mực Cổ
  const enemyShots = [];
  const inkShotGeo = new THREE.SphereGeometry(0.22, 8, 8);
  function spawnEnemyInkShot(x, y, z, dx, dy, dz, dmg, slowSec) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a2826 });
    const mesh = new THREE.Mesh(inkShotGeo, mat);
    mesh.position.set(x, y, z);
    world.scene.add(mesh);
    enemyShots.push({ mesh, mat, vx: dx * 13, vy: dy * 13, vz: dz * 13, life: 2.2, dmg, slowSec });
  }

  function respawnRegularEnemies() {
    for (const e of enemies) {
      if (e.isElite && e.permanentlyDead) continue;
      e.dead = false;
      e.hp = e.ghostHp = e.maxHp;
      e.poise = e.maxPoise;
      e.bleed = 0;
      e.aiState = 'idle';
      e.aiTimer = 0;
      e.pos.copy(e.spawnPos);
      e.swingPivot.scale.set(1, 1, 1);
      e.group.visible = true;
    }
  }

  function updateEntities(dt, elapsed, player, onEnemyHitPlayer, onEliteDefeated) {
    const pPos = player.root.position;

    // Xoay lửa Grace & đá nhặt đồ
    for (const g of graces) {
      g.flame.rotation.y = elapsed * 1.4;
      g.flame.scale.setScalar(g.unlocked ? 1.1 + Math.sin(elapsed * 6) * 0.14 : 0.65);
      g.ring.rotation.z = elapsed * 0.35;
    }
    for (const pk of pickups) {
      if (!pk.looted) {
        pk.orb.position.y = (pk.isChest ? 1.08 : 0.65) + Math.sin(elapsed * 2.8) * 0.12;
        pk.orb.rotation.y = elapsed * 1.6;
      }
    }
    for (const n of npcMeshes) {
      n.group.rotation.y = Math.atan2(pPos.x - n.x, pPos.z - n.z);
    }

    // Đạn mực kẻ địch
    for (let i = enemyShots.length - 1; i >= 0; i--) {
      const s = enemyShots[i];
      s.life -= dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      const d = Math.hypot(s.mesh.position.x - pPos.x, s.mesh.position.z - pPos.z);
      if (d < 0.85 && Math.abs(s.mesh.position.y - (pPos.y + 1.0)) < 1.2) {
        onEnemyHitPlayer(s.dmg, 18, false, s.mesh.position, s.slowSec);
        s.life = 0;
      }
      if (s.life <= 0) {
        world.scene.remove(s.mesh); s.mat.dispose(); enemyShots.splice(i, 1);
      }
    }

    // Cập nhật Quái trong bán kính 95m
    const activeList = [];
    for (const e of enemies) {
      e.ghostHp = THREE.MathUtils.lerp(e.ghostHp, e.hp, 1 - Math.exp(-5.0 * dt));
      if (e.hudVisibleTimer > 0) e.hudVisibleTimer = Math.max(0, e.hudVisibleTimer - dt);
      if (e.bleedTimer > 0) e.bleedTimer -= dt;
      else if (e.bleed > 0) e.bleed = Math.max(0, e.bleed - 12 * dt);

      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
        const em = e.hitFlashTimer > 0 ? 0.8 : 0;
        e.mats[0].emissive.setRGB(em, em * 0.7, em * 0.4);
      }
      const accel = -130 * e.wobbleAngle - 9.0 * e.wobbleVel;
      e.wobbleVel += accel * dt; e.wobbleAngle += e.wobbleVel * dt;
      e.swingPivot.quaternion.setFromAxisAngle(e.wobbleAxis, e.wobbleAngle);

      if (e.dead) {
        e.swingPivot.scale.y = Math.max(0.02, e.swingPivot.scale.y - dt * 2.8);
        if (e.swingPivot.scale.y <= 0.03) e.group.visible = false;
        continue;
      }

      const dist = Math.hypot(pPos.x - e.pos.x, pPos.z - e.pos.z);
      if (dist > 95) {
        e.group.visible = false;
        continue;
      }
      e.group.visible = true;
      activeList.push(e);

      // Kiểm tra phá vỡ Poise -> staggered_riposte
      if (e.poise <= 0 && e.aiState !== 'staggered_riposte') {
        e.poise = e.maxPoise;
        e.aiState = 'staggered_riposte';
        e.aiTimer = 0;
        e.aiDuration = 2.6;
        e.parryableWindow = false;
        world.spawnSparks(e.pos.x, e.pos.y + 1.3, e.pos.z, 18, 7.5, 0xffd27a);
      }

      if (e.aiState === 'staggered_riposte') {
        e.aiTimer += dt;
        e.swingPivot.rotation.x = 0.38;
        e.armR.rotation.set(0.4, 0, -0.5);
        if (e.aiTimer >= e.aiDuration) {
          e.aiState = 'idle';
          e.swingPivot.rotation.x = 0;
        }
        continue;
      }

      const dx = pPos.x - e.pos.x, dz = pPos.z - e.pos.z;
      const toPlayerYaw = Math.atan2(dx, dz);

      if (e.aiState === 'idle') {
        e.armR.rotation.set(-0.2, 0, -0.15);
        e.armL.rotation.set(-0.2, 0, 0.15);
        if (dist < e.spec.aggroRange && player.state.stealthTimer <= 0) {
          e.aiState = 'chase';
        }
      } else if (e.aiState === 'chase') {
        e.group.rotation.y = toPlayerYaw;
        if (dist > e.spec.aggroRange * 1.6) {
          e.aiState = 'idle';
        } else if (dist <= e.spec.attackRange) {
          e.aiState = 'windup'; e.aiTimer = 0; e.hitPlayerThisSwing = false;
          if (e.type === 'echo_villager' && Math.random() < 0.35) {
            e.moveKind = 'throw_ink'; e.aiDuration = 0.58;
          } else if (e.type === 'ink_devourer') {
            const r = Math.random();
            e.moveKind = r < 0.38 ? 'shock_slam' : (r < 0.7 ? 'ink_spray' : 'grab_lunge');
            e.aiDuration = e.moveKind === 'grab_lunge' ? 0.72 : 0.65;
          } else {
            e.moveKind = 'slash';
            e.aiDuration = e.type === 'script_branch' ? 0.62 : 0.48;
          }
        } else if (e.type === 'echo_villager' && dist < 11 && dist > 6.5 && Math.random() < dt * 0.45) {
          e.aiState = 'windup'; e.aiTimer = 0; e.moveKind = 'throw_ink'; e.aiDuration = 0.55; e.hitPlayerThisSwing = false;
        } else {
          const nx = dx / (dist || 1), nz = dz / (dist || 1);
          e.pos.x += nx * e.spec.speed * dt;
          e.pos.z += nz * e.spec.speed * dt;
          e.pos.y = getWalkableHeight(e.pos.x, e.pos.z, e.pos.y);
        }
      } else if (e.aiState === 'windup') {
        e.aiTimer += dt;
        e.group.rotation.y = toPlayerYaw;
        const wp = Math.min(1, e.aiTimer / e.aiDuration);
        e.armR.rotation.set(-1.9 * wp, 0, -0.35 * wp);
        e.mats[1].emissive.setRGB(0.65 * wp, 0.25 * wp, 0.05);
        e.parryableWindow = wp > 0.58 && e.moveKind === 'slash';
        if (e.aiTimer >= e.aiDuration) {
          e.aiState = 'active'; e.aiTimer = 0; e.aiDuration = 0.22;
        }
      } else if (e.aiState === 'active') {
        e.aiTimer += dt;
        const ap = Math.min(1, e.aiTimer / e.aiDuration);
        e.armR.rotation.set(-1.9 + 2.6 * ap, 0, 0.2);
        e.mats[1].emissive.setHex(0x000000);
        e.parryableWindow = e.moveKind === 'slash';

        if (!e.hitPlayerThisSwing) {
          if (e.moveKind === 'throw_ink') {
            e.hitPlayerThisSwing = true;
            const d = Math.hypot(dx, dz) || 1;
            spawnEnemyInkShot(e.pos.x, e.pos.y + 1.3, e.pos.z, dx / d, 0.02, dz / d, 42, 4.0);
          } else if (e.moveKind === 'ink_spray') {
            e.hitPlayerThisSwing = true;
            const d = Math.hypot(dx, dz) || 1;
            for (const ang of [-0.22, 0, 0.22]) {
              const ca = Math.cos(ang), sa = Math.sin(ang);
              const vx = (dx / d) * ca - (dz / d) * sa, vz = (dx / d) * sa + (dz / d) * ca;
              spawnEnemyInkShot(e.pos.x, e.pos.y + 1.4, e.pos.z, vx, 0, vz, 64, 5.0);
            }
          } else if (dist <= e.spec.attackRange + (e.moveKind === 'shock_slam' ? 1.8 : 0.6)) {
            e.hitPlayerThisSwing = true;
            const res = onEnemyHitPlayer(e.spec.dmg, e.spec.poiseDmg, e.parryableWindow, e.pos, e.isElite ? 2.5 : 0);
            if (res === 'parried') {
              e.aiState = 'staggered_riposte';
              e.aiTimer = 0;
              e.aiDuration = 2.6;
              e.parryableWindow = false;
              continue;
            }
          }
        }
        if (e.aiTimer >= e.aiDuration) {
          e.aiState = 'recover'; e.aiTimer = 0;
          e.aiDuration = e.type === 'echo_villager' ? 0.85 : (e.isElite ? 0.9 : 0.68);
          e.parryableWindow = false;
        }
      } else if (e.aiState === 'recover') {
        e.aiTimer += dt;
        e.armR.rotation.x = THREE.MathUtils.lerp(e.armR.rotation.x, -0.2, 0.14);
        if (e.aiTimer >= e.aiDuration) {
          e.aiState = 'chase';
        }
      }
    }

    return activeList;
  }

  function findNearestInteractable(playerPos) {
    let best = null, bestDist = 3.3;
    for (const g of graces) {
      const d = Math.hypot(playerPos.x - g.x, playerPos.z - g.z);
      if (d < bestDist && !(g.bossLocked && !g.unlocked)) {
        bestDist = d;
        best = { kind: 'grace', data: g, label: `[E] Nghỉ & Thắp ${g.name}` };
      }
    }
    for (const n of npcMeshes) {
      const d = Math.hypot(playerPos.x - n.x, playerPos.z - n.z);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'npc', data: n, label: `[E] Trò chuyện: ${n.name}` };
      }
    }
    for (const pk of pickups) {
      if (pk.looted) continue;
      const d = Math.hypot(playerPos.x - pk.x, playerPos.z - pk.z) + Math.abs(playerPos.y - pk.y) * 0.7;
      if (d < bestDist) {
        bestDist = d;
        const item = CH1_CONFIG.items[pk.itemId];
        best = { kind: 'pickup', data: pk, label: `[E] Nhặt ${item ? item.name : pk.itemId}` };
      }
    }
    for (const st of steles) {
      const d = Math.hypot(playerPos.x - st.x, playerPos.z - st.z);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'stele', data: st, label: `[E] Đọc ${st.title}` };
      }
    }
    return best;
  }

  return {
    graces,
    npcs: npcMeshes,
    steles,
    pickups,
    enemies,
    mountGroup,
    interactables,
    respawnRegularEnemies,
    updateEntities,
    findNearestInteractable,
    unlockAllLootFromSave(lootedIds) {
      for (const pk of pickups) {
        if (lootedIds.includes(pk.id)) {
          pk.looted = true;
          pk.orb.visible = false;
        }
      }
    },
  };
}
