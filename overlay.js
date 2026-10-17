// Overlay: an Osborn Security "verify it's you" screen (fictional brand) shown on every page change.
// Lives in a shadow DOM, touches nothing on the host page, and has NO username/password fields:
// it never asks for or collects credentials. The only network calls are to its own files and the
// optional local IconCaptcha-based server.
import { CHALLENGES } from './challenges/index.js';
import { issue, redeem } from './engine-gate.js';


const LOGO = (s) => `<svg width="${s}" height="${s}" viewBox="-8 -8 116 116" aria-hidden="true"><path d="M66.50 78.58A33 33 0 0 1 17 50" stroke="#14532d" stroke-width="16" fill="none"/><path d="M17 50A33 33 0 0 1 50 17" stroke="#5b21b6" stroke-width="16" fill="none"/><path d="M50 17A33 33 0 0 1 82.50 55.73" stroke="#14532d" stroke-width="16" fill="none"/><polygon points="25,50 -1,50 25,28" fill="#14532d"/><polygon points="50,9 50,35 72,9" fill="#5b21b6"/><polygon points="74.62,54.34 100.23,58.86 70.80,76.01" fill="#14532d"/></svg>`;

// Icons and one-line descriptions for the verification methods (keyed by captcha folder name).
const ico = (p) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const METHOD = {
  'osborn-security': { icon: ico('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>'), desc: 'Enter the missing word' },
  'dodging-checkbox': { icon: ico('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>'), desc: 'Confirm you are not a robot' },
  'real-or-ai': { icon: ico('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>'), desc: 'Identify the correct image' },
  'math-prompt': { icon: ico('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/>'), desc: 'Answer a security question' },
  'music-note': { icon: ico('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'), desc: 'Audio verification' },
};
const CHEV = ico('<path d="M9 6l6 6-6 6"/>');

