// Kleine, foutbestendige opslag. Keuzes blijven alleen in deze browser.
export function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function readData() {
  const el = document.getElementById('tl-data');
  return el ? JSON.parse(el.textContent) : null;
}
