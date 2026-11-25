// Bộ quản lý Asset 3D (.glb thật qua GLTFLoader từ CDN theo assets/manifest.json)
// Quy tắc bắt buộc: KHÔNG tạo hình khối tạm khi thiếu file; đặt Group ẩn kèm collider và báo rõ vào console + bảng Debug F3.

export function createAssetManager(THREE, GLTFLoaderClass) {
  const loader = GLTFLoaderClass ? new GLTFLoaderClass() : null;
  let manifest = { assets: {} };
  const cache = new Map();
  const missingAssets = new Map(); // key -> { key, path, category, license, reason }

  async function init() {
    try {
      const res = await fetch('/assets/manifest.json', { cache: 'no-store' });
      if (res.ok) {
        manifest = await res.json();
      } else {
        console.warn('[Assets] Không đọc được /assets/manifest.json:', res.status);
      }
    } catch (err) {
      console.warn('[Assets] Lỗi tải /assets/manifest.json:', err);
    }
    return manifest;
  }

  function recordMissing(key, spec, reason) {
    if (!missingAssets.has(key)) {
      const entry = {
        key,
        path: spec?.path || `(chưa khai báo: ${key})`,
        category: spec?.category || 'unknown',
        license: spec?.license || 'CC0 / CC-BY',
        reason,
      };
      missingAssets.set(key, entry);
      console.warn(`[Assets] THIẾU FILE .GLB (${key}): "${entry.path}" — Đặt vật thể ẩn kèm collider để game không sập. (${reason})`);
    }
  }

  async function loadTemplate(key) {
    if (cache.has(key)) return cache.get(key);
    const spec = manifest.assets?.[key];
    if (!spec) {
      recordMissing(key, null, 'Chưa khai báo trong manifest.json');
      cache.set(key, null);
      return null;
    }
    if (!loader) {
      recordMissing(key, spec, 'Chưa nạp được GLTFLoader');
      cache.set(key, null);
      return null;
    }

    const promise = (async () => {
      try {
        // Kiểm tra trước bằng HEAD/fetch để tránh crash hoặc log mơ hồ nếu server trả HTML fallback
        const resp = await fetch(`/${spec.path}`, { cache: 'no-store' });
        const ctype = resp.headers.get('content-type') || '';
        if (!resp.ok || ctype.includes('text/html')) {
          recordMissing(key, spec, `HTTP ${resp.status} / chưa có file thật`);
          return null;
        }
        const buf = await resp.arrayBuffer();
        const gltf = await new Promise((resolve, reject) => {
          loader.parse(buf, `/${spec.path}`, resolve, reject);
        });
        gltf.scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });
        const s = spec.scale || 1.0;
        gltf.scene.scale.setScalar(s);
        return { scene: gltf.scene, animations: gltf.animations || [], spec };
      } catch (err) {
        recordMissing(key, spec, err?.message || 'Lỗi parse GLB');
        return null;
      }
    })();

    cache.set(key, promise);
    return promise;
  }

  // Tạo thực thể 3D: nếu có .glb thật -> clone scene + animations; nếu thiếu -> Group ẩn + metadata collider
  function instantiate(key, options = {}) {
    const spec = manifest.assets?.[key] || {};
    const group = new THREE.Group();
    group.name = `asset_${key}`;
    group.userData = {
      assetKey: key,
      loaded: false,
      missing: false,
      collider: {
        radius: options.radius ?? spec.radius ?? 0.6,
        height: options.height ?? spec.height ?? 1.8,
      },
      animations: [],
    };

    loadTemplate(key).then((tpl) => {
      if (tpl && tpl.scene) {
        const clone = tpl.scene.clone(true);
        group.add(clone);
        group.userData.loaded = true;
        group.userData.animations = tpl.animations;
        if (options.onLoaded) options.onLoaded(clone, tpl.animations, group);
      } else {
        // Tuyệt đối không dựng hình tạm: giữ Group trống ẩn với collider nguyên vẹn
        group.userData.missing = true;
        if (options.onMissing) options.onMissing(group, spec);
      }
    });

    return group;
  }

  function getMissingList() {
    return Array.from(missingAssets.values());
  }

  function getManifestSummary() {
    const total = Object.keys(manifest.assets || {}).length;
    const missing = missingAssets.size;
    return { total, missing, loaded: Math.max(0, total - missing) };
  }

  return {
    init,
    loadTemplate,
    instantiate,
    getMissingList,
    getManifestSummary,
    get manifest() { return manifest; },
  };
}
