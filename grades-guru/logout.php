<?php
/**
 * Grades Guru — Logout
 * Destroys the session and redirects to the login page.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';

// Destroy the session
logout();

// Clear remember-me cookie if set
if (isset($_COOKIE['gg_remember'])) {
    setcookie('gg_remember', '', [
        'expires'  => time() - 3600,
        'path'     => '/',
        'secure'   => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

// Redirect to login with confirmation message
redirect(APP_URL . '/login.php?msg=logged_out');
