<?php
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';

$page = [
    'title'       => 'Services',
    'description' => 'Content engines, custom AI agents, workflow automation, inbox and CRM automation, and reporting — built into the tools you already use.',
    'path'        => '/services',
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section section--tight">
  <div class="shell">
    <div class="section-head">
      <span class="eyebrow">Services</span>
      <h1>Built around the task, not the tool</h1>
      <p class="lede">
        Every engagement starts from a job somebody is doing by hand. We pick the
        stack afterwards, and usually it is the one you already pay for.
      </p>
    </div>
  </div>
</section>

<?php $index = 0; foreach (services() as $slug => $service): $index++; ?>
<section class="section<?= $index % 2 === 0 ? ' section--alt' : '' ?>" id="<?= e($slug) ?>">
  <div class="shell">
    <div class="grid grid--2">
      <div class="stack">
        <div class="card__icon"><?= icon($service['icon']) ?></div>
        <h2><?= e($service['name']) ?></h2>
        <p class="lede"><?= e($service['summary']) ?></p>
        <p class="muted mono">Best for: <?= e($service['best_for']) ?></p>
        <p><a class="link-arrow" href="/audit">See if this fits you <?= icon('arrow') ?></a></p>
      </div>

      <div class="card">
        <h3 class="card__title">What you get</h3>
        <ul class="tick-list">
          <?php foreach ($service['points'] as $point): ?>
            <li><?= icon('check') ?><span><?= e($point) ?></span></li>
          <?php endforeach; ?>
        </ul>
      </div>
    </div>
  </div>
</section>
<?php endforeach; ?>

<section class="section section--alt">
  <div class="shell">
    <div class="section-head">
      <span class="eyebrow">The engagement</span>
      <h2>How a project actually runs</h2>
    </div>
    <div class="steps">
      <?php foreach (process_steps() as $step): ?>
        <article class="step">
          <div class="step__num"><?= e($step['step']) ?></div>
          <h3 class="step__name"><?= e($step['name']) ?></h3>
          <div class="step__time"><?= e($step['time']) ?></div>
          <p class="step__body"><?= e($step['body']) ?></p>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="cta-band">
      <h2>Not sure which of these you need?</h2>
      <p class="lede">That is exactly what the audit is for. Answer six questions and we will tell you where to start.</p>
      <div class="cta-band__actions">
        <a class="btn btn--primary btn--lg" href="/audit">Take the audit <?= icon('arrow') ?></a>
      </div>
    </div>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
