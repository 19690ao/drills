export default {
  name:       'Division',
  icon:       '÷',
  color:      '#ff2d78',
  desc:       '<span>÷2</span> through <span>÷12</span> · 121 facts',
  countLabel: '121 facts',

  questions() {
    const qs = [];
    for (let a = 2; a <= 12; a++) {
      for (let b = 2; b <= 12; b++) {
        const c = a * b;
        qs.push({ prompt: `${c} ÷ ${a}`, answer: b, key: `${c}÷${a}`, c, a });
      }
    }
    return qs;
  },

  // Groups stats panel by the table being drilled (÷2, ÷3, …)
  statsGroup: q => `÷${q.a}`,
};