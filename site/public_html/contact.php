<?php
/**
 * Contact page. The form posts back to this URL and is handled entirely
 * server-side, so it works with JavaScript switched off.
 */
declare(strict_types=1);
require __DIR__ . '/inc/leads.php';

$errors = [];
$old    = [];
$sent   = false;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $old = $_POST;

    if (!csrf_verify('contact', input($_POST, 'csrf', 200))) {
        $errors['form'] = 'That form expired. Please try again.';
    } elseif (looks_automated($_POST)) {
        // Answer exactly as we would a genuine submission: a bot that can tell
        // it was caught is a bot that tries again differently.
        $sent = true;
    } elseif (!rate_limit('contact', 5, 3600)) {
        $errors['form'] = 'That is a few messages in a short time. Email us directly at ' . cfg('brand.email') . '.';
    } else {
        $errors = validate_contact($_POST);

        if ($errors === []) {
            $result = lead_store([
                'name'         => input($_POST, 'name', 120),
                'email'        => input($_POST, 'email', 190),
                'company'      => input($_POST, 'company', 160),
                'website'      => normalise_url(input($_POST, 'website', 190)),
                'phone'        => input($_POST, 'phone', 40),
                'team_size'    => '',
                'budget'       => array_key_exists(input($_POST, 'budget', 40), budgets())
                                    ? input($_POST, 'budget', 40) : '',
                'timeline'     => array_key_exists(input($_POST, 'timeline', 40), timelines())
                                    ? input($_POST, 'timeline', 40) : '',
                'services'     => only_allowed((array) ($_POST['services'] ?? []), array_keys(services())),
                'message'      => input($_POST, 'message', 4000),
                'answers'      => [],
                'kind'         => 'contact',
                'source_page'  => '/contact',
                'utm_source'   => input($_GET, 'utm_source', 120),
                'utm_medium'   => input($_GET, 'utm_medium', 120),
                'utm_campaign' => input($_GET, 'utm_campaign', 120),
            ]);

            if ($result['ok']) {
                redirect('/thanks?ref=' . urlencode($result['ref']));
            }
            $errors = $result['errors'];
        }
    }
}

$value = static fn(string $key): string => e(input($old, $key, 4000));

