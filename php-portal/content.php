<?php
require __DIR__ . '/inc/bootstrap.php';
require_login();

$id = (string) ($_GET['id'] ?? '');

// --- Quick actions ---------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $id = (string) ($_POST['id'] ?? '');
    $action = $_POST['action'] ?? '';
    $item = content_get($id);
    if (!$item) {
        http_response_code(404);
        exit('Not found');
    }

    if ($action === 'status') {
        $new = (string) ($_POST['status'] ?? '');
        if (isset(STATUSES[$new])) {
            $published = ($new === 'posted' && empty($item['published_at'])) ? now_sql() : $item['published_at'];
            db()->prepare('UPDATE content_items SET status = ?, published_at = ?, updated_at = ? WHERE id = ?')
                ->execute([$new, $published, now_sql(), $id]);
            flash('Moved to ' . label_for(STATUSES, $new) . '.');
        }
    } elseif ($action === 'archive') {
        db()->prepare('UPDATE content_items SET archived = 1, updated_at = ? WHERE id = ?')->execute([now_sql(), $id]);
        flash('Content archived.');
        redirect(base_url('pipeline.php'));
    } elseif ($action === 'restore') {
        db()->prepare('UPDATE content_items SET archived = 0, updated_at = ? WHERE id = ?')->execute([now_sql(), $id]);
        flash('Content restored.');
    } elseif ($action === 'delete') {
        db()->prepare('DELETE FROM content_items WHERE id = ?')->execute([$id]);
        flash('Content deleted.');
        redirect(base_url('pipeline.php'));
    } elseif ($action === 'metrics') {
        $fields = ['views', 'likes', 'comments', 'shares', 'saves', 'leads'];
        $vals = [];
        foreach ($fields as $f) {
            $vals[$f] = max(0, (int) ($_POST[$f] ?? 0));
        }
        // Portable upsert (works on both SQLite and MySQL): update if the row
        // exists, otherwise insert.
        $exists = db()->prepare('SELECT 1 FROM performance_metrics WHERE content_id = ?');
        $exists->execute([$id]);
        if ($exists->fetchColumn()) {
            db()->prepare(
                'UPDATE performance_metrics SET views=?, likes=?, comments=?, shares=?, saves=?, leads=?, updated_at=? WHERE content_id=?'
            )->execute([$vals['views'], $vals['likes'], $vals['comments'], $vals['shares'], $vals['saves'], $vals['leads'], now_sql(), $id]);
        } else {
            db()->prepare(
                'INSERT INTO performance_metrics (content_id, views, likes, comments, shares, saves, leads, updated_at)
                 VALUES (?,?,?,?,?,?,?,?)'
            )->execute([$id, $vals['views'], $vals['likes'], $vals['comments'], $vals['shares'], $vals['saves'], $vals['leads'], now_sql()]);
        }
        flash('Metrics saved.');
    }
    redirect(base_url('content.php?id=' . urlencode($id)));
}

$item = content_get($id);
if (!$item) {
    layout_header('Not found', '');
    empty_state('That content item does not exist. It may have been deleted.', '← Back to pipeline', base_url('pipeline.php'));
    layout_footer();
    exit;
}

$m = $item['metrics'];
layout_header($item['title'] !== '' ? $item['title'] : 'Untitled', '');
?>
<p style="margin:-4px 0 14px"><a href="<?= h(base_url('pipeline.php')) ?>" class="subtle">← Pipeline</a></p>

