<?php
/** Site header. The mobile menu is progressive: it works as an anchor-free
 *  <details>-style toggle driven by site.js, and the links stay reachable
 *  without JavaScript because the panel is only hidden at small widths. */
declare(strict_types=1);

$navLinks = [
    '/services' => 'Services',
    '/work'     => 'Work',
    '/pricing'  => 'Pricing',
    '/about'    => 'About',
    '/contact'  => 'Contact',
];
?>
<header class="site-header" data-header>
  <div class="shell site-header__inner">
    <a class="logo" href="/" aria-label="<?= e(brand()) ?> home">
      <?= logo_mark() ?>
      <span class="logo__text"><?= e(brand()) ?></span>
    </a>

    <button class="nav-toggle" type="button" data-nav-toggle
            aria-expanded="false" aria-controls="site-nav">
      <span class="nav-toggle__open"><?= icon('menu') ?></span>
      <span class="nav-toggle__close"><?= icon('close') ?></span>
      <span class="sr-only">Menu</span>
    </button>

    <nav class="site-nav" id="site-nav" data-nav aria-label="Main">
      <ul class="site-nav__list">
        <?php foreach ($navLinks as $href => $label): ?>
          <li>
            <a href="<?= e($href) ?>"<?= is_current($href) ? ' aria-current="page"' : '' ?>><?= e($label) ?></a>
          </li>
        <?php endforeach; ?>
      </ul>
      <a class="btn btn--primary btn--sm site-nav__cta" href="/audit">Free audit</a>
    </nav>
  </div>
</header>
