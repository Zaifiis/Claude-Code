<?php
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';

$page = [
    'title'       => 'About',
    'description' => 'A small studio that builds AI automation the boring way: scoped, documented, owned by you, and monitored so it keeps working.',
    'path'        => '/about',
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section section--tight">
  <div class="shell shell--narrow">
    <div class="section-head">
      <span class="eyebrow">About</span>
      <h1>We build our own tools first</h1>
    </div>
    <div class="prose">
      <p class="lede">
        <?= e(brand()) ?> started the way most useful things do — by getting tired of
        doing something manually.
      </p>
      <p>
        The first system we built was for ourselves: an agent that reads the day's
        actual work, drafts a post about it, and files it into a queue for a human to
        approve before anything publishes. It solved a real problem, it ran every day,
        and it was boring in the right ways — logged, monitored, and easy to change.
      </p>
      <p>
        That is still the test we apply to everything we ship for a client. Would we
        run it ourselves, every day, without babysitting it? If not, it is not done.
      </p>
    </div>
  </div>
</section>

<section class="section section--alt">
  <div class="shell">
    <div class="section-head">
      <span class="eyebrow">How we work</span>
      <h2>Four things we will not trade away</h2>
    </div>

    <div class="grid grid--2">
      <article class="card">
        <div class="card__icon"><?= icon('key') ?></div>
        <h3 class="card__title">You own it</h3>
        <p class="muted">
          Code, workflows, credentials and data live in your accounts from day one.
          We have no interest in being the single point of failure in your business.
        </p>
      </article>
      <article class="card">
        <div class="card__icon"><?= icon('shield') ?></div>
        <h3 class="card__title">A human stays in the loop</h3>
        <p class="muted">
          Anything with judgement or reputation attached keeps an approval step.
          Full autonomy is easy to demo and expensive to clean up.
        </p>
      </article>
      <article class="card">
        <div class="card__icon"><?= icon('clock') ?></div>
        <h3 class="card__title">Small scopes, real demos</h3>
        <p class="muted">
          Something works at the end of every cycle. A project that cannot show
          progress in two weeks is scoped wrong, and we would rather say it early.
        </p>
      </article>
      <article class="card">
        <div class="card__icon"><?= icon('chart') ?></div>
        <h3 class="card__title">Measured in hours saved</h3>
        <p class="muted">
          We agree the number we are trying to move before the build starts, and
          review it afterwards. If it did not move, that is a finding, not a silence.
        </p>
      </article>
    </div>
  </div>
</section>

<section class="section">
  <div class="shell shell--narrow">
    <div class="section-head">
      <span class="eyebrow">Honest limits</span>
      <h2>When we are the wrong call</h2>
    </div>
    <div class="prose">
      <ul>
        <li><strong>You want a chatbot on your website and nothing else.</strong> There are good off-the-shelf products for that, and paying us to wire one up is a waste of your money.</li>
        <li><strong>The process does not exist yet.</strong> Automation multiplies whatever it is pointed at. If the process is undefined, we would be scaling confusion.</li>
        <li><strong>You need it live next week.</strong> We can occasionally move that fast, but not while also doing the part where it keeps working.</li>
        <li><strong>The task genuinely needs judgement every time.</strong> Then it needs a person, and we will tell you so in the audit rather than after the invoice.</li>
      </ul>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="cta-band">
      <h2>Still here? Let's talk</h2>
      <p class="lede">Bring the task that annoys you most. That is usually the right place to start.</p>
      <div class="cta-band__actions">
        <a class="btn btn--primary btn--lg" href="/audit">Free automation audit <?= icon('arrow') ?></a>
        <a class="btn btn--ghost btn--lg" href="/contact">Send a message</a>
      </div>
    </div>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
