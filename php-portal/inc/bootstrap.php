<?php
/**
 * Front-controller bootstrap. Every page starts with:
 *   require __DIR__ . '/inc/bootstrap.php';
 * (adjust the path depth as needed).
 */

declare(strict_types=1);

mb_internal_encoding('UTF-8');

$CONFIG = require __DIR__ . '/../config.php';
$GLOBALS['CONFIG'] = $CONFIG;

if ($CONFIG['debug']) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    ini_set('display_errors', '0');
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('contentos');
    session_start();
}

require __DIR__ . '/constants.php';
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';
require __DIR__ . '/repo.php';
require __DIR__ . '/layout.php';

/** The one account this portal belongs to (single-user app). */
function current_user(): ?array
{
    static $cached = false;
    static $user = null;
    if ($cached) {
        return $user;
    }
    $cached = true;
    $uid = $_SESSION['uid'] ?? null;
    if (!$uid) {
        return $user = null;
    }
    $stmt = db()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$uid]);
    $row = $stmt->fetch();
    return $user = ($row ?: null);
}

/** Redirect to login unless authenticated. Call at the top of protected pages. */
function require_login(): array
{
    $u = current_user();
    if (!$u) {
        redirect(base_url('login.php'));
    }
    return $u;
}

/** The single owner account (there is exactly one). */
function owner_user(): array
{
    $row = db()->query('SELECT * FROM users ORDER BY created_at ASC LIMIT 1')->fetch();
    return $row ?: [];
}

/** Build an app-relative URL that works whether installed at / or /subfolder. */
function base_url(string $path = ''): string
{
    static $base = null;
    if ($base === null) {
        $script = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
        $base = rtrim($script, '/');
    }
    $path = ltrim($path, '/');
    return ($base === '' ? '' : $base) . '/' . $path;
}
