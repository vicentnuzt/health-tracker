/* =====================================================================
   CHẾ ĐỘ TẬP
   Chuẩn bị → Khởi động → (Tập hiệp ↔ Nghỉ) × n → Thả lỏng → Tổng kết
   - Ghi kg × số lần mỗi hiệp, gợi ý mức tạ theo buổi trước, phát hiện kỷ lục
   - Nhạc đổi nhịp theo giai đoạn, giọng HLV đọc tiếng Việt, đếm ngược 3-2-1
   Dùng các hàm chung trong app.js (state, save, getDay, getPlan, toast…)
   ===================================================================== */
let PL = null, plTick = null, wakeLock = null;

const READY = [['tired', '😴 Hơi mệt', 'Bớt 1 hiệp mỗi bài'], ['ok', '🙂 Bình thường', 'Tập đúng kế hoạch'], ['great', '🔥 Sung sức', 'Cố thêm 1–2 lần hiệp cuối']];
const RPE = [['easy', '😌 Nhẹ nhàng'], ['ok', '💪 Vừa sức'], ['hard', '🥵 Rất nặng']];
const fmtKg = n => ENGINE.fmtKg(n || 0);

async function requestWake() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} }
function releaseWake() { try { if (wakeLock) wakeLock.release(); } catch (e) {} wakeLock = null; }
document.addEventListener('visibilitychange', () => { if (PL && document.visibilityState === 'visible') requestWake(); });

function prepEx(e) {
  const hist = (state.lifts || {})[e.id] || [];
  const sugg = ENGINE.suggest(e, hist);
  // Lần đầu tập bài có tạ: mức khởi điểm theo dụng cụ (người dùng chỉnh lại bằng nút +/−)
  const ids = e.equipIds || [];
  const startKg = !e.weighted ? 0 : ids.includes('barbell') || ids.includes('machine') ? 20 : ids.includes('cable') ? 10 : 5;
  const lastKg = hist.length ? Math.max(...hist[hist.length - 1].s.map(x => x[0])) : startKg;
  return {...e, hist, sugg, done: [], cur: {kg: sugg.kg != null ? sugg.kg : lastKg, reps: e.time ? e.holdSec : sugg.reps}};
}

function openPlayer(s, logDate) {
  AUDIO.ensure();
  const list = s.kind === 'strength' ? s.exercises.map(prepEx) : [];
  PL = {s, logDate, kind: s.kind === 'strength' ? 'strength' : 'timer', step: 'ready', i: 0, list, readiness: 'ok',
    started: 0, ended: 0, phaseEnd: 0, phaseTotal: 0, restEnd: 0, restTotal: 0, restBeeps: {}, holdStart: 0, holdBeeps: {},
    run: false, acc: 0, runFrom: 0, lastBlock: -1, alerted: {}, rpe: null, guide: false, panel: false, prs: [], musicOff: false};
  $('#player').classList.remove('hidden');
  document.body.classList.add('noscroll');
  requestWake();
  renderPlayer();
  clearInterval(plTick);
  plTick = setInterval(tickPlayer, 250);
}
function closePlayer() {
  clearInterval(plTick); plTick = null; PL = null;
  AUDIO.music.stop(); AUDIO.voice.setOn(false); AUDIO.voice.setOn(settings().voice);
  $('#player').classList.add('hidden'); $('#player').innerHTML = '';
  document.body.classList.remove('noscroll');
  releaseWake();
}

/* ---------------- Âm thanh theo giai đoạn ---------------- */
function startMusic() {
  const st = settings().music;
  if (AUDIO.STYLES[st] && !PL.musicOff) { AUDIO.music.setVolume(settings().volume); AUDIO.music.play(st); }
  else AUDIO.setSession('ambient'); // để nhạc từ Spotify / Apple Music vẫn phát cùng
}
const musicMode = m => AUDIO.music.setMode(m);
const say = (t, interrupt = true) => AUDIO.voice.say(t, interrupt);

