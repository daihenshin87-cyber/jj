// Dữ liệu cốt lõi, bản đồ độ cao hạt giống cố định và thông số cân bằng Chương 1
export const CH1_CONFIG = {
  world: {
    size: 2000,
    halfSize: 1000,
    chunkSize: 64,
    seed: 104729,
    dayDurationSec: 720,
    nightFogMult: 1.45,
    inkSwampSpeedMult: 0.62,
    viewPresets: {
      low: { radius: 2, shadows: false, propDensity: 0.45, label: 'Thấp (2 chunk · Không bóng)' },
      medium: { radius: 3, shadows: true, propDensity: 0.75, label: 'Vừa (3 chunk)' },
      high: { radius: 4, shadows: true, propDensity: 1.0, label: 'Cao (4 chunk)' },
    },
  },
  mount: {
    name: 'Tàn Mã Chỉ Vàng',
    speedMult: 1.58,
    sprintMult: 1.88,
    turnSpeed: 9.5,
  },
  playerStart: { x: 0, z: 620 },
  zones: [
    { id: 'shattered_shore', name: 'Bãi Trang Rách', sub: 'Khởi đầu trong tro chữ', cx: 0, cz: 620, r: 220, fogColor: 0x16171d, fogDensity: 0.011, danger: 0 },
    { id: 'withered_woods', name: 'Rừng Chữ Úa', sub: 'Rễ cổ khắc kinh phai', cx: -360, cz: 240, r: 250, fogColor: 0x121714, fogDensity: 0.014, danger: 1 },
    { id: 'old_binding_village', name: 'Làng Bìa Cũ', sub: 'Tiếng vọng đóng gáy xưa', cx: 320, cz: 160, r: 230, fogColor: 0x1a1614, fogDensity: 0.013, danger: 1 },
    { id: 'ink_marsh', name: 'Đầm Mực', sub: 'Vũng hắc thủy nuốt bước chân', cx: 420, cz: -280, r: 260, fogColor: 0x0b0e11, fogDensity: 0.017, danger: 2 },
    { id: 'broken_tower', name: 'Tháp Trang Sách Gãy', sub: 'Di tích Hội Kiếm Chân Lý', cx: -340, cz: -300, r: 210, fogColor: 0x15141c, fogDensity: 0.014, danger: 2 },
    { id: 'origin_pit', name: 'Hố Khởi Nguyên', sub: 'Nơi trang đầu tiên mục rữa', cx: 0, cz: -680, r: 170, fogColor: 0x0f120e, fogDensity: 0.018, danger: 3 },
  ],
  graces: [
    { id: 'G1', name: 'Đài Lửa Bãi Tro', zone: 'Bãi Trang Rách', x: 0, z: 585, unlockedByDefault: true },
    { id: 'G2', name: 'Đài Lửa Rừng Chữ Úa', zone: 'Rừng Chữ Úa', x: -340, z: 260, unlockedByDefault: false },
    { id: 'G3', name: 'Đài Lửa Làng Bìa Cũ', zone: 'Làng Bìa Cũ', x: 310, z: 180, unlockedByDefault: false },
    { id: 'G4', name: 'Đài Lửa Chân Tháp Gãy', zone: 'Tháp Trang Sách Gãy', x: -305, z: -285, unlockedByDefault: false },
    { id: 'G5', name: 'Đài Lửa Hố Khởi Nguyên', zone: 'Hố Khởi Nguyên', x: 0, z: -680, unlockedByDefault: false, bossLocked: true },
  ],
  warps: {
    F6: { x: 310, z: 182.6, label: 'Làng Bìa Cũ [G3]' },
    F7: { x: -305, z: -282.4, label: 'Tháp Trang Sách Gãy [G4]' },
    F8: { x: 0, z: -636.8, label: 'Cổng Sương Boss [G5]' },
  },
  enemies: {
    paper_husk: {
      id: 'paper_husk', name: 'Xác Giấy Mục', hp: 165, poise: 35, dmg: 52, poiseDmg: 18,
      speed: 4.3, aggroRange: 18, attackRange: 2.1, runes: 95, scale: 1.0,
    },
    script_branch: {
      id: 'script_branch', name: 'Cành Cốt Khắc Chữ', hp: 255, poise: 62, dmg: 76, poiseDmg: 30,
      speed: 3.4, aggroRange: 20, attackRange: 3.1, runes: 155, scale: 1.18,
    },
    echo_villager: {
      id: 'echo_villager', name: 'Thôn Dân Lặp Thoại', hp: 220, poise: 46, dmg: 60, poiseDmg: 22,
      speed: 3.8, aggroRange: 19, attackRange: 2.3, runes: 130, scale: 1.04,
    },
    ink_devourer: {
      id: 'ink_devourer', name: 'Kẻ Nuốt Mực Cổ', hp: 680, poise: 115, dmg: 108, poiseDmg: 48,
      speed: 3.5, aggroRange: 24, attackRange: 3.4, runes: 650, scale: 1.75, isElite: true,
    },
  },
  boss: {
    rottingOne: {
      id: 'rotting_one',
      name: 'Kẻ Mục Rữa — Hộ Vệ Trang Đầu',
      arenaCenter: { x: 0, z: -680 },
      arenaRadius: 40,
      fogGatePos: { x: 0, z: -640 },
      northPassPos: { x: 0, z: -726 },
      maxHp: 2400,
      maxPoise: 120,
      phase2Threshold: 0.5,
      phase2SpeedMult: 1.18,
      phase2RecoveryMult: 0.75,
      riposteMult: 2.4,
      rewardRunes: 3500,
      introLines: [
        '“Ngươi cũng mang theo tro giấy của thế giới đã rách sao?”',
        '“Không một câu chuyện nào được phép viết tiếp trên đất mục này.”',
        '“Hãy nộp lại trang tên của ngươi cho Hố Khởi Nguyên!”',
      ],
      phase2Subtitle: '“Trang đầu mục nát... Khởi nguyên bùng vỡ!”',
      moves: {
        root_cleave: { label: 'Quét Kiếm Rễ', windup: 0.62, active: 0.24, recovery: 0.68, dmg: 96, poiseDmg: 36, range: 5.4, parryable: true },
        overhead_slam: { label: 'Giáng Rễ Chấn Địa', windup: 0.78, active: 0.22, recovery: 0.85, dmg: 128, poiseDmg: 58, range: 5.2, aoeRadius: 4.5, parryable: false },
        lunge_thrust: { label: 'Đâm Xuyên Trang', windup: 0.56, active: 0.22, recovery: 0.66, dmg: 104, poiseDmg: 40, range: 7.4, parryable: true },
        ink_spore_burst: { label: 'Nổ Bào Tử Mực', windup: 0.75, active: 0.30, recovery: 0.72, dmg: 88, poiseDmg: 32, range: 4.6, aoeRadius: 6.2, parryable: false },
        fungus_grab: { label: 'Vồ Bàn Tay Mực Nấm', windup: 0.82, active: 0.28, recovery: 0.92, dmg: 145, poiseDmg: 70, range: 5.8, unblockable: true, parryable: false },
        backhand_combo: { label: 'Liên Trảm Hai Nhịp', windup: 0.52, active: 0.42, recovery: 0.75, dmg: 84, poiseDmg: 34, range: 5.0, parryable: true },
        page_rain: { label: 'Mưa Trang Sách Cắt', windup: 0.72, active: 0.35, recovery: 0.65, dmg: 78, poiseDmg: 28, range: 16, parryable: false },
        summon_clones: { label: 'Gọi Bóng Trang Mục', windup: 0.85, active: 0.25, recovery: 0.70, dmg: 0, poiseDmg: 0, range: 18, parryable: false },
        ink_poison_pool: { label: 'Vũng Mực Độc Hắc', windup: 0.66, active: 0.25, recovery: 0.62, dmg: 45, poiseDmg: 12, range: 16, parryable: false },
        triple_finisher: { label: 'Tam Liên Mục Rữa', windup: 0.54, active: 0.68, recovery: 0.78, dmg: 92, poiseDmg: 42, range: 5.8, parryable: true },
      },
    },
  },
  items: {
    burned_page: {
      id: 'burned_page', name: 'Mảnh Giấy Cháy Xém', cat: 'story',
      desc: 'Một góc giấy xé từ cuốn sách không bìa. Chữ mực vàng còn sót lại viết: “Năm kẻ bước vào khu vườn không bệnh tật. Ba kẻ xé nát bình minh.”',
    },
    ink_rust_dagger: {
      id: 'ink_rust_dagger', name: 'Thanh Đoản Kiếm Gỉ Mực', cat: 'weapon', dmgBonus: 18, bleedBonus: 12,
      desc: 'Lưỡi kiếm ngắn dính hắc mực không thể lau sạch. Đòn chém để lại vết ăn mòn trên thịt xác mục.',
    },
    truth_remnant_sword: {
      id: 'truth_remnant_sword', name: 'Tàn Ảnh Chân Lý', cat: 'weapon', dmgBonus: 42, poiseBonus: 14,
      desc: 'Kiếm gãy của Hội Kiếm Chân Lý (Sword of Logos). Dù mất nửa lưỡi, chuôi đồng vẫn ngân vang khi chạm vào mực tà.',
    },
    moss_cloak: {
      id: 'moss_cloak', name: 'Áo Choàng Rêu Mục', cat: 'armor', defMult: 0.82,
      desc: 'Áo khoác dệt từ sợi bìa sách ẩm và rêu xám Làng Bìa Cũ. Giảm 18% sát thương nhận vào.',
    },
    gold_chalk_powder: {
      id: 'gold_chalk_powder', name: 'Bột Phấn Chỉ Vàng', cat: 'consumable', price: 140,
      desc: 'Xóa ngay hiệu ứng chậm của Đầm Mực và tăng tốc hồi Thể lực trong 15 giây.',
    },
    dry_paper_talisman: {
      id: 'dry_paper_talisman', name: 'Lá Bùa Giấy Khô', cat: 'consumable', price: 160,
      desc: 'Giấy bùa giữ chữ cổ chưa thấm mực đen. Nghiền nát để hồi tức thì 120 FP.',
    },
    diluted_ink_bolt: {
      id: 'diluted_ink_bolt', name: 'Mũi Tên Mực Loãng', cat: 'spell', fpCost: 16, stamCost: 14, dmg: 165,
      desc: 'Phép rút ra từ Kẻ Nuốt Mực Cổ. Khi trang bị ở ô Phép, chiêu [Q] bắn loạt 3 tia mực xuyên thấu.',
    },
    steady_thread_ring: {
      id: 'steady_thread_ring', name: 'Nhẫn Chỉ Bền', cat: 'ring', price: 320, maxStamBonus: 25,
      desc: 'Chiếc nhẫn khâu bằng chỉ đóng sách cổ. Tăng +25 Thể lực tối đa và +15 Kháng choáng.',
    },
    rotting_book_shard: {
      id: 'rotting_book_shard', name: 'Mảnh Sách Thối Rữa: Khúc Khởi Nguyên', cat: 'story',
      desc: 'Mảnh vỡ lớn thấm đẫm quyền năng Megid nguyên thủy. Mở khóa kỹ năng “Trang Sách Tan Rã” và con đường sang Chương 2.',
    },
    old_paper_reins: {
      id: 'old_paper_reins', name: 'Dây Cương Giấy Cũ', cat: 'story',
      desc: 'Sợi dây cương bện từ trang kinh vàng. Cường hóa Tàn Mã Chỉ Vàng (+18% tốc độ phi nước đại).',
    },
  },
  npcs: [
    {
      id: 'N1', name: 'Ông Lão Đóng Bìa', role: 'Thợ khâu sách · Thương nhân', x: 318, z: 172,
      lines: [
        'Khách lạ còn giữ được đôi mắt tỉnh táo ư? Làng này đã lặp đi lặp lại cùng một trang truyện từ lâu rồi.',
        'Xưa kia có hai người mang mảnh sách thoát khỏi vườn địa đàng: một người lập Hội Kiếm Chân Lý, người kia ở lại gác cửa sương.',
        'Nếu muốn đi về phía Hố Khởi Nguyên, đừng bước vào Đầm Mực với đôi chân trần. Mua ít Bột Phấn Chỉ Vàng đi.',
      ],
      shopIds: ['gold_chalk_powder', 'dry_paper_talisman', 'steady_thread_ring'],
    },
    {
      id: 'N2', name: 'Kẻ Mất Trí Nhớ Bến Tro', role: 'Kẻ canh tháp gãy', x: -312, z: -278,
      lines: [
        'Ta từng mang một cái tên... trước khi trang có tên ta bị xé khỏi Sách Toàn Năng.',
        'Trên tầng cao nhất của Tháp Trang Sách Gãy vẫn còn một thanh Tàn Ảnh Chân Lý. Đừng để bọn cành gỗ bén rễ lên người ngươi.',
      ],
      shopIds: [],
    },
    {
      id: 'N3', name: 'Thiếu Nữ Sương Trắng', role: 'Dư ảnh địa đàng', x: 14, z: -648,
      lines: [
        'Hơi thở của khu vườn vẫn còn vương trong làn sương xám... Dù nàng — hiện thân của Wonder World — đã tan vào vô định.',
        'Kẻ Mục Rữa phía sau màn sương từng là người bảo vệ trang đầu tiên, trước khi mực đen nuốt trọn lòng hắn.',
        'Khi hắn ngã xuống, cánh cổng phía Bắc sẽ hé mở về nơi những câu chuyện còn dang dở.',
      ],
      shopIds: [],
    },
  ],
  loreSteles: [
    {
      id: 'S1', title: 'Bia Đá I — Miền Đất Hứa', x: -12, z: 598,
      text: '“Năm người bạn đi qua bờ sương, chạm vào Wonder World — nơi không bệnh tật hay đói kém. Ở giữa vườn là Sách Toàn Năng, ghi sẵn mọi kiếp người từ khởi thủy.”',
    },
    {
      id: 'S2', title: 'Bia Đá II — Sự Tuyệt Vọng Của Nhà Văn', x: -355, z: 225,
      text: '“Một nhà văn lật từng trang và thấy mọi câu chữ đời mình đều đã nằm sẵn trong đó. Trong cơn tuyệt vọng vì chẳng thể tự sáng tạo, hắn rủ hai kẻ đồng hành xé nát cuốn sách.”',
    },
    {
      id: 'S3', title: 'Bia Đá III — Ba Megid Và Hội Kiếm', x: 304, z: 142,
      text: '“Ba mảnh lớn biến kẻ phản bội thành Megid. Hai người trung nghĩa chia làm đôi: một ở lại giữ vườn, một mang hai phần sách về lập Hội Kiếm Chân Lý rèn thánh kiếm.”',
    },
    {
      id: 'S4', title: 'Bia Đá IV — Vết Ô Nhiễm Còn Sót', x: -326, z: -292,
      text: '“Mười hai thánh kiếm đã hợp nhất để chém gục ba Megid. Nhưng Sách Toàn Năng đã thấm mực ô nhiễm của thủ lĩnh chúng — tro mục ấy rỉ ra thành Hoang Nguyên Sương Mờ hôm nay.”',
    },
  ],
  introProse: [
    'Mưa tro rơi lặng lẽ trên những trang giấy mục.',
    'Bạn tỉnh dậy giữa Bãi Trang Rách, trong tay chỉ còn nắm chặt một Mảnh Giấy Cháy Xém. Sương mù mang mùi mực cũ và rễ cây thối rữa phủ kín đường chân trời.',
    'Người ta kể rằng xưa kia từng có một khu vườn không khổ đau mang tên Wonder World, nơi Sách Toàn Năng lưu giữ mọi câu chuyện. Rồi cuốn sách bị xé nát; những kẻ mang tà mực sinh ra Megid, còn những thanh kiếm Chân Lý dần gãy vụn qua nhiều thế hệ.',
    'Phía Bắc Hoang Nguyên Sương Mờ, một thực thể mục nát vẫn bám víu lấy trang đầu tiên của thế giới này. Bạn chẳng nhớ mình là ai — chỉ biết ngọn lửa tro dưới chân đang chờ được thắp lại.',
  ],
  epilogueProse: [
    'Kẻ Mục Rữa gục xuống giữa làn mưa tro vàng. Trong khoảnh khắc thân xác rễ gỗ tan rã, một mảnh sách thấm mực đen rơi lại — Mảnh Sách Thối Rữa: Khúc Khởi Nguyên.',
    'Màn sương đặc quánh phía Bắc Hố Khởi Nguyên bỗng tách làm đôi, để lộ con đường đá cổ dẫn lên dãy núi mù sương của Chương 2 — nơi tàn tích cuối cùng của Hội Kiếm Chân Lý đang ngủ yên.',
    'Bạn đã hoàn thành Chương 1. Bạn có thể tiếp tục khám phá Hoang Nguyên Sương Mờ, nâng cấp chỉ số tại Đài Lửa, hoặc quay lại Tháp và Đầm Mực săn tìm toàn bộ di vật.',
  ],
};

