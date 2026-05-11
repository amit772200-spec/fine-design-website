'use strict';

/* =========================================================
   ACCESSIBILITY WIDGET — Israeli Standard 5568
   ========================================================= */

const PREFS_KEY = 'a11y-prefs';

const CONTROLS = [
  { id: 'large-text',      label: 'הגדלת טקסט',        cls: 'a11y-large-text',      icon: 'A+' },
  { id: 'readable-font',   label: 'גופן קריא',          cls: 'a11y-readable-font',   icon: 'Aa' },
  { id: 'high-contrast',   label: 'ניגודיות גבוהה',     cls: 'a11y-high-contrast',   icon: '◑'  },
  { id: 'inverted',        label: 'ניגודיות הפוכה',     cls: 'a11y-inverted',        icon: '◐'  },
  { id: 'grayscale',       label: 'גווני אפור',          cls: 'a11y-grayscale',       icon: '▨'  },
  { id: 'highlight-links', label: 'הדגשת קישורים',      cls: 'a11y-highlight-links', icon: '⎁'  },
  { id: 'no-animations',   label: 'עצירת אנימציות',     cls: 'a11y-no-animations',   icon: '||' },
  { id: 'large-cursor',    label: 'סמן גדול',            cls: 'a11y-large-cursor',    icon: '↖'  },
  { id: 'keyboard-focus',  label: 'הדגשת פוקוס מקלדת', cls: 'a11y-keyboard-focus',  icon: '⌨'  },
];

const html = document.documentElement;

/* --- Load saved preferences --- */
function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

function applyPrefs(prefs) {
  CONTROLS.forEach(ctrl => {
    if (prefs[ctrl.id]) {
      html.classList.add(ctrl.cls);
    } else {
      html.classList.remove(ctrl.cls);
    }
  });
}

/* --- Build widget DOM --- */
function buildWidget() {
  /* Toggle button */
  const btn = document.createElement('button');
  btn.id = 'a11y-widget-btn';
  btn.className = 'a11y-widget-btn';
  btn.setAttribute('aria-label', 'פתח תפריט נגישות');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'a11y-panel');
  btn.textContent = 'נגישות';

  /* Panel */
  const panel = document.createElement('div');
  panel.id = 'a11y-panel';
  panel.className = 'a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'אפשרויות נגישות');

  /* Panel header */
  const panelHeader = document.createElement('div');
  panelHeader.className = 'a11y-panel-header';

  const panelTitle = document.createElement('span');
  panelTitle.className = 'a11y-panel-title';
  panelTitle.textContent = 'הגדרות נגישות';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'a11y-panel-close';
  closeBtn.setAttribute('aria-label', 'סגור תפריט נגישות');
  closeBtn.textContent = '×';

  panelHeader.appendChild(panelTitle);
  panelHeader.appendChild(closeBtn);

  /* Controls list */
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'a11y-controls';
  controlsDiv.setAttribute('role', 'group');

  const prefs = loadPrefs();

  CONTROLS.forEach(ctrl => {
    const ctrlBtn = document.createElement('button');
    ctrlBtn.className = 'a11y-control-btn';
    ctrlBtn.dataset.ctrl = ctrl.id;
    ctrlBtn.setAttribute('aria-pressed', prefs[ctrl.id] ? 'true' : 'false');
    if (prefs[ctrl.id]) ctrlBtn.classList.add('is-active');

    const iconSpan = document.createElement('span');
    iconSpan.className = 'a11y-control-icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = ctrl.icon;

    const labelSpan = document.createElement('span');
    labelSpan.textContent = ctrl.label;

    ctrlBtn.appendChild(iconSpan);
    ctrlBtn.appendChild(labelSpan);
    controlsDiv.appendChild(ctrlBtn);
  });

  /* Reset button */
  const resetBtn = document.createElement('button');
  resetBtn.className = 'a11y-reset-btn';
  resetBtn.textContent = 'איפוס הגדרות';

  /* Footer */
  const panelFooter = document.createElement('div');
  panelFooter.className = 'a11y-panel-footer';
  panelFooter.textContent = 'תפריט נגישות בהתאם לתקן ישראלי 5568';

  panel.appendChild(panelHeader);
  panel.appendChild(controlsDiv);
  panel.appendChild(resetBtn);
  panel.appendChild(panelFooter);

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  return { btn, panel, closeBtn, controlsDiv, resetBtn };
}

/* --- Widget logic --- */
function initA11yWidget() {
  const prefs = loadPrefs();
  applyPrefs(prefs);

  const { btn, panel, closeBtn, controlsDiv, resetBtn } = buildWidget();

  function openPanel() {
    panel.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  }

  function closePanel() {
    panel.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }

  btn.addEventListener('click', () => {
    panel.classList.contains('is-open') ? closePanel() : openPanel();
  });

  closeBtn.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) {
      closePanel();
    }
  });

  /* Close when clicking outside */
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  controlsDiv.addEventListener('click', (e) => {
    const ctrlBtn = e.target.closest('.a11y-control-btn');
    if (!ctrlBtn) return;

    const ctrlId = ctrlBtn.dataset.ctrl;
    const ctrl   = CONTROLS.find(c => c.id === ctrlId);
    if (!ctrl) return;

    const currentPrefs = loadPrefs();
    const newVal = !currentPrefs[ctrlId];
    currentPrefs[ctrlId] = newVal;

    savePrefs(currentPrefs);
    applyPrefs(currentPrefs);

    ctrlBtn.setAttribute('aria-pressed', newVal ? 'true' : 'false');
    newVal
      ? ctrlBtn.classList.add('is-active')
      : ctrlBtn.classList.remove('is-active');
  });

  resetBtn.addEventListener('click', () => {
    savePrefs({});
    applyPrefs({});
    controlsDiv.querySelectorAll('.a11y-control-btn').forEach(b => {
      b.classList.remove('is-active');
      b.setAttribute('aria-pressed', 'false');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initA11yWidget);
} else {
  initA11yWidget();
}
