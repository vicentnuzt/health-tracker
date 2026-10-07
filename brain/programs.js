/* =====================================================================
   BỘ NÃO · GIÁO ÁN TẬP LUYỆN
   - DAY_SLOTS : số buổi/tuần → ngày tập mặc định (0 = Thứ 2 … 6 = Chủ nhật)
   - SPLITS    : mục tiêu × số buổi → loại buổi theo thứ tự
   - TEMPLATES : loại buổi → nhóm chuyển động chính (bài đa khớp trước)
                 + accepts: nhóm bổ trợ được phép thêm vào buổi đó
   - AREAS     : vùng người dùng muốn cải thiện → nhóm bổ trợ thêm vào
   - SCHEMES   : mục tiêu × kinh nghiệm → số hiệp, số lần, thời gian nghỉ
   - PHASES    : chu kỳ 12 tuần, mỗi tuần có mục tiêu cụ thể
   - CARDIO    : các môn cardio, chỉ số MET để ước tính calo
   ===================================================================== */
window.BRAIN = window.BRAIN || {};

BRAIN.DAY_SLOTS = {2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5]};

// FA/FB = toàn thân A/B, UP/LO = thân trên/dưới, PUSH/PULL/LEGS, CARDIO
BRAIN.SPLITS = {
  fat: {2: ['FA', 'FB'], 3: ['FA', 'FB', 'FA'], 4: ['FA', 'CARDIO', 'FB', 'FA'], 5: ['FA', 'CARDIO', 'FB', 'CARDIO', 'FA'], 6: ['UP', 'LO', 'CARDIO', 'UP', 'LO', 'CARDIO']},
  muscle: {2: ['FA', 'FB'], 3: ['FA', 'FB', 'FA'], 4: ['UP', 'LO', 'UP', 'LO'], 5: ['UP', 'LO', 'CARDIO', 'UP', 'LO'], 6: ['PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS']},
  health: {2: ['FA', 'CARDIO'], 3: ['FA', 'CARDIO', 'FB'], 4: ['FA', 'CARDIO', 'FB', 'CARDIO'], 5: ['FA', 'CARDIO', 'FB', 'CARDIO', 'FA'], 6: ['FA', 'CARDIO', 'FB', 'CARDIO', 'FA', 'CARDIO']}
};

BRAIN.TEMPLATES = {
  FA: {name: 'Toàn thân A', zone: 'full', base: ['squat', 'hpush', 'hpull', 'hinge', 'core', 'calf'], accepts: ['core', 'glute', 'bi', 'tri', 'hpush', 'vpush', 'rear', 'balance']},
  FB: {name: 'Toàn thân B', zone: 'full', base: ['lunge', 'vpush', 'vpull', 'glute', 'core', 'bi'], accepts: ['core', 'glute', 'bi', 'tri', 'hpush', 'vpush', 'rear', 'balance']},
  UP: {name: 'Thân trên', zone: 'upper', base: ['hpush', 'hpull', 'vpush', 'vpull', 'rear', 'bi', 'tri'], accepts: ['core', 'bi', 'tri', 'hpush', 'vpush', 'rear']},
  LO: {name: 'Thân dưới', zone: 'lower', base: ['squat', 'hinge', 'lunge', 'glute', 'calf', 'core'], accepts: ['core', 'glute', 'balance']},
  PUSH: {name: 'Đẩy (ngực, vai, tay sau)', zone: 'upper', base: ['hpush', 'vpush', 'hpush', 'tri', 'vpush', 'core'], accepts: ['core', 'tri', 'hpush', 'vpush']},
  PULL: {name: 'Kéo (lưng, tay trước)', zone: 'upper', base: ['vpull', 'hpull', 'rear', 'bi', 'hpull', 'core'], accepts: ['core', 'bi', 'rear']},
  LEGS: {name: 'Chân, mông', zone: 'lower', base: ['squat', 'hinge', 'lunge', 'glute', 'calf', 'core'], accepts: ['core', 'glute', 'balance']}
};
// Số bài chính đa khớp luôn giữ ở đầu buổi; bài bổ trợ chen vào ngay sau
BRAIN.MAIN_LIFTS = 4;
// Số bài mỗi buổi theo thời lượng (phút)
BRAIN.EXERCISE_COUNT = {30: 4, 45: 5, 60: 6, 90: 7};
// MET trung bình của 1 buổi tập tạ (đã tính thời gian nghỉ) để ước tính calo
BRAIN.STRENGTH_MET = 4.5;

BRAIN.AREAS = {
  abs: {name: 'Bụng, eo', slots: ['core']},
  glute: {name: 'Mông, đùi', slots: ['glute']},
  arms: {name: 'Tay', slots: ['bi', 'tri']},
  chest: {name: 'Ngực, vai', slots: ['hpush', 'vpush']},
  posture: {name: 'Lưng, tư thế', slots: ['rear']}
};

