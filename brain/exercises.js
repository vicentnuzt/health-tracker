/* =====================================================================
   BỘ NÃO · THƯ VIỆN BÀI TẬP
   E(id, slot, tên, dụng cụ, độ khó, chống chỉ định, lưu ý kỹ thuật, {time, m})
     slot   – nhóm chuyển động (bộ máy chọn bài theo nhóm này, xem SLOT_INFO)
     equip  – dụng cụ cần, nối bằng '+' nếu cần nhiều thứ (vd 'db+bench').
              'none' = chỉ cần trọng lượng cơ thể + đồ gia dụng (ghế, bàn, bậc thang, khăn, balo).
              Danh sách dụng cụ: xem BRAIN.EQUIPMENT bên dưới.
     lvl    – độ khó 1 (dễ) → 3 (khó). Bài "dễ hơn / khó hơn" được suy ra
              tự động từ các bài cùng nhóm có độ khó thấp / cao hơn.
     avoid  – không dùng khi có: knee, back, shoulder, bp, sugar, heart,
              preg (mang thai), senior (từ 60 tuổi)
     time   – tính bằng giây (giữ tư thế) thay vì số lần
     m      – nhóm cơ chính, nếu khác mặc định của slot
   ===================================================================== */
window.BRAIN = window.BRAIN || {};

// Dụng cụ người dùng có thể chọn. home: dễ mua để tập tại nhà (dùng cho gợi ý mua sắm)
BRAIN.EQUIPMENT = [
  {id: 'db', name: 'Tạ đơn', icon: '🏋️', desc: 'Tạ tay, tốt nhất là loại điều chỉnh được', home: true, price: 'từ 300k, bộ điều chỉnh 1–2 triệu'},
  {id: 'band', name: 'Dây kháng lực', icon: '🎗️', desc: 'Dây chun tập, nhiều mức nặng', home: true, price: 'khoảng 150–300k'},
  {id: 'bench', name: 'Ghế tập', icon: '🛋️', desc: 'Ghế phẳng hoặc chỉnh dốc được', home: true, price: 'khoảng 700k–1,5 triệu'},
  {id: 'bar', name: 'Xà đơn', icon: '🔩', desc: 'Gắn khung cửa hoặc xà công viên', home: true, price: 'xà gắn cửa khoảng 200–400k'},
  {id: 'dip', name: 'Xà kép', icon: '🤸', desc: 'Giá chống đẩy hoặc xà kép công viên', home: true, price: 'khoảng 500k–1 triệu'},
  {id: 'abwheel', name: 'Con lăn bụng', icon: '🛞', desc: 'Bánh xe tập bụng', home: true, price: 'khoảng 100–200k'},
  {id: 'barbell', name: 'Tạ đòn + giá đỡ', icon: '🏗️', desc: 'Thanh đòn, bánh tạ, giá squat'},
  {id: 'cable', name: 'Máy kéo cáp', icon: '🔗', desc: 'Trạm kéo cáp, máy kéo xà, kéo cáp ngồi'},
  {id: 'machine', name: 'Máy tập chuyên dụng', icon: '⚙️', desc: 'Leg press, máy cuốn đùi, chest press, máy vai'},
  {id: 'treadmill', name: 'Máy chạy bộ', icon: '🏃', desc: 'Dùng cho buổi cardio', cardio: true},
  {id: 'spinbike', name: 'Xe đạp tập', icon: '🚴', desc: 'Dùng cho buổi cardio', cardio: true},
  {id: 'elliptical', name: 'Máy elip', icon: '〰️', desc: 'Dùng cho buổi cardio', cardio: true},
  {id: 'rower', name: 'Máy chèo thuyền', icon: '🚣', desc: 'Dùng cho buổi cardio', cardio: true}
];
// Bộ chọn nhanh trong khảo sát
BRAIN.EQUIP_PRESETS = [
  {id: 'none', name: '🏠 Không có gì', items: []},
  {id: 'home', name: '🏡 Tạ đơn + dây', items: ['db', 'band']},
  {id: 'park', name: '🌳 Công viên có xà', items: ['bar', 'dip']},
  {id: 'gym', name: '💪 Phòng gym đầy đủ', items: ['db', 'band', 'bench', 'bar', 'dip', 'abwheel', 'barbell', 'cable', 'machine', 'treadmill', 'spinbike', 'elliptical', 'rower']}
];
// Độ "đáng dùng" của từng dụng cụ khi có nhiều lựa chọn (dụng cụ tăng tải được ưu tiên hơn)
BRAIN.EQUIP_WEIGHT = {none: 0, band: 1.2, db: 2.5, bench: 0.3, bar: 2, dip: 2, abwheel: 1.5, barbell: 3, cable: 2.4, machine: 2.2};

