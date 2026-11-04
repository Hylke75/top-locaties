// /account/: registreren, inloggen, wachtwoord herstellen en "Mijn concepten".
import * as A from './lib/account.js';
import { readData } from './lib/store.js';
import { partners, esc } from './lib/conceptdata.js';

const cfg = readData();
A.configure(cfg.accounts);
const $ = (s) => document.querySelector(s);
const form = $('[data-auth-form]');
const status = $('[data-auth-status]');
let mode = 'login';

const LABEL = { login: 'INLOGGEN ↗', register: 'ACCOUNT AANMAKEN ↗', recover: 'STUUR HERSTELLINK ↗' };
function setMode(m) {
  mode = m;
  document.querySelectorAll('[data-auth-tab]').forEach((b) => { const on = b.dataset.authTab === m; b.setAttribute('aria-selected', String(on)); b.classList.toggle('is-active', on); });
  $('[data-auth-password]').hidden = m === 'recover';
  form.elements.password.required = m !== 'recover';
  form.elements.password.autocomplete = m === 'register' ? 'new-password' : 'current-password';
  $('[data-auth-consent]').hidden = m !== 'register';
  $('[data-auth-submit]').textContent = LABEL[m];
  status.textContent = '';
}
document.querySelectorAll('[data-auth-tab]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.authTab)));

async function showSignedIn(s) {
  $('[data-auth-out]').hidden = true;
  $('[data-auth-in]').hidden = false;
  $('[data-auth-email]').textContent = s.user?.email || '';
  $('[data-my]').hidden = false;
  await loadList();
}
function showSignedOut() {
  $('[data-auth-out]').hidden = false;
  $('[data-auth-in]').hidden = true;
  $('[data-my]').hidden = true;
}

const when = (iso) => new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
async function loadList() {
  const list = $('[data-my-list]');
  list.innerHTML = '<div class="tl-state tl-state--loading"><p class="tl-mono">CONCEPTEN LADEN…</p></div>';
  try {
    const [rows, p, roles, s] = await Promise.all([A.listConcepts(), partners(), A.myRoles().catch(() => ({})), A.session()]);
    const title = Object.fromEntries(p.concepts.map((c) => [c.slug, c.title]));
    $('[data-basis-select]').innerHTML = p.concepts.map((c) => `<option value="${esc(c.slug)}">${esc(c.title)} — ${esc(c.dayPartLabel)}</option>`).join('');
    const pre = new URLSearchParams(location.search).get('basis');
    if (pre && title[pre]) $('[data-basis-select]').value = pre;
    $('[data-my-status]').textContent = `${rows.length} ${rows.length === 1 ? 'concept' : 'concepten'}.`;
    list.innerHTML = rows.length ? rows.map((r, i) => `<article class="tl-account__item" data-my-item="${esc(r.id)}">
      <span class="tl-mono">${String(i + 1).padStart(2, '0')} / BASIS: ${esc((title[r.base_slug] || r.base_slug).toUpperCase())}${r.user_id !== s?.user?.id ? ` / GEDEELD MET JOU (${roles[r.id] === 'editor' ? 'REDACTEUR' : 'LEZER'})` : ''}</span>
      <h3 class="tl-account__title"><a href="/maker/?id=${esc(r.id)}">${esc(r.title)}</a></h3>
      <span class="tl-mono tl-note"><span class="tl-account__stage" data-stage="${esc(r.stage || 'idee')}">${esc(({ idee: 'IDEE', offerte: 'OFFERTES OPGEVRAAGD', bevestigd: 'BEVESTIGD', afgerond: 'AFGEROND' })[r.stage || 'idee'] || 'IDEE')}</span> LAATST BEWAARD ${esc(when(r.updated_at).toUpperCase())}</span>
      <span class="tl-chip-set"><a class="tl-button" href="/maker/?id=${esc(r.id)}">BEWERK ↗</a><a class="tl-button tl-button--outline" href="/presentatie/?id=${esc(r.id)}">PRESENTATIE (PDF) ↗</a>${r.user_id === s?.user?.id ? `<button class="tl-text-button" type="button" data-delete="${esc(r.id)}">VERWIJDER</button>` : ''}</span>
    </article>`).join('')
      : '<div class="tl-state tl-state--empty"><h3 class="tl-state__title">NOG GEEN CONCEPTEN.</h3><p>Kies hierboven een standaardconcept en maak het in de maker helemaal van jou.</p></div>';
  } catch (e) {
    list.innerHTML = `<div class="tl-state tl-state--error"><h3 class="tl-state__title">NIET GELADEN.</h3><p>${esc(A.message(e))}</p><button class="tl-button" type="button" data-retry>PROBEER OPNIEUW</button></div>`;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = form.elements.email.value.trim();
  const pw = form.elements.password.value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.textContent = 'Vul een geldig e-mailadres in.'; form.elements.email.focus(); return; }
  if (mode !== 'recover' && pw.length < 8) { status.textContent = 'Kies een wachtwoord van minstens 8 tekens.'; form.elements.password.focus(); return; }
  if (mode === 'register' && !form.elements.consent.checked) { status.textContent = 'Ga akkoord met het bewaren van je e-mailadres en concepten.'; return; }
  status.textContent = 'EEN MOMENT…';
  try {
    if (mode === 'login') { const s = await A.signIn(email, pw); status.textContent = ''; await afterLogin(s); }
    else if (mode === 'register') {
      const r = await A.signUp(email, pw);
      if (r.session) await afterLogin(r.session);
      else status.textContent = 'Bijna klaar: we hebben je een bevestigingslink gemaild. Klik erop en je bent ingelogd.';
    } else { await A.recover(email); status.textContent = 'Als dit adres bij ons bekend is, staat er een herstellink in je mail.'; }
  } catch (err) { status.textContent = A.message(err); }
});

