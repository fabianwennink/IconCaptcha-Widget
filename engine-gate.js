// Talks to api/gate.php, which runs on IconCaptcha's server code. Fails open (offline note) if the server is down.
const base = () => globalThis.__GG_API || (location.origin + '/');
const post = async (action, data) => {
  const r = await fetch(base() + 'api/gate.php?a=' + action, { method: 'POST', body: new URLSearchParams(data) });
  return r.json();
};
export async function issue(type) {
  try { const j = await post('issue', { type }); return j.ok ? { widgetId: j.widgetId, challengeId: j.challengeId } : null; } catch { return null; }
}
// Marks the challenge solved on the server, then asks IconCaptcha's validator to confirm it.
export async function redeem(t) {
  if (!t) return { ok: true, offline: true };
  const f = { 'ic-rq': '1', 'ic-wid': t.widgetId, 'ic-cid': t.challengeId, 'ic-hp': '' };
  try { const s = await post('solve', f); if (!s.ok) return { ok: false, error: s.error }; const v = await post('verify', f); return { ok: !!v.ok, error: v.error }; }
  catch { return { ok: true, offline: true }; }
}
