// Quản lý Nhiệm vụ, Hội thoại, Vật phẩm JSON, 12 Mảnh Thánh Kiếm, 3 Megid và Lưu tiến trình localStorage
const WORLD_SAVE_KEY = 'ashen_oath_world_save_v1';

export function loadWorldSave() {
  try {
    const raw = localStorage.getItem(WORLD_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeWorldSave(payload) {
  try {
    localStorage.setItem(WORLD_SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function createQuestManager() {
  let worldData = null;
  let items = {};
  let npcs = [];
  let dialogue = {};
  let quests = [];

  const progress = {
    defeatedMegids: new Set(),
    collectedShards: new Set(),
    hiddenCapitalUnlocked: false,
    undergroundLayer: 'surface', // 'surface' | 'under1' | 'under2'
  };

  async function init() {
    const fetchJson = async (url, fallback) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return fallback;
        return await res.json();
      } catch {
        return fallback;
      }
    };
    const [w, it, np, dl, qs] = await Promise.all([
      fetchJson('/world.json', null),
      fetchJson('/content/items.json', {}),
      fetchJson('/content/npcs.json', []),
      fetchJson('/content/dialogue.json', {}),
      fetchJson('/content/quests.json', []),
    ]);
    worldData = w;
    items = it || {};
    npcs = Array.isArray(np) ? np : [];
    dialogue = dl || {};
    quests = Array.isArray(qs) ? qs : [];
    return { worldData, items, npcs, dialogue, quests };
  }

  function recomputeFinalUnlock() {
    const has3Megids = progress.defeatedMegids.size >= 3;
    const has12Shards = progress.collectedShards.size >= 12;
    progress.hiddenCapitalUnlocked = has3Megids && has12Shards;
    return progress.hiddenCapitalUnlocked;
  }

  function markMegidDefeated(megidId) {
    progress.defeatedMegids.add(megidId);
    return recomputeFinalUnlock();
  }

  function collectShard(shardId) {
    progress.collectedShards.add(shardId);
    return recomputeFinalUnlock();
  }

  function getNpcLines(npc) {
    if (!npc) return [];
    if (npc.dialogueId && dialogue[npc.dialogueId]) return dialogue[npc.dialogueId];
    return npc.lines || ['...'];
  }

  function evaluateQuests() {
    return quests.map((q) => {
      let done = false;
      let statusText = '';
      if (q.type === 'megid') {
        done = progress.defeatedMegids.has(q.targetId);
        statusText = done ? 'Đã thanh tẩy' : 'Chưa hạ';
      } else if (q.type === 'megid_all') {
        done = progress.defeatedMegids.size >= (q.requiredCount || 3);
        statusText = `${progress.defeatedMegids.size}/${q.requiredCount || 3} Megid`;
      } else if (q.type === 'shards') {
        done = progress.collectedShards.size >= (q.requiredCount || 12);
        statusText = `${progress.collectedShards.size}/${q.requiredCount || 12} Mảnh`;
      } else if (q.type === 'final_unlock') {
        done = progress.hiddenCapitalUnlocked;
        statusText = done ? 'Phong ấn đã mở' : 'Cần 3 Megid + 12 Mảnh';
      }
      return { ...q, done, statusText };
    });
  }

  function exportState() {
    return {
      defeatedMegids: Array.from(progress.defeatedMegids),
      collectedShards: Array.from(progress.collectedShards),
      hiddenCapitalUnlocked: progress.hiddenCapitalUnlocked,
      undergroundLayer: progress.undergroundLayer,
    };
  }

  function importState(saved) {
    progress.defeatedMegids = new Set(saved?.defeatedMegids || []);
    progress.collectedShards = new Set(saved?.collectedShards || []);
    progress.undergroundLayer = saved?.undergroundLayer || 'surface';
    recomputeFinalUnlock();
  }

  return {
    init,
    progress,
    markMegidDefeated,
    collectShard,
    recomputeFinalUnlock,
    getNpcLines,
    evaluateQuests,
    exportState,
    importState,
    get worldData() { return worldData; },
    get items() { return items; },
    get npcs() { return npcs; },
    get dialogue() { return dialogue; },
    get quests() { return quests; },
  };
}