$page = [
    'title'       => 'Contact',
    'description' => 'Tell us what keeps landing on your plate. We reply to every enquiry within one working day.',
    'path'        => '/contact',
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section section--tight">
  <div class="shell">
    <div class="grid grid--2">

      <div class="stack stack--lg">
        <div class="section-head">
          <span class="eyebrow">Contact</span>
          <h1>Tell us what is eating your week</h1>
          <p class="lede">
            A real person reads every message and replies within one working day —
            usually with a question rather than a brochure.
          </p>
        </div>

        <ul class="tick-list">
          <li><?= icon('check') ?><span>No sales sequence. One reply from a human.</span></li>
          <li><?= icon('check') ?><span>Happy to say "this is not worth automating".</span></li>
          <li><?= icon('check') ?><span>Prefer structure? Take the <a class="link-arrow" href="/audit">free audit</a> instead.</span></li>
        </ul>

        <div class="card">
          <h2 class="card__title">Direct</h2>
          <ul class="contact-list">
            <li><?= icon('mail', 'icon icon--sm') ?><a href="mailto:<?= e((string) cfg('brand.email')) ?>"><?= e((string) cfg('brand.email')) ?></a></li>
            <?php if (cfg('brand.linkedin')): ?>
              <li><?= icon('linkedin', 'icon icon--sm') ?><a href="<?= e((string) cfg('brand.linkedin')) ?>" target="_blank" rel="noopener">LinkedIn</a></li>
            <?php endif; ?>
          </ul>
        </div>
      </div>

      <div class="card">
        <?php if ($sent): ?>
          <div class="alert alert--success">
            <?= icon('check') ?>
            <span>Thanks — that is with us. You will hear back within one working day.</span>
          </div>
        <?php else: ?>

          <?php if (!empty($errors['form'])): ?>
            <div class="alert alert--error"><?= icon('close') ?><span><?= e($errors['form']) ?></span></div>
          <?php endif; ?>

          <form method="post" action="/contact" class="form-grid form-grid--2" novalidate>
            <input type="hidden" name="csrf" value="<?= e(csrf_token('contact')) ?>">
            <input type="hidden" name="form_started" value="<?= e(form_timestamp()) ?>">
            <div class="hp" aria-hidden="true">
              <label for="website-url">Leave this field empty</label>
              <input type="text" id="website-url" name="website_url" tabindex="-1" autocomplete="off">
            </div>

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
              <label class="field__label" for="email">Email *</label>
              <input class="input" type="email" id="email" name="email" required
                     autocomplete="email" value="<?= $value('email') ?>"
                     <?= isset($errors['email']) ? 'aria-invalid="true"' : '' ?>>
              <?php if (isset($errors['email'])): ?>
                <p class="field__error"><?= e($errors['email']) ?></p>
              <?php endif; ?>
            </div>

            <div class="field">
              <label class="field__label" for="company">Company</label>
              <input class="input" type="text" id="company" name="company"
                     autocomplete="organization" value="<?= $value('company') ?>">
            </div>

            <div class="field">
              <label class="field__label" for="website">Website</label>
              <input class="input" type="text" id="website" name="website"
                     inputmode="url" placeholder="yourcompany.com" value="<?= $value('website') ?>"
                     <?= isset($errors['website']) ? 'aria-invalid="true"' : '' ?>>
              <?php if (isset($errors['website'])): ?>
                <p class="field__error"><?= e($errors['website']) ?></p>
              <?php endif; ?>
            </div>

            <div class="field">
              <label class="field__label" for="budget">Budget</label>
              <div class="select-wrap">
                <select class="select" id="budget" name="budget">
                  <option value="">Prefer not to say</option>
                  <?php foreach (budgets() as $key => $label): ?>
                    <option value="<?= e($key) ?>"<?= input($old, 'budget', 40) === $key ? ' selected' : '' ?>><?= e($label) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </div>

            <div class="field">
              <label class="field__label" for="timeline">Timeline</label>
              <div class="select-wrap">
                <select class="select" id="timeline" name="timeline">
                  <option value="">Not sure yet</option>
                  <?php foreach (timelines() as $key => $label): ?>
                    <option value="<?= e($key) ?>"<?= input($old, 'timeline', 40) === $key ? ' selected' : '' ?>><?= e($label) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </div>

            <fieldset class="field field--full">
              <legend class="field__label">What are you interested in?</legend>
              <div class="check-grid">
                <?php
                $chosen = only_allowed((array) ($old['services'] ?? []), array_keys(services()));
                foreach (services() as $slug => $service): ?>
                  <label class="check">
                    <input type="checkbox" name="services[]" value="<?= e($slug) ?>"
                           <?= in_array($slug, $chosen, true) ? 'checked' : '' ?>>
                    <span><?= e($service['name']) ?></span>
                  </label>
                <?php endforeach; ?>
              </div>
            </fieldset>

            <div class="field field--full">
              <label class="field__label" for="message">What is the task? *</label>
              <textarea class="textarea" id="message" name="message" required
                        placeholder="The thing somebody on your team does every week that nobody enjoys."
                        <?= isset($errors['message']) ? 'aria-invalid="true"' : '' ?>><?= $value('message') ?></textarea>
              <?php if (isset($errors['message'])): ?>
                <p class="field__error"><?= e($errors['message']) ?></p>
              <?php endif; ?>
              <p class="field__hint">The more specific, the more useful our first reply.</p>
            </div>

            <div class="field field--full">
              <button class="btn btn--primary btn--lg btn--block" type="submit">
                Send it <?= icon('arrow') ?>
              </button>
              <p class="field__hint">
                We use your details to reply to this enquiry and nothing else.
                See our <a href="/privacy">privacy notice</a>.
              </p>
            </div>
          </form>
        <?php endif; ?>
      </div>

    </div>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
