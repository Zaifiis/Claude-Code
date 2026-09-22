<?php
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';

// Only echo a reference that matches the shape we generate.
$ref  = input($_GET, 'ref', 24);
$ref  = preg_match('/^[A-Z0-9-]{8,24}$/', $ref) === 1 ? $ref : '';
$kind = input($_GET, 'kind', 20) === 'audit' ? 'audit' : 'message';

$calendar = (string) cfg('brand.calendar');

$page = [
    'title'       => 'Thanks',
    'description' => 'Your message is with us. Here is what happens next.',
    'path'        => '/thanks',
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section">
  <div class="shell shell--narrow stack stack--lg">
    <div class="section-head">
      <span class="eyebrow">Received</span>
      <h1><?= $kind === 'audit' ? 'Your audit request is in' : 'Message received' ?></h1>
      <p class="lede">
        A human reads every one of these. You will hear back within one working day —
        usually sooner, and usually with a question.
      </p>
    </div>

    <?php if ($ref !== ''): ?>
      <div class="alert alert--success">
        <?= icon('check') ?>
        <span>Your reference is <strong class="mono"><?= e($ref) ?></strong>. Quote it if you reply to our email.</span>
      </div>
    <?php endif; ?>

    <div class="steps">
      <article class="step">
        <div class="step__num">01</div>
        <h2 class="step__name">We read it properly</h2>
        <p class="step__body">Not a sequence — an actual reply from the person who would do the work.</p>
      </article>
      <article class="step">
        <div class="step__num">02</div>
        <h2 class="step__name">A 45-minute call</h2>
        <p class="step__body">We map where the hours go. No deck, no pitch, camera optional.</p>
      </article>
      <article class="step">
        <div class="step__num">03</div>
        <h2 class="step__name">The written map</h2>
        <p class="step__body">A ranked shortlist with effort and running cost. Yours either way.</p>
      </article>
      <article class="step">
        <div class="step__num">04</div>
        <h2 class="step__name">Your call</h2>
        <p class="step__body">Build it with us, build it yourself, or park it. All fine.</p>
      </article>
    </div>

    <?php if ($calendar !== ''): ?>
      <div class="cta-band">
        <h2>Want to skip the back-and-forth?</h2>
        <p class="lede">Book the call straight into the calendar and we will come prepared.</p>
        <div class="cta-band__actions">
          <a class="btn btn--primary btn--lg" href="<?= e($calendar) ?>" target="_blank" rel="noopener">
            Pick a time <?= icon('arrow') ?>
          </a>
        </div>
      </div>
    <?php endif; ?>

    <p><a class="link-arrow" href="/">Back to the home page <?= icon('arrow') ?></a></p>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