BRAIN.SLOT_INFO = {
  squat: {name: 'Squat', muscles: 'Đùi trước · Mông', zone: 'lower'},
  lunge: {name: 'Chân đơn', muscles: 'Đùi · Mông · Thăng bằng', zone: 'lower'},
  hinge: {name: 'Gập hông', muscles: 'Đùi sau · Mông · Lưng dưới', zone: 'lower'},
  glute: {name: 'Mông', muscles: 'Mông', zone: 'lower'},
  calf: {name: 'Bắp chân', muscles: 'Bắp chân', zone: 'lower'},
  hpush: {name: 'Đẩy ngang', muscles: 'Ngực · Vai trước · Tay sau', zone: 'upper'},
  vpush: {name: 'Đẩy lên', muscles: 'Vai', zone: 'upper'},
  hpull: {name: 'Kéo ngang', muscles: 'Lưng giữa · Tay trước', zone: 'upper'},
  vpull: {name: 'Kéo xuống', muscles: 'Lưng xô · Tay trước', zone: 'upper'},
  rear: {name: 'Vai sau', muscles: 'Vai sau · Tư thế', zone: 'upper'},
  bi: {name: 'Tay trước', muscles: 'Tay trước', zone: 'upper'},
  tri: {name: 'Tay sau', muscles: 'Tay sau', zone: 'upper'},
  core: {name: 'Core', muscles: 'Bụng · Lưng sâu', zone: 'core'},
  balance: {name: 'Thăng bằng', muscles: 'Thăng bằng · Cổ chân · Hông', zone: 'core'}
};