// Hàm băm xác định theo seed cố định 104729
function hash2(ix, iz) {
  let n = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(CH1_CONFIG.world.seed, 1442695041);
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

function fbm(x, z) {
  let v = 0, amp = 0.55, freq = 1;
  for (let i = 0; i < 4; i++) {
    v += (smoothNoise(x * freq, z * freq) - 0.5) * 2 * amp;
    freq *= 2.04;
    amp *= 0.48;
  }
  return v;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Đường uốn lượn Sông Mực Cạn chạy từ Đông-Bắc qua trung tâm sang Tây-Nam
export function getDryRiverCenterX(z) {
  return Math.sin(z * 0.0042) * 145 + Math.cos(z * 0.0017) * 65 + 40;
}

// Kiểm tra Đầm Mực (gây làm chậm)
export function isInInkSwamp(x, z) {
  const dx = x - 420, dz = z + 280;
  if (dx * dx + dz * dz > 210 * 210) return false;
  const n = smoothNoise(x * 0.032, z * 0.032);
  return (dx * dx + dz * dz < 88 * 88) || (n > 0.54 && dx * dx + dz * dz < 180 * 180);
}

// Độ cao địa hình tại tọa độ thế giới (x, z)
export function getTerrainHeight(x, z) {
  let h = fbm(x * 0.0038, z * 0.0038) * 14.5 + fbm(x * 0.015, z * 0.015) * 2.1;

  // Rãnh Sông Mực Cạn
  const rx = getDryRiverCenterX(z);
  const distRiver = Math.abs(x - rx);
  const riverCarve = 1 - smoothstep(14, 52, distRiver);
  h -= riverCarve * 4.4;

  // Rìa dốc tự nhiên bao quanh map [-1000..+1000]
  const edgeDist = Math.max(Math.abs(x), Math.abs(z));
  if (edgeDist > 860) {
    h += smoothstep(860, 1000, edgeDist) * 28;
  }

  // Làm phẳng có kiểm soát tại các khu vực trọng yếu để chiến đấu công bằng
  // 1. Bãi Trang Rách (Start + G1)
  const dStart = Math.hypot(x - 0, z - 600);
  if (dStart < 72) {
    const f = 1 - smoothstep(30, 72, dStart);
    h = h * (1 - f) + 1.2 * f;
  }
  // 2. Rừng Chữ Úa G2
  const dG2 = Math.hypot(x + 345, z - 250);
  if (dG2 < 52) {
    const f = 1 - smoothstep(22, 52, dG2);
    h = h * (1 - f) + 3.2 * f;
  }
  // 3. Làng Bìa Cũ
  const dVillage = Math.hypot(x - 320, z - 165);
  if (dVillage < 74) {
    const f = 1 - smoothstep(32, 74, dVillage);
    h = h * (1 - f) + 2.4 * f;
  }
  // 4. Đầm Mực (hơi lõm giữ mực)
  const dSwamp = Math.hypot(x - 420, z + 280);
  if (dSwamp < 150) {
    const f = 1 - smoothstep(55, 150, dSwamp);
    h = h * (1 - f) + (-0.45) * f;
  }
  // 5. Tháp Trang Sách Gãy
  const dTower = Math.hypot(x + 325, z + 295);
  if (dTower < 58) {
    const f = 1 - smoothstep(28, 58, dTower);
    h = h * (1 - f) + 3.8 * f;
  }
  // 6. Hố Khởi Nguyên (Đấu trường Boss phẳng R = 40m + lối vào)
  const dBoss = Math.hypot(x - 0, z + 680);
  if (dBoss < 82) {
    const f = 1 - smoothstep(46, 82, dBoss);
    h = h * (1 - f) + 0.0 * f;
  }

  return h;
}

// Tính độ cao đứng được kể cả 3 tầng của Tháp Trang Sách Gãy (-340, -300)
export function getWalkableHeight(x, z, currentY) {
  const baseH = getTerrainHeight(x, z);
  const tx = -340, tz = -300;
  const dx = x - tx, dz = z - tz;
  const r = Math.hypot(dx, dz);
  if (r > 20) return baseH;

  const towerGround = getTerrainHeight(tx, tz);
  const f1 = towerGround + 0.35;
  const f2 = towerGround + 5.1;
  const f3 = towerGround + 9.85;

  // Hai cầu dốc nối tầng 1 -> tầng 2 (vòng Đông-Bắc) và tầng 2 -> tầng 3 (vòng Tây-Nam)
  if (r >= 9.2 && r <= 14.4) {
    const ang = Math.atan2(dz, dx); // [-PI..PI]
    // Ramp 1: ang từ -0.2 đến 1.9
    if (ang >= -0.25 && ang <= 1.95) {
      const t = Math.max(0, Math.min(1, (ang + 0.25) / 2.2));
      const ramp1Y = f1 + (f2 - f1) * t;
      if (Math.abs(currentY - ramp1Y) < 2.2 || currentY < f2 + 0.6) return Math.max(baseH, ramp1Y);
    }
    // Ramp 2: ang từ 2.05 đến 3.14 hoặc -3.14 đến -1.1
    const normAng = ang < -1.0 ? ang + Math.PI * 2 : ang;
    if (normAng >= 2.0 && normAng <= 4.35 && currentY >= f2 - 1.5) {
      const t = Math.max(0, Math.min(1, (normAng - 2.0) / 2.35));
      const ramp2Y = f2 + (f3 - f2) * t;
      return Math.max(baseH, ramp2Y);
    }
  }

  if (r < 11.2) {
    if (currentY >= f3 - 1.5) return f3;
    if (currentY >= f2 - 1.5) return f2;
    return Math.max(baseH, f1);
  }
  return baseH;
}

export function getZoneAt(x, z) {
  let best = CH1_CONFIG.zones[0], bestScore = Infinity;
  for (const zSpec of CH1_CONFIG.zones) {
    const d = Math.hypot(x - zSpec.cx, z - zSpec.cz) / zSpec.r;
    if (d < bestScore) { bestScore = d; best = zSpec; }
  }
  if (bestScore > 1.35) {
    return {
      id: 'mist_wilds', name: 'Hoang Nguyên Sương Mờ', sub: 'Đồng tro mênh mông',
      fogColor: 0x13151a, fogDensity: 0.012, danger: z < -300 ? 2 : 1,
    };
  }
  return best;
}

// Phân loại bề mặt địa hình cho tiếng bước chân (grass_ash / mud_ink / stone)
export function getSurfaceType(x, z, y) {
  if (isInInkSwamp(x, z)) return 'mud_ink';
  const dTower = Math.hypot(x + 340, z + 300);
  const dBoss = Math.hypot(x, z + 680);
  const dVillage = Math.hypot(x - 320, z - 160);
  if (dTower < 18 || dBoss < 41 || dVillage < 28 || y > 18) return 'stone';
  return 'grass_ash';
}
