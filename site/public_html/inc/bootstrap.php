<?php
/**
 * Every request — page, API endpoint or admin screen — starts here.
 */
declare(strict_types=1);

define('APP_INC',     __DIR__);
define('APP_PUBLIC',  dirname(__DIR__));
define('APP_ROOT',    dirname(__DIR__, 2));
define('APP_STORAGE', APP_ROOT . '/storage');

require_once APP_INC . '/config.php';
require_once APP_INC . '/helpers.php';
require_once APP_INC . '/security.php';
require_once APP_INC . '/db.php';
require_once APP_INC . '/validate.php';
require_once APP_INC . '/mailer.php';
require_once APP_INC . '/content.php';
require_once APP_INC . '/icons.php';

/*
 * In production nothing is ever printed to the browser: a stray warning in the
 * middle of a page breaks the layout and can leak paths. Errors go to the log.
 */
$isDev = cfg('env') === 'development';
error_reporting(E_ALL);
ini_set('display_errors', $isDev ? '1' : '0');
ini_set('log_errors', '1');
if (!is_dir(APP_STORAGE)) {
    @mkdir(APP_STORAGE, 0750, true);
}
if (is_dir(APP_STORAGE) && is_writable(APP_STORAGE)) {
    ini_set('error_log', APP_STORAGE . '/php-error.log');
}

date_default_timezone_set('UTC');
mb_internal_encoding('UTF-8');

/*
 * APP_KEY signs CSRF tokens and hashes IP addresses. Without it those defences
 * are worthless, so fail loudly at setup time rather than silently at runtime.
 */
if (strlen((string) cfg('key')) < 32) {
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Setup incomplete</title>'
       . '<body style="font:16px/1.6 system-ui;max-width:42rem;margin:12vh auto;padding:0 1.5rem">'
       . '<h1 style="font-size:1.35rem">Setup incomplete</h1>'
       . '<p>No <code>APP_KEY</code> found. Copy <code>.env.example</code> to '
       . '<code>.env</code> one level above <code>public_html</code>, then generate a key:</p>'
       . '<pre style="background:#f4f4f5;padding:1rem;border-radius:.5rem;overflow:auto">'
       . 'php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"</pre>'
       . '<p>See <code>site/README.md</code> for the full checklist.</p></body>';
    exit;
}
