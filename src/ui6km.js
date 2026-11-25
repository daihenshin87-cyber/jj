// Giao diện thế giới mở 6x6 km: La bàn, Bản đồ 3 Sách + Cột Sáng, Menu Đài Lửa, NPC JSON, Túi đồ & Nhật ký 12 Mảnh / 3 Megid
import { getTerrainHeight, isInInkSwamp, getBookContinentAt } from './world.js';

export function createWorldUI(callbacks) {
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
    .ch1-prose-p { margin: 0; font-size: clamp(1.02rem, 1.8vw, 1.24rem); line-height: 1.62; color: rgba(236,224,198,0.92); }
    .ch1-prose-actions { margin-top: 14px; display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

    #hud-compass {
      position: fixed; top: calc(14px + var(--safe-top)); left: 50%; transform: translateX(-50%);
      width: min(360px, 50vw); height: 28px; background: rgba(10,9,10,0.78);
      border: 1px solid rgba(164,136,86,0.48); overflow: hidden; pointer-events: none;
      display: flex; align-items: center; justify-content: center;
    }
    #hud-compass-inner { position: relative; width: 100%; height: 100%; }
    .compass-tick { position: absolute; top: 5px; transform: translateX(-50%); font-family: 'Cinzel', Georgia, serif; font-size: 0.72rem; letter-spacing: 0.08em; color: #d8c49a; }
    .compass-pin { position: absolute; top: 17px; transform: translateX(-50%); width: 7px; height: 7px; border-radius: 50%; }
    #hud-zone-badge {
      position: fixed; top: calc(46px + var(--safe-top)); left: 50%; transform: translateX(-50%);
      font-family: 'Cinzel', Georgia, serif; font-size: 0.72rem; letter-spacing: 0.14em;
      color: rgba(226,208,172,0.86); text-shadow: 0 1px 4px #000; pointer-events: none; white-space: nowrap;
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
      width: min(840px, 94vw); max-height: 86vh; overflow-y: auto;
      background: rgba(14,12,11,0.96); border: 1px solid rgba(182,152,98,0.62);
      padding: 18px 22px; color: #e8dac0; box-shadow: 0 18px 44px rgba(0,0,0,0.9);
    }
    .ch1-modal-head {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      border-bottom: 1px solid rgba(164,136,86,0.32); padding-bottom: 10px; margin-bottom: 14px;
    }
    .ch1-modal-head h2 { margin: 0; font-family: 'Cinzel', Georgia, serif; font-size: 1.06rem; letter-spacing: 0.14em; color: #d8b670; }
    .ch1-list-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 4px; border-bottom: 1px solid rgba(255,255,255,0.07); font-size: 0.94rem; }
    #ch1-map-canvas { width: 100%; max-width: min(440px, 56vh); height: auto; border: 1px solid rgba(182,152,98,0.55); display: block; margin: 0 auto; cursor: crosshair; }
    .touch-btn-parry { width: 58px; height: 58px; border-color: rgba(232,190,104,0.82); }
    .touch-btn-mini { width: 46px; height: 46px; font-size: 0.62rem; }
  `;
  document.head.appendChild(style);

  const introEl = document.createElement('section');
  introEl.id = 'ch1-intro-overlay';
  introEl.innerHTML = `
    <div class="ch1-prose-box">
      <h1 class="ch1-prose-title">SÁCH TOÀN NĂNG Ô NHIỄM · CHƯƠNG I</h1>
      <div id="ch1-intro-lines">
        <p class="ch1-prose-p">Xưa kia, năm người bạn đặt chân đến Wonder World — khu vườn địa đàng nơi Sách Toàn Năng lưu giữ mọi câu chuyện. Vì tuyệt vọng không thể sáng tạo, ba kẻ đã xé nát cuốn sách và hóa thành ba Megid.</p>
        <p class="ch1-prose-p">Hai người còn lại lập Hội Kiếm Chân Lý, rèn mười hai thánh kiếm cộng hưởng với Wonder Book. Dù ba Megid nguyên thủy từng gục ngã, cuốn sách ô nhiễm vẫn tái sinh một thế giới hỗn loạn gồm ba lục địa: Sách Truyện, Sách Sinh Vật và Sách Thần Thú.</p>
        <p class="ch1-prose-p">Bạn bị triệu hồi vào vùng Sương Mờ phía Tây. Hãy thu thập 12 Mảnh Thánh Kiếm và thanh tẩy 3 Megid để mở phong ấn Thủ Phủ Vàng quanh Cột Sáng Trang Sách.</p>
      </div>
      <div class="ch1-prose-actions">
        <button id="ch1-intro-skip" class="btn-primary-dark" type="button" style="padding: 10px 28px; font-size: 0.85rem;">Bỏ qua / Bước vào Thế Giới</button>
      </div>
    </div>`;
  document.body.appendChild(introEl);

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
  const statusChips = document.createElement('div');
  statusChips.id = 'hud-status-chips';
  hudRoot.append(compassEl, zoneBadge, bossWrap, interactEl, statusChips);

  const topActions = document.querySelector('.hud-top-actions');
  const btnBag = document.createElement('button');
  btnBag.id = 'btn-open-bag'; btnBag.className = 'hud-icon-btn'; btnBag.type = 'button';
  btnBag.title = 'Hành trang & 12 Mảnh Kiếm (I)'; btnBag.textContent = 'I';
  btnBag.style.fontFamily = 'Cinzel, serif'; btnBag.style.fontSize = '0.78rem';
  const btnMap = document.createElement('button');
  btnMap.id = 'btn-open-map'; btnMap.className = 'hud-icon-btn'; btnMap.type = 'button';
  btnMap.title = 'Bản đồ 6×6 km (M)'; btnMap.textContent = 'M';
  btnMap.style.fontFamily = 'Cinzel, serif'; btnMap.style.fontSize = '0.78rem';
  const btnDebug = document.createElement('button');
  btnDebug.id = 'btn-open-debug'; btnDebug.className = 'hud-icon-btn'; btnDebug.type = 'button';
  btnDebug.title = 'Debug FPS & Asset (F3)'; btnDebug.textContent = 'F3';
  btnDebug.style.fontFamily = 'Cinzel, serif'; btnDebug.style.fontSize = '0.72rem';
  topActions.prepend(btnBag, btnMap, btnDebug);

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

  const modalEl = document.createElement('div');
  modalEl.id = 'ch1-modal'; modalEl.className = 'ch1-modal';
  modalEl.innerHTML = '<div class="ch1-modal-card" id="ch1-modal-card"></div>';
  document.body.appendChild(modalEl);

  const modalCard = document.getElementById('ch1-modal-card');
  const compassInner = document.getElementById('hud-compass-inner');
  const bossNameEl = document.getElementById('hud-boss-name');
  const bossGhostEl = document.getElementById('hud-boss-ghost');
  const bossFillEl = document.getElementById('hud-boss-fill');

  let activeModal = null;
  let lastCompassHtml = '';
  let lastChipsHtml = '';

  // Vẽ sẵn nền bản đồ 6×6 km một lần (Sách Truyện, Sách Sinh Vật, Sách Thần Thú, Thủ Phủ Vàng, Đảo Mây, Biển)
  const mapBgCanvas = document.createElement('canvas');
  mapBgCanvas.width = 400; mapBgCanvas.height = 400;
  {
    const mctx = mapBgCanvas.getContext('2d');
    const img = mctx.createImageData(400, 400);
    for (let py = 0; py < 400; py++) {
      const wz = (py / 400) * 6000 - 3000;
      for (let px = 0; px < 400; px++) {
        const wx = (px / 400) * 6000 - 3000;
        const h = getTerrainHeight(wx, wz, 'surface');
        const cont = getBookContinentAt(wx, wz);
        const idx = (py * 400 + px) * 4;
        if (h < -0.5) {
          img.data[idx] = 16; img.data[idx + 1] = 22; img.data[idx + 2] = 27;
        } else if (isInInkSwamp(wx, wz)) {
          img.data[idx] = 26; img.data[idx + 1] = 18; img.data[idx + 2] = 34;
        } else if (cont === 'story_book') {
          img.data[idx] = 74; img.data[idx + 1] = 80; img.data[idx + 2] = 52;
        } else if (cont === 'creature_book') {
          const isDes = wx > 60;
          img.data[idx] = isDes ? 105 : 64; img.data[idx + 1] = isDes ? 54 : 84; img.data[idx + 2] = isDes ? 40 : 48;
        } else if (cont === 'mythic_book') {
          img.data[idx] = h > 18 ? 132 : 76; img.data[idx + 1] = h > 18 ? 140 : 82; img.data[idx + 2] = h > 18 ? 150 : 78;
        } else if (cont === 'golden_capital') {
          img.data[idx] = 152; img.data[idx + 1] = 126; img.data[idx + 2] = 68;
        } else {
          img.data[idx] = 110; img.data[idx + 1] = 116; img.data[idx + 2] = 128;
        }
        img.data[idx + 3] = 255;
      }
    }
    mctx.putImageData(img, 0, 0);
  }

  function worldToMap(wx, wz, size = 400) {
    return { x: ((wx + 3000) / 6000) * size, y: ((wz + 3000) / 6000) * size };
  }
  function mapToWorld(mx, my, size = 400) {
    return { x: (mx / size) * 6000 - 3000, z: (my / size) * 6000 - 3000 };
  }

  function enterModal(kind) {
    activeModal = kind;
    if (document.pointerLockElement) document.exitPointerLock?.();
    modalEl.classList.add('visible');
  }

  function closeModal() {
    activeModal = null;
    modalEl.classList.remove('visible');
    callbacks.onModalClosed?.();
  }

  function showIntro(onFinish) {
    introEl.classList.add('visible');
    document.getElementById('ch1-intro-skip').onclick = () => {
      introEl.classList.remove('visible');
      onFinish();
    };
  }

  function openWorldMap(ctxData) {
    enterModal('map');
    const worldData = ctxData.questMgr.worldData || {};
    modalCard.innerHTML = `
      <div class="ch1-modal-head">
        <h2>BẢN ĐỒ THẾ GIỚI 6×6 KM · BA SÁCH TOÀN NĂNG</h2>
        <button id="ch1-close-modal" class="btn-small-dark" type="button">Đóng [M/Esc]</button>
      </div>
      <canvas id="ch1-map-canvas" width="400" height="400"></canvas>
      <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:0.84rem;">
        <span>Mảnh Thánh Kiếm: <b>${ctxData.questMgr.progress.collectedShards.size}/12</b> · Megid đã diệt: <b>${ctxData.questMgr.progress.defeatedMegids.size}/3</b> · Nhấp bản đồ để đánh dấu</span>
        <button id="ch1-clear-marker" class="btn-small-dark" type="button">Xóa Đánh dấu</button>
      </div>
      <div id="ch1-map-travel-list" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;"></div>`;

    const canvas = document.getElementById('ch1-map-canvas');
    const c2 = canvas.getContext('2d');

    function redraw() {
      c2.drawImage(mapBgCanvas, 0, 0);
      // Sương mù khám phá theo ô 250m
      c2.fillStyle = 'rgba(7,8,11,0.68)';
      const step = 400 / 24;
      for (let gx = -12; gx < 12; gx++) {
        for (let gz = -12; gz < 12; gz++) {
          if (!ctxData.exploredChunks.has(`${gx},${gz}`)) {
            c2.fillRect((gx + 12) * step, (gz + 12) * step, step + 0.5, step + 0.5);
          }
        }
      }
      // Nhãn 3 Sách + Thủ Phủ Vàng + Đảo Mây + Cổng Xoáy Xanh
      c2.font = '600 10px "Cormorant Garamond", Georgia, serif';
      c2.textAlign = 'center';
      c2.fillStyle = 'rgba(244, 224, 176, 0.94)';
      for (const b of (worldData.books || [])) {
        const pt = worldToMap(b.cx, b.cz, 400);
        c2.fillText(b.name.toUpperCase(), pt.x, pt.y);
      }
      const vx = worldData.blueVortexPos || { x: 2380, z: -1420 };
      const vpt = worldToMap(vx.x, vx.z, 400);
      c2.fillStyle = '#4ad2ff';
      c2.beginPath(); c2.arc(vpt.x, vpt.y, 4.5, 0, Math.PI * 2); c2.fill();

      // 9 Đài lửa
      for (const g of ctxData.graces) {
        const pt = worldToMap(g.x, g.z, 400);
        c2.beginPath(); c2.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        c2.fillStyle = g.unlocked ? '#f4c65c' : '#584e3d';
        c2.fill();
      }
      // 3 Megid
      for (const m of (worldData.megids || [])) {
        if (ctxData.questMgr.progress.defeatedMegids.has(m.id)) continue;
        const pt = worldToMap(m.x, m.z, 400);
        c2.fillStyle = '#e04848';
        c2.fillRect(pt.x - 3, pt.y - 3, 6, 6);
      }
      if (ctxData.customMarker) {
        const mp = worldToMap(ctxData.customMarker.x, ctxData.customMarker.z, 400);
        c2.beginPath(); c2.arc(mp.x, mp.y, 6, 0, Math.PI * 2);
        c2.strokeStyle = '#62e2ff'; c2.lineWidth = 2; c2.stroke();
      }
      const pp = worldToMap(ctxData.playerPos.x, ctxData.playerPos.z, 400);
      c2.beginPath(); c2.arc(pp.x, pp.y, 4.5, 0, Math.PI * 2);
      c2.fillStyle = '#ffffff'; c2.fill();
    }
    redraw();

    const listBox = document.getElementById('ch1-map-travel-list');
    listBox.innerHTML = ctxData.graces.filter(g => g.unlocked).map((g) =>
      `<button class="btn-small-dark ch1-tp-btn" data-gid="${g.id}" type="button">Đến: ${g.name}</button>`
    ).join('');
    listBox.querySelectorAll('.ch1-tp-btn').forEach((b) => {
      b.onclick = () => { callbacks.onFastTravel(b.dataset.gid); closeModal(); };
    });

    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const wp = mapToWorld(((e.clientX - rect.left) / rect.width) * 400, ((e.clientY - rect.top) / rect.height) * 400, 400);
      callbacks.onSetMarker(wp.x, wp.z);
      redraw();
    };
    document.getElementById('ch1-clear-marker').onclick = () => { callbacks.onSetMarker(null, null); redraw(); };
    document.getElementById('ch1-close-modal').onclick = closeModal;
  }

  function openGraceMenu(grace, ctxData) {
    enterModal('grace');
    function render() {
      const p = ctxData.playerState;
      const lv = p.classSpec.lv + p.levelBonus;
      const cost = Math.round(180 + lv * 85);
      modalCard.innerHTML = `
        <div class="ch1-modal-head">
          <h2>${grace.name.toUpperCase()}</h2>
          <button id="ch1-close-modal" class="btn-small-dark" type="button">Rời đi</button>
        </div>
        <p style="margin:0 0 12px; color:#cbb88f;">Vùng: ${grace.zone} · Cấp ${lv} · Runes: <b>${p.runes}</b></p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px;">
          <button id="ch1-grace-rest" class="btn-small-dark is-active" type="button">Nghỉ ngơi (Hồi đầy &amp; Lưu)</button>
          <button id="ch1-grace-lvup" class="btn-small-dark" type="button" ${p.runes >= cost ? '' : 'disabled'}>Thăng Cấp (${cost} Runes)</button>
        </div>
        <h3 style="font-family:Cinzel,serif; font-size:0.9rem; color:#d8b670; margin:10px 0 6px;">DỊCH CHUYỂN NHANH</h3>
        <div>${ctxData.graces.filter(g => g.unlocked).map((g) => `
          <div class="ch1-list-row"><span>${g.name} (${g.zone})</span><button class="btn-small-dark ch1-tp-btn" data-gid="${g.id}" type="button">Đến đây</button></div>`
        ).join('')}</div>`;
      document.getElementById('ch1-close-modal').onclick = closeModal;
      document.getElementById('ch1-grace-rest').onclick = () => { callbacks.onRestAtGrace(grace); render(); };
      document.getElementById('ch1-grace-lvup').onclick = () => { if (callbacks.onLevelUp(cost)) render(); };
      modalCard.querySelectorAll('.ch1-tp-btn').forEach((b) => { b.onclick = () => { callbacks.onFastTravel(b.dataset.gid); closeModal(); }; });
    }
    render();
  }

  function openNpcDialog(npc, ctxData) {
    enterModal('npc');
    const lines = ctxData.questMgr.getNpcLines(npc);
    const items = ctxData.questMgr.items || {};
    let idx = 0;
    function render() {
      const shopHtml = (npc.shopIds && npc.shopIds.length > 0) ? `
        <h3 style="font-family:Cinzel,serif; font-size:0.88rem; color:#d8b670; margin:14px 0 6px;">TRAO ĐỔI (Runes: ${ctxData.playerState.runes})</h3>
        ${npc.shopIds.map((id) => {
          const it = items[id];
          if (!it) return '';
          const ownedUnique = it.cat === 'ring' && ctxData.inventory[id] > 0;
          return `<div class="ch1-list-row">
            <div><b>${it.name}</b><div style="font-size:0.82rem; color:#bfa982;">${it.desc}</div></div>
            <button class="btn-small-dark ch1-buy-btn" data-iid="${id}" ${(ctxData.playerState.runes >= it.price && !ownedUnique) ? '' : 'disabled'} type="button">${ownedUnique ? 'Đã có' : `Mua (${it.price})`}</button>
          </div>`;
        }).join('')}` : '';
      modalCard.innerHTML = `
        <div class="ch1-modal-head"><h2>${npc.name.toUpperCase()} · ${npc.role}</h2><button id="ch1-close-modal" class="btn-small-dark" type="button">Đóng</button></div>
        <p style="font-size:1.08rem; line-height:1.55; margin:6px 0 12px; color:#f2e5c9;">${lines[idx] || '...'}</p>
        ${lines.length > 1 ? `<button id="ch1-npc-next" class="btn-small-dark" type="button">Nghe tiếp (${idx + 1}/${lines.length})</button>` : ''}
        ${shopHtml}`;
      document.getElementById('ch1-close-modal').onclick = closeModal;
      const nxt = document.getElementById('ch1-npc-next');
      if (nxt) nxt.onclick = () => { idx = (idx + 1) % lines.length; render(); };
      modalCard.querySelectorAll('.ch1-buy-btn').forEach((b) => { b.onclick = () => { if (callbacks.onBuyItem(b.dataset.iid)) render(); }; });
    }
    render();
  }

  function openBagAndQuests(ctxData) {
    enterModal('bag');
    const items = ctxData.questMgr.items || {};
    function render() {
      const qList = ctxData.questMgr.evaluateQuests();
      const entries = Object.entries(ctxData.inventory).filter(([, qty]) => qty > 0);
      modalCard.innerHTML = `
        <div class="ch1-modal-head">
          <h2>HÀNH TRANG &amp; NHẬT KÝ SÁCH TOÀN NĂNG</h2>
          <button id="ch1-close-modal" class="btn-small-dark" type="button">Đóng [I/Esc]</button>
        </div>
        <h3 style="font-family:Cinzel,serif; font-size:0.88rem; color:#d8b670; margin:4px 0 6px;">NHIỆM VỤ CHÍNH TUYẾN</h3>
        ${qList.map((q) => `<div style="padding:4px 0; color:${q.done ? '#8ec79a' : '#dfd1b0'};"><b>[${q.statusText}]</b> ${q.title} — <span style="color:#bfa982;">${q.desc}</span></div>`).join('')}
        <h3 style="font-family:Cinzel,serif; font-size:0.88rem; color:#d8b670; margin:14px 0 6px;">VẬT PHẨM &amp; TRANG BỊ</h3>
        ${entries.map(([id, qty]) => {
          const it = items[id];
          if (!it) return '';
          let btn = '';
          if (it.cat === 'weapon' || it.cat === 'armor' || it.cat === 'spell' || it.cat === 'ring') {
            const slot = it.cat;
            const eq = ctxData.equipped[slot] === id;
            btn = `<button class="btn-small-dark ch1-eq-btn ${eq ? 'is-active' : ''}" data-slot="${slot}" data-iid="${id}" type="button">${eq ? 'Đang dùng' : 'Trang bị'}</button>`;
          } else if (it.cat === 'consumable') {
            btn = `<button class="btn-small-dark ch1-use-btn" data-iid="${id}" type="button">Dùng (x${qty})</button>`;
          }
          return `<div class="ch1-list-row"><div><b>${it.name}</b> ${qty > 1 ? `x${qty}` : ''}<div style="font-size:0.82rem; color:#bfa982;">${it.desc}</div></div>${btn}</div>`;
        }).join('')}`;
      document.getElementById('ch1-close-modal').onclick = closeModal;
      modalCard.querySelectorAll('.ch1-eq-btn').forEach((b) => { b.onclick = () => { callbacks.onEquipItem(b.dataset.slot, b.dataset.iid); render(); }; });
      modalCard.querySelectorAll('.ch1-use-btn').forEach((b) => { b.onclick = () => { callbacks.onUseItem(b.dataset.iid); render(); }; });
    }
    render();
  }

  function updateHud(dt, state) {
    const dirs = [
      { label: 'B', angle: 0 }, { label: 'ĐB', angle: -Math.PI * 0.25 },
      { label: 'Đ', angle: -Math.PI * 0.5 }, { label: 'ĐN', angle: -Math.PI * 0.75 },
      { label: 'N', angle: Math.PI }, { label: 'TN', angle: Math.PI * 0.75 },
      { label: 'T', angle: Math.PI * 0.5 }, { label: 'TB', angle: Math.PI * 0.25 },
    ];
    const normAng = (a) => {
      let d = ((a + Math.PI) % (Math.PI * 2)) - Math.PI;
      return d < -Math.PI ? d + Math.PI * 2 : d;
    };
    let html = '';
    for (const d of dirs) {
      const diff = normAng(d.angle - state.cameraYaw);
      if (Math.abs(diff) < 1.35) {
        html += `<span class="compass-tick" style="left:${(50 - (diff / 1.35) * 46).toFixed(1)}%">${d.label}</span>`;
      }
    }
    const pins = [{ x: state.pillarPos.x, z: state.pillarPos.z, col: '#ffe27a' }];
    for (const g of state.graces) if (g.unlocked) pins.push({ x: g.x, z: g.z, col: '#f4c65c' });
    if (state.customMarker) pins.push({ x: state.customMarker.x, z: state.customMarker.z, col: '#62e2ff' });
    for (const pin of pins) {
      const diff = normAng(Math.atan2(-(pin.x - state.playerPos.x), -(pin.z - state.playerPos.z)) - state.cameraYaw);
      if (Math.abs(diff) < 1.35) {
        html += `<span class="compass-pin" style="left:${(50 - (diff / 1.35) * 46).toFixed(1)}%; background:${pin.col}"></span>`;
      }
    }
    if (html !== lastCompassHtml) { compassInner.innerHTML = html; lastCompassHtml = html; }

    zoneBadge.textContent = `${state.zone.name.toUpperCase()} (Lv ${state.zone.level || '1+'}) · ${state.timeLabel}`;

    const showBoss = !!state.activeBoss && !state.activeBoss.dead;
    bossWrap.classList.toggle('visible', showBoss);
    if (showBoss) {
      bossNameEl.textContent = state.activeBoss.phase === 2 ? `${state.activeBoss.name} · GIAI ĐOẠN II` : state.activeBoss.name;
      bossFillEl.style.transform = `scaleX(${Math.max(0, state.activeBoss.hp / state.activeBoss.maxHp)})`;
      bossGhostEl.style.transform = `scaleX(${Math.max(0, state.activeBoss.ghostHp / state.activeBoss.maxHp)})`;
    }

    if (state.interactPrompt) {
      interactEl.textContent = state.interactPrompt;
      interactEl.classList.add('visible');
    } else {
      interactEl.classList.remove('visible');
    }

    const chips = [];
    if (state.mounted) chips.push('Đang cưỡi: Tàn Mã Chỉ Vàng [C]');
    if (state.inkSlowTimer > 0) chips.push(`Nhiễm Mực (${state.inkSlowTimer.toFixed(1)}s)`);
    if (state.chalkBuffTimer > 0) chips.push(`Phấn Chỉ Vàng (${state.chalkBuffTimer.toFixed(1)}s)`);
    if (state.guarding) chips.push('Đỡ Đòn [F]');
    chips.push(`Mảnh Kiếm: ${state.shardsCount}/12 · Megid: ${state.megidsCount}/3 · [F3] Debug`);
    const chipsHtml = chips.map((c) => `<div>${c}</div>`).join('');
    if (chipsHtml !== lastChipsHtml) { statusChips.innerHTML = chipsHtml; lastChipsHtml = chipsHtml; }
  }

  interactEl.onclick = () => callbacks.onInteract?.();
  btnMap.onclick = (e) => { e.currentTarget.blur(); callbacks.onToggleMap?.(); };
  btnBag.onclick = (e) => { e.currentTarget.blur(); callbacks.onToggleBag?.(); };
  btnDebug.onclick = (e) => { e.currentTarget.blur(); callbacks.onToggleDebug?.(); };

  return {
    showIntro,
    openWorldMap,
    openGraceMenu,
    openNpcDialog,
    openBagAndQuests,
    closeModal,
    isModalOpen: () => activeModal !== null,
    updateHud,
  };
}
