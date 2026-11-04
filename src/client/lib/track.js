// Anonieme tellers (Supabase RPC track): geen cookies, geen persoonsgegevens, geen IP-opslag.
// Alleen op het productiedomein en niet als "Do Not Track" aan staat.
export function track(event, slug = '') {
  try {
    const url = document.body.dataset.sbUrl; const key = document.body.dataset.sbKey;
    if (!url || !key || !/(^|\.)top-locaties\.nl$/.test(location.hostname) || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/track`, { method: 'POST', keepalive: true, headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_event: event, p_slug: String(slug || '').slice(0, 60) }) }).catch(() => {});
  } catch {}
}
