// Shared by every captcha page. Tells the extension overlay when the captcha is passed or failed,
// by watching the #msg element ("msg ok" = pass, "msg no" = fail), and reports the page height.
// Add to a captcha's index.html: <script src="../bridge.js"></script>
(function () {
  if (window.parent === window) return; // opened on its own (not in the extension): do nothing
  // Inside the extension: transparent page background so only the captcha card shows.
  document.documentElement.style.background = 'transparent';
  document.body.style.background = 'transparent';
  document.body.style.minHeight = '0';
  const send = (type) => window.parent.postMessage({ goblinChaos: true, type, height: document.documentElement.scrollHeight }, '*');
  const msg = document.getElementById('msg');
  let last = '';
  if (msg) new MutationObserver(() => {
    const c = msg.className;
    const now = /\bok\b/.test(c) ? 'pass' : /\bno\b/.test(c) ? 'fail' : '';
    if (now && now !== last) send(now);
    last = now;
  }).observe(msg, { attributes: true, attributeFilter: ['class'] });
  new ResizeObserver(() => send('size')).observe(document.body);
  send('size');
})();
