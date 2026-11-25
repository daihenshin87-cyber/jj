#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'assets', 'manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('[check-assets] Không tìm thấy assets/manifest.json');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entries = Object.entries(manifest.assets || {});
const missing = [];
const found = [];

for (const [key, spec] of entries) {
  const fullPath = path.join(root, spec.path);
  if (fs.existsSync(fullPath)) {
    found.push({ key, path: spec.path, size: fs.statSync(fullPath).size });
  } else {
    missing.push({ key, path: spec.path, category: spec.category, license: spec.license });
  }
}

console.log(`=== CHECK ASSETS (manifest.json: ${entries.length} mục) ===`);
console.log(`Đã có: ${found.length} | Thiếu: ${missing.length}`);

if (found.length > 0) {
  console.log('\n[ĐÃ CÓ]');
  for (const item of found) {
    console.log(`  + ${item.key}: ${item.path} (${item.size} bytes)`);
  }
}

if (missing.length > 0) {
  console.log('\n[CẦN BỔ SUNG (.glb)]');
  for (const item of missing) {
    console.log(`  - ${item.key} [${item.category}]: ${item.path} (${item.license})`);
  }
  if (process.argv.includes('--strict')) process.exit(2);
}
