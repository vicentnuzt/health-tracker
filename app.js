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
function blank() { return {profile: null, days: {}, weights: {}, customFoods: [], lifts: {}, settings: {}}; }
// Cài đặt âm thanh khi tập (giọng HLV, kiểu nhạc, âm lượng, link playlist riêng)
function settings() { state.settings = Object.assign({voice: true, music: 'edm', volume: 0.6, playlist: ''}, state.settings || {}); return state.settings; }
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
const allFoods = () => ENGINE.foods(state.customFoods);

let sel = today();
let planSub = 'week';
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
    planSub = 'cycle';
    renderAll();
    showTab('plan');
  });
}

// Màn "HLV đang phân tích": mô tả đúng các bước bộ máy thực hiện
function runAnalysis(done) {
  const steps = ['Tính nhu cầu năng lượng', `Chọn bài từ ${BRAIN.EXERCISES.length} bài tập`, 'Xếp lịch chu kỳ 12 tuần',
    `Phân loại ${BRAIN.FOOD_DB.length} món Việt nên ăn / hạn chế`, `Áp dụng ${BRAIN.RULES.length} quy tắc của HLV`];
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
const bar = (val, goal, color) => `<div class="bar"><i style="width:${goal > 0 ? Math.min(val / goal * 100, 100) : 0}%;background:${color}"></i></div>`;

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
  const lifts = state.lifts || {};
  const lines = s.kind === 'strength'
    ? s.exercises.slice(0, 4).map(e => `${e.name} · ${e.sets} × ${e.reps}${ENGINE.suggest(e, lifts[e.id]).up ? ' 📈' : ''}`)
      .concat(s.exercises.length > 4 ? [`và ${s.exercises.length - 4} bài nữa`] : [])
    : s.items;
  const btns = restOnly ? '<button class="btn btn-glass" data-act="openPlan" data-sub="week">Xem lịch cả tuần ›</button>'
    : done ? '<span class="done-badge">✓ Đã hoàn thành</span><button class="btn btn-glass" data-act="startWorkout">Tập lại</button>'
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

function renderToday() {
  const P = getPlan(sel, true), c = P.ctx, wi = weekIdx(sel), day = dayData(sel), t = totals(sel);
  $('#selDate').textContent = sel === today() ? 'Hôm nay' : DAYS[wi];
  $('#selSub').textContent = fmtDate(sel, {weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'});
  renderWeekStrip(P, wi);
  const s = P.week[wi];
  $('#hero').innerHTML = heroHtml(s, t.planned, P);
  $('#coachCard').innerHTML = coachHtml(P, 3);

  const dayTarget = c.dayTargets[wi], credit = r0(t.extra * EXTRA_CREDIT), budget = dayTarget + credit;
  $('#ring').innerHTML = ring(t.kcal, budget);
  $('#todayStats').innerHTML = `
    <div class="tile"><span class="small muted">Mục tiêu${credit ? ' (+vận động)' : ''}</span><b>${fmt(budget)}</b></div>
    <div class="tile"><span class="small muted">Đã ăn</span><b>${fmt(t.kcal)}</b></div>
    <div class="tile" style="grid-column:span 2"><span class="small muted">Đạm ${r0(t.p)} / ${c.protein} g</span>${bar(t.p, c.protein, 'var(--p)')}</div>`;

  const wNow = weightOn(sel), wPrev = sortedWeights().filter(e => e.d <= addDays(sel, -7)).pop();
  $('#wNow').textContent = `${fmt1(wNow)} kg`;
  $('#wDelta').innerHTML = wPrev ? (d => `<span class="${d < 0 ? 'good' : d > 0 ? 'over' : ''}">${d > 0 ? '+' : ''}${fmt1(d)} kg</span> so với 7 ngày trước`)(r1(wNow - wPrev.w)) : '';
  $('#wInput').value = state.weights[sel] ?? '';
  const wg = Math.ceil((c.water + (s.kind === 'rest' && !s.minutes ? 0 : 0.5)) / 0.25);
  $('#water').innerHTML = Array.from({length: Math.max(wg, day.water)}, (_, i) =>
    `<span class="g ${i < day.water ? 'full' : ''}" data-act="water" data-i="${i}" title="${i + 1} ly" role="button" aria-label="${i + 1} ly nước"></span>`).join('') +
    `<span class="small muted num" style="margin-left:6px;font-weight:700">${day.water}/${wg} ly</span>`;
  $('#stepsLine').innerHTML = `👟 Mục tiêu <b>${fmt(c.stepsNow)} bước</b> hôm nay`;

  $('#exList').innerHTML = day.ex.length ? day.ex.map(e => `
    <li><div class="name">${esc(e.name)} <span class="muted">· ${e.min} phút</span>${e.planned ? ' <span class="pill">trong lịch</span>' : ''}</div>
    <span class="kc">−${fmt(e.kcal)}</span><button class="icon-x" data-act="delEx" data-id="${e.id}" aria-label="Xóa">✕</button></li>`).join('')
    : '<li class="muted small">Chưa có.</li>';
  calcEx();
}

/* =====================================================================
   LỊCH TẬP
   ===================================================================== */
const ruleList = (rules, cat) => { const r = rules.filter(x => x.cat === cat); return r.length ? `<ul class="rules">${r.map(x => `<li>${x.text}</li>`).join('')}</ul>` : ''; };
const ytLink = name => `https://www.youtube.com/results?search_query=${encodeURIComponent(name.replace(/\([^)]*\)/g, '').trim() + ' hướng dẫn kỹ thuật')}`;

function exRow(e, i) {
  const hist = (state.lifts || {})[e.id] || [], sg = ENGINE.suggest(e, hist), g = BRAIN.SLOT_GUIDE[e.slot] || {};
  const alt = e.easier || e.harder ? `<div class="alt">${e.easier ? `↓ Dễ hơn: <b>${esc(e.easier.name)}</b>` : ''}${e.easier && e.harder ? ' · ' : ''}${e.harder ? `↑ Khó hơn: <b>${esc(e.harder.name)}</b>` : ''}</div>` : '';
  return `<li class="exrow"><span class="exnum">${i + 1}</span><div>
    <div class="exname">${esc(e.name)}</div>
    <div class="exmeta"><span class="tag">${esc(e.sets)} × ${esc(e.reps)}</span><span class="tag">nghỉ ${esc(e.rest)}</span>${e.equip ? `<span class="tag eq">🧰 ${esc(e.equip)}</span>` : ''}<span class="muscle">${esc(e.muscles)}</span></div>
    <span class="cue">${esc(e.cue)}</span>
    ${sg.last ? `<div class="lastperf">${sg.up ? '📈' : '🎯'} ${esc(sg.text)}</div>` : ''}${alt}
    <details class="exguide"><summary>Cách thở · lỗi thường gặp · video</summary>
      ${g.breath ? `<div>🌬️ ${esc(g.breath)}</div>` : ''}${g.mistakes ? `<div>⚠️ Tránh: ${g.mistakes.map(esc).join(' · ')}</div>` : ''}
      <a href="${ytLink(e.name)}" target="_blank" rel="noopener">▶ Xem video hướng dẫn</a></details></div></li>`;
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
    <div class="dhead"><div><div class="eyebrow">${DAYS[w.day]}${w.day === now ? ' · <span class="pill">hôm nay</span>' : ''}${doneOn(addDays(today(), w.day - now)) ? ' · <span class="pill lime">✓ đã tập</span>' : ''}</div>
      <div class="display dtitle">${w.emoji} ${esc(w.title)}</div></div>
      ${w.minutes ? `<div class="small muted num" style="text-align:right;font-weight:700">${w.minutes} phút<br>~${fmt(w.kcal)} kcal</div>` : ''}</div>
    ${body}
    ${w.minutes ? `<div class="row" style="margin-top:12px"><button class="btn btn-primary" data-act="startWorkout" data-day="${w.day}">▶ Tập buổi này</button></div>` : ''}
  </div>`;
}

function renderPlan() {
  $$('#tab-plan .seg button').forEach(b => b.classList.toggle('on', b.dataset.sub === planSub));
  const P = getPlan(today(), true), c = P.ctx, p = state.profile;
  let html = '';

  if (planSub === 'week') {
    const now = weekIdx(today());
    html += `<div class="card"><div class="eyebrow">Tuần ${P.phase.programWeek} · ${esc(P.phase.name)} · RIR ${P.phase.rir}</div>
      <div class="display" style="font-size:26px;margin:4px 0 10px">Lịch tập tuần này</div>
      <div class="row"><span class="tag">${p.days} buổi/tuần</span><span class="tag">${fmt(c.weeklyMin)} phút/tuần</span>
      <span class="tag eq">🧰 ${esc(c.equipNames.length ? c.equipNames.join(', ') : 'Tập tay không')}</span></div>
      ${P.phase.weekNote ? `<div class="bubble goal" style="margin-top:10px">🎯 <b>Tuần này:</b> ${esc(P.phase.weekNote)}</div>` : ''}</div>`;
    html += P.week.map(w => dayCard(w, now)).join('');
  }

  if (planSub === 'cycle') {
    const ph = P.phase;
    const cells = Array.from({length: 12}, (_, i) => { const x = BRAIN.PHASES.find(q => i + 1 >= q.from && i + 1 <= q.to); return `<i class="${x.key} ${i + 1 === ph.cycleWeek ? 'now' : ''}" title="Tuần ${i + 1}: ${x.name}"></i>`; }).join('');
    html += `<div class="card"><div class="eyebrow">Chu kỳ ${ph.cycle} · tuần ${ph.cycleWeek}/12 · bắt đầu ${fullDate(p.startDate)}</div>
      <div class="display" style="font-size:28px;margin-top:4px">${esc(ph.name)}</div>
      <div class="timeline">${cells}</div>
      <div class="legend">${BRAIN.PHASES.map(x => `<span><i class="${x.key}"></i>${x.name}</span>`).join('')}</div>
      <p style="margin:12px 0 0">${esc(ph.desc)}</p>
      ${ph.weekNote ? `<div class="bubble goal" style="margin-top:10px">🎯 <b>Tuần này:</b> ${esc(ph.weekNote)}</div>` : ''}</div>`;
    html += `<div class="card"><h2>🎯 Con số của bạn</h2><div class="tiles3">
      <div class="tile"><span class="small muted">Buổi / tuần</span><b>${p.days} × ${p.len}′</b></div>
      <div class="tile"><span class="small muted">Mức gắng sức</span><b>RIR ${ph.rir}</b></div>
      <div class="tile"><span class="small muted">Bước chân</span><b>${fmt(c.stepsNow)}</b></div>
      <div class="tile"><span class="small muted">Calo / ngày</span><b>${fmt(c.target)}</b></div>
      <div class="tile"><span class="small muted">Đạm / ngày</span><b>${c.protein}g</b></div>
      <div class="tile"><span class="small muted">${c.dir === 0 ? 'Mục tiêu' : 'Dự kiến đạt'}</span><b>${c.dir === 0 ? 'Giữ cân' : c.eta ? fullDate(c.eta) : '—'}</b></div></div></div>`;
    html += coachHtml(P, 12);
    const safety = P.rules.filter(r => r.cat === 'safety');
    html += `<div class="card"><h2>🔍 Phân tích</h2>${safety.map(r => `<div class="warnbox">⚠️ ${r.text}</div>`).join('')}
      <div style="margin-top:${safety.length ? 10 : 0}px">${ruleList(P.rules, 'insight')}</div></div>`;
  }

  if (planSub === 'rules') {
    html += `<div class="card"><h2>📌 Quy tắc tập luyện</h2>${ruleList(P.rules, 'train')}</div>`;
    html += `<div class="card"><h2>📏 Theo dõi & điều chỉnh</h2>${ruleList(P.rules, 'check')}</div>`;
  }
  html += '<div class="small muted" style="margin:4px 4px 0">Kế hoạch được lập theo các nguyên tắc tập luyện và dinh dưỡng phổ biến, chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hay huấn luyện viên.</div>';
  $('#planBody').innerHTML = html;
}

/* =====================================================================
   DINH DƯỠNG
   ===================================================================== */
let foodCat = '';
const foodLists = {res: [], good: [], limit: []};

function foodRow(x, i, list) {
  const badge = x.flag ? `<div><span class="flag ${x.flag}">${x.flag === 'good' ? '✅ Nên ăn' : '⚠️ Hạn chế'}${x.why ? ' · ' + esc(x.why) : ''}</span></div>`
    : x.why ? `<div class="fu">${esc(x.why)}</div>` : '';
  return `<li class="food"><div class="fn">${esc(x.n)} <span class="fu">· ${esc(x.unit)}</span>${badge}</div>
    <div class="fk"><b>${fmt(x.kcal)}</b><small>kcal · ${fmt1(x.p)}g đạm</small></div>
    <button class="add" data-act="logFood" data-list="${list}" data-i="${i}" aria-label="Ghi ${esc(x.n)} vào nhật ký">+</button>
    ${x.alt ? `<div class="fx">💡 ${x.flag === 'limit' ? 'Thay bằng: ' : 'Mẹo: '}${esc(x.alt)}</div>` : ''}</li>`;
}

function renderFoodResults() {
  const q = $('#foodQ').value.trim();
  $('#foodCats').innerHTML = [['', 'Tất cả'], ...(state.customFoods.length ? [['mine', '⭐ Món của tôi']] : []), ...BRAIN.FOOD_CATS.map(x => [x.id, x.name])]
    .map(([id, n]) => `<button class="${foodCat === id ? 'on' : ''}" data-act="foodCat" data-v="${id}">${n}</button>`).join('');
  const all = ENGINE.searchFood(q, foodCat || null, state.customFoods);
  foodLists.res = all.slice(0, 40);
  $('#foodResults').innerHTML = !all.length ? `<li class="muted small" style="padding:8px 0">Không tìm thấy "${esc(q)}". Bạn có thể tự nhập món ở phần Nhật ký ăn bên dưới.</li>`
    : foodLists.res.map((x, i) => foodRow(x, i, 'res')).join('') + (all.length > 40 ? `<li class="muted small" style="padding:8px 0">Còn ${all.length - 40} món nữa, gõ thêm để lọc.</li>` : '');
}

function renderFood() {
  const P = getPlan(sel), c = P.ctx, wi = weekIdx(sel), t = totals(sel), day = dayData(sel);
  const dayTarget = c.dayTargets[wi] + r0(t.extra * EXTRA_CREDIT);
  const trainT = P.week.filter(d => d.kind !== 'rest').map(d => c.dayTargets[d.day]);
  const restT = P.week.filter(d => d.kind === 'rest').map(d => c.dayTargets[d.day]);
  const avgArr = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  $('#foodTarget').innerHTML = `<h2>🎯 Mục tiêu dinh dưỡng</h2><div class="tiles3">
      <div class="tile"><span class="small muted">Calo trung bình</span><b>${fmt(c.target)}</b></div>
      <div class="tile"><span class="small muted">Ngày tập / nghỉ</span><b>${fmt(avgArr(trainT))} / ${fmt(avgArr(restT))}</b></div>
      <div class="tile"><span class="small muted">Đạm / ngày</span><b>${c.protein}g</b></div>
      <div class="tile"><span class="small muted">Tinh bột / béo</span><b>${c.carb} / ${c.fat}g</b></div>
      <div class="tile"><span class="small muted">Nước</span><b>${fmt1(c.water)} lít</b></div>
      <div class="tile"><span class="small muted">Mỗi bữa chính</span><b>~${c.perMealP}g đạm</b></div></div>
    <div class="daybar"><div class="row between small" style="font-weight:700"><span>${sel === today() ? 'Hôm nay' : fmtDate(sel)}: ${fmt(t.kcal)} / ${fmt(dayTarget)} kcal</span><span class="muted">${r0(t.p)} / ${c.protein}g đạm</span></div>
      ${bar(t.kcal, dayTarget, t.kcal > dayTarget ? 'var(--bad)' : 'var(--grad)')}<div style="height:6px"></div>${bar(t.p, c.protein, 'var(--p)')}</div>`;

  const p = state.profile, ad = ENGINE.adaptive(state, p, c.tdee - (p.tdeeAdjust || 0));
  $('#adaptiveCard').innerHTML = !ad ? '' : (() => {
    const big = Math.abs(ad.offset) >= 100;
    return `<div class="card"><h2>📊 Hiệu chỉnh theo dữ liệu thực tế</h2>
      <div>Trong ${ad.days} ngày có ghi chép: bạn ăn trung bình <b>${fmt(ad.avg)} kcal</b> và cân thay đổi <b>${ad.perWeek > 0 ? '+' : ''}${fmt1(ad.perWeek)} kg/tuần</b>.
      Mức tiêu hao thực tế khoảng <b>${fmt(ad.real)} kcal</b>, ${big ? `chênh <b>${ad.offset > 0 ? '+' : ''}${fmt(ad.offset)} kcal</b> so với công thức.` : 'khớp với công thức 👍'}</div>
      ${big || p.tdeeAdjust ? `<div class="row" style="margin-top:10px">${big ? `<button class="btn btn-primary" data-act="applyAdaptive" data-v="${ad.offset}">Áp dụng hiệu chỉnh</button>` : ''}
      ${p.tdeeAdjust ? '<button class="btn btn-ghost" data-act="applyAdaptive" data-v="0">Bỏ hiệu chỉnh</button>' : ''}</div>` : ''}</div>`;
  })();

  renderFoodResults();
  const adv = ENGINE.foodAdvice(p, c);
  foodLists.good = adv.good.slice(0, 14);
  foodLists.limit = adv.limit.slice(0, 12);
  $('#goodNote').textContent = c.dir > 0 ? 'Giàu đạm và năng lượng, hợp để tăng cân sạch.' : 'Giàu đạm, ít calo: no lâu và giữ cơ khi giảm mỡ.';
  $('#foodGood').innerHTML = foodLists.good.map((x, i) => foodRow(x, i, 'good')).join('');
  $('#foodLimit').innerHTML = foodLists.limit.map((x, i) => foodRow(x, i, 'limit')).join('');

  $('#logDateLbl').textContent = sel === today() ? 'Hôm nay' : fmtDate(sel);
  const groups = Object.entries(MEALS).map(([k, label]) => {
    const items = day.meals.filter(m => m.meal === k);
    if (!items.length) return '';
    return `<h3>${label} · ${fmt(items.reduce((a, m) => a + m.kcal, 0))} kcal</h3><ul class="list">${items.map(m => `
      <li><div class="name">${esc(m.name)}${m.qty !== 1 ? ` <span class="muted">×${m.qty}</span>` : ''}
        <div class="small muted">Đạm ${fmt1(m.p)}g · Tinh bột ${fmt1(m.c)}g · Béo ${fmt1(m.f)}g</div></div>
        <span class="kc">${fmt(m.kcal)}</span><button class="icon-x" data-act="delMeal" data-id="${m.id}" aria-label="Xóa">✕</button></li>`).join('')}</ul>`;
  }).join('');
  $('#mealList').innerHTML = groups || '<div class="muted small">Chưa ghi món nào. Tra món ở trên rồi bấm <b>+</b> để ghi.</div>';

  const sec = (title, cat) => { const h = ruleList(P.rules, cat); return h ? `<details class="card"><summary><b>${title}</b></summary><div style="margin-top:8px">${h}</div></details>` : ''; };
  $('#foodRules').innerHTML = sec('🍽 Quy tắc ăn uống', 'eat') + sec('🔁 Sửa thói quen', 'habit') +
    sec(p.cook === 'self' ? '🍳 Mẹo nấu ăn' : '🥡 Ăn ngoài thông minh', 'out') + sec('😋 Món khoái khẩu', 'fav');
}

// Ghi món vào bữa tương ứng với giờ hiện tại
function mealByHour() { const h = new Date().getHours(); return h < 10 ? 'sang' : h < 14 ? 'trua' : h < 17 ? 'phu' : 'toi'; }

/* =====================================================================
   TIẾN ĐỘ
   ===================================================================== */
const RPE_ICON = {easy: '😌', ok: '💪', hard: '🥵'};
function allSessions() {
  const out = [];
  for (const [d, x] of Object.entries(state.days)) (x.ex || []).filter(e => e.planned).forEach(e => out.push({d, ...e}));
  return out.sort((a, b) => a.d < b.d ? 1 : -1);
}
function bestSet(id, hist) {
  const e = ENGINE.exerciseById(id); if (!e) return null;
  const ex = {weighted: e.equip.some(q => ['db', 'barbell', 'cable', 'machine'].includes(q)), time: e.time};
  let best = null;
  for (const h of hist) for (const s of h.s) { const sc = ENGINE.setScore(ex, s); if (!best || sc > best.sc) best = {sc, s, d: h.d}; }
  if (!best) return null;
  const txt = ex.weighted && best.s[0] > 0 ? `${ENGINE.fmtKg(best.s[0])} kg × ${best.s[1]}` : ex.time ? `${best.s[1]} giây` : `${best.s[1]} lần`;
  return {name: e.name, txt, d: best.d, n: hist.length, last: hist[hist.length - 1].d};
}

function renderProgress() {
  const ss = allSessions(), P = getPlan(today(), true), log = P.ctx.log || {};
  const prsTotal = ss.reduce((a, x) => a + (x.prs || 0), 0);
  $('#trainStats').innerHTML = `
    <div class="tile"><span class="small muted">Tuần này</span><b>${log.done || 0}/${log.plannedWeek || 0} buổi</b></div>
    <div class="tile"><span class="small muted">Tổng số buổi</span><b>${ss.length}</b></div>
    <div class="tile"><span class="small muted">Tổng thời gian</span><b>${fmt(ss.reduce((a, x) => a + (x.min || 0), 0))}′</b></div>
    <div class="tile"><span class="small muted">Đã nâng</span><b>${fmt(ss.reduce((a, x) => a + (x.volume || 0), 0))} kg</b></div>
    <div class="tile"><span class="small muted">Kỷ lục đã phá</span><b>🏆 ${prsTotal}</b></div>
    <div class="tile"><span class="small muted">Chuỗi ghi chép</span><b>🔥 ${log.streak || 0} ngày</b></div>`;
  $('#sessList').innerHTML = ss.length ? ss.slice(0, 30).map(x => {
    const dt = parseDs(x.d);
    return `<div class="sess"><div class="sd"><b>${dt.getDate()}</b><small>Th${dt.getMonth() + 1}</small></div>
      <div><div class="st">${esc(x.name.replace(/^Buổi tập: /, ''))} ${x.rpe ? RPE_ICON[x.rpe] : ''}</div>
      <div class="sm">${DAYS[weekIdx(x.d)]} · ${x.min} phút${x.sets ? ` · ${x.sets} hiệp` : ''}${x.volume ? ` · ${fmt(x.volume)} kg` : ''}${x.prs ? ` · 🏆 ${x.prs} kỷ lục` : ''}</div></div>
      <button class="icon-x" data-act="delSession" data-d="${x.d}" data-id="${x.id}" aria-label="Xóa buổi tập">✕</button></div>`;
  }).join('') : '<div class="muted small">Chưa có buổi tập nào. Bấm <b>▶ Bắt đầu tập</b> ở tab Hôm nay nhé!</div>';
  const prs = Object.entries(state.lifts || {}).map(([id, h]) => bestSet(id, h)).filter(Boolean).sort((a, b) => a.last < b.last ? 1 : -1);
  $('#prList').innerHTML = prs.length ? prs.slice(0, 30).map(x => `<div class="pr"><div><div style="font-weight:700">${esc(x.name)}</div>
      <div class="small muted">${x.n} buổi · đạt ngày ${fmtDate(x.d, {day: '2-digit', month: '2-digit'})}</div></div><b>${x.txt}</b></div>`).join('')
    : '<div class="muted small">Chưa có dữ liệu. Khi tập, ghi số kg và số lần mỗi hiệp để app lưu kỷ lục.</div>';
  renderWeight();
}

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
  $('#wList').innerHTML = ws.length ? ws.slice(0, 40).map((e, i) => {
    const prev = ws[i + 1], d = prev ? r1(e.w - prev.w) : null;
    return `<li><div class="name">${fmtDate(e.d, {weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'})}</div>
      ${d != null ? `<span class="small num ${d < 0 ? 'good' : d > 0 ? 'over' : 'muted'}">${d > 0 ? '+' : ''}${fmt1(d)}</span>` : ''}
      <span class="kc">${fmt1(e.w)} kg</span><button class="icon-x" data-act="delWeight" data-d="${e.d}" aria-label="Xóa">✕</button></li>`;
  }).join('') : '<li class="muted small">Chưa có.</li>';
}

/* =====================================================================
   CÀI ĐẶT
   ===================================================================== */
function renderSettings() {
  const p = state.profile, st = settings();
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
    ['Ăn uống', `${optLabel('meals', p.meals)} · ${optLabel('diet', p.diet).toLowerCase()} · ${clean(optLabel('cook', p.cook)).toLowerCase()}`],
    ['Không ăn', many('avoid', p.avoid)],
    ['Chu kỳ hiện tại', `bắt đầu ${fullDate(p.startDate)} từ ${fmt1(p.startWeight)} kg`]
  ];
  $('#profileSummary').innerHTML = `<ul class="list">${rows.map(([k, v]) => `<li><span class="muted small" style="min-width:110px;font-weight:700">${k}</span><span class="name">${esc(v)}</span></li>`).join('')}</ul>`;

  const noVi = AUDIO.voice.supported() && !AUDIO.voice.hasVietnamese();
  $('#soundCard').innerHTML = `<h2>🎧 Âm thanh khi tập</h2>
    <label class="switch">🗣️ Giọng HLV đọc hướng dẫn <input type="checkbox" id="setVoice" ${st.voice ? 'checked' : ''}></label>
    ${!AUDIO.voice.supported() ? '<div class="small muted">Trình duyệt này không hỗ trợ đọc giọng nói.</div>'
      : noVi ? '<div class="small muted">Chưa thấy giọng tiếng Việt trên máy. Trên iPhone: Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt để tải về.</div>' : ''}
    <div class="grid2" style="margin-top:8px">
      <label>Nhạc khi tập <select id="setMusic">${Object.entries(AUDIO.STYLES).map(([v, x]) => `<option value="${v}" ${st.music === v ? 'selected' : ''}>${x.name}</option>`).join('')}
        <option value="own" ${st.music === 'own' ? 'selected' : ''}>🎧 Nhạc của tôi (Spotify, Apple Music…)</option><option value="off" ${st.music === 'off' ? 'selected' : ''}>🔇 Không nhạc</option></select></label>
      <label>Âm lượng nhạc <input type="range" id="setVol" min="0" max="1" step="0.05" value="${st.volume}"></label>
    </div>
    <label style="margin-top:8px">Link playlist của bạn (không bắt buộc) <input id="setPlaylist" type="url" inputmode="url" placeholder="https://open.spotify.com/playlist/…" value="${esc(st.playlist)}"></label>
    <div class="row" style="margin-top:10px"><button class="btn btn-ghost btn-sm" data-act="testMusic">${AUDIO.music.isPlaying() ? '⏹ Dừng nhạc' : '▶ Nghe thử nhạc'}</button>
      <button class="btn btn-ghost btn-sm" data-act="testVoice">🗣️ Thử giọng HLV</button></div>
    <div class="small muted" style="margin-top:8px">Nhạc do app tự tạo nên không cần mạng và không vướng bản quyền; nhịp tự nhanh hơn khi tập và chậm lại khi nghỉ. Không nghe tiếng trên iPhone? Kiểm tra nút gạt im lặng và âm lượng.</div>`;

  $('#brainCard').innerHTML = `<h2>🧠 Bộ não HLV</h2><div class="tiles3">
    <div class="tile"><span class="small muted">Bài tập</span><b>${BRAIN.EXERCISES.length}</b></div>
    <div class="tile"><span class="small muted">Món ăn</span><b>${BRAIN.FOOD_DB.length}</b></div>
    <div class="tile"><span class="small muted">Quy tắc</span><b>${BRAIN.RULES.length}</b></div></div>
    <div class="small muted" style="margin-top:10px">Toàn bộ kiến thức nằm trong thư mục <b>brain/</b>. Có thể tự thêm bài tập, món ăn hay quy tắc mới (hướng dẫn trong README.md).</div>`;
  $('#customList').innerHTML = state.customFoods.length ? state.customFoods.map(f => `
    <li><div class="name">${esc(f.name)} <span class="muted small">(${esc(f.unit)})</span></div>
    <span class="kc">${fmt(f.kcal)} kcal</span><button class="icon-x" data-act="delFood" data-id="${f.id}" aria-label="Xóa">✕</button></li>`).join('')
    : '<li class="muted small">Chưa có. Khi tự nhập món, tick "Lưu vào món của tôi" để dùng lại lần sau.</li>';
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
  $('#foodList').innerHTML = allFoods().map(f => `<option value="${esc(f.n)}">${esc(f.unit)} · ${f.kcal} kcal${f.mine ? ' · của tôi' : ''}</option>`).join('');
}
function fillFoodFields(qty) {
  if (!foodBase) return;
  const f = foodBase;
  $('#fKcal').value = r0(f.kcal * qty); $('#fP').value = r1(f.p * qty); $('#fC').value = r1(f.c * qty); $('#fF').value = r1(f.f * qty);
  $('#fUnit').textContent = `1 phần = ${f.unit} · ${f.kcal} kcal (giá trị ước tính, có thể sửa)`;
}
function addMeal() {
  const name = $('#fName').value.trim(), qty = num($('#fQty').value, 1) || 1;
  const m = {id: uid(), meal: $('#fMeal').value, name, qty, kcal: num($('#fKcal').value), p: num($('#fP').value), c: num($('#fC').value), f: num($('#fF').value)};
  if (!name || m.kcal <= 0) { toast('Nhập tên món và số calo'); return; }
  getDay(sel).meals.push(m);
  if ($('#fSave').checked && !allFoods().some(f => f.n.toLowerCase() === name.toLowerCase())) {
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
   ĐIỀU HƯỚNG & SỰ KIỆN
   ===================================================================== */
const TABS = ['today', 'plan', 'food', 'progress', 'settings'];
function showTab(name) {
  if (!TABS.includes(name)) name = 'today';
  $$('.tab').forEach(t => t.classList.toggle('on', t.id === 'tab-' + name));
  $$('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  try { localStorage.setItem(KEY + '.tab', name); } catch (e) {}
  window.scrollTo(0, 0);
}
function renderAll() {
  if (!state.profile) return;
  renderToday(); renderPlan(); renderFood(); renderProgress(); renderSettings(); renderBadges();
}

let musicTestT = null;
document.addEventListener('click', ev => {
  const tabBtn = ev.target.closest('nav.tabs [data-tab]');
  if (tabBtn) { showTab(tabBtn.dataset.tab); return; }
  const subBtn = ev.target.closest('#tab-plan .seg [data-sub]');
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
  else if (a === 'prev') { sel = addDays(sel, -1); renderToday(); renderFood(); }
  else if (a === 'next') { sel = addDays(sel, 1); renderToday(); renderFood(); }
  else if (a === 'pickDay') { sel = el.dataset.d; renderToday(); renderFood(); }
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
  else if (a === 'openPlan') { planSub = el.dataset.sub || 'week'; renderPlan(); showTab('plan'); }
  else if (a === 'openFood') { renderFood(); showTab('food'); }
  else if (a === 'foodCat') { foodCat = el.dataset.v; renderFoodResults(); }
  else if (a === 'logFood') {
    const x = foodLists[el.dataset.list][+el.dataset.i]; if (!x) return;
    const meal = mealByHour();
    getDay(sel).meals.push({id: uid(), meal, name: x.n, qty: 1, kcal: x.kcal, p: x.p, c: x.c, f: x.f});
    save(); renderToday(); renderFood(); toast(`Đã ghi ${x.n} vào ${MEALS[meal].toLowerCase()}`);
  }
  else if (a === 'applyAdaptive') { state.profile.tdeeAdjust = +el.dataset.v; save(); renderAll(); toast('Đã cập nhật calo mục tiêu'); }
  else if (a === 'addMeal') addMeal();
  else if (a === 'addEx') addEx();
  else if (a === 'delMeal') { const d = getDay(sel); d.meals = d.meals.filter(m => m.id !== el.dataset.id); save(); renderAll(); }
  else if (a === 'delEx') { const d = getDay(sel); d.ex = d.ex.filter(m => m.id !== el.dataset.id); save(); renderAll(); }
  else if (a === 'delSession') {
    if (!confirm('Xóa buổi tập này khỏi lịch sử?')) return;
    const d = getDay(el.dataset.d); d.ex = d.ex.filter(m => m.id !== el.dataset.id); save(); renderAll();
  }
  else if (a === 'delWeight') { if (confirm('Xóa lần cân này?')) { delete state.weights[el.dataset.d]; save(); renderAll(); } }
  else if (a === 'delFood') { state.customFoods = state.customFoods.filter(f => f.id !== el.dataset.id); save(); renderFoodList(); renderSettings(); renderFoodResults(); }
  else if (a === 'editProfile') openWizard(true);
  else if (a === 'testMusic') {
    clearTimeout(musicTestT);
    if (AUDIO.music.isPlaying()) AUDIO.music.stop();
    else {
      const st = settings().music;
      AUDIO.music.setVolume(settings().volume); AUDIO.music.setMode('work'); AUDIO.music.play(AUDIO.STYLES[st] ? st : 'edm');
      musicTestT = setTimeout(() => { AUDIO.music.stop(); renderSettings(); }, 12000);
    }
    renderSettings();
  }
  else if (a === 'testVoice') { AUDIO.ensure(); AUDIO.voice.setOn(true); AUDIO.voice.say('Bài 1: Goblet squat. Hiệp 1 trên 3. 10 đến 12 lần.'); AUDIO.voice.setOn(settings().voice); }
  else if (a === 'export') exportData();
  else if (a === 'import') $('#importFile').click();
  else if (a === 'reset') {
    if (confirm('Xóa toàn bộ dữ liệu? Không thể hoàn tác. Hãy xuất file sao lưu trước nếu cần.')) { state = blank(); save(); openWizard(false); }
  }
});

// Cài đặt âm thanh
$('#soundCard').addEventListener('change', ev => {
  const st = settings(), id = ev.target.id;
  if (id === 'setVoice') { st.voice = ev.target.checked; AUDIO.voice.setOn(st.voice); }
  else if (id === 'setMusic') st.music = ev.target.value;
  else if (id === 'setPlaylist') st.playlist = /^https?:\/\//i.test(ev.target.value.trim()) ? ev.target.value.trim() : '';
  else return;
  save();
});
$('#soundCard').addEventListener('input', ev => {
  if (ev.target.id !== 'setVol') return;
  settings().volume = +ev.target.value; AUDIO.music.setVolume(+ev.target.value); save();
});

$('#foodQ').addEventListener('input', renderFoodResults);
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
  foodBase = allFoods().find(f => f.n.toLowerCase() === v) || null;
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
AUDIO.voice.setOn(settings().voice);
renderInstallCard();
$('#eType').innerHTML = EX_TYPES.map(([n, m]) => `<option value="${m}">${n}</option>`).join('');
renderFoodList();
if (!isComplete(state.profile)) openWizard(!!state.profile);
else {
  $('#app').classList.remove('hidden');
  renderAll();
  let t = 'today';
  try { t = localStorage.getItem(KEY + '.tab') || 'today'; } catch (e) {}
  showTab({weight: 'progress', history: 'progress'}[t] || t);
}
