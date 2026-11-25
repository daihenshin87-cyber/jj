// Thế giới mở 6x6 km (Sách Truyện · Sách Sinh Vật · Sách Thần Thú · Thủ Phủ Vàng · Thế Giới Ngầm 2 tầng)
// Bao gồm Sky Dome Shader + Mây FBM + Cột Sáng Trang Sách + Sét/Sấm + Height Fog + Nước/Mực + Chunk Streaming + GLB Props (không hình khối tạm)
import { CONFIG } from './config.js';

function hash2(ix, iz) {
  let n = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(CONFIG.world.seed, 1442695041);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function smoothNoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x, z, octaves = 4) {
  let v = 0, amp = 0.54, freq = 1;
  for (let i = 0; i < octaves; i++) {
    v += (smoothNoise(x * freq, z * freq) - 0.5) * 2 * amp;
    freq *= 2.03;
    amp *= 0.48;
  }
  return v;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Xác định vùng lục địa theo vị trí (x, z) trên bản đồ 6x6 km
export function getBookContinentAt(x, z) {
  const dCapital = Math.hypot(x - 0, z + 120);
  if (dCapital < 420) return 'golden_capital';

  const dCloud = Math.hypot(x + 2480, z + 1920);
  if (dCloud < 200) return 'cloud_island';

  // Sách Truyện (Tây): dải Bắc-Nam từ x=-2050..-750, z=-1050..+2050
  const storyDist = Math.hypot((x + 1400) / 680, (z - 420) / 1450);
  if (storyDist < 1.15) return 'story_book';

  // Sách Sinh Vật (Nam): 2 đảo Olive (-480, 1820) và Hoang mạc Đỏ (620, 1760)
  const oliveDist = Math.hypot(x + 480, z - 1820);
  const desertDist = Math.hypot(x - 620, z - 1760);
  if (oliveDist < 520 || desertDist < 520) return 'creature_book';

  // Sách Thần Thú (Đông Bắc): lục địa lớn nhiều núi (1400, -1250)
  const mythicDist = Math.hypot((x - 1420) / 1080, (z + 1260) / 960);
  if (mythicDist < 1.12) return 'mythic_book';

  return 'mist_sea';
}

export function getDryRiverCenterX(z) {
  return -1340 + Math.sin(z * 0.0028) * 110 + Math.cos(z * 0.0014) * 55;
}

export function isInInkSwamp(x, z) {
  const d1 = Math.hypot(x + 1320, z + 620);
  if (d1 < 185) {
    const n = smoothNoise(x * 0.025, z * 0.025);
    return d1 < 78 || n > 0.56;
  }
  const d2 = Math.hypot(x + 410, z - 1720);
  if (d2 < 120) {
    return smoothNoise(x * 0.03, z * 0.03) > 0.54;
  }
  return false;
}

// Độ cao địa hình 6x6 km xác định theo seed cố định 104729
export function getTerrainHeight(x, z, layer = 'surface') {
  if (layer === 'under1') {
    const d = Math.hypot(x - 2380, z + 1420);
    if (d < 28) return -45.0;
    return -45.0 + fbm(x * 0.02, z * 0.02, 3) * 2.8;
  }
  if (layer === 'under2') {
    const d = Math.hypot(x - 2380, z + 1420);
    if (d < 34) return -92.0;
    return -92.0 + fbm(x * 0.024, z * 0.024, 3) * 3.4;
  }

  // Mặt nước biển mặc định ở ngoài các lục địa
  let landMask = 0;

  // 1. Sách Truyện (lục địa Tây)
  const storyEll = Math.hypot((x + 1380) / 680, (z - 420) / 1450);
  landMask = Math.max(landMask, 1 - smoothstep(0.72, 1.15, storyEll));

  // 2. Sách Sinh Vật (2 đảo Nam)
  const oliveR = Math.hypot(x + 480, z - 1820);
  const desertR = Math.hypot(x - 620, z - 1760);
  landMask = Math.max(landMask, 1 - smoothstep(340, 520, oliveR));
  landMask = Math.max(landMask, 1 - smoothstep(340, 520, desertR));

  // 3. Sách Thần Thú (Đông Bắc)
  const mythicEll = Math.hypot((x - 1420) / 1080, (z + 1260) / 960);
  landMask = Math.max(landMask, 1 - smoothstep(0.75, 1.12, mythicEll));

  // 4. Thủ Phủ Vàng & Cột Sáng trung tâm (0, -120) + cầu nối đất từ Tây sang Đông Bắc
  const capDist = Math.hypot(x - 0, z + 120);
  landMask = Math.max(landMask, 1 - smoothstep(260, 420, capDist));
  const westBridge = Math.abs(z - (x * -0.18 + 120)) < 95 && x > -950 && x < 120 ? 0.65 : 0;
  const eastBridge = Math.abs(z - (x * -0.68 - 120)) < 95 && x > -60 && x < 850 ? 0.65 : 0;
  landMask = Math.max(landMask, westBridge, eastBridge);

  // 5. Đảo Mây Bí Mật Tây (-2480, -1920)
  const cloudDist = Math.hypot(x + 2480, z + 1920);
  if (cloudDist < 190) {
    const cf = 1 - smoothstep(110, 190, cloudDist);
    return -2.5 + cf * 44.5 + fbm(x * 0.015, z * 0.015, 2) * 1.6 * cf;
  }

  let h = -3.4 + landMask * 6.5;
  const ridge = fbm(x * 0.0024, z * 0.0024, 4) * 18.0 + fbm(x * 0.012, z * 0.012, 3) * 2.4;
  h += ridge * landMask;

  // Cao nguyên Tuyết & Đỉnh Rồng ở Sách Thần Thú cao rõ rệt
  const mythicBoost = 1 - smoothstep(350, 960, Math.hypot(x - 1580, z + 1420));
  h += mythicBoost * 24.0;

  // Thủ Phủ Vàng nhiều tầng bậc quanh Cột Sáng
  if (capDist < 340) {
    const tier1 = (1 - smoothstep(200, 260, capDist)) * 8.0;
    const tier2 = (1 - smoothstep(90, 130, capDist)) * 10.0;
    h = Math.max(h, 4.0 + tier1 + tier2);
  }

  // Sông cạn trên Sách Truyện
  if (storyEll < 1.0) {
    const distRiv = Math.abs(x - getDryRiverCenterX(z));
    h -= (1 - smoothstep(16, 56, distRiv)) * 3.8;
  }

  // Làm phẳng các bãi chiến đấu & Đài lửa trọng yếu
  const flatSpots = [
    { x: -1350, z: 1650, r1: 42, r2: 88, y: 2.2 }, // Sương Mờ start + G1
    { x: -1180, z: 960, r1: 38, r2: 82, y: 3.4 },  // Làng Bìa Cũ + G2
    { x: -1540, z: 220, r1: 42, r2: 86, y: 2.8 },  // Hồ Phép & Tháp + G3
    { x: -1320, z: -635, r1: 46, r2: 92, y: 0.4 }, // Đấu trường Megid I
    { x: -480, z: 1820, r1: 42, r2: 85, y: 3.0 },  // Đảo Olive + G5
    { x: 640, z: 1790, r1: 48, r2: 94, y: 3.2 },   // Đấu trường Megid II
    { x: 1140, z: -845, r1: 40, r2: 85, y: 11.5 }, // Đền Rồng + G7
    { x: 1750, z: -1620, r1: 52, r2: 98, y: 24.0 },// Đấu trường Megid III
    { x: 2380, z: -1420, r1: 30, r2: 68, y: 6.5 }, // Mũi Cổng Xoáy Xanh
    { x: 0, z: -220, r1: 36, r2: 75, y: 12.0 },    // G9 Thủ Phủ Vàng
  ];
  for (const sp of flatSpots) {
    const d = Math.hypot(x - sp.x, z - sp.z);
    if (d < sp.r2) {
      const f = 1 - smoothstep(sp.r1, sp.r2, d);
      h = h * (1 - f) + sp.y * f;
    }
  }

  return h;
}

export function getWalkableHeight(x, z, currentY, layer = 'surface') {
  return getTerrainHeight(x, z, layer);
}

export function getZoneAt(x, z, zones = [], layer = 'surface') {
  if (layer === 'under1') {
    return { id: 'under_1', name: 'Thế Giới Ngầm · Tầng I', sub: 'Rễ Thư Viện Bị Chôn', fogColor: '#1a242c', fogDensity: 0.011, danger: 3, level: '65–85' };
  }
  if (layer === 'under2') {
    return { id: 'under_2', name: 'Thế Giới Ngầm · Tầng II', sub: 'Hố Mực Nguyên Thủy', fogColor: '#121922', fogDensity: 0.0125, danger: 4, level: '80–100' };
  }
  let best = null;
  let bestScore = Infinity;
  for (const zSpec of zones) {
    const d = Math.hypot(x - zSpec.cx, z - zSpec.cz) / (zSpec.r || 250);
    if (d < bestScore) {
      bestScore = d;
      best = zSpec;
    }
  }
  if (!best || bestScore > 1.45) {
    const edge = Math.max(Math.abs(x), Math.abs(z));
    if (edge > 2650) {
      return { id: 'page_edge', name: 'Mép Trang Sách', sub: 'Biển mây vô định rìa thế giới', fogColor: '#5c6066', fogDensity: 0.013, danger: 2, level: '—' };
    }
    return { id: 'mist_sea', name: 'Biển Sương Bao Quanh', sub: 'Ranh giới giữa các trang sách', fogColor: '#434a4b', fogDensity: 0.0068, danger: 1, level: '10–50' };
  }
  return best;
}

export function getSurfaceType(x, z, y, layer = 'surface') {
  if (layer !== 'surface') return 'stone';
  if (y < -0.45) return 'water';
  if (isInInkSwamp(x, z)) return 'mud_ink';
  if (getBookContinentAt(x, z) === 'mythic_book' && y > 18) return 'snow';
  if (Math.hypot(x - 0, z + 120) < 260) return 'stone';
  return 'grass_ash';
}

export function createWorld6km(THREE, RoomEnvironment, renderer, assetManager, worldData, isSoftwareGl, initialPreset, audioSys) {
  const scene = new THREE.Scene();
  const zones = worldData?.zones || [];
  let currentPresetName = initialPreset || CONFIG.graphics.autoPreset || 'medium';
  let currentPreset = CONFIG.graphics.presets[currentPresetName] || CONFIG.graphics.presets.medium;
  let activeLayer = 'surface';

  // Thời tiết: 'foggy' (Sương dày) | 'clear' (Quang đãng) | 'rain' (Mưa nhẹ)
  const weathers = [
    { id: 'foggy', label: 'Sương dày', fogMult: 1.28, wetness: 0.15, rainRate: 0.0 },
    { id: 'clear', label: 'Quang đãng', fogMult: 0.84, wetness: 0.0, rainRate: 0.0 },
    { id: 'rain', label: 'Mưa nhẹ', fogMult: 1.15, wetness: 0.85, rainRate: 1.0 },
  ];
  let weatherIdx = 0;
  let weatherTargetIdx = 0;
  let weatherBlend = 1.0;

  // Môi trường IBL nhẹ
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.28;
  pmrem.dispose();

  const skyHorizon = new THREE.Color(CONFIG.world.skyHorizonDay);
  const skyMid = new THREE.Color(CONFIG.world.skyMidDay);
  const skyZenith = new THREE.Color(CONFIG.world.skyZenithDay);
  const fog = new THREE.FogExp2(skyHorizon.getHex(), CONFIG.world.fogDensityBase);
  scene.fog = fog;
  scene.background = skyHorizon.clone();

  // =========================================================================
  // YÊU CẦU 1: SKY DOME SHADER + MÂY FBM + SAO ĐÊM + SÉT
  // =========================================================================
  const skyUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(-0.55, 0.36, -0.75).normalize() },
    uHorizonColor: { value: skyHorizon.clone() },
    uMidColor: { value: skyMid.clone() },
    uZenithColor: { value: skyZenith.clone() },
    uNightFactor: { value: 0.0 },
    uLightningFlash: { value: 0.0 },
    uCloudLayers: { value: currentPreset.cloudSteps },
  };
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uHorizonColor;
      uniform vec3 uMidColor;
      uniform vec3 uZenithColor;
      uniform float uNightFactor;
      uniform float uLightningFlash;
      uniform float uCloudLayers;
      varying vec3 vWorldDir;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }
      float fbmCloud(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 3; i++) {
          if (float(i) >= uCloudLayers) break;
          v += a * noise(p);
          p = p * 2.07 + vec2(13.1, 7.7);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.28, h));
        col = mix(col, uZenithColor, smoothstep(0.24, 0.9, h));

        // Ánh sáng khuếch tán lớn từ mặt trời (không đĩa mặt trời sắc nét)
        float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
        vec3 sunGlowCol = mix(vec3(0.95, 0.78, 0.44), vec3(0.45, 0.55, 0.85), uNightFactor);
        col += sunGlowCol * pow(sunDot, 5.5) * (0.42 - 0.24 * uNightFactor);

        // Mây FBM cuộn chậm theo gió có viền sáng vàng
        if (dir.y > 0.02) {
          vec2 uv = dir.xz / (dir.y + 0.16);
          vec2 warp = vec2(fbmCloud(uv * 0.45 + uTime * 0.008), fbmCloud(uv * 0.45 - uTime * 0.006));
          float d1 = fbmCloud(uv * 0.75 + warp * 0.7 + vec2(uTime * 0.012, uTime * 0.004));
          float cloudMask = smoothstep(0.42, 0.78, d1) * smoothstep(0.02, 0.24, dir.y);
          vec3 cloudDark = mix(uMidColor * 0.72, vec3(0.11, 0.13, 0.18), uNightFactor);
          vec3 cloudRim = mix(vec3(0.94, 0.80, 0.48), vec3(0.42, 0.48, 0.65), uNightFactor);
          vec3 cloudCol = mix(cloudDark, cloudRim, clamp(0.35 + sunDot * 0.75, 0.0, 1.0));
          col = mix(col, cloudCol, cloudMask * 0.78);
        }

        // Sao đêm thưa
        if (uNightFactor > 0.2 && dir.y > 0.12) {
          vec2 starUv = floor(dir.xz / (dir.y + 0.35) * 140.0);
          float s = hash(starUv);
          if (s > 0.994) {
            col += vec3(0.82, 0.88, 1.0) * (uNightFactor - 0.2) * (0.4 + 0.6 * sin(uTime * 2.0 + s * 40.0));
          }
        }

        // Lóe sét nhẹ từ Cột Sáng
        col += vec3(0.95, 0.82, 0.45) * uLightningFlash * 0.45;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(2600, 24, 14), skyMat);
  skyMesh.frustumCulled = false;
  scene.add(skyMesh);

  // =========================================================================
  // CỘT SÁNG TRANG SÁCH Ở TRUNG TÂM + TIA SÉT
  // =========================================================================
  const pillarPos = worldData?.pillarPos || { x: 0, z: -120 };
  const pillarUniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(CONFIG.world.pillarColor) },
    uIntensity: { value: CONFIG.world.pillarIntensity },
    uFlash: { value: 0 },
  };
  const pillarMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
    uniforms: pillarUniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uFlash;
      varying vec2 vUv;
      void main() {
        float radial = sin(vUv.x * 3.14159265);
        float streak = 0.65 + 0.35 * sin(vUv.x * 26.0 + uTime * 1.4 + vUv.y * 8.0);
        float verticalFade = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.62, 1.0, vUv.y));
        float alpha = pow(max(radial, 0.0), 1.6) * streak * verticalFade * (0.52 * uIntensity + uFlash * 0.8);
        gl_FragColor = vec4(uColor * (1.1 + uFlash), clamp(alpha, 0.0, 0.92));
      }
    `,
  });
  const pillarGroup = new THREE.Group();
  pillarGroup.position.set(pillarPos.x, 0, pillarPos.z);
  const pillarCore = new THREE.Mesh(new THREE.CylinderGeometry(18, 28, 1900, 16, 1, true), pillarMat);
  pillarCore.position.y = 940;
  pillarCore.frustumCulled = false;
  const pillarAura = new THREE.Mesh(new THREE.CylinderGeometry(48, 72, 1750, 16, 1, true), pillarMat);
  pillarAura.position.y = 860;
  pillarAura.frustumCulled = false;
  pillarGroup.add(pillarCore, pillarAura);
  scene.add(pillarGroup);

  // Tia sét nhánh nhấp nháy quanh Cột Sáng mỗi 8–20s
  const boltGeo = new THREE.BufferGeometry();
  const boltPts = new Float32Array(12 * 3);
  boltGeo.setAttribute('position', new THREE.BufferAttribute(boltPts, 3));
  const boltMat = new THREE.LineBasicMaterial({ color: 0xffe89c, transparent: true, opacity: 0, fog: false });
  const boltLine = new THREE.Line(boltGeo, boltMat);
  boltLine.frustumCulled = false;
  pillarGroup.add(boltLine);

  // Cổng xoáy xanh Đông Bắc + Đảo Mây Cổng Dịch Chuyển (hiệu ứng shader thuần)
  const portalGroup = new THREE.Group();
  scene.add(portalGroup);
  const portalShaderMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color(0x45d2ff) } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uCol; varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float ang = atan(p.y, p.x);
        float swirl = 0.5 + 0.5 * sin(r * 14.0 - uTime * 3.5 + ang * 3.0);
        float ring = smoothstep(0.95, 0.55, r) * smoothstep(0.12, 0.35, r);
        gl_FragColor = vec4(uCol * (0.8 + swirl * 0.7), ring * (0.45 + 0.4 * swirl));
      }
    `,
  });
  for (const pt of (worldData?.portals || [])) {
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.5), portalShaderMat);
    const py = getTerrainHeight(pt.from.x, pt.from.z, 'surface');
    pm.position.set(pt.from.x, py + 2.8, pt.from.z);
    portalGroup.add(pm);
  }

  // Biển & Đầm Mực Shader
  const waterUniforms = {
    uTime: { value: 0 },
    uSkyCol: { value: skyHorizon.clone() },
    uNight: { value: 0 },
  };
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: waterUniforms,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSkyCol;
      uniform float uNight;
      varying vec3 vWorldPos;
      void main() {
        float wave = sin(vWorldPos.x * 0.14 + uTime * 1.3) * cos(vWorldPos.z * 0.14 - uTime * 1.1);
        float dInk = length(vWorldPos.xz - vec2(-1320.0, -620.0));
        float isInk = 1.0 - smoothstep(140.0, 220.0, dInk);
        vec3 seaCol = mix(vec3(0.08, 0.13, 0.14), uSkyCol * 0.58, 0.42 + wave * 0.08);
        vec3 inkCol = vec3(0.03, 0.02, 0.05) + vec3(0.14, 0.06, 0.22) * (0.5 + 0.5 * wave);
        vec3 col = mix(seaCol, inkCol, isInk) * (1.0 - uNight * 0.45);
        gl_FragColor = vec4(col, mix(0.84, 0.96, isInk));
      }
    `,
  });
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(6200, 6200), waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -0.65;
  scene.add(waterMesh);

  // =========================================================================
  // ÁNH SÁNG CHÍNH + HEMISPHERE + POINT LIGHTS GIỚI HẠN
  // =========================================================================
  const hemiLight = new THREE.HemisphereLight(0x9ca47f, 0x3b3124, 0.85);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffddb0, 2.0);
  sunLight.castShadow = !isSoftwareGl && currentPreset.shadows;
  sunLight.shadow.mapSize.set(currentPreset.shadowMapSize, currentPreset.shadowMapSize);
  sunLight.shadow.camera.near = 2;
  sunLight.shadow.camera.far = 170;
  sunLight.shadow.camera.left = -52;
  sunLight.shadow.camera.right = 52;
  sunLight.shadow.camera.top = 52;
  sunLight.shadow.camera.bottom = -52;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);
  scene.add(sunLight.target);

  const pointPool = [];
  for (let i = 0; i < 4; i++) {
    const pl = new THREE.PointLight(0xf2ba58, 0, 22, 1.8);
    scene.add(pl);
    pointPool.push(pl);
  }

  // =========================================================================
  // ĐỊA HÌNH CHUNK 128×128m + VERTEX SPLAT + GLB PROPS (KHÔNG HÌNH KHỐI TẠM)
  // =========================================================================
  const chunkSize = CONFIG.world.chunkSize;
  const loadedChunks = new Map();
  const staticColliders = [];
  const groundMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.04,
  });

  function computeVertexColor(wx, wz, y, slope) {
    const col = new THREE.Color();
    if (activeLayer !== 'surface') {
      return col.setHex(activeLayer === 'under1' ? 0x262d34 : 0x1a1724);
    }
    const cont = getBookContinentAt(wx, wz);
    if (isInInkSwamp(wx, wz)) {
      return col.setHex(0x16121b);
    }
    if (slope > 0.45) {
      return col.setHex(0x4b4c47); // vách đá xám
    }
    if (cont === 'story_book') {
      const n = smoothNoise(wx * 0.014, wz * 0.014);
      col.setHex(n > 0.54 ? 0x706c43 : 0x565e3f); // vàng thu – lục úa
    } else if (cont === 'creature_book') {
      const isDesert = wx > 60;
      col.setHex(isDesert ? 0x6f392a : 0x455833);
    } else if (cont === 'mythic_book') {
      col.setHex(y > 18 ? 0x9aa4ae : 0x4e524c);
    } else if (cont === 'golden_capital') {
      col.setHex(0x887447);
    } else if (cont === 'cloud_island') {
      col.setHex(0x8a9099);
    } else {
      col.setHex(0x3a403a);
    }
    // Fake AO nhẹ ở vùng trũng
    const ao = Math.max(0.76, Math.min(1.08, 0.88 + y * 0.008));
    col.multiplyScalar(ao);
    return col;
  }

  function buildChunk(cx, cz) {
    const key = `${activeLayer}_${cx}_${cz}`;
    if (loadedChunks.has(key)) return;
    const grp = new THREE.Group();
    const segs = 16;
    const geo = new THREE.PlaneGeometry(chunkSize, chunkSize, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const baseX = cx * chunkSize;
    const baseZ = cz * chunkSize;

    for (let i = 0; i < pos.count; i++) {
      const wx = baseX + pos.getX(i);
      const wz = baseZ + pos.getZ(i);
      const y = getTerrainHeight(wx, wz, activeLayer);
      pos.setY(i, y);

      const hx = getTerrainHeight(wx + 2.0, wz, activeLayer);
      const hz = getTerrainHeight(wx, wz + 2.0, activeLayer);
      const slope = Math.hypot(hx - y, hz - y) * 0.5;
      const c = computeVertexColor(wx, wz, y, slope);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, groundMat);
    mesh.position.set(baseX, 0, baseZ);
    mesh.receiveShadow = true;
    grp.add(mesh);

    // Gắn .glb môi trường theo hạt giống chunk (nếu thiếu file .glb -> chỉ tạo collider ẩn, tuyệt đối không dựng hình khối)
    const localColliders = [];
    if (activeLayer === 'surface' && Math.abs(cx * chunkSize) < 2700 && Math.abs(cz * chunkSize) < 2700) {
      const propCount = currentPresetName === 'low' ? 3 : currentPresetName === 'medium' ? 6 : 9;
      for (let i = 0; i < propCount; i++) {
        const px = baseX + (hash2(cx * 31 + i, cz * 17) - 0.5) * (chunkSize - 12);
        const pz = baseZ + (hash2(cx * 19, cz * 29 + i) - 0.5) * (chunkSize - 12);
        const py = getTerrainHeight(px, pz, 'surface');
        if (py < 0.3) continue;
        // Tránh đặt cây/đá chắn ngay giữa bãi đấu trường boss
        if (Math.hypot(px + 1320, pz + 635) < 46 || Math.hypot(px - 640, pz - 1790) < 50 || Math.hypot(px - 1750, pz + 1620) < 54) continue;

        const rPick = hash2(cx + i * 7, cz - i * 11);
        const assetKey = rPick < 0.45 ? 'env_autumn_tree' : rPick < 0.72 ? 'env_moss_rock' : rPick < 0.9 ? 'env_dead_tree' : 'kit_ruin_arch';
        const colR = assetKey === 'kit_ruin_arch' ? 2.6 : assetKey === 'env_moss_rock' ? 1.5 : 0.85;
        const propInst = assetManager.instantiate(assetKey, { radius: colR, height: 4.5 });
        propInst.position.set(px, py, pz);
        propInst.rotation.y = hash2(i, cx + cz) * Math.PI * 2;
        grp.add(propInst);

        const colEntry = { x: px, z: pz, r: colR, h: py + 4.5 };
        localColliders.push(colEntry);
        staticColliders.push(colEntry);
      }
    }

    scene.add(grp);
    loadedChunks.set(key, { grp, geo, localColliders });
  }

  function unloadDistantChunks(pcx, pcz, radius) {
    for (const [key, ch] of loadedChunks.entries()) {
      const parts = key.split('_');
      const layer = parts[0];
      const cx = Number(parts[1]);
      const cz = Number(parts[2]);
      if (layer !== activeLayer || Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)) > radius + 1) {
        scene.remove(ch.grp);
        ch.geo.dispose();
        for (const c of ch.localColliders) {
          const idx = staticColliders.indexOf(c);
          if (idx >= 0) staticColliders.splice(idx, 1);
        }
        loadedChunks.delete(key);
      }
    }
  }

  // =========================================================================
  // HẠT KHÍ QUYỂN (TRO / PHẤN VÀNG / TRANG GIẤY) + TIA LỬA + MƯA NHẸ
  // =========================================================================
  const maxAtmos = 560;
  const atmosGeo = new THREE.BufferGeometry();
  const atmosPos = new Float32Array(maxAtmos * 3);
  const atmosVel = new Float32Array(maxAtmos * 3);
  for (let i = 0; i < maxAtmos; i++) {
    atmosPos[i * 3] = (Math.random() - 0.5) * 90;
    atmosPos[i * 3 + 1] = Math.random() * 18;
    atmosPos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    atmosVel[i * 3] = (Math.random() - 0.3) * 1.4;
    atmosVel[i * 3 + 1] = -0.35 - Math.random() * 0.55;
    atmosVel[i * 3 + 2] = (Math.random() - 0.5) * 1.1;
  }
  atmosGeo.setAttribute('position', new THREE.BufferAttribute(atmosPos, 3));
  atmosGeo.setDrawRange(0, currentPreset.particleCount);
  function createSoftDotTexture() {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(16, 16, 1, 16, 16, 15);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,244,205,0.65)');
    grad.addColorStop(1, 'rgba(255,230,160,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const softDotTex = createSoftDotTexture();

  const atmosMat = new THREE.PointsMaterial({
    color: 0xe8d28e,
    map: softDotTex,
    size: 0.34,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const atmosPoints = new THREE.Points(atmosGeo, atmosMat);
  atmosPoints.frustumCulled = false;
  scene.add(atmosPoints);

  // Pool tia lửa va chạm
  const sparkPool = [];
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(320 * 3), 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(320 * 3), 3));
  const sparkMat = new THREE.PointsMaterial({ size: 0.38, map: softDotTex, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false, blending: THREE.AdditiveBlending });
  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  sparkPoints.frustumCulled = false;
  scene.add(sparkPoints);
  for (let i = 0; i < 320; i++) sparkPool.push({ active: false, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, r: 1, g: 0.8, b: 0.4 });

  function spawnSparks(x, y, z, count = 14, speed = 6.5, hex = 0xffc864) {
    const c = new THREE.Color(hex);
    let spawned = 0;
    for (let i = 0; i < sparkPool.length && spawned < count; i++) {
      const s = sparkPool[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;
        const th = Math.random() * Math.PI * 2;
        const sp = (0.35 + Math.random() * 0.65) * speed;
        s.vx = Math.cos(th) * sp;
        s.vy = 1.8 + Math.random() * speed * 0.75;
        s.vz = Math.sin(th) * sp;
        s.life = 0.28 + Math.random() * 0.28;
        s.r = c.r; s.g = c.g; s.b = c.b;
        spawned++;
      }
    }
  }

  // Chu kỳ ngày–đêm & sấm sét từ Cột Sáng
  let timeOfDay = 0.36; // ~08:38 sáng vàng-lục
  let lightningTimer = 9.5;
  let lightningFlash = 0.0;
  let thunderDelayTimer = -1;
  let skyTickAccum = 0;

  function applyGraphicsPreset(name) {
    if (!CONFIG.graphics.presets[name]) return;
    currentPresetName = name;
    currentPreset = CONFIG.graphics.presets[name];
    skyUniforms.uCloudLayers.value = currentPreset.cloudSteps;
    atmosGeo.setDrawRange(0, Math.min(maxAtmos, currentPreset.particleCount));
    sunLight.castShadow = !isSoftwareGl && currentPreset.shadows;
    if (sunLight.shadow.mapSize.width !== currentPreset.shadowMapSize) {
      sunLight.shadow.mapSize.set(currentPreset.shadowMapSize, currentPreset.shadowMapSize);
      if (sunLight.shadow.map) { sunLight.shadow.map.dispose(); sunLight.shadow.map = null; }
    }
  }

  function setLayer(layerName) {
    if (layerName === activeLayer) return;
    activeLayer = layerName;
    unloadDistantChunks(99999, 99999, 0);
  }

  function cycleWeather() {
    weatherIdx = weatherTargetIdx;
    weatherTargetIdx = (weatherTargetIdx + 1) % weathers.length;
    weatherBlend = 0.0;
    return weathers[weatherTargetIdx].label;
  }

  function getTimeLabel() {
    const h = Math.floor(timeOfDay * 24) % 24;
    const m = Math.floor((timeOfDay * 24 - Math.floor(timeOfDay * 24)) * 60);
    const phase = h < 5 || h >= 20 ? 'Đêm sâu' : h < 8 ? 'Bình minh' : h < 17 ? 'Ban ngày' : 'Hoàng hôn';
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} · ${phase}`;
  }

  function updateWorld(dt, elapsed, playerPos, lightsNear = []) {
    // Ngày–đêm
    timeOfDay = (timeOfDay + dt / CONFIG.world.dayDurationSec) % 1.0;

    // Thời tiết chuyển mượt 25s
    if (weatherBlend < 1.0) weatherBlend = Math.min(1.0, weatherBlend + dt / 25.0);
    const wA = weathers[weatherIdx], wB = weathers[weatherTargetIdx];
    const wFogMult = THREE.MathUtils.lerp(wA.fogMult, wB.fogMult, weatherBlend);
    const wWetness = THREE.MathUtils.lerp(wA.wetness, wB.wetness, weatherBlend);

    // Sét từ Cột Sáng mỗi 8–20s
    lightningTimer -= dt;
    if (lightningTimer <= 0) {
      lightningTimer = 8 + Math.random() * 12;
      lightningFlash = 1.0;
      const distPillar = Math.hypot(playerPos.x - pillarPos.x, playerPos.z - pillarPos.z);
      thunderDelayTimer = Math.min(3.2, distPillar / 450);

      // Tạo đường sét nhánh ngẫu nhiên quanh Cột Sáng
      const posArr = boltGeo.attributes.position.array;
      let bx = (Math.random() - 0.5) * 32, by = 780, bz = (Math.random() - 0.5) * 32;
      for (let i = 0; i < 12; i++) {
        posArr[i * 3] = bx; posArr[i * 3 + 1] = by; posArr[i * 3 + 2] = bz;
        bx += (Math.random() - 0.5) * 44;
        by -= 65;
        bz += (Math.random() - 0.5) * 44;
      }
      boltGeo.attributes.position.needsUpdate = true;
    }
    if (lightningFlash > 0) lightningFlash = Math.max(0, lightningFlash - dt * 3.8);
    boltMat.opacity = lightningFlash;
    if (thunderDelayTimer >= 0) {
      thunderDelayTimer -= dt;
      if (thunderDelayTimer < 0) {
        const distPillar = Math.hypot(playerPos.x - pillarPos.x, playerPos.z - pillarPos.z);
        audioSys?.playThunder?.(Math.max(0.18, 1.0 - distPillar / 2800));
      }
    }

    // Cập nhật Sky Dome ở nửa tần số để tiết kiệm GPU trên mobile
    skyTickAccum += dt;
    const zone = getZoneAt(playerPos.x, playerPos.z, zones, activeLayer);
    const sunAngle = (timeOfDay - 0.25) * Math.PI * 2;
    const sunElev = Math.sin(sunAngle);
    const nightFactor = THREE.MathUtils.clamp(-sunElev * 1.4 + 0.15, 0, 1);

    if (skyTickAccum >= 0.032) {
      skyTickAccum = 0;
      skyUniforms.uTime.value = elapsed;
      skyUniforms.uSunDir.value.set(Math.cos(sunAngle) * 0.85, Math.max(-0.2, sunElev * 0.65 + 0.25), -0.55).normalize();
      skyUniforms.uNightFactor.value = nightFactor;
      skyUniforms.uLightningFlash.value = lightningFlash;

      const zFog = new THREE.Color(zone.fogColor || CONFIG.world.skyHorizonDay);
      const duskTint = new THREE.Color(0x9a5c3b);
      const nightHor = new THREE.Color(0x161b28);
      const duskFactor = Math.max(0, 1 - Math.abs(sunElev) * 3.4);

      skyHorizon.copy(zFog).lerp(duskTint, duskFactor * 0.45).lerp(nightHor, nightFactor * 0.82);
      skyMid.copy(skyHorizon).lerp(new THREE.Color(0x5c685e), 0.48).lerp(new THREE.Color(0x141b28), nightFactor * 0.80);
      skyZenith.setHex(0x344044).lerp(new THREE.Color(0x0b0f18), nightFactor * 0.88);

      skyUniforms.uHorizonColor.value.copy(skyHorizon);
      skyUniforms.uMidColor.value.copy(skyMid);
      skyUniforms.uZenithColor.value.copy(skyZenith);

      waterUniforms.uTime.value = elapsed;
      waterUniforms.uSkyCol.value.copy(skyHorizon);
      waterUniforms.uNight.value = nightFactor;
    }

    pillarUniforms.uTime.value = elapsed;
    pillarUniforms.uFlash.value = lightningFlash;
    portalShaderMat.uniforms.uTime.value = elapsed;

    skyMesh.position.copy(playerPos);
    fog.color.copy(skyHorizon);
    scene.background.copy(skyHorizon);
    const baseDensity = (zone.fogDensity || CONFIG.world.fogDensityBase) * currentPreset.fogScale * wFogMult;
    fog.density = baseDensity * (1 + nightFactor * (CONFIG.world.nightFogMult - 1));

    // Đất ướt khi mưa (giảm roughness)
    groundMat.roughness = THREE.MathUtils.lerp(0.92, 0.46, wWetness);

    // Ánh sáng chính theo người chơi
    const sx = Math.cos(sunAngle) * 70;
    const sy = Math.max(16, Math.abs(sunElev) * 48 + 18);
    sunLight.position.set(playerPos.x + sx, playerPos.y + sy, playerPos.z - 42);
    sunLight.target.position.copy(playerPos);
    sunLight.intensity = THREE.MathUtils.lerp(2.1, 0.65, nightFactor) + lightningFlash * 0.9;
    sunLight.color.setHex(nightFactor > 0.6 ? 0x8aa2d8 : 0xffe0ad);
    hemiLight.color.copy(skyMid);
    hemiLight.intensity = THREE.MathUtils.lerp(0.9, 0.42, nightFactor);

    // Tối đa N PointLight thật gần nhất theo Preset
    const maxPl = currentPreset.maxPointLights || 2;
    const sortedLights = [...lightsNear].sort((a, b) =>
      Math.hypot(a.x - playerPos.x, a.z - playerPos.z) - Math.hypot(b.x - playerPos.x, b.z - playerPos.z)
    );
    for (let i = 0; i < pointPool.length; i++) {
      if (i < maxPl && i < sortedLights.length) {
        const l = sortedLights[i];
        pointPool[i].position.set(l.x, l.y + 1.4, l.z);
        pointPool[i].color.setHex(l.color || 0xf4bd58);
        pointPool[i].intensity = l.intensity || 2.8;
      } else {
        pointPool[i].intensity = 0;
      }
    }

    // Stream chunk 128×128m quanh người chơi
    const pcx = Math.floor((playerPos.x + chunkSize * 0.5) / chunkSize);
    const pcz = Math.floor((playerPos.z + chunkSize * 0.5) / chunkSize);
    const rad = currentPreset.chunkRadius;
    for (let ox = -rad; ox <= rad; ox++) {
      for (let oz = -rad; oz <= rad; oz++) {
        buildChunk(pcx + ox, pcz + oz);
      }
    }
    unloadDistantChunks(pcx, pcz, rad);

    // Cập nhật hạt khí quyển quanh người chơi
    const activeCount = Math.min(maxAtmos, currentPreset.particleCount);
    const arr = atmosGeo.attributes.position.array;
    const rainSpeed = wB.id === 'rain' ? 3.5 : 1.0;
    for (let i = 0; i < activeCount; i++) {
      arr[i * 3] += atmosVel[i * 3] * dt;
      arr[i * 3 + 1] += atmosVel[i * 3 + 1] * dt * rainSpeed;
      arr[i * 3 + 2] += atmosVel[i * 3 + 2] * dt;
      if (arr[i * 3 + 1] < playerPos.y - 1.5 || Math.abs(arr[i * 3] - playerPos.x) > 48 || Math.abs(arr[i * 3 + 2] - playerPos.z) > 48) {
        arr[i * 3] = playerPos.x + (Math.random() - 0.5) * 78;
        arr[i * 3 + 1] = playerPos.y + 4 + Math.random() * 14;
        arr[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 78;
      }
    }
    atmosGeo.attributes.position.needsUpdate = true;

    // Cập nhật tia lửa pool
    const spArr = sparkGeo.attributes.position.array;
    const scArr = sparkGeo.attributes.color.array;
    for (let i = 0; i < sparkPool.length; i++) {
      const s = sparkPool[i];
      if (s.active) {
        s.life -= dt;
        s.vy -= 14 * dt;
        s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
        if (s.life <= 0) { s.active = false; s.y = -999; }
      }
      spArr[i * 3] = s.x; spArr[i * 3 + 1] = s.y; spArr[i * 3 + 2] = s.z;
      scArr[i * 3] = s.r; scArr[i * 3 + 1] = s.g; scArr[i * 3 + 2] = s.b;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkGeo.attributes.color.needsUpdate = true;

    return { zone, nightFactor, weatherLabel: wB.label };
  }

  function resolveMove(pos, radius = 0.55, bossArena = null) {
    // Rìa 6x6 km ("Mép Trang Sách")
    pos.x = THREE.MathUtils.clamp(pos.x, -2960, 2960);
    pos.z = THREE.MathUtils.clamp(pos.z, -2960, 2960);

    // Đẩy nhẹ ra khỏi collider của .glb props
    for (let i = 0; i < staticColliders.length; i++) {
      const col = staticColliders[i];
      const dx = pos.x - col.x, dz = pos.z - col.z;
      const minD = col.r + radius;
      const dSq = dx * dx + dz * dz;
      if (dSq < minD * minD && dSq > 1e-6) {
        const d = Math.sqrt(dSq);
        pos.x = col.x + (dx / d) * minD;
        pos.z = col.z + (dz / d) * minD;
      }
    }

    if (bossArena && bossArena.active) {
      const dx = pos.x - bossArena.x, dz = pos.z - bossArena.z;
      const d = Math.hypot(dx, dz);
      const maxR = (bossArena.r || 42) - 1.2;
      if (d > maxR && d > 1e-4) {
        pos.x = bossArena.x + (dx / d) * maxR;
        pos.z = bossArena.z + (dz / d) * maxR;
      }
    }

    pos.y = getTerrainHeight(pos.x, pos.z, activeLayer);
  }

  return {
    scene,
    staticColliders,
    signPos: new THREE.Vector3(-1348, getTerrainHeight(-1348, 1638, 'surface'), 1638),
    pillarPos,
    get timeOfDay() { return timeOfDay; },
    set timeOfDay(v) { timeOfDay = ((v % 1) + 1) % 1; },
    get activeLayer() { return activeLayer; },
    get currentPreset() { return currentPresetName; },
    get weatherLabel() { return weathers[weatherTargetIdx].label; },
    applyGraphicsPreset,
    setLayer,
    cycleWeather,
    advanceTimeHours: (h) => { timeOfDay = (timeOfDay + h / 24) % 1.0; },
    getTimeLabel,
    spawnSparks,
    resolveMove,
    updateWorld,
  };
}
