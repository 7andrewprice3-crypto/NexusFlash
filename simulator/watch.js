'use strict';

// ── State ──────────────────────────────────────────────────────
const state = {
  page:       0,
  heartRate:  72,
  hrMin:      58,
  hrMax:      98,
  steps:      6240,
  stepsGoal:  10000,
  calories:   312,
  battery:    84,
  uv:         5.2,
  activeMins: 38,
  workout:    null,   // null | 'run' | 'cycle' | 'swim' | 'hiit'
  workoutSec: 0,
  dnd:        false,
  wristDetect:true,
};

const PAGES = ['home','heartrate','steps','sleep','workout','notifications','settings'];
const HR_ZONES = [
  [0,  60,  'Resting',  '#4caf50'],
  [60, 70,  'Warm Up',  '#8bc34a'],
  [70, 80,  'Fat Burn', '#f5a623'],
  [80, 90,  'Cardio',   '#ff7043'],
  [90, 200, 'Peak',     '#e8303a'],
];

// ── DOM ────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const timeEl   = $('time'),   dateEl    = $('date');
const hrValEl  = $('hr-val'), calValEl  = $('cal-val');
const stepEl   = $('step-val'), uvEl    = $('uv-val'), batEl = $('bat-val');
const hrBigEl  = $('hr-big'), hrMinEl   = $('hr-min'), hrMaxEl = $('hr-max');
const hrZoneEl = $('hr-zone');
const stepsBig = $('steps-big'), stepsRing = $('steps-ring');
const sKm = $('s-km'), sCal = $('s-cal');
const screenDim = $('screen-dim');
const handH = $('hand-h'), handM = $('hand-m'), handS = $('hand-s');
const arcCal = $('arc-cal'), arcSteps = $('arc-steps'), arcActive = $('arc-active');

// ── Clock + analog hands ───────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const ms = now.getMilliseconds();

  // Digital
  timeEl.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  const days   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  dateEl.textContent = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;

  // Analog hands — smooth sweep
  const hAngle = ((h % 12) * 30) + (m * 0.5);
  const mAngle = (m * 6) + (s * 0.1);
  const sAngle = (s * 6) + (ms * 0.006);

  handH.style.transform = `rotate(${hAngle}deg)`;
  handM.style.transform = `rotate(${mAngle}deg)`;
  handS.style.transform = `rotate(${sAngle}deg)`;
}

// Run on rAF for smooth second sweep
let lastClockSec = -1;
function clockLoop() {
  const s = new Date().getSeconds();
  if (s !== lastClockSec) { updateClock(); lastClockSec = s; }
  requestAnimationFrame(clockLoop);
}
clockLoop();

// ── Activity rings (SVG stroke-dashoffset) ─────────────────────
const RING_R = { cal: 133, steps: 120, active: 107 };
function ringCirc(r) { return 2 * Math.PI * r; }
function setRingProgress(el, r, pct) {
  const c = ringCirc(r);
  el.style.strokeDasharray  = c;
  el.style.strokeDashoffset = c * (1 - Math.min(1, Math.max(0, pct)));
}

// Steps ring (ring-wrap on steps page)
const stepsRingEl = $('steps-ring');
const stepsCirc = 2 * Math.PI * 50;
function setStepsRing(pct) {
  stepsRingEl.style.strokeDasharray  = stepsCirc;
  stepsRingEl.style.strokeDashoffset = stepsCirc * (1 - Math.min(1, pct));
}

// ── Metrics simulation ─────────────────────────────────────────
function drift(v, lo, hi, d) {
  return Math.min(hi, Math.max(lo, v + (Math.random() * 2 - 1) * d));
}

const hourlySteps = Array.from({length: 6}, (_, i) =>
  Math.floor(300 + Math.random() * 1200)
);

function updateMetrics() {
  state.heartRate = Math.round(drift(state.heartRate, 52, 108, 3));
  state.hrMin     = Math.min(state.hrMin, state.heartRate);
  state.hrMax     = Math.max(state.hrMax, state.heartRate);
  state.calories  = Math.round(drift(state.calories, 180, 650, 5));
  state.steps    += Math.floor(Math.random() * 14);
  state.uv        = +drift(state.uv, 0.5, 11, 0.15).toFixed(1);
  state.battery   = Math.max(0, state.battery - 0.003);
  state.activeMins = Math.min(60, state.activeMins + (Math.random() > 0.7 ? 1 : 0));

  // Hourly steps chart (last bucket ticks up)
  hourlySteps[5] = Math.min(hourlySteps[5] + Math.floor(Math.random() * 6), 2000);

  // Home face stats
  hrValEl.textContent  = state.heartRate;
  calValEl.textContent = state.calories;
  stepEl.textContent   = state.steps >= 1000 ? (state.steps/1000).toFixed(1)+'k' : state.steps;
  uvEl.textContent     = state.uv;
  const batPct = Math.round(state.battery);
  batEl.textContent    = batPct + '%';
  batEl.style.color    = batPct > 20 ? '#4caf50' : batPct > 10 ? '#f5a623' : '#e8303a';

  // Activity rings (home)
  setRingProgress(arcCal,    RING_R.cal,    state.calories / 800);
  setRingProgress(arcSteps,  RING_R.steps,  state.steps / state.stepsGoal);
  setRingProgress(arcActive, RING_R.active, state.activeMins / 60);

  // HR page
  hrBigEl.textContent = state.heartRate;
  hrMinEl.textContent = state.hrMin;
  hrMaxEl.textContent = state.hrMax;
  const zone = HR_ZONES.find(([lo, hi]) => state.heartRate >= lo && state.heartRate < hi);
  if (zone) {
    hrZoneEl.textContent   = zone[2];
    hrZoneEl.style.background = zone[3];
  }

  // Steps page
  const sp = state.steps / state.stepsGoal;
  setStepsRing(sp);
  stepsBig.textContent = state.steps >= 1000 ? (state.steps/1000).toFixed(1)+'k' : state.steps;
  sKm.textContent  = (state.steps * 0.00078).toFixed(1);
  sCal.textContent = state.calories;

  // Bar chart
  renderBarChart();
}