function announceSet() {
  const e = PL.list[PL.i], n = e.done.length + 1;
  const target = e.time ? `giữ ${e.cur.reps} giây` : `${e.cur.reps} lần${e.weighted && e.cur.kg ? `, ${fmtKg(e.cur.kg)} ký` : ''}`;
  say(n === 1 ? `Bài ${PL.i + 1}: ${e.name}. Hiệp 1 trên ${e.setsN}. ${target}.` : `Hiệp ${n}. ${target}.`);
}

/* ---------------- Chuyển bước ---------------- */
function startPhase(sec) { PL.phaseTotal = sec * 1000; PL.phaseEnd = Date.now() + sec * 1000; PL.alerted = {}; }
function goWarmup() {
  PL.started = Date.now();
  startMusic();
  if (PL.kind === 'timer') { goWork(); return; }
  PL.step = 'warmup'; musicMode('warmup');
  startPhase(+PL.s.minutes <= 30 ? 180 : 300);
  say(`Bắt đầu buổi tập ${PL.s.title}. Khởi động trước nhé.`);
}
function goWork() {
  PL.step = 'work'; PL.holdStart = 0; PL.holdBeeps = {};
  if (PL.kind === 'strength') { musicMode('work'); announceSet(); }
  else {
    PL.run = true; PL.runFrom = Date.now(); PL.acc = 0; PL.lastBlock = -1; PL.alerted = {};
    musicMode(PL.s.interval ? 'warmup' : 'cardio');
    say(PL.s.interval ? `Bắt đầu ${PL.s.title}. Khởi động 5 phút trước.` : `Bắt đầu ${PL.s.title}. Giữ nhịp tim từ ${PL.s.zone.lo} đến ${PL.s.zone.hi}.`);
  }
}
function startRest(sec, nextEx) {
  PL.step = 'rest'; PL.restTotal = sec * 1000; PL.restEnd = Date.now() + sec * 1000; PL.restBeeps = {}; PL.holdStart = 0;
  musicMode('rest');
  const nx = PL.list[PL.i];
  say(nextEx ? `Tốt lắm. Nghỉ ${sec} giây. Bài tiếp theo: ${nx.name}.` : `Nghỉ ${sec} giây.`);
}
function goCooldown() {
  PL.ended = Date.now(); PL.step = 'cooldown'; musicMode('cool');
  startPhase(180);
  say('Xong phần tập chính. Thả lỏng và giãn cơ nhé.');
}
function goDone() { PL.step = 'done'; musicMode('cool'); if (!PL.ended) PL.ended = Date.now(); say('Hoàn thành buổi tập. Bạn làm tốt lắm!'); }

function nextExercise() {
  if (PL.i < PL.list.length - 1) { PL.i++; return true; }
  return false;
}

/* ---------------- Tính toán tổng kết ---------------- */
const timerElapsed = () => PL.acc + (PL.run ? Date.now() - PL.runFrom : 0);
const totalSets = () => PL.list.reduce((a, e) => a + e.setsN, 0);
const doneSets = () => PL.list.reduce((a, e) => a + e.done.length, 0);
const volume = () => PL.list.reduce((a, e) => a + (e.weighted ? e.done.reduce((s, x) => s + x[0] * x[1], 0) : 0), 0);
const sessionMinutes = () => Math.max(1, r0(((PL.ended || Date.now()) - PL.started) / 60000));
const sessionKcal = min => r0((PL.kind === 'strength' ? BRAIN.STRENGTH_MET : (PL.s.met || 4) * (PL.s.interval ? 1.15 : 1)) * weightOn(PL.logDate) * min / 60);

