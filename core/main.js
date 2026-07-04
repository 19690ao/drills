/* ============================================================
   core/main.js
   Entry point for drill.html. Loads the drill named in the URL,
   applies its theme, builds its keyboard, and wires the engine.
   This is the only file that should know about "the page" -
   engine.js/ui.js/keyboard.js stay page-agnostic.
============================================================ */

import { state, startQuiz, submitAnswer, handleKey, openStats, closeStats } from './engine.js';
import { renderKeyboard, applyKeyToInput } from './keyboard.js';

const params  = new URLSearchParams(location.search);
const drillId = params.get('drill');

if (!drillId) { location.href = 'index.html'; throw new Error('no drill specified'); }

let drill;
try {
  const mod = await import(`../drills/${drillId}.js`);
  drill = mod.default;
} catch (e) {
  console.error('Failed to load drill:', drillId, e);
  location.href = 'index.html';
  throw e;
}

state.drill = drill;

/* -- Apply theme -- */
document.title = `${drill.name} · Math Drills`;
document.documentElement.style.setProperty('--accent', drill.color);
const hex = drill.color.replace('#', '');
const r = parseInt(hex.slice(0, 2), 16);
const g = parseInt(hex.slice(2, 4), 16);
const b = parseInt(hex.slice(4, 6), 16);
document.documentElement.style.setProperty('--accent-rgb', `${r},${g},${b}`);

document.getElementById('logoRing').textContent   = drill.icon;
document.getElementById('drillTitle').textContent = drill.name;
document.getElementById('drillDesc').innerHTML    = drill.descDrill || '';
document.getElementById('statsTitle').textContent = `${drill.name} Stats`;

/* -- Build keyboard once, from drill's declared key needs -- */
const numpad = document.getElementById('numpad');
const input  = document.getElementById('answerInput');
renderKeyboard(numpad, drill, (key) => {
  applyKeyToInput(input, key);
  input.focus();
});

/* -- Expose to inline onclick handlers in drill.html -- */
window.startQuiz    = startQuiz;
window.submitAnswer = submitAnswer;
window.handleKey    = handleKey;
window.openStats    = openStats;
window.closeStats   = closeStats;