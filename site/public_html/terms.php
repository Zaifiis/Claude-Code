<?php
/**
 * Website terms.
 *
 * TODO before launch: set your governing law and registered entity below, and
 * have a lawyer read it if you are selling into regulated industries.
 */
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';

$page = [
    'title'       => 'Terms',
    'description' => 'The terms that apply to using this website.',
    'path'        => '/terms',
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section">
  <div class="shell shell--narrow">
    <div class="section-head">
      <span class="eyebrow">Legal</span>
      <h1>Website terms</h1>
      <p class="muted">Last updated <?= e(date('j F Y', filemtime(__FILE__) ?: time())) ?>.</p>
    </div>

    <div class="prose">
      <h2>Who we are</h2>
      <p>
        This website is operated by <?= e(brand()) ?>,
        <strong>[Your registered company name, number and address]</strong>.
      </p>

      <h2>Using this site</h2>
      <p>
        You may read, print and share these pages for your own or your organisation's
        use. You may not copy the site wholesale, present it as your own, or use it to
        train a commercial model without our written permission.
      </p>

      <h2>What the content is and isn't</h2>
      <p>
        Everything here is general information about our services. Prices, timelines
        and capabilities described on this site are indicative and do not form an
        offer. Nothing on this site is professional, legal or financial advice, and
        nothing here creates a contract. Work we do for you is governed by the
        proposal and statement of work we both sign.
      </p>

      <h2>Estimates and calculators</h2>
      <p>
        The savings calculator is an illustration built from the numbers you type in
        and a stated set of assumptions. It is not a forecast, a guarantee, or a
        substitute for looking at your own figures.
      </p>

      <h2>Availability</h2>
      <p>
        We try to keep this site up and accurate, but we do not guarantee either. We
        may change or remove content at any time without notice.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, we are not liable for any loss arising from your
        use of, or reliance on, this website. Nothing here limits liability for death
        or personal injury caused by negligence, or for fraud.
      </p>

      <h2>Links out</h2>
      <p>
        Where we link to someone else's site, we are not responsible for their content
        or their privacy practices.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of <strong>[your jurisdiction]</strong>,
        and its courts have exclusive jurisdiction.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms:
        <a href="mailto:<?= e((string) cfg('brand.email')) ?>"><?= e((string) cfg('brand.email')) ?></a>.
      </p>
    </div>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
