export default {
  name:       'Squares',
  icon:       'x²',
  color:      '#ffd60a',
  rgb:        '255,214,10',
  desc:       '1² through 20²',
  descDrill:       '<span>1²</span> through <span>20²</span> · 20 facts',
  countLabel: '20 facts',

  questions() {
    const qs = [];
    for (let a = 1; a <= 20; a++)
      qs.push({ prompt: `${a}²`, answer: a * a, key: `${a}²`, a});
    return qs;
  },

  // Groups stats panel by the facts being drilled
  statsGroup: q => `${Math.floor((q.a - 1) / 5) * 5 + 1} to ${Math.ceil(q.a / 5) * 5}`
,
};