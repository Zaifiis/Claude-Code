<?php
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';

$page = [
    'title'       => brand(),
    'description' => 'We build the AI agents and automations that take the repetitive work off your team — audited, built and handed over in weeks, not quarters.',
    'path'        => '/',
    'jsonld'      => [
        '@context'    => 'https://schema.org',
        '@type'       => 'ProfessionalService',
        'name'        => brand(),
        'description' => (string) cfg('brand.tagline'),
        'url'         => url('/'),
        'email'       => (string) cfg('brand.email'),
        'areaServed'  => 'Worldwide',
        'serviceType' => array_values(array_map(
            static fn(array $s): string => $s['name'],
            services()
        )),
    ],
];
require __DIR__ . '/inc/partials/head.php';

$allServices = services();
$notes       = array_slice(build_notes(), 0, 2);
$quotes      = testimonials();
?>

<!-- ── Hero ──────────────────────────────────────────────────────────────── -->
<section class="hero">
  <div class="shell hero__grid">
    <div class="hero__inner">
      <span class="eyebrow">AI automation studio</span>
      <h1>The work nobody<br><span class="gradient-text">should be doing by hand</span></h1>
      <p class="lede">
        You already know which tasks eat your week. We find them, build the agents
        and workflows that absorb them, and hand you something your team can run
        without us.
      </p>
      <div class="hero__actions">
        <a class="btn btn--primary btn--lg" href="/audit">
          Get your free automation audit <?= icon('arrow') ?>
        </a>
        <a class="btn btn--ghost btn--lg" href="/work">See what we build</a>
      </div>
      <div class="hero__meta">
        <span><?= icon('clock') ?> First system live in 3–5 weeks</span>
        <span><?= icon('key') ?> You own the code and the data</span>
        <span><?= icon('shield') ?> No lock-in, cancel any month</span>
      </div>
    </div>

    <div class="window" aria-hidden="true">
      <div class="window__bar">
        <span class="window__dot"></span><span class="window__dot"></span><span class="window__dot"></span>
        <span class="window__title">automation-run.log</span>
      </div>
      <div class="window__body">
        <div class="window__row"><span class="window__time">06:00</span><span>Overnight sync · <span class="window__ok">412 rows reconciled</span></span></div>
        <div class="window__row"><span class="window__time">08:15</span><span>Enquiry #KA-7F3QX scored <span class="window__ok">82/100</span> · routed</span></div>
        <div class="window__row"><span class="window__time">09:30</span><span>Weekly report <span class="window__ok">delivered</span> to 6 inboxes</span></div>
        <div class="window__row"><span class="window__time">16:00</span><span>Post drafted · <span class="window__wait">awaiting approval</span></span></div>
        <div class="window__row"><span class="window__time">17:45</span><span>Invoice chase sent · <span class="window__ok">3 paid</span></span></div>
      </div>
    </div>
  </div>
</section>

<!-- ── Promise strip ─────────────────────────────────────────────────────── -->
<section class="section--tight">
  <div class="shell">
    <div class="stat-row">
      <div class="stat">
        <div class="stat__value">3–5 weeks</div>
        <p class="stat__label">From blueprint sign-off to your first system running on real data.</p>
      </div>
      <div class="stat">
        <div class="stat__value">100% yours</div>
        <p class="stat__label">Code, workflows, credentials and data stay in your accounts.</p>
      </div>
      <div class="stat">
        <div class="stat__value">Humans in the loop</div>
        <p class="stat__label">Anything with judgement in it keeps an approval step. On purpose.</p>
      </div>
    </div>
  </div>
</section>

<!-- ── Services ──────────────────────────────────────────────────────────── -->
<section class="section section--alt" id="services">
  <div class="shell">
    <div class="section-head">
      <span class="eyebrow">What we do</span>
      <h2>Five things we build, over and over</h2>
      <p class="lede">Each one starts as a task somebody on your team hates doing every week.</p>
    </div>

    <div class="grid grid--3">
      <?php foreach ($allServices as $slug => $service): ?>
        <article class="card card--hover" id="<?= e($slug) ?>">
          <div class="card__icon"><?= icon($service['icon']) ?></div>
          <h3 class="card__title"><?= e($service['name']) ?></h3>
          <p class="muted"><?= e($service['summary']) ?></p>
          <p class="mono dim"><?= e($service['best_for']) ?></p>
        </article>
      <?php endforeach; ?>
    </div>

    <p class="section-head">
      <a class="link-arrow" href="/services">See how each one works <?= icon('arrow') ?></a>
    </p>
  </div>
</section>

