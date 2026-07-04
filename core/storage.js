/* ============================================================
   core/storage.js
   localStorage persistence: best times, streaks, run history
============================================================ */

const PREFIX = 'mathdrills_';

/* -- Internal helpers ------------------------------------- */
function _key(drillId, suffix) {
  return `${PREFIX}${drillId}_${suffix}`;
}

function _get(k) {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function _set(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ }
}

/* -- Run history ------------------------------------------ */

/**
 * Save a completed run.
 * @param {string} drillId
 * @param {{ time: number, mistakes: number, date: number }} run
 */
export function saveRun(drillId, run) {
  const history = getHistory(drillId);
  history.push(run);
  // Keep last 50 runs max
  if (history.length > 50) history.splice(0, history.length - 50);
  _set(_key(drillId, 'history'), history);

  // Update best time (perfect runs only count as "clean best")
  const best = getBest(drillId);
  if (!best || run.time < best.time) {
    _set(_key(drillId, 'best'), run);
  }

  // Update streak
  _updateStreak(drillId);
}

/**
 * Return all saved runs for a drill, oldest first.
 * @param {string} drillId
 * @returns {Array<{ time: number, mistakes: number, date: number }>}
 */
export function getHistory(drillId) {
  return _get(_key(drillId, 'history')) ?? [];
}

/**
 * Return best run (lowest time) for a drill, or null.
 * @param {string} drillId
 * @returns {{ time: number, mistakes: number, date: number } | null}
 */
export function getBest(drillId) {
  return _get(_key(drillId, 'best'));
}

/* -- Streak tracking -------------------------------------- */

/**
 * Return current daily streak for a drill.
 * @param {string} drillId
 * @returns {{ count: number, lastDate: string }}
 */
export function getStreak(drillId) {
  return _get(_key(drillId, 'streak')) ?? { count: 0, lastDate: null };
}

function _updateStreak(drillId) {
  const today     = new Date().toISOString().slice(0, 10);  // 'YYYY-MM-DD'
  const streak    = getStreak(drillId);
  const yesterday = _offsetDate(-1);

  if (streak.lastDate === today) {
    // Already practiced today - no change
    return;
  } else if (streak.lastDate === yesterday) {
    // Consecutive day
    streak.count++;
  } else {
    // Gap or first time
    streak.count = 1;
  }

  streak.lastDate = today;
  _set(_key(drillId, 'streak'), streak);
}

function _offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* -- Aggregate helpers ------------------------------------ */

/**
 * Return stats summary for a drill:
 * { runs, bestTime, avgTime, perfectRuns, currentStreak }
 * Returns null if no history.
 * @param {string} drillId
 */
export function getSummary(drillId) {
  const history = getHistory(drillId);
  if (history.length === 0) return null;

  const times    = history.map(r => r.time);
  const best     = getBest(drillId);
  const streak   = getStreak(drillId);
  const perfects = history.filter(r => r.mistakes === 0).length;

  return {
    runs:          history.length,
    bestTime:      best?.time ?? null,
    avgTime:       Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    perfectRuns:   perfects,
    currentStreak: streak.count,
  };
}

/**
 * Clear all data for a drill (useful for dev/testing).
 * @param {string} drillId
 */
export function clearDrill(drillId) {
  ['history', 'best', 'streak'].forEach(s => {
    localStorage.removeItem(_key(drillId, s));
  });
}