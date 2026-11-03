// Minimale, afhankelijkheidsvrije HTML-helpers voor de statische build.
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

class Raw { constructor(v) { this.v = v; } toString() { return this.v; } }
export const raw = (v) => new Raw(String(v));

function render(value) {
  if (value == null || value === false) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (value instanceof Raw) return value.v;
  return esc(value);
}

/** Tagged template: interpolaties worden ge-escaped, tenzij raw() of html``. */
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => { out += render(v) + strings[i + 1]; });
  return new Raw(out);
}

/** Kopregels: ["HET FESTIVAL", "*VAN MORGEN.*"] → regels met <br>, *…* = accent. */
export function lines(list) {
  return raw(list.map((line) => esc(line).replace(/\*(.+?)\*/g, '<span class="tl-accent">$1</span>')).join('<br>'));
}

export const pad = (n) => String(n).padStart(2, '0');
export const json = (data) => raw(JSON.stringify(data).replace(/</g, '\\u003c'));
