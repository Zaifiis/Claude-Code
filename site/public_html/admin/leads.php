<?php
/** Lead list: filters, search, pagination and the at-a-glance counts. */
declare(strict_types=1);
require __DIR__ . '/auth.php';

$user = require_admin();

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost', 'spam'];
const PER_PAGE      = 25;

$status = input($_GET, 'status', 20);
$kind   = input($_GET, 'kind', 20);
$query  = input($_GET, 'q', 100);
$sort   = input($_GET, 'sort', 20) === 'score' ? 'score' : 'created_at';
$page   = max(1, (int) input($_GET, 'page', 6));

$where  = [];
$params = [];

if (in_array($status, LEAD_STATUSES, true)) {
    $where[]  = 'status = ?';
    $params[] = $status;
}
if (in_array($kind, ['contact', 'audit'], true)) {
    $where[]  = 'kind = ?';
    $params[] = $kind;
}
if ($query !== '') {
    $where[] = '(name LIKE ? OR email LIKE ? OR company LIKE ? OR ref LIKE ?)';
    $like    = '%' . $query . '%';
    array_push($params, $like, $like, $like, $like);
}

$whereSql = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

$dbUp = db_healthy();
$rows = [];
$total = 0;
$counts = [];

if ($dbUp) {
    try {
        $total = (int) db_value('SELECT COUNT(*) FROM leads' . $whereSql, $params);
        $pages = max(1, (int) ceil($total / PER_PAGE));
        $page  = min($page, $pages);

        // LIMIT/OFFSET are integers we computed ourselves, never user strings.
        $rows = db_all(
            'SELECT * FROM leads' . $whereSql
            . ' ORDER BY ' . $sort . ' DESC, id DESC'
            . ' LIMIT ' . PER_PAGE . ' OFFSET ' . (($page - 1) * PER_PAGE),
            $params
        );

        foreach (db_all('SELECT status, COUNT(*) AS n FROM leads GROUP BY status') as $row) {
            $counts[(string) $row['status']] = (int) $row['n'];
        }
    } catch (Throwable $e) {
        error_log('lead list failed: ' . $e->getMessage());
        $dbUp = false;
    }
}

$pages = max(1, (int) ceil(($total ?: 1) / PER_PAGE));

/** Rebuild the current query string with one parameter changed. */
$linkWith = static function (array $overrides) use ($status, $kind, $query, $sort): string {
    $params = array_filter(array_merge(
        ['status' => $status, 'kind' => $kind, 'q' => $query, 'sort' => $sort],
        $overrides
    ), static fn($v): bool => $v !== '' && $v !== null);
    return '/admin/leads.php' . ($params === [] ? '' : '?' . http_build_query($params));
};

admin_head('Leads', $user);
?>

<div class="shell">

  <?php if (!$dbUp): ?>
    <div class="alert alert--error">
      <?= icon('close') ?>
      <span>Cannot reach the database. Check the <code>DB_*</code> values in <code>.env</code>.</span>
    </div>
  <?php endif; ?>

  <div class="admin-head">
    <div>
      <h1 class="h2">Leads</h1>
      <p class="muted"><?= e((string) $total) ?> matching <?= $total === 1 ? 'enquiry' : 'enquiries' ?></p>
    </div>
    <a class="btn btn--ghost btn--sm" href="/admin/export.php?<?= e(http_build_query(['status' => $status, 'kind' => $kind, 'q' => $query])) ?>">
      Export CSV
    </a>
  </div>

  <div class="chip-row">
    <a class="chip<?= $status === '' ? ' chip--on' : '' ?>" href="<?= e($linkWith(['status' => '', 'page' => ''])) ?>">
      All
    </a>
    <?php foreach (LEAD_STATUSES as $value): ?>
      <a class="chip<?= $status === $value ? ' chip--on' : '' ?>"
         href="<?= e($linkWith(['status' => $value, 'page' => ''])) ?>">
        <?= e(ucfirst($value)) ?>
        <?php if (!empty($counts[$value])): ?>
          <span class="chip__count"><?= e((string) $counts[$value]) ?></span>
        <?php endif; ?>
      </a>
    <?php endforeach; ?>
  </div>

  <form class="admin-filters" method="get" action="/admin/leads.php">
    <input type="hidden" name="status" value="<?= e($status) ?>">
    <label class="sr-only" for="q">Search leads</label>
    <input class="input" type="search" id="q" name="q" value="<?= e($query) ?>"
           placeholder="Search name, email, company or reference">
    <div class="select-wrap">
      <label class="sr-only" for="kind">Type</label>
      <select class="select" id="kind" name="kind">
        <option value="">All types</option>
        <option value="contact"<?= $kind === 'contact' ? ' selected' : '' ?>>Contact form</option>
        <option value="audit"<?= $kind === 'audit' ? ' selected' : '' ?>>Audit request</option>
      </select>
    </div>
    <div class="select-wrap">
      <label class="sr-only" for="sort">Sort</label>
      <select class="select" id="sort" name="sort">
        <option value="created_at"<?= $sort === 'created_at' ? ' selected' : '' ?>>Newest first</option>
        <option value="score"<?= $sort === 'score' ? ' selected' : '' ?>>Best fit first</option>
      </select>
    </div>
    <button class="btn btn--primary" type="submit">Filter</button>
  </form>

  <?php if ($rows === []): ?>
    <div class="card admin-empty">
      <h2 class="h3"><?= $total === 0 && $query === '' ? 'No enquiries yet' : 'Nothing matches that' ?></h2>
      <p class="muted">
        <?= $total === 0 && $query === ''
            ? 'They will appear here the moment someone uses the contact form or the audit.'
            : 'Try a broader search or clear the filters.' ?>
      </p>
    </div>
  <?php else: ?>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Who</th>
            <th scope="col">Type</th>
            <th scope="col">Fit</th>
            <th scope="col">Status</th>
            <th scope="col">Received</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($rows as $row): ?>
            <tr>
              <th scope="row">
                <a class="table__link" href="/admin/lead.php?id=<?= e((string) $row['id']) ?>">
                  <?= e((string) $row['name']) ?>
                </a>
                <span class="table__sub">
                  <?= e((string) $row['email']) ?><?= $row['company'] ? ' · ' . e((string) $row['company']) : '' ?>
                </span>
              </th>
              <td><span class="pill"><?= e((string) $row['kind']) ?></span></td>
              <td>
                <span class="score score--<?= (int) $row['score'] >= 70 ? 'high' : ((int) $row['score'] >= 45 ? 'mid' : 'low') ?>">
                  <?= e((string) $row['score']) ?>
                </span>
              </td>
              <td><span class="status status--<?= e((string) $row['status']) ?>"><?= e((string) $row['status']) ?></span></td>
              <td class="muted"><?= e(format_date((string) $row['created_at'])) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <?php if ($pages > 1): ?>
      <nav class="pager" aria-label="Pagination">
        <?php if ($page > 1): ?>
          <a class="btn btn--ghost btn--sm" href="<?= e($linkWith(['page' => (string) ($page - 1)])) ?>">Previous</a>
        <?php endif; ?>
        <span class="muted">Page <?= e((string) $page) ?> of <?= e((string) $pages) ?></span>
        <?php if ($page < $pages): ?>
          <a class="btn btn--ghost btn--sm" href="<?= e($linkWith(['page' => (string) ($page + 1)])) ?>">Next</a>
        <?php endif; ?>
      </nav>
    <?php endif; ?>
  <?php endif; ?>
</div>

<?php admin_foot(); ?>