BRAIN.SCHEMES = {
  fat: {
    new: {sets: '2–3', reps: '12–15', rest: '45–60 giây', restSec: 50},
    some: {sets: '3', reps: '10–12', rest: '60 giây', restSec: 60},
    pro: {sets: '3–4', reps: '8–12', rest: '60–90 giây', restSec: 75}
  },
  muscle: {
    new: {sets: '3', reps: '10–12', rest: '60–90 giây', restSec: 75},
    some: {sets: '3–4', reps: '8–12', rest: '90 giây', restSec: 90},
    pro: {sets: '4', reps: '6–10', rest: '2 phút', restSec: 120}
  },
  health: {
    new: {sets: '2', reps: '12–15', rest: '45–60 giây', restSec: 50},
    some: {sets: '2–3', reps: '10–15', rest: '60 giây', restSec: 60},
    pro: {sets: '3', reps: '8–12', rest: '60–90 giây', restSec: 75}
  }
};
BRAIN.REPS_SPECIAL = {hold: '30–45 giây', core: '10–12 lần mỗi bên', calf: '15–20 lần', balance: '30 giây mỗi chân', rear: '12–15 lần'};
BRAIN.ACCESSORY_REST = 45; // giây nghỉ cho bài bổ trợ (core, bắp chân, vai sau, thăng bằng)

BRAIN.PHASES = [
  {from: 1, to: 2, key: 'intro', name: 'Làm quen', setsDelta: -1, lvlDelta: 0, rir: '3–4',
    desc: 'Bớt 1 hiệp mỗi bài, dùng tạ nhẹ, tập trung học đúng kỹ thuật. Cơ thể cần thời gian thích nghi.',
    weeks: {1: 'Chọn mức tạ thật nhẹ, ưu tiên học động tác. Có thể quay video để tự kiểm tra kỹ thuật.',
      2: 'Nếu thấy quá dễ, tăng nhẹ tạ hoặc chuyển sang biến thể khó hơn một bậc.'}},
  {from: 3, to: 6, key: 'build', name: 'Xây nền', setsDelta: 0, lvlDelta: 0, rir: '2–3',
    desc: 'Tập đủ số hiệp. Mỗi tuần tăng nhẹ mức tạ hoặc số lần.',
    weeks: {3: 'Tập đủ hiệp. Chọn mức tạ làm được số lần thấp nhất của khoảng, còn dư 2–3 lần.',
      4: 'Thêm 1–2 lần mỗi hiệp so với tuần trước.',
      5: 'Bài nào đạt số lần cao nhất ở mọi hiệp thì tăng tạ 2–5%.',
      6: 'Tuần nặng nhất giai đoạn: cố gắng vượt kỷ lục cũ ở 1–2 bài chính.'}},
  {from: 7, to: 7, key: 'deload', name: 'Hồi phục', setsDelta: -1, lvlDelta: 0, rir: '4',
    desc: 'Tuần nhẹ: bớt 1 hiệp, giữ mức tạ, ngủ nhiều hơn. Cơ bắp phát triển trong lúc nghỉ.',
    weeks: {7: 'Giảm khối lượng, giữ mức tạ, ngủ thêm 30 phút mỗi đêm. Thấy khỏe cũng đừng tập bù.'}},
  {from: 8, to: 11, key: 'push', name: 'Tăng tốc', setsDelta: 0, lvlDelta: 1, rir: '1–2',
    desc: 'Chuyển sang biến thể bài khó hơn, cardio có thêm bài biến tốc (nếu phù hợp).',
    weeks: {8: 'Làm quen các biến thể bài mới với mức tạ vừa phải.',
      9: 'Thêm 1–2 lần mỗi hiệp.',
      10: 'Tăng tạ ở các bài đã đạt số lần tối đa.',
      11: 'Tuần đỉnh của chu kỳ: dồn sức cho các bài chính.'}},
  {from: 12, to: 12, key: 'review', name: 'Đánh giá', setsDelta: -1, lvlDelta: 0, rir: '3',
    desc: 'Tuần nhẹ để đo lại cân nặng, vòng eo, chụp ảnh so sánh. Sau tuần này, làm lại khảo sát để lập chu kỳ mới.',
    weeks: {12: 'Đo cân, vòng eo, chụp ảnh. Cuối tuần vào Cài đặt → Làm lại khảo sát để bắt đầu chu kỳ mới.'}}
];

