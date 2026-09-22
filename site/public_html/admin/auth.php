<?php
/**
 * Admin session handling. Included by every file in /admin.
 */
declare(strict_types=1);
require_once __DIR__ . '/../inc/bootstrap.php';

const ADMIN_IDLE_TIMEOUT  = 7200;   // 2 hours without a request
const ADMIN_ABSOLUTE_LIFE = 43200;  // 12 hours since login, no matter what

function admin_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('kadmin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/admin',
        'secure'   => is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function admin_user(): ?array
{
    return isset($_SESSION['admin']) && is_array($_SESSION['admin'])
        ? $_SESSION['admin']
        : null;
}

/** Redirect to the login screen unless a valid, unexpired session exists. */
function require_admin(): array
{
    admin_session_start();

    $user = admin_user();
    if ($user === null) {
        redirect('/admin/');
    }

    $now       = time();
    $lastSeen  = (int) ($_SESSION['last_seen'] ?? 0);
    $loggedIn  = (int) ($_SESSION['logged_in_at'] ?? 0);

    if ($now - $lastSeen > ADMIN_IDLE_TIMEOUT || $now - $loggedIn > ADMIN_ABSOLUTE_LIFE) {
        admin_logout();
        redirect('/admin/?expired=1');
    }

    $_SESSION['last_seen'] = $now;
    return $user;
}

function admin_login(array $user): void
{
    admin_session_start();
    // New id on privilege change, so a fixated pre-login id is worthless.
    session_regenerate_id(true);

    $_SESSION['admin'] = [
        'id'    => (int) $user['id'],
        'name'  => (string) $user['name'],
        'email' => (string) $user['email'],
    ];
    $_SESSION['logged_in_at'] = time();
    $_SESSION['last_seen']    = time();
    unset($_SESSION['csrf']);
}

function admin_logout(): void
{
    admin_session_start();
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires'  => time() - 42000,
            'path'     => $params['path'],
            'secure'   => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'],
        ]);
    }
    session_destroy();
}

/** Assert the CSRF token on any admin POST, then stop if it fails. */
function require_admin_csrf(): void
{
    if (!csrf_session_verify(input($_POST, 'csrf', 200))) {
        http_response_code(400);
        exit('Bad request: invalid form token. Go back, reload, and try again.');
    }
}

/** Shared admin chrome. */
function admin_head(string $title, ?array $user = null): void
{
    security_headers();
    header('Cache-Control: no-store, private');
    $cssVersion = (string) @filemtime(APP_PUBLIC . '/assets/css/admin.css');
    ?>
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="robots" content="noindex, nofollow">
      <title><?= e($title) ?> — <?= e(brand()) ?> admin</title>
      <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
      <link rel="stylesheet" href="/assets/css/site.css">
      <link rel="stylesheet" href="/assets/css/admin.css?v=<?= e($cssVersion) ?>">
    </head>
    <body class="admin">
    <?php if ($user !== null): ?>
      <header class="admin-bar">
        <div class="admin-bar__inner">
          <a class="logo" href="/admin/leads.php">
            <?= logo_mark() ?>
            <span class="logo__text">Lead desk</span>
          </a>
          <nav class="admin-bar__nav" aria-label="Admin">
            <a href="/admin/leads.php"<?= is_current('/admin/leads.php') ? ' aria-current="page"' : '' ?>>Leads</a>
            <a href="/admin/subscribers.php"<?= is_current('/admin/subscribers.php') ? ' aria-current="page"' : '' ?>>Subscribers</a>
            <a href="/" target="_blank" rel="noopener">View site</a>
          </nav>
          <form class="admin-bar__user" method="post" action="/admin/logout.php">
            <input type="hidden" name="csrf" value="<?= e(csrf_session_token()) ?>">
            <span class="muted"><?= e($user['name']) ?></span>
            <button class="btn btn--ghost btn--sm" type="submit">Sign out</button>
          </form>
        </div>
      </header>
    <?php endif; ?>
    <main class="admin-main">
    <?php
}

function admin_foot(): void
{
    ?>
    </main>
    </body>
    </html>
    <?php
}
