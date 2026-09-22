<?php
/** Admin sign-in. */
declare(strict_types=1);
require __DIR__ . '/auth.php';

admin_session_start();

if (admin_user() !== null) {
    redirect('/admin/leads.php');
}

$error   = '';
$expired = input($_GET, 'expired', 4) === '1';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!csrf_session_verify(input($_POST, 'csrf', 200))) {
        $error = 'That form expired. Try again.';
    } elseif (!rate_limit('admin-login', 8, 900)) {
        $error = 'Too many attempts. Wait fifteen minutes and try again.';
    } else {
        $email    = mb_strtolower(input($_POST, 'email', 190));
        $password = (string) ($_POST['password'] ?? '');

        try {
            $user = db_one('SELECT * FROM admin_users WHERE email = ?', [$email]);
        } catch (Throwable $e) {
            error_log('admin login lookup failed: ' . $e->getMessage());
            $user = null;
        }

        if ($user !== null && password_verify($password, (string) $user['password_hash'])) {
            // Re-hash transparently if PHP's default cost has moved on.
            if (password_needs_rehash((string) $user['password_hash'], PASSWORD_DEFAULT)) {
                try {
                    db_update('admin_users', (int) $user['id'], [
                        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                    ]);
                } catch (Throwable $e) {
                    error_log('password rehash failed: ' . $e->getMessage());
                }
            }
            try {
                db_update('admin_users', (int) $user['id'], ['last_login_at' => now()]);
            } catch (Throwable $e) {
                error_log('last_login update failed: ' . $e->getMessage());
            }

            admin_login($user);
            redirect('/admin/leads.php');
        }

        // One message for "no such user" and "wrong password": never confirm
        // which addresses exist.
        $error = 'Those details do not match.';
        usleep(random_int(200000, 500000));
    }
}

admin_head('Sign in');
?>
<div class="admin-login">
  <div class="card">
    <div class="stack">
      <a class="logo" href="/"><?= logo_mark() ?><span class="logo__text"><?= e(brand()) ?></span></a>
      <h1 class="h3">Sign in to the lead desk</h1>

      <?php if ($expired): ?>
        <div class="alert"><?= icon('clock') ?><span>Your session timed out. Sign in again.</span></div>
      <?php endif; ?>
      <?php if ($error !== ''): ?>
        <div class="alert alert--error"><?= icon('close') ?><span><?= e($error) ?></span></div>
      <?php endif; ?>

      <form class="form-grid" method="post" action="/admin/">
        <input type="hidden" name="csrf" value="<?= e(csrf_session_token()) ?>">
        <div class="field">
          <label class="field__label" for="email">Email</label>
          <input class="input" type="email" id="email" name="email" required autocomplete="username">
        </div>
        <div class="field">
          <label class="field__label" for="password">Password</label>
          <input class="input" type="password" id="password" name="password" required
                 autocomplete="current-password">
        </div>
        <button class="btn btn--primary btn--block" type="submit">Sign in</button>
      </form>

      <p class="field__hint">
        No account yet? Create one with the INSERT at the bottom of
        <code>db/schema.sql</code>.
      </p>
    </div>
  </div>
</div>
<?php admin_foot(); ?>
