// Mobiel menu in .tl-header en het zwevende menupaneel op de homepage.
const toggle = document.querySelector('[data-menu-toggle]');
const nav = document.getElementById('tl-nav');
if (toggle && nav) {
  const set = (open) => {
    nav.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('[data-menu-label]').textContent = open ? 'SLUITEN' : 'MENU';
  };
  toggle.addEventListener('click', () => set(nav.dataset.open !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.dataset.open === 'true') { set(false); toggle.focus(); } });
}

const panelToggle = document.querySelector('[data-panel-toggle]');
if (panelToggle) {
  const navEl = document.getElementById(panelToggle.getAttribute('aria-controls'));
  const intro = document.querySelector('[data-panel-intro]');
  const set = (open) => {
    navEl.hidden = !open; intro.hidden = open;
    panelToggle.setAttribute('aria-expanded', String(open));
    panelToggle.querySelector('[data-panel-label]').textContent = open ? 'SLUITEN' : 'MENU';
  };
  panelToggle.addEventListener('click', () => set(navEl.hidden));
  navEl.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !navEl.hidden) { set(false); panelToggle.focus(); } });
}