// Cardio biến tốc: khởi động → (nhanh, chậm) × n → thả lỏng
function intervalBlock(sec, iv) {
  const blocks = [{label: 'Khởi động', len: iv.warm, mode: 'warmup'}];
  for (let r = 1; r <= iv.rounds; r++) {
    blocks.push({label: `🔥 NHANH · lượt ${r}/${iv.rounds}`, len: iv.on, fast: true, mode: 'fast', say: r === 1 ? 'Tăng tốc! Một phút nhanh.' : 'Tăng tốc!'});
    blocks.push({label: `Chậm · lượt ${r}/${iv.rounds}`, len: iv.off, mode: 'cardio', say: 'Chậm lại, thở đều.'});
  }
  blocks.push({label: 'Thả lỏng', len: iv.cool, mode: 'cool', say: 'Hết phần biến tốc. Thả lỏng 5 phút.'});
  let t = 0;
  for (let i = 0; i < blocks.length; i++) {
    if (sec < t + blocks[i].len) return {...blocks[i], idx: i, left: t + blocks[i].len - sec};
    t += blocks[i].len;
  }
  return {label: 'Xong! 🎉', idx: blocks.length, left: 0, mode: 'cool', say: 'Hoàn thành phần chạy.'};
}

/* ---------------- Giao diện ---------------- */
function stepper(act, val, unit, small) {
  return `<div class="stepper"><button data-act="${act}" data-d="-1" aria-label="Giảm">−</button>
    <div><b id="${act}Val">${val}</b><span>${unit}</span></div><button data-act="${act}" data-d="1" aria-label="Tăng">+</button>${small ? `<small>${small}</small>` : ''}</div>`;
}
function guideHtml(e) {
  const g = BRAIN.SLOT_GUIDE[e.slot] || {};
  return `<div class="pl-guide"><div>✅ ${esc(e.cue)}</div>${g.breath ? `<div>🌬️ ${esc(g.breath)}</div>` : ''}
    ${g.mistakes ? `<div>⚠️ Tránh: ${g.mistakes.map(esc).join(' · ')}</div>` : ''}
    <a href="${ytLink(e.name)}" target="_blank" rel="noopener">▶ Xem video hướng dẫn trên YouTube</a></div>`;
}
function dotsHtml(e) {
  return `<div class="pl-dots">${Array.from({length: e.setsN}, (_, k) => `<i class="${k < e.done.length ? 'ok' : k === e.done.length ? 'now' : ''}"></i>`).join('')}</div>`;
}
const chip = (act, v, label, on, small) => `<button class="pl-opt ${on ? 'on' : ''}" data-act="${act}" data-v="${v}">${label}${small ? `<small>${small}</small>` : ''}</button>`;