setInterval(updateMetrics, 2200);

// init immediately
setRingProgress(arcCal,    RING_R.cal,    state.calories / 800);
setRingProgress(arcSteps,  RING_R.steps,  state.steps / state.stepsGoal);
setRingProgress(arcActive, RING_R.active, state.activeMins / 60);
setStepsRing(state.steps / state.stepsGoal);

// ── Bar chart ──────────────────────────────────────────────────
function renderBarChart() {
  const el = $('bar-chart');
  if (!el) return;
  const max = Math.max(...hourlySteps, 1);
  el.innerHTML = hourlySteps.map((v, i) =>
    `<div class="bar${i === 5 ? ' now' : ''}" style="height:${Math.max(4, (v/max)*28)}px"></div>`
  ).join('');
}
renderBarChart();

// ── ECG canvas ─────────────────────────────────────────────────
const ecgCanvas = $('ecg-canvas');
const ecgCtx    = ecgCanvas ? ecgCanvas.getContext('2d') : null;
let ecgOffset   = 0;
let ecgRunning  = false;

// One beat waveform (x 0–100, y 0–1, baseline 0.5)
const BEAT = [
  [0,0.5],[8,0.5],[12,0.46],[16,0.42],[20,0.46],
  [24,0.5],[28,0.5],
  [30,0.54],[32,0.82],[34,0.08],[36,0.88],[38,0.5],
  [42,0.5],[46,0.47],[52,0.38],[58,0.46],[64,0.5],
  [80,0.5],[100,0.5]
];

function ecgY(x, w, h) {
  // Map x (0-100) within a beat to canvas coords
  // find segment
  for (let i = 1; i < BEAT.length; i++) {
    const [x0, y0] = BEAT[i-1];
    const [x1, y1] = BEAT[i];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0);
      const y = y0 + (y1 - y0) * t;
      return y * h;
    }
  }
  return h * 0.5;
}

function drawEcg() {
  if (!ecgCtx) return;
  const W = ecgCanvas.width, H = ecgCanvas.height;
  ecgCtx.clearRect(0, 0, W, H);

  // Grid lines
  ecgCtx.strokeStyle = 'rgba(232,48,58,0.08)';
  ecgCtx.lineWidth   = 0.5;
  for (let x = 0; x < W; x += 20) { ecgCtx.beginPath(); ecgCtx.moveTo(x,0); ecgCtx.lineTo(x,H); ecgCtx.stroke(); }
  for (let y = 0; y < H; y += 18) { ecgCtx.beginPath(); ecgCtx.moveTo(0,y); ecgCtx.lineTo(W,y); ecgCtx.stroke(); }

  // Waveform — speed based on heart rate (faster HR = shorter beat period)
  const beatPx = Math.round(280000 / state.heartRate); // pixels per beat
  ecgCtx.beginPath();
  ecgCtx.strokeStyle = '#e8303a';
  ecgCtx.lineWidth   = 1.5;
  ecgCtx.shadowBlur  = 4;
  ecgCtx.shadowColor = 'rgba(232,48,58,0.6)';

  for (let px = 0; px < W; px++) {
    const pos  = (px + ecgOffset) % beatPx;
    const frac = (pos / beatPx) * 100;
    const y    = ecgY(frac, W, H);
    if (px === 0) ecgCtx.moveTo(px, y);
    else          ecgCtx.lineTo(px, y);
  }
  ecgCtx.stroke();
  ecgCtx.shadowBlur = 0;
}

function ecgLoop() {
  if (!ecgRunning) return;
  ecgOffset = (ecgOffset + 1.8) % 300;
  drawEcg();
  requestAnimationFrame(ecgLoop);
}

