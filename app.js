/* =====================================================================
   GIAO DIỆN: khảo sát, nhật ký hằng ngày, kế hoạch, chế độ tập, theo dõi.
   Mọi phân tích nằm ở engine.js; dữ liệu nằm ở brain/.
   ===================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const num = (v, d = 0) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : d; };
const fmt = n => r0(n).toLocaleString('vi-VN');
const fmt1 = n => r1(n).toLocaleString('vi-VN');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtDate = (s, opt = {weekday: 'short', day: '2-digit', month: '2-digit'}) => parseDs(s).toLocaleDateString('vi-VN', opt);
const fullDate = s => fmtDate(s, {day: '2-digit', month: '2-digit', year: 'numeric'});
const mmss = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const DAYS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MEALS = {sang: 'Bữa sáng', trua: 'Bữa trưa', toi: 'Bữa tối', phu: 'Ăn vặt / phụ'};
const KEY = 'so-can-nang.v1';
const EXTRA_CREDIT = 0.5; // tỉ lệ calo vận động ngoài lịch được cộng lại

/* ---------------- Các bước khảo sát ---------------- */
const STEPS = [
  {title: 'Về bạn', sub: 'Thông tin cơ bản để tính nhu cầu năng lượng của cơ thể.', fields: [
    {id: 'sex', type: 'one', label: 'Giới tính', opts: [['m', 'Nam'], ['f', 'Nữ']]},
    {id: 'age', type: 'num', label: 'Tuổi', min: 12, max: 90, unit: 'tuổi'},
    {id: 'height', type: 'num', label: 'Chiều cao', min: 120, max: 220, unit: 'cm'},
    {id: 'weight', type: 'num', label: 'Cân nặng hiện tại', min: 30, max: 250, step: 0.1, unit: 'kg'},
    {id: 'waist', type: 'num', label: 'Vòng eo', min: 40, max: 200, unit: 'cm', optional: true, hint: 'Đo ngang rốn, thở ra tự nhiên. Giúp đánh giá mỡ bụng chính xác hơn.'},
    {id: 'special', type: 'one', label: 'Tình trạng đặc biệt', show: w => w.sex === 'f', opts: [['none', 'Không'], ['pregnant', 'Đang mang thai'], ['breastfeeding', 'Đang cho con bú']]}
  ]},
  {title: 'Sinh hoạt', sub: 'Mức vận động hằng ngày ảnh hưởng lớn tới lượng calo bạn đốt.', fields: [
    {id: 'job', type: 'one', label: 'Công việc hằng ngày', desc: true, opts: [
      ['desk', '🪑 Ngồi nhiều', 'Văn phòng, lái xe, học sinh, sinh viên'], ['light', '🚶 Đi lại khá nhiều', 'Giáo viên, bán hàng, nội trợ'],
      ['active', '🏃 Vận động nhiều', 'Phục vụ, giao hàng, đứng cả ngày'], ['heavy', '🏗️ Lao động nặng', 'Xây dựng, bốc vác, nông nghiệp']]},
    {id: 'sleep', type: 'one', label: 'Trung bình ngủ mỗi đêm', opts: [['short', 'Dưới 6 tiếng'], ['mid', '6–7 tiếng'], ['good', '7–9 tiếng']]},
    {id: 'stress', type: 'one', label: 'Mức căng thẳng', opts: [['low', 'Thấp'], ['mid', 'Vừa'], ['high', 'Cao']]},
    {id: 'time', type: 'one', label: 'Thời điểm có thể tập', opts: [['am', '🌅 Sáng sớm'], ['noon', '☀️ Buổi trưa'], ['pm', '🌆 Chiều tối'], ['any', '🔄 Linh hoạt']]}
  ]},
  {title: 'Sức khỏe', sub: 'Giúp loại bỏ bài tập không phù hợp. Bỏ trống nếu bạn không có vấn đề nào.', fields: [
    {id: 'health', type: 'many', label: 'Vấn đề sức khỏe cần lưu ý', opts: [['knee', 'Đau gối'], ['back', 'Đau lưng'], ['shoulder', 'Đau vai'], ['bp', 'Huyết áp cao'], ['sugar', 'Tiểu đường / tiền tiểu đường'], ['heart', 'Bệnh tim mạch']]}
  ]},
  {title: 'Tập luyện', sub: 'Lịch tập sẽ vừa với thời gian và điều kiện của bạn.', fields: [
    {id: 'exp', type: 'one', label: 'Kinh nghiệm tập tạ / bài kháng lực', desc: true, opts: [
      ['new', '🌱 Mới bắt đầu', 'Chưa tập hoặc nghỉ hơn 6 tháng'], ['some', '💪 Đã có nền tảng', 'Tập đều dưới 1 năm'], ['pro', '🔥 Có kinh nghiệm', 'Tập đều trên 1 năm, biết kỹ thuật']]},
    {id: 'days', type: 'one', label: 'Mỗi tuần tập được mấy buổi?', opts: [['2', '2 buổi'], ['3', '3 buổi'], ['4', '4 buổi'], ['5', '5 buổi'], ['6', '6 buổi']]},
    {id: 'trainDays', type: 'many', label: 'Những ngày bạn có thể tập', optional: true, hint: 'Bỏ trống để app tự xếp lịch cách đều trong tuần.', opts: DAYS.map((d, i) => [String(i), d])},
    {id: 'len', type: 'one', label: 'Mỗi buổi tập bao lâu?', opts: [['30', '20–30 phút'], ['45', '45 phút'], ['60', '60 phút'], ['90', '75–90 phút']]},
    {id: 'equipment', type: 'many', label: 'Bạn có những dụng cụ nào?', optional: true, desc: true, presets: true,
      hint: 'Chọn tất cả những gì bạn dùng được. Bỏ trống nếu không có gì: ghế, bàn, bậc thang, khăn, balo luôn được tính sẵn.',
      opts: BRAIN.EQUIPMENT.map(q => [q.id, `${q.icon} ${q.name}`, q.desc])},
    {id: 'sports', type: 'many', label: 'Môn vận động bạn thích (dùng cho buổi cardio)', opts: [['walk', '🚶 Đi bộ'], ['run', '🏃 Chạy bộ'], ['bike', '🚴 Đạp xe'], ['swim', '🏊 Bơi'], ['racket', '🏸 Cầu lông / pickleball'], ['football', '⚽ Đá bóng'], ['dance', '💃 Nhảy / Zumba'], ['jumprope', '🪢 Nhảy dây'], ['hike', '🥾 Leo núi'], ['yoga', '🧘 Yoga']]}
  ]},
  {title: 'Ăn uống', sub: 'Thực đơn sẽ chỉ gợi ý những món bạn ăn được và trong tầm giá.', fields: [
    {id: 'meals', type: 'one', label: 'Bạn thích ăn mấy bữa một ngày?', opts: [['2', '2 bữa (nhịn ăn gián đoạn)'], ['3', '3 bữa chính'], ['5', '3 bữa chính + 2 bữa phụ']]},
    {id: 'diet', type: 'one', label: 'Chế độ ăn', opts: [['omni', 'Ăn mọi thứ'], ['lowcarb', 'Muốn ăn ít tinh bột'], ['veg', 'Ăn chay (có trứng, sữa)'], ['vegan', 'Thuần chay']]},
    {id: 'avoid', type: 'many', label: 'Không ăn được / dị ứng', opts: [['seafood', 'Hải sản, cá'], ['dairy', 'Sữa (lactose)'], ['egg', 'Trứng'], ['nuts', 'Các loại hạt, đậu phộng'], ['gluten', 'Gluten (bột mì)'], ['beef', 'Thịt bò'], ['pork', 'Thịt heo']]},
    {id: 'cook', type: 'one', label: 'Bạn có tự nấu không?', opts: [['self', '🍳 Tự nấu hầu hết'], ['some', 'Thỉnh thoảng nấu'], ['out', '🥡 Gần như ăn ngoài']]},
    {id: 'budget', type: 'one', label: 'Ngân sách ăn uống mỗi ngày', opts: [['low', 'Dưới 100k'], ['mid', '100k–200k'], ['high', 'Thoải mái']]}
  ]},
  {title: 'Thói quen', sub: 'Thành thật nhé 😄 Đây là chỗ dễ cải thiện nhất.', fields: [
    {id: 'habits', type: 'many', label: 'Thói quen hiện tại', opts: [['milktea', '🧋 Hay uống trà sữa'], ['soda', '🥤 Uống nước ngọt'], ['sweets', '🍰 Ăn đồ ngọt'], ['snacking', '🍿 Ăn vặt khi rảnh'], ['latenight', '🌙 Ăn khuya'], ['eatout', '🥡 Ăn ngoài nhiều'], ['beer', '🍺 Nhậu / uống bia'], ['skipbf', '⏭️ Bỏ bữa sáng'], ['fast', '⚡ Ăn rất nhanh'], ['fewveg', '🥬 Ăn ít rau']]},
    {id: 'fav', type: 'text', label: 'Món khoái khẩu không muốn bỏ', optional: true, ph: 'vd: bún bò, trà sữa (cách nhau bằng dấu phẩy)'}
  ]},
  {title: 'Mục tiêu', sub: 'Bước cuối: bạn muốn đạt được điều gì?', goal: true, fields: [
    {id: 'focus', type: 'one', label: 'Ưu tiên của bạn', opts: [['fat', '🔥 Giảm mỡ'], ['muscle', '💪 Tăng cơ, săn chắc'], ['health', '❤️ Khỏe mạnh, giữ dáng']]},
    {id: 'areas', type: 'many', label: 'Vùng muốn cải thiện thêm', optional: true, hint: 'App sẽ thêm bài bổ trợ cho vùng này vào các buổi tập.', opts: [['abs', 'Bụng, eo'], ['glute', 'Mông, đùi'], ['arms', 'Tay'], ['chest', 'Ngực, vai'], ['posture', 'Lưng, tư thế']]},
    {id: 'goalWeight', type: 'num', label: 'Cân nặng mong muốn', min: 30, max: 250, step: 0.1, unit: 'kg',
      hint: w => { if (!w.height) return ''; const r = ENGINE.healthyRange(num(w.height)); return `Khoảng cân nặng khỏe mạnh cho chiều cao ${esc(w.height)} cm: <b>${fmt1(r.lo)}–${fmt1(r.hi)} kg</b> (chuẩn châu Á).`; }},
    {id: 'pace', type: 'one', label: 'Tốc độ mong muốn', desc: true, opts: [
      ['slow', '🐢 Nhẹ nhàng', 'Dễ duy trì, ít ảnh hưởng sinh hoạt'], ['normal', '🎯 Vừa phải (khuyến nghị)', 'Cân bằng giữa tốc độ và độ bền'], ['fast', '🚀 Nhanh', 'Cần kỷ luật cao, dễ mệt hơn']]}
  ]}
];
const FIELDS = STEPS.flatMap(s => s.fields);
const DEFAULTS = {sex: '', age: '', height: '', weight: '', waist: '', special: 'none', job: '', sleep: '', stress: '', time: '', health: [], exp: '', days: '', trainDays: [], len: '', equipment: [], sports: [],
  meals: '', diet: '', avoid: [], cook: '', budget: '', habits: [], fav: '', focus: '', areas: [], goalWeight: '', pace: 'normal'};