<!-- ── ROI calculator ────────────────────────────────────────────────────── -->
<section class="section" id="calculator">
  <div class="shell">
    <div class="section-head section-head--center">
      <span class="eyebrow">Worth it?</span>
      <h2>Put your own numbers in</h2>
      <p class="lede">A rough sizing of what the manual work is costing you each year.</p>
    </div>

    <div class="calc" data-calc>
      <div class="calc__controls">
        <div class="calc__control">
          <div class="calc__control-head">
            <label class="field__label" for="calc-people">People doing repetitive work</label>
            <span class="calc__value" data-calc-readout="people">4</span>
          </div>
          <input type="range" id="calc-people" name="people" min="1" max="50" value="4"
                 data-calc-input>
        </div>

        <div class="calc__control">
          <div class="calc__control-head">
            <label class="field__label" for="calc-hours">Hours each, per week</label>
            <span class="calc__value" data-calc-readout="hours">8</span>
          </div>
          <input type="range" id="calc-hours" name="hours" min="1" max="40" value="8"
                 data-calc-input>
        </div>

        <div class="calc__control">
          <div class="calc__control-head">
            <label class="field__label" for="calc-rate">Fully loaded cost per hour</label>
            <span class="calc__value" data-calc-readout="rate">30</span>
          </div>
          <input type="range" id="calc-rate" name="rate" min="10" max="150" step="5" value="30"
                 data-calc-input data-prefix="£">
        </div>

        <p class="calc__note">
          Assumes 46 working weeks and that we automate about 60% of the time you
          listed — the share we normally reach once a human checkpoint stays in.
        </p>
      </div>

      <div class="calc__out">
        <div class="calc__metric">
          <div class="calc__metric-value calc__metric-value--accent" data-calc-out="hours">—</div>
          <p class="calc__metric-label">Hours handed back per year</p>
        </div>
        <div class="calc__metric">
          <div class="calc__metric-value" data-calc-out="money">—</div>
          <p class="calc__metric-label">What that time currently costs you</p>
        </div>
        <div class="calc__metric">
          <div class="calc__metric-value" data-calc-out="days">—</div>
          <p class="calc__metric-label">Working days returned to the team</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ── Process ───────────────────────────────────────────────────────────── -->
<section class="section section--alt">
  <div class="shell">
    <div class="section-head">
      <span class="eyebrow">How it runs</span>
      <h2>Four steps, no mystery</h2>
      <p class="lede">You see something working on your own data in week two. If you don't, the scope was wrong and we say so.</p>
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

<!-- ── Build notes ───────────────────────────────────────────────────────── -->
<section class="section">
  <div class="shell">
    <div class="section-head">
      <span class="eyebrow">Build notes</span>
      <h2>What this looks like in practice</h2>
    </div>

    <div class="grid grid--2">
      <?php foreach ($notes as $note): ?>
        <article class="card note">
          <div class="note__label"><?= e($note['label']) ?></div>
          <h3 class="note__title h3"><?= e($note['title']) ?></h3>
          <div class="note__block">
            <h4>The problem</h4>
            <p><?= e($note['problem']) ?></p>
          </div>
          <div class="note__block">
            <h4>What we built</h4>
            <p><?= e($note['build']) ?></p>
          </div>
          <div class="note__block">
            <div class="pill-row">
              <?php foreach ($note['stack'] as $tool): ?>
                <span class="pill"><?= e($tool) ?></span>
              <?php endforeach; ?>
            </div>
          </div>
        </article>
      <?php endforeach; ?>
    </div>

    <p class="section-head">
      <a class="link-arrow" href="/work">Read all the build notes <?= icon('arrow') ?></a>
    </p>
  </div>
</section>

<?php if ($quotes !== []): ?>
<!-- ── Testimonials (renders only when there are real ones) ──────────────── -->
<section class="section section--alt">
  <div class="shell">
    <div class="section-head section-head--center">
      <span class="eyebrow">In their words</span>
      <h2>What clients say</h2>
    </div>
    <div class="grid grid--3">
      <?php foreach ($quotes as $quote): ?>
        <figure class="card">
          <blockquote><p class="dim">&ldquo;<?= e($quote['quote']) ?>&rdquo;</p></blockquote>
          <figcaption class="muted mono">
            <?= e($quote['name']) ?><?= !empty($quote['role']) ? ' · ' . e($quote['role']) : '' ?>
          </figcaption>
        </figure>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php endif; ?>

<!-- ── FAQ ───────────────────────────────────────────────────────────────── -->
<section class="section<?= $quotes === [] ? ' section--alt' : '' ?>">
  <div class="shell shell--narrow">
    <div class="section-head">
      <span class="eyebrow">Straight answers</span>
      <h2>The questions we always get</h2>
    </div>

    <div class="faq">
      <?php foreach (array_slice(faqs(), 0, 5) as $faq): ?>
        <details class="faq__item">
          <summary><?= e($faq['q']) ?></summary>
          <div class="faq__answer"><?= e($faq['a']) ?></div>
        </details>
      <?php endforeach; ?>
    </div>

    <p class="section-head">
      <a class="link-arrow" href="/pricing#faq">All questions and pricing <?= icon('arrow') ?></a>
    </p>
  </div>
</section>

<!-- ── Closing CTA ───────────────────────────────────────────────────────── -->
<section class="section section--tight">
  <div class="shell">
    <div class="cta-band">
      <span class="eyebrow">Next step</span>
      <h2>Find out what is actually worth automating</h2>
      <p class="lede">Forty-five minutes, no pitch. You leave with a ranked list of what to automate first and what it would take — whether or not you work with us.</p>
      <div class="cta-band__actions">
        <a class="btn btn--primary btn--lg" href="/audit">Start the free audit <?= icon('arrow') ?></a>
        <a class="btn btn--ghost btn--lg" href="/contact">Just send a message</a>
      </div>
    </div>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
