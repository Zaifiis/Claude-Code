<?php
/** Closing half of every public page: newsletter, sitemap links, legal. */
declare(strict_types=1);

$year     = date('Y');
$linkedin = (string) cfg('brand.linkedin');
$email    = (string) cfg('brand.email');
$phone    = (string) cfg('brand.phone');
?>
</main>

<footer class="site-footer">
  <div class="shell">

    <section class="subscribe" aria-labelledby="subscribe-title">
      <div class="subscribe__copy">
        <h2 id="subscribe-title" class="h3">One automation idea, once a week</h2>
        <p class="muted">What we built, what broke, and what it saved. No pitch, unsubscribe in one click.</p>
      </div>
      <form class="subscribe__form" method="post" action="/api/subscribe.php" data-ajax-form data-form-name="subscribe">
        <input type="hidden" name="csrf" value="<?= e(csrf_token('subscribe')) ?>">
        <input type="hidden" name="form_started" value="<?= e(form_timestamp()) ?>">
        <input type="hidden" name="source_page" value="<?= e(current_path()) ?>">
        <div class="hp" aria-hidden="true">
          <label for="sub-website-url">Leave this field empty</label>
          <input type="text" id="sub-website-url" name="website_url" tabindex="-1" autocomplete="off">
        </div>
        <label class="sr-only" for="sub-email">Email address</label>
        <div class="subscribe__row">
          <input class="input" type="email" id="sub-email" name="email" required
                 autocomplete="email" placeholder="you@company.com">
          <button class="btn btn--primary" type="submit">Subscribe</button>
        </div>
        <p class="form-status" data-form-status role="status" aria-live="polite"></p>
      </form>
    </section>

    <div class="site-footer__grid">
      <div class="site-footer__brand">
        <a class="logo" href="/" aria-label="<?= e(brand()) ?> home">
          <?= logo_mark() ?>
          <span class="logo__text"><?= e(brand()) ?></span>
        </a>
        <p class="muted"><?= e((string) cfg('brand.tagline')) ?></p>
        <ul class="contact-list">
          <li><?= icon('mail', 'icon icon--sm') ?><a href="mailto:<?= e($email) ?>"><?= e($email) ?></a></li>
          <?php if ($phone !== ''): ?>
            <li><?= icon('clock', 'icon icon--sm') ?><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', $phone) ?? '') ?>"><?= e($phone) ?></a></li>
          <?php endif; ?>
          <?php if ($linkedin !== ''): ?>
            <li><?= icon('linkedin', 'icon icon--sm') ?><a href="<?= e($linkedin) ?>" rel="me noopener" target="_blank">LinkedIn</a></li>
          <?php endif; ?>
        </ul>
      </div>

      <nav class="site-footer__col" aria-label="Services">
        <h2 class="site-footer__heading">Services</h2>
        <ul>
          <?php foreach (services() as $slug => $service): ?>
            <li><a href="/services#<?= e($slug) ?>"><?= e($service['name']) ?></a></li>
          <?php endforeach; ?>
        </ul>
      </nav>

      <nav class="site-footer__col" aria-label="Company">
        <h2 class="site-footer__heading">Company</h2>
        <ul>
          <li><a href="/about">About</a></li>
          <li><a href="/work">Work</a></li>
          <li><a href="/pricing">Pricing</a></li>
          <li><a href="/audit">Free audit</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/privacy">Privacy</a></li>
        </ul>
      </nav>
    </div>

    <div class="site-footer__legal">
      <p>&copy; <?= e($year) ?> <?= e(brand()) ?>. All rights reserved.</p>
      <p><a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a></p>
    </div>
  </div>
</footer>
</body>
</html>
