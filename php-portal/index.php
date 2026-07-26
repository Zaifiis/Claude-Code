<?php
require __DIR__ . '/inc/bootstrap.php';
$user = require_login();

$counts = content_counts_by_status();
$ideas = $counts['inbox'] + $counts['idea'];
$inProd = 0;
foreach (IN_PRODUCTION_STATUSES as $s) {
    $inProd += $counts[$s];
}
$ready = 0;
foreach (READY_STATUSES as $s) {
    $ready += $counts[$s];
}
$posted = $counts['posted'];

$upcoming = content_list(['status' => 'scheduled', 'order' => 'scheduled_at ASC']);
$recent = array_slice(content_list(['order' => 'updated_at DESC']), 0, 6);
$totals = metrics_totals();

layout_header('Dashboard', 'dashboard');
?>
<p class="subtle" style="margin:-4px 0 20px">Welcome back, <?= h($user['name']) ?>. Here's your content at a glance.</p>

<div class="stats">
  <div class="stat"><div class="stat-label">Ideas & inbox</div><div class="stat-value"><?= $ideas ?></div><div class="stat-sub">waiting to start</div></div>
  <div class="stat"><div class="stat-label">In production</div><div class="stat-value"><?= $inProd ?></div><div class="stat-sub">research → editing</div></div>
  <div class="stat"><div class="stat-label">Ready & scheduled</div><div class="stat-value"><?= $ready ?></div><div class="stat-sub">queued to post</div></div>
  <div class="stat"><div class="stat-label">Posted</div><div class="stat-value"><?= $posted ?></div><div class="stat-sub"><?= h(fmt_num($totals['views'])) ?> total views</div></div>
</div>

<div class="section-head"><h2>Coming up</h2><span class="count"><?= count($upcoming) ?></span><span class="spacer"></span><a class="btn btn-ghost btn-sm" href="<?= h(base_url('calendar.php')) ?>">Open calendar</a></div>
<?php if ($upcoming): ?>
  <div class="grid" style="margin-bottom:28px">
    <?php foreach (array_slice($upcoming, 0, 3) as $it) content_card($it); ?>
  </div>
<?php else: ?>
  <div class="panel" style="margin-bottom:28px"><p class="subtle" style="margin:0">Nothing scheduled yet. Move an item to <strong>Scheduled</strong> and set a date to see it here.</p></div>
<?php endif; ?>

<div class="section-head"><h2>Recent activity</h2><span class="spacer"></span><a class="btn btn-ghost btn-sm" href="<?= h(base_url('pipeline.php')) ?>">Open pipeline</a></div>
<?php content_grid($recent, 'No content yet — create your first item.'); ?>

<?php layout_footer(); ?>