BRAIN.EXERCISES = (() => {
  const E = (id, slot, name, equip, lvl, avoid, cue, o = {}) => ({id, slot, name, equip: equip.split('+'), lvl, avoid: avoid || [], cue, time: !!o.time, muscles: o.m || null});
  return [
    // ---------- Squat ----------
    E('sq_box', 'squat', 'Box squat (ngồi chạm ghế rồi đứng lên)', 'none', 1, [], 'Ngồi chạm nhẹ mép ghế rồi đứng lên, gối hướng theo mũi chân'),
    E('sq_wall', 'squat', 'Ngồi tựa tường (wall sit)', 'none', 1, ['bp', 'heart'], 'Lưng áp tường, đùi gần song song sàn, thở đều', {time: true}),
    E('sq_bw', 'squat', 'Squat tay không', 'none', 1, ['knee'], 'Chân rộng bằng vai, đẩy hông ra sau như ngồi ghế, lưng thẳng'),
    E('sq_band', 'squat', 'Squat với dây kháng lực', 'band', 1, ['knee'], 'Đứng lên dây, giữ dây ngang vai, xuống chậm 2 giây'),
    E('sq_goblet_box', 'squat', 'Goblet box squat (ôm tạ, ngồi chạm ghế)', 'db', 1, [], 'Ôm tạ sát ngực, ngồi chạm ghế rồi đứng lên'),
    E('sq_sumo', 'squat', 'Sumo squat cầm tạ đơn', 'db', 1, ['knee'], 'Chân rộng hơn vai, mũi chân xoay ra, tạ thả giữa hai chân', {m: 'Đùi trong · Mông'}),
    E('sq_legpress', 'squat', 'Leg press (đạp đùi trên máy)', 'machine', 1, [], 'Lưng áp sát ghế, không khóa thẳng gối ở đỉnh'),
    E('sq_goblet', 'squat', 'Goblet squat (ôm tạ đơn trước ngực)', 'db', 2, ['knee'], 'Ôm tạ sát ngực, khuỷu tay đi vào giữa hai gối'),
    E('sq_tempo', 'squat', 'Squat xuống chậm 3 giây', 'none', 2, ['knee'], 'Xuống đếm 3 giây, dừng 1 giây ở đáy, đứng lên dứt khoát'),
    E('sq_bar', 'squat', 'Squat tạ đòn', 'barbell', 2, ['knee', 'back', 'preg'], 'Siết bụng, xuống tới khi đùi song song sàn, đẩy qua cả bàn chân'),
    E('sq_jump', 'squat', 'Squat bật nhảy', 'none', 2, ['knee', 'bp', 'heart', 'preg', 'senior'], 'Tiếp đất nhẹ nhàng, gối hơi chùng'),
    E('sq_front', 'squat', 'Front squat tạ đòn', 'barbell', 3, ['knee', 'back', 'preg'], 'Tạ đặt trước vai, khuỷu tay cao, thân thẳng'),
    E('sq_pistol', 'squat', 'Squat 1 chân ngồi xuống ghế', 'none', 3, ['knee', 'preg', 'senior'], 'Một chân trụ, ngồi chậm xuống ghế rồi đứng lên'),

    // ---------- Chân đơn ----------
    E('lg_stepup', 'lunge', 'Bước lên bục thấp (step-up)', 'none', 1, [], 'Dùng bậc thang hoặc ghế thấp; dồn lực vào chân trên bục'),
    E('lg_split', 'lunge', 'Split squat tại chỗ (vịn ghế nếu cần)', 'none', 1, ['knee'], 'Giữ tư thế chân trước chân sau, hạ người thẳng xuống'),
    E('lg_legcurl', 'lunge', 'Leg curl (máy cuốn đùi sau)', 'machine', 1, [], 'Cuốn chậm, dừng 1 giây ở đỉnh', {m: 'Đùi sau'}),
    E('lg_band_curl', 'lunge', 'Cuốn đùi sau với dây (nằm sấp)', 'band', 1, ['preg'], 'Dây buộc cố định, cuốn gót về mông chậm', {m: 'Đùi sau'}),
    E('lg_rev', 'lunge', 'Lunge lùi', 'none', 2, ['knee'], 'Bước lùi, hạ gối sau gần chạm sàn, thân thẳng'),
    E('lg_stepup_db', 'lunge', 'Step-up cầm tạ đơn', 'db', 2, ['preg'], 'Bục cao ngang gối, lên xuống chậm'),
    E('lg_rev_db', 'lunge', 'Lunge lùi cầm tạ đơn', 'db', 2, ['knee', 'preg'], 'Hai tay cầm tạ thả xuôi, bước lùi có kiểm soát'),
    E('lg_lateral', 'lunge', 'Lunge ngang (side lunge)', 'none', 2, ['knee'], 'Bước sang ngang, đẩy hông ra sau, chân kia duỗi thẳng', {m: 'Đùi trong · Mông'}),
    E('lg_walk', 'lunge', 'Lunge đi bộ', 'none', 2, ['knee', 'preg', 'senior'], 'Bước dài về phía trước, luân phiên hai chân'),
    E('lg_bulg', 'lunge', 'Bulgarian split squat (chân sau gác ghế)', 'none', 3, ['knee', 'preg', 'senior'], 'Chân sau gác ghế, hạ người chậm, gối trước không đổ vào trong'),
    E('lg_bulg_db', 'lunge', 'Bulgarian split squat cầm tạ', 'db', 3, ['knee', 'preg', 'senior'], 'Như trên nhưng cầm tạ đơn hai tay'),

    // ---------- Gập hông ----------
    E('hg_drill', 'hinge', 'Gập hông với gậy dọc lưng (học kỹ thuật)', 'none', 1, [], 'Gậy (cán chổi) chạm đầu, lưng, xương cùng; gập hông mà gậy không rời lưng'),
    E('hg_bridge', 'hinge', 'Glute bridge (nằm nâng hông)', 'none', 1, ['preg'], 'Nằm ngửa, đạp gót nâng hông, siết mông 1 giây ở đỉnh'),
    E('hg_rdl_db', 'hinge', 'Romanian deadlift tạ đơn', 'db', 1, ['back'], 'Đẩy hông ra sau, tạ trượt sát đùi, lưng luôn thẳng'),
    E('hg_gm_band', 'hinge', 'Good morning với dây kháng lực', 'band', 1, ['back'], 'Dây vòng sau cổ, gập hông, lưng thẳng'),
    E('hg_hyper', 'hinge', 'Back extension trên ghế La Mã (biên độ nhỏ)', 'machine', 1, ['preg'], 'Không ngửa người quá mức'),
    E('hg_pullthrough', 'hinge', 'Cable pull-through (kéo cáp qua hai chân)', 'cable', 1, [], 'Quay lưng về máy, gập hông rồi đẩy hông ra trước', {m: 'Mông · Đùi sau'}),
    E('hg_bridge1', 'hinge', 'Glute bridge 1 chân', 'none', 2, ['preg'], 'Một chân duỗi thẳng, hông giữ thăng bằng'),
    E('hg_rdl_1', 'hinge', 'Romanian deadlift 1 chân', 'db', 2, ['back', 'preg', 'senior'], 'Một chân trụ, chân kia duỗi ra sau giữ thăng bằng'),
    E('hg_rdl_bar', 'hinge', 'Romanian deadlift tạ đòn', 'barbell', 2, ['back', 'preg'], 'Tạ sát chân, cảm nhận căng đùi sau rồi đứng lên'),
    E('hg_swing', 'hinge', 'Swing với tạ đơn / kettlebell', 'db', 2, ['back', 'bp', 'heart', 'preg'], 'Lực bật từ hông, tay chỉ dẫn hướng tạ'),
    E('hg_dl', 'hinge', 'Deadlift tạ đòn', 'barbell', 3, ['back', 'preg'], 'Siết bụng, đẩy sàn để đứng lên, không cong lưng'),

    // ---------- Mông ----------
    E('gl_thrust', 'glute', 'Hip thrust tựa ghế / sofa', 'none', 1, [], 'Vai tựa ghế, đẩy hông lên thành một đường thẳng'),
    E('gl_donkey', 'glute', 'Đá chân sau quỳ 4 điểm (donkey kick)', 'none', 1, [], 'Gối vuông góc, đạp gót lên trần, không ưỡn lưng'),
    E('gl_frog', 'glute', 'Frog pump (nâng hông, chụm hai bàn chân)', 'none', 1, ['preg'], 'Hai bàn chân áp vào nhau, nâng hông nhịp nhàng'),
    E('gl_clam', 'glute', 'Clamshell với dây kháng lực', 'band', 1, [], 'Nằm nghiêng, mở gối như vỏ sò, hông không xoay', {m: 'Mông nhỡ'}),
    E('gl_bandwalk', 'glute', 'Bước ngang với dây (lateral band walk)', 'band', 1, [], 'Dây quanh gối, hơi khuỵu, bước ngang giữ căng dây', {m: 'Mông nhỡ'}),
    E('gl_thrust_db', 'glute', 'Hip thrust với tạ đơn', 'db', 1, [], 'Vai tựa ghế, đặt tạ trên hông, đẩy lên siết mông'),
    E('gl_abduct', 'glute', 'Hip abduction máy (dạng hông)', 'machine', 1, [], 'Mở chân chậm, giữ 1 giây', {m: 'Mông nhỡ'}),
    E('gl_kick', 'glute', 'Đá chân sau với cáp', 'cable', 1, [], 'Giữ thân cố định, đá chân ra sau bằng lực mông'),
    E('gl_thrust1', 'glute', 'Hip thrust 1 chân', 'none', 2, [], 'Một chân co, chân kia duỗi, đẩy hông lên'),
    E('gl_thrust_bar', 'glute', 'Hip thrust tạ đòn', 'barbell', 2, ['preg'], 'Cằm hơi gập, đẩy hông lên tới khi thân song song sàn'),

    // ---------- Bắp chân ----------
    E('cf_bw', 'calf', 'Nhón gót (vịn tường)', 'none', 1, [], 'Nhón lên cao nhất, hạ chậm'),
    E('cf_machine', 'calf', 'Nhón gót trên máy', 'machine', 1, [], 'Giữ 1 giây ở đỉnh'),
    E('cf_db', 'calf', 'Nhón gót cầm tạ đơn', 'db', 1, [], 'Cầm tạ hai tay, nhón cao, hạ chậm'),
    E('cf_step', 'calf', 'Nhón gót 1 chân trên bậc', 'none', 2, [], 'Gót hạ thấp hơn bậc để giãn hết biên độ'),

    // ---------- Đẩy ngang ----------
    E('hp_wall', 'hpush', 'Hít đất tựa bàn', 'none', 1, [], 'Tay đặt lên mép bàn, thân thẳng một đường'),
    E('hp_knee', 'hpush', 'Hít đất quỳ gối', 'none', 1, [], 'Gối chạm sàn, hạ ngực gần sàn'),
    E('hp_floor_db', 'hpush', 'Đẩy tạ đơn nằm sàn', 'db', 1, ['preg'], 'Nằm sàn, hạ tạ tới khi khuỷu chạm sàn rồi đẩy lên'),
    E('hp_band', 'hpush', 'Đẩy ngực với dây kháng lực', 'band', 1, [], 'Dây vòng sau lưng, đẩy thẳng ra trước'),
    E('hp_machine', 'hpush', 'Chest press máy', 'machine', 1, [], 'Chỉnh ghế để tay cầm ngang ngực'),
    E('hp_cable', 'hpush', 'Ép ngực với cáp (cable fly)', 'cable', 1, [], 'Khuỷu hơi cong, ép hai tay vào giữa ngực', {m: 'Ngực'}),
    E('hp_push', 'hpush', 'Hít đất', 'none', 2, [], 'Thân thẳng, khuỷu tay khoảng 45° so với thân'),
    E('hp_incline_db', 'hpush', 'Đẩy ngực tạ đơn ghế dốc', 'db+bench', 2, [], 'Ghế dốc 30°, hạ tạ ngang ngực trên', {m: 'Ngực trên · Vai trước'}),
    E('hp_db_bench', 'hpush', 'Đẩy ngực tạ đơn ghế phẳng', 'db+bench', 2, ['preg'], 'Hạ tạ ngang ngực, đẩy lên và chụm nhẹ'),
    E('hp_bench', 'hpush', 'Bench press tạ đòn', 'barbell+bench', 2, ['shoulder', 'preg'], 'Vai ép xuống ghế, hạ tạ chạm nhẹ ngực'),
    E('hp_decline', 'hpush', 'Hít đất chân gác cao', 'none', 3, ['shoulder', 'bp', 'preg'], 'Chân gác ghế, giữ bụng siết'),
    E('hp_dip', 'hpush', 'Chống xà kép', 'dip', 3, ['shoulder'], 'Hơi nghiêng người, hạ tới khi khuỷu 90°'),

    // ---------- Đẩy lên ----------
    E('vp_wall', 'vpush', 'Wall slide (trượt tay trên tường)', 'none', 1, [], 'Lưng và tay áp tường, trượt tay lên xuống chậm', {m: 'Vai · Tư thế'}),
    E('vp_lat', 'vpush', 'Nâng tạ đơn ngang vai (lateral raise)', 'db', 1, [], 'Nâng tới ngang vai, khuỷu hơi cong, hạ chậm', {m: 'Vai giữa'}),
    E('vp_lat_band', 'vpush', 'Nâng dây kháng lực ngang vai', 'band', 1, [], 'Đứng lên dây, nâng tay sang ngang tới vai', {m: 'Vai giữa'}),
    E('vp_db', 'vpush', 'Đẩy tạ đơn qua đầu', 'db', 1, ['shoulder'], 'Siết bụng, đẩy thẳng lên, không ưỡn lưng'),
    E('vp_band', 'vpush', 'Đẩy dây kháng lực qua đầu', 'band', 1, ['shoulder'], 'Đứng lên dây, đẩy thẳng lên'),
    E('vp_machine', 'vpush', 'Shoulder press máy', 'machine', 1, ['shoulder'], 'Không khóa khuỷu ở đỉnh'),
    E('vp_pike', 'vpush', 'Pike push-up (hít đất chổng mông)', 'none', 2, ['shoulder', 'bp', 'preg'], 'Hông cao, hạ đầu về phía trước hai tay'),
    E('vp_landmine', 'vpush', 'Landmine press (đẩy tạ đòn chéo)', 'barbell', 2, [], 'Đẩy chéo lên phía trước, thân thiện với vai'),
    E('vp_arnold', 'vpush', 'Arnold press tạ đơn', 'db', 2, ['shoulder'], 'Xoay cổ tay từ trong ra ngoài khi đẩy lên'),
    E('vp_ohp', 'vpush', 'Đẩy tạ đòn qua đầu (OHP)', 'barbell', 3, ['shoulder', 'back', 'preg'], 'Siết mông và bụng, đẩy tạ thẳng trên đầu'),

    // ---------- Kéo ngang ----------
    E('hr_towel', 'hpull', 'Kéo khăn quấn tay nắm cửa', 'none', 1, [], 'Ngả người ra sau, kéo người về phía cửa'),
    E('hr_db', 'hpull', 'Chèo tạ đơn 1 tay', 'db', 1, [], 'Tay kia chống ghế, kéo tạ về phía hông'),
    E('hr_band', 'hpull', 'Kéo dây kháng lực ngang ngực', 'band', 1, [], 'Kéo về bụng, ép hai bả vai lại'),
    E('hr_inv', 'hpull', 'Kéo người trên xà thấp (inverted row)', 'bar', 1, [], 'Xà ngang hông, thân thẳng, kéo ngực chạm xà'),
    E('hr_cable', 'hpull', 'Kéo cáp ngồi (seated row)', 'cable', 1, [], 'Ngồi thẳng, kéo về bụng, không ngả người'),
    E('hr_table', 'hpull', 'Kéo người dưới gầm bàn chắc chắn', 'none', 2, ['preg'], 'Nằm dưới bàn, nắm mép bàn kéo ngực lên'),
    E('hr_chest', 'hpull', 'Chèo tạ đơn tựa ghế dốc', 'db+bench', 2, ['preg'], 'Ngực áp ghế dốc, kéo hai tạ, nhẹ cho lưng'),
    E('hr_bar', 'hpull', 'Chèo tạ đòn (barbell row)', 'barbell', 2, ['back', 'preg'], 'Gập người khoảng 45°, kéo tạ về bụng'),
    E('hr_inv_feet', 'hpull', 'Inverted row chân gác cao', 'bar', 3, [], 'Chân gác ghế để thân song song sàn'),

    // ---------- Kéo xuống ----------
    E('vl_ytw', 'vpull', 'Superman + Y-T-W nằm sấp', 'none', 1, ['preg'], 'Nằm sấp, nâng tay thành chữ Y, T, W', {m: 'Lưng · Vai sau'}),
    E('vl_band', 'vpull', 'Kéo dây kháng lực từ trên xuống', 'band', 1, [], 'Móc dây lên cao (khung cửa), kéo xuống ngực'),
    E('vl_pullover', 'vpull', 'Pullover tạ đơn', 'db', 1, ['shoulder', 'preg'], 'Nằm ngửa, đưa tạ ra sau đầu rồi kéo về ngực'),
    E('vl_lat', 'vpull', 'Kéo xà máy (lat pulldown)', 'cable', 1, [], 'Kéo thanh xuống ngực trên, ép cơ lưng'),
    E('vl_hang', 'vpull', 'Treo xà (dead hang)', 'bar', 1, ['shoulder'], 'Treo thả lỏng, vai hơi kéo xuống', {time: true, m: 'Lưng · Cẳng tay'}),
    E('vl_neg', 'vpull', 'Hít xà hạ chậm', 'bar', 2, ['shoulder'], 'Nhảy lên đỉnh, hạ chậm 3–5 giây'),
    E('vl_band_assist', 'vpull', 'Hít xà có dây kháng lực đỡ', 'bar+band', 2, ['shoulder'], 'Móc dây lên xà, đặt gối hoặc bàn chân vào dây'),
    E('vl_assist', 'vpull', 'Hít xà trên máy hỗ trợ', 'machine', 2, [], 'Chọn mức đỡ vừa đủ để làm được số lần mục tiêu'),
    E('vl_pull', 'vpull', 'Hít xà', 'bar', 3, ['shoulder'], 'Kéo cằm qua xà, hạ có kiểm soát'),

    // ---------- Vai sau, tư thế ----------
    E('rr_wall_w', 'rear', 'W-raise áp tường', 'none', 1, [], 'Quay lưng vào tường, ép bả vai, kéo khuỷu xuống thành chữ W'),
    E('rr_angels', 'rear', 'Thiên thần trên sàn (floor angels)', 'none', 1, ['preg'], 'Nằm ngửa co gối, trượt tay sát sàn lên xuống'),
    E('rr_pullapart', 'rear', 'Kéo giãn dây trước ngực (band pull-apart)', 'band', 1, [], 'Tay thẳng, kéo dây ra hai bên tới ngực'),
    E('rr_facepull_band', 'rear', 'Face pull với dây', 'band', 1, [], 'Kéo dây về ngang mặt, khuỷu tay cao'),
    E('rr_revfly', 'rear', 'Bay ngược tạ đơn (reverse fly)', 'db', 1, [], 'Gập người, nâng tạ sang ngang, ép bả vai'),
    E('rr_facepull', 'rear', 'Face pull với cáp', 'cable', 1, [], 'Kéo dây về ngang mặt, xoay tay ra sau'),
    E('rr_inv_wide', 'rear', 'Inverted row tay rộng', 'bar', 2, [], 'Tay rộng hơn vai, kéo ngực trên chạm xà'),

    // ---------- Tay trước ----------
    E('bi_bag', 'bi', 'Cuốn tay với balo / can nước', 'none', 1, [], 'Khuỷu sát thân, cuốn lên chậm'),
    E('bi_band', 'bi', 'Cuốn tay với dây kháng lực', 'band', 1, [], 'Đứng lên dây, cuốn hai tay'),
    E('bi_db', 'bi', 'Cuốn tạ đơn', 'db', 1, [], 'Xoay ngửa cổ tay khi cuốn lên'),
    E('bi_hammer', 'bi', 'Cuốn tạ búa (hammer curl)', 'db', 1, [], 'Lòng bàn tay hướng vào nhau suốt động tác', {m: 'Tay trước · Cẳng tay'}),
    E('bi_cable', 'bi', 'Cuốn tay với cáp', 'cable', 1, [], 'Không đung đưa người'),
    E('bi_barbell', 'bi', 'Cuốn tạ đòn', 'barbell', 1, [], 'Khuỷu sát thân, không ngả người ra sau'),
    E('bi_chin', 'bi', 'Hít xà tay ngửa (chin-up)', 'bar', 3, ['shoulder'], 'Tay ngửa, rộng bằng vai'),

    // ---------- Tay sau ----------
    E('tr_dip', 'tri', 'Chống đẩy sau ghế (bench dip)', 'none', 1, ['shoulder'], 'Lưng sát ghế, hạ tới khi khuỷu 90°'),
    E('tr_band', 'tri', 'Duỗi tay sau với dây kháng lực', 'band', 1, [], 'Khuỷu cố định, duỗi thẳng tay'),
    E('tr_db', 'tri', 'Duỗi tay sau với tạ đơn', 'db', 1, [], 'Tạ sau đầu, duỗi thẳng lên'),
    E('tr_kick', 'tri', 'Đá tay sau tạ đơn (kickback)', 'db', 1, [], 'Gập người, khuỷu cố định sát thân, duỗi tay ra sau'),
    E('tr_cable', 'tri', 'Kéo cáp tay sau', 'cable', 1, [], 'Khuỷu sát thân, đẩy xuống thẳng tay'),
    E('tr_close', 'tri', 'Hít đất tay hẹp', 'none', 2, [], 'Hai tay gần nhau, khuỷu sát thân'),
    E('tr_bardip', 'tri', 'Chống xà kép thân thẳng (tay sau)', 'dip', 2, ['shoulder'], 'Giữ thân thẳng đứng, khuỷu sát thân'),

    // ---------- Core ----------
    E('cr_birddog', 'core', 'Bird-dog (chống 4 điểm, duỗi tay chân đối)', 'none', 1, [], 'Duỗi chậm, giữ hông không xoay'),
    E('cr_deadbug', 'core', 'Dead bug', 'none', 1, ['preg'], 'Lưng dưới áp sàn, duỗi tay chân đối nhau'),
    E('cr_plank_incline', 'core', 'Plank tựa ghế', 'none', 1, [], 'Tay chống ghế, thân thẳng, siết bụng', {time: true}),
    E('cr_plank', 'core', 'Plank', 'none', 1, ['preg'], 'Khuỷu dưới vai, thân thẳng, siết mông và bụng', {time: true}),
    E('cr_pallof', 'core', 'Pallof press với dây (chống xoay)', 'band', 1, [], 'Đẩy dây ra trước, không để thân xoay', {m: 'Bụng chéo · Core'}),
    E('cr_pallof_g', 'core', 'Pallof press với cáp', 'cable', 1, [], 'Đẩy cáp ra trước, giữ 2 giây', {m: 'Bụng chéo · Core'}),
    E('cr_carry', 'core', 'Farmer walk (xách tạ đi bộ)', 'db', 1, [], 'Xách tạ hai tay, đi thẳng người 30–40 m', {time: true, m: 'Core · Cẳng tay · Vai'}),
    E('cr_side', 'core', 'Plank nghiêng', 'none', 2, ['shoulder', 'preg'], 'Thân thẳng một đường từ đầu đến chân', {time: true, m: 'Bụng chéo'}),
    E('cr_tap', 'core', 'Plank chạm vai', 'none', 2, ['shoulder', 'preg'], 'Plank tay thẳng, lần lượt chạm vai, hông không lắc'),
    E('cr_mc', 'core', 'Mountain climber chậm', 'none', 2, ['knee', 'bp', 'preg'], 'Kéo gối về ngực luân phiên, hông thấp'),
    E('cr_revcrunch', 'core', 'Gập bụng ngược (reverse crunch)', 'none', 2, ['back', 'preg'], 'Cuộn hông lên khỏi sàn, hạ chậm', {m: 'Bụng dưới'}),
    E('cr_bicycle', 'core', 'Đạp xe nằm (bicycle crunch)', 'none', 2, ['back', 'preg'], 'Khuỷu chạm gối đối diện, chậm và có kiểm soát', {m: 'Bụng · Bụng chéo'}),
    E('cr_suitcase', 'core', 'Suitcase carry (xách tạ 1 tay)', 'db', 2, [], 'Xách tạ một bên, giữ thân thẳng không nghiêng', {time: true, m: 'Bụng chéo'}),
    E('cr_hang', 'core', 'Treo xà nâng gối', 'bar', 2, ['shoulder', 'preg'], 'Treo người, nâng gối lên ngực chậm', {m: 'Bụng dưới'}),
    E('cr_dipknee', 'core', 'Nâng gối trên xà kép', 'dip', 2, ['shoulder', 'preg'], 'Chống thẳng tay trên xà, nâng gối lên ngực', {m: 'Bụng dưới'}),
    E('cr_hollow', 'core', 'Hollow hold', 'none', 3, ['back', 'preg'], 'Lưng dưới áp sàn, tay chân duỗi xa', {time: true}),
    E('cr_wheel', 'core', 'Lăn bánh xe bụng (ab wheel) quỳ gối', 'abwheel', 3, ['back', 'shoulder', 'preg'], 'Lăn ra chậm, giữ lưng không võng'),

    // ---------- Thăng bằng (tự thêm cho người từ 55 tuổi) ----------
    E('bl_stand', 'balance', 'Đứng 1 chân (cạnh tường)', 'none', 1, [], 'Đứng gần tường để vịn khi cần, mắt nhìn thẳng', {time: true}),
    E('bl_tandem', 'balance', 'Đi gót chạm mũi trên vạch thẳng', 'none', 1, [], 'Đi chậm 10–15 bước, gót chân trước chạm mũi chân sau'),
    E('bl_reach', 'balance', 'Đứng 1 chân, với tay ra xa', 'none', 2, [], 'Đứng 1 chân, với tay ra trước, sang ngang, ra sau'),
    E('bl_band', 'balance', 'Đứng 1 chân, chân kia đá dây kháng lực', 'band', 2, [], 'Chân trụ hơi khuỵu, giữ thân thẳng'),
    E('bl_eyes', 'balance', 'Đứng 1 chân nhắm mắt (sát tường)', 'none', 3, [], 'Luôn đứng sát tường để vịn', {time: true})
  ];
})();