const optLabel = (id, v) => { const f = FIELDS.find(x => x.id === id); const o = f && f.opts && f.opts.find(x => x[0] === v); return o ? o[1] : v; };

/* ---------------- Trạng thái ---------------- */
function blank() { return {profile: null, days: {}, weights: {}, customFoods: []}; }
let state = blank();
try { const raw = localStorage.getItem(KEY); if (raw) state = Object.assign(blank(), JSON.parse(raw)); } catch (e) {}
migrate();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn('Không lưu được dữ liệu', e); }
}
// Chuyển dữ liệu từ phiên bản đầu (hồ sơ + khảo sát tách rời) sang hồ sơ hợp nhất
function migrate() {
  const p = state.profile;
  if (!p) return;
  if (p.v !== 2) {
    const s = state.survey || {};
    const job = {1.2: 'desk', 1.375: 'light', 1.55: 'active', 1.725: 'heavy'}[p.activity] || 'desk';
    const pace = p.rate <= 0.25 ? 'slow' : p.rate <= 0.5 ? 'normal' : 'fast';
    state.profile = Object.assign({}, DEFAULTS, s, {sex: p.sex, age: p.age, height: p.height, weight: p.startWeight, goalWeight: p.goalWeight,
      job, pace, focus: s.goal || '', sleep: s.sleep === 'short' ? 'short' : s.sleep === 'good' ? 'good' : s.sleep ? 'mid' : '',
      startDate: p.startDate || today(), startWeight: p.startWeight, v: 2});
    delete state.survey;
  }
  // Thêm các trường mới với giá trị mặc định
  const pr = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), state.profile);
  // Phiên bản trước hỏi "tập ở đâu" → đổi sang danh sách dụng cụ tương ứng
  if ('place' in pr) {
    const preset = {none: 'none', home: 'home', gym: 'gym', outdoor: 'park'}[pr.place];
    if (!pr.equipment.length) pr.equipment = [...((BRAIN.EQUIP_PRESETS.find(x => x.id === preset) || {items: []}).items)];
    delete pr.place;
  }
  state.profile = pr;
  save();
}
const isComplete = p => p && FIELDS.every(f => f.optional || f.type === 'many' || (f.show && !f.show(p)) || (p[f.id] !== '' && p[f.id] != null));

function dayData(d) { return state.days[d] || {meals: [], ex: [], water: 0}; }
function getDay(d) { if (!state.days[d]) state.days[d] = {meals: [], ex: [], water: 0}; return state.days[d]; }
const sortedWeights = () => Object.entries(state.weights).map(([d, w]) => ({d, w})).sort((a, b) => a.d < b.d ? -1 : 1);
function weightOn(d) {
  const ws = sortedWeights();
  let best = null;
  for (const e of ws) if (e.d <= d) best = e.w;
  if (best == null) best = ws.length ? ws[0].w : num(state.profile?.weight);
  return best;
}
function totals(d) {
  const x = dayData(d), t = {kcal: 0, p: 0, c: 0, f: 0, extra: 0, planned: false};
  x.meals.forEach(m => { t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.f += m.f; });
  x.ex.forEach(e => { if (e.planned) t.planned = true; else t.extra += e.kcal; });
  return t;
}
const doneOn = d => (dayData(d).ex || []).some(e => e.planned);
const getPlan = (d = today(), withLog = false) => ENGINE.analyze(state.profile, weightOn(d), d, withLog ? state : null);
const allFoods = () => [...state.customFoods.map(f => [f.name, f.unit || '1 phần', f.kcal, f.p, f.c, f.f, true]), ...BRAIN.FOODS];

let sel = today();
let planSub = 'overview';
let menuDay = weekIdx(today());
let foodBase = null;

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); }

/* =====================================================================
   KHẢO SÁT
   ===================================================================== */
let wz = null, wzStep = 0, wzEditing = false, wzRestart = false;

function openWizard(edit) {
  wzEditing = !!(edit && state.profile);
  wz = JSON.parse(JSON.stringify(Object.assign({}, DEFAULTS, state.profile || {})));
  if (state.profile) wz.weight = r1(weightOn(today()));
  wzStep = 0; wzRestart = false;
  $('#app').classList.add('hidden');
  $('#wizard').classList.remove('hidden');
  renderWizard();
}
function closeWizard() { $('#wizard').classList.add('hidden'); $('#app').classList.remove('hidden'); }

function renderField(f) {
  if (f.show && !f.show(wz)) return '';
  let input;
  if (f.type === 'num') {
    input = `<div class="unit"><input type="number" inputmode="decimal" name="${f.id}" value="${esc(wz[f.id])}" step="${f.step || 1}" min="${f.min}" max="${f.max}"><span>${f.unit}</span></div>`;
  } else if (f.type === 'text') {
    input = `<input name="${f.id}" value="${esc(wz[f.id])}" placeholder="${esc(f.ph || '')}">`;
  } else {
    const multi = f.type === 'many';
    input = `<div class="chips ${f.desc ? 'col' : ''} ${f.presets ? 'compact' : ''}">${f.opts.map(([v, l, d]) => {
      const on = multi ? (wz[f.id] || []).includes(v) : String(wz[f.id]) === v;
      return `<label class="chip"><input type="${multi ? 'checkbox' : 'radio'}" name="${f.id}" value="${v}" ${on ? 'checked' : ''}><span>${l}${d ? `<small>${d}</small>` : ''}</span></label>`;
    }).join('')}</div>`;
  }
  const hint = typeof f.hint === 'function' ? f.hint(wz) : f.hint;
  const presets = f.presets ? `<div class="presets">${BRAIN.EQUIP_PRESETS.map(x => `<button type="button" class="btn btn-ghost btn-sm" data-act="wzPreset" data-v="${x.id}">${x.name}</button>`).join('')}</div>` : '';
  return `<div class="q"><div class="qt">${f.label}${f.optional ? ' <span class="muted small">(không bắt buộc)</span>' : ''}</div>
    ${hint ? `<div class="small muted" style="margin:-4px 0 8px">${hint}</div>` : ''}${presets}${input}${f.presets ? '<div class="eq-count" id="eqCount"></div>' : ''}</div>`;
}

// Số bài tập dùng được với dụng cụ đang chọn (đã tính cả sức khỏe)
function updateEqCount() {
  const el = $('#eqCount'); if (!el) return;
  const n = ENGINE.availableCount(wzProfile());
  const ups = ENGINE.equipUpgrades(wzProfile()).slice(0, 1);
  el.innerHTML = `💪 Có <b>${n} bài tập</b> phù hợp với dụng cụ và sức khỏe của bạn` +
    (ups.length && ups[0].gain >= 5 ? `<div class="small muted">Thêm ${ups[0].name.toLowerCase()} sẽ mở thêm ${ups[0].gain} bài.</div>` : '');
}

function renderWizard() {
  const st = STEPS[wzStep], last = wzStep === STEPS.length - 1;
  $('#wzStepLbl').textContent = `Bước ${wzStep + 1}/${STEPS.length}`;
  $('#wzSegs').innerHTML = STEPS.map((_, i) => `<i class="${i <= wzStep ? 'on' : ''}"></i>`).join('');
  $('#wzNum').textContent = String(wzStep + 1).padStart(2, '0');
  $('#wzTitle').textContent = st.title;
  $('#wzSub').textContent = st.sub;
  $('#wzBody').innerHTML = st.fields.map(renderField).join('') + (st.goal
    ? `<div id="goalPreview"></div>${wzEditing ? `<label class="check"><input type="checkbox" id="wzRestart" ${wzRestart ? 'checked' : ''}> Bắt đầu lại chu kỳ 12 tuần từ hôm nay</label>` : ''}`
    : '');
  $('#wzErr').textContent = '';
  $('#wzBackBtn').classList.toggle('hidden', wzStep === 0);
  $('#wzCancelBtn').classList.toggle('hidden', !wzEditing);
  $('#wzNextBtn').textContent = last ? '⚡ Phân tích' : 'Tiếp ›';
  if (st.goal) renderGoalPreview();
  updateEqCount();
}

function wzProfile() {
  const p = Object.assign({}, wz);
  ['age', 'height', 'weight', 'goalWeight'].forEach(k => p[k] = num(p[k]));
  p.waist = p.waist === '' ? '' : num(p.waist);
  if (p.sex !== 'f') p.special = 'none';
  p.startDate = state.profile?.startDate || today();
  return p;
}

function renderGoalPreview() {
  const box = $('#goalPreview'); if (!box) return;
  const p = wzProfile();
  if (!p.goalWeight || !p.focus) { box.innerHTML = ''; return; }
  const h = p.height / 100, gb = p.goalWeight / (h * h);
  if (gb < 18.5) {
    box.innerHTML = `<div class="preview"><span class="over">⚠️ ${fmt1(p.goalWeight)} kg ứng với BMI ${fmt1(gb)}, dưới ngưỡng khỏe mạnh (18,5). Hãy chọn từ ${fmt1(ENGINE.healthyRange(p.height).lo)} kg trở lên.</span></div>`;
    return;
  }
  const a = ENGINE.analyze(p, p.weight), c = a.ctx;
  const safety = a.rules.filter(r => r.cat === 'safety');
  box.innerHTML = `<div class="preview">
    <div class="eyebrow">Xem trước kế hoạch</div>
    <div class="big">${c.dir === 0 ? 'Giữ cân, tăng sức khỏe' : `${c.dir < 0 ? '−' : '+'}${fmt1(Math.abs(c.diff))} kg${c.eta ? ` · đạt ${fullDate(c.eta)}` : ''}`}</div>
    <div class="small" style="margin-top:4px">${c.rate ? `Khoảng ${fmt1(c.rate)} kg/tuần · ` : ''}ăn ~<b>${fmt(c.target)} kcal/ngày</b> · ${c.protein}g đạm</div>
    ${safety.map(r => `<div class="warnbox">${r.text}</div>`).join('')}
  </div>`;
}

