/* ============================================================
   drills/fractions.js
   Fraction addition. First drill to need a non-digit key ('/'),
   so it's also the reference example for the extraKeys /
   checkAnswer / formatAnswer hooks a drill can opt into.
============================================================ */

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function reduce(n, d) {
  const g = gcd(Math.abs(n), Math.abs(d)) || 1;
  return [n / g, d / g];
}

// Parse a raw keypad string like "5/6" into [num, den], or null if malformed.
function parseFraction(raw) {
  const m = /^(\d+)\/(\d+)$/.exec(raw.trim());
  if (!m) return null;
  const den = parseInt(m[2], 10);
  if (den === 0) return null;
  return [parseInt(m[1], 10), den];
}

export default {
  name:       'Fractions',
  icon:       '½',
  color:      '#ff2d78',
  rgb:        '255,45,120',
  desc:       'Adding simple fractions',
  descDrill:  '<span>1/2 + 1/3</span> style sums · 40 facts',
  countLabel: '40 facts',

  // This drill needs '/' on the keypad. Nothing else changes core code -
  // keyboard.js reads this and renders the key; no drill-name special-casing.
  extraKeys: ['/'],

  questions() {
    const qs = [];
    const denoms = [2, 3, 4, 5, 6, 8];
    let i = 0;
    for (const d1 of denoms) {
      for (const d2 of denoms) {
        if (d1 === d2) continue;
        if (i++ >= 40) break;
        const n1 = 1, n2 = 1; // keep numerators simple for now
        const num = n1 * d2 + n2 * d1;
        const den = d1 * d2;
        const answer = reduce(num, den);
        qs.push({
          prompt: `${n1}/${d1} + ${n2}/${d2}`,
          answer,                 // [num, den], already reduced
          key:    `${n1}-${d1}+${n2}-${d2}`,
          d1, d2,
        });
      }
    }
    return qs;
  },

  // Compare reduced fractions, not raw strings - 2/4 must equal 1/2.
  checkAnswer(raw, q) {
    const parsed = parseFraction(raw);
    if (!parsed) return false;
    const [pn, pd] = reduce(parsed[0], parsed[1]);
    const [an, ad] = q.answer;
    return pn === an && pd === ad;
  },

  // q.answer is [num, den], not a plain number - engine asks the drill
  // how to display it instead of assuming a scalar.
  formatAnswer(q) {
    return `${q.answer[0]}/${q.answer[1]}`;
  },

  statsGroup: q => `+1/${q.d2}`,
};