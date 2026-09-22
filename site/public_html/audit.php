<?php
/**
 * Automation audit — the lead magnet.
 *
 * Rendered as a three-step wizard when JavaScript is available and as one long
 * form when it is not. Either way the browser posts the whole thing once.
 */
declare(strict_types=1);
require __DIR__ . '/inc/leads.php';

$errors = [];
$old    = [];
$sent   = false;

$tools = [
    'google'    => 'Google Workspace',
    'microsoft' => 'Microsoft 365',
    'slack'     => 'Slack or Teams',
    'hubspot'   => 'HubSpot / Pipedrive / other CRM',
    'notion'    => 'Notion / Airtable',
    'sheets'    => 'Spreadsheets (a lot of them)',
    'shopify'   => 'Shopify / WooCommerce',
    'xero'      => 'Xero / QuickBooks',
];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $old = $_POST;

    if (!csrf_verify('audit', input($_POST, 'csrf', 200))) {
        $errors['form'] = 'That form expired. Please try again.';
    } elseif (looks_automated($_POST)) {
        $sent = true;
    } elseif (!rate_limit('audit', 4, 3600)) {
        $errors['form'] = 'We have had a few of these from you already. Email us at ' . cfg('brand.email') . '.';
    } else {
        $errors = validate_audit($_POST);

        if ($errors === []) {
            $chosenTasks = only_allowed((array) ($_POST['tasks'] ?? []), array_keys(audit_tasks()));
            $chosenTools = only_allowed((array) ($_POST['tools'] ?? []), array_keys($tools));

            $result = lead_store([
                'name'      => input($_POST, 'name', 120),
                'email'     => input($_POST, 'email', 190),
                'company'   => input($_POST, 'company', 160),
                'website'   => normalise_url(input($_POST, 'website', 190)),
                'phone'     => input($_POST, 'phone', 40),
                'team_size' => array_key_exists(input($_POST, 'team_size', 40), team_sizes())
                                 ? input($_POST, 'team_size', 40) : '',
                'budget'    => array_key_exists(input($_POST, 'budget', 40), budgets())
                                 ? input($_POST, 'budget', 40) : '',
                'timeline'  => array_key_exists(input($_POST, 'timeline', 40), timelines())
                                 ? input($_POST, 'timeline', 40) : '',
                'services'  => [],
                'message'   => input($_POST, 'message', 4000),
                'answers'   => [
                    'tasks'        => array_map(static fn(string $k): string => audit_tasks()[$k], $chosenTasks),
                    'tools'        => array_map(static fn(string $k): string => $tools[$k], $chosenTools),
                    'hours_a_week' => input($_POST, 'hours_a_week', 20),
                    'biggest_win'  => input($_POST, 'message', 4000),
                ],
                'kind'         => 'audit',
                'source_page'  => '/audit',
                'utm_source'   => input($_GET, 'utm_source', 120),
                'utm_medium'   => input($_GET, 'utm_medium', 120),
                'utm_campaign' => input($_GET, 'utm_campaign', 120),
            ]);

            if ($result['ok']) {
                redirect('/thanks?ref=' . urlencode($result['ref']) . '&kind=audit');
            }
            $errors = $result['errors'];
        }
    }
}

$value       = static fn(string $key): string => e(input($old, $key, 4000));
$chosenTasks = only_allowed((array) ($old['tasks'] ?? []), array_keys(audit_tasks()));
$chosenTools = only_allowed((array) ($old['tools'] ?? []), array_keys($tools));

