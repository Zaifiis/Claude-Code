<?php
require __DIR__ . '/inc/bootstrap.php';
$user = require_login();

$id = (string) ($_GET['id'] ?? ($_POST['id'] ?? ''));
$editing = $id !== '';
$item = $editing ? content_get($id) : null;
if ($editing && !$item) {
    http_response_code(404);
    exit('Content not found');
}

// --- Save ------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();

    $data = [
        'title'          => trim((string) ($_POST['title'] ?? '')),
        'description'    => trim((string) ($_POST['description'] ?? '')),
        'hook'           => trim((string) ($_POST['hook'] ?? '')),
        'script'         => (string) ($_POST['script'] ?? ''),
        'cta'            => trim((string) ($_POST['cta'] ?? '')),
        'notes'          => trim((string) ($_POST['notes'] ?? '')),
        'angle'          => trim((string) ($_POST['angle'] ?? '')),
        'category'       => trim((string) ($_POST['category'] ?? '')),
        'content_pillar' => trim((string) ($_POST['content_pillar'] ?? '')),
        'platform'       => isset(PLATFORMS[$_POST['platform'] ?? '']) ? $_POST['platform'] : 'other',
        'format'         => isset(FORMATS[$_POST['format'] ?? '']) ? $_POST['format'] : 'other',
        'status'         => isset(STATUSES[$_POST['status'] ?? '']) ? $_POST['status'] : 'idea',
        'priority'       => isset(PRIORITIES[$_POST['priority'] ?? '']) ? $_POST['priority'] : 'medium',
        'scheduled_at'   => datetime_local_to_sql($_POST['scheduled_at'] ?? ''),
    ];
    if ($data['title'] === '') {
        $data['title'] = 'Untitled';
    }
    $tags = parse_tags((string) ($_POST['tags'] ?? ''));

    if ($editing) {
        $published = $item['published_at'];
        if ($data['status'] === 'posted' && empty($published)) {
            $published = now_sql();
        }
        db()->prepare(
            'UPDATE content_items SET title=?, description=?, hook=?, script=?, cta=?, notes=?, angle=?,
             category=?, content_pillar=?, platform=?, format=?, status=?, priority=?, scheduled_at=?,
             published_at=?, updated_at=? WHERE id=?'
        )->execute([
            $data['title'], $data['description'], $data['hook'], $data['script'], $data['cta'], $data['notes'],
            $data['angle'], $data['category'], $data['content_pillar'], $data['platform'], $data['format'],
            $data['status'], $data['priority'], $data['scheduled_at'], $published, now_sql(), $id,
        ]);
        set_content_tags($id, $tags);
        flash('Changes saved.');
        redirect(base_url('content.php?id=' . urlencode($id)));
    }

    $id = uuid();
    $published = ($data['status'] === 'posted') ? now_sql() : null;
    db()->prepare(
        'INSERT INTO content_items
         (id, user_id, title, description, hook, script, cta, notes, angle, category, content_pillar,
          platform, format, status, priority, scheduled_at, published_at, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id, $user['id'], $data['title'], $data['description'], $data['hook'], $data['script'], $data['cta'],
        $data['notes'], $data['angle'], $data['category'], $data['content_pillar'], $data['platform'],
        $data['format'], $data['status'], $data['priority'], $data['scheduled_at'], $published, now_sql(), now_sql(),
    ]);
    set_content_tags($id, $tags);
    flash('Content created.');
    redirect(base_url('content.php?id=' . urlencode($id)));
}

// --- Render form -----------------------------------------------------------
$v = fn(string $k, $d = '') => h((string) ($item[$k] ?? $d));
$tagsStr = $item ? implode(', ', $item['tags']) : '';

layout_header($editing ? 'Edit content' : 'New content', $editing ? '' : '');
?>
<p style="margin:-4px 0 16px"><a href="<?= h($editing ? base_url('content.php?id=' . urlencode($id)) : base_url('pipeline.php')) ?>" class="subtle">← Back</a></p>
<div class="section-head"><h2><?= $editing ? 'Edit content' : 'New content' ?></h2></div>

