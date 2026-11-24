import { CH1_CONFIG, getTerrainHeight, isInInkSwamp, getDryRiverCenterX } from './data.js';

const SAVE_KEY = 'ashen_oath_ch1_save_v1';

export function loadChapter1Save() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function writeChapter1Save(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function createChapter1UI(callbacks) {
  // Chèn các phần tử UI Chương 1 vào DOM một lần
  const style = document.createElement('style');
  style.textContent = `
    #ch1-intro-overlay, #ch1-epilogue-overlay {
      position: fixed; inset: 0; z-index: 48; display: none; flex-direction: column;
      align-items: center; justify-content: center; text-align: center;
      padding: 28px; background: #070609; color: #e8dac0;
    }
    #ch1-intro-overlay.visible, #ch1-epilogue-overlay.visible { display: flex; }
    .ch1-prose-box { max-width: 680px; display: flex; flex-direction: column; gap: 16px; }
    .ch1-prose-title { font-family: 'Cinzel', Georgia, serif; font-size: clamp(1.25rem, 2.5vw, 1.8rem); letter-spacing: 0.2em; color: #d8b874; margin: 0 0 6px; }
    .ch1-prose-p { margin: 0; font-size: clamp(1.02rem, 1.8vw, 1.24rem); line-height: 1.62; color: rgba(236,224,198,0.92); opacity: 0; transition: opacity 900ms ease; }
    .ch1-prose-p.shown { opacity: 1; }
    .ch1-prose-actions { margin-top: 14px; display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

    #hud-compass {
      position: fixed; top: calc(14px + var(--safe-top)); left: 50%; transform: translateX(-50%);
      width: min(360px, 52vw); height: 28px; background: rgba(10,9,10,0.78);
      border: 1px solid rgba(164,136,86,0.48); overflow: hidden; pointer-events: none;
      display: flex; align-items: center; justify-content: center;
    }
    #hud-compass-inner { position: relative; width: 100%; height: 100%; }
    .compass-tick {
      position: absolute; top: 5px; transform: translateX(-50%);
      font-family: 'Cinzel', Georgia, serif; font-size: 0.72rem; letter-spacing: 0.08em; color: #d8c49a;
    }
    .compass-pin {
      position: absolute; top: 17px; transform: translateX(-50%);
      width: 7px; height: 7px; border-radius: 50%;
    }
    #hud-zone-badge {
      position: fixed; top: calc(46px + var(--safe-top)); left: 50%; transform: translateX(-50%);
      font-family: 'Cinzel', Georgia, serif; font-size: 0.72rem; letter-spacing: 0.14em;
      color: rgba(226,208,172,0.82); text-shadow: 0 1px 4px #000; pointer-events: none; white-space: nowrap;
    }

    #hud-boss-wrap {
      position: fixed; bottom: calc(58px + var(--safe-bottom)); left: 50%; transform: translateX(-50%);
      width: min(620px, 78vw); display: none; flex-direction: column; gap: 4px; pointer-events: none; z-index: 14;
    }
    #hud-boss-wrap.visible { display: flex; }
    #hud-boss-name { font-family: 'Cinzel', Georgia, serif; font-size: 0.92rem; letter-spacing: 0.14em; color: #f2e2be; text-shadow: 0 1px 4px #000; }
    #hud-boss-track { position: relative; height: 12px; background: rgba(10,8,8,0.9); border: 1px solid rgba(182,152,98,0.75); overflow: hidden; }
    #hud-boss-ghost { position: absolute; inset: 0; background: #d4a44e; transform-origin: left center; }
    #hud-boss-fill { position: absolute; inset: 0; background: linear-gradient(180deg, #b82b32 0%, #7c181d 100%); transform-origin: left center; }

    #hud-interact-prompt {
      position: fixed; bottom: calc(114px + var(--safe-bottom)); left: 50%; transform: translateX(-50%);
      padding: 8px 18px; background: rgba(12,10,9,0.88); border: 1px solid rgba(201,166,107,0.68);
      font-family: 'Cinzel', Georgia, serif; font-size: 0.84rem; letter-spacing: 0.08em; color: #f5e6c4;
      display: none; pointer-events: auto; cursor: pointer; z-index: 16;
    }
    #hud-interact-prompt.visible { display: block; }

    #hud-subtitle {
      position: fixed; bottom: calc(154px + var(--safe-bottom)); left: 50%; transform: translateX(-50%);
      max-width: min(660px, 88vw); padding: 8px 20px; background: rgba(8,7,9,0.86);
      border-top: 1px solid rgba(182,152,98,0.45); border-bottom: 1px solid rgba(182,152,98,0.45);
      font-size: 1.05rem; color: #efe2c6; text-align: center; display: none; pointer-events: none; z-index: 24;
    }
    #hud-subtitle.visible { display: block; }

    #hud-status-chips {
      position: fixed; top: calc(104px + var(--safe-top)); left: calc(22px + var(--safe-left));
      display: flex; flex-direction: column; gap: 4px; pointer-events: none; font-size: 0.8rem; color: #e2cfa4;
    }
    @media (max-width: 960px) {
      #hud-compass { width: min(200px, 32vw); top: calc(10px + var(--safe-top)); }
      #hud-zone-badge { top: calc(40px + var(--safe-top)); font-size: 0.65rem; }
      #hud-status-chips { top: calc(64px + var(--safe-top)); left: calc(16px + var(--safe-left)); font-size: 0.72rem; }
    }
    body.touch-active #hud-status-chips { top: calc(64px + var(--safe-top)); left: calc(108px + var(--safe-left)); max-width: 220px; font-size: 0.7rem; }
    body.touch-active #hud-compass { width: min(200px, 32vw); top: calc(10px + var(--safe-top)); }
    body.touch-active #hud-zone-badge { top: calc(40px + var(--safe-top)); font-size: 0.65rem; }
    body.touch-active #hud-boss-wrap { bottom: calc(22px + var(--safe-bottom)); width: min(360px, 60vw); }

    .ch1-modal {
      position: fixed; inset: 0; z-index: 44; display: none; align-items: center; justify-content: center;
      padding: 20px; background: rgba(6,5,8,0.82);
    }
    .ch1-modal.visible { display: flex; }
    .ch1-modal-card {
      width: min(820px, 94vw); max-height: 86vh; overflow-y: auto;
      background: rgba(14,12,11,0.96); border: 1px solid rgba(182,152,98,0.62);
      padding: 18px 22px; color: #e8dac0; box-shadow: 0 18px 44px rgba(0,0,0,0.9);
    }
    .ch1-modal-head {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      border-bottom: 1px solid rgba(164,136,86,0.32); padding-bottom: 10px; margin-bottom: 14px;
    }
    .ch1-modal-head h2 { margin: 0; font-family: 'Cinzel', Georgia, serif; font-size: 1.08rem; letter-spacing: 0.16em; color: #d8b670; }
    .ch1-list-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 9px 6px; border-bottom: 1px solid rgba(255,255,255,0.07); font-size: 0.96rem;
    }
    #ch1-map-canvas { width: 100%; max-width: min(440px, 56vh); height: auto; border: 1px solid rgba(182,152,98,0.55); display: block; margin: 0 auto; cursor: crosshair; }

    .touch-btn-parry { width: 58px; height: 58px; border-color: rgba(232,190,104,0.82); }
    .touch-btn-mini { width: 46px; height: 46px; font-size: 0.62rem; }
  `;
  document.head.appendChild(style);

  // Intro & Epilogue Overlays
  const introEl = document.createElement('section');
  introEl.id = 'ch1-intro-overlay';
  introEl.innerHTML = `
    <div class="ch1-prose-box">
      <h1 class="ch1-prose-title">CHƯƠNG I · KẺ MỤC RỮA</h1>
      <div id="ch1-intro-lines"></div>
      <div class="ch1-prose-actions">
        <button id="ch1-intro-skip" class="btn-primary-dark" type="button" style="padding: 10px 28px; font-size: 0.85rem;">Bỏ qua / Bước vào Hoang Nguyên</button>
      </div>
    </div>`;
  document.body.appendChild(introEl);

  const epilogueEl = document.createElement('section');
  epilogueEl.id = 'ch1-epilogue-overlay';
  epilogueEl.innerHTML = `
    <div class="ch1-prose-box">
      <h1 class="ch1-prose-title">CHƯƠNG I HOÀN TẤT · CỔNG SƯƠNG PHÍA BẮC ĐÃ MỞ</h1>
      <div id="ch1-epilogue-lines"></div>
      <div class="ch1-prose-actions">
        <button id="ch1-epilogue-close" class="btn-primary-dark" type="button" style="padding: 10px 28px; font-size: 0.85rem;">Tiếp tục khám phá Hoang Nguyên</button>
      </div>
    </div>`;
  document.body.appendChild(epilogueEl);

  // Compass + Zone badge + Boss HP + Subtitle + Interact + Status chips vào hud-root
  const hudRoot = document.getElementById('hud-root');
  const compassEl = document.createElement('div');
  compassEl.id = 'hud-compass';
  compassEl.innerHTML = '<div id="hud-compass-inner"></div>';
  const zoneBadge = document.createElement('div');
  zoneBadge.id = 'hud-zone-badge';
  const bossWrap = document.createElement('div');
  bossWrap.id = 'hud-boss-wrap';
  bossWrap.innerHTML = '<div id="hud-boss-name"></div><div id="hud-boss-track"><div id="hud-boss-ghost"></div><div id="hud-boss-fill"></div></div>';
  const interactEl = document.createElement('button');
  interactEl.id = 'hud-interact-prompt';
  interactEl.type = 'button';
  const subtitleEl = document.createElement('div');
  subtitleEl.id = 'hud-subtitle';
  const statusChips = document.createElement('div');
  statusChips.id = 'hud-status-chips';
  hudRoot.append(compassEl, zoneBadge, bossWrap, interactEl, subtitleEl, statusChips);

  // Nút nhanh trên Top-Right HUD (Map, Túi đồ, Ngựa)
  const topActions = document.querySelector('.hud-top-actions');
  const btnBag = document.createElement('button');
  btnBag.id = 'btn-open-bag'; btnBag.className = 'hud-icon-btn'; btnBag.type = 'button';
  btnBag.title = 'Túi đồ & Nhật ký (I)'; btnBag.textContent = 'I';
  btnBag.style.fontFamily = 'Cinzel, serif'; btnBag.style.fontSize = '0.78rem';
  const btnMap = document.createElement('button');
  btnMap.id = 'btn-open-map'; btnMap.className = 'hud-icon-btn'; btnMap.type = 'button';
  btnMap.title = 'Bản đồ thế giới (M)'; btnMap.textContent = 'M';
  btnMap.style.fontFamily = 'Cinzel, serif'; btnMap.style.fontSize = '0.78rem';
  topActions.prepend(btnBag, btnMap);

  // Nút cảm ứng bổ sung (PARRY, MOUNT, MAP, ACT)
  const touchBtnsRoot = document.getElementById('touch-buttons-root');
  const extraTouchDefs = [
    { id: 'tbtn-parry', cls: 'touch-btn touch-btn-parry', action: 'parry', label: 'PARRY', rx: 204, by: 44 },
    { id: 'tbtn-interact', cls: 'touch-btn touch-btn-mini', action: 'interact', label: 'ACT', rx: 208, by: 122 },
    { id: 'tbtn-mount', cls: 'touch-btn touch-btn-mini', action: 'mount', label: 'MOUNT', rx: 32, by: 202 },
    { id: 'tbtn-map', cls: 'touch-btn touch-btn-mini', action: 'map', label: 'MAP', rx: 92, by: 202 },
  ];
  for (const td of extraTouchDefs) {
    const b = document.createElement('button');
    b.id = td.id; b.className = td.cls; b.dataset.action = td.action; b.type = 'button';
    b.innerHTML = `<span>${td.label}</span>`;
    b.style.right = `calc(${td.rx}px + var(--safe-right))`;
    b.style.bottom = `calc(${td.by}px + var(--safe-bottom))`;
    touchBtnsRoot.appendChild(b);
  }

  // Modal chung (Map / Grace / NPC / Bag & Quests)
  const modalEl = document.createElement('div');
  modalEl.id = 'ch1-modal'; modalEl.className = 'ch1-modal';
  modalEl.innerHTML = '<div class="ch1-modal-card" id="ch1-modal-card"></div>';
  document.body.appendChild(modalEl);

  const modalCard = document.getElementById('ch1-modal-card');
  const compassInner = document.getElementById('hud-compass-inner');
  const bossNameEl = document.getElementById('hud-boss-name');
  const bossGhostEl = document.getElementById('hud-boss-ghost');
  const bossFillEl = document.getElementById('hud-boss-fill');

  let activeModal = null; // null | 'map' | 'grace' | 'npc' | 'bag' | 'stele'
  let subtitleTimer = 0;
  let lastCompassHtml = '';
  let lastChipsHtml = '';
  function enterModalState(kind) {
    activeModal = kind;
    if (document.pointerLockElement) document.exitPointerLock?.();
    modalEl.classList.add('visible');
  }

  // Vẽ sẵn nền địa hình bản đồ thế giới (1 lần) để vẽ Map nhanh mượt
  const mapBgCanvas = document.createElement('canvas');
  mapBgCanvas.width = 400; mapBgCanvas.height = 400;
  {
    const mctx = mapBgCanvas.getContext('2d');
    const img = mctx.createImageData(400, 400);
    for (let py = 0; py < 400; py++) {
      const wz = (py / 400) * 2000 - 1000;
      for (let px = 0; px < 400; px++) {
        const wx = (px / 400) * 2000 - 1000;
        const h = getTerrainHeight(wx, wz);
        const swamp = isInInkSwamp(wx, wz);
        const river = Math.abs(wx - getDryRiverCenterX(wz)) < 24;
        const idx = (py * 400 + px) * 4;
        if (swamp) {
          img.data[idx] = 14; img.data[idx + 1] = 24; img.data[idx + 2] = 22;
        } else if (river) {
          img.data[idx] = 22; img.data[idx + 1] = 23; img.data[idx + 2] = 28;
        } else {
          const shade = Math.max(24, Math.min(92, Math.round(46 + h * 1.6)));
          img.data[idx] = shade + 6; img.data[idx + 1] = shade + 3; img.data[idx + 2] = shade - 2;
        }
        img.data[idx + 3] = 255;
      }
    }
    mctx.putImageData(img, 0, 0);
  }

  function worldToMap(wx, wz, size = 400) {
    return { x: ((wx + 1000) / 2000) * size, y: ((wz + 1000) / 2000) * size };
  }
  function mapToWorld(mx, my, size = 400) {
    return { x: (mx / size) * 2000 - 1000, z: (my / size) * 2000 - 1000 };
  }

  function showIntro(onFinish) {
    const linesBox = document.getElementById('ch1-intro-lines');
    linesBox.innerHTML = CH1_CONFIG.introProse.map((t) => `<p class="ch1-prose-p">${t}</p>`).join('');
    introEl.classList.add('visible');
    const ps = linesBox.querySelectorAll('.ch1-prose-p');
    ps.forEach((p, idx) => setTimeout(() => p.classList.add('shown'), 150 + idx * 550));
    const finish = () => {
      introEl.classList.remove('visible');
      onFinish();
    };
    document.getElementById('ch1-intro-skip').onclick = finish;
  }

  function showEpilogue() {
    const linesBox = document.getElementById('ch1-epilogue-lines');
    linesBox.innerHTML = CH1_CONFIG.epilogueProse.map((t) => `<p class="ch1-prose-p shown">${t}</p>`).join('');
    epilogueEl.classList.add('visible');
    document.getElementById('ch1-epilogue-close').onclick = () => epilogueEl.classList.remove('visible');
  }

  function showSubtitle(text, dur = 2.4) {
    subtitleEl.textContent = text;
    subtitleEl.classList.add('visible');
    subtitleTimer = dur;
  }

  function closeModal() {
    activeModal = null;
    modalEl.classList.remove('visible');
    callbacks.onModalClosed?.();
  }

  function openWorldMap(gameCtx) {
    enterModalState('map');
    const canTravel = !gameCtx.bossActive;
    modalCard.innerHTML = `
      <div class="ch1-modal-head">
        <h2>HOANG NGUYÊN SƯƠNG MỜ · BẢN ĐỒ</h2>
        <button id="ch1-close-modal" class="btn-small-dark" type="button">Đóng [M/Esc]</button>
      </div>
      <canvas id="ch1-map-canvas" width="400" height="400"></canvas>
      <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:0.86rem;">
        <span>Nhấp vào bản đồ để đặt Đánh dấu · Nhấp Đài Lửa đã mở để Dịch chuyển</span>
        <button id="ch1-clear-marker" class="btn-small-dark" type="button">Xóa Đánh dấu</button>
      </div>
      <div id="ch1-map-travel-list" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;"></div>`;

    const canvas = document.getElementById('ch1-map-canvas');
    const ctx = canvas.getContext('2d');

    function redraw() {
      ctx.drawImage(mapBgCanvas, 0, 0);
      // Sương mù chưa khám phá (Fog-of-war theo ô 64m)
      ctx.fillStyle = 'rgba(7, 7, 10, 0.72)';
      const step = 400 / 32;
      for (let gx = -16; gx < 16; gx++) {
        for (let gz = -16; gz < 16; gz++) {
          if (!gameCtx.exploredChunks.has(`${gx},${gz}`)) {
            ctx.fillRect((gx + 16) * step, (gz + 16) * step, step + 0.5, step + 0.5);
          }
        }
      }
      // Nhãn 6 vùng
      ctx.font = '600 10px "Cormorant Garamond", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(232,216,178,0.9)';
      for (const z of CH1_CONFIG.zones) {
        const pt = worldToMap(z.cx, z.cz, 400);
        ctx.fillText(z.name.toUpperCase(), pt.x, pt.y);
      }
      // 5 Đài lửa
      for (const g of gameCtx.graces) {
        const pt = worldToMap(g.x, g.z, 400);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = g.unlocked ? '#f4c65c' : '#554c3b';
        ctx.fill();
        ctx.strokeStyle = '#09080a'; ctx.stroke();
      }
      // Đánh dấu tùy chỉnh
      if (gameCtx.customMarker) {
        const mp = worldToMap(gameCtx.customMarker.x, gameCtx.customMarker.z, 400);
        ctx.beginPath(); ctx.arc(mp.x, mp.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#62e2ff'; ctx.lineWidth = 2; ctx.stroke();
      }
      // Người chơi
      const pp = worldToMap(gameCtx.playerPos.x, gameCtx.playerPos.z, 400);
      ctx.beginPath(); ctx.arc(pp.x, pp.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    redraw();

    const listBox = document.getElementById('ch1-map-travel-list');
    listBox.innerHTML = gameCtx.graces.filter(g => g.unlocked).map((g) =>
      `<button class="btn-small-dark ch1-tp-btn" data-gid="${g.id}" ${canTravel ? '' : 'disabled'} type="button">Dịch chuyển: ${g.name}</button>`
    ).join('');
    listBox.querySelectorAll('.ch1-tp-btn').forEach((b) => {
      b.onclick = () => { callbacks.onFastTravel(b.dataset.gid); closeModal(); };
    });

    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 400;
      const my = ((e.clientY - rect.top) / rect.height) * 400;
      const wp = mapToWorld(mx, my, 400);
      callbacks.onSetMarker(wp.x, wp.z);
      redraw();
    };
    document.getElementById('ch1-clear-marker').onclick = () => { callbacks.onSetMarker(null, null); redraw(); };
    document.getElementById('ch1-close-modal').onclick = closeModal;
  }

  function openGraceMenu(grace, gameCtx) {
    enterModalState('grace');

    function renderGrace() {
      const p = gameCtx.playerState;
      const curLevel = p.classSpec.lv + p.levelBonus;
      const lvCostNow = Math.round(180 + curLevel * 85);
      modalCard.innerHTML = `
        <div class="ch1-modal-head">
          <h2>${grace.name.toUpperCase()}</h2>
          <button id="ch1-close-modal" class="btn-small-dark" type="button">Rời đi</button>
        </div>
        <p style="margin:0 0 12px; color:#cbb88f;">Khu vực: ${grace.zone} · Cấp ${curLevel} · Runes hiện có: <b>${p.runes}</b></p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px;">
          <button id="ch1-grace-rest" class="btn-small-dark is-active" type="button">Nghỉ ngơi (Hồi đầy HP/FP/Bình &amp; Lưu)</button>
          <button id="ch1-grace-lvup" class="btn-small-dark" type="button" ${p.runes >= lvCostNow ? '' : 'disabled'}>Thăng Cấp (+HP/FP/Thể lực · ${lvCostNow} Runes)</button>
        </div>
        <h3 style="font-family:Cinzel,serif; font-size:0.9rem; color:#d8b670; margin:10px 0 6px;">DỊCH CHUYỂN NHANH</h3>
        <div>${gameCtx.graces.filter(g => g.unlocked).map((g) => `
          <div class="ch1-list-row">
            <span>${g.name} (${g.zone})</span>
            <button class="btn-small-dark ch1-tp-btn" data-gid="${g.id}" type="button">Đến đây</button>
          </div>`).join('')}
        </div>`;
      document.getElementById('ch1-close-modal').onclick = closeModal;
      document.getElementById('ch1-grace-rest').onclick = () => {
        callbacks.onRestAtGrace(grace);
        renderGrace();
      };
      document.getElementById('ch1-grace-lvup').onclick = () => {
        if (callbacks.onLevelUp(lvCostNow)) renderGrace();
      };
      modalCard.querySelectorAll('.ch1-tp-btn').forEach((b) => {
        b.onclick = () => { callbacks.onFastTravel(b.dataset.gid); closeModal(); };
      });
    }
    renderGrace();
  }

  function openNpcDialog(npc, gameCtx) {
    enterModalState('npc');
    let lineIdx = 0;

    function renderNpc() {
      const shopHtml = (npc.shopIds && npc.shopIds.length > 0) ? `
        <h3 style="font-family:Cinzel,serif; font-size:0.88rem; color:#d8b670; margin:14px 0 6px;">TRAO ĐỔI VẬT PHẨM (Runes: ${gameCtx.playerState.runes})</h3>
        ${npc.shopIds.map((id) => {
          const it = CH1_CONFIG.items[id];
          const ownedUnique = it.cat === 'ring' && gameCtx.inventory[id] > 0;
          return `<div class="ch1-list-row">
            <div><b>${it.name}</b><div style="font-size:0.82rem; color:#bfa982;">${it.desc}</div></div>
            <button class="btn-small-dark ch1-buy-btn" data-iid="${id}" ${(gameCtx.playerState.runes >= it.price && !ownedUnique) ? '' : 'disabled'} type="button">${ownedUnique ? 'Đã sở hữu' : `Mua (${it.price})`}</button>
          </div>`;
        }).join('')}` : '';

      modalCard.innerHTML = `
        <div class="ch1-modal-head">
          <h2>${npc.name.toUpperCase()} · ${npc.role}</h2>
          <button id="ch1-close-modal" class="btn-small-dark" type="button">Tạm biệt</button>
        </div>
        <p style="font-size:1.1rem; line-height:1.55; margin:6px 0 12px; color:#f2e5c9;">${npc.lines[lineIdx]}</p>
        <div style="display:flex; gap:10px;">
          ${npc.lines.length > 1 ? `<button id="ch1-npc-next" class="btn-small-dark" type="button">Nghe tiếp (${lineIdx + 1}/${npc.lines.length})</button>` : ''}
        </div>
        ${shopHtml}`;

      document.getElementById('ch1-close-modal').onclick = closeModal;
      const nxt = document.getElementById('ch1-npc-next');
      if (nxt) nxt.onclick = () => { lineIdx = (lineIdx + 1) % npc.lines.length; renderNpc(); };
      modalCard.querySelectorAll('.ch1-buy-btn').forEach((b) => {
        b.onclick = () => { if (callbacks.onBuyItem(b.dataset.iid)) renderNpc(); };
      });
    }
    renderNpc();
  }

  function openBagAndQuests(gameCtx) {
    enterModalState('bag');

    function renderBag() {
      const questSteps = [
        { done: gameCtx.graces.some(g => g.id !== 'G1' && g.unlocked), text: 'Tìm ánh sáng trong sương: Thắp thêm một Đài Lửa Trang Sách ngoài Bãi Trang Rách.' },
        { done: !!gameCtx.inventory.truth_remnant_sword, text: 'Dấu vết Hội Kiếm Chân Lý: Leo lên tầng cao nhất Tháp Trang Sách Gãy.' },
        { done: !!gameCtx.inventory.diluted_ink_bolt, text: 'Mực đen Đầm Lầy: Hạ gục Kẻ Nuốt Mực Cổ tại Đầm Mực.' },
        { done: !!gameCtx.bossDefeated, text: 'Trang đầu mục nát: Đánh bại Kẻ Mục Rữa tại Hố Khởi Nguyên phía Bắc.' },
      ];

      const entries = Object.entries(gameCtx.inventory).filter(([, qty]) => qty > 0);
      modalCard.innerHTML = `
        <div class="ch1-modal-head">
          <h2>HÀNH TRANG &amp; NHẬT KÝ TRO TÀN</h2>
          <button id="ch1-close-modal" class="btn-small-dark" type="button">Đóng [I/Esc]</button>
        </div>
        <h3 style="font-family:Cinzel,serif; font-size:0.88rem; color:#d8b670; margin:4px 0 6px;">GHI CHÉP HÀNH TRÌNH</h3>
        ${questSteps.map((q) => `<div style="padding:4px 0; color:${q.done ? '#8ec79a' : '#dfd1b0'};">${q.done ? '[Đã hoàn thành]' : '[Đang lần theo]'} ${q.text}</div>`).join('')}
        <h3 style="font-family:Cinzel,serif; font-size:0.88rem; color:#d8b670; margin:14px 0 6px;">VẬT PHẨM &amp; TRANG BỊ</h3>
        ${entries.map(([id, qty]) => {
          const it = CH1_CONFIG.items[id];
          if (!it) return '';
          let actionBtn = '';
          if (it.cat === 'weapon') {
            const eq = gameCtx.equipped.weapon === id;
            actionBtn = `<button class="btn-small-dark ch1-eq-btn ${eq ? 'is-active' : ''}" data-slot="weapon" data-iid="${id}" type="button">${eq ? 'Đang dùng' : 'Trang bị'}</button>`;
          } else if (it.cat === 'armor') {
            const eq = gameCtx.equipped.armor === id;
            actionBtn = `<button class="btn-small-dark ch1-eq-btn ${eq ? 'is-active' : ''}" data-slot="armor" data-iid="${id}" type="button">${eq ? 'Đang mặc' : 'Mặc'}</button>`;
          } else if (it.cat === 'spell') {
            const eq = gameCtx.equipped.spell === id;
            actionBtn = `<button class="btn-small-dark ch1-eq-btn ${eq ? 'is-active' : ''}" data-slot="spell" data-iid="${id}" type="button">${eq ? 'Đang gắn [Q]' : 'Gắn phép [Q]'}</button>`;
          } else if (it.cat === 'ring') {
            const eq = gameCtx.equipped.ring === id;
            actionBtn = `<button class="btn-small-dark ch1-eq-btn ${eq ? 'is-active' : ''}" data-slot="ring" data-iid="${id}" type="button">${eq ? 'Đang đeo' : 'Đeo nhẫn'}</button>`;
          } else if (it.cat === 'consumable') {
            actionBtn = `<button class="btn-small-dark ch1-use-btn" data-iid="${id}" type="button">Sử dụng (x${qty})</button>`;
          }
          return `<div class="ch1-list-row">
            <div><b>${it.name}</b> ${qty > 1 ? `x${qty}` : ''}<div style="font-size:0.82rem; color:#bfa982;">${it.desc}</div></div>
            ${actionBtn}
          </div>`;
        }).join('')}`;

      document.getElementById('ch1-close-modal').onclick = closeModal;
      modalCard.querySelectorAll('.ch1-eq-btn').forEach((b) => {
        b.onclick = () => { callbacks.onEquipItem(b.dataset.slot, b.dataset.iid); renderBag(); };
      });
      modalCard.querySelectorAll('.ch1-use-btn').forEach((b) => {
        b.onclick = () => { callbacks.onUseItem(b.dataset.iid); renderBag(); };
      });
    }
    renderBag();
  }

  function openSteleModal(stele) {
    enterModalState('stele');
    modalCard.innerHTML = `
      <div class="ch1-modal-head">
        <h2>${stele.title.toUpperCase()}</h2>
        <button id="ch1-close-modal" class="btn-small-dark" type="button">Đóng</button>
      </div>
      <p style="font-size:1.16rem; line-height:1.65; font-style:italic; color:#ede0c4;">${stele.text}</p>`;
    document.getElementById('ch1-close-modal').onclick = closeModal;
  }

  function updateHud(dt, state) {
    if (subtitleTimer > 0) {
      subtitleTimer -= dt;
      if (subtitleTimer <= 0) subtitleEl.classList.remove('visible');
    }

    // La bàn hướng nhìn (-Z là Bắc / B, +X là Đông / Đ)
    const dirs = [
      { label: 'B', angle: 0 },
      { label: 'ĐB', angle: -Math.PI * 0.25 },
      { label: 'Đ', angle: -Math.PI * 0.5 },
      { label: 'ĐN', angle: -Math.PI * 0.75 },
      { label: 'N', angle: Math.PI },
      { label: 'TN', angle: Math.PI * 0.75 },
      { label: 'T', angle: Math.PI * 0.5 },
      { label: 'TB', angle: Math.PI * 0.25 },
    ];
    let html = '';
    const normAng = (a) => {
      let d = ((a + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (d < -Math.PI) d += Math.PI * 2;
      return d;
    };
    const lookYaw = state.cameraYaw; // forward = (-sin(yaw), -cos(yaw))
    for (const d of dirs) {
      const diff = normAng(d.angle - lookYaw);
      if (Math.abs(diff) < 1.35) {
        const pct = 50 - (diff / 1.35) * 46;
        html += `<span class="compass-tick" style="left:${pct.toFixed(1)}%">${d.label}</span>`;
      }
    }
    // Pin Đài lửa đã mở + Đấu trường Boss + Đánh dấu
    const pins = [];
    for (const g of state.graces) if (g.unlocked) pins.push({ x: g.x, z: g.z, col: '#f4c65c' });
    pins.push({ x: 0, z: -680, col: '#d94848' });
    if (state.customMarker) pins.push({ x: state.customMarker.x, z: state.customMarker.z, col: '#62e2ff' });
    for (const pin of pins) {
      const dx = pin.x - state.playerPos.x, dz = pin.z - state.playerPos.z;
      const targetYaw = Math.atan2(-dx, -dz);
      const diff = normAng(targetYaw - lookYaw);
      if (Math.abs(diff) < 1.35) {
        const pct = 50 - (diff / 1.35) * 46;
        html += `<span class="compass-pin" style="left:${pct.toFixed(1)}%; background:${pin.col}"></span>`;
      }
    }
    if (html !== lastCompassHtml) {
      compassInner.innerHTML = html;
      lastCompassHtml = html;
    }

    zoneBadge.textContent = `${state.zone.name.toUpperCase()} · ${state.timeLabel}`;

    // Thanh máu Boss
    const showBoss = state.bossActive && !state.bossState.dead;
    bossWrap.classList.toggle('visible', showBoss);
    if (showBoss) {
      bossNameEl.textContent = state.bossState.phase === 2 ? `${state.bossState.name} · GIAI ĐOẠN II` : state.bossState.name;
      bossFillEl.style.transform = `scaleX(${Math.max(0, state.bossState.hp / state.bossState.maxHp)})`;
      bossGhostEl.style.transform = `scaleX(${Math.max(0, state.bossState.ghostHp / state.bossState.maxHp)})`;
    }

    // Nhắc tương tác
    if (state.interactPrompt) {
      interactEl.textContent = state.interactPrompt;
      interactEl.classList.add('visible');
    } else {
      interactEl.classList.remove('visible');
    }

    // Trạng thái Mount / Ink Slow / Buff / Consumable nhanh
    const chips = [];
    if (state.mounted) chips.push('Đang cưỡi: Tàn Mã Chỉ Vàng [C]');
    if (state.inkSlowTimer > 0) chips.push(`Nhiễm Mực Lầy (${state.inkSlowTimer.toFixed(1)}s)`);
    if (state.chalkBuffTimer > 0) chips.push(`Phấn Chỉ Vàng: +Hồi Thể lực (${state.chalkBuffTimer.toFixed(1)}s)`);
    if (state.guarding) chips.push('Đang giơ thế Đỡ Đòn [F]');
    chips.push(`[1] Phấn x${state.inventory.gold_chalk_powder || 0} · [2] Bùa FP x${state.inventory.dry_paper_talisman || 0} · [I] Túi`);
    const chipsHtml = chips.map(c => `<div>${c}</div>`).join('');
    if (chipsHtml !== lastChipsHtml) {
      statusChips.innerHTML = chipsHtml;
      lastChipsHtml = chipsHtml;
    }
  }

  interactEl.onclick = () => callbacks.onInteract?.();
  btnMap.onclick = (e) => { e.currentTarget.blur(); callbacks.onToggleMap?.(); };
  btnBag.onclick = (e) => { e.currentTarget.blur(); callbacks.onToggleBag?.(); };

  return {
    showIntro,
    showEpilogue,
    showSubtitle,
    openWorldMap,
    openGraceMenu,
    openNpcDialog,
    openBagAndQuests,
    openSteleModal,
    closeModal,
    isModalOpen: () => activeModal !== null,
    getActiveModal: () => activeModal,
    updateHud,
  };
}