function validateStep(i) {
  for (const f of STEPS[i].fields) {
    if (f.show && !f.show(wz)) continue;
    const v = wz[f.id];
    if (f.type === 'many' || (f.optional && (v === '' || v == null))) continue;
    if (f.type === 'num') {
      const n = num(v, NaN);
      if (!isFinite(n) || n < f.min || n > f.max) return `Vui lòng nhập "${f.label.toLowerCase()}" hợp lệ (${f.min}–${f.max} ${f.unit}).`;
    } else if (f.type === 'one' && !v) return `Vui lòng chọn: ${f.label.toLowerCase()}.`;
  }
  if (STEPS[i].fields.some(f => f.id === 'trainDays') && wz.trainDays.length && wz.trainDays.length < +wz.days)
    return `Bạn chọn tập ${wz.days} buổi/tuần: hãy chọn ít nhất ${wz.days} ngày rảnh, hoặc bỏ trống để app tự xếp.`;
  if (STEPS[i].goal) {
    const p = wzProfile(), h = p.height / 100;
    if (p.goalWeight / (h * h) < 18.5) return 'Cân nặng mục tiêu thấp hơn mức khỏe mạnh. Hãy chọn lại.';
  }
  return '';
}

function finishWizard() {
  const prev = state.profile;
  const p = wzProfile();
  const restart = !prev || !wzEditing || wzRestart;
  p.startDate = restart ? today() : prev.startDate;
  p.startWeight = restart ? p.weight : prev.startWeight;
  p.tdeeAdjust = restart ? 0 : (prev.tdeeAdjust || 0);
  p.v = 2;
  const latest = sortedWeights().length ? weightOn(today()) : null;
  if (latest == null || Math.abs(latest - p.weight) >= 0.05) state.weights[today()] = r1(p.weight);
  state.profile = p;
  save();
  runAnalysis(() => {
    closeWizard();
    renderFoodList();
    planSub = 'overview';
    renderAll();
    showTab('plan');
  });
}

// Màn "HLV đang phân tích": mô tả đúng các bước bộ máy thực hiện
function runAnalysis(done) {
  const steps = ['Tính nhu cầu năng lượng', `Chọn bài từ ${BRAIN.EXERCISES.length} bài tập`, 'Xếp lịch chu kỳ 12 tuần',
    `Lập thực đơn từ ${BRAIN.DISHES.length} món Việt`, `Áp dụng ${BRAIN.RULES.length} quy tắc của HLV`];
  const fast = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#wizard').classList.add('hidden');
  $('#analyzing').classList.remove('hidden');
  const box = $('#aSteps');
  box.innerHTML = steps.map(s => `<div class="astep"><span class="ic"></span>${s}</div>`).join('');
  const els = [...box.children];
  let i = 0;
  const tick = () => {
    if (i > 0) { els[i - 1].classList.remove('run'); els[i - 1].classList.add('ok'); els[i - 1].querySelector('.ic').textContent = '✓'; }
    if (i < els.length) { els[i].classList.add('run'); i++; setTimeout(tick, fast ? 40 : 330); }
    else setTimeout(() => { $('#analyzing').classList.add('hidden'); done(); }, fast ? 40 : 380);
  };
  tick();
}

$('#wzBody').addEventListener('input', ev => {
  const el = ev.target;
  if (el.id === 'wzRestart') { wzRestart = el.checked; return; }
  const f = FIELDS.find(x => x.id === el.name); if (!f) return;
  if (f.type === 'many') wz[f.id] = [...$('#wzBody').querySelectorAll(`[name="${f.id}"]:checked`)].map(i => i.value);
  else wz[f.id] = el.value;
  $('#wzErr').textContent = '';
  if (f.id === 'sex') renderWizard();
  else if (STEPS[wzStep].goal) renderGoalPreview();
  if (f.id === 'equipment') updateEqCount();
});

/* =====================================================================
   HÔM NAY
   ===================================================================== */
function ring(eaten, budget) {
  const R = 62, C = 2 * Math.PI * R, pct = budget > 0 ? Math.min(eaten / budget, 1) : 0, over = eaten > budget;
  return `<svg width="148" height="148" viewBox="0 0 148 148" aria-hidden="true">
    <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0561a"/><stop offset="1" stop-color="#d7265f"/></linearGradient></defs>
    <circle cx="74" cy="74" r="${R}" fill="none" stroke="var(--surface-2)" stroke-width="14"/>
    <circle class="prog" cx="74" cy="74" r="${R}" fill="none" stroke="${over ? 'var(--bad)' : 'url(#rg)'}" stroke-width="14" stroke-linecap="round"
      stroke-dasharray="${C * pct} ${C}" transform="rotate(-90 74 74)"/></svg>
    <div class="lbl"><span class="big num ${over ? 'over' : ''}">${fmt(Math.abs(budget - eaten))}</span><span class="small muted" style="font-weight:700">${over ? 'kcal vượt' : 'kcal còn lại'}</span></div>`;
}
const macroBar = (name, val, goal, color) => `<div><div class="top"><span>${name}</span><span class="muted num">${r0(val)} / ${goal} g</span></div>
  <div class="bar"><i style="width:${goal > 0 ? Math.min(val / goal * 100, 100) : 0}%;background:${color}"></i></div></div>`;

function renderWeekStrip(P, wi) {
  const monday = addDays(sel, -wi), td = today();
  $('#weekStrip').innerHTML = P.week.map((s, i) => {
    const d = addDays(monday, i), done = doneOn(d), restOnly = s.kind === 'rest' && !s.minutes;
    const icon = done ? '✓' : s.kind === 'strength' ? '🏋️' : restOnly ? '•' : s.emoji;
    return `<button class="wday ${restOnly ? 'rest' : ''} ${done ? 'done' : ''} ${d === td ? 'today' : ''} ${d === sel ? 'sel' : ''}"
      data-act="pickDay" data-d="${d}" aria-label="${DAYS[i]}: ${esc(s.title)}${done ? ', đã tập' : ''}"><span>${DAYS_SHORT[i]}</span><span class="dot">${icon}</span></button>`;
  }).join('');
}

function heroHtml(s, done, P) {
  const cls = s.kind === 'strength' ? '' : s.kind === 'cardio' ? 'cardio' : 'rest';
  const restOnly = s.kind === 'rest' && !s.minutes;
  const when = sel === today() ? 'hôm nay' : DAYS[weekIdx(sel)].toLowerCase();
  const eyebrow = restOnly ? `Ngày hồi phục · Tuần ${P.phase.programWeek}` : `Buổi tập ${when} · Tuần ${P.phase.programWeek} · ${P.phase.name}`;
  const chips = [];
  if (s.minutes) chips.push(`⏱ ${s.minutes} phút`);
  if (s.kcal) chips.push(`🔥 ~${fmt(s.kcal)} kcal`);
  if (s.kind === 'strength') chips.push(`💪 ${s.exercises.length} bài`);
  if (s.kind === 'cardio') chips.push(`❤️ ${s.zone.lo}–${s.zone.hi} bpm`);
  if (restOnly) chips.push(`👟 ${fmt(P.ctx.stepsNow)} bước`);
  const lines = s.kind === 'strength'
    ? s.exercises.slice(0, 3).map(e => `${e.name} · ${e.sets} × ${e.reps}`).concat(s.exercises.length > 3 ? [`và ${s.exercises.length - 3} bài nữa`] : [])
    : s.items;
  const btns = restOnly ? '<button class="btn btn-glass" data-act="openPlan" data-sub="train">Xem lịch cả tuần ›</button>'
    : done ? '<span class="done-badge">✓ Đã hoàn thành</span>'
    : '<button class="btn btn-white btn-lg" data-act="startWorkout">▶ Bắt đầu tập</button><button class="btn btn-glass" data-act="doneSession">✓ Đã tập</button>';
  return `<div class="hero ${cls}"><span class="wm" aria-hidden="true">${s.emoji}</span>
    <div class="eyebrow">${esc(eyebrow)}</div><div class="display title">${esc(s.title)}</div>
    <div class="chips-stat">${chips.map(x => `<span class="chip-stat">${x}</span>`).join('')}</div>
    <ul>${lines.map(x => `<li>${esc(x)}</li>`).join('')}</ul><div class="row">${btns}</div></div>`;
}

function coachHtml(P, max) {
  const items = P.rules.filter(r => r.cat === 'coach').slice(0, max);
  const quote = BRAIN.QUOTES[Math.abs(dayDiff('2026-01-01', sel)) % BRAIN.QUOTES.length];
  return `<div class="card coach">
    <div class="coach-head"><div class="avatar">HLV</div><div><div class="eyebrow">Huấn luyện viên của bạn</div>
      <b>Tuần ${P.phase.programWeek} · ${esc(P.phase.name)} · RIR ${P.phase.rir}</b></div></div>
    ${P.phase.weekNote ? `<div class="bubble goal">🎯 <b>Mục tiêu tuần:</b> ${esc(P.phase.weekNote)}</div>` : ''}
    ${items.length ? items.map(r => `<div class="bubble">${r.text}</div>`).join('') : `<div class="bubble">💬 ${esc(quote)}</div>`}
  </div>`;
}

const fuelHtml = wk => `<div class="fuel"><div><span class="eyebrow">⚡ Trước tập</span><b>${esc(wk.pre)}</b>${esc(wk.preWhen)}</div>
  <div><span class="eyebrow">💪 Sau tập</span><b>${esc(wk.post)}</b>${esc(wk.postWhen)}</div></div>`;
const tipOf = m => { const t = m.items.find(x => x.tip); return t ? `<div class="small muted">💡 ${esc(t.tip)}</div>` : ''; };

