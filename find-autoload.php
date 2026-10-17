<?php
// Finds Composer's autoload.php by walking up from this folder, so the project works standalone
// or when it sits in a subfolder of the IconCaptcha repository.
$dir = __DIR__;
for ($i = 0; $i < 5; $i++) {
    if (file_exists($dir . '/vendor/autoload.php')) { require_once $dir . '/vendor/autoload.php'; return; }
    $dir = dirname($dir);
}
http_response_code(500); header('Content-Type: application/json');
echo json_encode(['ok' => false, 'error' => 'run composer install']); exit;
