<?php
require __DIR__ . '/inc/bootstrap.php';
require_login();

$q = trim((string) ($_GET['q'] ?? ''));
$items = $q !== '' ? content_list(['search' => $q, 'order' => 'updated_at DESC']) : [];

layout_header('Search', '');
?>
<div class="section-head"><h2>Search results</h2><?php if ($q !== ''): ?><span class="count"><?= count($items) ?></span><?php endif; ?></div>
<?php if ($q === ''): ?>
  <p class="subtle">Type a query in the search box above to find content by title, hook, script, category or pillar.</p>
<?php else: ?>
  <p class="subtle" style="margin:-8px 0 18px">Matches for “<?= h($q) ?>”.</p>
  <?php content_grid($items, 'No content matched “' . h($q) . '”.'); ?>
<?php endif; ?>
<?php layout_footer(); ?>