function renderToday() {
  const P = getPlan(sel, true), c = P.ctx, wi = weekIdx(sel), day = dayData(sel), t = totals(sel);
  $('#selDate').textContent = sel === today() ? 'Hôm nay' : DAYS[wi];
  $('#selSub').textContent = fmtDate(sel, {weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'});
  renderWeekStrip(P, wi);
  const s = P.week[wi];
  $('#hero').innerHTML = heroHtml(s, t.planned, P);
  $('#coachCard').innerHTML = coachHtml(P, 3);

  const dayTarget = c.dayTargets[wi], credit = r0(t.extra * EXTRA_CREDIT), budget = dayTarget + credit;
  $('#dayTag').innerHTML = s.kind === 'rest' && !s.minutes ? '<span class="pill lime">Ngày nghỉ</span>' : '<span class="pill">Ngày tập</span>';
  $('#ring').innerHTML = ring(t.kcal, budget);
  $('#todayStats').innerHTML = `
    <div class="tile"><span class="small muted">Mục tiêu</span><b>${fmt(dayTarget)}</b></div>
    <div class="tile"><span class="small muted">Đã ăn</span><b>${fmt(t.kcal)}</b></div>
    <div class="tile"><span class="small muted">Vận động thêm</span><b>+${fmt(credit)}</b></div>
    <div class="tile"><span class="small muted">Khẩu phần</span><b>${fmt(budget)}</b></div>`;
  $('#macros').innerHTML = macroBar('Đạm', t.p, c.protein, 'var(--p)') + macroBar('Tinh bột', t.c, c.carb, 'var(--c)') + macroBar('Chất béo', t.f, c.fat, 'var(--f)');

  const wNow = weightOn(sel), wPrev = sortedWeights().filter(e => e.d <= addDays(sel, -7)).pop();
  $('#wNow').textContent = `${fmt1(wNow)} kg`;
  $('#wDelta').innerHTML = wPrev ? (d => `<span class="${d < 0 ? 'good' : d > 0 ? 'over' : ''}">${d > 0 ? '+' : ''}${fmt1(d)} kg</span> so với 7 ngày trước`)(r1(wNow - wPrev.w)) : '';
  $('#wInput').value = state.weights[sel] ?? '';
  const wg = Math.ceil((c.water + (s.kind === 'rest' && !s.minutes ? 0 : 0.5)) / 0.25);
  $('#water').innerHTML = Array.from({length: Math.max(wg, day.water)}, (_, i) =>
    `<span class="g ${i < day.water ? 'full' : ''}" data-act="water" data-i="${i}" title="${i + 1} ly" role="button" aria-label="${i + 1} ly nước"></span>`).join('') +
    `<span class="small muted num" style="margin-left:6px;font-weight:700">${day.water}/${wg} ly</span>`;
  $('#stepsLine').innerHTML = `👟 Mục tiêu <b>${fmt(c.stepsNow)} bước</b> hôm nay`;

  const menu = P.menu(wi);
  $('#todayMenu').innerHTML = `<div class="card-title"><h2>🍽 Thực đơn gợi ý</h2><button class="btn btn-ghost btn-sm" data-act="openPlan" data-sub="menu">Cả tuần ›</button></div>
    <div class="small muted" style="margin-bottom:8px">Bấm "+ Ghi" nếu bạn ăn đúng món gợi ý, app tự thêm vào nhật ký.</div>
    ${menu.workout ? fuelHtml(menu.workout) : ''}
    ${menu.meals.map((m, i) => `<div class="meal"><div class="h"><span>${m.label} <span class="muted small num">· ${fmt(m.kcal)} kcal</span></span>
      <button class="btn btn-ghost btn-sm" data-act="logMenu" data-i="${i}">+ Ghi</button></div>
      <div class="small" style="margin-top:4px;font-weight:600">${m.items.map(x => esc(x.n)).join(' + ') || '—'}</div>${tipOf(m)}${m.note ? `<div class="small muted">${m.note}</div>` : ''}</div>`).join('')}
    ${menu.tip ? `<div class="small muted">💡 ${menu.tip}</div>` : ''}`;

  const groups = Object.entries(MEALS).map(([k, label]) => {
    const items = day.meals.filter(m => m.meal === k);
    if (!items.length) return '';
    return `<h3>${label} · ${fmt(items.reduce((a, m) => a + m.kcal, 0))} kcal</h3><ul class="list">${items.map(m => `
      <li><div class="name">${esc(m.name)}${m.qty !== 1 ? ` <span class="muted">×${m.qty}</span>` : ''}
        <div class="small muted">Đạm ${fmt1(m.p)}g · Tinh bột ${fmt1(m.c)}g · Béo ${fmt1(m.f)}g</div></div>
        <span class="kc">${fmt(m.kcal)}</span><button class="icon-x" data-act="delMeal" data-id="${m.id}" aria-label="Xóa">✕</button></li>`).join('')}</ul>`;
  }).join('');
  $('#mealList').innerHTML = groups || '<div class="muted small">Chưa ghi món nào.</div>';
  $('#exList').innerHTML = day.ex.length ? day.ex.map(e => `
    <li><div class="name">${esc(e.name)} <span class="muted">· ${e.min} phút</span>${e.planned ? ' <span class="pill">trong lịch</span>' : ''}</div>
    <span class="kc">−${fmt(e.kcal)}</span><button class="icon-x" data-act="delEx" data-id="${e.id}" aria-label="Xóa">✕</button></li>`).join('')
    : '<li class="muted small">Chưa có.</li>';
  calcEx();
}

/* =====================================================================
   KẾ HOẠCH
   ===================================================================== */
const ruleList = (rules, cat) => { const r = rules.filter(x => x.cat === cat); return r.length ? `<ul class="rules">${r.map(x => `<li>${x.text}</li>`).join('')}</ul>` : ''; };

function exRow(e, i) {
  const alt = e.easier || e.harder ? `<div class="alt">${e.easier ? `↓ Dễ hơn: <b>${esc(e.easier.name)}</b>` : ''}${e.easier && e.harder ? ' · ' : ''}${e.harder ? `↑ Khó hơn: <b>${esc(e.harder.name)}</b>` : ''}</div>` : '';
  return `<li class="exrow"><span class="exnum">${i + 1}</span><div>
    <div class="exname">${esc(e.name)}</div>
    <div class="exmeta"><span class="tag">${esc(e.sets)} × ${esc(e.reps)}</span><span class="tag">nghỉ ${esc(e.rest)}</span>${e.equip ? `<span class="tag eq">🧰 ${esc(e.equip)}</span>` : ''}<span class="muscle">${esc(e.muscles)}</span></div>
    <span class="cue">${esc(e.cue)}</span>${alt}</div></li>`;
}

function dayCard(w, now) {
  const k = w.kind === 'rest' ? 'k-rest' : w.kind === 'cardio' ? 'k-cardio' : '';
  const det = (title, arr) => arr && arr.length ? `<details><summary>${title} (${arr.length})</summary><ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : '';
  let body = '';
  if (w.kind === 'strength') {
    body = det('🔥 Khởi động', w.warmup) + `<ol class="exlist">${w.exercises.map(exRow).join('')}</ol>`
      + (w.notes.length ? `<div class="small muted" style="margin-top:10px">${w.notes.map(esc).join('<br>')}</div>` : '') + det('🧊 Thả lỏng', w.cooldown);
  } else {
    body = (w.warmup ? det('🔥 Khởi động', w.warmup) : '') + `<ul class="rules small" style="margin-top:8px">${w.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` + (w.cooldown ? det('🧊 Thả lỏng', w.cooldown) : '');
  }
  return `<div class="card dcard ${k} ${w.day === now ? 'now' : ''}">
    <div class="dhead"><div><div class="eyebrow">${DAYS[w.day]}${w.day === now ? ' · <span class="pill">hôm nay</span>' : ''}</div>
      <div class="display dtitle">${w.emoji} ${esc(w.title)}</div></div>
      ${w.minutes ? `<div class="small muted num" style="text-align:right;font-weight:700">${w.minutes} phút<br>~${fmt(w.kcal)} kcal</div>` : ''}</div>
    ${body}
    ${w.minutes ? `<div class="row" style="margin-top:12px"><button class="btn btn-primary btn-sm" data-act="startWorkout" data-day="${w.day}">▶ Tập buổi này</button></div>` : ''}
  </div>`;
}

function renderPlan() {
  $$('.seg button').forEach(b => b.classList.toggle('on', b.dataset.sub === planSub));
  const P = getPlan(today(), true), c = P.ctx, p = state.profile;
  let html = '';

  if (planSub === 'overview') {
    const ph = P.phase;
    const cells = Array.from({length: 12}, (_, i) => { const x = BRAIN.PHASES.find(q => i + 1 >= q.from && i + 1 <= q.to); return `<i class="${x.key} ${i + 1 === ph.cycleWeek ? 'now' : ''}" title="Tuần ${i + 1}: ${x.name}"></i>`; }).join('');
    html += `<div class="card"><div class="eyebrow">Chu kỳ ${ph.cycle} · tuần ${ph.cycleWeek}/12 · bắt đầu ${fullDate(p.startDate)}</div>
      <div class="display" style="font-size:28px;margin-top:4px">${esc(ph.name)}</div>
      <div class="timeline">${cells}</div>
      <div class="legend">${BRAIN.PHASES.map(x => `<span><i class="${x.key}"></i>${x.name}</span>`).join('')}</div>
      <p style="margin:12px 0 0">${esc(ph.desc)}</p>
      ${ph.weekNote ? `<div class="bubble goal" style="margin-top:10px">🎯 <b>Tuần này:</b> ${esc(ph.weekNote)}</div>` : ''}</div>`;
    const trainT = P.week.filter(d => d.kind !== 'rest').map(d => c.dayTargets[d.day]);
    const restT = P.week.filter(d => d.kind === 'rest').map(d => c.dayTargets[d.day]);
    const avgArr = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
    html += `<div class="card"><h2>🎯 Con số của bạn</h2><div class="tiles3">
      <div class="tile"><span class="small muted">Calo trung bình</span><b>${fmt(c.target)}</b></div>
      <div class="tile"><span class="small muted">Ngày tập / nghỉ</span><b>${fmt(avgArr(trainT))} / ${fmt(avgArr(restT))}</b></div>
      <div class="tile"><span class="small muted">Đạm / TB / Béo</span><b>${c.protein}/${c.carb}/${c.fat}g</b></div>
      <div class="tile"><span class="small muted">Nước</span><b>${fmt1(c.water)} lít</b></div>
      <div class="tile"><span class="small muted">Bước chân</span><b>${fmt(c.stepsNow)}</b></div>
      <div class="tile"><span class="small muted">${c.dir === 0 ? 'Mục tiêu' : 'Dự kiến đạt'}</span><b>${c.dir === 0 ? 'Giữ cân' : c.eta ? fullDate(c.eta) : '—'}</b></div></div></div>`;
    const ad = ENGINE.adaptive(state, p, c.tdee - (p.tdeeAdjust || 0));
    if (ad) {
      const big = Math.abs(ad.offset) >= 100;
      html += `<div class="card"><h2>📊 Hiệu chỉnh theo dữ liệu thực tế</h2>
        <div>Trong ${ad.days} ngày có ghi chép: bạn ăn trung bình <b>${fmt(ad.avg)} kcal</b> và cân thay đổi <b>${ad.perWeek > 0 ? '+' : ''}${fmt1(ad.perWeek)} kg/tuần</b>.
        Mức tiêu hao thực tế khoảng <b>${fmt(ad.real)} kcal</b>, ${big ? `chênh <b>${ad.offset > 0 ? '+' : ''}${fmt(ad.offset)} kcal</b> so với công thức.` : 'khớp với công thức 👍'}</div>
        ${big || p.tdeeAdjust ? `<div class="row" style="margin-top:10px">${big ? `<button class="btn btn-primary" data-act="applyAdaptive" data-v="${ad.offset}">Áp dụng hiệu chỉnh</button>` : ''}
        ${p.tdeeAdjust ? '<button class="btn btn-ghost" data-act="applyAdaptive" data-v="0">Bỏ hiệu chỉnh</button>' : ''}</div>` : ''}</div>`;
    }
    html += coachHtml(P, 12);
    const safety = P.rules.filter(r => r.cat === 'safety');
    html += `<div class="card"><h2>🔍 Phân tích</h2>${safety.map(r => `<div class="warnbox">⚠️ ${r.text}</div>`).join('')}
      <div style="margin-top:${safety.length ? 10 : 0}px">${ruleList(P.rules, 'insight')}</div></div>`;
  }

  if (planSub === 'train') {
    const now = weekIdx(today());
    html += `<div class="card"><div class="eyebrow">Tuần ${P.phase.programWeek} · ${esc(P.phase.name)}</div>
      <div class="display" style="font-size:26px;margin:4px 0 10px">Lịch tập tuần này</div>
      <div class="row"><span class="tag">${p.days} buổi/tuần</span><span class="tag">${fmt(c.weeklyMin)} phút/tuần</span><span class="tag">RIR ${P.phase.rir}</span>
      <span class="tag eq">🧰 ${esc(c.equipNames.length ? c.equipNames.join(', ') : 'Tập tay không')}</span></div>
      <div class="small muted" style="margin-top:8px">${c.equipCount} bài tập phù hợp với dụng cụ và sức khỏe của bạn. Mua thêm dụng cụ? Cập nhật ở Cài đặt → Làm lại khảo sát.</div></div>`;
    html += P.week.map(w => dayCard(w, now)).join('');
    html += `<div class="card"><h2>📌 Quy tắc tập luyện</h2>${ruleList(P.rules, 'train')}</div>`;
  }

  if (planSub === 'menu') {
    const menu = P.menu(menuDay);
    html += `<div class="card"><h2>🍽 Thực đơn gợi ý</h2>
      <div class="chips" style="margin-bottom:12px">${DAYS.map((d, i) => `<label class="chip"><input type="radio" name="menuDay" data-act="menuDay" data-i="${i}" ${i === menuDay ? 'checked' : ''}><span>${d}</span></label>`).join('')}</div>
      <div class="row between" style="margin-bottom:6px"><b>${DAYS[menuDay]} · mục tiêu ${fmt(menu.target)} kcal</b>${menu.training ? '<span class="pill">Ngày tập</span>' : '<span class="pill lime">Ngày nghỉ</span>'}</div>
      ${menu.workout ? fuelHtml(menu.workout) : ''}
      ${menu.meals.map(m => `<div class="meal"><div class="h"><span>${m.label}</span><span class="small muted num">${fmt(m.kcal)} / ${fmt(m.target)} kcal · ${fmt1(m.p)}g đạm</span></div>
        <ul>${m.items.map(x => `<li>${esc(x.n)} <span class="muted small">· ${x.kcal} kcal</span>${x.tip ? `<div class="small muted">💡 ${esc(x.tip)}</div>` : ''}</li>`).join('')}</ul>${m.note ? `<div class="small muted">${m.note}</div>` : ''}</div>`).join('')}
      <div class="row between" style="margin-top:6px"><b class="num">Tổng: ${fmt(menu.kcal)} kcal · ${menu.p}g đạm</b><span class="small muted">Mục tiêu đạm: ${c.protein}g</span></div>
      ${menu.tip ? `<div class="warnbox">💡 ${menu.tip}</div>` : ''}
      <div class="small muted" style="margin-top:8px">Calo là ước tính. Có thể đổi sang món tương đương (cùng nhóm, calo gần nhau).</div></div>`;
    html += `<div class="card"><h2>🥩 Nguồn thực phẩm phù hợp</h2>
      <h3 style="margin-top:0">Nguồn đạm</h3>${c.proteins.length ? `<ul class="rules">${c.proteins.map(x => `<li>${x[0]} <span class="muted">(${x[1]})</span></li>`).join('')}</ul>` : '<div class="muted small">Không còn nguồn đạm phù hợp với các lựa chọn. Hãy nới bớt hạn chế hoặc ngân sách.</div>'}
      <h3>Nguồn tinh bột</h3><div class="small">${c.carbs.join(' · ')}</div></div>`;
  }

  if (planSub === 'rules') {
    const sec = (title, cat) => { const h = ruleList(P.rules, cat); return h ? `<div class="card"><h2>${title}</h2>${h}</div>` : ''; };
    html += sec('🍽 Quy tắc ăn uống', 'eat') + sec('🔁 Sửa thói quen', 'habit') + sec(p.cook === 'self' ? '🍳 Mẹo nấu ăn' : '🥡 Ăn ngoài thông minh', 'out') +
      sec('😋 Món khoái khẩu', 'fav') + sec('📏 Theo dõi & điều chỉnh', 'check');
  }
  html += '<div class="small muted" style="margin:4px 4px 0">Kế hoạch được lập theo các nguyên tắc dinh dưỡng và tập luyện phổ biến, chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hay huấn luyện viên.</div>';
  $('#planBody').innerHTML = html;
}

/* =====================================================================
   CÂN NẶNG
   ===================================================================== */
function trendEta() {
  const p = state.profile, ws = sortedWeights().slice(-21);
  if (ws.length < 4 || dayDiff(ws[0].d, ws[ws.length - 1].d) < 7) return null;
  const xs = ws.map(e => dayDiff(ws[0].d, e.d)), ys = ws.map(e => e.w);
  const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
  const slope = sxy / sxx, now = my + slope * (xs[n - 1] - mx), need = p.goalWeight - now;
  const res = {perWeek: slope * 7, date: null};
  if (Math.abs(need) < 0.3) res.date = 'done';
  else if (slope !== 0 && Math.sign(slope) === Math.sign(need)) res.date = addDays(ws[n - 1].d, Math.ceil(need / slope));
  return res;
}
function chart() {
  const ws = sortedWeights(), p = state.profile;
  if (!ws.length) return '<div class="muted small">Chưa có dữ liệu cân nặng.</div>';
  const W = 640, H = 260, L = 40, R = 14, T = 12, B = 28;
  const d0 = ws[0].d, span = Math.max(dayDiff(d0, ws[ws.length - 1].d), 6);
  const vals = ws.map(e => e.w).concat([p.goalWeight]);
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  const x = d => L + dayDiff(d0, d) / span * (W - L - R), y = w => T + (hi - w) / (hi - lo) * (H - T - B);
  let g = `<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0561a"/><stop offset="1" stop-color="#d7265f"/></linearGradient></defs>`;
  const step = Math.max(1, Math.ceil((hi - lo) / 5));
  for (let v = lo; v <= hi; v += step) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  g += `<line x1="${L}" x2="${W - R}" y1="${y(p.goalWeight)}" y2="${y(p.goalWeight)}" stroke="var(--good)" stroke-dasharray="6 5" stroke-width="1.5"/>
    <text x="${W - R}" y="${y(p.goalWeight) - 5}" text-anchor="end" style="fill:var(--good);font-weight:700">Mục tiêu ${fmt1(p.goalWeight)} kg</text>`;
  const avg = ws.map(e => { const win = ws.filter(o => o.d <= e.d && dayDiff(o.d, e.d) < 7); return {d: e.d, w: win.reduce((a, o) => a + o.w, 0) / win.length}; });
  g += `<path d="${avg.map((e, i) => (i ? 'L' : 'M') + x(e.d).toFixed(1) + ' ' + y(e.w).toFixed(1)).join(' ')}" fill="none" stroke="url(#lg)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  g += ws.map(e => `<circle cx="${x(e.d)}" cy="${y(e.w)}" r="3.5" fill="var(--surface)" stroke="var(--brand)" stroke-width="1.8"><title>${fmtDate(e.d)}: ${e.w} kg</title></circle>`).join('');
  g += `<text x="${L}" y="${H - 8}">${fmtDate(d0, {day: '2-digit', month: '2-digit'})}</text><text x="${W - R}" y="${H - 8}" text-anchor="end">${fmtDate(addDays(d0, span), {day: '2-digit', month: '2-digit'})}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Biểu đồ cân nặng">${g}</svg>`;
}
function renderWeight() {
  const p = state.profile, c = getPlan().ctx;
  const total = p.goalWeight - p.startWeight, done = c.w - p.startWeight;
  const pct = Math.abs(total) < 0.01 ? 100 : Math.max(0, Math.min(100, done / total * 100));
  const tr = trendEta();
  $('#progress').innerHTML = `<div class="grid4">
      <div class="tile"><span class="small muted">Bắt đầu</span><b>${fmt1(p.startWeight)}</b></div>
      <div class="tile"><span class="small muted">Hiện tại</span><b>${fmt1(c.w)}</b></div>
      <div class="tile"><span class="small muted">Mục tiêu</span><b>${fmt1(p.goalWeight)}</b></div>
      <div class="tile"><span class="small muted">Đã thay đổi</span><b>${done > 0 ? '+' : ''}${fmt1(done)}</b></div></div>
    <div class="row between" style="margin:14px 0 6px"><span class="eyebrow">Hoàn thành</span><b class="num">${r0(pct)}%</b></div>
    <div class="bar" style="height:14px"><i style="width:${pct}%;background:var(--grad)"></i></div>
    <div class="small" style="margin-top:12px;display:grid;gap:4px">
      <div>Theo kế hoạch: ${c.eta ? `đạt mục tiêu khoảng <b>${fullDate(c.eta)}</b>` : c.dir === 0 ? '<span class="pill lime">Đang giữ cân</span>' : 'cần tăng vận động để có tiến độ'}</div>
      <div>Theo xu hướng thực tế: ${!tr ? '<span class="muted">cần ít nhất 4 lần cân trong hơn 1 tuần</span>'
        : `${tr.perWeek > 0 ? '+' : ''}${(Math.round(tr.perWeek * 100) / 100).toLocaleString('vi-VN')} kg/tuần → ` + (tr.date === 'done' ? 'đã sát mục tiêu 🎉' : tr.date ? `đạt mục tiêu khoảng <b>${fullDate(tr.date)}</b>` : '<span class="over">đang đi ngược hướng mục tiêu</span>')}</div>
    </div>`;
  $('#chart').innerHTML = chart();
  const ws = sortedWeights().reverse();
  $('#wList').innerHTML = ws.length ? ws.map((e, i) => {
    const prev = ws[i + 1], d = prev ? r1(e.w - prev.w) : null;
    return `<li><div class="name">${fmtDate(e.d, {weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'})}</div>
      ${d != null ? `<span class="small num ${d < 0 ? 'good' : d > 0 ? 'over' : 'muted'}">${d > 0 ? '+' : ''}${fmt1(d)}</span>` : ''}
      <span class="kc">${fmt1(e.w)} kg</span><button class="icon-x" data-act="delWeight" data-d="${e.d}" aria-label="Xóa">✕</button></li>`;
  }).join('') : '<li class="muted small">Chưa có.</li>';
}

/* =====================================================================
   LỊCH SỬ
   ===================================================================== */
function renderHistory() {
  const rows = [];
  const wk = {n: 0, kcal: 0, done: 0};
  for (let i = 0; i < 30; i++) {
    const d = addDays(today(), -i), x = state.days[d], t = totals(d);
    if (i < 7 && x?.meals.length) { wk.n++; wk.kcal += t.kcal; }
    if (i < 7 && t.planned) wk.done++;
    if (!(x && (x.meals.length || x.ex.length || x.water)) && state.weights[d] == null) continue;
    const budget = getPlan(d).ctx.dayTargets[weekIdx(d)] + r0(t.extra * EXTRA_CREDIT), delta = t.kcal - budget;
    rows.push(`<tr data-act="goto" data-d="${d}" style="cursor:pointer"><td>${fmtDate(d)}</td>
      <td>${t.kcal ? fmt(t.kcal) : '–'}</td><td>${t.planned ? '✅' : '–'}</td><td>${fmt(budget)}</td>
      <td class="${t.kcal ? (delta > 0 ? 'over' : 'good') : ''}">${t.kcal ? (delta > 0 ? '+' : '') + fmt(delta) : '–'}</td>
      <td>${state.weights[d] != null ? fmt1(state.weights[d]) : '–'}</td></tr>`);
  }
  $('#histTable').innerHTML = rows.length
    ? `<tr><th>Ngày</th><th>Ăn</th><th>Tập</th><th>Khẩu phần</th><th>Chênh</th><th>Cân</th></tr>${rows.join('')}`
    : '<tr><td class="muted">Chưa có dữ liệu.</td></tr>';
  $('#weekAvg').textContent = `7 ngày qua: tập ${wk.done} buổi` + (wk.n ? ` · ${wk.n} ngày có ghi ăn uống, trung bình ${fmt(wk.kcal / wk.n)} kcal/ngày.` : '.');
}

/* =====================================================================
   CÀI ĐẶT
   ===================================================================== */
function renderSettings() {
  const p = state.profile;
  const many = (id, arr) => arr && arr.length ? arr.map(v => optLabel(id, v)).join(', ') : 'Không';
  const clean = s => String(s).replace(/^[^\p{L}\d]+/u, '');
  const rows = [
    ['Cơ thể', `${optLabel('sex', p.sex)}, ${p.age} tuổi, ${p.height} cm${p.waist ? `, eo ${p.waist} cm` : ''}`],
    ['Mục tiêu', `${clean(optLabel('focus', p.focus))} · ${fmt1(p.goalWeight)} kg · ${clean(optLabel('pace', p.pace)).toLowerCase()}`],
    ['Vùng cải thiện', many('areas', p.areas)],
    ['Sinh hoạt', `${clean(optLabel('job', p.job))} · ngủ ${optLabel('sleep', p.sleep).toLowerCase()} · căng thẳng ${optLabel('stress', p.stress).toLowerCase()}`],
    ['Sức khỏe', many('health', p.health)],
    ['Tập luyện', `${clean(optLabel('exp', p.exp))} · ${p.days} buổi × ${optLabel('len', p.len)}`],
    ['Dụng cụ', p.equipment && p.equipment.length ? p.equipment.map(id => (BRAIN.EQUIPMENT.find(q => q.id === id) || {name: id}).name).join(', ') : 'Không có (tập tay không)'],
    ['Ngày rảnh', p.trainDays && p.trainDays.length ? p.trainDays.map(d => DAYS_SHORT[d]).join(', ') : 'App tự xếp'],
    ['Môn yêu thích', many('sports', p.sports).replace(/[^\p{L}\d,/ ]+/gu, '').replace(/\s+/g, ' ').trim()],
    ['Ăn uống', `${optLabel('meals', p.meals)} · ${optLabel('diet', p.diet).toLowerCase()} · ${clean(optLabel('cook', p.cook)).toLowerCase()} · ${optLabel('budget', p.budget).toLowerCase()}`],
    ['Không ăn', many('avoid', p.avoid)],
    ['Chu kỳ hiện tại', `bắt đầu ${fullDate(p.startDate)} từ ${fmt1(p.startWeight)} kg`]
  ];
  $('#profileSummary').innerHTML = `<ul class="list">${rows.map(([k, v]) => `<li><span class="muted small" style="min-width:110px;font-weight:700">${k}</span><span class="name">${esc(v)}</span></li>`).join('')}</ul>`;
  $('#brainCard').innerHTML = `<h2>🧠 Bộ não HLV</h2><div class="tiles3">
    <div class="tile"><span class="small muted">Bài tập</span><b>${BRAIN.EXERCISES.length}</b></div>
    <div class="tile"><span class="small muted">Món ăn</span><b>${BRAIN.DISHES.length + BRAIN.SNACKS.length}</b></div>
    <div class="tile"><span class="small muted">Quy tắc</span><b>${BRAIN.RULES.length}</b></div></div>
    <div class="small muted" style="margin-top:10px">Toàn bộ kiến thức nằm trong thư mục <b>brain/</b>. Bạn có thể tự thêm bài tập, món ăn hay quy tắc mới (hướng dẫn trong README.md).</div>`;
  $('#customList').innerHTML = state.customFoods.length ? state.customFoods.map(f => `
    <li><div class="name">${esc(f.name)} <span class="muted small">(${esc(f.unit)})</span></div>
    <span class="kc">${fmt(f.kcal)} kcal</span><button class="icon-x" data-act="delFood" data-id="${f.id}" aria-label="Xóa">✕</button></li>`).join('')
    : '<li class="muted small">Chưa có. Khi thêm món, tick "Lưu vào món của tôi" để dùng lại lần sau.</li>';
}

function renderBadges() {
  const P = getPlan(today(), true), s = P.ctx.log ? P.ctx.log.streak : 0;
  $('#topBadges').innerHTML = `<span class="badge">Tuần ${P.phase.programWeek}</span>${s ? `<span class="badge fire" title="Chuỗi ngày ghi chép">🔥 ${s}</span>` : ''}`;
}

/* =====================================================================
   NHẬP LIỆU
   ===================================================================== */
const EX_TYPES = [...BRAIN.CARDIO.map(c => [c.name, c.met]), ['Gym / tập tạ', 5], ['HIIT', 8], ['Đi bộ thường', 3.5], ['Làm việc nhà nặng', 3.5]];
function renderFoodList() {
  $('#foodList').innerHTML = allFoods().map(f => `<option value="${esc(f[0])}">${esc(f[1])} · ${f[2]} kcal${f[6] ? ' · của tôi' : ''}</option>`).join('');
}
function fillFoodFields(qty) {
  if (!foodBase) return;
  const [, unit, k, p, c, f] = foodBase;
  $('#fKcal').value = r0(k * qty); $('#fP').value = r1(p * qty); $('#fC').value = r1(c * qty); $('#fF').value = r1(f * qty);
  $('#fUnit').textContent = `1 phần = ${unit} · ${k} kcal (giá trị ước tính, có thể sửa)`;
}
function addMeal() {
  const name = $('#fName').value.trim(), qty = num($('#fQty').value, 1) || 1;
  const m = {id: uid(), meal: $('#fMeal').value, name, qty, kcal: num($('#fKcal').value), p: num($('#fP').value), c: num($('#fC').value), f: num($('#fF').value)};
  if (!name || m.kcal <= 0) { toast('Nhập tên món và số calo'); return; }
  getDay(sel).meals.push(m);
  if ($('#fSave').checked && !allFoods().some(f => f[0].toLowerCase() === name.toLowerCase())) {
    state.customFoods.push({id: uid(), name, unit: '1 phần', kcal: r0(m.kcal / qty), p: r1(m.p / qty), c: r1(m.c / qty), f: r1(m.f / qty)});
    renderFoodList();
  }
  save();
  ['#fName', '#fKcal', '#fP', '#fC', '#fF'].forEach(s => $(s).value = '');
  $('#fQty').value = 1; $('#fSave').checked = false; $('#fUnit').textContent = ''; foodBase = null;
  renderAll();
  toast('Đã thêm món');
}
function calcEx() { $('#eKcal').value = r0(num($('#eType').value) * weightOn(sel) * num($('#eMin').value) / 60); }
function addEx() {
  const e = {id: uid(), name: $('#eType').selectedOptions[0].textContent, min: num($('#eMin').value), kcal: num($('#eKcal').value)};
  if (e.min <= 0 || e.kcal <= 0) { toast('Nhập số phút vận động'); return; }
  getDay(sel).ex.push(e); save(); renderAll();
}

/* =====================================================================
   CHẾ ĐỘ TẬP (đếm hiệp, đồng hồ nghỉ, bấm giờ cardio)
   ===================================================================== */
let PL = null, plTick = null, audioCtx = null, wakeLock = null;

function ensureAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { audioCtx = null; }
}
function beep(times = 2) {
  try {
    if (audioCtx) for (let k = 0; k < times; k++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime + k * 0.25;
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      o.start(t0); o.stop(t0 + 0.2);
    }
  } catch (e) {}
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
}
async function requestWake() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} }
function releaseWake() { try { if (wakeLock) wakeLock.release(); } catch (e) {} wakeLock = null; }
document.addEventListener('visibilitychange', () => { if (PL && document.visibilityState === 'visible') requestWake(); });

