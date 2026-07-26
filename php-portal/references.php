<?php
require __DIR__ . '/inc/bootstrap.php';
$user = require_login();

// --- Handle actions (add / archive / restore / delete) ---------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = $_POST['action'] ?? '';

    if ($action === 'add') {
        $url = trim((string) ($_POST['url'] ?? ''));
        if ($url === '') {
            flash('Enter a URL to add a reference.');
            redirect(base_url('references.php'));
        }
        $parsed = parse_reference($url);
        $title = trim((string) ($_POST['title'] ?? ''));
        if ($title === '') {
            $title = title_from_url($url);
        }
        $id = uuid();
        db()->prepare(
            'INSERT INTO refs (id, user_id, url, platform, title, thumbnail_url, embed_url, notes, archived, created_at)
             VALUES (?,?,?,?,?,?,?,?,0,?)'
        )->execute([
            $id, $user['id'], $parsed['url'], $parsed['platform'], $title,
            $parsed['thumbnail_url'], $parsed['embed_url'], trim((string) ($_POST['notes'] ?? '')), now_sql(),
        ]);
        set_reference_tags($id, parse_tags((string) ($_POST['tags'] ?? '')));
        flash('Reference added.');
        redirect(base_url('references.php'));
    }

    $id = (string) ($_POST['id'] ?? '');
    if ($id !== '') {
        if ($action === 'archive') {
            db()->prepare('UPDATE refs SET archived = 1 WHERE id = ?')->execute([$id]);
            flash('Reference archived.');
        } elseif ($action === 'restore') {
            db()->prepare('UPDATE refs SET archived = 0 WHERE id = ?')->execute([$id]);
            flash('Reference restored.');
        } elseif ($action === 'delete') {
            db()->prepare('DELETE FROM refs WHERE id = ?')->execute([$id]);
            flash('Reference deleted.');
        }
    }
    redirect(base_url('references.php' . (($_POST['view'] ?? '') === 'archived' ? '?view=archived' : '')));
}

$showArchived = ($_GET['view'] ?? '') === 'archived';
$search = trim((string) ($_GET['q'] ?? ''));
$refs = references_list(['archived' => $showArchived ? 1 : 0, 'search' => $search]);

layout_header('Library', 'library');
?>
<div class="section-head">
  <h2>Reference library</h2><span class="count"><?= count($refs) ?></span>
  <span class="spacer"></span>
  <a class="btn btn-ghost btn-sm" href="<?= h(base_url('references.php' . ($showArchived ? '' : '?view=archived'))) ?>">
    <?= $showArchived ? '← Active references' : 'View archived' ?>
  </a>
</div>

<?php if (!$showArchived): ?>
<form class="form" method="post" style="margin-bottom:24px;max-width:none">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="add">
  <div class="form-grid">
    <div class="form-field full">
      <label for="url">Reference URL</label>
      <input type="url" id="url" name="url" placeholder="https://youtube.com/watch?v=… or any post URL" required>
      <span class="hint">Platform, title and thumbnail are detected automatically. YouTube links get a safe embed.</span>
    </div>
    <div class="form-field">
      <label for="title">Title <span class="hint">(optional)</span></label>
      <input type="text" id="title" name="title" placeholder="Auto from URL if left blank">
    </div>
    <div class="form-field">
      <label for="tags">Tags <span class="hint">(comma separated)</span></label>
      <input type="text" id="tags" name="tags" placeholder="hooks, retention">
    </div>
    <div class="form-field full">
      <label for="notes">Notes</label>
      <textarea id="notes" name="notes" placeholder="Why is this worth saving?"></textarea>
    </div>
  </div>
  <div class="form-actions"><button class="btn" type="submit">+ Add reference</button></div>
</form>
<?php endif; ?>

<?php if (!$refs): ?>
  <?php empty_state($showArchived ? 'No archived references.' : 'No references yet. Paste a link above to start your swipe file.'); ?>
<?php else: ?>
  <div class="grid">
    <?php foreach ($refs as $r): ?>
      <div class="card" style="cursor:default">
        <?php if (!empty($r['thumbnail_url'])): ?>
          <img src="<?= h($r['thumbnail_url']) ?>" alt="" loading="lazy" style="width:100%;border-radius:10px;aspect-ratio:16/9;object-fit:cover;background:#eee">
        <?php endif; ?>
        <div class="card-badges">
          <?= platform_badge($r['platform']) ?>
          <?php if ($r['usedCount'] > 0): ?><span class="card-format"><?= (int) $r['usedCount'] ?> use<?= $r['usedCount'] > 1 ? 's' : '' ?></span><?php endif; ?>
        </div>
        <div class="card-title"><?= h($r['title']) ?></div>
        <?php if (!empty($r['notes'])): ?><div class="card-hook"><?= h($r['notes']) ?></div><?php endif; ?>
        <?php if (!empty($r['tags'])): ?>
          <div class="card-tags"><?php foreach ($r['tags'] as $t): ?><span class="tag">#<?= h($t) ?></span><?php endforeach; ?></div>
        <?php endif; ?>
        <div class="card-foot">
          <a href="<?= h($r['url']) ?>" target="_blank" rel="noopener noreferrer nofollow" style="font-weight:600;color:var(--brand-ink)">Open original ↗</a>
          <span style="display:flex;gap:8px">
            <?php if ($showArchived): ?>
              <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="restore"><input type="hidden" name="id" value="<?= h($r['id']) ?>"><input type="hidden" name="view" value="archived"><button class="btn btn-ghost btn-sm" type="submit">Restore</button></form>
              <form method="post" onsubmit="return confirm('Delete this reference permanently?')"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= h($r['id']) ?>"><input type="hidden" name="view" value="archived"><button class="btn btn-danger btn-sm" type="submit">Delete</button></form>
            <?php else: ?>
              <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="archive"><input type="hidden" name="id" value="<?= h($r['id']) ?>"><button class="btn btn-ghost btn-sm" type="submit">Archive</button></form>
            <?php endif; ?>
          </span>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
<?php endif; ?>

<?php layout_footer(); ?>
