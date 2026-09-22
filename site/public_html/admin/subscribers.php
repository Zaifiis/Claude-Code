<?php
/** Newsletter list. */
declare(strict_types=1);
require __DIR__ . '/auth.php';

$user = require_admin();

$rows  = [];
$total = 0;
$dbUp  = db_healthy();

if ($dbUp) {
    try {
        $total = (int) db_value("SELECT COUNT(*) FROM subscribers WHERE status = 'active'");
        $rows  = db_all('SELECT * FROM subscribers ORDER BY created_at DESC LIMIT 500');
    } catch (Throwable $e) {
        error_log('subscriber list failed: ' . $e->getMessage());
        $dbUp = false;
    }
}

admin_head('Subscribers', $user);
?>

<div class="shell">
  <?php if (!$dbUp): ?>
    <div class="alert alert--error"><?= icon('close') ?><span>Cannot reach the database.</span></div>
  <?php endif; ?>

  <div class="admin-head">
    <div>
      <h1 class="h2">Subscribers</h1>
      <p class="muted"><?= e((string) $total) ?> active</p>
    </div>
  </div>

  <?php if ($rows === []): ?>
    <div class="card admin-empty">
      <h2 class="h3">Nobody yet</h2>
      <p class="muted">The footer sign-up form feeds this list.</p>
    </div>
  <?php else: ?>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Email</th>
            <th scope="col">Status</th>
            <th scope="col">Came from</th>
            <th scope="col">Joined</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($rows as $row): ?>
            <tr>
              <th scope="row"><?= e((string) $row['email']) ?></th>
              <td><span class="status status--<?= $row['status'] === 'active' ? 'qualified' : 'lost' ?>"><?= e((string) $row['status']) ?></span></td>
              <td class="muted"><?= e((string) ($row['source_page'] ?? '—')) ?></td>
              <td class="muted"><?= e(format_date((string) $row['created_at'])) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <p class="field__hint">Showing the 500 most recent. Export the full list from your database if you need it.</p>
  <?php endif; ?>
</div>

<?php admin_foot(); ?>
