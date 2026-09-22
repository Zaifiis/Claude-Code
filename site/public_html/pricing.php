<?php
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';

$allFaqs = faqs();

$page = [
    'title'       => 'Pricing',
    'description' => 'A free audit, a fixed-scope build sprint, or an ongoing automation partnership. Clear scope, no lock-in.',
    'path'        => '/pricing',
    'jsonld'      => [
        '@context'   => 'https://schema.org',
        '@type'      => 'FAQPage',
        'mainEntity' => array_map(static fn(array $f): array => [
            '@type'          => 'Question',
            'name'           => $f['q'],
            'acceptedAnswer' => ['@type' => 'Answer', 'text' => $f['a']],
        ], $allFaqs),
    ],
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section section--tight">
  <div class="shell">
    <div class="section-head section-head--center">
      <span class="eyebrow">Pricing</span>
      <h1>Priced by the scope, not the hour</h1>
      <p class="lede">
        You see the number before anything gets built, and it does not move
        unless you ask for something that was not in the blueprint.
      </p>
    </div>

    <div class="grid grid--3">
      <?php foreach (pricing_tiers() as $tier): ?>
        <article class="card price-card<?= $tier['featured'] ? ' price-card--featured' : '' ?>">
          <?php if ($tier['featured']): ?>
            <span class="price-card__badge">Most chosen</span>
          <?php endif; ?>
          <h2 class="card__title"><?= e($tier['name']) ?></h2>
          <div class="price-card__price">
            <span class="price-card__amount"><?= e($tier['price']) ?></span>
            <span class="price-card__cadence"><?= e($tier['cadence']) ?></span>
          </div>
          <p class="muted"><?= e($tier['pitch']) ?></p>
          <ul class="tick-list">
            <?php foreach ($tier['features'] as $feature): ?>
              <li><?= icon('check') ?><span><?= e($feature) ?></span></li>
            <?php endforeach; ?>
          </ul>
          <a class="btn <?= $tier['featured'] ? 'btn--primary' : 'btn--ghost' ?> btn--block"
             href="<?= e($tier['cta']['href']) ?>"><?= e($tier['cta']['label']) ?></a>
        </article>
      <?php endforeach; ?>
    </div>

    <p class="muted mono" id="pricing-note">
      Prices exclude VAT and any third-party costs (model usage, hosting), which are
      itemised in the blueprint before you commit.
    </p>
  </div>
</section>

<section class="section section--alt">
  <div class="shell">
    <div class="section-head">
      <span class="eyebrow">Included either way</span>
      <h2>What never gets cut to hit a number</h2>
    </div>
    <div class="grid grid--3">
      <article class="card">
        <div class="card__icon"><?= icon('shield') ?></div>
        <h3 class="card__title">Error handling</h3>
        <p class="muted">Retries, dead-letter handling and alerting on every workflow. Silent failure is the one outcome we design against hardest.</p>
      </article>
      <article class="card">
        <div class="card__icon"><?= icon('key') ?></div>
        <h3 class="card__title">Your accounts, your keys</h3>
        <p class="muted">Everything runs on infrastructure you control. Leaving us costs you a handover call, not a system.</p>
      </article>
      <article class="card">
        <div class="card__icon"><?= icon('clock') ?></div>
        <h3 class="card__title">Documentation</h3>
        <p class="muted">A written runbook and a walkthrough with whoever will own it. If only we can maintain it, we built it wrong.</p>
      </article>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="shell shell--narrow">
    <div class="section-head">
      <span class="eyebrow">FAQ</span>
      <h2>Everything else</h2>
    </div>
    <div class="faq">
      <?php foreach ($allFaqs as $faq): ?>
        <details class="faq__item">
          <summary><?= e($faq['q']) ?></summary>
          <div class="faq__answer"><?= e($faq['a']) ?></div>
        </details>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="cta-band">
      <h2>Start with the free part</h2>
      <p class="lede">The audit costs you forty-five minutes and you keep the map regardless.</p>
      <div class="cta-band__actions">
        <a class="btn btn--primary btn--lg" href="/audit">Book the audit <?= icon('arrow') ?></a>
      </div>
    </div>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