function openPlayer(s, logDate) {
  ensureAudio();
  const list = s.kind === 'strength' ? s.exercises.map(e => ({...e})) : [];
  PL = {s, logDate, kind: s.kind === 'strength' ? 'strength' : 'timer', step: 'warmup', i: 0, set: 1, setsDone: 0, list,
    totalSets: list.reduce((a, e) => a + e.setsN, 0), started: 0, ended: 0, restEnd: 0, restTotal: 0, holdStart: 0,
    run: false, acc: 0, runFrom: 0, lastBlock: -1, alerted: false};
  $('#player').classList.remove('hidden');
  document.body.classList.add('noscroll');
  requestWake();
  renderPlayer();
  clearInterval(plTick);
  plTick = setInterval(tickPlayer, 250);
}
function closePlayer() {
  clearInterval(plTick); plTick = null; PL = null;
  $('#player').classList.add('hidden'); $('#player').innerHTML = '';
  document.body.classList.remove('noscroll');
  releaseWake();
}
const timerElapsed = () => PL.acc + (PL.run ? Date.now() - PL.runFrom : 0);
const sessionMinutes = () => Math.max(1, r0((PL.kind === 'strength' ? (PL.ended || Date.now()) - PL.started : timerElapsed()) / 60000));
const sessionKcal = min => r0((PL.kind === 'strength' ? BRAIN.STRENGTH_MET : (PL.s.met || 4) * (PL.s.interval ? 1.15 : 1)) * weightOn(PL.logDate) * min / 60);

