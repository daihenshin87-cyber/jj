import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CONFIG, detectDeviceGraphicsPreset } from './config.js';
import { getTerrainHeight, getBookContinentAt, isInInkSwamp, getZoneAt, getSurfaceType } from './world.js';
import { createQuestManager } from './quests.js';

const worldJson = JSON.parse(fs.readFileSync(new URL('../world.json', import.meta.url), 'utf8'));

test('6x6km heightmap is deterministic and flattens key combat arenas', () => {
  const y1 = getTerrainHeight(-1350, 1650, 'surface');
  const y2 = getTerrainHeight(-1350, 1650, 'surface');
  assert.equal(y1, y2);
  assert.ok(Math.abs(y1 - 2.2) < 0.05, `Expected start terrace ~2.2m, got ${y1}`);

  // Underground floors 1 & 2 return distinct deep elevations
  const u1 = getTerrainHeight(2380, -1420, 'under1');
  const u2 = getTerrainHeight(2380, -1420, 'under2');
  assert.equal(u1, -45.0);
  assert.equal(u2, -92.0);
});

test('3 Book continents, Golden Capital, Cloud Island, and Mist Sea classify accurately', () => {
  assert.equal(getBookContinentAt(-1350, 1650), 'story_book');
  assert.equal(getBookContinentAt(-480, 1820), 'creature_book');
  assert.equal(getBookContinentAt(640, 1790), 'creature_book');
  assert.equal(getBookContinentAt(1720, -1580), 'mythic_book');
  assert.equal(getBookContinentAt(0, -120), 'golden_capital');
  assert.equal(getBookContinentAt(-2480, -1920), 'cloud_island');
  assert.equal(getBookContinentAt(2900, 2900), 'mist_sea');
});

test('ink swamp, surface types, and zone lookup work across layers', () => {
  assert.equal(isInInkSwamp(-1320, -620), true);
  assert.equal(getSurfaceType(-1320, -620, 0.5, 'surface'), 'mud_ink');
  assert.equal(getSurfaceType(1750, -1620, 24.0, 'surface'), 'snow');
  assert.equal(getSurfaceType(2380, -1420, -45, 'under1'), 'stone');

  const uZone = getZoneAt(2380, -1420, worldJson.zones, 'under2');
  assert.equal(uZone.id, 'under_2');

  const edgeZone = getZoneAt(2850, 2850, worldJson.zones, 'surface');
  assert.equal(edgeZone.id, 'page_edge');
});

test('Quest progression unlocks Golden Capital only after 3 Megids and 12 Sacred Shards', () => {
  const qm = createQuestManager();
  assert.equal(qm.progress.hiddenCapitalUnlocked, false);

  for (let i = 1; i <= 12; i++) {
    const id = `shard_${String(i).padStart(2, '0')}`;
    qm.collectShard(id);
  }
  assert.equal(qm.progress.collectedShards.size, 12);
  assert.equal(qm.progress.hiddenCapitalUnlocked, false);

  qm.markMegidDefeated('megid_story');
  qm.markMegidDefeated('megid_creature');
  assert.equal(qm.progress.hiddenCapitalUnlocked, false);

  const unlocked = qm.markMegidDefeated('megid_mythic');
  assert.equal(unlocked, true);
  assert.equal(qm.progress.hiddenCapitalUnlocked, true);

  const exported = qm.exportState();
  const qm2 = createQuestManager();
  qm2.importState(exported);
  assert.equal(qm2.progress.hiddenCapitalUnlocked, true);
});

test('Graphics presets and device detection return valid preset config', () => {
  const p = detectDeviceGraphicsPreset();
  assert.ok(['low', 'medium', 'high'].includes(p));
  assert.equal(CONFIG.world.size, 6000);
  assert.equal(CONFIG.combat.attacks.light1.usesStamina, false);
  assert.equal(CONFIG.combat.attacks.heavy.usesStamina, true);
});