<div class="detail">
  <div>
    <h1 class="detail-title"><?= h($item['title'] !== '' ? $item['title'] : 'Untitled') ?></h1>
    <div class="detail-badges">
      <?= platform_badge($item['platform']) ?>
      <span class="pill"><?= h(label_for(FORMATS, $item['format'])) ?></span>
      <?= status_badge($item['status']) ?>
      <?= priority_badge($item['priority']) ?>
    </div>

    <?php if (!empty($item['description'])): ?>
      <div class="panel"><h3>Description</h3><p style="margin:0"><?= nl2br(h($item['description'])) ?></p></div>
    <?php endif; ?>

    <?php if (!empty($item['hook'])): ?>
      <div class="panel"><h3>Hook</h3><p style="margin:0;font-size:17px;font-weight:600;line-height:1.5"><?= nl2br(h($item['hook'])) ?></p></div>
    <?php endif; ?>

    <?php if (!empty($item['script'])): ?>
      <div class="panel"><h3>Script</h3><div class="script-body"><?= nl2br(h($item['script'])) ?></div></div>
    <?php endif; ?>

    <?php if (!empty($item['cta'])): ?>
      <div class="panel"><h3>Call to action</h3><p style="margin:0"><?= nl2br(h($item['cta'])) ?></p></div>
    <?php endif; ?>

    <?php if (!empty($item['notes'])): ?>
      <div class="panel"><h3>Notes</h3><p style="margin:0;color:var(--ink-soft)"><?= nl2br(h($item['notes'])) ?></p></div>
    <?php endif; ?>

    <?php if (!empty($item['references'])): ?>
      <div class="panel">
        <h3>References</h3>
        <?php foreach ($item['references'] as $r): ?>
          <div style="margin-bottom:14px">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
              <?= platform_badge($r['platform']) ?>
              <a href="<?= h($r['url']) ?>" target="_blank" rel="noopener noreferrer nofollow" style="font-weight:600"><?= h($r['title']) ?> ↗</a>
            </div>
            <?php if (!empty($r['embed_url'])): ?>
              <iframe class="embed" src="<?= h($r['embed_url']) ?>" title="<?= h($r['title']) ?>" allowfullscreen loading="lazy"></iframe>
            <?php endif; ?>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>

  <div>
    <div class="panel">
      <h3>Move to stage</h3>
      <form method="post" style="display:flex;gap:8px">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="status">
        <input type="hidden" name="id" value="<?= h($item['id']) ?>">
        <select name="status" onchange="this.form.submit()" style="flex:1">
          <?php foreach (STATUS_ORDER as $s): ?>
            <option value="<?= h($s) ?>"<?= $s === $item['status'] ? ' selected' : '' ?>><?= h(label_for(STATUSES, $s)) ?></option>
          <?php endforeach; ?>
        </select>
        <noscript><button class="btn btn-sm" type="submit">Go</button></noscript>
      </form>
    </div>

    <div class="panel">
      <h3>Details</h3>
      <div class="field-row"><span class="k">Priority</span><span class="v"><?= priority_badge($item['priority']) ?></span></div>
      <?php if (!empty($item['category'])): ?><div class="field-row"><span class="k">Category</span><span class="v"><?= h($item['category']) ?></span></div><?php endif; ?>
      <?php if (!empty($item['content_pillar'])): ?><div class="field-row"><span class="k">Pillar</span><span class="v"><?= h($item['content_pillar']) ?></span></div><?php endif; ?>
      <?php if (!empty($item['angle'])): ?><div class="field-row"><span class="k">Angle</span><span class="v"><?= h($item['angle']) ?></span></div><?php endif; ?>
      <?php if (!empty($item['scheduled_at'])): ?><div class="field-row"><span class="k">Scheduled</span><span class="v"><?= h(fmt_datetime($item['scheduled_at'])) ?></span></div><?php endif; ?>
      <?php if (!empty($item['published_at'])): ?><div class="field-row"><span class="k">Published</span><span class="v"><?= h(fmt_date($item['published_at'])) ?></span></div><?php endif; ?>
      <div class="field-row"><span class="k">Updated</span><span class="v"><?= h(time_ago($item['updated_at'])) ?></span></div>
      <?php if (!empty($item['tags'])): ?>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap"><?php foreach ($item['tags'] as $t): ?><span class="tag">#<?= h($t) ?></span><?php endforeach; ?></div>
      <?php endif; ?>
    </div>

    <div class="panel">
      <h3>Metrics</h3>
      <form method="post">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="metrics">
        <input type="hidden" name="id" value="<?= h($item['id']) ?>">
        <div class="form-grid" style="gap:10px">
          <?php foreach (['views' => 'Views', 'likes' => 'Likes', 'comments' => 'Comments', 'shares' => 'Shares', 'saves' => 'Saves', 'leads' => 'Leads'] as $f => $lbl): ?>
            <div class="form-field" style="margin-bottom:0">
              <label><?= h($lbl) ?></label>
              <input type="number" name="<?= h($f) ?>" min="0" value="<?= (int) ($m[$f] ?? 0) ?>">
            </div>
          <?php endforeach; ?>
        </div>
        <div class="form-actions"><button class="btn btn-sm" type="submit">Save metrics</button></div>
      </form>
    </div>

    <div class="panel">
      <h3>Actions</h3>
      <div style="display:flex;flex-direction:column;gap:8px">
        <a class="btn btn-ghost btn-sm" href="<?= h(base_url('edit.php?id=' . urlencode($item['id']))) ?>">✎ Edit content</a>
        <?php if ((int) $item['archived'] === 1): ?>
          <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="restore"><input type="hidden" name="id" value="<?= h($item['id']) ?>"><button class="btn btn-ghost btn-sm" type="submit" style="width:100%">↺ Restore</button></form>
        <?php else: ?>
          <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="archive"><input type="hidden" name="id" value="<?= h($item['id']) ?>"><button class="btn btn-ghost btn-sm" type="submit" style="width:100%">⌗ Archive</button></form>
        <?php endif; ?>
        <form method="post" onsubmit="return confirm('Delete this content permanently?')"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= h($item['id']) ?>"><button class="btn btn-danger btn-sm" type="submit" style="width:100%">Delete</button></form>
      </div>
    </div>
  </div>
</div>

<?php layout_footer(); ?>
