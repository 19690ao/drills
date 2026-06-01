/* ============================================================
   core/ui.js
   DOM helpers, screen transitions, stats renderer, round overlay
============================================================ */

import { endRound, formatSec, formatTime } from './engine.js';

/* -- Screen transitions ----------------------------------- */
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active', 'fade-in'));
  const el = document.getElementById(id);
  el.classList.add('active');
  void el.offsetWidth;         // force reflow to re-trigger animation
  el.classList.add('fade-in');
  el.scrollTop = 0;
}

/* -- Question render -------------------------------------- */
export function renderQuestion(state) {
  if (state.transitioning) return;
  if (state.qIdx >= state.currentQueue.length) { endRound(); return; }

  const q = state.currentQueue[state.qIdx];
  state.questionStart = Date.now();

  const pct = state.currentQueue.length > 0
    ? (state.qIdx / state.currentQueue.length) * 100
    : 0;

  document.getElementById('progressFill').style.width    = pct + '%';
  document.getElementById('progressText').textContent    = `${state.qIdx} / ${state.currentQueue.length}`;
  document.getElementById('questionDisplay').textContent = `${q.prompt} = ?`;
  document.getElementById('mistakeCount').textContent    = state.totalMistakes;
  document.getElementById('mistakeCount').style.color    =
    state.totalMistakes > 0 ? 'var(--red)' : 'var(--text)';
  document.getElementById('roundBadge').textContent      =
    state.roundNum === 1 ? 'Round 1' : `Corrections (×${state.roundNum - 1})`;

  const input = document.getElementById('answerInput');
  input.value     = '';
  input.className = 'answer-input';

  const fb = document.getElementById('feedbackMsg');
  fb.textContent = '';
  fb.className   = 'feedback-msg';

  setTimeout(() => input.focus(), 30);
}

/* -- Round overlay ---------------------------------------- */
export function showRoundOverlay(state, onDone) {
  const count = state.wrongQueue.length;
  document.getElementById('overlayRound').textContent = `Correction Round ${state.roundNum - 1}`;
  document.getElementById('overlayCount').textContent =
    `${count} question${count !== 1 ? 's' : ''} to retry`;

  const bar = document.querySelector('.overlay-bar-fill');
  bar.style.animation = 'none';
  void bar.offsetWidth;
  bar.style.animation = 'shrink 2s linear forwards';

  document.getElementById('roundOverlay').classList.add('show');

  setTimeout(() => {
    document.getElementById('roundOverlay').classList.remove('show');
    onDone();
  }, 2100);
}

/* -- Stats renderer --------------------------------------- */
export function buildStats(state) {
  const allStats  = Object.values(state.statsMap);
  const container = document.getElementById('statsContent');

  if (allStats.length === 0) {
    container.innerHTML = '<p class="no-data">No data yet — answer some questions first!</p>';
    return;
  }

  const elapsed    = state.completionTime > 0
    ? state.completionTime
    : (Date.now() - state.sessionStart);
  const avgFirstMs = allStats.reduce((s, x) => s + x.firstTime, 0) / allStats.length;

  let html = `
    <div class="overview-grid">
      <div class="ov-card"><div class="ov-val">${formatTime(elapsed)}</div><div class="ov-lbl">total time</div></div>
      <div class="ov-card"><div class="ov-val">${formatSec(avgFirstMs)}</div><div class="ov-lbl">avg / question</div></div>
      <div class="ov-card"><div class="ov-val">${allStats.length}</div><div class="ov-lbl">answered</div></div>
    </div>`;

  if (state.drill.statsGroup) {
    html += _buildGroupedStats(allStats, state.drill);
  } else {
    html += _buildFlatStats(allStats);
  }

  container.innerHTML = html;
}

/* -- Private: grouped stats ------------------------------- */
function _buildGroupedStats(allStats, drill) {
  const groupMap = {};
  for (const stat of allStats) {
    const key = drill.statsGroup(stat.q);
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(stat);
  }

  const groups = Object.entries(groupMap).map(([key, stats]) => ({
    key,
    avg:   stats.reduce((s, x) => s + x.firstTime, 0) / stats.length,
    stats,
  })).sort((a, b) => b.avg - a.avg);  // slowest first

  const maxAvg = Math.max(...groups.map(g => g.avg));
  const minAvg = Math.min(...groups.map(g => g.avg));

  let html = '<div class="section-title">Average time by group</div>';

  for (const g of groups) {
    const pct    = maxAvg > 0 ? (g.avg / maxAvg) * 100 : 0;
    const isSlow = g.avg === maxAvg && groups.length > 1;
    const isFast = g.avg === minAvg && groups.length > 1;
    html += `
      <div class="table-avg-row">
        <span class="tbl-label">${g.key}</span>
        <div class="tbl-bar-track"><div class="tbl-bar-fill" style="width:${pct}%"></div></div>
        <span class="tbl-time">${formatSec(g.avg)}</span>
        <span class="tbl-badge-wrap">
          ${isSlow ? '<span class="tbl-badge badge-slow">slowest</span>' :
            isFast ? '<span class="tbl-badge badge-fast">fastest</span>' : ''}
        </span>
      </div>`;
  }

  html += '<div class="divider"></div><div class="section-title">Question breakdown</div>';

  for (const g of groups) {
    html += `<div class="table-section">
      <div class="table-section-hdr">${g.key} — avg ${formatSec(g.avg)}</div>`;
    for (const s of [...g.stats].sort((a, b) => b.firstTime - a.firstTime)) {
      html += _qRow(s);
    }
    html += '</div>';
  }

  return html;
}

/* -- Private: flat stats ---------------------------------- */
function _buildFlatStats(allStats) {
  let html = '<div class="section-title">Questions — slowest first</div>';
  for (const s of [...allStats].sort((a, b) => b.firstTime - a.firstTime)) {
    html += _qRow(s);
  }
  return html;
}

/* -- Private: single question row ------------------------- */
function _qRow(s) {
  const hadMistake = !s.gotRight || s.attempts > 1;
  return `<div class="q-row">
    <span class="q-eq">${s.q.prompt} = ${s.q.answer}</span>
    <span class="q-time">${formatSec(s.firstTime)}</span>
    <span class="q-badge ${hadMistake ? 'badge-err' : 'badge-ok'}">${s.attempts > 1 ? s.attempts + ' tries' : '✓ first'}</span>
  </div>`;
}