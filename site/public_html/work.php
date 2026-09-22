<?php
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';

$page = [
    'title'       => 'Work',
    'description' => 'Build notes: the problems we were handed, what we built, the stack we used, and what changed as a result.',
    'path'        => '/work',
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section section--tight">
  <div class="shell">
    <div class="section-head">
      <span class="eyebrow">Build notes</span>
      <h1>Systems, not screenshots</h1>
      <p class="lede">
        The problem we were handed, what we built, and what changed. Written the
        way we would explain it to an engineer on your team.
      </p>
    </div>
  </div>
</section>

<section class="section--tight">
  <div class="shell stack stack--lg">
    <?php foreach (build_notes() as $note): ?>
      <article class="card note" id="<?= e($note['slug']) ?>">
        <div class="note__label"><?= e($note['label']) ?></div>
        <h2 class="note__title h2"><?= e($note['title']) ?></h2>

        <div class="grid grid--2">
          <div>
            <div class="note__block">
              <h4>The problem</h4>
              <p><?= e($note['problem']) ?></p>
            </div>
            <div class="note__block">
              <h4>What we built</h4>
              <p><?= e($note['build']) ?></p>
            </div>
          </div>
          <div>
            <div class="note__block">
              <h4>What changed</h4>
              <p><?= e($note['result']) ?></p>
            </div>
            <div class="note__block">
              <h4>Stack</h4>
              <div class="pill-row">
                <?php foreach ($note['stack'] as $tool): ?>
                  <span class="pill"><?= e($tool) ?></span>
                <?php endforeach; ?>
              </div>
            </div>
          </div>
        </div>
      </article>
    <?php endforeach; ?>
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="cta-band">
      <h2>Your turn</h2>
      <p class="lede">Tell us the task that keeps coming back and we will tell you whether it is worth automating.</p>
      <div class="cta-band__actions">
        <a class="btn btn--primary btn--lg" href="/audit">Get the free audit <?= icon('arrow') ?></a>
        <a class="btn btn--ghost btn--lg" href="/contact">Contact us</a>
      </div>
    </div>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
