/* [extension copy] Edited for the extension: shared level across websites (o.state/o.onSave) and 50% bigger.
   Search for "[extension edit]" and the sizes in CSS. Original: Steven's osborn.js.
   Dr. Osborn: a companion that lives beside the captcha and slowly turns into a goblin.
   Original artwork, drawn in code. Only exists while a captcha is open.
   Wire it up by dispatching window events:  osborn:open  osborn:fail  osborn:pass  osborn:close
   or call the methods on Osborn.create(). */
(function (g) {
  const TH = [0, 3, 6, 10, 15, 21]; // pressure (opens + 2*fails) needed for each level
  const NAMES = ['Dr. Osborn', 'Dr. Osborn', 'Mr. Osborn', 'Osborn', 'OSBORN', 'THE GOBLIN'];
  const LINES = {
    open: [
      ["Hello! I'm Dr. Osborn. New page, so a quick safety check. Take your time.", "Oh, hello again! One tiny verification and you're through."],
      ["Another page already? Fine, fine. Quick check, please.", "Ah, a new URL. Shall we do this again?"],
      ["New page, new captcha. You did this to yourself, you know.", "Navigating again? Bold. Prove you're human. Again."],
      ["Oh good, a new URL. I was getting bored of you being verified.", "Another click, another captcha. I'm starting to enjoy this."],
      ["You keep moving and I keep checking. Neither of us is learning.", "Look who's back. Pull up a captcha."],
      ["HAHAHA! Another page! My favorite!", "Wander all you like. I'll be waiting at every URL."]],
    fail: [
      ["No worries! Mistakes happen. Have another go.", "Not quite, but you're doing great."],
      ["Close, I suppose. Try again?", "Hmm. That wasn't it. No rush."],
      ["Wrong. Take a breath, maybe read the question.", "That's... not it. Again."],
      ["Wow. A robot would've had that. Suspicious.", "Incorrect. Shocking no one but you."],
      ["Are you even trying?! My patience is a lab sample: nearly gone.", "WRONG. Again. Slower."],
      ["WRONG!! Delicious. Do it again!", "Fail, fail, fail! You're making my goblin heart so happy."]],
    pass: [
      ["Wonderful! You're verified. Have a lovely day!", "Perfect! Off you go."],
      ["There. That wasn't so hard. On you go.", "Verified. Don't dawdle."],
      ["Fine. You may pass. Barely.", "Verified. Go before I change my mind."],
      ["Verified. Somehow. Don't get used to it.", "Oh, you passed. Enjoy it. It won't last."],
      ["Hmph. Through you go. For now.", "Verified. I'll see you at the next URL."],
      ["You're through... until the next page. Hehehe.", "Go on. Run. I'll catch you at the next link."]],
    idle: ["Take your time! I'm not going anywhere.", "Still there? No pressure. Okay, a little pressure.", "Tick tock. Humans are usually faster.", "Did you fall asleep on the keyboard?", "I've seen faster answers from a fossilized newt.", "Time's up soon, little human. Or is it? Hehehe."],
    poke: ["That's me! Dr. Osborn. Science, safety and a little patience.", "Yes, I'm watching. Yes, it's mandatory.", "Poking me won't solve it.", "Touch me again and I'll make the captcha harder.", "Hands OFF the scientist.", "Ooh, feisty. I like you. Still watching you."]
  };

  /* ---------- artwork ---------- */
  const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const mix = (a, b, f) => { const B = hex(b); return '#' + hex(a).map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join(''); };
  const kf = (arr, t) => { const i = Math.min(Math.floor(t), arr.length - 2), f = t - i, a = arr[i], b = arr[i + 1];
    return typeof a === 'string' ? mix(a, b, f) : Array.isArray(a) ? a.map((v, j) => v + (b[j] - v) * f) : a + (b - a) * f; };
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  let uid = 0;

  // level 0 = friendly scientist ... level 5 = goblin. Fractions blend smoothly.
  function avatar(level, size) {
    const t = cl(level, 0, 5), u = t / 5, id = 'o' + (uid++);
    const skin = kf(['#f2cba8', '#ebcfa8', '#d3d29c', '#aac870', '#7db548', '#5aa832'], t), skinD = mix(skin, '#000000', 0.2);
    const bg = kf(['#e6f2ea', '#e1eee6', '#d4e4d8', '#8fb59a', '#35574a', '#1c1033'], t);
    const ring = kf(['#14532d', '#14532d', '#2f6b3f', '#4a9d3a', '#76d33a', '#a6ff3a'], t);
    const coat = kf(['#fafafa', '#eeeeee', '#d6dadd', '#7a5cb0', '#4c1d95', '#3a0f78'], t);
    const col = kf(['#ffffff', '#f4f4f4', '#e0e0e0', '#2a1260', '#241050', '#1b0a3a'], t);
    const hairC = kf(['#8a6d50', '#9a9186', '#b3b0aa', '#b3b0aa', '#b3b0aa', '#b3b0aa'], t), hairA = t < 2.5 ? 1 : cl(1 - (t - 2.5) / 1.5);
    const browC = kf(['#8a6d50', '#8a8782', '#6f6f6f', '#2e3b2e', '#1b2a1b', '#10230f'], t);
    const chin = 70 + 7 * u, tip = [27 - 17 * u, 45 - 11 * u];
    const ear = s => { const x = p => s ? 100 - p : p; return `<path d="M${x(30)} 39Q${x(tip[0] + 4)} ${tip[1] - 3} ${x(tip[0])} ${tip[1]}Q${x(tip[0] + 4)} ${tip[1] + 9} ${x(30)} 53Z" fill="${skin}" stroke="${skinD}" stroke-width=".8"/>`; };
    const ey = kf([5.4, 5, 4.2, 3.2, 2.6, 2.2], t), prx = kf([2.4, 2.3, 2.1, 1.8, 1.3, .9], t), pry = kf([2.4, 2.4, 2.4, 2.5, 2.8, 3.2], t);
    const sc = kf(['#ffffff', '#fdfdf5', '#fbf7d8', '#faf0a0', '#f8ee6a', '#f6e83a'], t), pc = kf(['#3b3a36', '#3b3a36', '#2d2a26', '#4a1010', '#b3121b', '#d90f1c'], t);
    const rot = kf([0, 0, 4, 8, 12, 16], t), glow = kf([0, 0, 0, .15, .35, .6], t);
    const eye = (x, r) => `<circle cx="${x}" cy="46" r="9" fill="url(#g${id})" opacity="${glow}"/><g transform="rotate(${r} ${x} 46)"><ellipse cx="${x}" cy="46" rx="5.2" ry="${ey}" fill="${sc}" stroke="${skinD}" stroke-width=".7"/><ellipse cx="${x}" cy="46" rx="${prx}" ry="${pry}" fill="${pc}"/><circle cx="${x - .9}" cy="${45 - ey * .15}" r=".8" fill="#fff" opacity="${1 - u * .6}"/></g>`;
    const brow = s => { const x = p => s ? 100 - p : p; return `<path d="M${x(34)} ${39 - 2 * u}L${x(46)} ${37 + 8 * u}" stroke="${browC}" stroke-width="${1.6 + 1.8 * u}" stroke-linecap="round"/>`; };
    const [lx, ly, cx, cy, rx, ry, open, teeth] = kf([[42, 61, 50, 69, 58, 61, 0, 0], [43, 63, 50, 67, 57, 63, 0, 0], [43, 64, 50, 65, 58, 61, 0, 0], [41, 63, 50, 66, 59, 59, .25, .35], [38, 61, 50, 71, 62, 59, .8, .8], [35, 60, 50, 76, 65, 59, 1, 1]], t);
    let teethSvg = ''; [.12, .28, .44, .6, .76, .88].forEach(s => { const a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c = s * s, x = a * lx + b * cx + c * rx, y = a * ly + b * cy + c * ry, big = s === .12 || s === .88, h = (big ? 5.5 : 3.3) * teeth;
      teethSvg += `<path d="M${x - 1.7} ${y}L${x + 1.7} ${y}L${x} ${y + h}Z" fill="#fffbe6"/>`; });
    const gA = t <= 3 ? 1 : cl(1 - (t - 3) / 1.2), crack = t < 4 ? cl((t - 1.6) / 1.2) : 0, hood = cl((t - 3) / 1.5), wr = cl((t - 2) / 3);
    const flap = s => { const x = p => s ? 100 - p : p; return `<path d="M${x(43)} 72L${x(30 - 2 * u)} ${72 - 12 * u}L${x(36)} 86Z" fill="${col}" stroke="${ring}" stroke-width="1"/>`; };
    const lens = x => `<circle cx="${x}" cy="45.5" r="7.8" fill="#cfe8ff" fill-opacity=".18" stroke="#2b2b2b" stroke-width="1.3"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size || 84}" height="${size || 84}" role="img" aria-label="Dr. Osborn"><defs><clipPath id="c${id}"><circle cx="50" cy="50" r="48"/></clipPath><radialGradient id="g${id}"><stop offset="0" stop-color="#ffe94a"/><stop offset="1" stop-color="#ffe94a" stop-opacity="0"/></radialGradient></defs>
<g clip-path="url(#c${id})"><rect width="100" height="100" fill="${bg}"/>
<path d="M18 72C14 42 32 20 50 2C68 20 86 42 82 72Z" fill="#4c1d95" stroke="#14532d" stroke-width="2" opacity="${hood}"/>
<path d="M6 100C10 80 28 74 50 74S90 80 94 100Z" fill="${coat}" stroke="${ring}" stroke-width="1.2"/>
<path d="M42 62h16v14c-4 3-12 3-16 0z" fill="${skinD}"/>${flap(0)}${flap(1)}${ear(0)}${ear(1)}
<path d="M29 44C29 26 40 21 50 21C60 21 71 26 71 44C71 56 62 66 50 ${chin}C38 66 29 56 29 44Z" fill="${skin}" stroke="${skinD}" stroke-width=".8"/>
<path d="M29 40C28 22 40 16 52 17C64 17 72 24 71 40C66 30 58 27 50 28C42 28 34 31 29 40Z" fill="${hairC}" opacity="${hairA}"/>
<g stroke="${skinD}" stroke-width="1" fill="none" opacity="${wr}"><path d="M40 30Q50 28 60 30"/><path d="M42 33Q50 31.5 58 33"/><path d="M39 54Q36 60 38 64"/><path d="M61 54Q64 60 62 64"/></g>
${eye(41, rot)}${eye(59, -rot)}${brow(0)}${brow(1)}
<path d="M50 47Q${52 + 2 * u} 55 ${49 - u} ${58 + u}" stroke="${skinD}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<path d="M${lx} ${ly}Q${cx} ${cy} ${rx} ${ry}Q${cx} ${cy + 12 * open} ${lx} ${ly}Z" fill="#4a0d12" fill-opacity="${cl(open * 1.5)}"/>${teethSvg}
<path d="M${lx} ${ly}Q${cx} ${cy} ${rx} ${ry}" stroke="#7a3b2e" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<g opacity="${gA}">${lens(41)}${lens(59)}<path d="M48.8 45Q50 43.8 51.2 45M33.2 45L29 44M66.8 45L71 44" stroke="#2b2b2b" stroke-width="1.2" fill="none"/><path d="M36 41L40 46L38 50" stroke="#fff" stroke-width=".9" fill="none" opacity="${crack}"/></g></g>
<circle cx="50" cy="50" r="48" fill="none" stroke="${ring}" stroke-width="3"/></svg>`;
  }

  /* ---------- companion widget ---------- */
  const CSS = `.w{position:fixed;bottom:24px;display:flex;align-items:flex-end;gap:12px;pointer-events:auto;font-family:Orbitron,Arial,sans-serif;transition:opacity .3s,transform .3s}
.right{right:20px}.left{left:20px}.w{flex-direction:column;align-items:flex-end}.left{align-items:flex-start} /* [extension edit] bubble sits above him so it never covers the centered card */.w.hide{opacity:0;transform:translateY(14px)}
.av{width:126px;height:126px;border:0;padding:0;background:none;border-radius:50%;cursor:pointer;flex:none;filter:drop-shadow(0 3px 8px rgba(0,0,0,.35))}
.av:focus-visible{outline:2px solid #1a73e8;outline-offset:3px}.av svg{display:block}
.b{pointer-events:none;position:relative;max-width:min(375px,calc((100vw - 560px) / 2 - 64px));min-width:0;background:var(--bb);color:var(--bt);border:2px solid var(--bc);border-radius:14px;padding:14px 18px;font-size:18px;line-height:1.45;box-shadow:0 3px 12px rgba(0,0,0,.25);margin-bottom:6px}
.b::after{content:"";position:absolute;bottom:21px;width:15px;height:15px;background:var(--bb);border:2px solid var(--bc);transform:rotate(45deg)}
.b::after{bottom:-10px!important;border-left:0;border-top:0}.right .b::after{right:54px}.left .b::after{left:54px}
.n{font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--bc);margin-bottom:2px}
.talk{animation:bob .3s 2}.rage .talk{animation:shake .22s 3}
@keyframes bob{50%{transform:translateY(-5px)}}@keyframes shake{25%{transform:translate(-3px,1px) rotate(-3deg)}75%{transform:translate(3px,-1px) rotate(3deg)}}
@media(max-width:640px){.w{bottom:10px}.right{right:8px}.left{left:8px}.av{width:96px;height:96px}.av svg{width:96px;height:96px}.b{max-width:285px;font-size:16px}}
@media(prefers-reduced-motion:reduce){.talk{animation:none!important}}`;

  function create(opts) {
    const o = Object.assign({ side: 'right', storageKey: 'osborn-state', decayMinutes: 30, idleMs: 20000 }, opts);
    const mem = { opens: 0, fails: 0, seen: 0 };
    // [extension edit] o.state / o.onSave let the extension keep one level across all websites.
    const load = () => { if (o.state) return Object.assign({}, mem, o.state); try { return Object.assign({}, mem, JSON.parse(localStorage.getItem(o.storageKey))); } catch (e) { return Object.assign({}, mem); } };
    const save = () => { if (o.onSave) { try { o.onSave(Object.assign({}, st)); } catch (e) {} return; } try { localStorage.setItem(o.storageKey, JSON.stringify(st)); } catch (e) {} };
    let st = load(), host, wEl, bEl, avEl, isOpen = false, shown = 0, last = {}, tType, tIdle, tHide, raf;
    const levelOf = s => { const p = s.opens + 2 * s.fails; let l = 0; TH.forEach((v, i) => { if (p >= v) l = i; }); return l; };
    const pick = (list, key) => { let x = list[Math.floor(Math.random() * list.length)]; if (list.length > 1 && x === last[key]) x = list[(list.indexOf(x) + 1) % list.length]; return last[key] = x; };
    function paint(t) {
      avEl.innerHTML = avatar(t, 126); // [extension edit] 50% bigger (was 84)
      const s = wEl.style; s.setProperty('--bb', mix('#ffffff', '#1c1033', cl((t - 2.5) / 2))); s.setProperty('--bt', mix('#202124', '#d8ffc0', cl((t - 2.5) / 2))); s.setProperty('--bc', mix('#14532d', '#76d33a', cl((t - 2) / 3)));
      wEl.classList.toggle('rage', t >= 3.5); bEl.querySelector('.n').textContent = NAMES[Math.round(t)];
    }
    function tween(to) { cancelAnimationFrame(raf); const from = shown, t0 = performance.now();
      const step = n => { const f = cl((n - t0) / 900); shown = from + (to - from) * f; paint(shown); if (f < 1) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); }
    function say(text) { clearInterval(tType); const el = bEl.querySelector('.t'); let i = 0; el.textContent = '';
      avEl.classList.remove('talk'); void avEl.offsetWidth; avEl.classList.add('talk');
      tType = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(tType); }, 16); armIdle(); }
    function armIdle() { clearTimeout(tIdle); tIdle = setTimeout(() => isOpen && say(g.Osborn.LINES.idle[levelOf(st)]), o.idleMs); }
    function mount() {
      if (host) return; host = document.createElement('div'); host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none';
      const r = host.attachShadow({ mode: 'open' });
      r.innerHTML = `<style>${CSS}</style><div class="w ${o.side} hide"><div class="b" role="status" aria-live="polite"><div class="n"></div><div class="t"></div></div><button class="av" aria-label="Dr. Osborn" type="button"></button></div>`;
      wEl = r.querySelector('.w'); bEl = r.querySelector('.b'); avEl = r.querySelector('.av');
      avEl.onclick = () => say(pick(LINES.poke.length === 6 ? [LINES.poke[levelOf(st)]] : LINES.poke, 'poke'));
      document.documentElement.appendChild(host); paint(shown); requestAnimationFrame(() => wEl.classList.remove('hide'));
    }
    const api = {
      captchaOpened() {
        const now = Date.now(); if (st.seen && now - st.seen > o.decayMinutes * 60000) st = Object.assign({}, mem);
        st.opens++; st.seen = now; save(); clearTimeout(tHide); isOpen = true; mount(); wEl.classList.remove('hide');
        const l = levelOf(st); tween(l); say(pick(LINES.open[l], 'open'));
      },
      captchaFailed() { if (!isOpen) return; st.fails++; st.seen = Date.now(); save(); const l = levelOf(st); tween(l); say(pick(LINES.fail[l], 'fail')); },
      captchaPassed() { if (!isOpen) return; say(pick(LINES.pass[levelOf(st)], 'pass')); clearTimeout(tIdle); tHide = setTimeout(api.captchaClosed, 2800); },
      captchaClosed() { if (!isOpen) return; isOpen = false; clearTimeout(tIdle); clearTimeout(tHide); clearInterval(tType); wEl.classList.add('hide');
        setTimeout(() => { if (!isOpen && host) { host.remove(); host = null; } }, 350); },
      say, reset() { st = Object.assign({}, mem); save(); }, getLevel: () => levelOf(st), getState: () => Object.assign({}, st),
      bump(n) { st.opens += n; save(); } // demo helper
    };
    [['open', 'captchaOpened'], ['fail', 'captchaFailed'], ['pass', 'captchaPassed'], ['close', 'captchaClosed']].forEach(([e, m]) => addEventListener('osborn:' + e, () => api[m]()));
    return api;
  }
  g.Osborn = { create, avatar, levelOf: (s) => { let l = 0; const p = s.opens + 2 * s.fails; TH.forEach((v, i) => { if (p >= v) l = i; }); return l; }, LINES, NAMES };
})(window);
