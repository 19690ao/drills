/* ============================================================
   core/engine.js
   Quiz loop, scoring, round management, timer, confetti
============================================================ */

import { renderQuestion, showScreen, showRoundOverlay, buildStats } from './ui.js';
import { saveRun } from './storage.js';

/* -- State ----------------------------------------------- */
export const state = {
  drill:          null,
  currentQueue:   [],
  wrongQueue:     [],
  statsMap:       {},   // key → { q, firstTime, totalTime, attempts, gotRight }
  sessionStart:   0,
  completionTime: 0,
  questionStart:  0,
  totalMistakes:  0,
  roundNum:       1,
  qIdx:           0,
  transitioning:  false,
  prevScreen:     'startScreen',
};

let timerInterval = null;
let confettiId    = null;

/* -- Helpers ---------------------------------------------- */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export function formatSec(ms) {
  return (ms / 1000).toFixed(1) + 's';
}

/* -- Timer ------------------------------------------------ */
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const el = document.getElementById('timerDisplay');
    if (!el) return;
    const elapsed = Date.now() - state.sessionStart;
    const m = Math.floor(elapsed / 60000);
    const s = Math.floor((elapsed % 60000) / 1000);
    el.textContent = `${m}:${String(s).padStart(2, '0')}`;
  }, 500);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

/* -- Start ------------------------------------------------ */
export function startQuiz() {
  stopConfetti();
  Object.assign(state, {
    currentQueue:   shuffle(state.drill.questions()),
    wrongQueue:     [],
    statsMap:       {},
    totalMistakes:  0,
    roundNum:       1,
    qIdx:           0,
    transitioning:  false,
    completionTime: 0,
    sessionStart:   Date.now(),
  });
  startTimer();
  showScreen('quizScreen');
  renderQuestion(state);
}

/* -- Answer submission ------------------------------------ */
export function submitAnswer() {
  if (state.transitioning) return;

  const input = document.getElementById('answerInput');
  const raw   = input.value.trim();
  if (raw === '') return;
  const val = parseInt(raw, 10);
  if (isNaN(val)) return;

  const q         = state.currentQueue[state.qIdx];
  const timeTaken = Date.now() - state.questionStart;

  // Record stats
  if (!state.statsMap[q.key]) {
    state.statsMap[q.key] = { q, firstTime: timeTaken, totalTime: timeTaken, attempts: 1, gotRight: false };
  } else {
    state.statsMap[q.key].totalTime += timeTaken;
    state.statsMap[q.key].attempts++;
  }

  if (val === q.answer) {
    state.statsMap[q.key].gotRight = true;
    input.className = 'answer-input input-correct';
    flashFeedback(true);
    bounceCard();
    state.qIdx++;
    state.transitioning = true;
    setTimeout(() => { state.transitioning = false; renderQuestion(state); }, 480);
  } else {
    state.totalMistakes++;
    state.wrongQueue.push(q);
    input.className = 'answer-input input-wrong';
    flashFeedback(false, q.answer);
    shakeCard();
    state.qIdx++;
    state.transitioning = true;
    setTimeout(() => { state.transitioning = false; renderQuestion(state); }, 900);
  }
}

export function handleKey(e) {
  if (e.key === 'Enter') submitAnswer();
}

/* -- Feedback / card animation ---------------------------- */
function flashFeedback(correct, correctAns) {
  const fb = document.getElementById('feedbackMsg');
  if (correct) {
    const msgs = ['✓ Correct!', '✓ Nice!', '✓ Yes!', '✓ 🔥', '✓ Nailed it!'];
    fb.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    fb.className   = 'feedback-msg correct';
  } else {
    fb.textContent = `✗  Answer: ${correctAns}`;
    fb.className   = 'feedback-msg wrong';
  }
}

function bounceCard() {
  const c = document.getElementById('questionCard');
  c.classList.remove('card-bounce', 'card-shake');
  void c.offsetWidth;
  c.classList.add('card-bounce');
  setTimeout(() => c.classList.remove('card-bounce'), 400);
}

