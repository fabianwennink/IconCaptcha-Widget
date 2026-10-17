# Osborn Security extension

**Run it:** `chrome://extensions` > Developer mode > Load unpacked > pick this `extension` folder, then refresh any web page.
After changing anything in this folder, click Reload on the extension card and refresh the page.

**Captchas (the one folder):** `captchas/<name>/` with `index.html`, `captcha.js`, `captcha.css`.
Each `index.html` ends with `<script src="../bridge.js"></script>`, which tells the overlay pass ("msg ok") or fail ("msg no").
The menu list is `src/challenges/index.js`. To add a captcha: add its folder here, add the bridge line, add one line to that list.
You can still open any captcha's `index.html` on its own in a browser to work on it.

**Dr. Osborn (mascot):** `src/osborn.js` is Steven's file, unchanged, loaded by `manifest.json`. The overlay calls his
hooks: a new page = `captchaOpened`, a fail = `captchaFailed`, a pass = `captchaPassed`, turning off = `captchaClosed`.
This copy has two marked edits (search "[extension edit]"): he is 50% bigger with his speech bubble above his head (so it never covers the centered card), and his level is kept in extension storage so it
carries across all pages and websites (it still resets after 30 quiet minutes, his own rule). If Steven updates him, re-apply those edits.

**Optional server** (`../server`, uses IconCaptcha's PHP library, MIT): `cd ../server && composer install && php -S localhost:8000 -t public`.
Without it the overlay still works and lets people through after a pass.

**Download button:** after changes, re-zip this folder as `goblin-chaos-extension` into `docs/goblin-chaos-extension.zip`.
