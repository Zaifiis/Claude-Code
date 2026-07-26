<?php
require __DIR__ . '/inc/bootstrap.php';
require_login();

$items = content_list(['scheduled' => true, 'order' => 'scheduled_at ASC']);

// Group by calendar day.
$byDay = [];
foreach ($items as $it) {
    $day = date('Y-m-d', strtotime($it['scheduled_at']));
    $byDay[$day][] = $it;
}

layout_header('Calendar', 'calendar');
?>
<div class="section-head"><h2>Publishing calendar</h2><span class="count"><?= count($items) ?> scheduled</span></div>
<p class="subtle" style="margin:-8px 0 18px">Everything with a scheduled date, in order.</p>

<?php if (!$byDay): ?>
  <?php empty_state('Nothing scheduled. Set a schedule date on any content item to plan it here.', '+ New content', base_url('edit.php')); ?>
<?php else: ?>
  <?php foreach ($byDay as $day => $dayItems):
      $ts = strtotime($day);
      $isToday = date('Y-m-d') === $day;
      $isPast = $ts < strtotime('today');
      $when = $isToday ? 'Today' : ($isPast ? 'Overdue' : 'In ' . max(1, (int) ceil(($ts - time()) / 86400)) . ' days');
  ?>
    <div class="cal-day">
      <div class="cal-date">
        <?= h(date('l, M j', $ts)) ?>
        <span class="badge-when"<?= $isPast && !$isToday ? ' style="background:#fdeeee;color:#c23b3b"' : '' ?>><?= h($when) ?></span>
      </div>
      <?php foreach ($dayItems as $it): ?>
        <div class="cal-item">
          <span class="cal-time"><?= h(date('g:i A', strtotime($it['scheduled_at']))) ?></span>
          <?= platform_badge($it['platform']) ?>
          <a href="<?= h(base_url('content.php?id=' . urlencode($it['id']))) ?>" style="font-weight:600;flex:1"><?= h($it['title']) ?></a>
          <?= status_badge($it['status']) ?>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endforeach; ?>
<?php endif; ?>

<?php layout_footer(); ?>
