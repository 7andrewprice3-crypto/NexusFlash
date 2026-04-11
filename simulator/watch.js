/* ============================================================
   NexusFlash Smartwatch Emulator — Runtime Logic
   ============================================================ */

'use strict';

// ── State ─────────────────────────────────────────────────────
const state = {
  page: 0,                    // 0=home, 1=hr, 2=steps, 3=notif, 4=settings
  heartRate: 72,
  steps: 6240,
  stepsGoal: 10000,
  calories: 312,
  battery: 84,
  uv: 5.2,
  hrHistory: [],
  isTracking: false,
  dnd: false,
  brightness: 'High',
  wristDetect: true,
};

const PAGES = ['home', 'heartrate', 'steps', 'notifications', 'settings'];

// ── DOM refs ──────────────────────────────────────────────────
const timeEl    = document.getElementById('time');
const dateEl    = document.getElementById('date');
const hrValEl   = document.getElementById('hr-val');
const calValEl  = document.getElementById('cal-val');
const stepValEl = document.getElementById('step-val');
const uvValEl   = document.getElementById('uv-val');
const batValEl  = document.getElementById('bat-val');

const pageHrEl  = document.getElementById('page-hr');
const ringFg    = document.getElementById('ring-fg');
const ringBig   = document.getElementById('ring-big');

const pageStepsEl  = document.getElementById('page-steps');
const stepsRingFg  = document.getElementById('steps-ring-fg');
const stepsRingBig = document.getElementById('steps-ring-big');

const arcHr    = document.getElementById('arc-hr');
const arcSteps = document.getElementById('arc-steps');
const arcCal   = document.getElementById('arc-cal');

// ── Clock ─────────────────────────────────────────────────────
function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  timeEl.textContent = `${h}:${m}`;

  const days  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  dateEl.textContent = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
}
updateClock();
setInterval(updateClock, 1000);

// ── Simulated metric drift ────────────────────────────────────
function drift(val, min, max, delta) {
  return Math.min(max, Math.max(min, val + (Math.random() * 2 - 1) * delta));
}

function updateMetrics() {
  state.heartRate = Math.round(drift(state.heartRate, 55, 105, 3));
  state.calories  = Math.round(drift(state.calories, 200, 600, 4));
  state.steps    += Math.floor(Math.random() * 12);
  state.uv        = +(drift(state.uv, 1, 11, 0.2)).toFixed(1);
  state.battery   = Math.max(0, state.battery - 0.002); // slow drain

  // DOM: home face
  hrValEl.textContent  = state.heartRate;
  calValEl.textContent = state.calories;
  stepValEl.textContent = state.steps >= 1000
    ? (state.steps / 1000).toFixed(1) + 'k'
    : state.steps;
  uvValEl.textContent  = state.uv;
  batValEl.textContent = Math.round(state.battery) + '%';

  // Arcs
  setArc(arcHr,    state.heartRate, 40, 200);
  setArc(arcSteps, Math.min(state.steps, state.stepsGoal), 0, state.stepsGoal);
  setArc(arcCal,   state.calories, 0, 800);

  // HR page ring
  const hrPct = (state.heartRate - 40) / 160;
  setRing(ringFg, hrPct);
  pageHrEl.textContent = state.heartRate;
  ringBig.textContent  = state.heartRate;

  // Steps page ring
  const stepPct = Math.min(state.steps / state.stepsGoal, 1);
  setRing(stepsRingFg, stepPct);
  stepsRingBig.textContent = state.steps >= 1000
    ? (state.steps / 1000).toFixed(1) + 'k'
    : state.steps;
}

setInterval(updateMetrics, 2000);

// ── SVG arc helpers ───────────────────────────────────────────
function describeArc(cx, cy, r, startDeg, endDeg) {
  const toRad = d => (d - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function setArc(el, val, min, max) {
  if (!el) return;
  const pct    = Math.max(0, Math.min(1, (val - min) / (max - min)));
  const endDeg = pct * 270 - 135; // arc spans -135° → +135°
  el.setAttribute('d', describeArc(160, 160, 132, -135, Math.max(-134.9, endDeg)));
}

function setRing(el, pct) {
  if (!el) return;
  const circ = 2 * Math.PI * 52;
  el.style.strokeDasharray  = circ;
  el.style.strokeDashoffset = circ * (1 - Math.max(0, Math.min(1, pct)));
}

// initialise rings
function initVisuals() {
  updateMetrics();
  setRing(ringFg,       (state.heartRate - 40) / 160);
  setRing(stepsRingFg,  state.steps / state.stepsGoal);
}
initVisuals();

// ── Page navigation ───────────────────────────────────────────
function showPage(idx) {
  state.page = ((idx % PAGES.length) + PAGES.length) % PAGES.length;
  PAGES.forEach((id, i) => {
    const el = document.getElementById('pg-' + id);
    if (el) el.classList.toggle('active', i === state.page);
  });
  document.querySelectorAll('.dot').forEach((d, i) =>
    d.classList.toggle('active', i === state.page)
  );
}

// tap the screen → next page
document.getElementById('screen').addEventListener('click', (e) => {
  // flash effect
  const flash = document.createElement('div');
  flash.className = 'tap-flash';
  e.currentTarget.appendChild(flash);
  setTimeout(() => flash.remove(), 400);

  showPage(state.page + 1);
});

// crown buttons
document.getElementById('crown-up').addEventListener('click', () => showPage(state.page - 1));
document.getElementById('crown-dn').addEventListener('click', () => showPage(state.page + 1));

// nav dots
document.querySelectorAll('.dot').forEach((d, i) =>
  d.addEventListener('click', (e) => { e.stopPropagation(); showPage(i); })
);

// ── Settings toggles ──────────────────────────────────────────
document.getElementById('toggle-dnd').addEventListener('click', function () {
  state.dnd = !state.dnd;
  this.classList.toggle('off', !state.dnd);
});
document.getElementById('toggle-wrist').addEventListener('click', function () {
  state.wristDetect = !state.wristDetect;
  this.classList.toggle('off', !state.wristDetect);
});

// ── Touch / swipe support ─────────────────────────────────────
let touchStartX = 0;
const screenEl = document.getElementById('screen');
screenEl.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, {passive: true});
screenEl.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) {
    showPage(state.page + (dx < 0 ? 1 : -1));
  }
}, {passive: true});

// ── Initial render ────────────────────────────────────────────
showPage(0);
