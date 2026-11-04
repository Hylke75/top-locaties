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

// Dialogen (programma-onderdelen): native <dialog>, focus terug naar de knop bij sluiten.
let opener = null;
document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open-dialog]');
  if (open) {
    const d = document.getElementById(open.dataset.openDialog);
    if (d && typeof d.showModal === 'function') { opener = open; d.showModal(); d.querySelector('[data-close-dialog]')?.focus(); }
    return;
  }
  if (e.target.closest('[data-close-dialog]')) e.target.closest('dialog')?.close();
  else if (e.target.matches('dialog.tl-dialog')) e.target.close(); // klik op de achtergrond
});
document.querySelectorAll('dialog.tl-dialog').forEach((d) => d.addEventListener('close', () => { opener?.focus(); opener = null; }));

// Programma-agenda (<details>): deeplink #prog-… opent dat onderdeel; printen toont alle onderdelen.
function openFromHash() {
  const el = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (el && el.matches('details.tl-agenda__item')) { el.open = true; el.scrollIntoView({ block: 'start' }); }
}
openFromHash();
window.addEventListener('hashchange', openFromHash);
let printOpened = [];
window.addEventListener('beforeprint', () => { printOpened = [...document.querySelectorAll('details.tl-agenda__item:not([open])')]; printOpened.forEach((d) => { d.dataset.name = d.getAttribute('name') || ''; d.removeAttribute('name'); d.open = true; }); });
window.addEventListener('afterprint', () => { printOpened.forEach((d) => { d.open = false; if (d.dataset.name) d.setAttribute('name', d.dataset.name); }); printOpened = []; });
