// Accounts en eigen concepten via Supabase (Auth + PostgREST), zonder SDK.
// Toegang wordt in de database afgedwongen met RLS: alleen eigen rijen in public.user_concepts.
const KEY = 'tl-session-v1';
let cfg = null;

// Voorvertoning: ?voorvertoning=aan zet accounts aan in deze browser, ook als ze site-breed nog uit staan.
function preview() {
  try {
    const v = new URLSearchParams(location.search).get('voorvertoning');
    if (v === 'aan') localStorage.setItem('tl-accounts-preview', '1');
    if (v === 'uit') localStorage.removeItem('tl-accounts-preview');
    return localStorage.getItem('tl-accounts-preview') === '1';
  } catch { return false; }
}
export function configure(c) { cfg = c && c.url && c.publishableKey && (c.enabled !== false || preview()) ? { url: c.url.replace(/\/$/, ''), key: c.publishableKey } : null; }
export const enabled = () => Boolean(cfg);

const readSession = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
const writeSession = (s) => { try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch {} };
const toSession = (r) => (r?.access_token ? { access_token: r.access_token, refresh_token: r.refresh_token, expires_at: Math.floor(Date.now() / 1000) + Number(r.expires_in || 3600), user: r.user ? { id: r.user.id, email: r.user.email } : null } : null);

const MESSAGES = [
  [/invalid login credentials/i, 'E-mailadres of wachtwoord klopt niet.'],
  [/email not confirmed/i, 'Bevestig eerst je e-mailadres via de link in je mail.'],
  [/user already registered|already been registered/i, 'Er bestaat al een account met dit e-mailadres. Log in of vraag een nieuw wachtwoord aan.'],
  [/password should be at least|weak password/i, 'Kies een wachtwoord van minstens 8 tekens.'],
  [/rate limit|too many/i, 'Te veel pogingen. Probeer het over een paar minuten opnieuw.'],
  [/maximaal 100 concepten/i, 'Je hebt het maximum van 100 concepten bereikt. Verwijder eerst een concept.'],
  [/relation .* does not exist|could not find the table/i, 'Opslaan is nog niet beschikbaar: de database wordt ingericht.'],
  [/failed to fetch|networkerror|load failed/i, 'Geen verbinding. Controleer je internet en probeer het opnieuw.'],
  [/^conflict$/, 'Iemand anders heeft dit concept intussen opgeslagen. Laad de nieuwste versie voordat je verder werkt.'],
  [/maximaal 20 samenwerkers/i, 'Maximaal 20 samenwerkers per concept.'],
  [/alleen de eigenaar/i, 'Alleen de eigenaar kan dit wijzigen.'],
  [/duplicate key|already exists/i, 'Deze persoon is al uitgenodigd.'],
];
export function message(err) {
  const raw = String(err?.message || err || '');
  return MESSAGES.find(([re]) => re.test(raw))?.[1] || raw || 'Er ging iets mis. Probeer het opnieuw.';
}

async function call(path, { method = 'GET', body, token, headers = {} } = {}) {
  if (!cfg) throw new Error('Accounts zijn niet ingesteld.');
  const res = await fetch(cfg.url + path, {
    method,
    headers: { apikey: cfg.key, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) { const e = new Error(data?.msg || data?.message || data?.error_description || data?.error || `HTTP ${res.status}`); e.status = res.status; throw e; }
  return data;
}

const redirect = (path = '/account/') => `${location.origin}${path}`;

export async function signUp(email, password) {
  const r = await call(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirect())}`, { method: 'POST', body: { email, password } });
  const s = toSession(r);
  if (s) writeSession(s);
  return { session: s, needsConfirmation: !s };
}
export async function signIn(email, password) {
  const s = toSession(await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
  writeSession(s);
  return s;
}
export async function recover(email) { await call(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirect())}`, { method: 'POST', body: { email } }); }
export async function signOut() {
  const s = readSession();
  writeSession(null);
  if (s) { try { await call('/auth/v1/logout', { method: 'POST', token: s.access_token }); } catch {} }
}

/** Geldige sessie (ververst zo nodig) of null. */
export async function session() {
  const s = readSession();
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s;
  try {
    const n = toSession(await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } }));
    n.user = n.user || s.user;
    writeSession(n);
    return n;
  } catch { writeSession(null); return null; }
}