async function afterLogin(s) {
  const next = new URLSearchParams(location.search).get('next');
  if (next && /^\/(maker|presentatie)\//.test(next)) { location.href = next; return; }
  await showSignedIn(s);
}

$('[data-new-password]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const st = $('[data-newpw-status]');
  const pw = e.target.elements.password.value;
  if (pw.length < 8) { st.textContent = 'Kies een wachtwoord van minstens 8 tekens.'; return; }
  try { await A.setPassword(pw); st.textContent = 'Wachtwoord opgeslagen ✓'; e.target.hidden = true; await showSignedIn(await A.session()); } catch (err) { st.textContent = A.message(err); }
});

document.addEventListener('click', async (e) => {
  if (e.target.closest('[data-sign-out]')) { await A.signOut(); showSignedOut(); setMode('login'); status.textContent = 'Je bent uitgelogd.'; return; }
  if (e.target.closest('[data-retry]')) { loadList(); return; }
  const del = e.target.closest('[data-delete]');
  if (del) {
    const t = del.closest('[data-my-item]').querySelector('.tl-account__title').textContent;
    if (!confirm(`“${t}” definitief verwijderen?`)) return;
    try { await A.deleteConcept(del.dataset.delete); await loadList(); } catch (err) { alert(A.message(err)); }
    return;
  }
  if (e.target.closest('[data-delete-account]')) {
    if (!confirm('Je account en al je concepten worden definitief verwijderd. Doorgaan?')) return;
    try { await A.deleteAccount(); showSignedOut(); status.textContent = 'Je account en concepten zijn verwijderd.'; } catch (err) { alert(A.message(err)); }
  }
});
$('[data-new-concept]').addEventListener('submit', (e) => { e.preventDefault(); location.href = `/maker/?basis=${encodeURIComponent(e.target.elements.basis.value)}`; });

(async () => {
  if (!A.enabled()) { $('[data-auth-out]').innerHTML = '<div class="tl-state tl-state--empty"><h2 class="tl-state__title">BINNENKORT.</h2><p>Eigen concepten bewaren en bewerken komt binnenkort. Intussen download je elk standaardconcept als presentatie (PDF), Word of tekst op de conceptpagina.</p><a class="tl-button" href="/eventconcepten/">NAAR DE CONCEPTEN ↗</a></div>'; return; }
  const r = await A.consumeRedirect();
  if (r?.type === 'recovery') { $('[data-auth-out]').hidden = true; $('[data-new-password]').hidden = false; return; }
  const s = r?.session || await A.session();
  if (s) await showSignedIn(s); else setMode(new URLSearchParams(location.search).get('stap') === 'registreren' ? 'register' : 'login');
  if (r?.type === 'signup') $('[data-my-status]').textContent = 'Je e-mailadres is bevestigd ✓';
})();
