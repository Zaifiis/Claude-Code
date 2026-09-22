<?php
/**
 * Security primitives: response headers, CSRF tokens, IP hashing, rate limits
 * and bot traps. Everything here is keyed off APP_KEY.
 */
declare(strict_types=1);

/**
 * Send hardening headers. Must run before any output.
 *
 * The CSP is strict — no inline scripts, no third-party origins. Structured
 * data is the one inline <script> we ship, so its hash is allow-listed by
 * value rather than opening the policy up with 'unsafe-inline'.
 */
function security_headers(?string $inlineScriptHash = null): void
{
    if (headers_sent()) {
        return;
    }

    $scriptSrc = "'self'";
    if ($inlineScriptHash !== null) {
        $scriptSrc .= " 'sha256-" . $inlineScriptHash . "'";
    }

    $csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "script-src " . $scriptSrc,
        "style-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
    ];

    header('Content-Security-Policy: ' . implode('; ', $csp));
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-Frame-Options: DENY');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()');
    header('Cross-Origin-Opener-Policy: same-origin');
    header_remove('X-Powered-By');

    if (is_https()) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

/** base64 sha256 of an inline script body, in the form CSP expects. */
function csp_hash(string $script): string
{
    return base64_encode(hash('sha256', $script, true));
}

/** Best-effort client IP. Only ever used hashed. */
function client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/**
 * Store a keyed hash of the IP rather than the address itself: enough to rate
 * limit and spot repeat submissions, not enough to be personal data at rest.
 */
function ip_hash(?string $ip = null): string
{
    return hash_hmac('sha256', $ip ?? client_ip(), (string) cfg('key'));
}

// ── CSRF ────────────────────────────────────────────────────────────────────

/**
 * Public (logged-out) forms use a signed, self-contained token: it needs no
 * session, so marketing pages stay cacheable and cookie-free. Admin forms use
 * csrf_session_token() below, which binds the token to the logged-in session.
 */
function csrf_token(string $form, int $ttl = 7200): string
{
    $expires = time() + $ttl;
    $sig     = hash_hmac('sha256', $form . '|' . $expires, (string) cfg('key'));
    return $expires . '.' . $sig;
}

function csrf_verify(string $form, string $token): bool
{
    if (!str_contains($token, '.')) {
        return false;
    }
    [$expires, $sig] = explode('.', $token, 2);
    if (!ctype_digit($expires) || (int) $expires < time()) {
        return false;
    }
    $expected = hash_hmac('sha256', $form . '|' . $expires, (string) cfg('key'));
    return hash_equals($expected, $sig);
}

/** Session-bound CSRF token for authenticated (admin) forms. */
function csrf_session_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return (string) $_SESSION['csrf'];
}

function csrf_session_verify(string $token): bool
{
    return !empty($_SESSION['csrf']) && hash_equals((string) $_SESSION['csrf'], $token);
}

// ── Rate limiting ───────────────────────────────────────────────────────────

/**
 * Fixed-window limiter, one row per (bucket, IP). Returns false once $max hits
 * have been recorded inside $windowSeconds.
 *
 * Fails OPEN: if the database is unreachable we would rather accept a lead
 * than lose one, since the other bot defences still apply.
 */
function rate_limit(string $bucket, int $max, int $windowSeconds): bool
{
    try {
        $ipHash = ip_hash();
        $row = db_one(
            'SELECT id, hits, window_start FROM rate_limits WHERE bucket = ? AND ip_hash = ?',
            [$bucket, $ipHash]
        );

        if ($row === null) {
            db_insert('rate_limits', [
                'bucket'       => $bucket,
                'ip_hash'      => $ipHash,
                'hits'         => 1,
                'window_start' => now(),
            ]);
            return true;
        }

        $windowStarted = strtotime((string) $row['window_start']) ?: 0;
        if (time() - $windowStarted > $windowSeconds) {
            db_update('rate_limits', (int) $row['id'], [
                'hits'         => 1,
                'window_start' => now(),
            ]);
            return true;
        }

        if ((int) $row['hits'] >= $max) {
            return false;
        }

        db_update('rate_limits', (int) $row['id'], ['hits' => (int) $row['hits'] + 1]);
        return true;
    } catch (Throwable $e) {
        error_log('rate_limit failed: ' . $e->getMessage());
        return true;
    }
}

// ── Bot traps ───────────────────────────────────────────────────────────────

/**
 * Two cheap signals that catch most automated submissions without a CAPTCHA:
 *
 *  - a honeypot field hidden from humans by CSS, which scripts happily fill in
 *  - a signed timestamp: a real person needs more than a couple of seconds to
 *    read a form and type into it
 */
function looks_automated(array $post, int $minSeconds = 3): bool
{
    if (input($post, 'website_url', 200) !== '') {
        return true;
    }

    $started = $post['form_started'] ?? '';
    if (!is_string($started) || !str_contains($started, '.')) {
        return true;
    }
    [$issued, $sig] = explode('.', $started, 2);
    if (!ctype_digit($issued)) {
        return true;
    }
    $expected = hash_hmac('sha256', 'ts|' . $issued, (string) cfg('key'));
    if (!hash_equals($expected, $sig)) {
        return true;
    }

    return (time() - (int) $issued) < $minSeconds;
}

/** Signed "this form was rendered at" stamp, read back by looks_automated(). */
function form_timestamp(): string
{
    $issued = time();
    return $issued . '.' . hash_hmac('sha256', 'ts|' . $issued, (string) cfg('key'));
}