<form class="form" method="post">
  <?= csrf_field() ?>
  <?php if ($editing): ?><input type="hidden" name="id" value="<?= h($id) ?>"><?php endif; ?>

  <div class="form-field full">
    <label for="title">Title</label>
    <input type="text" id="title" name="title" value="<?= $v('title') ?>" placeholder="What's this piece about?" autofocus>
  </div>

  <div class="form-field full">
    <label for="description">Description</label>
    <textarea id="description" name="description" placeholder="One or two lines on the concept" style="min-height:70px"><?= $v('description') ?></textarea>
  </div>

  <div class="form-grid">
    <div class="form-field">
      <label for="platform">Platform</label>
      <select id="platform" name="platform">
        <?php foreach (PLATFORMS as $k => $o): ?><option value="<?= h($k) ?>"<?= ($item['platform'] ?? 'other') === $k ? ' selected' : '' ?>><?= h($o['label']) ?></option><?php endforeach; ?>
      </select>
    </div>
    <div class="form-field">
      <label for="format">Format</label>
      <select id="format" name="format">
        <?php foreach (FORMATS as $k => $o): ?><option value="<?= h($k) ?>"<?= ($item['format'] ?? 'other') === $k ? ' selected' : '' ?>><?= h($o['label']) ?></option><?php endforeach; ?>
      </select>
    </div>
    <div class="form-field">
      <label for="status">Stage</label>
      <select id="status" name="status">
        <?php foreach (STATUSES as $k => $o): ?><option value="<?= h($k) ?>"<?= ($item['status'] ?? 'idea') === $k ? ' selected' : '' ?>><?= h($o['label']) ?></option><?php endforeach; ?>
      </select>
    </div>
    <div class="form-field">
      <label for="priority">Priority</label>
      <select id="priority" name="priority">
        <?php foreach (PRIORITIES as $k => $o): ?><option value="<?= h($k) ?>"<?= ($item['priority'] ?? 'medium') === $k ? ' selected' : '' ?>><?= h($o['label']) ?></option><?php endforeach; ?>
      </select>
    </div>
  </div>

  <div class="form-field full">
    <label for="hook">Hook</label>
    <textarea id="hook" name="hook" placeholder="The first line that stops the scroll" style="min-height:70px"><?= $v('hook') ?></textarea>
  </div>

  <div class="form-field full">
    <label for="script">Script</label>
    <textarea id="script" name="script" placeholder="Write the full script or post copy here…" style="min-height:180px"><?= $v('script') ?></textarea>
  </div>

  <div class="form-field full">
    <label for="cta">Call to action</label>
    <textarea id="cta" name="cta" placeholder="What should the viewer do?" style="min-height:60px"><?= $v('cta') ?></textarea>
  </div>

  <div class="form-grid">
    <div class="form-field">
      <label for="category">Category</label>
      <input type="text" id="category" name="category" value="<?= $v('category') ?>" placeholder="e.g. Thought leadership">
    </div>
    <div class="form-field">
      <label for="content_pillar">Content pillar</label>
      <input type="text" id="content_pillar" name="content_pillar" value="<?= $v('content_pillar') ?>" placeholder="e.g. AI strategy">
    </div>
    <div class="form-field">
      <label for="angle">Angle</label>
      <input type="text" id="angle" name="angle" value="<?= $v('angle') ?>" placeholder="e.g. Contrarian">
    </div>
    <div class="form-field">
      <label for="scheduled_at">Schedule date</label>
      <input type="datetime-local" id="scheduled_at" name="scheduled_at" value="<?= h(sql_to_datetime_local($item['scheduled_at'] ?? '')) ?>">
    </div>
  </div>

  <div class="form-field full">
    <label for="tags">Tags <span class="hint">(comma separated)</span></label>
    <input type="text" id="tags" name="tags" value="<?= h($tagsStr) ?>" placeholder="ai, hooks, linkedin">
  </div>

  <div class="form-actions">
    <button class="btn" type="submit"><?= $editing ? 'Save changes' : 'Create content' ?></button>
    <a class="btn btn-ghost" href="<?= h($editing ? base_url('content.php?id=' . urlencode($id)) : base_url('pipeline.php')) ?>">Cancel</a>
  </div>
</form>

<?php layout_footer(); ?>
