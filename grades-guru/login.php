<?php
/**
 * Grades Guru — Client Login Page
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';

// Redirect already logged-in users
if (isLoggedIn()) {
    redirectToDashboard();
}

$errors     = [];
$formEmail  = '';
$isLocked   = false;
$remaining  = 5;
$infoMsg    = '';

// Flash message from logout
$flashMsg = trim($_GET['msg'] ?? '');
if ($flashMsg === 'logged_out') {
    $infoMsg = 'You have been logged out successfully.';
} elseif ($flashMsg === 'session_expired') {
    $infoMsg = 'Your session expired. Please log in again.';
}

// ─── Handle POST ──────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // CSRF check
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors['general'] = 'Security token mismatch. Please refresh and try again.';
    } else {

        $email    = strtolower(trim($_POST['email']    ?? ''));
        $password = $_POST['password'] ?? '';
        $remember = isset($_POST['remember']);
        $formEmail = sanitize($email);

        // Basic field checks
        if ($email === '') {
            $errors['email'] = 'Email address is required.';
        } elseif (!isValidEmail($email)) {
            $errors['email'] = 'Please enter a valid email address.';
        }
        if ($password === '') {
            $errors['password'] = 'Password is required.';
        }

        if (empty($errors)) {

            // Rate limit check
            if (!checkRateLimit($email)) {
                $isLocked = true;
                $errors['general'] = 'Too many failed attempts. Please wait 15 minutes before trying again.';
            } else {

                $pdo  = getPDO();
                $stmt = $pdo->prepare(
                    'SELECT id, name, email, password, role, status, referral_code,
                            discount_percentage, spin_used, avatar
                     FROM users
                     WHERE email = ?
                     LIMIT 1'
                );
                $stmt->execute([$email]);
                $user = $stmt->fetch();

                $authenticated = false;

                if ($user && password_verify($password, $user['password'])) {
                    if ($user['status'] !== 'active') {
                        $errors['general'] = 'Your account has been suspended. Please contact support.';
                    } else {
                        $authenticated = true;
                    }
                }

                if ($authenticated) {
                    clearLoginAttempts($email);
                    setUserSession($user);

                    // Remember-me cookie (30 days)
                    if ($remember) {
                        $token = bin2hex(random_bytes(32));
                        setcookie('gg_remember', $token, [
                            'expires'  => time() + (30 * 24 * 3600),
                            'path'     => '/',
                            'secure'   => isset($_SERVER['HTTPS']),
                            'httponly' => true,
                            'samesite' => 'Lax',
                        ]);
                    }

                    // Redirect based on role
                    $role = $user['role'];
                    $map  = [
                        'admin'  => APP_URL . '/admin/dashboard.php',
                        'tl'     => APP_URL . '/tl/dashboard.php',
                        'client' => APP_URL . '/client/dashboard.php',
                    ];
                    redirect($map[$role] ?? APP_URL . '/client/dashboard.php');

                } else {
                    if (empty($errors['general'])) {
                        incrementLoginAttempts($email);
                        $remaining = getRemainingAttempts($email);

                        if ($remaining <= 0) {
                            $isLocked = true;
                            $errors['general'] = 'Too many failed attempts. Please wait 15 minutes.';
                        } else {
                            $errors['general'] = 'Invalid email or password. ' . $remaining . ' attempt' . ($remaining === 1 ? '' : 's') . ' remaining.';
                        }
                    }
                }
            }
        }
    }
}

$csrfToken = getCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login — Grades Guru</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --navy:      #0A1628;
            --navy-light:#112240;
            --gold:      #F4C430;
            --gold-dark: #D4A820;
            --emerald:   #10B981;
            --off-white: #F8F9FA;
            --white:     #FFFFFF;
            --gray-100:  #F1F3F5;
            --gray-200:  #E9ECEF;
            --gray-300:  #DEE2E6;
            --gray-400:  #ADB5BD;
            --gray-500:  #8C95A3;
            --gray-600:  #6C757D;
            --gray-700:  #495057;
            --gray-800:  #343A40;
            --red:       #EF4444;
            --red-light: #FEF2F2;
            --amber:     #F59E0B;
            --amber-light:#FFFBEB;
            --radius:    12px;
            --radius-lg: 20px;
            --shadow-lg: 0 24px 64px rgba(10,22,40,.18);
            --transition: .22s cubic-bezier(.4,0,.2,1);
        }
        html { scroll-behavior: smooth; }
        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--navy);
            min-height: 100vh;
            display: flex; flex-direction: column;
            overflow-x: hidden;
        }

        /* ── Nav ── */
        .nav {
            background: rgba(10,22,40,.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(244,196,48,.15);
            padding: 16px 24px;
            display: flex; align-items: center; justify-content: space-between;
            position: sticky; top: 0; z-index: 100;
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nav-logo-circle {
            width: 38px; height: 38px; border-radius: 50%;
            background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
            display: flex; align-items: center; justify-content: center;
            font-family: 'Playfair Display', serif; font-weight: 700;
            color: var(--navy); font-size: .9rem;
            box-shadow: 0 4px 12px rgba(244,196,48,.3);
        }
        .nav-logo-text { font-family: 'Playfair Display', serif; font-weight: 700; color: var(--white); font-size: 1.2rem; }
        .nav-logo-text span { color: var(--gold); }
        .nav-right { display: flex; align-items: center; gap: 12px; }
        .nav-link  { color: rgba(255,255,255,.65); text-decoration: none; font-size: .9rem; font-weight: 500; transition: var(--transition); }
        .nav-link:hover { color: var(--white); }
        .btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 22px; border-radius: 50px;
            font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: .875rem;
            cursor: pointer; border: none; text-decoration: none; transition: var(--transition);
        }
        .btn-gold    { background: var(--gold); color: var(--navy); }
        .btn-gold:hover  { background: var(--gold-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(244,196,48,.35); }
        .btn-outline { background: transparent; color: var(--white); border: 2px solid rgba(255,255,255,.3); }
        .btn-outline:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.6); }

        /* ── Page ── */
        .page-main {
            flex: 1; display: flex; align-items: center; justify-content: center;
            padding: 48px 24px;
            background:
                radial-gradient(ellipse 55% 55% at 85% 15%, rgba(244,196,48,.07) 0%, transparent 60%),
                radial-gradient(ellipse 45% 55% at 15% 85%, rgba(16,185,129,.06) 0%, transparent 60%),
                var(--navy);
        }
        .form-container { width: 100%; max-width: 440px; }

        /* ── Card ── */
        .form-card {
            background: var(--white); border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg); overflow: hidden;
        }
        .form-card-header {
            background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%);
            padding: 36px 40px 28px; text-align: center; position: relative; overflow: hidden;
        }
        .form-card-header::before {
            content: ''; position: absolute; inset: 0;
            background: radial-gradient(ellipse 70% 70% at 50% 100%, rgba(244,196,48,.1) 0%, transparent 70%);
        }
        .form-icon {
            width: 60px; height: 60px; border-radius: 50%;
            background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem; margin: 0 auto 16px; position: relative; z-index: 1;
            box-shadow: 0 8px 24px rgba(244,196,48,.4);
        }
        .form-title {
            font-family: 'Playfair Display', serif; font-size: 1.7rem; font-weight: 700;
            color: var(--white); position: relative; z-index: 1;
        }
        .form-subtitle {
            color: rgba(255,255,255,.55); font-size: .875rem; margin-top: 6px;
            position: relative; z-index: 1;
        }
        .form-body { padding: 36px 40px 40px; }

        /* ── Alerts ── */
        .alert {
            padding: 14px 18px; border-radius: 10px; margin-bottom: 24px;
            font-size: .875rem; font-weight: 500; display: flex; align-items: flex-start; gap: 10px;
        }
        .alert-error   { background: var(--red-light);   color: var(--red);   border: 1px solid rgba(239,68,68,.2); }
        .alert-warning { background: var(--amber-light);  color: #92400E;      border: 1px solid rgba(245,158,11,.3); }
        .alert-info    { background: #EFF6FF;              color: #1E40AF;      border: 1px solid rgba(59,130,246,.25); }

        /* ── Fields ── */
        .field-group  { margin-bottom: 20px; }
        .field-label  {
            display: block; font-size: .8rem; font-weight: 600; color: var(--navy);
            margin-bottom: 7px; letter-spacing: .2px;
        }
        .field-wrap   { position: relative; }
        .field-icon   {
            position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
            color: var(--gray-400); font-size: .9rem; pointer-events: none;
            display: flex; align-items: center;
        }
        .field-input  {
            width: 100%; padding: 13px 14px 13px 42px;
            border: 1.5px solid var(--gray-200); border-radius: 10px;
            font-family: 'DM Sans', sans-serif; font-size: .925rem; color: var(--gray-800);
            background: var(--off-white); transition: var(--transition); outline: none;
        }
        .field-input:focus {
            border-color: var(--gold); background: var(--white);
            box-shadow: 0 0 0 4px rgba(244,196,48,.12);
        }
        .field-input.error { border-color: var(--red); background: var(--red-light); }
        .field-input.error:focus { box-shadow: 0 0 0 4px rgba(239,68,68,.1); }
        .field-error {
            color: var(--red); font-size: .78rem; font-weight: 500;
            margin-top: 6px; display: flex; align-items: center; gap: 4px;
        }

        /* Password toggle */
        .pwd-toggle {
            position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
            background: none; border: none; cursor: pointer; color: var(--gray-400);
            display: flex; align-items: center; transition: var(--transition); padding: 4px;
        }
        .pwd-toggle:hover { color: var(--navy); }

        /* Remember / Forgot row */
        .form-row-actions {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 28px; gap: 12px; flex-wrap: wrap;
        }
        .checkbox-wrap {
            display: flex; align-items: center; gap: 8px;
        }
        .checkbox-input {
            width: 17px; height: 17px; border: 2px solid var(--gray-300); border-radius: 4px;
            cursor: pointer; accent-color: var(--gold); flex-shrink: 0;
        }
        .checkbox-label {
            font-size: .85rem; color: var(--gray-700); cursor: pointer;
        }
        .forgot-link {
            font-size: .85rem; color: var(--navy); font-weight: 600;
            text-decoration: none; border-bottom: 2px solid var(--gold);
            transition: var(--transition);
        }
        .forgot-link:hover { color: var(--gold-dark); }

        /* Lockout bar */
        .lockout-bar {
            background: linear-gradient(135deg, #FEF2F2, #FFF5F5);
            border: 1.5px solid rgba(239,68,68,.3);
            border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;
            text-align: center;
        }
        .lockout-bar-title { font-weight: 700; color: var(--red); font-size: .9rem; margin-bottom: 4px; }
        .lockout-bar-desc  { color: #9B1C1C; font-size: .8rem; }
        .lockout-countdown { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; color: var(--red); margin: 8px 0; }

        /* Submit */
        .btn-submit {
            width: 100%; padding: 16px;
            background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
            color: var(--navy); font-family: 'DM Sans', sans-serif; font-size: 1rem;
            font-weight: 700; border: none; border-radius: 12px; cursor: pointer;
            transition: var(--transition); letter-spacing: .2px;
        }
        .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(244,196,48,.45); }
        .btn-submit:disabled { opacity: .5; cursor: not-allowed; }

        /* Divider */
        .form-divider {
            display: flex; align-items: center; gap: 12px;
            margin: 24px 0; color: var(--gray-400); font-size: .8rem;
        }
        .form-divider::before, .form-divider::after {
            content: ''; flex: 1; height: 1px; background: var(--gray-200);
        }

        /* Footer link */
        .form-footer-link {
            text-align: center; font-size: .875rem; color: var(--gray-600);
        }
        .form-footer-link a {
            color: var(--navy); font-weight: 600; text-decoration: none;
            border-bottom: 2px solid var(--gold); transition: var(--transition);
        }
        .form-footer-link a:hover { color: var(--gold-dark); }

        /* Attempts badge */
        .attempts-badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: rgba(245,158,11,.1); color: #92400E;
            border: 1px solid rgba(245,158,11,.3); border-radius: 50px;
            padding: 6px 14px; font-size: .78rem; font-weight: 600; margin-top: 12px;
        }

        /* Trust badges */
        .trust-row { display: flex; justify-content: center; gap: 20px; margin-top: 24px; flex-wrap: wrap; }
        .trust-badge { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,.45); font-size: .78rem; }

        @media (max-width: 480px) {
            .form-body        { padding: 28px 24px 32px; }
            .form-card-header { padding: 28px 24px 24px; }
        }
    </style>
</head>
<body>

<!-- Nav -->
<nav class="nav">
    <a href="/" class="nav-logo">
        <div class="nav-logo-circle">GG</div>
        <span class="nav-logo-text">Grades <span>Guru</span></span>
    </a>
    <div class="nav-right">
        <a href="signup.php" class="nav-link">New here?</a>
        <a href="signup.php" class="btn btn-gold">Sign Up Free</a>
    </div>
</nav>

<!-- Main -->
<main class="page-main">
    <div class="form-container">
        <div class="form-card">
            <!-- Header -->
            <div class="form-card-header">
                <div class="form-icon">👋</div>
                <h1 class="form-title">Welcome Back</h1>
                <p class="form-subtitle">Log in to your Grades Guru portal</p>
            </div>

            <!-- Body -->
            <div class="form-body">

                <?php if ($infoMsg): ?>
                <div class="alert alert-info" role="alert">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <?= htmlspecialchars($infoMsg) ?>
                </div>
                <?php endif; ?>

                <?php if ($isLocked): ?>
                <div class="lockout-bar">
                    <div class="lockout-bar-title">🔒 Account Temporarily Locked</div>
                    <div class="lockout-countdown" id="lockCountdown">15:00</div>
                    <div class="lockout-bar-desc">Too many failed attempts. Please wait before trying again.</div>
                </div>
                <?php elseif (!empty($errors['general'])): ?>
                <div class="alert alert-error" role="alert">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <?= htmlspecialchars($errors['general']) ?>
                </div>
                <?php endif; ?>

                <form method="POST" action="" id="loginForm" novalidate>
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">

                    <!-- Email -->
                    <div class="field-group">
                        <label class="field-label" for="email">Email Address</label>
                        <div class="field-wrap">
                            <span class="field-icon">
                                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </span>
                            <input type="email" id="email" name="email"
                                class="field-input <?= !empty($errors['email']) ? 'error' : '' ?>"
                                value="<?= htmlspecialchars($formEmail) ?>"
                                placeholder="you@example.com"
                                required autocomplete="email"
                                <?= $isLocked ? 'disabled' : '' ?>>
                        </div>
                        <?php if (!empty($errors['email'])): ?>
                            <div class="field-error">⚠ <?= htmlspecialchars($errors['email']) ?></div>
                        <?php endif; ?>
                    </div>

                    <!-- Password -->
                    <div class="field-group">
                        <label class="field-label" for="password">Password</label>
                        <div class="field-wrap">
                            <span class="field-icon">
                                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                            </span>
                            <input type="password" id="password" name="password"
                                class="field-input <?= !empty($errors['password']) ? 'error' : '' ?>"
                                placeholder="Your password"
                                required autocomplete="current-password"
                                <?= $isLocked ? 'disabled' : '' ?>>
                            <button type="button" class="pwd-toggle" id="togglePwd" aria-label="Toggle password">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                        </div>
                        <?php if (!empty($errors['password'])): ?>
                            <div class="field-error">⚠ <?= htmlspecialchars($errors['password']) ?></div>
                        <?php endif; ?>
                    </div>

                    <!-- Remember / Forgot -->
                    <div class="form-row-actions">
                        <label class="checkbox-wrap">
                            <input type="checkbox" name="remember" id="remember" class="checkbox-input" <?= $isLocked ? 'disabled' : '' ?>>
                            <span class="checkbox-label">Remember me</span>
                        </label>
                        <a href="forgot-password.php" class="forgot-link">Forgot Password?</a>
                    </div>

                    <button type="submit" class="btn-submit" id="submitBtn" <?= $isLocked ? 'disabled' : '' ?>>
                        <?= $isLocked ? '🔒 Account Locked' : 'Log In to Portal' ?>
                    </button>
                </form>

                <?php if (!$isLocked && isset($_POST['email']) && !empty($errors)): ?>
                <div style="text-align:center;">
                    <div class="attempts-badge">
                        ⚠ <?= $remaining ?> login attempt<?= $remaining === 1 ? '' : 's' ?> remaining
                    </div>
                </div>
                <?php endif; ?>

                <div class="form-divider">or</div>

                <div class="form-footer-link">
                    Don't have an account? <a href="signup.php">Sign up free</a>
                </div>
            </div>
        </div>

        <!-- Trust badges -->
        <div class="trust-row">
            <div class="trust-badge">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                256-bit SSL Secured
            </div>
            <div class="trust-badge">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Rate Limiting Active
            </div>
        </div>
    </div>
</main>

<script>
// Password toggle
const toggleBtn = document.getElementById('togglePwd');
const pwdInput  = document.getElementById('password');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const isText = pwdInput.type === 'text';
        pwdInput.type = isText ? 'password' : 'text';
        toggleBtn.innerHTML = isText
            ? '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
            : '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    });
}

// Lockout countdown
const countdownEl = document.getElementById('lockCountdown');
if (countdownEl) {
    let seconds = 15 * 60;
    const tick = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(tick);
            location.reload();
            return;
        }
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        countdownEl.textContent = m + ':' + s;
    }, 1000);
}

// Disable submit on submit
const loginForm = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');
if (loginForm && !submitBtn.disabled) {
    loginForm.addEventListener('submit', () => {
        submitBtn.disabled    = true;
        submitBtn.textContent = 'Logging in…';
    });
}
</script>
</body>
</html>