// Cardio biến tốc: khởi động → (nhanh, chậm) × n → thả lỏng
function intervalBlock(sec, iv) {
  const blocks = [{label: 'Khởi động', len: iv.warm}];
  for (let r = 1; r <= iv.rounds; r++) {
    blocks.push({label: `🔥 NHANH · lượt ${r}/${iv.rounds}`, len: iv.on, fast: true});
    blocks.push({label: `Chậm · lượt ${r}/${iv.rounds}`, len: iv.off});
  }
  blocks.push({label: 'Thả lỏng', len: iv.cool});
  let t = 0;
  for (let i = 0; i < blocks.length; i++) {
    if (sec < t + blocks[i].len) return {...blocks[i], idx: i, left: t + blocks[i].len - sec};
    t += blocks[i].len;
  }
  return {label: 'Xong! 🎉', idx: blocks.length, left: 0};
}

function renderPlayer() {
  if (!PL) return;
  const s = PL.s;
  const prog = PL.kind === 'strength' ? (PL.totalSets ? PL.setsDone / PL.totalSets : 0) : Math.min(1, timerElapsed() / (s.minutes * 60000));
  const label = PL.step === 'warmup' ? 'Khởi động' : PL.step === 'done' ? 'Kết thúc' : PL.kind === 'strength' ? `Bài ${PL.i + 1}/${PL.list.length}` : 'Đang tập';
  let body = '', actions = '';
  if (PL.step === 'warmup') {
    body = `<div class="display pl-name">Khởi động</div><div class="pl-cue">Làm chậm rãi để cơ thể ấm lên trước khi vào bài chính.</div>
      <ul class="pl-list">${(s.warmup || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    actions = '<button class="btn btn-primary btn-lg" data-act="plStart">▶ Vào bài tập</button>';
  } else if (PL.step === 'work' && PL.kind === 'strength') {
    const e = PL.list[PL.i];
    body = `<div class="eyebrow">${esc(e.muscles)}${e.equip ? ` · 🧰 ${esc(e.equip)}` : ''}</div><div class="display pl-name">${esc(e.name)}</div><div class="pl-cue">${esc(e.cue)}</div>
      <div class="pl-set"><span class="display">Hiệp ${PL.set}</span><span class="pl-target" style="opacity:.6">/ ${e.setsN}</span></div>
      <div class="pl-target">🎯 ${esc(e.reps)}</div>
      ${e.time ? `<div class="pl-hold" id="plHold">${PL.holdStart ? '0:00' : `Mục tiêu ${mmss(e.holdSec)}`}</div>` : ''}
      <div class="pl-alt">${e.easier ? '<button data-act="plSwap" data-to="easier">↓ Dễ hơn</button>' : ''}${e.harder ? '<button data-act="plSwap" data-to="harder">↑ Khó hơn</button>' : ''}<button data-act="plSkip">Bỏ qua bài ›</button></div>`;
    actions = (e.time && !PL.holdStart ? '<button class="btn btn-ghost btn-lg" data-act="plHold">⏱ Bấm giờ</button>' : '') + '<button class="btn btn-primary btn-lg" data-act="plSetDone">✓ Xong hiệp</button>';
  } else if (PL.step === 'rest') {
    const nx = PL.list[PL.i], C = 2 * Math.PI * 104;
    body = `<div class="eyebrow center">Nghỉ giữa hiệp</div>
      <div class="pl-ring"><svg width="240" height="240" viewBox="0 0 240 240" aria-hidden="true">
        <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0561a"/><stop offset="1" stop-color="#d7265f"/></linearGradient></defs>
        <circle cx="120" cy="120" r="104" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="14"/>
        <circle id="plRestArc" cx="120" cy="120" r="104" fill="none" stroke="url(#pg)" stroke-width="14" stroke-linecap="round" transform="rotate(-90 120 120)" stroke-dasharray="${C} ${C}"/></svg>
        <div class="lbl"><div class="pl-count" id="plRest">0</div><div style="opacity:.6">giây</div></div></div>
      <div class="center"><div class="eyebrow">Tiếp theo</div><b>${esc(nx.name)}</b> · Hiệp ${PL.set}/${nx.setsN} · ${esc(nx.reps)}</div>`;
    actions = '<button class="btn btn-ghost btn-lg" data-act="plMore">+15 giây</button><button class="btn btn-primary btn-lg" data-act="plRestSkip">Bỏ qua ›</button>';
  } else if (PL.step === 'work') {
    body = `<div class="eyebrow center" id="plBlock">${s.interval ? '' : 'Giữ nhịp đều'}</div>
      <div class="center"><div class="pl-count" id="plTimer">0:00</div><div style="opacity:.6" id="plTimerSub"></div></div>
      ${s.zone ? `<div class="center"><span class="pl-chip">❤️ Nhịp tim ${s.zone.lo}–${s.zone.hi}</span></div>` : ''}
      <ul class="pl-list">${(s.items || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    actions = `<button class="btn btn-ghost btn-lg" data-act="plToggle">${PL.run ? '⏸ Tạm dừng' : '▶ Tiếp tục'}</button><button class="btn btn-primary btn-lg" data-act="plFinish">✓ Kết thúc</button>`;
  } else if (PL.step === 'done') {
    const min = sessionMinutes(), kcal = sessionKcal(min);
    body = `<div class="center" style="font-size:64px;line-height:1">🎉</div><div class="display pl-name center">Hoàn thành!</div>
      <div class="pl-stats"><div><b>${min}</b>phút</div><div><b>${PL.kind === 'strength' ? PL.setsDone : mmss(Math.floor(timerElapsed() / 1000))}</b>${PL.kind === 'strength' ? 'hiệp' : 'thời gian'}</div><div><b>${fmt(kcal)}</b>kcal</div></div>
      <div class="pl-cue center">🧊 Thả lỏng: ${esc((s.cooldown || []).join(' · '))}</div>`;
    actions = '<button class="btn btn-ghost" data-act="plClose">Đóng</button><button class="btn btn-primary btn-lg" data-act="plSave">💾 Lưu buổi tập</button>';
  }
  $('#player').innerHTML = `<div class="pl-top"><div class="row between"><div><div class="eyebrow">${label}</div><b>${s.emoji} ${esc(s.title)}</b></div>
      <button class="pl-close" data-act="plClose" aria-label="Thoát chế độ tập">✕</button></div>
      <div class="pl-prog"><i id="plProg" style="width:${prog * 100}%"></i></div></div>
    <div class="pl-body">${body}</div><div class="pl-actions">${actions}</div>`;
  tickPlayer();
}

function tickPlayer() {
  if (!PL) return;
  const now = Date.now(), set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  if (PL.step === 'rest') {
    set('plRest', Math.max(0, Math.ceil((PL.restEnd - now) / 1000)));
    const arc = document.getElementById('plRestArc');
    if (arc) { const C = 2 * Math.PI * 104; arc.setAttribute('stroke-dasharray', `${C * Math.max(0, (PL.restEnd - now) / PL.restTotal)} ${C}`); }
    if (now >= PL.restEnd) { beep(2); PL.step = 'work'; PL.holdStart = 0; PL.alerted = false; renderPlayer(); }
  } else if (PL.step === 'work' && PL.kind === 'strength' && PL.holdStart) {
    const e = PL.list[PL.i], sec = Math.floor((now - PL.holdStart) / 1000), el = document.getElementById('plHold');
    if (el) { el.textContent = mmss(sec); el.classList.toggle('ok', sec >= e.holdSec); }
    if (sec >= e.holdSec && !PL.alerted) { PL.alerted = true; beep(1); }
  } else if (PL.step === 'work' && PL.kind === 'timer') {
    const s = PL.s, sec = Math.floor(timerElapsed() / 1000), target = s.minutes * 60;
    if (s.interval) {
      const b = intervalBlock(sec, s.intervals);
      set('plBlock', b.label); set('plTimer', mmss(b.left)); set('plTimerSub', `Tổng ${mmss(sec)} / ${mmss(target)}`);
      if (b.idx !== PL.lastBlock) { if (PL.lastBlock !== -1) beep(b.fast ? 3 : 1); PL.lastBlock = b.idx; }
    } else {
      const left = target - sec;
      set('plTimer', mmss(Math.abs(left))); set('plTimerSub', left >= 0 ? 'còn lại' : 'vượt mục tiêu 💪');
      if (left <= 0 && !PL.alerted) { PL.alerted = true; beep(3); }
    }
    const pr = document.getElementById('plProg'); if (pr) pr.style.width = Math.min(100, sec / target * 100) + '%';
  }
}

function startRest(sec) { PL.step = 'rest'; PL.restTotal = sec * 1000; PL.restEnd = Date.now() + sec * 1000; PL.holdStart = 0; }
function nextExercise() {
  if (PL.i < PL.list.length - 1) { PL.i++; PL.set = 1; return true; }
  PL.step = 'done'; PL.ended = Date.now(); return false;
}

function playerAction(a, el) {
  const e = PL.list[PL.i];
  if (a === 'plStart') {
    ensureAudio(); PL.started = Date.now(); PL.step = 'work';
    if (PL.kind === 'timer') { PL.run = true; PL.runFrom = Date.now(); }
  } else if (a === 'plSetDone') {
    PL.setsDone++; PL.alerted = false;
    if (PL.set < e.setsN) { PL.set++; startRest(e.restSec); }
    else if (nextExercise()) startRest(e.restSec);
  } else if (a === 'plHold') { PL.holdStart = Date.now(); PL.alerted = false; }
  else if (a === 'plSkip') { PL.holdStart = 0; if (nextExercise()) PL.step = 'work'; }
  else if (a === 'plMore') { PL.restEnd += 15000; PL.restTotal += 15000; return; }
  else if (a === 'plRestSkip') { PL.step = 'work'; PL.holdStart = 0; }
  else if (a === 'plSwap') {
    const to = e[el.dataset.to]; if (!to) return;
    const alt = ENGINE.alternatives(to.id, state.profile);
    PL.list[PL.i] = {...e, id: to.id, name: to.name, cue: to.cue, muscles: to.muscles, equip: to.equip, time: to.time, reps: to.time ? e.repsTime : e.repsRep, easier: alt.easier, harder: alt.harder};
    PL.holdStart = 0;
    toast('Đã đổi sang: ' + to.name);
  } else if (a === 'plToggle') {
    if (PL.run) { PL.acc += Date.now() - PL.runFrom; PL.run = false; } else { PL.run = true; PL.runFrom = Date.now(); }
  } else if (a === 'plFinish') {
    if (PL.run) { PL.acc += Date.now() - PL.runFrom; PL.run = false; }
    PL.step = 'done'; PL.ended = Date.now();
  } else if (a === 'plSave') {
    const min = sessionMinutes();
    getDay(PL.logDate).ex.push({id: uid(), name: 'Buổi tập: ' + PL.s.title, min, kcal: sessionKcal(min), planned: true, sets: PL.setsDone});
    save(); closePlayer(); renderAll(); toast('Đã lưu buổi tập 💪');
    return;
  } else if (a === 'plClose') {
    if (['work', 'rest'].includes(PL.step) && !confirm('Thoát buổi tập? Tiến độ sẽ không được lưu.')) return;
    closePlayer(); return;
  }
  renderPlayer();
}

/* =====================================================================
   ĐIỀU HƯỚNG & SỰ KIỆN
   ===================================================================== */
function showTab(name) {
  $$('.tab').forEach(t => t.classList.toggle('on', t.id === 'tab-' + name));
  $$('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  try { localStorage.setItem(KEY + '.tab', name); } catch (e) {}
  window.scrollTo(0, 0);
}
function renderAll() {
  if (!state.profile) return;
  renderToday(); renderPlan(); renderWeight(); renderHistory(); renderSettings(); renderBadges();
}

document.addEventListener('click', ev => {
  const tabBtn = ev.target.closest('nav.tabs [data-tab]');
  if (tabBtn) { showTab(tabBtn.dataset.tab); return; }
  const subBtn = ev.target.closest('.seg [data-sub]');
  if (subBtn) { planSub = subBtn.dataset.sub; renderPlan(); return; }
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act;
  if (a.startsWith('pl') && PL) { playerAction(a, el); return; }
  if (a === 'wzNext') {
    const err = validateStep(wzStep);
    if (err) { $('#wzErr').textContent = err; return; }
    if (wzStep === STEPS.length - 1) finishWizard();
    else { wzStep++; renderWizard(); window.scrollTo(0, 0); }
  }
  else if (a === 'wzBack') { if (wzStep > 0) { wzStep--; renderWizard(); window.scrollTo(0, 0); } }
  else if (a === 'wzCancel') closeWizard();
  else if (a === 'wzPreset') {
    wz.equipment = [...((BRAIN.EQUIP_PRESETS.find(x => x.id === el.dataset.v) || {items: []}).items)];
    const y = window.scrollY; renderWizard(); window.scrollTo(0, y);
  }
  else if (a === 'dismissInstall') { try { localStorage.setItem(KEY + '.installHint', '1'); } catch (e) {} renderInstallCard(); }
  else if (a === 'prev') { sel = addDays(sel, -1); renderToday(); }
  else if (a === 'next') { sel = addDays(sel, 1); renderToday(); }
  else if (a === 'pickDay') { sel = el.dataset.d; renderToday(); }
  else if (a === 'saveWeight') {
    const w = num($('#wInput').value);
    if (w < 25 || w > 350) { toast('Cân nặng không hợp lệ'); return; }
    state.weights[sel] = r1(w); save(); renderAll(); toast('Đã lưu cân nặng');
  }
  else if (a === 'water') { const d = getDay(sel), i = +el.dataset.i; d.water = d.water === i + 1 ? i : i + 1; save(); renderToday(); }
  else if (a === 'startWorkout') {
    if (el.dataset.day != null) openPlayer(getPlan(today()).week[+el.dataset.day], today());
    else openPlayer(getPlan(sel).week[weekIdx(sel)], sel <= today() ? sel : today());
  }
  else if (a === 'doneSession') {
    const s = getPlan(sel).week[weekIdx(sel)];
    getDay(sel).ex.push({id: uid(), name: 'Buổi tập: ' + s.title, min: s.minutes, kcal: s.kcal, planned: true});
    save(); renderAll(); toast('Tuyệt vời! Đã ghi buổi tập 💪');
  }
  else if (a === 'logMenu') {
    const m = getPlan(sel).menu(weekIdx(sel)).meals[+el.dataset.i];
    if (!m || !m.items.length) return;
    getDay(sel).meals.push({id: uid(), meal: m.logKey, name: m.items.map(x => x.n).join(' + '), qty: 1, kcal: m.kcal, p: m.p, c: m.c, f: m.f});
    save(); renderAll(); toast(`Đã ghi ${m.label.toLowerCase()}`);
  }
  else if (a === 'openPlan') { planSub = el.dataset.sub || 'overview'; if (planSub === 'menu') menuDay = weekIdx(sel); renderPlan(); showTab('plan'); }
  else if (a === 'menuDay') { menuDay = +el.dataset.i; renderPlan(); }
  else if (a === 'applyAdaptive') { state.profile.tdeeAdjust = +el.dataset.v; save(); renderAll(); toast('Đã cập nhật calo mục tiêu'); }
  else if (a === 'addMeal') addMeal();
  else if (a === 'addEx') addEx();
  else if (a === 'delMeal') { const d = getDay(sel); d.meals = d.meals.filter(m => m.id !== el.dataset.id); save(); renderAll(); }
  else if (a === 'delEx') { const d = getDay(sel); d.ex = d.ex.filter(m => m.id !== el.dataset.id); save(); renderAll(); }
  else if (a === 'delWeight') { if (confirm('Xóa lần cân này?')) { delete state.weights[el.dataset.d]; save(); renderAll(); } }
  else if (a === 'delFood') { state.customFoods = state.customFoods.filter(f => f.id !== el.dataset.id); save(); renderFoodList(); renderSettings(); }
  else if (a === 'goto') { sel = el.dataset.d; renderToday(); showTab('today'); }
  else if (a === 'editProfile') openWizard(true);
  else if (a === 'export') exportData();
  else if (a === 'import') $('#importFile').click();
  else if (a === 'reset') {
    if (confirm('Xóa toàn bộ dữ liệu? Không thể hoàn tác. Hãy xuất file sao lưu trước nếu cần.')) { state = blank(); save(); openWizard(false); }
  }
});

$('#importFile').addEventListener('change', async ev => {
  const file = ev.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (typeof data !== 'object' || !data.days || !data.weights) throw new Error('File không đúng định dạng.');
    if (!confirm('Thay toàn bộ dữ liệu hiện tại bằng dữ liệu trong file?')) return;
    state = Object.assign(blank(), data); migrate(); save(); renderFoodList();
    if (isComplete(state.profile)) { renderAll(); toast('Đã nhập dữ liệu'); } else openWizard(true);
  } catch (e) { alert('Không đọc được file: ' + e.message); }
  ev.target.value = '';
});
$('#fName').addEventListener('input', () => {
  const v = $('#fName').value.trim().toLowerCase();
  foodBase = allFoods().find(f => f[0].toLowerCase() === v) || null;
  if (foodBase) fillFoodFields(num($('#fQty').value, 1)); else $('#fUnit').textContent = '';
});
$('#fQty').addEventListener('input', () => fillFoodFields(num($('#fQty').value, 1)));
$('#eType').addEventListener('change', calcEx);
$('#eMin').addEventListener('input', calcEx);
$('#wInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('[data-act=saveWeight]').click(); });

/* =====================================================================
   IPHONE / WEB APP CÀI ĐƯỢC
   ===================================================================== */
const IS_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_MOBILE = IS_IOS || /android/i.test(navigator.userAgent);
const IS_STANDALONE = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function renderInstallCard() {
  let hidden = true;
  try { hidden = !IS_IOS || IS_STANDALONE || localStorage.getItem(KEY + '.installHint') === '1'; } catch (e) {}
  $('#installCard').innerHTML = hidden ? '' : `<div class="card install">
    <div class="row between" style="flex-wrap:nowrap"><b>📲 Cài app lên iPhone</b><button class="icon-x" data-act="dismissInstall" aria-label="Ẩn">✕</button></div>
    <ol class="small" style="margin:8px 0 0;padding-left:20px">
      <li>Bấm nút <b>Chia sẻ</b> <span class="share-ic">⬆︎</span> ở thanh dưới của Safari</li>
      <li>Chọn <b>Thêm vào Màn hình chính</b>, rồi bấm <b>Thêm</b></li>
    </ol>
    <div class="small muted" style="margin-top:6px">App sẽ mở toàn màn hình như app thật, dùng được khi không có mạng, và iOS giữ dữ liệu ổn định hơn so với mở trong Safari.</div></div>`;
}

// Sao lưu: trên điện thoại dùng bảng Chia sẻ (lưu vào Tệp / iCloud / gửi Zalo…), trên máy tính thì tải file
async function exportData() {
  const name = `so-can-nang-${today()}.json`, json = JSON.stringify(state, null, 2);
  if (IS_MOBILE && navigator.canShare) {
    try {
      const file = new File([json], name, {type: 'application/json'});
      if (navigator.canShare({files: [file]})) { await navigator.share({files: [file], title: 'Sao lưu Sổ Cân Nặng'}); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([json], {type: 'application/json'}));
  link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Service worker: lưu app vào máy để chạy khi không có mạng (chỉ khi chạy qua https / localhost)
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
// Xin trình duyệt giữ dữ liệu lâu dài, không tự xóa khi thiếu dung lượng
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

/* ---------------- Khởi động ---------------- */
renderInstallCard();
$('#eType').innerHTML = EX_TYPES.map(([n, m]) => `<option value="${m}">${n}</option>`).join('');
renderFoodList();
if (!isComplete(state.profile)) openWizard(!!state.profile);
else {
  $('#app').classList.remove('hidden');
  renderAll();
  let t = 'today';
  try { t = localStorage.getItem(KEY + '.tab') || 'today'; } catch (e) {}
  showTab(t);
}
