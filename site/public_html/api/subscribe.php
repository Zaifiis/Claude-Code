<?php
/**
 * Newsletter sign-up.
 *
 * Answers JSON to the fetch() in site.js, and redirects when the browser asked
 * for HTML — so the footer form still works with JavaScript disabled.
 */
declare(strict_types=1);
require __DIR__ . '/../inc/bootstrap.php';

$wantsJson = str_contains((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json');

/** @return never */
function finish(bool $ok, string $message, bool $wantsJson, int $status = 200): void
{
    if ($wantsJson) {
        json_response(['ok' => $ok, 'message' => $message], $status);
    }
    redirect($ok ? '/thanks?sub=1' : '/?subscribe=failed#subscribe-title');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    finish(false, 'Method not allowed.', $wantsJson, 405);
}

if (!csrf_verify('subscribe', input($_POST, 'csrf', 200))) {
    finish(false, 'That form expired — reload the page and try again.', $wantsJson, 400);
}

// Caught bots get the same cheerful answer as everyone else.
if (looks_automated($_POST, 2)) {
    finish(true, 'You are on the list.', $wantsJson);
}

if (!rate_limit('subscribe', 5, 3600)) {
    finish(false, 'Too many attempts. Try again a bit later.', $wantsJson, 429);
}

$email = mb_strtolower(input($_POST, 'email', 190));
if (!is_valid_email($email)) {
    finish(false, 'That email address does not look right.', $wantsJson, 422);
}

try {
    $existing = db_one('SELECT id, status FROM subscribers WHERE email = ?', [$email]);

    if ($existing === null) {
        db_insert('subscribers', [
            'email'       => $email,
            'status'      => 'active',
            'source_page' => input($_POST, 'source_page', 190) ?: null,
            'ip_hash'     => ip_hash(),
            'unsub_token' => bin2hex(random_bytes(16)),
            'created_at'  => now(),
        ]);
    } elseif ($existing['status'] !== 'active') {
        db_update('subscribers', (int) $existing['id'], ['status' => 'active']);
    }
} catch (Throwable $e) {
    error_log('subscribe failed: ' . $e->getMessage());
    finish(false, 'Something broke on our side. Try again in a minute.', $wantsJson, 500);
}

finish(true, 'You are on the list — first issue lands next week.', $wantsJson);
