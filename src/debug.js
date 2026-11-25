// Bảng Debug hiệu năng & Asset thiếu (F3 hoặc chạm 3 lần góc trên-trái)
import { CONFIG } from './config.js';

export function createDebugOverlay(callbacks) {
  const style = document.createElement('style');
  style.textContent = `
    #debug-f3-panel {
      position: fixed; top: calc(56px + var(--safe-top)); right: calc(18px + var(--safe-right));
      z-index: 60; width: min(410px, 92vw); max-height: 78vh; overflow-y: auto;
      background: rgba(8, 9, 11, 0.96); border: 1px solid rgba(201, 166, 107, 0.62);
      padding: 12px 14px; font-family: monospace; font-size: 12px; line-height: 1.45;
      color: #e6dac0; display: none; box-shadow: 0 12px 28px rgba(0,0,0,0.88);
    }
    #debug-f3-panel.visible { display: block; }
    .dbg-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(201,166,107,0.3); padding-bottom: 6px; margin-bottom: 8px; }
    .dbg-title { color: #e8c474; font-weight: bold; letter-spacing: 0.08em; }
    .dbg-row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px; }
    .dbg-sec { margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); }
    .dbg-btns { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
    .dbg-btn {
      background: rgba(26, 22, 18, 0.95); color: #efe0bc; border: 1px solid rgba(182,152,98,0.55);
      padding: 4px 7px; font-family: monospace; font-size: 11px; cursor: pointer;
    }
    .dbg-btn:hover { border-color: #f4d388; background: rgba(54, 42, 26, 0.95); }
    .dbg-btn.is-active { background: rgba(164, 130, 68, 0.4); border-color: #f4d388; }
    .dbg-missing-list { max-height: 120px; overflow-y: auto; margin-top: 4px; color: #f08a7e; font-size: 11px; }
    #dbg-corner-tap {
      position: fixed; top: 0; left: 0; width: 64px; height: 64px; z-index: 59; pointer-events: auto; background: transparent;
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('aside');
  panel.id = 'debug-f3-panel';
  panel.setAttribute('aria-label', 'Bảng Debug F3');
  panel.innerHTML = `
    <div class="dbg-head">
      <span class="dbg-title">DEBUG [F3] · THẾ GIỚI 6×6 KM</span>
      <button id="dbg-close-btn" class="dbg-btn" type="button">Đóng</button>
    </div>
    <div id="dbg-metrics"></div>
    <div class="dbg-sec">
      <div style="color:#d8b874;">Chất lượng đồ họa &amp; Thời tiết:</div>
      <div class="dbg-btns" id="dbg-preset-btns">
        <button class="dbg-btn" data-preset="low" type="button">Thấp</button>
        <button class="dbg-btn" data-preset="medium" type="button">Vừa</button>
        <button class="dbg-btn" data-preset="high" type="button">Cao</button>
        <button class="dbg-btn" id="dbg-weather-btn" type="button">Đổi Thời tiết</button>
        <button class="dbg-btn" id="dbg-time-btn" type="button">+3h Ngày/Đêm</button>
      </div>
    </div>
    <div class="dbg-sec">
      <div style="color:#d8b874;">Dịch chuyển nhanh (3 Sách · Cột Sáng · Ngầm):</div>
      <div class="dbg-btns" id="dbg-warp-btns"></div>
      <div class="dbg-btns">
        <button class="dbg-btn" id="dbg-under1-btn" type="button">Ngầm Tầng 1</button>
        <button class="dbg-btn" id="dbg-under2-btn" type="button">Ngầm Tầng 2</button>
        <button class="dbg-btn" id="dbg-surface-btn" type="button">Lên Mặt Đất</button>
        <button class="dbg-btn" id="dbg-unlock12-btn" type="button">Test 12 Mảnh + 3 Megid</button>
      </div>
    </div>
    <div class="dbg-sec">
      <div id="dbg-missing-title" style="color:#f4a27e;">Asset .glb thiếu theo manifest.json:</div>
      <div class="dbg-missing-list" id="dbg-missing-list"></div>
    </div>
  `;
  document.body.appendChild(panel);

  // Chạm 3 lần góc trên-trái cho mobile
  const cornerTap = document.createElement('div');
  cornerTap.id = 'dbg-corner-tap';
  document.body.appendChild(cornerTap);
  let tapCount = 0;
  let tapTimer = 0;
  cornerTap.addEventListener('pointerdown', () => {
    tapCount += 1;
    clearTimeout(tapTimer);
    if (tapCount >= 3) {
      tapCount = 0;
      toggle();
    } else {
      tapTimer = setTimeout(() => { tapCount = 0; }, 700);
    }
  });

  const warpBox = document.getElementById('dbg-warp-btns');
  for (const [key, wp] of Object.entries(CONFIG.debugWarps)) {
    const b = document.createElement('button');
    b.className = 'dbg-btn';
    b.type = 'button';
    b.textContent = wp.label;
    b.onclick = () => callbacks.onWarp?.(wp.x, wp.z, wp.label, key);
    warpBox.appendChild(b);
  }

  panel.querySelectorAll('[data-preset]').forEach((b) => {
    b.onclick = () => callbacks.onChangePreset?.(b.dataset.preset);
  });
  document.getElementById('dbg-close-btn').onclick = () => setVisible(false);
  document.getElementById('dbg-weather-btn').onclick = () => callbacks.onCycleWeather?.();
  document.getElementById('dbg-time-btn').onclick = () => callbacks.onAdvanceTime?.();
  document.getElementById('dbg-under1-btn').onclick = () => callbacks.onSetLayer?.('under1');
  document.getElementById('dbg-under2-btn').onclick = () => callbacks.onSetLayer?.('under2');
  document.getElementById('dbg-surface-btn').onclick = () => callbacks.onSetLayer?.('surface');
  document.getElementById('dbg-unlock12-btn').onclick = () => callbacks.onTestUnlockAll?.();

  let visible = false;
  let lastRenderTime = 0;

  function setVisible(next) {
    visible = !!next;
    panel.classList.toggle('visible', visible);
    if (visible && document.pointerLockElement) document.exitPointerLock?.();
  }

  function toggle() {
    setVisible(!visible);
  }

  function update(info) {
    if (!visible) return;
    const now = performance.now();
    if (now - lastRenderTime < 220) return;
    lastRenderTime = now;

    const metricsEl = document.getElementById('dbg-metrics');
    metricsEl.innerHTML = `
      <div class="dbg-row"><span>FPS / Frame:</span><b>${info.fps.toFixed(1)} FPS (${info.frameMs.toFixed(1)}ms)</b></div>
      <div class="dbg-row"><span>Draw Calls / Tris:</span><b>${info.calls} calls · ${info.triangles} tris</b></div>
      <div class="dbg-row"><span>Dynamic Res Scale:</span><b>${Math.round(info.resScale * 100)}% (PR ${info.pixelRatio.toFixed(2)})</b></div>
      <div class="dbg-row"><span>Vị trí / Tầng:</span><b>(${Math.round(info.x)}, ${Math.round(info.y)}, ${Math.round(info.z)}) · ${info.layer}</b></div>
      <div class="dbg-row"><span>Vùng / Gợi ý Lv:</span><b>${info.zoneName} (Lv ${info.zoneLevel})</b></div>
      <div class="dbg-row"><span>Mảnh Kiếm / Megid:</span><b>${info.shards}/12 Mảnh · ${info.megids}/3 Megid</b></div>
      <div class="dbg-row"><span>Thời tiết / Giờ:</span><b>${info.weatherLabel} · ${info.timeLabel}</b></div>
    `;

    panel.querySelectorAll('[data-preset]').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.preset === info.preset);
    });

    const missing = info.missingAssets || [];
    document.getElementById('dbg-missing-title').textContent = `Asset .glb thiếu (${missing.length}/${info.totalAssets}):`;
    const listEl = document.getElementById('dbg-missing-list');
    if (missing.length === 0) {
      listEl.innerHTML = '<div style="color:#8fd694;">Đủ toàn bộ file .glb trong manifest.json!</div>';
    } else {
      listEl.innerHTML = missing.map((m) => `<div>• <b>${m.key}</b> → ${m.path}</div>`).join('');
    }
  }

  return {
    toggle,
    setVisible,
    isVisible: () => visible,
    update,
  };
}
