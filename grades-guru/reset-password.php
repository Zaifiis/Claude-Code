<?php
/**
 * Grades Guru — Reset Password (step 2: enter new password)
 */
declare(strict_types=1);
require_once 'config.php';
require_once 'includes/db.php';
require_once 'includes/auth.php';
require_once 'includes/functions.php';

if (isLoggedIn()) redirect(APP_URL . '/');

$token  = $_GET['token'] ?? '';
$uid    = (int)($_GET['uid'] ?? 0);
$errors = [];
$done   = false;
$valid  = false;

$pdo = getPDO();

// Validate token
if ($token && $uid) {
    $row = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key=? LIMIT 1");
    $row->execute(["reset_$uid"]);
    $stored = $row->fetchColumn();
    if ($stored) {
        $data = json_decode($stored, true);
        if ($data && $data['token'] === $token && strtotime($data['expires']) > time()) {
            $valid = true;
        }
    }
}

if (!$valid && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    $errors[] = 'This reset link is invalid or has expired. Please request a new one.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid request.';
    } elseif (!$valid) {
        $errors[] = 'Invalid or expired reset link.';
    } else {
        $pwd     = $_POST['password'] ?? '';
        $pwdConf = $_POST['password_confirm'] ?? '';

        if (!isStrongPassword($pwd)) $errors[] = 'Password must be at least 8 characters and include a letter and a number.';
        if ($pwd !== $pwdConf)       $errors[] = 'Passwords do not match.';

        if (empty($errors)) {
            $pdo->prepare("UPDATE users SET password=? WHERE id=?")->execute([password_hash($pwd, PASSWORD_BCRYPT), $uid]);
            // Invalidate token
            $pdo->prepare("DELETE FROM settings WHERE setting_key=?")->execute(["reset_$uid"]);
            $done = true;
        }
    }
}

$csrfToken = getCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password — <?= APP_NAME ?></title>
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
  .strength-bar{height:4px;border-radius:4px;margin-top:.375rem;background:var(--border);transition:all .3s;}
  </style>
</head>
<body>
<div class="auth-card">
  <a href="<?= APP_URL ?>" class="auth-logo">
    <div class="auth-logo-icon">GG</div>
    <div class="auth-logo-name"><?= APP_NAME ?></div>
  </a>

  <?php if($done): ?>
  <div class="alert alert-success">
    <i class="fa-solid fa-shield-check"></i> Password updated successfully!
  </div>
  <p style="text-align:center;font-size:.9rem;color:var(--text-muted)">You can now sign in with your new password.</p>
  <div class="auth-footer" style="margin-top:1rem"><a href="login.php" class="btn-submit" style="display:block;text-align:center;text-decoration:none;padding:.8rem">Sign In</a></div>

  <?php else: ?>

  <h1 class="auth-title">Reset Password</h1>
  <p class="auth-subtitle">Choose a new secure password for your account.</p>

  <?php if(!empty($errors)): ?>
  <div class="alert alert-error"><i class="fa-solid fa-circle-exclamation"></i> <?= implode(' ', array_map('sanitize',$errors)) ?></div>
  <?php endif; ?>

  <?php if($valid): ?>
  <form method="POST" action="reset-password.php?token=<?= urlencode($token) ?>&uid=<?= $uid ?>">
    <input type="hidden" name="csrf_token" value="<?= $csrfToken ?>">
    <div class="form-group">
      <label class="form-label" for="password">New Password</label>
      <input type="password" id="password" name="password" class="form-control" required
             minlength="8" placeholder="Min 8 characters" autofocus oninput="updateStrength(this.value)">
      <div class="strength-bar" id="strengthBar"></div>
    </div>
    <div class="form-group">
      <label class="form-label" for="password_confirm">Confirm New Password</label>
      <input type="password" id="password_confirm" name="password_confirm" class="form-control" required placeholder="Repeat password">
    </div>
    <button type="submit" class="btn-submit"><i class="fa-solid fa-lock"></i> Set New Password</button>
  </form>
  <?php endif; ?>

  <div class="auth-footer">
    <a href="forgot-password.php">Request a new reset link</a> &nbsp;|&nbsp; <a href="login.php">Sign In</a>
  </div>

  <?php endif; ?>
</div>
<script>
function updateStrength(val) {
  const bar = document.getElementById('strengthBar');
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const colors = ['#ef4444','#f97316','#f59e0b','#10B981'];
  const widths  = ['25%','50%','75%','100%'];
  bar.style.width = score > 0 ? widths[score-1] : '0';
  bar.style.background = score > 0 ? colors[score-1] : 'transparent';
}
</script>
</body>
</html>
