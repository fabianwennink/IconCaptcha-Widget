<?php
// Goblin's Gate server: uses IconCaptcha's own server framework (MIT, Fabian Wennink) to run the gate.
// Each custom challenge (text, image, checkbox, math, audio) is issued as an IconCaptcha challenge session
// (same storage, identifiers and expiry), marked solved when the browser reports a pass, and then checked
// with IconCaptcha's own validator ($captcha->validate). The icon puzzle itself is not used.
require_once __DIR__ . '/../../find-autoload.php';
require_once __DIR__ . '/../../init-db.php';

use IconCaptcha\IconCaptcha;
use IconCaptcha\Session\SessionFactory;

header('Content-Type: application/json');
$config = require __DIR__ . '/../../captcha-config.php';
$captcha = new IconCaptcha($config);
$captcha->handleCors();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { exit; }

try {
    $opts = $captcha->options($config);
    $ref = new ReflectionProperty($captcha, 'storage'); $ref->setAccessible(true);
    $storage = $ref->getValue($captcha);
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $driver = $opts['session']['driver'] ?? $opts['storage']['driver'];
    $make = fn(string $w, ?string $c = null) => SessionFactory::create($storage, $driver, $opts['session'], $ip, $w, $c);
    $action = $_GET['a'] ?? '';

    if ($action === 'issue') {
        $widgetId = \IconCaptcha\Utils::generateUUID(); // IconCaptcha requires a UUIDv4 widget id
        $s = $make($widgetId);
        $s->requested = true; $s->completed = false; $s->mode = substr(preg_replace('/[^a-z-]/', '', $_POST['type'] ?? 'custom'), 0, 20);
        $s->expiresAt = (int)(microtime(true) * 1000) + 5 * 60 * 1000; // 5 minutes, in ms like IconCaptcha
        $s->save();
        echo json_encode(['ok' => true, 'widgetId' => $widgetId, 'challengeId' => $s->getChallengeId()]); exit;
    }
    if ($action === 'solve') {
        $s = $make((string)($_POST['ic-wid'] ?? ''), (string)($_POST['ic-cid'] ?? ''));
        if (!$s->hasSessionDataLoaded() || $s->requested !== true || $s->isExpired()) { echo json_encode(['ok' => false, 'error' => 'invalid-challenge']); exit; }
        $s->completed = true; $s->save();
        echo json_encode(['ok' => true]); exit;
    }
    if ($action === 'verify') {
        $v = $captcha->validate($_POST);
        echo json_encode(['ok' => $v->success(), 'error' => $v->success() ? null : $v->getErrorCode()]); exit;
    }
    http_response_code(400); echo json_encode(['ok' => false, 'error' => 'bad-action']);
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['ok' => false, 'error' => 'server', 'detail' => $e->getMessage()]);
}
