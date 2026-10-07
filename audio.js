/* =====================================================================
   ÂM THANH KHI TẬP
   - Nhạc: tự tạo bằng Web Audio ngay trong máy (không bản quyền, chạy khi
     không có mạng). Nhịp tự đổi theo giai đoạn: khởi động, tập, nghỉ, chạy nhanh…
   - Giọng HLV: đọc tiếng Việt bằng giọng có sẵn của máy (speechSynthesis).
   - Tiếng bíp báo hết giờ nghỉ, đếm ngược 3-2-1.
   ===================================================================== */
const AUDIO = (() => {
  let ctx = null, master = null, musicBus = null, sfxBus = null, delay = null, noiseBuf = null;
  let volume = 0.6, ducked = false;

  function ensure() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createDynamicsCompressor();
        master.connect(ctx.destination);
        musicBus = ctx.createGain(); musicBus.gain.value = volume * 0.6; musicBus.connect(master);
        sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
        // Tiếng vọng nhẹ cho giai điệu
        delay = ctx.createDelay(1); const fb = ctx.createGain(), wet = ctx.createGain();
        fb.gain.value = 0.28; wet.gain.value = 0.35;
        delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(musicBus);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
    return ctx;
  }
  // iPhone (Safari 16.4+): 'playback' = phát nhạc của app; 'ambient' = trộn với nhạc từ app khác (Spotify, Apple Music)
  function setSession(type) { try { if (navigator.audioSession) navigator.audioSession.type = type; } catch (e) {} }

  /* ---------------- Tiếng bíp ---------------- */
  function beep(times = 1, freq = 880, len = 0.16) {
    if (!ensure()) return;
    for (let k = 0; k < times; k++) {
      const t = ctx.currentTime + k * 0.22, o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(sfxBus);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.start(t); o.stop(t + len + 0.02);
    }
    try { if (navigator.vibrate) navigator.vibrate(times > 1 ? [180, 80, 180] : 120); } catch (e) {}
  }

  /* ---------------- Nhạc ---------------- */
  const STYLES = {
    edm: {name: '⚡ Điện tử sôi động', bpm: {warmup: 118, work: 128, rest: 110, cardio: 130, fast: 150, cool: 100}},
    hiphop: {name: '🎤 Hip-hop', bpm: {warmup: 88, work: 94, rest: 82, cardio: 96, fast: 104, cool: 76}},
    lofi: {name: '🌙 Lo-fi nhẹ nhàng', bpm: {warmup: 80, work: 86, rest: 72, cardio: 88, fast: 96, cool: 68}}
  };
  // Vòng hợp âm La thứ: Am – F – C – G (mỗi hợp âm 1 ô nhịp)
  const PROG = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]];
  const ROOTS = [45, 41, 48, 43];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  let style = 'edm', mode = 'warmup', playing = false, step = 0, nextTime = 0, timer = null, bpm = 120;

  function noise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; return s;
  }
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function kick(t, v = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    env(g, t, 0.002, 0.9 * v, 0.3); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.4);
  }
  function snare(t, v = 1) {
    const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
    env(g, t, 0.001, 0.45 * v, 0.15); n.connect(f); f.connect(g); g.connect(musicBus); n.start(t); n.stop(t + 0.2);
    const o = ctx.createOscillator(), g2 = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(190, t);
    env(g2, t, 0.001, 0.25 * v, 0.08); o.connect(g2); g2.connect(musicBus); o.start(t); o.stop(t + 0.12);
  }
  function hat(t, v = 1, open = false) {
    const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'highpass'; f.frequency.value = 7000;
    env(g, t, 0.001, 0.16 * v, open ? 0.18 : 0.04); n.connect(f); f.connect(g); g.connect(musicBus);
    n.start(t); n.stop(t + (open ? 0.25 : 0.08));
  }
  function bass(t, midi, dur, v = 1, cutoff = 600) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(mtof(midi), t);
    f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff, t); f.Q.value = 4;
    env(g, t, 0.005, 0.32 * v, dur); o.connect(f); f.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function pluck(t, midi, dur, v = 1, type = 'square') {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(mtof(midi), t);
    f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
    env(g, t, 0.003, 0.08 * v, dur); o.connect(f); f.connect(g); g.connect(musicBus); g.connect(delay);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function pad(t, notes, dur, v = 1) {
    notes.forEach(m => [-7, 7].forEach(det => {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(mtof(m), t); o.detune.value = det;
      f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022 * v, t + 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05);
    }));
  }

  // Mỗi bước = 1 nốt móc kép (16 bước / ô nhịp)
  function scheduleStep(s, t) {
    const bar = Math.floor(s / 16) % 4, i = s % 16, chord = PROG[bar], root = ROOTS[bar];
    const six = 60 / bpm / 4;
    const calm = mode === 'rest' || mode === 'cool', fast = mode === 'fast', full = mode === 'work' || mode === 'cardio' || fast;
    delay.delayTime.setValueAtTime(six * 3, t);
    if (style === 'edm') {
      if (!calm && i % 4 === 0) kick(t);
      if (calm && i === 0) kick(t, 0.45);
      if (!calm && (i === 4 || i === 12)) snare(t, 0.8);
      if (i % 4 === 2) hat(t, calm ? 0.5 : 1, i === 14 && !calm);
      else if (full && i % 2 === 1) hat(t, 0.35);
      if (!calm && i % 4 === 2) bass(t, root, six * 1.6, 1, fast ? 950 : 650);
      if (calm && i === 0) pad(t, chord, six * 16);
      if (full && i % 2 === 0) pluck(t, chord[(i / 2) % 3] + 12, six * 1.5, fast ? 1 : 0.8);
      if (mode === 'warmup' && i % 4 === 0) pluck(t, chord[(i / 4) % 3] + 12, six * 3, 0.6, 'triangle');
    } else if (style === 'hiphop') {
      if (!calm && (i === 0 || i === 7 || i === 10)) kick(t, 0.9);
      if (calm && i === 0) kick(t, 0.4);
      if (i === 4 || i === 12) snare(t, calm ? 0.35 : 0.9);
      if (i % 2 === 0) hat(t, calm ? 0.3 : 0.7);
      if (full && i === 14) hat(t, 0.5, true);
      if (i === 0) bass(t, root, six * 6, 1, 420);
      if (!calm && i === 10) bass(t, root + 7, six * 4, 0.8, 420);
      if (i === 0) pad(t, chord, six * 16, calm ? 0.9 : 0.6);
      if (full && (i === 2 || i === 6 || i === 11)) pluck(t, chord[i % 3] + 12, six * 2, 0.6, 'triangle');
    } else {
      if (!calm && (i === 0 || i === 10)) kick(t, 0.55);
      if (!calm && (i === 4 || i === 12)) snare(t, 0.3);
      if (i % 2 === 0) hat(t, 0.22);
      if (i === 0) pad(t, chord.map(m => m + 12), six * 16, 1.1);
      if (i === 0 || i === 8) bass(t, root, six * 7, 0.7, 300);
      if (i % 4 === 3) pluck(t, chord[(i >> 2) % 3] + 24, six * 3, 0.5, 'triangle');
    }
  }
  function tick() {
    if (!playing || !ctx) return;
    while (nextTime < ctx.currentTime + 0.15) {
      scheduleStep(step, nextTime);
      // Hip-hop có nhịp "swing": nốt chẵn dài hơn, nốt lẻ ngắn hơn
      const six = 60 / bpm / 4;
      nextTime += style === 'hiphop' ? six * (step % 2 === 0 ? 1.15 : 0.85) : six;
      step++;
    }
  }
  function play(st) {
    if (st) style = st;
    if (!STYLES[style] || !ensure()) return;
    setSession('playback');
    bpm = STYLES[style].bpm[mode] || bpm;
    if (playing) return;
    playing = true; step = 0; nextTime = ctx.currentTime + 0.08;
    clearInterval(timer); timer = setInterval(tick, 25); tick();
  }
  function stop() { playing = false; clearInterval(timer); timer = null; }
  function setMode(m) { mode = m; if (STYLES[style]) bpm = STYLES[style].bpm[m] || bpm; }
  function setStyle(st) { if (!STYLES[st]) return; style = st; bpm = STYLES[st].bpm[mode] || bpm; }
  function applyVolume() { if (ctx) musicBus.gain.setTargetAtTime((ducked ? 0.3 : 1) * volume * 0.6, ctx.currentTime, 0.08); }
  function setVolume(v) { volume = Math.max(0, Math.min(1, v)); applyVolume(); }
  function duck(on) { ducked = on; applyVolume(); }

  /* ---------------- Giọng HLV ---------------- */
  let voiceOn = true, viVoice = null;
  function pickVoice() {
    try { const vs = speechSynthesis.getVoices(); viVoice = vs.find(v => /^vi/i.test(v.lang)) || null; } catch (e) {}
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { speechSynthesis.onvoiceschanged = pickVoice; }
  }
  // Làm câu dễ đọc: bỏ ngoặc, emoji; "10–12" → "10 đến 12"
  const speakable = s => String(s).replace(/\([^)]*\)/g, '').replace(/–/g, ' đến ').replace(/×/g, ' nhân ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
  function say(text, interrupt = true) {
    if (!voiceOn || !('speechSynthesis' in window)) return;
    try {
      if (interrupt) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(speakable(text));
      u.lang = 'vi-VN'; if (viVoice) u.voice = viVoice; u.rate = 1.05;
      u.onstart = () => duck(true);
      u.onend = u.onerror = () => duck(false);
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  return {
    ensure, setSession, beep, STYLES,
    music: {play, stop, setMode, setStyle, setVolume, isPlaying: () => playing, style: () => style},
    voice: {say, setOn: v => { voiceOn = !!v; if (!v) try { speechSynthesis.cancel(); } catch (e) {} }, isOn: () => voiceOn,
      supported: () => 'speechSynthesis' in window, hasVietnamese: () => !!viVoice}
  };
})();
