<?php
/**
 * Grades Guru — Forgot Password (step 1: request reset)
 */
declare(strict_types=1);
require_once 'config.php';
require_once 'includes/db.php';
require_once 'includes/auth.php';
require_once 'includes/functions.php';
require_once 'includes/mailer.php';

if (isLoggedIn()) redirect(APP_URL . '/');

$errors  = [];
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid request. Please try again.';
    } else {
        $email = trim($_POST['email'] ?? '');
        if (empty($email) || !isValidEmail($email)) {
            $errors[] = 'Please enter a valid email address.';
        }

        if (empty($errors)) {
            $pdo = getPDO();
            $stmt = $pdo->prepare("SELECT id, name, status FROM users WHERE email=? LIMIT 1");
            $stmt->execute([$email]);
            $foundUser = $stmt->fetch();

            // Always show success to prevent email enumeration
            if ($foundUser && $foundUser['status'] === 'active') {
                $token   = bin2hex(random_bytes(32));
                $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

                // Store reset token (using settings table as a lightweight store)
                $pdo->prepare(
                    "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)"
                )->execute(["reset_{$foundUser['id']}", json_encode(['token'=>$token,'expires'=>$expires,'email'=>$email])]);

                $resetLink = APP_URL . "/reset-password.php?token=$token&uid={$foundUser['id']}";
                // Send email (simple inline — mailer.php handles wrapping)
                $subject = APP_NAME . ' — Password Reset';
                $body = "
                <p>Hi {$foundUser['name']},</p>
                <p>We received a request to reset your password. Click the button below within 1 hour:</p>
                <p style='text-align:center;margin:2rem 0'>
                  <a href='$resetLink' style='background:#0A1628;color:#F4C430;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block'>
                    Reset My Password
                  </a>
                </p>
                <p style='font-size:.85em;color:#666'>Or copy this link:<br><a href='$resetLink'>$resetLink</a></p>
                <p style='font-size:.85em;color:#666'>If you did not request this, ignore this email.</p>
                ";
                $headers  = "MIME-Version: 1.0\r\n";
                $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
                $headers .= "From: " . APP_NAME . " <noreply@" . parse_url(APP_URL, PHP_URL_HOST) . ">\r\n";
                @mail($email, $subject, $body, $headers);
            }

            $success = true;
        }
    }
}

$csrfToken = getCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forgot Password — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="assets/css/main.css">
  <style>
  body{background:var(--bg);display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem;}
  .auth-card{background:var(--card-bg,#fff);border:1px solid var(--border);border-radius:16px;padding:2.5rem;width:100%;max-width:420px;box-shadow:0 8px 32px rgba(10,22,40,.1);}
  .auth-logo{display:flex;align-items:center;gap:.75rem;justify-content:center;margin-bottom:2rem;text-decoration:none;}
  .auth-logo-icon{width:48px;height:48px;background:#0A1628;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#F4C430;font-weight:700;font-size:1.1rem;font-family:'Playfair Display',serif;}
  .auth-logo-name{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;color:#0A1628;}
  .auth-title{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:#0A1628;text-align:center;margin-bottom:.5rem;}
  .auth-subtitle{font-size:.875rem;color:var(--text-muted,#64748b);text-align:center;margin-bottom:1.75rem;}
  .form-group{margin-bottom:1.25rem;}
  .form-label{display:block;font-size:.8125rem;font-weight:600;color:var(--text-muted,#64748b);margin-bottom:.375rem;}
  .form-control{width:100%;padding:.7rem 1rem;border:1.5px solid var(--border,#e5e7eb);border-radius:8px;font-size:.9rem;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s;box-sizing:border-box;background:var(--bg,#f8f9fa);}
  .form-control:focus{border-color:#0A1628;box-shadow:0 0 0 3px rgba(10,22,40,.08);}
  .btn-submit{width:100%;padding:.8rem;background:#0A1628;color:#F4C430;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .2s;}
  .btn-submit:hover{opacity:.88;}
  .alert{border-radius:8px;padding:.875rem 1rem;font-size:.875rem;margin-bottom:1.25rem;}
  .alert-error{background:#fef2f2;color:#7f1d1d;border:1px solid #fca5a5;}
  .alert-success{background:#f0fdf4;color:#14532d;border:1px solid #86efac;}
  .auth-footer{text-align:center;margin-top:1.5rem;font-size:.875rem;color:var(--text-muted,#64748b);}
  .auth-footer a{color:#0A1628;font-weight:600;text-decoration:none;}
  .auth-footer a:hover{text-decoration:underline;}
  </style>
</head>
<body>
<div class="auth-card">
  <a href="<?= APP_URL ?>" class="auth-logo">
    <div class="auth-logo-icon">GG</div>
    <div class="auth-logo-name"><?= APP_NAME ?></div>
  </a>

  <?php if($success): ?>
  <div class="alert alert-success">
    <i class="fa-solid fa-envelope-circle-check"></i>
    If that email is registered and active, you will receive a password reset link shortly. Check your inbox (and spam folder).
  </div>
  <div class="auth-footer"><a href="login.php"><i class="fa-solid fa-arrow-left"></i> Back to Login</a></div>

  <?php else: ?>

  <h1 class="auth-title">Forgot Password</h1>
  <p class="auth-subtitle">Enter your email and we'll send you a reset link.</p>

  <?php if(!empty($errors)): ?>
  <div class="alert alert-error"><i class="fa-solid fa-circle-exclamation"></i> <?= implode(' ', array_map('sanitize',$errors)) ?></div>
  <?php endif; ?>

  <form method="POST">
    <input type="hidden" name="csrf_token" value="<?= $csrfToken ?>">
    <div class="form-group">
      <label class="form-label" for="email">Email Address</label>
      <input type="email" id="email" name="email" class="form-control" required
             value="<?= sanitize($_POST['email'] ?? '') ?>" placeholder="you@example.com" autofocus>
    </div>
    <button type="submit" class="btn-submit"><i class="fa-solid fa-paper-plane"></i> Send Reset Link</button>
  </form>

  <div class="auth-footer">
    <a href="login.php"><i class="fa-solid fa-arrow-left"></i> Back to Login</a>
  </div>

  <?php endif; ?>
</div>
</body>
</html>
