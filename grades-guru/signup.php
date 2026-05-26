<?php
/**
 * Grades Guru — Client Signup Page
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

// Pre-fill referral code from URL param
$refParam = trim($_GET['ref'] ?? '');

// Form state
$errors   = [];
$formData = [
    'name'          => '',
    'email'         => '',
    'phone'         => '',
    'referral_input'=> $refParam,
];
$successMsg = '';

// ─── Handle POST ──────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // CSRF
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors['general'] = 'Security token mismatch. Please refresh and try again.';
    } else {

        // Collect & sanitize
        $name          = trim($_POST['name']           ?? '');
        $email         = strtolower(trim($_POST['email'] ?? ''));
        $phone         = trim($_POST['phone']          ?? '');
        $password      = $_POST['password']            ?? '';
        $confirmPass   = $_POST['confirm_password']    ?? '';
        $referralInput = strtoupper(trim($_POST['referral_code'] ?? ''));
        $terms         = isset($_POST['terms']);

        // Preserve form data for re-display
        $formData = [
            'name'          => sanitize($name),
            'email'         => sanitize($email),
            'phone'         => sanitize($phone),
            'referral_input'=> sanitize($referralInput),
        ];

        // Validate name
        if ($name === '') {
            $errors['name'] = 'Full name is required.';
        } elseif (mb_strlen($name) < 2) {
            $errors['name'] = 'Name must be at least 2 characters.';
        } elseif (mb_strlen($name) > 100) {
            $errors['name'] = 'Name cannot exceed 100 characters.';
        }

        // Validate email
        if ($email === '') {
            $errors['email'] = 'Email address is required.';
        } elseif (!isValidEmail($email)) {
            $errors['email'] = 'Please enter a valid email address.';
        }

        // Validate phone
        if ($phone === '') {
            $errors['phone'] = 'Phone number is required.';
        } elseif (!isValidPhone($phone)) {
            $errors['phone'] = 'Please enter a valid phone number (e.g. +923001234567).';
        }

        // Validate password
        if ($password === '') {
            $errors['password'] = 'Password is required.';
        } elseif (strlen($password) < 8) {
            $errors['password'] = 'Password must be at least 8 characters.';
        }

        // Validate confirm password
        if ($confirmPass === '') {
            $errors['confirm_password'] = 'Please confirm your password.';
        } elseif ($password !== $confirmPass) {
            $errors['confirm_password'] = 'Passwords do not match.';
        }

        // Validate referral code (optional — if provided, must be valid)
        $referrerId = null;
        if ($referralInput !== '') {
            $pdo = getPDO();
            $stmt = $pdo->prepare('SELECT id FROM users WHERE referral_code = ? LIMIT 1');
            $stmt->execute([$referralInput]);
            if (!$stmt->fetch()) {
                $errors['referral_code'] = 'This referral code is invalid or does not exist.';
            }
        }

        // Terms
        if (!$terms) {
            $errors['terms'] = 'You must agree to the Terms of Service to continue.';
        }

        // Check email uniqueness
        if (empty($errors['email'])) {
            $pdo = getPDO();
            $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $errors['email'] = 'An account with this email already exists. Try logging in.';
            }
        }

        // Insert user if no errors
        if (empty($errors)) {
            try {
                $pdo = getPDO();
                Database::beginTransaction();

                $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
                $referralCode   = generateReferralCode($name);

                $stmt = $pdo->prepare(
                    'INSERT INTO users
                        (name, email, phone, password, role, status, referral_code, discount_percentage, spin_used, created_at)
                     VALUES (?, ?, ?, ?, "client", "active", ?, 0.00, 0, NOW())'
                );
                $stmt->execute([$name, $email, $phone, $hashedPassword, $referralCode]);
                $newUserId = (int)$pdo->lastInsertId();

                // Process referral if provided
                if ($referralInput !== '') {
                    processReferral($newUserId, $referralInput);
                }

                // Welcome notification
                createNotification(
                    $pdo,
                    $newUserId,
                    'Welcome to Grades Guru! Your account is ready. Spin the wheel to win your first discount!',
                    'success'
                );

                Database::commit();

                // Welcome email (fail silently)
                try {
                    sendWelcomeEmail($email, $name, $referralCode);
                } catch (Throwable $e) {
                    error_log('Welcome email failed: ' . $e->getMessage());
                }

                // Set session
                $stmt = $pdo->prepare(
                    'SELECT id, name, email, role, referral_code, discount_percentage, spin_used, avatar, status
                     FROM users WHERE id = ? LIMIT 1'
                );
                $stmt->execute([$newUserId]);
                $user = $stmt->fetch();
                setUserSession($user);

                // Redirect to spin page
                redirect(APP_URL . '/client/spin.php');

            } catch (PDOException $e) {
                Database::rollBack();
                error_log('Signup error: ' . $e->getMessage());
                $errors['general'] = 'Registration failed. Please try again.';
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
    <title>Sign Up — Grades Guru</title>
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
            --gray-400:  #ADB5BD;
            --gray-500:  #8C95A3;
            --gray-600:  #6C757D;
            --gray-800:  #343A40;
            --red:       #EF4444;
            --red-light: #FEF2F2;
            --radius:    12px;
            --radius-lg: 20px;
            --shadow-sm: 0 2px 8px rgba(10,22,40,.06);
            --shadow-md: 0 8px 32px rgba(10,22,40,.1);
            --shadow-lg: 0 24px 64px rgba(10,22,40,.16);
            --transition: .22s cubic-bezier(.4,0,.2,1);
        }
        html { scroll-behavior: smooth; }
        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--navy);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
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
        .nav-logo {
            display: flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .nav-logo-circle {
            width: 38px; height: 38px; border-radius: 50%;
            background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
            display: flex; align-items: center; justify-content: center;
            font-family: 'Playfair Display', serif; font-weight: 700;
            color: var(--navy); font-size: .9rem;
            box-shadow: 0 4px 12px rgba(244,196,48,.3);
        }
        .nav-logo-text {
            font-family: 'Playfair Display', serif; font-weight: 700;
            color: var(--white); font-size: 1.2rem;
        }
        .nav-logo-text span { color: var(--gold); }
        .nav-right { display: flex; align-items: center; gap: 12px; }
        .nav-link {
            color: rgba(255,255,255,.65); text-decoration: none; font-size: .9rem;
            font-weight: 500; transition: var(--transition);
        }
        .nav-link:hover { color: var(--white); }
        .btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 22px; border-radius: 50px;
            font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: .875rem;
            cursor: pointer; border: none; text-decoration: none; transition: var(--transition);
        }
        .btn-gold  { background: var(--gold); color: var(--navy); }
        .btn-gold:hover  { background: var(--gold-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(244,196,48,.35); }
        .btn-outline { background: transparent; color: var(--white); border: 2px solid rgba(255,255,255,.3); }
        .btn-outline:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.6); }

        /* ── Page layout ── */
        .page-main {
            flex: 1; display: flex; align-items: center; justify-content: center;
            padding: 48px 24px;
            background:
                radial-gradient(ellipse 60% 60% at 80% 20%, rgba(244,196,48,.07) 0%, transparent 60%),
                radial-gradient(ellipse 50% 50% at 20% 80%, rgba(16,185,129,.06) 0%, transparent 60%),
                var(--navy);
        }
        .form-container {
            width: 100%; max-width: 480px;
        }

        /* ── Card ── */
        .form-card {
            background: var(--white); border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg); overflow: hidden;
        }
        .form-card-header {
            background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%);
            padding: 36px 40px 28px; text-align: center; position: relative;
            overflow: hidden;
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

        /* ── Alert ── */
        .alert {
            padding: 14px 18px; border-radius: 10px; margin-bottom: 24px;
            font-size: .875rem; font-weight: 500; display: flex; align-items: flex-start; gap: 10px;
        }
        .alert-error {
            background: var(--red-light); color: var(--red);
            border: 1px solid rgba(239,68,68,.2);
        }
        .alert-success {
            background: #F0FDF4; color: #166534; border: 1px solid rgba(16,185,129,.25);
        }

        /* ── Form fields ── */
        .field-group { margin-bottom: 20px; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field-label {
            display: block; font-size: .8rem; font-weight: 600; color: var(--navy);
            margin-bottom: 7px; letter-spacing: .2px;
        }
        .field-label .optional {
            color: var(--gray-500); font-weight: 400; font-size: .75rem;
        }
        .field-wrap { position: relative; }
        .field-icon {
            position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
            color: var(--gray-400); font-size: .9rem; pointer-events: none;
            display: flex; align-items: center;
        }
        .field-input {
            width: 100%; padding: 13px 14px 13px 42px;
            border: 1.5px solid var(--gray-200); border-radius: 10px;
            font-family: 'DM Sans', sans-serif; font-size: .925rem; color: var(--gray-800);
            background: var(--off-white); transition: var(--transition);
            outline: none;
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
        .field-hint {
            color: var(--gray-500); font-size: .78rem; margin-top: 5px;
        }

        /* Password toggle */
        .pwd-toggle {
            position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
            background: none; border: none; cursor: pointer; color: var(--gray-400);
            display: flex; align-items: center; transition: var(--transition); padding: 4px;
        }
        .pwd-toggle:hover { color: var(--navy); }

        /* Strength bar */
        .pwd-strength { margin-top: 8px; }
        .pwd-strength-bar {
            height: 4px; border-radius: 4px; background: var(--gray-200); overflow: hidden;
        }
        .pwd-strength-fill {
            height: 100%; border-radius: 4px; transition: width .3s ease, background .3s ease;
            width: 0%;
        }
        .pwd-strength-label { font-size: .75rem; margin-top: 4px; font-weight: 500; }

        /* Checkbox */
        .checkbox-wrap {
            display: flex; align-items: flex-start; gap: 10px; margin-bottom: 28px;
        }
        .checkbox-input {
            width: 18px; height: 18px; border: 2px solid var(--gray-300); border-radius: 5px;
            cursor: pointer; accent-color: var(--gold); flex-shrink: 0; margin-top: 1px;
        }
        .checkbox-label { font-size: .85rem; color: var(--gray-700); line-height: 1.5; cursor: pointer; }
        .checkbox-label a { color: var(--navy); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
        .checkbox-label a:hover { color: var(--gold-dark); }

        /* Submit button */
        .btn-submit {
            width: 100%; padding: 16px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
            color: var(--navy); font-family: 'DM Sans', sans-serif; font-size: 1rem;
            font-weight: 700; border: none; border-radius: 12px; cursor: pointer;
            transition: var(--transition); letter-spacing: .2px;
        }
        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 28px rgba(244,196,48,.45);
        }
        .btn-submit:active { transform: translateY(0); }
        .btn-submit:disabled {
            opacity: .65; cursor: not-allowed; transform: none; box-shadow: none;
        }

        /* Divider */
        .form-divider {
            display: flex; align-items: center; gap: 12px;
            margin: 24px 0; color: var(--gray-400); font-size: .8rem;
        }
        .form-divider::before, .form-divider::after {
            content: ''; flex: 1; height: 1px; background: var(--gray-200);
        }

        /* Login link */
        .form-footer-link {
            text-align: center; font-size: .875rem; color: var(--gray-600);
        }
        .form-footer-link a {
            color: var(--navy); font-weight: 600; text-decoration: none;
            border-bottom: 2px solid var(--gold); transition: var(--transition);
        }
        .form-footer-link a:hover { color: var(--gold-dark); }

        /* Trust badges */
        .trust-row {
            display: flex; justify-content: center; gap: 20px; margin-top: 24px; flex-wrap: wrap;
        }
        .trust-badge {
            display: flex; align-items: center; gap: 6px;
            color: rgba(255,255,255,.5); font-size: .78rem;
        }
        .trust-badge svg { opacity: .6; }

        @media (max-width: 520px) {
            .form-body       { padding: 28px 24px 32px; }
            .form-card-header{ padding: 28px 24px 24px; }
            .field-row       { grid-template-columns: 1fr; gap: 0; }
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
        <a href="login.php" class="nav-link">Already a member?</a>
        <a href="login.php" class="btn btn-outline">Login</a>
    </div>
</nav>

<!-- Main -->
<main class="page-main">
    <div class="form-container">
        <div class="form-card">
            <!-- Header -->
            <div class="form-card-header">
                <div class="form-icon">🎓</div>
                <h1 class="form-title">Create Your Account</h1>
                <p class="form-subtitle">Join 500+ students achieving academic excellence</p>
            </div>

            <!-- Body -->
            <div class="form-body">

                <?php if (!empty($errors['general'])): ?>
                <div class="alert alert-error" role="alert">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <?= htmlspecialchars($errors['general']) ?>
                </div>
                <?php endif; ?>

                <form method="POST" action="" id="signupForm" novalidate>
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">

                    <!-- Name + Phone row -->
                    <div class="field-row">
                        <div class="field-group">
                            <label class="field-label" for="name">Full Name</label>
                            <div class="field-wrap">
                                <span class="field-icon">
                                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </span>
                                <input type="text" id="name" name="name" class="field-input <?= !empty($errors['name']) ? 'error' : '' ?>"
                                    value="<?= $formData['name'] ?>"
                                    placeholder="Ali Raza" required autocomplete="name" maxlength="100">
                            </div>
                            <?php if (!empty($errors['name'])): ?>
                                <div class="field-error">⚠ <?= htmlspecialchars($errors['name']) ?></div>
                            <?php endif; ?>
                        </div>
                        <div class="field-group">
                            <label class="field-label" for="phone">Phone</label>
                            <div class="field-wrap">
                                <span class="field-icon">
                                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                                </span>
                                <input type="tel" id="phone" name="phone" class="field-input <?= !empty($errors['phone']) ? 'error' : '' ?>"
                                    value="<?= $formData['phone'] ?>"
                                    placeholder="+923001234567" required autocomplete="tel" maxlength="20">
                            </div>
                            <?php if (!empty($errors['phone'])): ?>
                                <div class="field-error">⚠ <?= htmlspecialchars($errors['phone']) ?></div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Email -->
                    <div class="field-group">
                        <label class="field-label" for="email">Email Address</label>
                        <div class="field-wrap">
                            <span class="field-icon">
                                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </span>
                            <input type="email" id="email" name="email" class="field-input <?= !empty($errors['email']) ? 'error' : '' ?>"
                                value="<?= $formData['email'] ?>"
                                placeholder="you@example.com" required autocomplete="email" maxlength="255">
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
                            <input type="password" id="password" name="password" class="field-input <?= !empty($errors['password']) ? 'error' : '' ?>"
                                placeholder="Min. 8 characters" required minlength="8" autocomplete="new-password">
                            <button type="button" class="pwd-toggle" id="togglePwd1" aria-label="Toggle password">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" id="eyeIcon1"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                        </div>
                        <?php if (!empty($errors['password'])): ?>
                            <div class="field-error">⚠ <?= htmlspecialchars($errors['password']) ?></div>
                        <?php endif; ?>
                        <div class="pwd-strength" id="pwdStrength" style="display:none;">
                            <div class="pwd-strength-bar"><div class="pwd-strength-fill" id="strengthFill"></div></div>
                            <div class="pwd-strength-label" id="strengthLabel"></div>
                        </div>
                    </div>

                    <!-- Confirm Password -->
                    <div class="field-group">
                        <label class="field-label" for="confirm_password">Confirm Password</label>
                        <div class="field-wrap">
                            <span class="field-icon">
                                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </span>
                            <input type="password" id="confirm_password" name="confirm_password" class="field-input <?= !empty($errors['confirm_password']) ? 'error' : '' ?>"
                                placeholder="Repeat your password" required autocomplete="new-password">
                            <button type="button" class="pwd-toggle" id="togglePwd2" aria-label="Toggle confirm password">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                        </div>
                        <?php if (!empty($errors['confirm_password'])): ?>
                            <div class="field-error">⚠ <?= htmlspecialchars($errors['confirm_password']) ?></div>
                        <?php endif; ?>
                        <div class="field-hint" id="matchHint"></div>
                    </div>

                    <!-- Referral Code -->
                    <div class="field-group">
                        <label class="field-label" for="referral_code">
                            Referral Code <span class="optional">(optional)</span>
                        </label>
                        <div class="field-wrap">
                            <span class="field-icon">🎁</span>
                            <input type="text" id="referral_code" name="referral_code" class="field-input <?= !empty($errors['referral_code']) ? 'error' : '' ?>"
                                value="<?= $formData['referral_input'] ?>"
                                placeholder="e.g. ALIR7K2P" maxlength="8" style="text-transform:uppercase;letter-spacing:2px;">
                        </div>
                        <?php if (!empty($errors['referral_code'])): ?>
                            <div class="field-error">⚠ <?= htmlspecialchars($errors['referral_code']) ?></div>
                        <?php else: ?>
                            <div class="field-hint">Have a friend's referral code? Enter it to help them earn a discount.</div>
                        <?php endif; ?>
                    </div>

                    <!-- Terms -->
                    <div class="checkbox-wrap">
                        <input type="checkbox" id="terms" name="terms" class="checkbox-input"
                            <?= isset($_POST['terms']) ? 'checked' : '' ?> required>
                        <label class="checkbox-label" for="terms">
                            I agree to the <a href="#" target="_blank">Terms of Service</a> and <a href="#" target="_blank">Privacy Policy</a>
                        </label>
                    </div>
                    <?php if (!empty($errors['terms'])): ?>
                        <div class="field-error" style="margin-top:-20px;margin-bottom:16px;">⚠ <?= htmlspecialchars($errors['terms']) ?></div>
                    <?php endif; ?>

                    <button type="submit" class="btn-submit" id="submitBtn">
                        Create Account &amp; Spin to Win 🎰
                    </button>
                </form>

                <div class="form-divider">or</div>

                <div class="form-footer-link">
                    Already have an account? <a href="login.php">Log in here</a>
                </div>
            </div>
        </div>

        <!-- Trust badges -->
        <div class="trust-row">
            <div class="trust-badge">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Secure &amp; Encrypted
            </div>
            <div class="trust-badge">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Free to Join
            </div>
            <div class="trust-badge">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Instant Access
            </div>
        </div>
    </div>
</main>

<script>
// Password toggle helper
function makePwdToggle(toggleId, inputId) {
    const btn   = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    btn.addEventListener('click', () => {
        const isText = input.type === 'text';
        input.type   = isText ? 'password' : 'text';
        btn.innerHTML = isText
            ? '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
            : '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    });
}
makePwdToggle('togglePwd1','password');
makePwdToggle('togglePwd2','confirm_password');

// Password strength
const pwdInput  = document.getElementById('password');
const pwdBar    = document.getElementById('pwdStrength');
const fill      = document.getElementById('strengthFill');
const label     = document.getElementById('strengthLabel');

function calcStrength(p) {
    let s = 0;
    if (p.length >= 8)  s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
}

pwdInput.addEventListener('input', () => {
    const val = pwdInput.value;
    if (!val) { pwdBar.style.display = 'none'; return; }
    pwdBar.style.display = 'block';
    const s = calcStrength(val);
    const map = [
        { w: '20%', c: '#EF4444', t: 'Very weak' },
        { w: '40%', c: '#F97316', t: 'Weak' },
        { w: '60%', c: '#EAB308', t: 'Fair' },
        { w: '80%', c: '#10B981', t: 'Strong' },
        { w: '100%',c: '#059669', t: 'Very strong' },
    ];
    const m = map[Math.min(s, 4)];
    fill.style.width      = m.w;
    fill.style.background = m.c;
    label.textContent     = m.t;
    label.style.color     = m.c;
});

// Confirm password match
const confirmInput = document.getElementById('confirm_password');
const matchHint    = document.getElementById('matchHint');
confirmInput.addEventListener('input', () => {
    if (!confirmInput.value) { matchHint.textContent = ''; return; }
    if (confirmInput.value === pwdInput.value) {
        matchHint.textContent = '✓ Passwords match';
        matchHint.style.color = '#10B981';
    } else {
        matchHint.textContent = '✗ Passwords do not match';
        matchHint.style.color = '#EF4444';
    }
});

// Uppercase referral code on input
document.getElementById('referral_code').addEventListener('input', function() {
    this.value = this.value.toUpperCase();
});

// Disable submit on submit to prevent double-send
document.getElementById('signupForm').addEventListener('submit', function() {
    const btn = document.getElementById('submitBtn');
    btn.disabled    = true;
    btn.textContent = 'Creating account…';
});
</script>
</body>
</html>