function renderPlayer() {
  if (!PL) return;
  const s = PL.s, st = settings();
  const musicOn = AUDIO.music.isPlaying();
  const prog = PL.kind === 'strength' ? (totalSets() ? doneSets() / totalSets() : 0) : Math.min(1, timerElapsed() / (s.minutes * 60000));
  const label = {ready: 'Chuẩn bị', warmup: 'Khởi động', cooldown: 'Thả lỏng', done: 'Tổng kết', rest: 'Nghỉ'}[PL.step]
    || (PL.kind === 'strength' ? `Bài ${PL.i + 1}/${PL.list.length}` : 'Đang tập');
  let body = '', actions = '';

  if (PL.step === 'ready') {
    const own = st.music === 'own';
    body = `<div class="display pl-name">${esc(s.title)}</div>
      <div class="pl-info">⏱ ${s.minutes} phút${s.kind === 'strength' ? ` · 💪 ${s.exercises.length} bài` : ''} · 🔥 ~${fmt(s.kcal)} kcal</div>
      <h4>Hôm nay bạn thấy thế nào?</h4><div class="pl-opts">${READY.map(([v, l, d]) => chip('plReady', v, l, PL.readiness === v, d)).join('')}</div>
      <h4>Nhạc khi tập</h4><div class="pl-opts">${Object.entries(AUDIO.STYLES).map(([v, x]) => chip('plStyle', v, x.name, st.music === v)).join('')}
        ${chip('plStyle', 'own', '🎧 Nhạc của tôi', own)}${chip('plStyle', 'off', '🔇 Không nhạc', st.music === 'off')}</div>
      ${own ? (st.playlist ? `<a class="btn btn-ghost pl-wide" href="${esc(st.playlist)}" target="_blank" rel="noopener">🎵 Mở playlist của bạn</a>`
        : '<div class="pl-cue">Mở Spotify / Apple Music phát nhạc trước rồi quay lại app. Có thể lưu link playlist ở Cài đặt.</div>') : ''}
      <div class="pl-opts">${chip('plVoice', '', `${st.voice ? '🗣️ Giọng HLV: bật' : '🔇 Giọng HLV: tắt'}`, st.voice)}</div>
      ${s.kind === 'strength' ? `<h4>Các bài hôm nay</h4><ol class="pl-list num">${PL.list.map(e => `<li><b>${esc(e.name)}</b> · ${e.setsN} × ${esc(e.reps)}
        ${e.sugg.last ? `<small>Lần trước: ${esc(e.sugg.last)}</small>` : ''}</li>`).join('')}</ol>`
        : `<ul class="pl-list">${(s.items || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`}`;
    actions = '<button class="btn btn-primary btn-lg" data-act="plStart">▶ Bắt đầu</button>';
  }

  else if (PL.step === 'warmup' || PL.step === 'cooldown') {
    const items = PL.step === 'warmup' ? s.warmup : s.cooldown;
    body = `<div class="display pl-name">${PL.step === 'warmup' ? 'Khởi động' : 'Thả lỏng'}</div>
      <div class="center"><div class="pl-count" id="plPhase">0:00</div><div class="pl-sub">${PL.step === 'warmup' ? 'Làm chậm để cơ thể ấm lên' : 'Giãn cơ, thở chậm'}</div></div>
      <ul class="pl-list">${(items || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    actions = PL.step === 'warmup' ? '<button class="btn btn-primary btn-lg" data-act="plGo">Vào bài tập ›</button>'
      : '<button class="btn btn-primary btn-lg" data-act="plFinishCool">Hoàn thành ›</button>';
  }

  else if (PL.step === 'work' && PL.kind === 'strength') {
    const e = PL.list[PL.i], n = e.done.length + 1;
    const holdUI = e.time ? `<div class="pl-hold" id="plHold">${PL.holdStart ? '' : `Mục tiêu ${mmss(e.cur.reps)}`}</div>` : '';
    body = `<div class="pl-ex-head"><span class="eyebrow">${esc(e.muscles)}${e.equip ? ` · 🧰 ${esc(e.equip)}` : ''}</span>
        <button class="pl-link" data-act="plGuide">${PL.guide ? 'Ẩn hướng dẫn' : 'ℹ️ Cách tập'}</button></div>
      <div class="display pl-name">${esc(e.name)}</div>
      ${PL.guide ? guideHtml(e) : `<div class="pl-cue">${esc(e.cue)}</div>`}
      <div class="row between" style="flex-wrap:nowrap"><div class="pl-set"><span class="display">Hiệp ${n}</span><span class="pl-target" style="opacity:.6">/ ${e.setsN}</span></div>${dotsHtml(e)}</div>
      ${e.sugg.text ? `<div class="pl-sugg ${e.sugg.up ? 'up' : ''}">${e.sugg.up ? '📈' : '🎯'} ${esc(e.sugg.text)}</div>` : `<div class="pl-sugg">🎯 ${esc(e.reps)}</div>`}
      ${PL.readiness === 'great' && n === e.setsN ? '<div class="pl-sugg up">🔥 Hiệp cuối: cố thêm 1–2 lần nếu còn sức!</div>' : ''}
      <div class="pl-steppers">${e.weighted ? stepper('plKg', fmtKg(e.cur.kg), 'kg', `±${fmtKg(e.step)} kg`) : ''}
        ${e.time ? stepper('plReps', e.cur.reps, 'giây mục tiêu') : stepper('plReps', e.cur.reps, 'lần')}</div>
      ${holdUI}
      ${e.done.length ? `<div class="pl-sub">Đã xong: ${e.done.map(x => e.weighted ? `${fmtKg(x[0])}×${x[1]}` : e.time ? `${x[1]}s` : x[1]).join(' · ')}</div>` : ''}
      <div class="pl-alt">${e.easier ? '<button data-act="plSwap" data-to="easier">↓ Dễ hơn</button>' : ''}${e.harder ? '<button data-act="plSwap" data-to="harder">↑ Khó hơn</button>' : ''}
        <button data-act="plPanel">☰ Danh sách bài</button><button data-act="plSkip">Bỏ qua bài ›</button></div>`;
    actions = (e.time && !PL.holdStart ? '<button class="btn btn-ghost btn-lg" data-act="plHold">⏱ Bấm giờ</button>' : '') + '<button class="btn btn-primary btn-lg" data-act="plSetDone">✓ Xong hiệp</button>';
  }

  else if (PL.step === 'rest') {
    const e = PL.list[PL.i], C = 2 * Math.PI * 104, prev = PL.lastSet;
    body = `<div class="eyebrow center">Nghỉ</div>
      <div class="pl-ring"><svg width="240" height="240" viewBox="0 0 240 240" aria-hidden="true">
        <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0561a"/><stop offset="1" stop-color="#d7265f"/></linearGradient></defs>
        <circle cx="120" cy="120" r="104" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="14"/>
        <circle id="plRestArc" cx="120" cy="120" r="104" fill="none" stroke="url(#pg)" stroke-width="14" stroke-linecap="round" transform="rotate(-90 120 120)" stroke-dasharray="${C} ${C}"/></svg>
        <div class="lbl"><div class="pl-count" id="plRest">0</div><div class="pl-sub">giây</div></div></div>
      ${prev ? `<div class="center pl-sub">Vừa xong: ${esc(prev)}</div>` : ''}
      <div class="center"><div class="eyebrow">Tiếp theo</div><b>${esc(e.name)}</b> · Hiệp ${e.done.length + 1}/${e.setsN}</div>`;
    actions = '<button class="btn btn-ghost btn-lg" data-act="plMore">+15 giây</button><button class="btn btn-primary btn-lg" data-act="plRestSkip">Bỏ qua ›</button>';
  }

  else if (PL.step === 'work') {
    body = `<div class="eyebrow center" id="plBlock">${s.interval ? '' : 'Giữ nhịp đều'}</div>
      <div class="center"><div class="pl-count" id="plTimer">0:00</div><div class="pl-sub" id="plTimerSub"></div></div>
      ${s.zone ? `<div class="center"><span class="pl-chip">❤️ Nhịp tim ${s.zone.lo}–${s.zone.hi}</span></div>` : ''}
      <ul class="pl-list">${(s.items || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    actions = `<button class="btn btn-ghost btn-lg" data-act="plToggle">${PL.run ? '⏸ Tạm dừng' : '▶ Tiếp tục'}</button><button class="btn btn-primary btn-lg" data-act="plFinish">✓ Kết thúc</button>`;
  }

  else if (PL.step === 'done') {
    const min = sessionMinutes(), kcal = sessionKcal(min);
    body = `<div class="center" style="font-size:60px;line-height:1">🎉</div><div class="display pl-name center">Hoàn thành!</div>
      <div class="pl-stats"><div><b>${min}</b>phút</div>
        <div><b>${PL.kind === 'strength' ? doneSets() : mmss(Math.floor(timerElapsed() / 1000))}</b>${PL.kind === 'strength' ? 'hiệp' : 'thời gian'}</div>
        <div><b>${PL.kind === 'strength' && volume() ? fmt(volume()) : fmt(kcal)}</b>${PL.kind === 'strength' && volume() ? 'kg đã nâng' : 'kcal'}</div></div>
      ${PL.prs.length ? `<div class="pl-pr">🏆 Kỷ lục mới: ${PL.prs.map(esc).join(', ')}</div>` : ''}
      <h4>Buổi tập hôm nay thế nào?</h4><div class="pl-opts">${RPE.map(([v, l]) => chip('plRpe', v, l, PL.rpe === v)).join('')}</div>
      <div class="pl-sub">Đánh giá giúp HLV điều chỉnh độ nặng cho các buổi sau.</div>`;
    actions = '<button class="btn btn-ghost" data-act="plDiscard">Không lưu</button><button class="btn btn-primary btn-lg" data-act="plSave">💾 Lưu buổi tập</button>';
  }

  const panel = PL.panel && PL.kind === 'strength' ? `<div class="pl-panel"><div class="row between"><b>Danh sách bài</b><button class="pl-ic" data-act="plPanel">✕</button></div>
    <ol class="pl-list num">${PL.list.map((e, k) => `<li class="${k === PL.i ? 'cur' : ''}" data-act="plJump" data-i="${k}"><b>${esc(e.name)}</b>
      <small>${e.done.length}/${e.setsN} hiệp${e.done.length >= e.setsN ? ' ✓' : ''}</small></li>`).join('')}</ol></div>` : '';

  $('#player').innerHTML = `<div class="pl-top"><div class="row between" style="flex-wrap:nowrap">
      <div style="min-width:0"><div class="eyebrow">${label}</div><b class="pl-title">${s.emoji} ${esc(s.title)}</b></div>
      <div class="row" style="gap:6px;flex-wrap:nowrap">
        ${PL.step !== 'ready' ? `<button class="pl-ic" data-act="plMusic" aria-label="Bật tắt nhạc">${musicOn ? '🎵' : '🔈'}</button>` : ''}
        <button class="pl-ic" data-act="plVoice" aria-label="Bật tắt giọng HLV">${st.voice ? '🗣️' : '🔇'}</button>
        <button class="pl-ic" data-act="plClose" aria-label="Thoát chế độ tập">✕</button></div></div>
      <div class="pl-prog"><i id="plProg" style="width:${prog * 100}%"></i></div>
      ${PL.started ? `<div class="pl-meta"><span id="plElapsed">0:00</span>${PL.kind === 'strength' ? ` · ${doneSets()}/${totalSets()} hiệp` : ''}</div>` : ''}</div>
    <div class="pl-body">${body}</div><div class="pl-actions">${actions}</div>${panel}`;
  tickPlayer();
}

/* ---------------- Đồng hồ (4 lần/giây) ---------------- */
function tickPlayer() {
  if (!PL) return;
  const now = Date.now(), set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  if (PL.started) set('plElapsed', mmss(Math.floor(((PL.ended || now) - PL.started) / 1000)));

  if (PL.step === 'warmup' || PL.step === 'cooldown') {
    const left = Math.max(0, Math.ceil((PL.phaseEnd - now) / 1000));
    set('plPhase', mmss(left));
    if (left === 0 && !PL.alerted.end) { PL.alerted.end = true; AUDIO.beep(2); say(PL.step === 'warmup' ? 'Hết giờ khởi động. Sẵn sàng vào bài.' : 'Xong phần thả lỏng.'); }
  }

  else if (PL.step === 'rest') {
    const leftMs = PL.restEnd - now, left = Math.max(0, Math.ceil(leftMs / 1000));
    set('plRest', left);
    const arc = document.getElementById('plRestArc');
    if (arc) { const C = 2 * Math.PI * 104; arc.setAttribute('stroke-dasharray', `${C * Math.max(0, leftMs / PL.restTotal)} ${C}`); }
    if (left === 10 && PL.restTotal >= 25000 && !PL.restBeeps[10]) { PL.restBeeps[10] = true; say('Còn 10 giây.', false); }
    if (left > 0 && left <= 3 && !PL.restBeeps[left]) { PL.restBeeps[left] = true; AUDIO.beep(1, 660, 0.1); }
    if (leftMs <= 0) { AUDIO.beep(1, 1040, 0.3); goWork(); renderPlayer(); }
  }

  else if (PL.step === 'work' && PL.kind === 'strength' && PL.holdStart) {
    const e = PL.list[PL.i], el = document.getElementById('plHold');
    if (now < PL.holdStart) {
      const c = Math.ceil((PL.holdStart - now) / 1000);
      if (el) { el.textContent = c; el.classList.remove('ok'); }
      if (!PL.holdBeeps[c]) { PL.holdBeeps[c] = true; AUDIO.beep(1, 660, 0.1); }
    } else {
      const sec = Math.floor((now - PL.holdStart) / 1000);
      if (!PL.holdBeeps.go) { PL.holdBeeps.go = true; AUDIO.beep(1, 1040, 0.2); say('Giữ!'); }
      if (el) { el.textContent = mmss(sec); el.classList.toggle('ok', sec >= e.cur.reps); }
      if (sec >= e.cur.reps && !PL.holdBeeps.done) { PL.holdBeeps.done = true; AUDIO.beep(2); say('Đủ rồi, tốt lắm!'); }
    }
  }

  else if (PL.step === 'work' && PL.kind === 'timer') {
    const s = PL.s, sec = Math.floor(timerElapsed() / 1000), target = s.minutes * 60;
    if (s.interval) {
      const b = intervalBlock(sec, s.intervals);
      set('plBlock', b.label); set('plTimer', mmss(b.left)); set('plTimerSub', `Tổng ${mmss(sec)} / ${mmss(target)}`);
      if (b.idx !== PL.lastBlock) {
        if (PL.lastBlock !== -1) { AUDIO.beep(b.fast ? 3 : 1); if (b.say) say(b.say); }
        PL.lastBlock = b.idx; musicMode(b.mode);
      }
      if (b.left <= 3 && b.left > 0 && !PL.alerted[`${b.idx}-${b.left}`]) { PL.alerted[`${b.idx}-${b.left}`] = true; AUDIO.beep(1, 660, 0.08); }
    } else {
      const left = target - sec;
      set('plTimer', mmss(Math.abs(left))); set('plTimerSub', left >= 0 ? 'còn lại' : 'vượt mục tiêu 💪');
      if (left === Math.floor(target / 2) && !PL.alerted.half) { PL.alerted.half = true; say('Đã được một nửa thời gian. Cố lên!'); }
      if (left === 60 && !PL.alerted.min) { PL.alerted.min = true; say('Còn 1 phút.'); }
      if (left <= 0 && !PL.alerted.end) { PL.alerted.end = true; AUDIO.beep(3); say('Đủ thời gian rồi. Bạn có thể kết thúc.'); }
    }
    const pr = document.getElementById('plProg'); if (pr) pr.style.width = Math.min(100, sec / target * 100) + '%';
  }
}

/* ---------------- Thao tác ---------------- */
function setDone() {
  const e = PL.list[PL.i];
  let reps = e.cur.reps;
  if (e.time && PL.holdStart && Date.now() > PL.holdStart) reps = Math.round((Date.now() - PL.holdStart) / 1000);
  const kg = e.weighted ? +e.cur.kg || 0 : 0;
  e.done.push([kg, reps]);
  PL.lastSet = e.weighted ? `${fmtKg(kg)} kg × ${reps}` : e.time ? `${reps} giây` : `${reps} lần`;
  if (e.done.length < e.setsN) { startRest(e.restSec, false); return; }
  // Xong bài: kiểm tra kỷ lục
  if (ENGINE.isPR(e, e.hist, e.done)) {
    PL.prs.push(e.name);
    toast(`🏆 Kỷ lục mới: ${e.name}`);
    setTimeout(() => say('Kỷ lục mới! Tuyệt vời!', false), 1500);
  }
  if (nextExercise()) startRest(e.restSec, true);
  else goCooldown();
}

function playerAction(a, el) {
  const e = PL.list[PL.i];
  const st = settings();
  switch (a) {
    case 'plReady': PL.readiness = el.dataset.v; break;
    case 'plStyle': st.music = el.dataset.v; save(); if (PL.step !== 'ready') { AUDIO.music.stop(); startMusic(); } break;
    case 'plVoice': st.voice = !st.voice; AUDIO.voice.setOn(st.voice); save(); break;
    case 'plMusic':
      if (AUDIO.music.isPlaying()) { AUDIO.music.stop(); PL.musicOff = true; }
      else { PL.musicOff = false; if (!AUDIO.STYLES[st.music]) { st.music = 'edm'; save(); } startMusic(); }
      break;
    case 'plStart':
      AUDIO.ensure();
      if (PL.readiness === 'tired') PL.list.forEach(x => { x.setsN = Math.max(1, x.setsN - 1); });
      goWarmup(); break;
    case 'plGo': goWork(); break;
    case 'plFinishCool': goDone(); break;
    case 'plGuide': PL.guide = !PL.guide; break;
    case 'plPanel': PL.panel = !PL.panel; break;
    case 'plJump': PL.i = +el.dataset.i; PL.panel = false; PL.guide = false; goWork(); break;
    case 'plKg': {
      e.cur.kg = Math.max(0, r1((+e.cur.kg || 0) + (+el.dataset.d) * (e.step || 1)));
      const v = document.getElementById('plKgVal'); if (v) v.textContent = fmtKg(e.cur.kg);
      return;
    }
    case 'plReps': {
      e.cur.reps = Math.max(1, e.cur.reps + (+el.dataset.d) * (e.time ? 5 : 1));
      const v = document.getElementById('plRepsVal'); if (v) v.textContent = e.cur.reps;
      return;
    }
    case 'plSetDone': setDone(); break;
    case 'plHold': PL.holdStart = Date.now() + 3000; PL.holdBeeps = {}; say('3, 2, 1', false); break;
    case 'plSkip': PL.holdStart = 0; PL.guide = false; if (nextExercise()) goWork(); else goCooldown(); break;
    case 'plMore': PL.restEnd += 15000; PL.restTotal += 15000; return;
    case 'plRestSkip': goWork(); break;
    case 'plSwap': {
      const to = e[el.dataset.to]; if (!to) return;
      const alt = ENGINE.alternatives(to.id, state.profile);
      const base = {...e, id: to.id, name: to.name, cue: to.cue, muscles: to.muscles, equip: to.equip, time: to.time,
        reps: to.time ? e.repsTime : e.repsRep, easier: alt.easier, harder: alt.harder};
      const ex = ENGINE.exerciseById(to.id);
      base.equipIds = ex.equip; base.weighted = ex.equip.some(q => ['db', 'barbell', 'cable', 'machine'].includes(q));
      base.step = ex.equip.some(q => ['barbell', 'cable', 'machine'].includes(q)) ? 2.5 : base.weighted ? 1 : 0;
      const fresh = prepEx(base);
      fresh.done = e.done; fresh.setsN = e.setsN;
      PL.list[PL.i] = fresh; PL.holdStart = 0;
      toast('Đã đổi sang: ' + to.name);
      say(`Đổi sang ${to.name}.`);
      break;
    }
    case 'plToggle':
      if (PL.run) { PL.acc += Date.now() - PL.runFrom; PL.run = false; AUDIO.music.stop(); }
      else { PL.run = true; PL.runFrom = Date.now(); startMusic(); }
      break;
    case 'plFinish':
      if (PL.run) { PL.acc += Date.now() - PL.runFrom; PL.run = false; }
      PL.ended = PL.started + PL.acc;
      PL.step = 'cooldown'; musicMode('cool'); startPhase(180); say('Thả lỏng và giãn cơ nhé.');
      break;
    case 'plRpe': PL.rpe = el.dataset.v; break;
    case 'plSave': {
      const min = sessionMinutes();
      state.lifts = state.lifts || {};
      for (const x of PL.list) if (x.done.length) (state.lifts[x.id] = state.lifts[x.id] || []).push({d: PL.logDate, s: x.done});
      getDay(PL.logDate).ex.push({id: uid(), name: 'Buổi tập: ' + PL.s.title, min, kcal: sessionKcal(min), planned: true,
        sets: doneSets(), volume: r0(volume()), rpe: PL.rpe, prs: PL.prs.length, exercises: PL.list.filter(x => x.done.length).length});
      save(); closePlayer(); renderAll(); toast('Đã lưu buổi tập 💪');
      return;
    }
    case 'plDiscard': if (!confirm('Không lưu buổi tập này?')) return; closePlayer(); return;
    case 'plClose':
      if (['warmup', 'work', 'rest', 'cooldown'].includes(PL.step) && !confirm('Thoát buổi tập? Tiến độ sẽ không được lưu.')) return;
      closePlayer(); return;
  }
  renderPlayer();
}
