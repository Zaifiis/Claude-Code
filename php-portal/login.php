<?php
require __DIR__ . '/inc/bootstrap.php';

if (current_user()) {
    redirect(base_url('index.php'));
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $password = (string) ($_POST['password'] ?? '');
    $owner = owner_user();
    if ($owner && $owner['password_hash'] && password_verify($password, $owner['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['uid'] = $owner['id'];
        redirect(base_url('index.php'));
    }
    $error = 'Incorrect password. Try again.';
}

$cfg = $GLOBALS['CONFIG'];
$isDefault = ($cfg['default_password'] === 'changeme');
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in · <?= h($cfg['app_name']) ?></title>
<link rel="stylesheet" href="<?= h(base_url('assets/style.css')) ?>">
</head>
<body>
<div class="login-wrap">
  <form class="login-card" method="post">
    <div class="login-brand">
      <span class="brand-mark">✳</span>
      <strong><?= h($cfg['app_name']) ?></strong>
    </div>
    <h1>Welcome back</h1>
    <p class="sub">Sign in to your content workspace</p>

    <?php if ($error): ?><div class="login-error"><?= h($error) ?></div><?php endif; ?>

    <?= csrf_field() ?>
    <div class="form-field">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" autofocus required autocomplete="current-password">
    </div>
    <button class="btn" type="submit" style="width:100%;justify-content:center">Sign in</button>

    <?php if ($isDefault): ?>
      <p class="login-hint">First time? The default password is <strong>changeme</strong> — change it in Settings after signing in.</p>
    <?php endif; ?>
  </form>
</div>
</body>
</html>
