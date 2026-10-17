// Loads the overlay module. Does not read or change anything on the host page.
(async () => {
  if (window.__goblinsGateLoaded || window.top !== window) return; // top page only, not inside frames
  window.__goblinsGateLoaded = true;
  const base = chrome.runtime.getURL('');
  globalThis.__GG_API = 'http://localhost:8000/'; // IconCaptcha-based gate server
  const mod = await import(chrome.runtime.getURL('src/overlay.js'));
  mod.start(base);
})();