$page = [
    'title'       => 'Free automation audit',
    'description' => 'Six questions, forty-five minutes, and a ranked list of what to automate first. You keep the map whether or not you hire us.',
    'path'        => '/audit',
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section section--tight">
  <div class="shell shell--narrow">
    <div class="section-head">
      <span class="eyebrow">Free audit</span>
      <h1>Find the hours before you spend a penny</h1>
      <p class="lede">
        Six questions now, a forty-five minute call after, and a written map of what
        is worth automating first. Yours to keep either way.
      </p>
    </div>

    <?php if ($sent): ?>
      <div class="alert alert--success">
        <?= icon('check') ?>
        <span>Got it. We will be in touch within one working day to book the call.</span>
      </div>
    <?php else: ?>

      <?php if (!empty($errors['form'])): ?>
        <div class="alert alert--error"><?= icon('close') ?><span><?= e($errors['form']) ?></span></div>
      <?php endif; ?>

      <?php if ($errors !== [] && empty($errors['form'])): ?>
        <div class="alert alert--error">
          <?= icon('close') ?>
          <span>A few answers need fixing — they are marked below.</span>
        </div>
      <?php endif; ?>

      <form class="card wizard" method="post" action="/audit" data-wizard novalidate>
        <input type="hidden" name="csrf" value="<?= e(csrf_token('audit')) ?>">
        <input type="hidden" name="form_started" value="<?= e(form_timestamp()) ?>">
        <div class="hp" aria-hidden="true">
          <label for="audit-website-url">Leave this field empty</label>
          <input type="text" id="audit-website-url" name="website_url" tabindex="-1" autocomplete="off">
        </div>

        <div class="wizard__progress"><div class="wizard__bar" data-wizard-bar></div></div>
        <div class="wizard__meta">
          <span data-wizard-label>Step 1 of 3</span>
          <span>Takes about two minutes</span>
        </div>

        <!-- Step 1 ─────────────────────────────────────────────────────── -->
        <section class="wizard__step" data-step>
          <h2 class="h3">What eats your week?</h2>
          <div class="field" data-require-one>
            <p class="field__hint">Pick everything that applies. *</p>
            <div class="check-grid">
              <?php foreach (audit_tasks() as $key => $label): ?>
                <label class="check">
                  <input type="checkbox" name="tasks[]" value="<?= e($key) ?>"
                         <?= in_array($key, $chosenTasks, true) ? 'checked' : '' ?>>
                  <span><?= e($label) ?></span>
                </label>
              <?php endforeach; ?>
            </div>
            <p class="field__error" data-require-one-error hidden>Pick at least one.</p>
            <?php if (isset($errors['tasks'])): ?>
              <p class="field__error"><?= e($errors['tasks']) ?></p>
            <?php endif; ?>
          </div>

          <div class="field">
            <label class="field__label" for="hours_a_week">Roughly how many hours a week does that cost your team?</label>
            <input class="input" type="number" id="hours_a_week" name="hours_a_week"
                   min="0" max="500" inputmode="numeric" placeholder="e.g. 20"
                   value="<?= $value('hours_a_week') ?>">
          </div>
        </section>

        <!-- Step 2 ─────────────────────────────────────────────────────── -->
        <section class="wizard__step" data-step>
          <h2 class="h3">About the business</h2>
          <div class="form-grid form-grid--2">
            <div class="field">
              <label class="field__label" for="company">Company *</label>
              <input class="input" type="text" id="company" name="company" required
                     autocomplete="organization" value="<?= $value('company') ?>"
                     <?= isset($errors['company']) ? 'aria-invalid="true"' : '' ?>>
              <?php if (isset($errors['company'])): ?>
                <p class="field__error"><?= e($errors['company']) ?></p>
              <?php endif; ?>
            </div>

            <div class="field">
              <label class="field__label" for="website">Website</label>
              <input class="input" type="text" id="website" name="website"
                     inputmode="url" placeholder="yourcompany.com" value="<?= $value('website') ?>">
            </div>

            <div class="field">
              <label class="field__label" for="team_size">Team size</label>
              <div class="select-wrap">
                <select class="select" id="team_size" name="team_size">
                  <option value="">Choose one</option>
                  <?php foreach (team_sizes() as $key => $label): ?>
                    <option value="<?= e($key) ?>"<?= input($old, 'team_size', 40) === $key ? ' selected' : '' ?>><?= e($label) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </div>

            <div class="field">
              <label class="field__label" for="timeline">When would you want this running?</label>
              <div class="select-wrap">
                <select class="select" id="timeline" name="timeline">
                  <option value="">Choose one</option>
                  <?php foreach (timelines() as $key => $label): ?>
                    <option value="<?= e($key) ?>"<?= input($old, 'timeline', 40) === $key ? ' selected' : '' ?>><?= e($label) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <p class="field__label">Which of these do you already run on?</p>
            <div class="check-grid">
              <?php foreach ($tools as $key => $label): ?>
                <label class="check">
                  <input type="checkbox" name="tools[]" value="<?= e($key) ?>"
                         <?= in_array($key, $chosenTools, true) ? 'checked' : '' ?>>
                  <span><?= e($label) ?></span>
                </label>
              <?php endforeach; ?>
            </div>
          </div>
        </section>

        <!-- Step 3 ─────────────────────────────────────────────────────── -->
        <section class="wizard__step" data-step>
          <h2 class="h3">Where do we send the map?</h2>
          <div class="form-grid form-grid--2">
            <div class="field">
              <label class="field__label" for="name">Your name *</label>
              <input class="input" type="text" id="name" name="name" required
                     autocomplete="name" value="<?= $value('name') ?>"
                     <?= isset($errors['name']) ? 'aria-invalid="true"' : '' ?>>
              <?php if (isset($errors['name'])): ?>
                <p class="field__error"><?= e($errors['name']) ?></p>
              <?php endif; ?>
            </div>

            <div class="field">
              <label class="field__label" for="email">Work email *</label>
              <input class="input" type="email" id="email" name="email" required
                     autocomplete="email" value="<?= $value('email') ?>"
                     <?= isset($errors['email']) ? 'aria-invalid="true"' : '' ?>>
              <?php if (isset($errors['email'])): ?>
                <p class="field__error"><?= e($errors['email']) ?></p>
              <?php endif; ?>
            </div>

            <div class="field">
              <label class="field__label" for="phone">Phone</label>
              <input class="input" type="tel" id="phone" name="phone"
                     autocomplete="tel" value="<?= $value('phone') ?>">
            </div>

            <div class="field">
              <label class="field__label" for="budget">Budget in mind</label>
              <div class="select-wrap">
                <select class="select" id="budget" name="budget">
                  <option value="">Still exploring</option>
                  <?php foreach (budgets() as $key => $label): ?>
                    <option value="<?= e($key) ?>"<?= input($old, 'budget', 40) === $key ? ' selected' : '' ?>><?= e($label) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </div>

            <div class="field field--full">
              <label class="field__label" for="message">If one thing got automated tomorrow, what would it be?</label>
              <textarea class="textarea" id="message" name="message"
                        placeholder="Optional, but this is the answer we read first."><?= $value('message') ?></textarea>
            </div>
          </div>
        </section>

        <div class="wizard__actions">
          <button class="btn btn--ghost" type="button" data-wizard-back data-wizard-nav hidden>Back</button>
          <button class="btn btn--primary" type="button" data-wizard-next data-wizard-nav>
            Next <?= icon('arrow') ?>
          </button>
          <button class="btn btn--primary btn--lg" type="submit" data-wizard-submit>
            Send my audit request <?= icon('arrow') ?>
          </button>
        </div>

        <p class="field__hint">
          We use your answers to prepare the audit and nothing else.
          See our <a href="/privacy">privacy notice</a>.
        </p>
      </form>
    <?php endif; ?>
  </div>
</section>

<section class="section section--alt">
  <div class="shell">
    <div class="section-head section-head--center">
      <span class="eyebrow">What you get</span>
      <h2>The audit, specifically</h2>
    </div>
    <div class="grid grid--3">
      <article class="card">
        <div class="card__icon"><?= icon('flow') ?></div>
        <h3 class="card__title">A map of the work</h3>
        <p class="muted">Every recurring task, who owns it, how long it takes and what it touches.</p>
      </article>
      <article class="card">
        <div class="card__icon"><?= icon('chart') ?></div>
        <h3 class="card__title">A ranked shortlist</h3>
        <p class="muted">What to automate first, scored on hours saved against build effort.</p>
      </article>
      <article class="card">
        <div class="card__icon"><?= icon('clock') ?></div>
        <h3 class="card__title">Effort and running cost</h3>
        <p class="muted">Rough build time and monthly running cost for each one, before you commit to anything.</p>
      </article>
    </div>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
