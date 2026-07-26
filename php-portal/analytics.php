<?php
require __DIR__ . '/inc/bootstrap.php';
require_login();

$totals = metrics_totals();
$posted = content_list(['status' => 'posted', 'order' => 'published_at DESC']);

// Rank posted items by views for the leaderboard.
$ranked = $posted;
usort($ranked, fn($a, $b) => (int) ($b['metrics']['views'] ?? 0) <=> (int) ($a['metrics']['views'] ?? 0));
$maxViews = 0;
foreach ($ranked as $r) {
    $maxViews = max($maxViews, (int) ($r['metrics']['views'] ?? 0));
}

$engagement = $totals['views'] > 0
    ? round(($totals['likes'] + $totals['comments'] + $totals['shares'] + $totals['saves']) / $totals['views'] * 100, 1)
    : 0;

layout_header('Analytics', 'analytics');
?>
<div class="section-head"><h2>Performance</h2><span class="count"><?= (int) $totals['tracked'] ?> tracked posts</span></div>

<div class="stats">
  <div class="stat"><div class="stat-label">Total views</div><div class="stat-value"><?= h(fmt_num($totals['views'])) ?></div></div>
  <div class="stat"><div class="stat-label">Likes</div><div class="stat-value"><?= h(fmt_num($totals['likes'])) ?></div></div>
  <div class="stat"><div class="stat-label">Comments</div><div class="stat-value"><?= h(fmt_num($totals['comments'])) ?></div></div>
  <div class="stat"><div class="stat-label">Shares</div><div class="stat-value"><?= h(fmt_num($totals['shares'])) ?></div></div>
  <div class="stat"><div class="stat-label">Saves</div><div class="stat-value"><?= h(fmt_num($totals['saves'])) ?></div></div>
  <div class="stat"><div class="stat-label">Leads</div><div class="stat-value"><?= h(fmt_num($totals['leads'])) ?></div><div class="stat-sub"><?= $engagement ?>% engagement</div></div>
</div>

<div class="section-head"><h2>Top performing posts</h2></div>
<?php if (!$ranked): ?>
  <div class="panel"><p class="subtle" style="margin:0">No posted content with metrics yet. Mark items as <strong>Posted</strong> and add their numbers to see them here.</p></div>
<?php else: ?>
  <div class="panel">
    <?php foreach ($ranked as $it): $v = (int) ($it['metrics']['views'] ?? 0); $pct = $maxViews > 0 ? round($v / $maxViews * 100) : 0; ?>
      <div class="bar-row">
        <a href="<?= h(base_url('content.php?id=' . urlencode($it['id']))) ?>" style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="<?= h($it['title']) ?>"><?= h($it['title']) ?></a>
        <div class="bar-track"><div class="bar-fill" style="width:<?= $pct ?>%"></div></div>
        <div class="bar-val"><?= h(fmt_num($v)) ?></div>
      </div>
    <?php endforeach; ?>
  </div>
<?php endif; ?>

<?php layout_footer(); ?>
