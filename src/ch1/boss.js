import { CH1_CONFIG } from './data.js';

export function createRottingBoss(THREE, world) {
  const cfg = CH1_CONFIG.boss.rottingOne;
  const cx = cfg.arenaCenter.x, cz = cfg.arenaCenter.z;

  const root = new THREE.Group();
  root.position.set(cx, 0, cz - 14);
  world.scene.add(root);

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x2d2822, roughness: 0.9, metalness: 0.08 });
  const fungusMat = new THREE.MeshStandardMaterial({ color: 0x162420, roughness: 0.42, metalness: 0.25, emissive: 0x0a2e22, emissiveIntensity: 0.65 });
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xdfd0ae, emissive: 0x453214, emissiveIntensity: 0.65, side: THREE.DoubleSide });
  const rootBladeMat = new THREE.MeshStandardMaterial({ color: 0x4e4234, roughness: 0.55, metalness: 0.35, emissive: 0x000000 });

  const contactDisc = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 24),
    new THREE.MeshBasicMaterial({ map: world.contactShadowTex, transparent: true, depthWrite: false, opacity: 0.78 })
  );
  contactDisc.rotation.x = -Math.PI / 2; contactDisc.position.y = 0.04;
  root.add(contactDisc);

  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 2.05;
  root.add(bodyPivot);

  // Thân khổng lồ 4.6m rỗng ruột nhồi trang sách rách
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.25, 2.2, 8), barkMat);
  torso.position.y = 0.5;
  const pageCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 1), pageMat);
  pageCore.position.set(0, 0.55, 0.25);

  const head = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.95, 7), barkMat);
  head.position.set(0, 2.15, 0.12); head.rotation.x = 0.25;
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 6, 12), pageMat);
  crown.position.set(0, 2.25, 0.1); crown.rotation.x = Math.PI / 2;

  // Tay phải cầm Đại Kiếm Rễ Cây
  const armR = new THREE.Group(); armR.position.set(1.32, 1.25, 0);
  const limbR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.65, 0.42), barkMat); limbR.position.y = -0.65;
  const sword = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.65, 0.12), rootBladeMat);
  sword.position.set(0, -1.65, 1.35); sword.rotation.x = Math.PI * 0.42;
  armR.add(limbR, sword);

  // Tay trái mọc nấm mực khổng lồ
  const armL = new THREE.Group(); armL.position.set(-1.35, 1.25, 0);
  const limbL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.75, 0.55), fungusMat); limbL.position.y = -0.7;
  const clawOrb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), fungusMat); clawOrb.position.set(0, -1.55, 0.35);
  armL.add(limbL, clawOrb);

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.9, 0.55), barkMat); legL.position.set(-0.58, -1.05, 0);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.9, 0.55), barkMat); legR.position.set(0.58, -1.05, 0);

  bodyPivot.add(torso, pageCore, head, crown, armR, armL, legL, legR);

  // Vòng trang sách mưa & Vũng mực độc Phase 2
  const pageProjectiles = [];
  const inkPools = [];
  const clones = [];
  const pRainGeo = new THREE.PlaneGeometry(0.65, 0.85);
  const poolGeo = new THREE.CircleGeometry(3.4, 20);
  const cloneGeo = new THREE.BoxGeometry(0.75, 1.9, 0.55);

  const state = {
    id: cfg.id,
    name: cfg.name,
    pos: root.position,
    hurtRadius: 1.85,
    hp: cfg.maxHp,
    maxHp: cfg.maxHp,
    ghostHp: cfg.maxHp,
    poise: cfg.maxPoise,
    maxPoise: cfg.maxPoise,
    bleed: 0,
    maxBleed: 140,
    bleedTimer: 0,
    phase: 1,
    active: false,
    dead: false,
    aiState: 'dormant', // dormant | intro | chase | windup | active | recover | phase2_cutscene | staggered_riposte | dead
    aiTimer: 0,
    aiDuration: 0,
    currentMove: null,
    parryableWindow: false,
    hitThisSwing: false,
    introIndex: 0,
    hudVisibleTimer: 0,
    hitFlashTimer: 0,
    wobbleVel: 0,
    wobbleAngle: 0,
    wobbleAxis: new THREE.Vector3(1, 0, 0),
    cutsceneTimer: 0,
    defeatedHandled: false,
  };

  function resetEncounter() {
    if (state.dead) return;
    state.hp = state.ghostHp = state.maxHp;
    state.poise = state.maxPoise;
    state.bleed = 0;
    state.phase = 1;
    state.active = false;
    state.aiState = 'dormant';
    state.aiTimer = 0;
    state.parryableWindow = false;
    root.position.set(cx, 0, cz - 14);
    bodyPivot.position.y = 2.05;
    bodyPivot.rotation.set(0, 0, 0);
    clearHazards();
  }

  function clearHazards() {
    for (const p of pageProjectiles) { world.scene.remove(p.mesh); p.mat.dispose(); }
    pageProjectiles.length = 0;
    for (const ip of inkPools) { world.scene.remove(ip.mesh); ip.mat.dispose(); }
    inkPools.length = 0;
    for (const c of clones) { world.scene.remove(c.group); c.mat.dispose(); }
    clones.length = 0;
  }

  function startEncounter(showSubtitle) {
    if (state.dead || state.active) return;
    state.active = true;
    state.aiState = 'intro';
    state.aiTimer = 0;
    state.introIndex = 0;
    showSubtitle(cfg.introLines[0], 2.2);
  }

  function pickNextMove(dist) {
    const p1 = ['root_cleave', 'overhead_slam', 'lunge_thrust', 'ink_spore_burst', 'fungus_grab', 'backhand_combo'];
    const p2 = [...p1, 'page_rain', 'summon_clones', 'ink_poison_pool', 'triple_finisher'];
    const pool = state.phase === 2 ? p2 : p1;
    if (dist > 9) {
      const ranged = state.phase === 2 ? ['lunge_thrust', 'page_rain', 'ink_poison_pool'] : ['lunge_thrust', 'fungus_grab'];
      return ranged[Math.floor(Math.random() * ranged.length)];
    }
    if (state.phase === 2 && clones.length === 0 && Math.random() < 0.28) return 'summon_clones';
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function spawnPageRain(playerPos) {
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffe4a0, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(pRainGeo, mat);
      const ang = (i / 8) * Math.PI * 2;
      const tx = playerPos.x + Math.cos(ang) * (2.2 + (i % 3) * 2.5);
      const tz = playerPos.z + Math.sin(ang) * (2.2 + (i % 3) * 2.5);
      mesh.position.set(tx, 14 + (i % 4) * 1.8, tz);
      world.scene.add(mesh);
      pageProjectiles.push({ mesh, mat, vy: -14 - (i % 3) * 2, life: 1.5, dmg: 68 });
    }
  }

  function spawnInkPool(tx, tz) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x101d19, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(poolGeo, mat);
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(tx, 0.06, tz);
    world.scene.add(mesh);
    inkPools.push({ mesh, mat, x: tx, z: tz, life: 8.5, tick: 0 });
  }

  function spawnClones() {
    while (clones.length < 2) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x1d2624, emissive: 0x1f4739, emissiveIntensity: 0.9, roughness: 0.5 });
      const grp = new THREE.Group();
      const body = new THREE.Mesh(cloneGeo, mat); body.position.y = 0.95;
      grp.add(body);
      const ang = Math.random() * Math.PI * 2;
      grp.position.set(root.position.x + Math.cos(ang) * 6, 0, root.position.z + Math.sin(ang) * 6);
      world.scene.add(grp);
      clones.push({
        id: `boss_clone_${Date.now()}_${clones.length}`,
        name: 'Bóng Trang Mục',
        group: grp,
        mat,
        pos: grp.position,
        hurtRadius: 0.72,
        hp: 150, maxHp: 150, ghostHp: 150, poise: 30, maxPoise: 30, bleed: 0, maxBleed: 100, bleedTimer: 0,
        dead: false, hudVisibleTimer: 0, hudEl: null, hitFlashTimer: 0,
        wobbleVel: 0, wobbleAngle: 0, wobbleAxis: new THREE.Vector3(1, 0, 0),
        atkCooldown: 1.2 + Math.random() * 0.8,
      });
    }
  }

  function update(dt, elapsed, player, callbacks) {
    const pPos = player.root.position;
    state.ghostHp = THREE.MathUtils.lerp(state.ghostHp, state.hp, 1 - Math.exp(-4.5 * dt));

    if (state.hitFlashTimer > 0) {
      state.hitFlashTimer -= dt;
      const e = state.hitFlashTimer > 0 ? 0.85 : 0;
      barkMat.emissive.setRGB(e, e * 0.65, e * 0.35);
    }

    // Hạt mưa trang sách Phase 2
    for (let i = pageProjectiles.length - 1; i >= 0; i--) {
      const pr = pageProjectiles[i];
      pr.life -= dt;
      pr.mesh.position.y += pr.vy * dt;
      pr.mesh.rotation.x += dt * 7; pr.mesh.rotation.y += dt * 9;
      if (pr.mesh.position.y <= 0.6) {
        if (Math.hypot(pr.mesh.position.x - pPos.x, pr.mesh.position.z - pPos.z) < 1.65) {
          callbacks.onBossHitPlayer(pr.dmg, 22, false, pr.mesh.position, 0);
        }
        world.spawnSparks(pr.mesh.position.x, 0.2, pr.mesh.position.z, 6, 4.5, 0xffe4a0);
        pr.life = 0;
      }
      if (pr.life <= 0) { world.scene.remove(pr.mesh); pr.mat.dispose(); pageProjectiles.splice(i, 1); }
    }

    // Vũng mực độc Phase 2
    for (let i = inkPools.length - 1; i >= 0; i--) {
      const ip = inkPools[i];
      ip.life -= dt; ip.tick -= dt;
      if (Math.hypot(pPos.x - ip.x, pPos.z - ip.z) < 3.4) {
        callbacks.onPlayerInInkPool(dt);
        if (ip.tick <= 0) {
          ip.tick = 0.85;
          callbacks.onBossHitPlayer(24, 0, false, ip.mesh.position, 2.0);
        }
      }
      if (ip.life <= 0) { world.scene.remove(ip.mesh); ip.mat.dispose(); inkPools.splice(i, 1); }
    }

    // Bản sao Bóng Trang Mục Phase 2
    for (let i = clones.length - 1; i >= 0; i--) {
      const c = clones[i];
      c.ghostHp = THREE.MathUtils.lerp(c.ghostHp, c.hp, 1 - Math.exp(-5 * dt));
      if (c.dead || c.hp <= 0) {
        world.spawnSparks(c.pos.x, 1.0, c.pos.z, 12, 6, 0x3ec29e);
        world.scene.remove(c.group); c.mat.dispose();
        if (c.hudEl?.wrap) c.hudEl.wrap.remove();
        clones.splice(i, 1);
        continue;
      }
      const dx = pPos.x - c.pos.x, dz = pPos.z - c.pos.z, d = Math.hypot(dx, dz) || 1;
      c.group.rotation.y = Math.atan2(dx, dz);
      if (d > 1.8) { c.pos.x += (dx / d) * 4.4 * dt; c.pos.z += (dz / d) * 4.4 * dt; }
      c.atkCooldown -= dt;
      if (d <= 2.3 && c.atkCooldown <= 0) {
        c.atkCooldown = 1.6;
        callbacks.onBossHitPlayer(44, 15, true, c.pos, 0);
      }
    }

    if (state.dead) {
      bodyPivot.scale.y = Math.max(0.02, bodyPivot.scale.y - dt * 1.4);
      if (bodyPivot.scale.y <= 0.04) root.visible = false;
      return;
    }

    // Kiểm tra hạ gục
    if (state.hp <= 0 && !state.dead) {
      state.dead = true;
      state.active = false;
      state.aiState = 'dead';
      clearHazards();
      callbacks.onBossDefeated();
      return;
    }

    // Chuyển Phase 2 tại 50% HP
    if (state.phase === 1 && state.hp <= state.maxHp * cfg.phase2Threshold && state.aiState !== 'phase2_cutscene') {
      state.phase = 2;
      state.aiState = 'phase2_cutscene';
      state.cutsceneTimer = 2.2;
      state.parryableWindow = false;
      callbacks.onPhase2Cutscene(cfg.phase2Subtitle);
      world.spawnSparks(root.position.x, 2.4, root.position.z, 40, 11.5, 0xd8f09c);
      return;
    }

    if (state.aiState === 'dormant') {
      pageCore.rotation.y = elapsed * 0.8;
      return;
    }

    if (state.aiState === 'intro') {
      state.aiTimer += dt;
      const dx = pPos.x - root.position.x, dz = pPos.z - root.position.z;
      root.rotation.y = Math.atan2(dx, dz);
      if (state.aiTimer >= 2.0) {
        state.aiTimer = 0;
        state.introIndex += 1;
        if (state.introIndex < cfg.introLines.length) {
          callbacks.showSubtitle(cfg.introLines[state.introIndex], 2.0);
        } else {
          state.aiState = 'chase';
        }
      }
      return;
    }

    if (state.aiState === 'phase2_cutscene') {
      state.cutsceneTimer -= dt;
      bodyPivot.position.y = 2.05 + Math.sin(elapsed * 18) * 0.14;
      armR.rotation.set(-2.4, 0, -0.5);
      armL.rotation.set(-2.4, 0, 0.5);
      fungusMat.emissiveIntensity = 1.8;
      if (state.cutsceneTimer <= 0) {
        state.aiState = 'chase';
        bodyPivot.position.y = 2.05;
        spawnClones();
      }
      return;
    }

    // Kiểm tra Poise Break -> staggered_riposte
    if (state.poise <= 0 && state.aiState !== 'staggered_riposte') {
      state.poise = state.maxPoise;
      state.aiState = 'staggered_riposte';
      state.aiTimer = 0;
      state.aiDuration = 2.6;
      state.parryableWindow = false;
      world.spawnSparks(root.position.x, 2.4, root.position.z, 26, 9, 0xffe082);
    }

    if (state.aiState === 'staggered_riposte') {
      state.aiTimer += dt;
      bodyPivot.position.y = 1.45;
      bodyPivot.rotation.x = 0.35;
      armR.rotation.set(0.3, 0, -0.5);
      if (state.aiTimer >= state.aiDuration) {
        state.aiState = 'chase';
        bodyPivot.position.y = 2.05;
        bodyPivot.rotation.x = 0;
      }
      return;
    }

    const spdMult = state.phase === 2 ? cfg.phase2SpeedMult : 1.0;
    const recMult = state.phase === 2 ? cfg.phase2RecoveryMult : 1.0;
    const dx = pPos.x - root.position.x, dz = pPos.z - root.position.z;
    const dist = Math.hypot(dx, dz) || 1;
    const toPlayerYaw = Math.atan2(dx, dz);

    if (state.aiState === 'chase') {
      root.rotation.y = toPlayerYaw;
      armR.rotation.set(-0.2 + Math.sin(elapsed * 2.5) * 0.08, 0, -0.2);
      armL.rotation.set(-0.15, 0, 0.2);

      if (dist > 5.0) {
        root.position.x += (dx / dist) * 4.1 * spdMult * dt;
        root.position.z += (dz / dist) * 4.1 * spdMult * dt;
      }
      if (dist < 6.2 || Math.random() < dt * 0.9) {
        const moveKey = pickNextMove(dist);
        state.currentMove = { key: moveKey, ...cfg.moves[moveKey] };
        state.aiState = 'windup';
        state.aiTimer = 0;
        state.aiDuration = state.currentMove.windup / spdMult;
        state.hitThisSwing = false;
      }
    } else if (state.aiState === 'windup') {
      state.aiTimer += dt;
      root.rotation.y = toPlayerYaw;
      const wp = Math.min(1, state.aiTimer / state.aiDuration);
      armR.rotation.set(-2.1 * wp, 0, -0.45 * wp);
      armL.rotation.set(-1.3 * wp, 0, 0.35 * wp);
      rootBladeMat.emissive.setRGB(wp * 0.85, wp * (state.currentMove.parryable ? 0.58 : 0.2), 0.05);
      state.parryableWindow = !!state.currentMove.parryable && wp > 0.62;
      if (state.aiTimer >= state.aiDuration) {
        state.aiState = 'active';
        state.aiTimer = 0;
        state.aiDuration = state.currentMove.active / spdMult;
      }
    } else if (state.aiState === 'active') {
      state.aiTimer += dt;
      const ap = Math.min(1, state.aiTimer / state.aiDuration);
      const mv = state.currentMove;
      rootBladeMat.emissive.setHex(0x000000);
      state.parryableWindow = !!mv.parryable;

      // Lao tới khi đâm hoặc vồ
      if (mv.key === 'lunge_thrust' || mv.key === 'fungus_grab' || mv.key === 'triple_finisher') {
        const fX = Math.sin(root.rotation.y), fZ = Math.cos(root.rotation.y);
        root.position.x += fX * 10.5 * spdMult * dt;
        root.position.z += fZ * 10.5 * spdMult * dt;
      }
      armR.rotation.set(-2.1 + 2.9 * ap, 0, 0.3);
      armL.rotation.set(-1.3 + 2.1 * ap, 0, -0.2);

      if (!state.hitThisSwing) {
        if (mv.key === 'page_rain') {
          state.hitThisSwing = true;
          spawnPageRain(pPos);
        } else if (mv.key === 'summon_clones') {
          state.hitThisSwing = true;
          spawnClones();
        } else if (mv.key === 'ink_poison_pool') {
          state.hitThisSwing = true;
          spawnInkPool(pPos.x, pPos.z);
          spawnInkPool(pPos.x + 5, pPos.z - 4);
        } else if (mv.key === 'ink_spore_burst' || mv.key === 'overhead_slam') {
          if (ap > 0.35) {
            state.hitThisSwing = true;
            world.spawnSparks(root.position.x, 0.8, root.position.z, 26, 9, mv.key === 'ink_spore_burst' ? 0x3ec29e : 0xdab86b);
            if (dist <= (mv.aoeRadius || mv.range)) {
              callbacks.onBossHitPlayer(mv.dmg, mv.poiseDmg, false, root.position, mv.key === 'ink_spore_burst' ? 3.5 : 0);
            }
          }
        } else if (dist <= mv.range) {
          state.hitThisSwing = true;
          const res = callbacks.onBossHitPlayer(mv.dmg, mv.poiseDmg, !!mv.parryable, root.position, mv.unblockable ? 3.0 : 0, !!mv.unblockable);
          if (res === 'parried') {
            state.aiState = 'staggered_riposte';
            state.aiTimer = 0;
            state.aiDuration = 2.6;
            state.parryableWindow = false;
            return;
          }
        }
      }

      if (state.aiTimer >= state.aiDuration) {
        state.aiState = 'recover';
        state.aiTimer = 0;
        state.aiDuration = mv.recovery * recMult;
        state.parryableWindow = false;
      }
    } else if (state.aiState === 'recover') {
      state.aiTimer += dt;
      armR.rotation.x = THREE.MathUtils.lerp(armR.rotation.x, -0.2, 0.14);
      armL.rotation.x = THREE.MathUtils.lerp(armL.rotation.x, -0.15, 0.14);
      if (state.aiTimer >= state.aiDuration) {
        state.aiState = 'chase';
      }
    }

    // Giữ Boss trong đấu trường R = 38m
    const adx = root.position.x - cx, adz = root.position.z - cz;
    const ad = Math.hypot(adx, adz);
    if (ad > cfg.arenaRadius - 2.2) {
      root.position.x = cx + (adx / ad) * (cfg.arenaRadius - 2.2);
      root.position.z = cz + (adz / ad) * (cfg.arenaRadius - 2.2);
    }
  }

  return {
    root,
    state,
    clones,
    startEncounter,
    resetEncounter,
    update,
  };
}
