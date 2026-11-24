import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CH1_CONFIG,
  getTerrainHeight,
  getWalkableHeight,
  isInInkSwamp,
  getDryRiverCenterX,
  getZoneAt,
  getSurfaceType,
} from './data.js';

test('getTerrainHeight is deterministic across repeated calls with seed 104729', () => {
  const h1 = getTerrainHeight(123.4, -456.7);
  const h2 = getTerrainHeight(123.4, -456.7);
  assert.equal(h1, h2);
  assert.equal(Number.isFinite(h1), true);
});

test('Origin Pit boss arena is flat at y=0 within R=40m around (0, -680)', () => {
  const centerH = getTerrainHeight(0, -680);
  const edgeH = getTerrainHeight(36, -680);
  assert.ok(Math.abs(centerH) < 0.01, `Expected ~0, got ${centerH}`);
  assert.ok(Math.abs(edgeH) < 0.01, `Expected ~0, got ${edgeH}`);
});

test('Broken Tower provides 3 walkable elevation floors via getWalkableHeight', () => {
  const ground = getTerrainHeight(-340, -300);
  const f1 = getWalkableHeight(-340, -300, ground);
  const f2 = getWalkableHeight(-340, -300, ground + 4.8);
  const f3 = getWalkableHeight(-340, -300, ground + 9.5);
  assert.ok(f2 > f1 + 3.5);
  assert.ok(f3 > f2 + 3.5);
});

test('Ink Swamp slows inside swamp core and not at player start', () => {
  assert.equal(isInInkSwamp(420, -280), true);
  assert.equal(isInInkSwamp(0, 620), false);
});

test('Dry River meandering curve returns finite world X coordinate', () => {
  const rx = getDryRiverCenterX(0);
  assert.equal(Number.isFinite(rx), true);
  assert.ok(Math.abs(rx) < 300);
});

test('getZoneAt identifies all 6 zones accurately', () => {
  for (const zSpec of CH1_CONFIG.zones) {
    const z = getZoneAt(zSpec.cx, zSpec.cz);
    assert.equal(z.id, zSpec.id);
  }
});

test('getSurfaceType classifies mud_ink, stone, and grass_ash', () => {
  assert.equal(getSurfaceType(420, -280, 0), 'mud_ink');
  assert.equal(getSurfaceType(0, -680, 0), 'stone');
  assert.equal(getSurfaceType(0, 620, 1.2), 'grass_ash');
});
