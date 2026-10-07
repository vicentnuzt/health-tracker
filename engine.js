/* =====================================================================
   BỘ MÁY PHÂN TÍCH
   Đọc hồ sơ người dùng + dữ liệu trong thư mục brain/ → trả về kế hoạch.
   Không đụng tới giao diện, nên có thể kiểm thử riêng (chạy được bằng Node).
   ===================================================================== */
const r0 = n => Math.round(n);
const r1 = n => Math.round(n * 10) / 10;
const ds = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseDs = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseDs(s); d.setDate(d.getDate() + n); return ds(d); };
const today = () => ds(new Date());
const dayDiff = (a, b) => Math.round((parseDs(b) - parseDs(a)) / 864e5);
const weekIdx = s => (parseDs(s).getDay() + 6) % 7; // 0 = Thứ 2

const ENGINE = (() => {
  const B = BRAIN;
  const JOB = {desk: 1.2, light: 1.375, active: 1.55, heavy: 1.725};
  const PACE = {loss: {slow: 0.005, normal: 0.0075, fast: 0.01}, gain: {slow: 0.0025, normal: 0.004, fast: 0.005}};
  const LVL = {new: 1, some: 2, pro: 3};
  const ACCESSORY = ['core', 'calf', 'rear', 'balance'];
  const has = (arr, k) => (arr || []).includes(k);
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  // Chống chỉ định áp dụng cho người dùng: bệnh lý + mang thai + tuổi
  const tagsOf = p => [...(p.health || []), ...(p.special === 'pregnant' ? ['preg'] : []), ...(p.age >= 60 ? ['senior'] : [])];
  const isSenior = p => p.age >= 55;

  function healthyRange(height) { const m = (height / 100) ** 2; return {lo: 18.5 * m, hi: 22.9 * m}; }

  function phaseOf(p, date = today()) {
    const programWeek = Math.max(1, Math.floor(dayDiff(p.startDate || date, date) / 7) + 1);
    const cycleWeek = ((programWeek - 1) % 12) + 1;
    const ph = B.PHASES.find(x => cycleWeek >= x.from && cycleWeek <= x.to);
    return {...ph, programWeek, cycleWeek, cycle: Math.ceil(programWeek / 12), weekNote: (ph.weeks && ph.weeks[cycleWeek]) || ''};
  }

  function stepsPlan(p, programWeek) {
    const S = B.STEPS;
    const start = S.start[p.job] || 7000;
    const goal = Math.max(start, S.goal[p.focus] || 9000);
    return {now: Math.min(goal, start + Math.floor((programWeek - 1) / S.everyWeeks) * S.inc), goal};
  }

  // '3–4' + (-1) → '2–3'
  function adjSets(s, d) {
    if (!d) return s;
    return [...new Set(String(s).split('–').map(x => Math.max(1, +x + d)))].join('–');
  }

  /* ---------------- Chọn bài tập theo dụng cụ người dùng có ---------------- */
  const safe = (e, tags) => !e.avoid.some(a => tags.includes(a));
  const ownedSet = p => new Set(['none', ...(p.equipment || [])]);
  const usable = (e, owned) => e.equip.every(q => owned.has(q));
  const equipScore = e => e.equip.reduce((s, q) => s + (B.EQUIP_WEIGHT[q] || 0), 0);
  const equipName = id => (B.EQUIPMENT.find(q => q.id === id) || {}).name || id;
  const equipLabel = e => e.equip.filter(q => q !== 'none').map(equipName).join(' + ');
  function candidates(slot, p, tags) {
    const owned = ownedSet(p);
    return B.EXERCISES.filter(e => e.slot === slot && usable(e, owned) && safe(e, tags));
  }
  function pickExercise(slot, p, tags, lvl, variant, used) {
    let c = candidates(slot, p, tags).filter(e => e.lvl <= lvl);
    if (!c.length) c = candidates(slot, p, tags);
    // Ưu tiên bài dùng dụng cụ tăng được mức tải, rồi tới độ khó phù hợp
    const score = e => equipScore(e) + e.lvl * 1.5;
    c.sort((a, b) => score(b) - score(a));
    // Hết bài mới trong nhóm → bỏ qua nhóm thay vì lặp lại bài đã có trong buổi
    const fresh = c.filter(e => !used.has(e.id));
    return fresh.length ? fresh[variant % fresh.length] : null;
  }
  const exerciseById = id => B.EXERCISES.find(x => x.id === id) || null;
  const brief = e => ({id: e.id, name: e.name, cue: e.cue, muscles: e.muscles || B.SLOT_INFO[e.slot].muscles, time: e.time, equip: equipLabel(e)});

  // Số bài tập dùng được với dụng cụ hiện có (đã loại bài không an toàn)
  function availableCount(p, owned = ownedSet(p)) {
    const tags = tagsOf(p);
    return B.EXERCISES.filter(e => usable(e, owned) && safe(e, tags)).length;
  }
  // Mua thêm dụng cụ nào sẽ mở khóa nhiều bài tập phù hợp nhất
  function equipUpgrades(p) {
    const owned = ownedSet(p), now = availableCount(p, owned);
    return B.EQUIPMENT.filter(q => q.home && !owned.has(q.id))
      .map(q => ({...q, gain: availableCount(p, new Set([...owned, q.id])) - now}))
      .filter(x => x.gain > 0).sort((a, b) => b.gain - a.gain);
  }

  // Bài dễ hơn / khó hơn một bậc trong cùng nhóm, hợp dụng cụ và an toàn
  function alternatives(id, p) {
    const e = exerciseById(id);
    if (!e) return {easier: null, harder: null};
    const c = candidates(e.slot, p, tagsOf(p)).filter(x => x.id !== id);
    const rank = x => (x.equip.join() === e.equip.join() ? 2 : 0) + equipScore(x) / 3;
    const easier = c.filter(x => x.lvl < e.lvl).sort((a, b) => b.lvl - a.lvl || rank(b) - rank(a))[0];
    const harder = c.filter(x => x.lvl > e.lvl).sort((a, b) => a.lvl - b.lvl || rank(b) - rank(a))[0];
    return {easier: easier ? brief(easier) : null, harder: harder ? brief(harder) : null};
  }

  // Thông tin hiển thị + dùng cho đồng hồ tập của một bài
  function exInfo(e, p, sets, scheme, phase) {
    const acc = ACCESSORY.includes(e.slot);
    const s = acc ? (phase.setsDelta < 0 ? '2' : '3') : sets;
    const repsRep = e.slot === 'balance' ? '10 lần mỗi chân' : e.slot === 'core' ? B.REPS_SPECIAL.core
      : e.slot === 'calf' ? B.REPS_SPECIAL.calf : e.slot === 'rear' ? B.REPS_SPECIAL.rear : `${scheme.reps} lần`;
    const repsTime = e.slot === 'balance' ? B.REPS_SPECIAL.balance : B.REPS_SPECIAL.hold;
    const alt = alternatives(e.id, p);
    const weighted = e.equip.some(q => ['db', 'barbell', 'cable', 'machine'].includes(q));
    const step = e.equip.some(q => ['barbell', 'cable', 'machine'].includes(q)) ? 2.5 : weighted ? 1 : 0;
    return {id: e.id, slot: e.slot, name: e.name, cue: e.cue, muscles: e.muscles || B.SLOT_INFO[e.slot].muscles, time: e.time, equip: equipLabel(e),
      equipIds: e.equip, weighted, step,
      sets: s, setsN: parseInt(s, 10), reps: e.time ? repsTime : repsRep, repsRep, repsTime, holdSec: parseInt(repsTime, 10),
      rest: acc ? `${B.ACCESSORY_REST} giây` : scheme.rest, restSec: acc ? B.ACCESSORY_REST : scheme.restSec,
      easier: alt.easier, harder: alt.harder};
  }

  // Thứ tự nhóm: bài chính đa khớp → bài thăng bằng (≥55 tuổi) → bài cho vùng muốn cải thiện → phần còn lại
  function slotOrder(type, p, count) {
    const tp = B.TEMPLATES[type], extra = [];
    if (isSenior(p) && tp.accepts.includes('balance')) extra.push('balance');
    for (const a of (p.areas || [])) for (const s of ((B.AREAS[a] || {}).slots || [])) if (tp.accepts.includes(s)) extra.push(s);
    // Buổi ngắn: vẫn chừa 1 chỗ cho bài bổ trợ ưu tiên (thăng bằng / vùng muốn cải thiện)
    const mains = extra.length ? Math.min(B.MAIN_LIFTS, count - 1) : B.MAIN_LIFTS;
    return [...tp.base.slice(0, mains), ...extra, ...tp.base.slice(mains)];
  }

  // Môn cardio: môn người dùng thích + máy cardio họ có; không có gì thì đi bộ / đạp xe / bơi
  function cardioPool(p, tags) {
    const owned = ownedSet(p);
    const ok = c => c && safe(c, tags) && (!c.needs || owned.has(c.needs));
    const byId = id => B.CARDIO.find(x => x.id === id);
    let ids = (p.sports || []).filter(s => s !== 'yoga' && ok(byId(s)));
    for (const c of B.CARDIO) if (c.needs && ok(c) && !ids.includes(c.id)) ids.push(c.id);
    if (!ids.length) ids = B.CARDIO_DEFAULT.filter(id => ok(byId(id)));
    return ids.length ? ids : ['walk'];
  }

  function hrZones(p) {
    const max = 208 - 0.7 * p.age;
    const cap = has(p.health, 'heart') || has(p.health, 'bp') || p.special === 'pregnant';
    return {z2lo: r0(max * 0.6), z2hi: r0(max * (cap ? 0.65 : 0.7)), hiLo: r0(max * 0.8), hiHi: r0(max * 0.9)};
  }

  const easyPhase = ph => ['intro', 'deload', 'review'].includes(ph.key);
  const round5 = n => Math.max(10, Math.round(n / 5) * 5);

  function strengthDay(p, w, type, variant, lvl, sets, scheme, phase, d, pool, tags) {
    const tp = B.TEMPLATES[type], len = +p.len, count = B.EXERCISE_COUNT[len] || 5;
    const used = new Set(), exercises = [];
    for (const slot of slotOrder(type, p, count)) {
      if (exercises.length >= count) break;
      const e = pickExercise(slot, p, tags, lvl, variant, used);
      if (!e) continue;
      used.add(e.id);
      exercises.push(exInfo(e, p, sets, scheme, phase));
    }
    const notes = [];
    if (len <= 30) notes.push('Tập theo vòng (circuit): làm lần lượt từng bài, nghỉ 30–45 giây giữa các bài; số vòng = số hiệp.');
    if (len >= 90) notes.push(`Kết thúc bằng 15–20 phút ${B.CARDIO.find(x => x.id === pool[0]).name.toLowerCase()} nhẹ nhàng.`);
    return {day: d, kind: 'strength', type, zone: tp.zone, emoji: '🏋️', title: tp.name, minutes: len,
      kcal: r0(B.STRENGTH_MET * w * len / 60), warmup: B.WARMUP[tp.zone], cooldown: B.COOLDOWN[tp.zone], exercises, notes};
  }

  function cardioDay(p, w, id, first, phase, d, tags) {
    const c = B.CARDIO.find(x => x.id === id);
    const z = hrZones(p);
    const risky = has(p.health, 'heart') || has(p.health, 'bp') || p.special === 'pregnant' || tags.includes('senior');
    const interval = first && phase.key === 'push' && p.exp !== 'new' && !risky;
    const rounds = p.exp === 'pro' ? 8 : 6;
    const minutes = interval ? 10 + rounds * 3 : easyPhase(phase) ? round5(+p.len * 0.75) : +p.len;
    const items = interval
      ? ['Khởi động 5 phút nhẹ nhàng', `Xen kẽ 1 phút nhanh (nhịp tim ${z.hiLo}–${z.hiHi}) và 2 phút chậm, lặp ${rounds} lượt`, 'Thả lỏng 5 phút']
      : [`${minutes} phút ở vùng 2: nhịp tim khoảng ${z.z2lo}–${z.z2hi} nhịp/phút (thở nhanh nhưng vẫn nói được câu ngắn)`];
    return {day: d, kind: 'cardio', cardioId: id, emoji: c.e, title: c.name + (interval ? ' (biến tốc)' : ''), minutes, met: c.met,
      interval, intervals: interval ? {warm: 300, on: 60, off: 120, rounds, cool: 300} : null,
      zone: interval ? {lo: z.hiLo, hi: z.hiHi} : {lo: z.z2lo, hi: z.z2hi},
      warmup: B.WARMUP.cardio, cooldown: B.COOLDOWN.cardio, items, kcal: r0(c.met * (interval ? 1.15 : 1) * w * minutes / 60)};
  }

  function restDay(d, steps) {
    return {day: d, kind: 'rest', emoji: '😴', title: 'Nghỉ, hồi phục', minutes: 0, kcal: 0,
      items: [`Đi bộ nhẹ 20–30 phút (mục tiêu ${steps.toLocaleString('vi-VN')} bước)`, 'Giãn cơ 10 phút: ' + B.MOBILITY.join(', ')]};
  }

  // Chọn n ngày trong những ngày người dùng rảnh sao cho cách đều nhau nhất
  function chooseDays(n, pref) {
    const days = [...new Set((pref || []).map(Number))].filter(x => x >= 0 && x <= 6).sort((a, b) => a - b);
    if (days.length < n) return B.DAY_SLOTS[n];
    let best = null, bestScore = -Infinity;
    const walk = (start, acc) => {
      if (acc.length === n) {
        const gaps = acc.map((v, i) => i ? v - acc[i - 1] : v + 7 - acc[acc.length - 1]);
        const score = Math.min(...gaps) * 100 - gaps.reduce((s, g) => s + g * g, 0);
        if (score > bestScore) { bestScore = score; best = [...acc]; }
        return;
      }
      for (let i = start; i < days.length; i++) { acc.push(days[i]); walk(i + 1, acc); acc.pop(); }
    };
    walk(0, []);
    return best;
  }

  function buildWeek(p, w, phase, steps) {
    const n = +p.days;
    const types = (B.SPLITS[p.focus] || B.SPLITS.health)[n];
    const slots = chooseDays(n, p.trainDays);
    const tags = tagsOf(p);
    const lvl = Math.min(3, LVL[p.exp] + (phase.lvlDelta || 0));
    const scheme = B.SCHEMES[p.focus][p.exp];
    const sets = adjSets(scheme.sets, phase.setsDelta);
    const pool = cardioPool(p, tags);
    const week = Array.from({length: 7}, (_, d) => restDay(d, steps.now));
    const occ = {};
    let ci = 0;
    types.forEach((t, k) => {
      const d = slots[k];
      if (t === 'CARDIO') { week[d] = cardioDay(p, w, pool[ci % pool.length], ci === 0, phase, d, tags); ci++; }
      else { occ[t] = (occ[t] ?? -1) + 1; week[d] = strengthDay(p, w, t, occ[t], lvl, sets, scheme, phase, d, pool, tags); }
    });
    if (has(p.sports, 'yoga')) {
      const r = week.find(x => x.kind === 'rest');
      if (r) Object.assign(r, {emoji: '🧘', title: 'Yoga, giãn cơ', minutes: 30, kcal: r0(2.5 * w * 0.5), met: 2.5, yoga: true,
        warmup: ['Thở chậm 1 phút', 'Xoay khớp nhẹ nhàng'], cooldown: ['Nằm thư giãn 2–3 phút'], items: ['20–40 phút yoga nhẹ nhàng']});
    }
    let backToBack = false;
    for (let d = 1; d < 7; d++) {
      if (week[d].zone === 'full' && week[d - 1].zone === 'full') {
        backToBack = true;
        week[d].notes.unshift('Hôm qua vừa tập toàn thân: giữ mức tạ nhẹ hơn, bớt 1 hiệp nếu cơ còn mỏi.');
      }
    }
    week.hasRepeat = Object.values(occ).some(v => v > 0);
    week.backToBack = backToBack;
    return week;
  }

  /* ---------------- Năng lượng & dinh dưỡng ---------------- */
  function metrics(p, w, week) {
    const h = p.height / 100;
    const bmr = 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
    const train = week.reduce((a, d) => a + (d.kcal || 0), 0) / 7;
    const tdee = bmr * (JOB[p.job] || 1.2) + train + (+p.tdeeAdjust || 0);
    const diff = p.goalWeight - w;
    let dir = Math.abs(diff) < 0.3 ? 0 : Math.sign(diff);
    const flags = [];
    if (p.special === 'pregnant') dir = 0;
    let floor = p.sex === 'm' ? 1500 : 1200;
    if (p.special === 'breastfeeding') floor = 1800;
    let target = tdee;
    if (dir < 0) {
      let pct = PACE.loss[p.pace] || PACE.loss.normal;
      if (p.special === 'breastfeeding') pct = Math.min(pct, 0.5 / w);
      let def = w * pct * 7700 / 7;
      if (def > tdee * 0.25) { def = tdee * 0.25; flags.push('capped'); }
      if (p.age < 18 && def > 300) { def = 300; flags.push('teen'); }
      target = tdee - def;
      if (target < floor) { target = floor; flags.push('floor'); }
      // Mức tối thiểu an toàn gần bằng / cao hơn mức tiêu hao → không còn thâm hụt đáng kể
      if (target > tdee - 100) flags.push('noDeficit');
    } else if (dir > 0) {
      target = tdee + Math.min(w * (PACE.gain[p.pace] || PACE.gain.normal) * 7700 / 7, 500);
    }
    target = Math.round(target / 10) * 10;
    const rate = dir === 0 ? 0 : Math.max(0, dir < 0 ? tdee - target : target - tdee) * 7 / 7700;
    const weeks = dir === 0 || rate < 0.05 ? 0 : Math.abs(diff) / rate;
    const eta = weeks ? addDays(today(), Math.ceil(weeks * 7)) : null;
    // Đạm: người thừa cân tính theo cân nặng điều chỉnh (BMI 25); người lớn tuổi cần nhiều hơn
    const protBase = Math.min(w, 25 * h * h);
    let gpk = p.focus === 'muscle' ? 1.8 : dir < 0 ? 1.6 : 1.2;
    if (isSenior(p)) gpk = Math.max(gpk, 1.4);
    const protein = Math.min(r0(protBase * gpk), r0(target * 0.35 / 4));
    const fat = r0(target * (p.diet === 'lowcarb' ? 0.4 : 0.27) / 9);
    const carb = Math.max(0, r0((target - protein * 4 - fat * 9) / 4));
    // Chia calo theo ngày: ngày tập nhiều hơn, ngày nghỉ ít hơn, trung bình tuần giữ nguyên
    const dayTargets = week.map(d => Math.max(floor, Math.round((target + ((d.kcal || 0) - train) * B.CALORIE_CYCLING) / 10) * 10));
    const tr = week.filter(d => d.kind !== 'rest').map(d => dayTargets[d.day]);
    const rs = week.filter(d => d.kind === 'rest').map(d => dayTargets[d.day]);
    const cycleDelta = tr.length && rs.length ? r0(avg(tr) - avg(rs)) : 0;
    return {w, bmr, tdee, train, target, dayTargets, cycleDelta, dir, diff, rate, weeks, eta, flags, floor, protein, fat, carb,
      fiber: r0(target / 1000 * 14), water: w * 0.035, bmi: w / (h * h), goalBmi: p.goalWeight / (h * h), range: healthyRange(p.height)};
  }

  function fits(p, x) {
    if (p.diet === 'vegan' && x.diet !== 'vegan') return false;
    if (p.diet === 'veg' && x.diet === 'omni') return false;
    if ((x.tags || []).some(t => has(p.avoid, t))) return false;
    return true;
  }

  /* ---------------- Món ăn: tra cứu, phân loại nên ăn / hạn chế ---------------- */
  // Bỏ dấu tiếng Việt để tìm "pho bo" vẫn ra "Phở bò"
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

  function classify(x) {
    if (x.flag) return {flag: x.flag, why: x.why, alt: x.alt};
    const pd = x.kcal ? x.p * 4 / x.kcal : 0, fr = x.kcal ? x.f * 9 / x.kcal : 0;
    let flag = null, why = '';
    if (x.cat === 'drink' && x.c >= 20 && x.p < 3) { flag = 'limit'; why = 'Nhiều đường'; }
    else if (x.cat === 'bakery' && x.c >= 15 && pd < 0.12) { flag = 'limit'; why = 'Nhiều đường'; }
    else if (['snack', 'fastfood', 'bakery'].includes(x.cat) && fr >= 0.45 && x.kcal >= 150) { flag = 'limit'; why = 'Nhiều dầu mỡ'; }
    else if (x.cat === 'fastfood' && fr >= 0.4 && pd < 0.25) { flag = 'limit'; why = 'Chiên / nhiều dầu mỡ'; }
    else if (x.kcal >= 650 && pd < 0.18) { flag = 'limit'; why = 'Nhiều calo, ít đạm'; }
    else if (fr >= 0.45 && x.kcal >= 300 && pd < 0.25) { flag = 'limit'; why = 'Nhiều dầu mỡ'; }
    else if (pd >= 0.25) { flag = 'good'; why = 'Giàu đạm'; }
    else if (pd >= 0.2 && x.kcal <= 550 && fr < 0.35) { flag = 'good'; why = 'Cân bằng, đủ đạm'; }
    else if (['veg', 'fruit'].includes(x.cat) && x.kcal <= 110) { flag = 'good'; why = x.cat === 'veg' ? 'Ít calo, nhiều xơ' : 'Ít calo, nhiều vitamin'; }
    else if (x.cat === 'drink' && x.kcal <= 60) { flag = 'good'; why = 'Gần như không calo'; }
    return {flag, why: why || x.why, alt: x.alt};
  }

  // Danh sách món (kèm món người dùng tự lưu), mỗi món có nhãn
  function foods(custom = []) {
    const mine = custom.map(f => ({n: f.name, unit: f.unit || '1 phần', kcal: f.kcal, p: f.p, c: f.c, f: f.f, cat: 'mine', diet: 'omni', tags: [], flag: null, why: '', alt: '', mine: true}));
    return [...mine, ...B.FOOD_DB].map(x => ({...x, ...classify(x), key: norm(x.n)}));
  }
  function searchFood(q, cat, custom) {
    const nq = norm(q).trim(), words = nq.split(/\s+/).filter(Boolean);
    // Ưu tiên: tên bắt đầu bằng từ khóa → có cụm từ khóa liền nhau → các từ nằm rải rác
    const rank = x => x.key.startsWith(nq) ? 0 : x.key.includes(nq) ? 1 : 2;
    return foods(custom).filter(x => (!cat || x.cat === cat) && words.every(w => x.key.includes(w)))
      .map((x, i) => ({x, i, r: rank(x)})).sort((a, b) => a.r - b.r || a.i - b.i).map(o => o.x);
  }
  // Món nên ăn / nên hạn chế theo chế độ ăn và mục tiêu của người dùng
  function foodAdvice(p, c) {
    const all = foods().filter(x => fits(p, x));
    const pd = x => x.kcal ? x.p * 4 / x.kcal : 0;
    const good = all.filter(x => x.flag === 'good').sort((a, b) => c && c.dir > 0 ? b.p - a.p : pd(b) - pd(a));
    const hab = {milktea: 'Trà sữa', soda: 'Nước ngọt', beer: 'Bia', sweets: 'Bánh ngọt', snacking: 'Snack'};
    const mineFirst = Object.entries(hab).filter(([k]) => has(p.habits, k)).map(([, v]) => norm(v));
    const limit = all.filter(x => x.flag === 'limit')
      .sort((a, b) => (mineFirst.some(m => b.key.startsWith(m)) - mineFirst.some(m => a.key.startsWith(m))) || b.kcal - a.kcal);
    return {good, limit};
  }

  /* ---------------- Tăng tiến: gợi ý mức tạ / số lần cho buổi sau ---------------- */
  const repRange = s => { const m = String(s).match(/(\d+)(?:–(\d+))?/); return m ? [+m[1], +(m[2] || m[1])] : [10, 12]; };
  const fmtKg = n => (Math.round(n * 10) / 10).toLocaleString('vi-VN');
  // Điểm của 1 hiệp: bài có tạ dùng 1RM ước tính (Epley), bài không tạ dùng số lần / số giây
  const setScore = (ex, s) => ex.weighted && s[0] > 0 ? s[0] * (1 + s[1] / 30) : s[1];

  function suggest(ex, hist) {
    const last = hist && hist.length ? hist[hist.length - 1] : null;
    const [lo, hi] = repRange(ex.reps);
    if (!last) return {kg: null, reps: hi, last: '', up: false,
      text: ex.weighted ? `Buổi đầu: chọn mức tạ làm được ${lo} lần mà vẫn còn dư 2–3 lần.` : ''};
    const kg = Math.max(...last.s.map(x => x[0])), reps = last.s.map(x => x[1]);
    const allTop = reps.every(r => r >= hi);
    const lastTxt = ex.weighted && kg > 0 ? `${fmtKg(kg)} kg × ${reps.join('/')}` : ex.time ? reps.map(r => `${r}s`).join('/') : `${reps.join('/')} lần`;
    if (ex.weighted && kg > 0) {
      if (allTop) { const nk = kg + ex.step; return {kg: nk, reps: lo, last: lastTxt, up: true, text: `Lần trước ${lastTxt} → tăng lên ${fmtKg(nk)} kg, mục tiêu ${lo} lần`}; }
      return {kg, reps: Math.min(hi, Math.max(...reps) + 1), last: lastTxt, up: false, text: `Lần trước ${lastTxt} → giữ ${fmtKg(kg)} kg, cố thêm 1 lần mỗi hiệp`};
    }
    if (allTop) return {kg: null, reps: hi, last: lastTxt, up: true,
      text: `Lần trước ${lastTxt} (đạt tối đa) → ${ex.harder ? `thử bài khó hơn: ${ex.harder.name}` : ex.time ? 'giữ thêm 10 giây' : 'xuống chậm 3 giây cho khó hơn'}`};
    return {kg: null, reps: Math.min(hi, Math.max(...reps) + 1), last: lastTxt, up: false, text: `Lần trước ${lastTxt} → cố thêm ${ex.time ? '5 giây' : '1 lần'} mỗi hiệp`};
  }
  function isPR(ex, hist, sets) {
    if (!hist || !hist.length || !sets.length) return false;
    const best = Math.max(...hist.flatMap(h => h.s.map(x => setScore(ex, x))));
    return Math.max(...sets.map(x => setScore(ex, x))) > best + 1e-9;
  }

  /* ---------------- Đọc nhật ký để HLV nhận xét ---------------- */
  const dayKcal = (state, d) => { const x = state.days[d]; return x ? x.meals.reduce((a, m) => a + m.kcal, 0) : 0; };
  const dayProt = (state, d) => { const x = state.days[d]; return x ? x.meals.reduce((a, m) => a + m.p, 0) : 0; };
  const doneOn = (state, d) => ((state.days[d] || {}).ex || []).some(e => e.planned);
  const hasLog = (state, d) => { const x = state.days[d]; return !!((x && (x.meals.length || x.ex.length)) || state.weights[d] != null); };

  function slope(points) {
    const xs = points.map(e => e.x), ys = points.map(e => e.y), n = xs.length;
    const mx = avg(xs), my = avg(ys);
    let sxy = 0, sxx = 0;
    xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
    return sxx ? sxy / sxx : 0;
  }

  function review(state, p, c, date = today()) {
    const prior = Array.from({length: 7}, (_, i) => addDays(date, -(i + 1))).filter(d => d >= (p.startDate || d));
    const logged = prior.filter(d => dayKcal(state, d) >= 800);
    const avgKcal = avg(logged.map(d => dayKcal(state, d)));
    const avgTarget = logged.length ? avg(logged.map(d => c.dayTargets[weekIdx(d)])) : c.target;
    const avgP = avg(logged.map(d => dayProt(state, d)));
    // Buổi tập tuần này (từ Thứ 2)
    const wi = weekIdx(date), monday = addDays(date, -wi);
    let done = 0, plannedSoFar = 0, plannedWeek = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      if (d < (p.startDate || d)) continue;
      const planned = c.week[i].kind !== 'rest';
      if (planned) plannedWeek++;
      if (doneOn(state, d)) done++;
      if (planned && (i < wi || (i === wi && doneOn(state, d)))) plannedSoFar++;
    }
    // Chuỗi ngày ghi chép liên tục
    let s = hasLog(state, date) ? date : addDays(date, -1), streak = 0;
    while (hasLog(state, s) && streak < 999) { streak++; s = addDays(s, -1); }
    // Cuối tuần so với ngày thường (14 ngày)
    const last14 = Array.from({length: 14}, (_, i) => addDays(date, -(i + 1))).filter(d => dayKcal(state, d) >= 800);
    const we = last14.filter(d => weekIdx(d) >= 5), wd = last14.filter(d => weekIdx(d) < 5);
    const weekendExtra = we.length && wd.length >= 3 ? r0(avg(we.map(d => dayKcal(state, d))) - avg(wd.map(d => dayKcal(state, d)))) : 0;
    // Xu hướng cân 14 ngày
    const ws = Object.entries(state.weights).filter(([d]) => d > addDays(date, -15) && d <= date).sort((a, b) => a[0] < b[0] ? -1 : 1);
    const trend = ws.length >= 3 && dayDiff(ws[0][0], ws[ws.length - 1][0]) >= 7
      ? slope(ws.map(([d, w]) => ({x: dayDiff(ws[0][0], d), y: w}))) * 7 : null;
    const allW = Object.keys(state.weights).filter(d => d <= date).sort();
    const water = prior.map(d => (state.days[d] || {}).water || 0).filter(x => x > 0);
    // Cảm nhận độ nặng các buổi gần đây + kỷ lục mới trong 7 ngày
    const sessions = [];
    for (let i = 0; i < 21; i++) {
      const d = addDays(date, -i);
      ((state.days[d] || {}).ex || []).filter(e => e.planned).forEach(e => sessions.push({d, rpe: e.rpe, prs: e.prs || 0}));
    }
    const rpes = sessions.filter(x => x.rpe).map(x => x.rpe);
    const prs7 = sessions.filter(x => x.d > addDays(date, -7)).reduce((a, x) => a + x.prs, 0);
    return {rpes, prs7, loggedDays: logged.length, avgKcal: r0(avgKcal), avgTarget: r0(avgTarget), kcalDiff: logged.length ? r0(avgKcal - avgTarget) : 0,
      avgP: r0(avgP), protPct: c.protein ? avgP / c.protein : 1, done, plannedSoFar, plannedWeek, streak, weekendExtra, trend,
      lastWeighAgo: allW.length ? dayDiff(allW[allW.length - 1], date) : null,
      waterDays: water.length, waterAvg: avg(water), waterGoal: Math.ceil(c.water / 0.25), daysSinceStart: dayDiff(p.startDate || date, date)};
  }

  /* ---------------- Phân tích tổng hợp ---------------- */
  function analyze(p, w, date = today(), state = null) {
    const phase = phaseOf(p, date);
    const steps = stepsPlan(p, phase.programWeek);
    const week = buildWeek(p, w, phase, steps);
    const m = metrics(p, w, week);
    const mealsChanged = p.meals === '2' && (has(p.health, 'sugar') || p.special === 'pregnant' || p.special === 'breastfeeding' || p.age < 18);
    const mealsN = mealsChanged ? 3 : +p.meals;
    const mains = mealsN === 5 ? 3 : mealsN, share = mealsN === 5 ? 0.8 : 1;
    const ctx = {
      ...m, phase, week, mealsN, mealsChanged, hasRepeat: week.hasRepeat, backToBack: week.backToBack,
      senior: isSenior(p), stepsNow: steps.now, stepsGoal: steps.goal,
      equipCount: availableCount(p), equipUpgrades: equipUpgrades(p),
      equipNames: (p.equipment || []).map(equipName),
      weeklyMin: week.reduce((a, d) => a + (d.kind === 'rest' ? 0 : d.minutes), 0),
      perMealP: r0(m.protein * share / mains),
      chen: Math.max(0.5, Math.round(m.carb * share * 0.6 / mains / 45 * 2) / 2)
    };
    if (state) ctx.log = review(state, p, ctx, date);
    const rules = [];
    for (const r of B.RULES) {
      // Một quy tắc lỗi không được làm hỏng cả kế hoạch
      try {
        if (!r.when(p, ctx)) continue;
        const t = typeof r.text === 'function' ? r.text(p, ctx) : r.text;
        (Array.isArray(t) ? t : [t]).forEach(text => text && rules.push({cat: r.cat, pri: r.pri || 5, text}));
      } catch (e) { /* bỏ qua quy tắc lỗi */ }
    }
    rules.sort((a, b) => a.pri - b.pri);
    return {p, ctx, week, phase, rules};
  }

  /* ---------------- Tự hiệu chỉnh theo dữ liệu thực tế ----------------
     Nếu 21 ngày gần nhất có ≥ 10 ngày ghi đủ ăn uống và cân nặng có xu hướng rõ,
     TDEE thực = calo ăn trung bình − (thay đổi cân/ngày × 7700). */
  function adaptive(state, p, formulaTdee) {
    const end = today(), start = addDays(end, -21);
    const intake = [];
    for (let d = start; d <= end; d = addDays(d, 1)) { const k = dayKcal(state, d); if (k >= 800) intake.push(k); }
    const ws = Object.entries(state.weights).filter(([d]) => d >= start && d <= end).sort((a, b) => a[0] < b[0] ? -1 : 1);
    if (intake.length < 10 || ws.length < 4 || dayDiff(ws[0][0], ws[ws.length - 1][0]) < 10) return null;
    const sl = slope(ws.map(([d, w]) => ({x: dayDiff(ws[0][0], d), y: w})));
    const a = avg(intake), real = a - sl * 7700;
    return {avg: r0(a), real: r0(real), perWeek: sl * 7, days: intake.length, offset: r0(real - formulaTdee)};
  }

  return {healthyRange, phaseOf, analyze, adaptive, alternatives, review, fits, exerciseById, tagsOf, availableCount, equipUpgrades,
    norm, classify, foods, searchFood, foodAdvice, repRange, suggest, isPR, setScore, fmtKg};
})();
