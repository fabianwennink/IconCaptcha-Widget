// Runs a captcha page from extension/captchas/<folder>/index.html inside the overlay.
// The page reports pass/fail through captchas/bridge.js.
export function frameCaptcha(folder, title, blurb = '') {
  return {
    id: folder, title, blurb,
    render(container, api) {
      const base = globalThis.__GG_BASE || '';
      const f = document.createElement('iframe');
      f.src = base + 'captchas/' + folder + '/index.html';
      f.title = title;
      f.allow = 'autoplay';
      f.setAttribute('allowtransparency', 'true');
      f.style.cssText = 'display:block;width:100%;max-width:440px;height:520px;border:0;background:transparent';
      const origin = new URL(f.src, location.href).origin;
      const onMsg = (e) => {
        if (e.source !== f.contentWindow || e.origin !== origin || !e.data || !e.data.goblinChaos) return;
        if (e.data.type === 'size' && e.data.height) f.style.height = Math.min(Math.max(e.data.height, 200), 900) + 'px';
        if (e.data.type === 'pass') setTimeout(() => api.pass(), 700);
        if (e.data.type === 'fail') api.fail();
      };
      window.addEventListener('message', onMsg);
      api.onCleanup(() => window.removeEventListener('message', onMsg));
      container.append(f);
    },
  };
}
