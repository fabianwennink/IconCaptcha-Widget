<?php
// IconCaptcha (MIT) config for the Goblin's Gate demo.
// SQLite storage = no cookies needed, so it also works when called from the Chrome extension.
// DEMO SETTINGS: CORS open to all origins, token off, attempts off. Do not use these in production.
return [
    'iconPath' => null,
    'ipAddress' => static fn() => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
    'token' => null,
    'themes' => [],
    'storage' => ['driver' => 'sqlite', 'connection' => ['database' => __DIR__ . '/data/captcha.sqlite'],
        'datetimeFormat' => 'Y-m-d H:i:s'],
    'challenge' => ['availableIcons' => 250, 'iconAmount' => ['min' => 5, 'max' => 8], 'rotate' => true,
        'flip' => ['horizontally' => true, 'vertically' => true], 'border' => true,
        'generator' => \IconCaptcha\Challenge\Generators\GD::class],
    'validation' => ['inactivityExpiration' => 120, 'completionExpiration' => 300,
        'attempts' => ['enabled' => false, 'amount' => 3, 'timeout' => 60, 'valid' => 30,
            'storage' => ['driver' => null, 'options' => ['table' => 'iconcaptcha_attempts', 'purging' => true]]]],
    'session' => ['driver' => null, 'options' => ['table' => 'iconcaptcha_challenges', 'purging' => true, 'identifierTries' => 100]],
    'cors' => ['enabled' => true, 'origins' => ['*'], 'credentials' => false, 'cache' => 86400],
    'hooks' => ['init' => null, 'generation' => null, 'selection' => null],
];
