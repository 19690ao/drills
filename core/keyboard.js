/* ============================================================
   core/keyboard.js
   Builds the on-screen numpad from a drill's declared key needs.

   Drill contract (all optional, default = digits only):
     extraKeys:   string[]   symbol ids this drill needs (e.g. ['/'])
     deniedKeys:  string[]   symbol ids this drill must NEVER show,
                             even if extraKeys accidentally includes them

   Adding a new symbol (e.g. '.', '-') = add one line to KEY_REGISTRY.
   No other file needs to change. Adding a new drill that needs a
   symbol = declare extraKeys on that drill. Core never special-cases
   a topic by name - this is what keeps it open/closed.
============================================================ */

export const KEY_REGISTRY = {
  '/': { label: '/' },
  '.': { label: '.' },
  '-': { label: '-' },
};

/* -- Resolve which extra keys a drill is actually allowed -- */
export function resolveExtraKeys(drill) {
  const requested = drill.extraKeys || [];
  const denied    = new Set(drill.deniedKeys || []);

  return requested.filter(id => {
    if (!KEY_REGISTRY[id]) {
      console.warn(`[keyboard] unknown key id "${id}" requested by drill "${drill.name}" - ignored`);
      return false;
    }
    if (denied.has(id)) return false; // deniedKeys always wins
    return true;
  });
}

/* -- Render numpad into container, wire single click handler -- */
export function renderKeyboard(container, drill, onKey) {
  container.innerHTML = '';

  const digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];
  const extras = resolveExtraKeys(drill);

  const makeBtn = (key, label, extraClass = '') => {
    const b = document.createElement('button');
    b.className = `numpad-key ${extraClass}`.trim();
    b.dataset.key = key;
    b.textContent = label;
    return b;
  };

  digits.forEach(d => container.appendChild(makeBtn(d, d)));

  // Last row(s): extras + 0 + back, evenly spanned across 3 columns.
  // With 0 extras this reproduces the original "0 wide, back normal" layout.
  const tail = [...extras, '0', 'back'];
  for (let i = 0; i < tail.length; i += 3) {
    const row        = tail.slice(i, i + 3);
    const spanBase   = Math.floor(3 / row.length);
    const remainder  = 3 - spanBase * row.length;

    row.forEach((key, idx) => {
      const isBack = key === 'back';
      const label  = isBack ? '⌫' : (KEY_REGISTRY[key]?.label ?? key);
      const btn    = makeBtn(key, label, isBack ? 'numpad-back' : '');
      const span   = spanBase + (idx < remainder ? 1 : 0);
      if (span > 1) btn.style.gridColumn = `span ${span}`;
      container.appendChild(btn);
    });
  }

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.numpad-key');
    if (!btn) return;
    onKey(btn.dataset.key);
  });
}

/* -- Default input-buffer behavior for a keypress -- */
export function applyKeyToInput(inputEl, key) {
  if (key === 'back') {
    inputEl.value = inputEl.value.slice(0, -1);
  } else {
    inputEl.value += key;
  }
}