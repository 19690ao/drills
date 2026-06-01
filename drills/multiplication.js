export default {
  name:       'Multiplication',
  icon:       '×',
  color:      '#00e5c4',
  rgb:        '0,229,196',
  desc:       '2× through 12× tables',
  descDrill:       '<span>2×</span> through <span>12×</span> · 121 facts',
  countLabel: '121 facts',

  questions() {
    const qs = [];
    for (let a = 2; a <= 12; a++)
      for (let b = 2; b <= 12; b++)
        qs.push({ prompt: `${a} × ${b}`, answer: a * b, key: `${a}x${b}`, a, b });
    return qs;
  },

  // Groups stats panel by the table being drilled (2×, 3×, …)
  statsGroup: q => `${q.a}×`,
};