/** Verwerkt de link uit de bevestigings- of herstelmail (#access_token=…&type=…). */
export async function consumeRedirect() {
  if (!location.hash.includes('access_token=')) return null;
  const h = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, '', location.pathname + location.search);
  const s = toSession({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), expires_in: h.get('expires_in') });
  try { const u = await call('/auth/v1/user', { token: s.access_token }); s.user = { id: u.id, email: u.email }; } catch {}
  writeSession(s);
  return { session: s, type: h.get('type') || '' };
}
export async function setPassword(password) {
  const s = await session(); if (!s) throw new Error('Log opnieuw in.');
  await call('/auth/v1/user', { method: 'PUT', token: s.access_token, body: { password } });
}

async function authed(path, opts = {}) {
  const s = await session();
  if (!s) { const e = new Error('Log in om je concepten te bewaren.'); e.status = 401; throw e; }
  return call(path, { ...opts, token: s.access_token });
}
const T = '/rest/v1/user_concepts';
export const listConcepts = () => authed(`${T}?select=id,title,base_slug,updated_at,user_id,stage:data->status->>stage&order=updated_at.desc`);
export async function myRoles() {
  const s = await session();
  const rows = await authed(`/rest/v1/concept_members?select=concept_id,role&email=eq.${encodeURIComponent((s?.user?.email || '').toLowerCase())}`);
  return Object.fromEntries((rows || []).map((r) => [r.concept_id, r.role]));
}
export const getConcept = (id) => authed(`${T}?id=eq.${encodeURIComponent(id)}&select=*`, { headers: { Accept: 'application/vnd.pgrst.object+json' } });
export async function createConcept({ base_slug, title, data }) {
  const r = await authed(T, { method: 'POST', body: { base_slug, title, data }, headers: { Prefer: 'return=representation' } });
  return Array.isArray(r) ? r[0] : r;
}
/** Wijzigen met conflictcontrole: als iemand anders intussen opsloeg (andere updated_at), volgt een conflict. */
export async function updateConcept(id, patch, expectedUpdatedAt = null) {
  const guard = expectedUpdatedAt ? `&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}` : '';
  const r = await authed(`${T}?id=eq.${encodeURIComponent(id)}${guard}`, { method: 'PATCH', body: patch, headers: { Prefer: 'return=representation' } });
  const row = Array.isArray(r) ? r[0] : r;
  if (!row) { const e = new Error('conflict'); e.conflict = true; throw e; }
  return row;
}

/* Delen: alleen-lezen link */
const token = () => { const b = new Uint8Array(24); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
export const shareOn = (id) => updateConcept(id, { share_token: token() });
export const shareOff = (id) => updateConcept(id, { share_token: null });
export async function getShared(t) {
  const r = await call('/rest/v1/rpc/shared_concept', { method: 'POST', body: { token: t } });
  if (!Array.isArray(r) || !r.length) throw new Error('Deze deellink bestaat niet (meer).');
  return r[0];
}

/* Samenwerken: leden per concept */
export const listMembers = (cid) => authed(`/rest/v1/concept_members?concept_id=eq.${encodeURIComponent(cid)}&select=email,role,created_at&order=created_at`);
export const addMember = (cid, email, role) => authed('/rest/v1/concept_members', { method: 'POST', body: { concept_id: cid, email: email.trim().toLowerCase(), role }, headers: { Prefer: 'return=minimal,resolution=merge-duplicates' } });
export const removeMember = (cid, email) => authed(`/rest/v1/concept_members?concept_id=eq.${encodeURIComponent(cid)}&email=eq.${encodeURIComponent(email)}`, { method: 'DELETE' });

/* Versies */
export const listVersions = (cid) => authed(`/rest/v1/user_concept_versions?concept_id=eq.${encodeURIComponent(cid)}&select=id,title,saved_by_email,created_at&order=created_at.desc&limit=50`);
export const getVersion = (vid) => authed(`/rest/v1/user_concept_versions?id=eq.${encodeURIComponent(vid)}&select=*`, { headers: { Accept: 'application/vnd.pgrst.object+json' } });
export const deleteConcept = (id) => authed(`${T}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
export async function deleteAccount() { await authed('/rest/v1/rpc/delete_my_account', { method: 'POST', body: {} }); writeSession(null); }
