<?php
/**
 * Privacy notice.
 *
 * It describes what this codebase genuinely does — the leads table, the hashed
 * IP, the session cookie on /admin — so it stays true as long as you do not
 * bolt third-party tracking on top.
 *
 * TODO before launch: replace the two bracketed placeholders below with your
 * registered company name/address and your data-protection contact.
 */
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';

$page = [
    'title'       => 'Privacy notice',
    'description' => 'What we collect when you use this site, why, how long we keep it, and how to have it deleted.',
    'path'        => '/privacy',
];
require __DIR__ . '/inc/partials/head.php';
?>

<section class="section">
  <div class="shell shell--narrow">
    <div class="section-head">
      <span class="eyebrow">Legal</span>
      <h1>Privacy notice</h1>
      <p class="muted">Last updated <?= e(date('j F Y', filemtime(__FILE__) ?: time())) ?>.</p>
    </div>

    <div class="prose">
      <p>
        This notice covers <?= e(brand()) ?> (&ldquo;we&rdquo;), operated by
        <strong>[Your registered company name and address]</strong>, and the personal
        data we handle through this website.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>What you send us.</strong> When you use the contact form or the automation audit, we store the name, email address, company, website, phone number and answers you provide, along with the page you submitted from and any campaign parameters in the link you arrived on.</li>
        <li><strong>Newsletter address.</strong> If you subscribe, we store your email address and when you subscribed.</li>
        <li><strong>A one-way hash of your IP address.</strong> We do not store the address itself. The hash lets us rate-limit form submissions and spot repeat spam without holding the address.</li>
        <li><strong>Your browser's user-agent string</strong>, stored with an enquiry to help us reproduce problems.</li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>No advertising or analytics trackers, no third-party pixels, and no cookie banner, because there is nothing to consent to.</li>
        <li>No cookies at all on the public pages. The only cookie this site can set is the login session on our own admin area, which is not available to visitors.</li>
        <li>We never sell, rent or share your details with anyone for their own marketing.</li>
      </ul>

      <h2>Why we are allowed to hold it</h2>
      <p>
        For enquiries, our lawful basis is <em>legitimate interests</em> — you asked us
        to get in touch and we need your details to do that. For the newsletter it is
        your <em>consent</em>, which you can withdraw at any time using the unsubscribe
        link in any email.
      </p>

      <h2>Who else can see it</h2>
      <p>
        Your submission is stored in our own database on our hosting provider's
        servers, and a notification copy is sent through our email provider. Those two
        suppliers process the data on our instructions and for no other purpose. We do
        not send your enquiry to any other third party.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li><strong>Enquiries:</strong> up to 24 months after our last contact, then deleted.</li>
        <li><strong>Newsletter:</strong> until you unsubscribe.</li>
        <li><strong>Rate-limit records:</strong> a rolling window, measured in hours.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can ask us for a copy of what we hold about you, ask us to correct it, or
        ask us to delete it. Email
        <a href="mailto:<?= e((string) cfg('brand.email')) ?>"><?= e((string) cfg('brand.email')) ?></a>
        and we will action it within 30 days. If you are in the UK or EU and you are
        not happy with how we handled a request, you can complain to your national data
        protection regulator.
      </p>

      <h2>Contact</h2>
      <p>
        Data protection contact: <strong>[Name and email of whoever handles this]</strong>,
        or write to us at the address above.
      </p>
    </div>
  </div>
</section>

<?php require __DIR__ . '/inc/partials/footer.php'; ?>