export async function start(base) {
  globalThis.__GG_BASE = base;
  const host = document.createElement('div');
  host.id = 'osborn-security-overlay';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    *{box-sizing:border-box}
    .wrap{position:fixed;inset:0;z-index:2147483647;background:rgba(255,255,255,.5);backdrop-filter:blur(3px);color:#1f2937;font:14px/1.45 Arial,Helvetica,sans-serif;display:none;overflow:auto}
    .wrap.on{display:flex;flex-direction:column;align-items:center;padding:6vh 16px 24px}
    /* extra room below so the card can scroll up clear of Dr. Osborn on small screens */
    .wrap.on{padding-bottom:200px}
    .card{flex:none;width:100%;max-width:460px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 10px 30px rgba(17,24,39,.14);overflow:hidden}
    .top{padding:28px 32px 6px;text-align:center}
    .brand{display:inline-flex;align-items:center;gap:8px;font-weight:700;letter-spacing:1.5px;font-size:15px}
    .brand .o{color:#14532d}.brand .s{color:#5b21b6}
    h1{font-size:22px;font-weight:600;margin:18px 0 6px;color:#111827}
    .sub{margin:0;color:#6b7280}
    .acct{display:inline-flex;align-items:center;gap:8px;margin:14px 0 4px;padding:6px 12px;border:1px solid #e5e7eb;border-radius:999px;color:#374151;font-size:13px}
    .dot{width:22px;height:22px;border-radius:50%;background:#14532d;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
    .body{padding:14px 32px 24px}
    .line{min-height:20px;margin:0 0 10px;font-size:13px;color:#14532d;text-align:center}
    .line.bad{color:#b91c1c}
    .methods{display:flex;flex-direction:column;gap:8px}
    .m{display:flex;align-items:center;gap:14px;width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#111827;font:inherit;text-align:left;cursor:pointer}
    .m:hover:not([disabled]){border-color:#14532d;background:#f6faf7}
    .m:focus-visible{outline:2px solid #5b21b6;outline-offset:2px}
    .m[disabled]{opacity:.45;cursor:default}
    .m .i{width:38px;height:38px;border-radius:8px;background:#f0f5f1;color:#14532d;display:flex;align-items:center;justify-content:center;flex:none}
    .m .t{flex:1}.m b{display:block;font-weight:600}.m small{color:#6b7280}
    .m .c{color:#9ca3af}
    .tag{font-size:11px;color:#6b7280;border:1px solid #e5e7eb;border-radius:999px;padding:1px 8px}
    .back{display:none;background:none;border:0;color:#5b21b6;font:inherit;font-weight:600;cursor:pointer;padding:0;margin:0 0 12px}
    .stage{display:flex;justify-content:center}
    .card.verifying .methods{display:none}.card.verifying .back{display:inline-block}
    .card.verifying{max-width:520px}
    .foot{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 32px;border-top:1px solid #f0f0f0;background:#fafafa;color:#6b7280;font-size:12px}
    .foot a{color:#6b7280;text-decoration:none;margin-left:12px}
    .demo{flex:none;margin-top:14px;font-size:12px;color:#374151;text-align:center}
    .demo button{background:none;border:0;color:#5b21b6;font:inherit;text-decoration:underline;cursor:pointer;padding:0}
  </style>
  <div class="wrap" role="dialog" aria-modal="true" aria-labelledby="ost">
    <div class="card" id="card">
      <div class="top">
        <div class="brand">${LOGO(28)}<span><span class="o">OSBORN</span> <span class="s">SECURITY</span></span></div>
        <h1 id="ost">Verify it's you</h1>
        <p class="sub">Additional verification is required to continue to</p>
        <div class="acct"><span class="dot">${(location.hostname[0] || 'w').toUpperCase()}</span><span id="site"></span></div>
      </div>
      <div class="body">
        <div id="char"></div>
        <button class="back" id="back">&larr; Choose another method</button>
        <div class="methods" id="menu"></div>
        <div class="stage" id="stage"></div>
      </div>
      <div class="foot"><span>Secured by Osborn Security</span><span><a>Help</a><a>Privacy</a><a>Terms</a></span></div>
    </div>
    <div class="demo">Hackathon demo. Nothing is collected. <button id="off">Turn off everywhere</button> (Alt+Shift+G turns it back on)</div>
  </div>`;
  document.documentElement.append(host);
  const $ = (s) => root.querySelector(s);
  const wrap = $('.wrap'), card = $('#card');
  $('#site').textContent = location.hostname || 'this site';

  // Status line inside the card (short system messages).
  const line = $('#char'); line.className = 'line';
  const plain = { greet: 'Choose a verification method.', mistake: 'That was not correct.', fail: 'Verification failed. Choose another method.', pass: 'Verified. Continuing\u2026', idle: 'Still there?', hint: '' };
  const ch = { setStage() {}, say(t) { line.textContent = t; line.classList.remove('bad'); }, react(e) { line.textContent = plain[e] || ''; line.classList.toggle('bad', e === 'fail' || e === 'mistake'); } };
  // Dr. Osborn (Steven's src/osborn.js, loaded by the manifest): sits beside the card and turns into a goblin
  // as people fail. We only call his four hooks; his file is unchanged.
  // His level (opens/fails) is kept in extension storage, so it carries across all pages and websites.
  let osState = null;
  try { if (globalThis.chrome && chrome.storage) osState = (await chrome.storage.local.get('osbornState')).osbornState || null; } catch (e) {}
  const osSave = (st) => { try { chrome.storage.local.set({ osbornState: st }); } catch (e) {} };
  const osborn = globalThis.Osborn ? globalThis.Osborn.create({ side: 'right', state: osState || {}, onSave: osSave }) : null;
  const os = (m) => { try { osborn && osborn[m](); } catch (e) {} };

  let failed = 0, used = new Set(), cleanups = [], enabled = true, current = null;
  // "Turn off" is remembered across all sites (extension storage) until Alt+Shift+G turns it back on.
  const store = (globalThis.chrome && chrome.storage && chrome.storage.local) || null;
  const saveEnabled = (v) => { try { store && store.set({ ggEnabled: v }); } catch (e) {} };
  try { if (store) { const v = await store.get('ggEnabled'); if (v.ggEnabled === false) enabled = false; } } catch (e) {}

  const clearStage = () => { cleanups.forEach(f => f()); cleanups = []; $('#stage').innerHTML = ''; card.classList.remove('verifying'); };
  const show = () => { if (!enabled) return; clearStage(); wrap.classList.add('on'); ch.react('greet'); menu(); os('captchaOpened'); };
  const hide = () => { clearStage(); wrap.classList.remove('on'); };
  const turnOff = () => { hide(); os('captchaClosed'); };
  const menu = () => {
    if (used.size >= CHALLENGES.length) used = new Set(); // all used: unlock again
    $('#menu').innerHTML = CHALLENGES.map(c => {
      const m = METHOD[c.id] || { icon: ico('<circle cx="12" cy="12" r="8"/>'), desc: c.blurb || '' };
      const off = used.has(c.id);
      return `<button class="m" data-id="${c.id}" ${off ? 'disabled' : ''}><span class="i">${m.icon}</span><span class="t"><b>${c.title}</b><small>${m.desc}</small></span>${off ? '<span class="tag">Used</span>' : `<span class="c">${CHEV}</span>`}</button>`;
    }).join('');
  };
  $('#menu').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-id]');
    const c = b && CHALLENGES.find(x => x.id === b.dataset.id);
    if (c) run(c);
  });
  $('#back').onclick = () => { current = null; clearStage(); ch.react('greet'); menu(); };

  async function run(c) {
    clearStage();
    card.classList.add('verifying');
    current = c;
    ch.say('');
    const ticket = await issue(c.id); // IconCaptcha challenge session for this attempt
    const api = {
      difficulty: 3, stage: osborn ? Math.min(3, osborn.getLevel()) : 0,
      say: (t) => ch.say(t), react: (e) => ch.react(e),
      async pass() {
        const r = await redeem(ticket);
        if (!r.ok) return api.fail('Verification could not be confirmed (' + (r.error || 'rejected') + ').');
        used.add(c.id); ch.react('pass'); os('captchaPassed'); setTimeout(hide, 900);
      },
      fail(line) {
        failed++; line ? ch.say(line) : ch.react('fail'); os('captchaFailed');
        setTimeout(() => { if (current === c) { current = null; clearStage(); menu(); } }, 1600);
      },
      onCleanup: (f) => cleanups.push(f), debug() {},
    };
    c.__api = api;
    await c.render($('#stage'), api);
  }
  host.forcePass = () => current && current.__api && current.__api.pass(); // test hook
  $('#off').onclick = () => { enabled = false; saveEnabled(false); turnOff(); };
  // Alt+Shift+G toggles the overlay back on or off.
  addEventListener('keydown', (e) => { if (e.altKey && e.shiftKey && e.code === 'KeyG') { enabled = !enabled; saveEnabled(enabled); enabled ? show() : turnOff(); } });
  // Page changes: poll the address (works for single-page navigation too); ignore #fragment changes.
  let last = location.pathname + location.search;
  setInterval(() => { const now = location.pathname + location.search; if (now !== last) { last = now; show(); } }, 400);
  show();
}
