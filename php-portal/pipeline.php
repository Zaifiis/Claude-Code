<?php
require __DIR__ . '/inc/bootstrap.php';
require_login();

$all = content_list(['order' => PRIORITY_ORDER_SQL]);
$byStatus = array_fill_keys(STATUS_ORDER, []);
foreach ($all as $it) {
    $byStatus[$it['status']][] = $it;
}

layout_header('Pipeline', 'pipeline');
?>
<div class="section-head"><h2>Production pipeline</h2><span class="count"><?= count($all) ?> items</span><span class="spacer"></span><a class="btn btn-sm" href="<?= h(base_url('edit.php')) ?>">+ New content</a></div>
<p class="subtle" style="margin:-8px 0 16px">Every piece, by stage. Open a card to move it forward.</p>

<div class="board">
  <?php foreach (STATUS_ORDER as $status): $items = $byStatus[$status]; ?>
    <div class="column">
      <div class="column-head">
        <span class="dot" style="background:<?= h(color_for(STATUSES, $status)) ?>"></span>
        <span class="title"><?= h(label_for(STATUSES, $status)) ?></span>
        <span class="count"><?= count($items) ?></span>
      </div>
      <?php if (!$items): ?>
        <div class="column-empty">—</div>
      <?php else: foreach ($items as $it) content_card($it); endif; ?>
    </div>
  <?php endforeach; ?>
</div>

<?php layout_footer(); ?>