function shakeCard() {
  const c = document.getElementById('questionCard');
  c.classList.remove('card-bounce', 'card-shake');
  void c.offsetWidth;
  c.classList.add('card-shake');
  setTimeout(() => c.classList.remove('card-shake'), 500);
}

/* -- Round transitions ------------------------------------ */
export function endRound() {
  if (state.wrongQueue.length === 0) {
    finishQuiz();
  } else {
    state.roundNum++;
    showRoundOverlay(state, () => {
      state.currentQueue  = shuffle(state.wrongQueue.slice());
      state.wrongQueue    = [];
      state.qIdx          = 0;
      state.transitioning = false;
      renderQuestion(state);
    });
  }
}

/* -- Completion ------------------------------------------- */
function finishQuiz() {
  stopTimer();
  state.completionTime = Date.now() - state.sessionStart;

  // Persist to storage
  saveRun(state.drill.id, {
    time:     state.completionTime,
    mistakes: state.totalMistakes,
    date:     Date.now(),
  });

  showScreen('completeScreen');

  const perfect = state.totalMistakes === 0;
  document.getElementById('trophyWrap').textContent    = perfect ? '🌟' : '🏆';
  document.getElementById('completeTitle').textContent = perfect ? 'PERFECT RUN!' : 'All Done!';
  document.getElementById('completeSub').textContent   = perfect
    ? "Zero mistakes - you're a math legend!"
    : `${state.totalMistakes} mistake${state.totalMistakes !== 1 ? 's' : ''} corrected. Well done!`;
  document.getElementById('timeBig').textContent = formatTime(state.completionTime);

  const allStats = Object.values(state.statsMap);
  const avgMs    = allStats.reduce((s, x) => s + x.firstTime, 0) / allStats.length;

  document.getElementById('chipsRow').innerHTML = `
    <div class="chip chip-accent">${state.drill.countLabel || allStats.length + ' facts'} ✓</div>
    <div class="chip ${perfect ? 'chip-green' : 'chip-red'}">${perfect ? '0 mistakes 🔥' : state.totalMistakes + ' mistakes'}</div>
    <div class="chip chip-green">avg ${formatSec(avgMs)} / q</div>
  `;

  startConfetti();
}

/* -- Stats panel ------------------------------------------ */
export function openStats() {
  const active = document.querySelector('.screen.active');
  state.prevScreen = active ? active.id : 'quizScreen';
  buildStats(state);
  showScreen('statsScreen');
}

export function closeStats() {
  showScreen(state.prevScreen);
  if (state.prevScreen === 'quizScreen') {
    setTimeout(() => {
      const inp = document.getElementById('answerInput');
      if (inp) inp.focus();
    }, 80);
  }
}

/* -- Confetti --------------------------------------------- */
export function startConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const ctx    = canvas.getContext('2d');
  const colors = ['#00e5c4','#ff2d78','#ffd60a','#8b5cf6','#4cc9f0','#ff9f43','#00c875'];
  const pieces = Array.from({ length: 180 }, () => ({
    x:     Math.random() * canvas.width,
    y:     -20 - Math.random() * 300,
    w:     6 + Math.random() * 10,
    h:     3 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx:    (Math.random() - 0.5) * 4,
    vy:    1.8 + Math.random() * 3.5,
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.18,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of pieces) {
      p.x += p.vx; p.y += p.vy; p.angle += p.spin;
      if (p.y < canvas.height + 40) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) confettiId = requestAnimationFrame(draw);
    else canvas.style.display = 'none';
  }

  stopConfetti();
  draw();
}

export function stopConfetti() {
  if (confettiId) { cancelAnimationFrame(confettiId); confettiId = null; }
  const canvas = document.getElementById('confettiCanvas');
  canvas.style.display = 'none';
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}