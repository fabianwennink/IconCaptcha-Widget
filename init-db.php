<?php
// Creates server/data/captcha.sqlite from IconCaptcha's own schema (run automatically by the endpoints).
$db = __DIR__ . '/data/captcha.sqlite';
if (!is_dir(dirname($db))) mkdir(dirname($db), 0777, true);
if (!file_exists($db)) {
    $pdo = new PDO('sqlite:' . $db);
    $pdo->exec(file_get_contents(__DIR__ . '/sqlite.sql'));
}
