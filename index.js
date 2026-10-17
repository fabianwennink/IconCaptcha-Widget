// The captchas offered in the overlay menu. Each lives in extension/captchas/<folder>/.
// To add one: put its folder in extension/captchas/, add <script src="../bridge.js"></script> to its index.html,
// and add a line below.
import { frameCaptcha } from './frame.js';
export const CHALLENGES = [
  frameCaptcha('osborn-security', 'Missing Word'),
  frameCaptcha('dodging-checkbox', 'Not a Robot'),
  frameCaptcha('real-or-ai', 'Find the Cake'),
  frameCaptcha('math-prompt', 'Math'),
  frameCaptcha('music-note', 'Name the Note'),
];
