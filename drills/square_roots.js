export default {
  id:         'square_roots',
  name:       'Square Roots',
  icon:       '√x',
  color:      '#7b2cbf',
  rgb:        '123,44,191',
  desc:       '√1 through √400',
  descDrill:  '<span>√1</span> through <span>√400</span> · 20 facts',
  countLabel: '20 facts',

  questions() {
    const qs = [];
    for (let a = 1; a <= 20; a++) {
      const square = a * a;
      qs.push({ prompt: `√${square}`, answer: a, key: `√${square}`, a });
    }
    return qs;
  },

  // Groups stats panel by the facts being drilled
  statsGroup: q => `${Math.floor((q.a - 1) / 5) * 5 + 1} to ${Math.ceil(q.a / 5) * 5}`,
};