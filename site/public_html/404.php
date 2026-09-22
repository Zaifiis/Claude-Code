<?php
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';
http_response_code(404);

$page = [
    'title'       => 'Page not found',
    'description' => 'That page does not exist.',
    'path'        => '/404',
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section">
  <div class="shell shell--narrow stack stack--lg">
    <div class="section-head">
      <span class="eyebrow">404</span>
      <h1>That page is not here</h1>
      <p class="lede">The link is wrong, the page moved, or it never existed. Any of these will get you back on track.</p>
    </div>
    <div class="grid grid--2">
      <a class="card card--hover" href="/">
        <h2 class="card__title">Home</h2>
        <p class="muted">What we do and who it is for.</p>
      </a>
      <a class="card card--hover" href="/services">
        <h2 class="card__title">Services</h2>
        <p class="muted">The five things we build most.</p>
      </a>
      <a class="card card--hover" href="/audit">
        <h2 class="card__title">Free audit</h2>
        <p class="muted">Find out what is worth automating.</p>
      </a>
      <a class="card card--hover" href="/contact">
        <h2 class="card__title">Contact</h2>
        <p class="muted">Send us a message instead.</p>
      </a>
    </div>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
