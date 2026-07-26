<?php
require __DIR__ . '/inc/bootstrap.php';
$user = require_login();

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = $_POST['action'] ?? '';

    if ($action === 'profile') {
        $name = trim((string) ($_POST['name'] ?? ''));
        $email = trim((string) ($_POST['email'] ?? ''));
        if ($name === '') {
            $name = 'You';
        }
        db()->prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')->execute([$name, $email, $user['id']]);
        flash('Profile updated.');
        redirect(base_url('settings.php'));
    }

    if ($action === 'password') {
        $current = (string) ($_POST['current'] ?? '');
        $new = (string) ($_POST['new'] ?? '');
        $confirm = (string) ($_POST['confirm'] ?? '');
        if (!password_verify($current, $user['password_hash'])) {
            $error = 'Current password is incorrect.';
        } elseif (strlen($new) < 6) {
            $error = 'New password must be at least 6 characters.';
        } elseif ($new !== $confirm) {
            $error = 'New passwords do not match.';
        } else {
            db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                ->execute([password_hash($new, PASSWORD_DEFAULT), $user['id']]);
            flash('Password changed.');
            redirect(base_url('settings.php'));
        }
    }
}

$cfg = $GLOBALS['CONFIG'];
$usingDefault = password_verify($cfg['default_password'], $user['password_hash']);

layout_header('Settings', 'settings');
?>
<div class="section-head"><h2>Settings</h2></div>

<?php if ($usingDefault): ?>
  <div class="login-error" style="max-width:860px;margin-bottom:18px">⚠ You're still using the default password. Set a new one below to secure your portal.</div>
<?php endif; ?>
<?php if ($error): ?><div class="login-error" style="max-width:860px;margin-bottom:18px"><?= h($error) ?></div><?php endif; ?>

<form class="form" method="post" style="margin-bottom:22px">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="profile">
  <div class="section-head"><h2 style="font-size:15px">Profile</h2></div>
  <div class="form-grid">
    <div class="form-field">
      <label for="name">Display name</label>
      <input type="text" id="name" name="name" value="<?= h($user['name']) ?>">
    </div>
    <div class="form-field">
      <label for="email">Email <span class="hint">(label only)</span></label>
      <input type="email" id="email" name="email" value="<?= h($user['email']) ?>">
    </div>
  </div>
  <div class="form-actions"><button class="btn" type="submit">Save profile</button></div>
</form>

<form class="form" method="post">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="password">
  <div class="section-head"><h2 style="font-size:15px">Change password</h2></div>
  <div class="form-grid">
    <div class="form-field full">
      <label for="current">Current password</label>
      <input type="password" id="current" name="current" autocomplete="current-password" required>
    </div>
    <div class="form-field">
      <label for="new">New password</label>
      <input type="password" id="new" name="new" autocomplete="new-password" required>
    </div>
    <div class="form-field">
      <label for="confirm">Confirm new password</label>
      <input type="password" id="confirm" name="confirm" autocomplete="new-password" required>
    </div>
  </div>
  <div class="form-actions"><button class="btn" type="submit">Change password</button></div>
</form>

<?php layout_footer(); ?>