// ── Page navigation (directional slides) ──────────────────────
function showPage(rawIdx) {
  const n   = PAGES.length;
  const newIdx = ((rawIdx % n) + n) % n;
  if (newIdx === state.page) return;

  const oldEl  = $('pg-' + PAGES[state.page]);
  const newEl  = $('pg-' + PAGES[newIdx]);

  // Direction: going "forward" (wrapping handled)
  let dir = newIdx > state.page ? 1 : -1;
  if (Math.abs(newIdx - state.page) > n / 2) dir = -dir;

  // Position new page off-screen instantly (no transition)
  newEl.style.transition = 'none';
  newEl.style.transform  = `translateX(${dir * 88}px)`;
  newEl.style.opacity    = '0';
  newEl.classList.add('active');

  // Force reflow then animate
  newEl.getBoundingClientRect();
  newEl.style.transition = '';
  newEl.style.transform  = 'translateX(0)';
  newEl.style.opacity    = '1';

  // Slide old page out
  oldEl.style.transform = `translateX(${-dir * 88}px)`;
  oldEl.style.opacity   = '0';

  setTimeout(() => {
    oldEl.classList.remove('active');
    oldEl.style.transform = '';
    oldEl.style.opacity   = '';
  }, 400);

  state.page = newIdx;

  // Manage ECG loop
  ecgRunning = (newIdx === 1);
  if (ecgRunning) ecgLoop();

  // Update dots
  document.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === newIdx);
  });

  // Wake screen if dimmed
  wakeScreen();
}

// ── Screen dim/wake ────────────────────────────────────────────
let dimTimer;
function wakeScreen() {
  screenDim.classList.remove('dimmed');
  clearTimeout(dimTimer);
  dimTimer = setTimeout(() => screenDim.classList.add('dimmed'), 8000);
}
wakeScreen();

document.addEventListener('mousemove', wakeScreen);
document.addEventListener('touchstart', wakeScreen, {passive: true});

// ── Interactions ───────────────────────────────────────────────
// Crown buttons
$('crown-up').addEventListener('click', () => showPage(state.page - 1));
$('crown-dn').addEventListener('click', () => showPage(state.page + 1));

// Nav dots
document.querySelectorAll('.dot').forEach((d, i) =>
  d.addEventListener('click', e => { e.stopPropagation(); showPage(i); })
);

// Tap screen → next page (but not if tapping workout tiles or toggles)
$('screen').addEventListener('click', e => {
  if (e.target.closest('.wk-tile, .wkt-stop, .toggle, .dot')) return;
  showPage(state.page + 1);
});

// Swipe on screen
let sx = 0, sy = 0;
$('screen').addEventListener('touchstart', e => {
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
}, {passive: true});
$('screen').addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - sx;
  const dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 36) {
    showPage(state.page + (dx < 0 ? 1 : -1));
  }
}, {passive: true});

// Mouse swipe
let msx = 0, msDragging = false;
$('screen').addEventListener('mousedown', e => { msx = e.clientX; msDragging = true; });
$('screen').addEventListener('mouseup', e => {
  if (!msDragging) return;
  msDragging = false;
  const dx = e.clientX - msx;
  if (Math.abs(dx) > 40) showPage(state.page + (dx < 0 ? 1 : -1));
});

// ── Workout tiles ──────────────────────────────────────────────
const WORKOUT_NAMES = { run:'Running', cycle:'Cycling', swim:'Swimming', hiit:'HIIT' };
let workoutInterval;

['run','cycle','swim','hiit'].forEach(id => {
  $('wt-' + id).addEventListener('click', e => {
    e.stopPropagation();
    if (state.workout) return;
    state.workout   = id;
    state.workoutSec = 0;
    $('wt-' + id).classList.add('running');
    $('wkt-label').textContent = WORKOUT_NAMES[id];
    $('wk-timer').style.display = 'flex';
    $('wk-timer').style.flexDirection = 'column';

    workoutInterval = setInterval(() => {
      state.workoutSec++;
      const m = String(Math.floor(state.workoutSec / 60)).padStart(2,'0');
      const s = String(state.workoutSec % 60).padStart(2,'0');
      $('wkt-time').textContent = `${m}:${s}`;
    }, 1000);
  });
});

$('wkt-stop').addEventListener('click', e => {
  e.stopPropagation();
  clearInterval(workoutInterval);
  if (state.workout) $('wt-' + state.workout).classList.remove('running');
  state.workout = null;
  state.workoutSec = 0;
  $('wk-timer').style.display = 'none';
  $('wkt-time').textContent = '00:00';
});

// ── Settings toggles ───────────────────────────────────────────
$('toggle-dnd').addEventListener('click', function(e) {
  e.stopPropagation();
  state.dnd = !state.dnd;
  this.classList.toggle('off', !state.dnd);
});
$('toggle-wrist').addEventListener('click', function(e) {
  e.stopPropagation();
  state.wristDetect = !state.wristDetect;
  this.classList.toggle('off', !state.wristDetect);
});

// ── Init ───────────────────────────────────────────────────────
showPage(0);
updateMetrics();
