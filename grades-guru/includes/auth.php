<?php
/**
 * Grades Guru — Authentication & Session Management
 * Handles login checks, role enforcement, and rate limiting.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config.php';
require_once __DIR__ . '/db.php';

// ─── Session Initialisation ────────────────────────────────────────────────────
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => SESSION_TIMEOUT,
        'path'     => '/',
        'secure'   => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

// ─── CSRF Helpers ──────────────────────────────────────────────────────────────

/**
 * Generates (or returns existing) CSRF token for the current session.
 */
function getCsrfToken(): string
{
    if (empty($_SESSION[CSRF_TOKEN_KEY])) {
        $_SESSION[CSRF_TOKEN_KEY] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_KEY];
}

/**
 * Validates the CSRF token supplied in a POST request.
 */
function validateCsrfToken(string $token): bool
{
    return isset($_SESSION[CSRF_TOKEN_KEY])
        && hash_equals($_SESSION[CSRF_TOKEN_KEY], $token);
}

// ─── Login State ───────────────────────────────────────────────────────────────

/**
 * Returns true when a valid, non-expired session exists.
 */
function isLoggedIn(): bool
{
    if (empty($_SESSION['user_id'])) {
        return false;
    }

    // Session timeout check
    if (!empty($_SESSION['last_activity'])) {
        $elapsed = time() - (int)$_SESSION['last_activity'];
        if ($elapsed > SESSION_TIMEOUT) {
            session_unset();
            session_destroy();
            return false;
        }
    }

    $_SESSION['last_activity'] = time();
    return true;
}

/**
 * Returns the current user array from the session, or null.
 */
function getCurrentUser(): ?array
{
    if (!isLoggedIn()) {
        return null;
    }

    return [
        'id'                  => $_SESSION['user_id']    ?? null,
        'name'                => $_SESSION['user_name']  ?? '',
        'email'               => $_SESSION['user_email'] ?? '',
        'role'                => $_SESSION['user_role']  ?? '',
        'referral_code'       => $_SESSION['referral_code']       ?? '',
        'discount_percentage' => $_SESSION['discount_percentage'] ?? 0,
        'spin_used'           => $_SESSION['spin_used']           ?? 0,
        'avatar'              => $_SESSION['avatar']              ?? null,
    ];
}

/**
 * Persists user information to the session after a successful login.
 */
function setUserSession(array $user): void
{
    // Regenerate session ID to prevent fixation attacks
    session_regenerate_id(true);

    $_SESSION['user_id']            = (int)$user['id'];
    $_SESSION['user_name']          = $user['name'];
    $_SESSION['user_email']         = $user['email'];
    $_SESSION['user_role']          = $user['role'];
    $_SESSION['referral_code']      = $user['referral_code'];
    $_SESSION['discount_percentage']= (float)$user['discount_percentage'];
    $_SESSION['spin_used']          = (int)$user['spin_used'];
    $_SESSION['avatar']             = $user['avatar'] ?? null;
    $_SESSION['last_activity']      = time();
    $_SESSION['login_time']         = time();

    // Generate a fresh CSRF token on login
    $_SESSION[CSRF_TOKEN_KEY] = bin2hex(random_bytes(32));
}

// ─── Access Control ────────────────────────────────────────────────────────────

/**
 * Redirects unauthenticated visitors to the login page.
 * Call at the top of any protected page.
 *
 * @param string $loginUrl  Path to the login page.
 */
function requireLogin(string $loginUrl = '/login.php'): void
{
    if (!isLoggedIn()) {
        $redirect = urlencode($_SERVER['REQUEST_URI'] ?? '');
        header('Location: ' . APP_URL . $loginUrl . '?redirect=' . $redirect);
        exit;
    }
}

/**
 * Restricts page access to users with the given role(s).
 *
 * @param string|string[] $roles  Allowed role or array of roles.
 * @param string          $redirectUrl  Where to send unauthorised users.
 */
function requireRole(string|array $roles, string $redirectUrl = '/dashboard.php'): void
{
    requireLogin();

    $allowed      = (array)$roles;
    $currentRole  = $_SESSION['user_role'] ?? '';

    if (!in_array($currentRole, $allowed, true)) {
        header('Location: ' . APP_URL . $redirectUrl . '?error=unauthorized');
        exit;
    }
}

/**
 * Returns true when the current user has the given role.
 */
function hasRole(string $role): bool
{
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === $role;
}

/**
 * Returns true when the current user is an admin.
 */
function isAdmin(): bool
{
    return hasRole('admin');
}

/**
 * Returns true when the current user is a team lead.
 */
function isTL(): bool
{
    return hasRole('tl');
}

/**
 * Returns true when the current user is a client.
 */
function isClient(): bool
{
    return hasRole('client');
}

// ─── Rate Limiting ─────────────────────────────────────────────────────────────

/**
 * Checks whether the given email address is currently rate-limited.
 * Allows a maximum of 5 login attempts per 15-minute window.
 *
 * @return bool  true = allowed, false = blocked
 */
function checkRateLimit(string $email): bool
{
    $key      = 'rate_limit_' . md5(strtolower(trim($email)));
    $maxTries = 5;
    $window   = 15 * 60; // 15 minutes

    if (!isset($_SESSION[$key])) {
        return true; // No history — allow
    }

    $data = $_SESSION[$key];

    // Reset window if expired
    if ((time() - $data['start']) > $window) {
        unset($_SESSION[$key]);
        return true;
    }

    return $data['attempts'] < $maxTries;
}

/**
 * Increments the failed attempt counter for the given email address.
 */
function incrementLoginAttempts(string $email): void
{
    $key = 'rate_limit_' . md5(strtolower(trim($email)));

    if (!isset($_SESSION[$key]) || (time() - $_SESSION[$key]['start']) > (15 * 60)) {
        $_SESSION[$key] = [
            'attempts' => 1,
            'start'    => time(),
        ];
    } else {
        $_SESSION[$key]['attempts']++;
    }
}

/**
 * Clears the failed attempt counter for the given email (called on success).
 */
function clearLoginAttempts(string $email): void
{
    $key = 'rate_limit_' . md5(strtolower(trim($email)));
    unset($_SESSION[$key]);
}

/**
 * Returns the number of remaining login attempts for an email.
 */
function getRemainingAttempts(string $email): int
{
    $key    = 'rate_limit_' . md5(strtolower(trim($email)));
    $maxTries = 5;

    if (!isset($_SESSION[$key])) {
        return $maxTries;
    }

    $data = $_SESSION[$key];

    if ((time() - $data['start']) > (15 * 60)) {
        return $maxTries;
    }

    return max(0, $maxTries - $data['attempts']);
}

// ─── Session Destruction ───────────────────────────────────────────────────────

/**
 * Completely destroys the current session and clears the cookie.
 */
function logout(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
}

// ─── User Refresh ──────────────────────────────────────────────────────────────

/**
 * Reloads the current user's data from the database and refreshes the session.
 * Useful after profile updates.
 */
function refreshUserSession(): bool
{
    if (!isLoggedIn()) {
        return false;
    }

    $pdo  = getPDO();
    $stmt = $pdo->prepare(
        'SELECT id, name, email, role, referral_code, discount_percentage,
                spin_used, last_spin_date, avatar, status
         FROM users
         WHERE id = ? AND status = "active"
         LIMIT 1'
    );
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        logout();
        return false;
    }

    setUserSession($user);
    return true;
}
