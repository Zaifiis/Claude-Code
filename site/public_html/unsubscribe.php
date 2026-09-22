<?php
/** One-click unsubscribe, reached from the link in every newsletter. */
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';

$token = input($_GET, 'token', 32);
$done  = false;

if (preg_match('/^[a-f0-9]{32}$/', $token) === 1) {
    try {
        $row = db_one('SELECT id FROM subscribers WHERE unsub_token = ?', [$token]);
        if ($row !== null) {
            db_update('subscribers', (int) $row['id'], ['status' => 'unsubscribed']);
            $done = true;
        }
    } catch (Throwable $e) {
        error_log('unsubscribe failed: ' . $e->getMessage());
    }
}

$page = [
    'title'       => 'Unsubscribe',
    'description' => 'Manage your newsletter subscription.',
    'path'        => '/unsubscribe',
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section">
  <div class="shell shell--narrow stack stack--lg">
    <div class="section-head">
      <span class="eyebrow">Newsletter</span>
      <h1><?= $done ? 'You are unsubscribed' : 'We could not find that link' ?></h1>
      <p class="lede">
        <?= $done
            ? 'No more emails from us. No hard feelings — the door stays open.'
            : 'That unsubscribe link looks wrong or has already been used. Email us and we will take care of it.' ?>
      </p>
    </div>
    <p>
      <a class="link-arrow" href="<?= $done ? '/' : 'mailto:' . e((string) cfg('brand.email')) ?>">
        <?= $done ? 'Back to the site' : 'Email us' ?> <?= icon('arrow') ?>
      </a>
    </p>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
