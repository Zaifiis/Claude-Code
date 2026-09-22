<?php
/** One enquiry: everything submitted, plus status and private notes. */
declare(strict_types=1);
require __DIR__ . '/auth.php';

$user     = require_admin();
$statuses = ['new', 'contacted', 'qualified', 'won', 'lost', 'spam'];

$id = (int) input($_GET, 'id', 12);
if ($id <= 0) {
    redirect('/admin/leads.php');
}

$saved = false;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    require_admin_csrf();

    $newStatus = input($_POST, 'status', 20);
    $update    = ['notes' => input($_POST, 'notes', 8000) ?: null, 'updated_at' => now()];

    if (in_array($newStatus, $statuses, true)) {
        $update['status'] = $newStatus;
    }

    try {
        db_update('leads', $id, $update);
        $saved = true;
    } catch (Throwable $e) {
        error_log('lead update failed: ' . $e->getMessage());
    }
}

try {
    $lead = db_one('SELECT * FROM leads WHERE id = ?', [$id]);
} catch (Throwable $e) {
    error_log('lead fetch failed: ' . $e->getMessage());
    $lead = null;
}

if ($lead === null) {
    admin_head('Not found', $user);
    echo '<div class="shell"><div class="card admin-empty"><h1 class="h3">No such enquiry</h1>'
       . '<p class="muted">It may have been deleted.</p>'
       . '<p><a class="link-arrow" href="/admin/leads.php">Back to the list</a></p></div></div>';
    admin_foot();
    exit;
}

$services = $lead['services'] ? json_decode((string) $lead['services'], true) : [];
$answers  = $lead['answers']  ? json_decode((string) $lead['answers'], true)  : [];
$names    = services();

$facts = [
    'Reference'  => (string) $lead['ref'],
    'Company'    => (string) ($lead['company'] ?? ''),
    'Website'    => (string) ($lead['website'] ?? ''),
    'Phone'      => (string) ($lead['phone'] ?? ''),
    'Team size'  => (string) ($lead['team_size'] ?? ''),
    'Budget'     => (string) ($lead['budget'] ?? ''),
    'Timeline'   => (string) ($lead['timeline'] ?? ''),
    'Fit score'  => $lead['score'] . ' / 100',
    'Type'       => (string) $lead['kind'],
    'Source'     => (string) ($lead['source_page'] ?? ''),
    'Campaign'   => (string) ($lead['utm_campaign'] ?? ''),
    'Referrer'   => (string) ($lead['referrer'] ?? ''),
    'Received'   => format_date((string) $lead['created_at']),
    'Notified'   => $lead['notified_at'] ? format_date((string) $lead['notified_at']) : 'Email not sent',
];

admin_head($lead['name'] . ' — lead', $user);
?>

<div class="shell">
  <p><a class="link-arrow" href="/admin/leads.php">&larr; All leads</a></p>

  <?php if ($saved): ?>
    <div class="alert alert--success"><?= icon('check') ?><span>Saved.</span></div>
  <?php endif; ?>

  <div class="admin-head">
    <div>
      <h1 class="h2"><?= e((string) $lead['name']) ?></h1>
      <p class="muted">
        <a href="mailto:<?= e((string) $lead['email']) ?>"><?= e((string) $lead['email']) ?></a>
        · <span class="status status--<?= e((string) $lead['status']) ?>"><?= e((string) $lead['status']) ?></span>
      </p>
    </div>
    <a class="btn btn--primary btn--sm"
       href="mailto:<?= e((string) $lead['email']) ?>?subject=<?= e(rawurlencode('Re: your enquiry (' . $lead['ref'] . ')')) ?>">
      Reply by email
    </a>
  </div>

  <div class="grid grid--2">
    <div class="card">
      <h2 class="card__title">Details</h2>
      <dl class="facts">
        <?php foreach ($facts as $label => $value): ?>
          <?php if ($value === '') { continue; } ?>
          <dt><?= e((string) $label) ?></dt>
          <dd>
            <?php if ($label === 'Website'): ?>
              <a href="<?= e($value) ?>" target="_blank" rel="noopener noreferrer"><?= e($value) ?></a>
            <?php else: ?>
              <?= e($value) ?>
            <?php endif; ?>
          </dd>
        <?php endforeach; ?>
      </dl>

      <?php if (is_array($services) && $services !== []): ?>
        <h3 class="card__title">Interested in</h3>
        <div class="pill-row">
          <?php foreach ($services as $slug): ?>
            <span class="pill"><?= e($names[$slug]['name'] ?? (string) $slug) ?></span>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

    <div class="card">
      <?php if (!empty($lead['message'])): ?>
        <h2 class="card__title">Their message</h2>
        <p class="quote"><?= nl2br(e((string) $lead['message'])) ?></p>
      <?php endif; ?>

      <?php if (is_array($answers) && $answers !== []): ?>
        <h3 class="card__title">Audit answers</h3>
        <dl class="facts">
          <?php foreach ($answers as $key => $value): ?>
            <?php
              $flat = is_array($value) ? implode(', ', array_map('strval', $value)) : (string) $value;
              if ($flat === '') { continue; }
            ?>
            <dt><?= e(ucfirst(str_replace('_', ' ', (string) $key))) ?></dt>
            <dd><?= e($flat) ?></dd>
          <?php endforeach; ?>
        </dl>
      <?php endif; ?>
    </div>
  </div>

  <form class="card" method="post" action="/admin/lead.php?id=<?= e((string) $lead['id']) ?>">
    <input type="hidden" name="csrf" value="<?= e(csrf_session_token()) ?>">
    <h2 class="card__title">Your working notes</h2>

    <div class="form-grid">
      <div class="field">
        <label class="field__label" for="status">Status</label>
        <div class="select-wrap">
          <select class="select" id="status" name="status">
            <?php foreach ($statuses as $value): ?>
              <option value="<?= e($value) ?>"<?= $lead['status'] === $value ? ' selected' : '' ?>>
                <?= e(ucfirst($value)) ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="notes">Notes</label>
        <textarea class="textarea" id="notes" name="notes"
                  placeholder="What you agreed, what to chase, when."><?= e((string) ($lead['notes'] ?? '')) ?></textarea>
        <p class="field__hint">Only visible here. Never sent to the client.</p>
      </div>

      <button class="btn btn--primary" type="submit">Save</button>
    </div>
  </form>
</div>

<?php admin_foot(); ?>