// Bước chân: bắt đầu theo công việc, cứ 2 tuần tăng 1.000 bước tới mục tiêu
BRAIN.STEPS = {start: {desk: 6000, light: 7000, active: 8000, heavy: 8000}, goal: {fat: 10000, muscle: 8000, health: 9000}, inc: 1000, everyWeeks: 2};

// Chia calo theo ngày: ngày tập ăn thêm, ngày nghỉ ăn bớt (tỉ lệ so với chênh lệch calo tập)
BRAIN.CALORIE_CYCLING = 0.5;

// MET: calo ≈ MET × kg × giờ. needs: chỉ dùng khi người dùng có dụng cụ đó.
BRAIN.CARDIO = [
  {id: 'walk', name: 'Đi bộ nhanh', e: '🚶', met: 4.3, avoid: []},
  {id: 'run', name: 'Chạy bộ', e: '🏃', met: 8.3, avoid: ['knee', 'heart', 'preg']},
  {id: 'bike', name: 'Đạp xe', e: '🚴', met: 6.8, avoid: []},
  {id: 'swim', name: 'Bơi lội', e: '🏊', met: 6, avoid: []},
  {id: 'racket', name: 'Cầu lông / pickleball', e: '🏸', met: 5.5, avoid: ['knee', 'shoulder', 'preg']},
  {id: 'football', name: 'Đá bóng', e: '⚽', met: 7, avoid: ['knee', 'heart', 'preg', 'senior']},
  {id: 'dance', name: 'Nhảy / Zumba', e: '💃', met: 6, avoid: ['knee', 'preg']},
  {id: 'jumprope', name: 'Nhảy dây', e: '🪢', met: 11, avoid: ['knee', 'bp', 'heart', 'preg', 'senior']},
  {id: 'hike', name: 'Leo núi / trekking', e: '🥾', met: 6, avoid: ['knee', 'preg']},
  {id: 'stairs', name: 'Leo cầu thang', e: '🪜', met: 8, avoid: ['knee', 'heart']},
  {id: 'treadmill', name: 'Đi bộ dốc / chạy trên máy', e: '🏃', met: 6, avoid: [], needs: 'treadmill'},
  {id: 'spinbike', name: 'Xe đạp tập', e: '🚴', met: 6.8, avoid: [], needs: 'spinbike'},
  {id: 'elliptical', name: 'Máy elip', e: '〰️', met: 5, avoid: [], needs: 'elliptical'},
  {id: 'rowing', name: 'Máy chèo thuyền', e: '🚣', met: 7, avoid: ['back'], needs: 'rower'},
  {id: 'yoga', name: 'Yoga', e: '🧘', met: 2.5, avoid: []}
];
// Cardio mặc định khi người dùng không chọn môn nào và không có máy cardio
BRAIN.CARDIO_DEFAULT = ['walk', 'bike', 'swim'];

BRAIN.WARMUP = {
  lower: ['Xoay cổ chân, gối, hông: mỗi khớp 10 vòng', '10 lần squat chậm (hoặc ngồi chạm ghế)', '10 lần bước lùi tại chỗ mỗi chân', '1 hiệp nhẹ của bài đầu tiên'],
  upper: ['Xoay vai, cổ tay: mỗi khớp 10 vòng', '10 lần dang tay chữ T, ép bả vai', '10 lần hít đất tựa tường', '1 hiệp nhẹ của bài đầu tiên'],
  full: ['Đi bộ tại chỗ 1 phút', 'Xoay vai, hông, gối: mỗi khớp 10 vòng', '10 lần squat chậm + 10 lần hít đất tựa tường', '1 hiệp nhẹ của bài đầu tiên'],
  cardio: ['5 phút cùng môn ở cường độ rất nhẹ', 'Xoay cổ chân, gối, hông: mỗi khớp 10 vòng']
};
BRAIN.COOLDOWN = {
  lower: ['Giãn đùi trước (đứng, kéo gót về mông) 30 giây/bên', 'Giãn đùi sau 30 giây/bên', 'Giãn mông (ngồi bắt chéo chân) 30 giây/bên'],
  upper: ['Giãn ngực ở khung cửa 30 giây', 'Kéo tay ngang ngực giãn vai 30 giây/bên', 'Giãn tay sau 30 giây/bên'],
  full: ['Giãn đùi trước, đùi sau 30 giây/bên', 'Giãn ngực ở khung cửa 30 giây', 'Thở chậm 1 phút (hít 4 giây, thở ra 6 giây)'],
  cardio: ['Đi bộ chậm 3–5 phút', 'Giãn bắp chân, đùi trước, đùi sau 30 giây/bên']
};
BRAIN.MOBILITY = ['Mèo – bò (cat-cow)', 'Giãn hông 90/90', 'Giãn ngực ở khung cửa', 'Xoay cột sống nằm nghiêng', 'Giãn đùi sau với khăn'];
