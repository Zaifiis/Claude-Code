<?php
/**
 * Template Name: Motion Sensor Light Page
 */

// Fetch DB reviews for motion sensor product
$db_reviews = get_posts(array(
    'post_type'      => 'snaplyr_review',
    'post_status'    => 'publish',
    'posts_per_page' => 20,
    'meta_query'     => array(array('key'=>'_snaplyr_product','value'=>'motion-sensor-light','compare'=>'=')),
    'orderby'        => 'date',
    'order'          => 'DESC',
));

$wc_product_id = 52;

// Sizes config: [label, sale_price, original_price]
$sizes = array(
    array('10 CM', 2239, 2899),
    array('20 CM', 2349, 2899),
    array('30 CM', 2549, 2899),
    array('50 CM', 2649, 2899),
);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Motion Sensor Night Light – <?php bloginfo('name'); ?></title>
  <?php wp_head(); ?>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: #2d6a4f; --primary-light: #d8f3dc; --accent: #e63946;
      --gold: #f4a261; --text: #1b1b1b; --muted: #6b7280;
      --border: #e5e7eb; --radius: 10px; --shadow: 0 2px 16px rgba(0,0,0,0.08);
    }
    html { scroll-behavior: smooth; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: var(--text); background: #fff; margin: 0; -webkit-text-size-adjust: 100%; }
    a { text-decoration: none; color: inherit; }
    img { max-width: 100%; display: block; }

    /* Topbar */
    .topbar { background: #1b1b1b; color: #fff; text-align: center; font-size: 12px; padding: 8px 12px; }
    .topbar span { color: #f4a261; }

    /* Header */
    header { background: #fff; border-bottom: 1px solid var(--border); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 6px rgba(0,0,0,0.06); gap: 12px; }
    .logo { font-size: 20px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }
    .logo span { color: var(--primary); }
    .header-nav { display: flex; gap: 18px; font-size: 13px; font-weight: 500; }
    .header-nav a { white-space: nowrap; transition: color 0.2s; }
    .header-nav a:hover, .header-nav a.active-link { color: var(--primary); }
    .header-icons { display: flex; gap: 14px; align-items: center; flex-shrink: 0; }
    .header-icons svg { width: 22px; height: 22px; cursor: pointer; }
    .mob-btn { display: none; background: none; border: none; font-size: 26px; cursor: pointer; color: var(--text); padding: 2px 6px; line-height: 1; }
    .mob-nav { display: none; position: fixed; top: 57px; left: 0; right: 0; background: #fff; border-bottom: 2px solid var(--border); box-shadow: 0 6px 20px rgba(0,0,0,0.1); z-index: 99; padding: 8px 0; }
    .mob-nav.open { display: block; }
    .mob-nav a { display: flex; align-items: center; gap: 10px; padding: 14px 22px; font-size: 15px; font-weight: 600; color: var(--text); border-bottom: 1px solid #f3f4f6; text-decoration: none; transition: background 0.15s; }
    .mob-nav a:last-child { border-bottom: none; }
    .mob-nav a:hover, .mob-nav a.active-link { background: var(--primary-light); color: var(--primary); }
    .mob-nav a .nav-icon { font-size: 17px; }

    /* Breadcrumb */
    .breadcrumb { max-width: 1100px; margin: 12px auto 0; padding: 0 16px; font-size: 12px; color: var(--muted); }
    .breadcrumb a { color: var(--muted); }
    .breadcrumb a:hover { color: var(--primary); }

    /* Product layout */
    .product-wrapper { max-width: 1100px; margin: 20px auto 50px; padding: 0 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }

    /* Gallery */
    .gallery { position: sticky; top: 80px; }
    .gallery-main { border-radius: 14px; overflow: hidden; background: #f8f8f8; aspect-ratio: 1/1; cursor: zoom-in; }
    .gallery-main img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; display: block; }
    .gallery-main:hover img { transform: scale(1.04); }
    .gallery-thumbs { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
    .gallery-thumbs img { width: 68px; height: 68px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; }
    .gallery-thumbs img.active, .gallery-thumbs img:hover { border-color: var(--primary); }

    /* Product info */
    .product-info {}
    .product-title { font-size: 26px; font-weight: 800; line-height: 1.2; margin-bottom: 10px; }
    .rating-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .stars { color: #f4a261; font-size: 17px; letter-spacing: 1px; }
    .rating-score { font-weight: 800; font-size: 14px; }
    .rating-count { font-size: 12px; color: var(--muted); }
    .trust-badge { font-size: 11px; background: #e8f5e9; color: #2d6a4f; padding: 2px 8px; border-radius: 20px; font-weight: 700; }

    /* Size selector */
    .size-label { font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
    .size-label span { color: var(--primary); }
    .size-options { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
    .size-btn {
      padding: 10px 20px; border: 2px solid var(--border); border-radius: var(--radius);
      background: #fff; cursor: pointer; font-size: 13px; font-weight: 700;
      transition: all 0.2s; position: relative;
    }
    .size-btn:hover { border-color: var(--primary); background: var(--primary-light); }
    .size-btn.active { border-color: var(--primary); background: var(--primary); color: #fff; }
    .size-btn .size-price-hint { font-size: 10px; font-weight: 500; display: block; margin-top: 2px; opacity: 0.8; }

    /* Price display */
    .price-block { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 6px; }
    .price-original { text-decoration: line-through; color: var(--muted); font-size: 15px; }
    .price-sale { font-size: 32px; font-weight: 900; color: var(--accent); }
    .price-badge { background: var(--accent); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
    .price-note { font-size: 12px; color: var(--muted); margin-bottom: 14px; }
    .price-note a { color: var(--primary); text-decoration: underline; }

    /* Features grid */
    .features-title { font-size: 16px; font-weight: 800; margin-bottom: 10px; }
    .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
    .feature-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; font-weight: 600; padding: 8px 12px; background: #f0f9f8; border-radius: 8px; border: 1px solid #cceae7; line-height: 1.3; }
    .feature-icon { color: #5ec1b3; font-size: 14px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }

    /* Happy customers */
    .happy-bar { display: flex; align-items: center; gap: 10px; background: linear-gradient(45deg, #1cbcc3, #4abf8f 80%); border-radius: 6px; padding: 8px 14px; color: #fff; font-size: 12px; font-weight: 800; letter-spacing: 0.8px; margin-bottom: 12px; }
    .happy-avatars { display: flex; }
    .happy-avatars img { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #fff; margin-left: -8px; object-fit: cover; }
    .happy-avatars img:first-child { margin-left: 0; }

    /* Stock + countdown */
    .stock-warning { color: #e63946; font-weight: 800; font-size: 14px; margin-bottom: 8px; }
    .sale-countdown { color: #e63946; font-weight: 700; font-size: 14px; margin-bottom: 14px; }

    /* Bundle section */
    .bundle-section { margin-bottom: 16px; }
    .bundle-title { font-size: 18px; font-weight: 900; margin-bottom: 2px; }
    .bundle-subtitle { font-size: 12px; color: var(--muted); margin-bottom: 12px; }
    .bundle-option {
      display: flex; align-items: center; gap: 16px; padding: 12px 16px;
      border: 2px solid var(--border); border-radius: var(--radius); margin-bottom: 8px;
      cursor: pointer; transition: all 0.2s; position: relative; background: #fff;
    }
    .bundle-option:hover, .bundle-option.active { border-color: var(--primary); background: var(--primary-light); }
    .bundle-option input[type=radio] { accent-color: var(--primary); width: 16px; height: 16px; flex-shrink: 0; }
    .bundle-label { flex: 1; }
    .bundle-label strong { font-size: 14px; display: block; }
    .bundle-label small { font-size: 11px; color: var(--muted); }
    .bundle-prices { text-align: right; flex-shrink: 0; }
    .bundle-price-sale { font-size: 16px; font-weight: 800; color: var(--accent); display: block; }
    .bundle-price-orig { font-size: 11px; color: var(--muted); text-decoration: line-through; display: block; }
    .bundle-badge { position: absolute; right: -1px; top: -1px; background: var(--primary); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 0 8px 0 8px; }

    /* Dispatch timer */
    .dispatch-box { border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 14px; font-size: 14px; line-height: 1.7; background: #fafafa; }
    .dispatch-box strong { font-weight: 800; }
    .dispatch-flag { font-size: 16px; }
    .dispatch-timer { font-weight: 900; color: #1b1b1b; }

    /* Trust strip */
    .trust-strip { display: flex; gap: 0; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 16px; }
    .trust-item { flex: 1; text-align: center; padding: 12px 8px; font-size: 11px; font-weight: 600; color: var(--muted); border-right: 1px solid var(--border); }
    .trust-item:last-child { border-right: none; }
    .trust-item .trust-ico { font-size: 20px; display: block; margin-bottom: 4px; }

    /* Add to cart */
    .add-to-cart-btn {
      width: 100%; background: #1b1b1b; color: #fff; border: none;
      padding: 17px; font-size: 16px; font-weight: 800; border-radius: var(--radius);
      cursor: pointer; transition: background 0.2s; letter-spacing: 0.3px; margin-bottom: 12px;
    }
    .add-to-cart-btn:hover { background: var(--primary); }

    /* Purchase notification */
    #purchase-notif {
      position: fixed; bottom: 20px; left: 20px; z-index: 9999;
      background: #fff; border: 1px solid var(--border); border-radius: 12px;
      padding: 12px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      display: flex; align-items: center; gap: 12px; max-width: 280px;
      transform: translateY(100px); opacity: 0; transition: all 0.4s ease;
      font-size: 13px;
    }
    #purchase-notif.show { transform: translateY(0); opacity: 1; }
    .notif-icon { width: 40px; height: 40px; border-radius: 50%; background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .notif-text strong { display: block; font-weight: 700; color: var(--text); }
    .notif-text span { color: var(--muted); font-size: 11px; }
    .notif-time { font-size: 10px; color: var(--muted); white-space: nowrap; }

    /* Product description */
    .desc-section { max-width: 1100px; margin: 0 auto 40px; padding: 0 16px; }
    .desc-section h2 { font-size: 22px; font-weight: 800; margin-bottom: 16px; }
    .specs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
    .spec-card { background: #f8f9fa; border-radius: var(--radius); padding: 14px 16px; border: 1px solid var(--border); }
    .spec-card h4 { font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .spec-card p { font-size: 13px; color: var(--text); line-height: 1.5; }
    .modes-list { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
    .modes-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; padding: 10px 14px; background: #f8f9fa; border-radius: 8px; }
    .modes-list li .mode-dot { width: 24px; height: 24px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }

    /* Reviews */
    .reviews-section { max-width: 1100px; margin: 0 auto 50px; padding: 0 16px; }
    .reviews-section h2 { font-size: 22px; font-weight: 800; margin-bottom: 20px; }
    .reviews-summary { display: grid; grid-template-columns: 140px 1fr; gap: 28px; align-items: center; background: #f8f9fa; border-radius: 14px; padding: 24px; margin-bottom: 28px; border: 1px solid var(--border); }
    .reviews-avg { text-align: center; }
    .avg-num { font-size: 52px; font-weight: 900; color: var(--text); line-height: 1; }
    .avg-stars { color: #f4a261; font-size: 20px; margin: 6px 0; }
    .avg-label { font-size: 12px; color: var(--muted); }
    .rating-bars { display: flex; flex-direction: column; gap: 6px; }
    .rating-bar-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .rating-bar-row span { width: 28px; text-align: right; color: var(--muted); }
    .bar-track { flex: 1; height: 7px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: #f4a261; border-radius: 4px; }
    .reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 28px; }
    .review-card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 18px; box-shadow: var(--shadow); }
    .review-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .review-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; flex-shrink: 0; }
    .review-meta strong { font-size: 14px; font-weight: 700; display: block; }
    .review-meta small { font-size: 11px; color: var(--muted); }
    .review-stars { color: #f4a261; font-size: 14px; margin-bottom: 8px; }
    .review-title { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
    .review-text { font-size: 13px; color: var(--muted); line-height: 1.6; }
    .verified-badge { display: inline-block; font-size: 10px; color: var(--primary); font-weight: 700; background: var(--primary-light); padding: 2px 7px; border-radius: 10px; margin-top: 8px; }

    /* Review gate */
    .review-gate { background: #f8f9fa; border-radius: 14px; padding: 28px; border: 1px solid var(--border); text-align: center; }
    .review-gate h3 { font-size: 18px; font-weight: 800; margin-bottom: 8px; }
    .review-gate p { font-size: 14px; color: var(--muted); max-width: 460px; margin: 0 auto 20px; line-height: 1.6; }
    .review-gate-actions { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
    .write-review-btn { background: #1b1b1b; color: #fff; border: none; padding: 12px 28px; border-radius: var(--radius); font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
    .write-review-btn:hover { background: var(--primary); }
    .gate-message { display: none; background: #fff3cd; border: 1px solid #ffc107; border-radius: var(--radius); padding: 16px 20px; margin-top: 16px; text-align: left; font-size: 14px; line-height: 1.6; }
    .gate-message strong { display: block; margin-bottom: 4px; font-size: 15px; }

    /* Footer */
    footer { background: #1b1b1b; color: #fff; padding: 36px 16px 20px; }
    .footer-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 36px; padding-bottom: 28px; border-bottom: 1px solid #333; }
    .footer-brand p { font-size: 13px; color: #9ca3af; line-height: 1.6; margin-top: 10px; }
    footer h4 { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
    footer ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    footer ul li a { font-size: 12px; color: #9ca3af; transition: color 0.2s; }
    footer ul li a:hover { color: #fff; }
    .footer-bottom { max-width: 1100px; margin: 14px auto 0; font-size: 11px; color: #6b7280; text-align: center; }

    /* Responsive */
    @media (max-width: 900px) { .header-nav { gap: 14px; font-size: 12px; } .product-wrapper { gap: 28px; } .reviews-grid { grid-template-columns: repeat(2,1fr); } .reviews-summary { grid-template-columns: 130px 1fr; gap: 20px; } }
    @media (max-width: 768px) {
      .topbar { font-size: 11px; padding: 7px 10px; } header { padding: 10px 14px; } .logo { font-size: 18px; } .header-nav { display: none; } .mob-btn { display: block; } .header-icons svg { width: 24px; height: 24px; }
      .breadcrumb { margin-top: 10px; padding: 0 14px; }
      .product-wrapper { grid-template-columns: 1fr; gap: 20px; margin: 12px auto 32px; padding: 0 14px; }
      .gallery { position: static; }
      .gallery-thumbs img { width: 56px; height: 56px; }
      .product-title { font-size: 20px; } .price-sale { font-size: 26px; }
      .features-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
      .specs-grid { grid-template-columns: 1fr; }
      .add-to-cart-btn { font-size: 15px; padding: 15px; }
      .reviews-section { padding: 0 14px; margin-bottom: 40px; }
      .reviews-summary { grid-template-columns: 1fr; text-align: center; }
      .reviews-avg { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
      .reviews-grid { grid-template-columns: 1fr; }
      .footer-grid { grid-template-columns: 1fr; gap: 20px; } footer { padding: 28px 14px 16px; }
      .review-gate-actions { flex-direction: column; } .write-review-btn { width: 100%; }
      #purchase-notif { max-width: 240px; font-size: 12px; }
    }
    @media (max-width: 480px) {
      .product-title { font-size: 18px; } .price-sale { font-size: 22px; }
      .bundle-option { gap: 10px; padding: 10px 12px; }
      .trust-item { font-size: 10px; padding: 10px 4px; }
    }
  </style>
</head>
<body>

<!-- Purchase Notification Popup -->
<div id="purchase-notif">
  <div class="notif-icon">💡</div>
  <div class="notif-text">
    <strong id="notif-name">Ahmed from Lahore</strong>
    <span id="notif-action">just purchased Motion Sensor Night Light</span>
  </div>
  <div class="notif-time" id="notif-time">2m ago</div>
</div>

<div class="topbar"><span>🚚</span> FREE DELIVERY ALL OVER PAKISTAN &nbsp;|&nbsp; 5–7 DAY DELIVERY <span>🚚</span></div>

<header>
  <button class="mob-btn" onclick="toggleMobNav()" aria-label="Menu">&#9776;</button>
  <div class="logo">Snap<span>lyr</span></div>
  <nav class="header-nav">
    <a href="<?php echo home_url(); ?>">Home</a>
    <a href="<?php echo home_url('/motion-sensor-night-light/'); ?>" class="active-link">Motion Sensor Light</a>
    <a href="<?php echo home_url('/our-products/'); ?>">Shop</a>
    <a href="#">Contact</a>
  </nav>
  <div class="header-icons">
    <a href="<?php echo function_exists('wc_get_cart_url') ? wc_get_cart_url() : home_url('/cart/'); ?>" aria-label="Cart">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    </a>
  </div>
</header>
<nav class="mob-nav" id="mobNav">
  <a href="<?php echo home_url(); ?>"><span class="nav-icon">🏠</span> Home</a>
  <a href="<?php echo home_url('/motion-sensor-night-light/'); ?>" class="active-link"><span class="nav-icon">💡</span> Motion Sensor Night Light</a>
  <a href="<?php echo home_url('/our-products/'); ?>"><span class="nav-icon">🛍️</span> Shop All Products</a>
  <a href="<?php echo function_exists('wc_get_cart_url') ? wc_get_cart_url() : home_url('/cart/'); ?>"><span class="nav-icon">🛒</span> Cart</a>
  <a href="#"><span class="nav-icon">📞</span> Contact Us</a>
</nav>

<div class="breadcrumb">
  <a href="<?php echo home_url(); ?>">Home</a> ›
  <a href="<?php echo home_url('/our-products/'); ?>">Shop</a> › Motion Sensor Night Light
</div>

<!-- ── PRODUCT SECTION ── -->
<div class="product-wrapper">

  <!-- Gallery -->
  <div class="gallery">
    <div class="gallery-main">
      <img id="main-img" src="https://snaplyr.com/wp-content/uploads/2026/05/1-2.webp" alt="Motion Sensor Night Light"/>
    </div>
    <div class="gallery-thumbs">
      <img src="https://snaplyr.com/wp-content/uploads/2026/05/1-2.webp" alt="Motion Sensor Night Light 1" class="active" onclick="switchImg(this)"/>
      <img src="https://snaplyr.com/wp-content/uploads/2026/05/3m.webp"  alt="Motion Sensor Night Light 2" onclick="switchImg(this)"/>
      <img src="https://snaplyr.com/wp-content/uploads/2026/05/2-2.webp" alt="Motion Sensor Night Light 3" onclick="switchImg(this)"/>
      <img src="https://snaplyr.com/wp-content/uploads/2026/05/4m.webp"  alt="Motion Sensor Night Light 4" onclick="switchImg(this)"/>
    </div>
  </div>

  <!-- Product Info -->
  <div class="product-info">
    <h1 class="product-title">Motion Sensor Night Light</h1>

    <div class="rating-row">
      <span class="stars">★★★★★</span>
      <span class="rating-score">4.9</span>
      <span class="rating-count">| 2.9k reviews</span>
      <span class="trust-badge">Trustscore 4.9</span>
    </div>

    <!-- Size selector -->
    <div class="size-label">Select Size: <span id="selected-size-label">50 CM</span></div>
    <div class="size-options">
      <?php foreach ($sizes as $i => $s): ?>
      <button class="size-btn <?php echo $i === 3 ? 'active' : ''; ?>"
              data-size="<?php echo esc_attr($s[0]); ?>"
              data-sale="<?php echo $s[1]; ?>"
              data-orig="<?php echo $s[2]; ?>"
              onclick="selectSize(this)">
        <?php echo esc_html($s[0]); ?>
        <span class="size-price-hint">Rs.<?php echo number_format($s[1]); ?></span>
      </button>
      <?php endforeach; ?>
    </div>

    <!-- Price -->
    <div class="price-block">
      <span class="price-original" id="price-orig">Rs.2,899.00 PKR</span>
      <span class="price-sale" id="price-sale">Rs.2,649.00 PKR</span>
      <span class="price-badge">Sale</span>
    </div>
    <p class="price-note"><a href="#">Shipping</a> calculated at checkout.</p>

    <!-- Features -->
    <div class="features-title">Why You'll Love It</div>
    <div class="features-grid">
      <div class="feature-item"><span class="feature-icon">✔</span><span>Smart Motion Sensor Activation</span></div>
      <div class="feature-item"><span class="feature-icon">✔</span><span>USB Type-C Rechargeable Battery</span></div>
      <div class="feature-item"><span class="feature-icon">✔</span><span>Magnetic &amp; Adhesive Installation</span></div>
      <div class="feature-item"><span class="feature-icon">✔</span><span>Slim, Portable &amp; Versatile Design</span></div>
    </div>

    <!-- Happy customers -->
    <div class="happy-bar">
      <div class="happy-avatars">
        <img src="https://img.freepik.com/free-photo/beautiful-young-asian-woman-traditional-pakistani-dress-smiling_74952-2516.jpg" alt="c1"/>
        <img src="https://img.freepik.com/free-photo/happy-muslim-woman-posing-smiling-hijab_176420-9487.jpg" alt="c2"/>
        <img src="https://img.freepik.com/free-photo/young-south-asian-woman-smiling-casual-outdoor_1268-17046.jpg" alt="c3"/>
      </div>
      1,000+ HAPPY CUSTOMERS
    </div>

    <!-- Stock warning -->
    <div class="stock-warning">⚡ Hurry! Only 28 left in stock.</div>

    <!-- Sale countdown -->
    <div class="sale-countdown" id="sale-countdown">⏳ Hurry! Sale ends in loading…</div>

    <!-- Bundle section -->
    <div class="bundle-section">
      <div class="bundle-title">Buy MORE – SAVE Upto 26%</div>
      <div class="bundle-subtitle">Don't Miss the OFFER</div>

      <label class="bundle-option" id="bundle-1">
        <input type="radio" name="bundle" value="1" checked onchange="selectBundle(1,0)"/>
        <div class="bundle-label">
          <strong>Buy 1</strong>
          <small>Standard</small>
        </div>
        <div class="bundle-prices">
          <span class="bundle-price-sale" id="b1-sale">Rs.2,649</span>
          <span class="bundle-price-orig" id="b1-orig">Rs.2,899</span>
        </div>
      </label>

      <label class="bundle-option" id="bundle-2">
        <input type="radio" name="bundle" value="2" onchange="selectBundle(2,10)"/>
        <div class="bundle-label">
          <strong>Buy 2</strong>
          <small>10% OFF each</small>
        </div>
        <div class="bundle-prices">
          <span class="bundle-price-sale" id="b2-sale">Rs.4,768</span>
          <span class="bundle-price-orig" id="b2-orig">Rs.5,798</span>
        </div>
        <span class="bundle-badge">10% OFF</span>
      </label>

      <label class="bundle-option active" id="bundle-3">
        <input type="radio" name="bundle" value="3" onchange="selectBundle(3,20)"/>
        <div class="bundle-label">
          <strong>Buy 3</strong>
          <small>20% OFF each</small>
        </div>
        <div class="bundle-prices">
          <span class="bundle-price-sale" id="b3-sale">Rs.6,358</span>
          <span class="bundle-price-orig" id="b3-orig">Rs.8,697</span>
        </div>
        <span class="bundle-badge">BEST VALUE</span>
      </label>

      <label class="bundle-option" id="bundle-4">
        <input type="radio" name="bundle" value="4" onchange="selectBundle(4,23)"/>
        <div class="bundle-label">
          <strong>Buy 4</strong>
          <small>23% OFF each</small>
        </div>
        <div class="bundle-prices">
          <span class="bundle-price-sale" id="b4-sale">Rs.8,156</span>
          <span class="bundle-price-orig" id="b4-orig">Rs.11,596</span>
        </div>
        <span class="bundle-badge">23% OFF</span>
      </label>

      <label class="bundle-option" id="bundle-5">
        <input type="radio" name="bundle" value="5" onchange="selectBundle(5,26)"/>
        <div class="bundle-label">
          <strong>Buy 5</strong>
          <small>26% OFF each</small>
        </div>
        <div class="bundle-prices">
          <span class="bundle-price-sale" id="b5-sale">Rs.9,781</span>
          <span class="bundle-price-orig" id="b5-orig">Rs.14,495</span>
        </div>
        <span class="bundle-badge">26% OFF</span>
      </label>
    </div>

    <!-- Dispatch timer -->
    <div class="dispatch-box">
      <span class="dispatch-flag">🇵🇰</span>
      Free Shipping to <strong>Pakistan</strong><br/>
      Order within the next <span class="dispatch-timer" id="dispatch-timer">loading…</span> for dispatch <strong>today</strong>, and you'll receive your package between
      <strong id="delivery-min"></strong> and <strong id="delivery-max"></strong>
    </div>

    <!-- Add to cart -->
    <?php if ($wc_product_id): ?>
    <form method="post" action="<?php echo esc_url(home_url('/cart/')); ?>" id="atc-form">
      <input type="hidden" name="add-to-cart" value="<?php echo esc_attr($wc_product_id); ?>"/>
      <input type="hidden" name="quantity" id="atc-qty" value="1"/>
      <input type="hidden" name="snaplyr_size" id="atc-size" value="50 CM"/>
      <button type="submit" class="add-to-cart-btn">🛒 &nbsp; Add to Cart</button>
    </form>
    <?php else: ?>
    <a href="<?php echo home_url('/our-products/'); ?>" class="add-to-cart-btn" style="display:block;text-align:center;">🛒 &nbsp; Order Now</a>
    <?php endif; ?>

    <!-- Trust strip -->
    <div class="trust-strip">
      <div class="trust-item"><span class="trust-ico">🔒</span>Secure Payment</div>
      <div class="trust-item"><span class="trust-ico">🚚</span>Fast Delivery</div>
      <div class="trust-item"><span class="trust-ico">📍</span>Pakistan Wide</div>
    </div>

  </div><!-- /product-info -->
</div><!-- /product-wrapper -->

<!-- ── DESCRIPTION & SPECS ── -->
<div class="desc-section">
  <h2>✅ Product Features</h2>
  <div class="specs-grid">
    <div class="spec-card">
      <h4>LED Light Sizes</h4>
      <p>Available in 10cm, 20cm, 30cm &amp; 50cm. Each size has varying LED beads for your preferred brightness.</p>
    </div>
    <div class="spec-card">
      <h4>Magnetic Installation</h4>
      <p>No drilling required. Stick the iron sheet, attach magnetic strip — done. Easy to install, remove &amp; recharge.</p>
    </div>
    <div class="spec-card">
      <h4>Rechargeable &amp; Wireless</h4>
      <p>USB Type-C rechargeable. No batteries to replace. Completely wireless and clean installation.</p>
    </div>
    <div class="spec-card">
      <h4>Dimmable Cool White</h4>
      <p>Cool White 6000–7000K. Single-color version is fully dimmable for perfect ambiance.</p>
    </div>
  </div>

  <h2 style="margin-bottom:14px;">🔘 Multi-Mode Smart Switch</h2>
  <ul class="modes-list">
    <li><div class="mode-dot">1</div><div><strong>Always-On Mode</strong> – Light stays on continuously</div></li>
    <li><div class="mode-dot">2</div><div><strong>Night Sensing Mode</strong> – Activates only in darkness</div></li>
    <li><div class="mode-dot">3</div><div><strong>All-Day Sensing Mode</strong> – Activates even in daylight</div></li>
    <li><div class="mode-dot">4</div><div><strong>OFF</strong> – Completely turns off the light</div></li>
    <li><div class="mode-dot">⟳</div><div><strong>Long Press</strong> – Adjust brightness freely to your liking</div></li>
  </ul>

  <h2 style="margin-bottom:14px;">✅ Specifications</h2>
  <div class="specs-grid">
    <div class="spec-card"><h4>Product Name</h4><p>PIR Motion Sensor Cabinet Light</p></div>
    <div class="spec-card"><h4>Input Voltage</h4><p>DC 5V</p></div>
    <div class="spec-card"><h4>Charging Plug</h4><p>USB Type-C</p></div>
    <div class="spec-card"><h4>Available Lengths</h4><p>10cm / 20cm / 30cm / 50cm</p></div>
    <div class="spec-card"><h4>Lighting Color</h4><p>Cool White (6000–7000K)</p></div>
    <div class="spec-card"><h4>Features</h4><p>Rechargeable · Wireless · Dimmable · Motion Sensor</p></div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:4px;">
    <div class="spec-card"><h4>Shipping Policy</h4><p>FREE SHIPPING all over Pakistan. Delivered in 5 to 7 days.</p></div>
    <div class="spec-card"><h4>Return &amp; Exchange</h4><p>7-day return &amp; exchange if you have any problem with the product.</p></div>
  </div>
</div>

<!-- ── REVIEWS ── -->
<div class="reviews-section" id="reviews">
  <h2>Customer Reviews</h2>

  <div class="reviews-summary">
    <div class="reviews-avg">
      <div class="avg-num">4.9</div>
      <div class="avg-stars">★★★★★</div>
      <div class="avg-label">2.9k reviews</div>
    </div>
    <div class="rating-bars">
      <div class="rating-bar-row"><span>5 ★</span><div class="bar-track"><div class="bar-fill" style="width:91%"></div></div><span style="width:28px;text-align:left;">91%</span></div>
      <div class="rating-bar-row"><span>4 ★</span><div class="bar-track"><div class="bar-fill" style="width:6%"></div></div><span style="width:28px;text-align:left;">6%</span></div>
      <div class="rating-bar-row"><span>3 ★</span><div class="bar-track"><div class="bar-fill" style="width:2%"></div></div><span style="width:28px;text-align:left;">2%</span></div>
      <div class="rating-bar-row"><span>2 ★</span><div class="bar-track"><div class="bar-fill" style="width:1%"></div></div><span style="width:28px;text-align:left;">1%</span></div>
      <div class="rating-bar-row"><span>1 ★</span><div class="bar-track"><div class="bar-fill" style="width:0%"></div></div><span style="width:28px;text-align:left;">0%</span></div>
    </div>
  </div>

  <!-- DB reviews (new ones at top) -->
  <?php if (!empty($db_reviews)): ?>
  <div class="reviews-grid" style="margin-bottom:20px;">
    <?php foreach ($db_reviews as $r):
      $stars = intval(get_post_meta($r->ID, '_snaplyr_stars', true));
      $text  = get_post_meta($r->ID, '_snaplyr_review_text', true);
      $date  = get_post_meta($r->ID, '_snaplyr_date_text', true) ?: get_the_date('M j, Y', $r->ID);
      $name  = get_the_title($r->ID);
      $initial = strtoupper(substr($name, 0, 1));
    ?>
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar"><?php echo esc_html($initial); ?></div>
        <div class="review-meta">
          <strong><?php echo esc_html($name); ?></strong>
          <small><?php echo esc_html($date); ?></small>
        </div>
      </div>
      <div class="review-stars"><?php echo str_repeat('★', $stars) . str_repeat('☆', 5 - $stars); ?></div>
      <p class="review-text"><?php echo esc_html($text); ?></p>
      <span class="verified-badge">✓ Verified Customer</span>
    </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>

  <!-- Hardcoded reviews -->
  <div class="reviews-grid">

    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar" style="background:#e63946;">F</div>
        <div class="review-meta"><strong>Fatima Malik</strong><small>2 weeks ago · Lahore</small></div>
      </div>
      <div class="review-stars">★★★★★</div>
      <div class="review-title">Exactly what I needed!</div>
      <p class="review-text">Installed it under my kitchen cabinets. The magnetic installation was super easy — just stick and done. Light turns on automatically when I enter the kitchen at night. Really bright for its size.</p>
      <span class="verified-badge">✓ Verified Customer</span>
    </div>

    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar" style="background:#2d6a4f;">U</div>
        <div class="review-meta"><strong>Usman Tariq</strong><small>3 weeks ago · Karachi</small></div>
      </div>
      <div class="review-stars">★★★★★</div>
      <div class="review-title">Great for wardrobe use</div>
      <p class="review-text">Bought the 30cm size. Perfect for my wardrobe. Charges quickly with USB and lasts a long time. Motion sensor works great — only turns on when I open the door. Very happy with this purchase!</p>
      <span class="verified-badge">✓ Verified Customer</span>
    </div>

    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar" style="background:#f4a261;">S</div>
        <div class="review-meta"><strong>Sara Ahmed</strong><small>1 month ago · Islamabad</small></div>
      </div>
      <div class="review-stars">★★★★★</div>
      <div class="review-title">No more dark staircases!</div>
      <p class="review-text">Placed two lights on my staircase. The night sensing mode is perfect — they only activate in the dark. Kids can now safely go downstairs at night. The 50cm size gives excellent coverage.</p>
      <span class="verified-badge">✓ Verified Customer</span>
    </div>

    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar" style="background:#6366f1;">A</div>
        <div class="review-meta"><strong>Ali Hassan</strong><small>1 month ago · Faisalabad</small></div>
      </div>
      <div class="review-stars">★★★★★</div>
      <div class="review-title">USB charging is convenient</div>
      <p class="review-text">No need to buy batteries ever again! Just plug in the USB cable for a couple of hours and it works for weeks. Got the 20cm for my bathroom and it's been brilliant. Very sturdy and bright.</p>
      <span class="verified-badge">✓ Verified Customer</span>
    </div>

    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar" style="background:#10b981;">N</div>
        <div class="review-meta"><strong>Nadia Iqbal</strong><small>5 weeks ago · Multan</small></div>
      </div>
      <div class="review-stars">★★★★★</div>
      <div class="review-title">Best purchase this year!</div>
      <p class="review-text">Bought a pack of 3 — one for bedroom, one for hallway, one for kids room. The dimming feature with long press is amazing. Can set it to perfect brightness for night use without disturbing sleep.</p>
      <span class="verified-badge">✓ Verified Customer</span>
    </div>

    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar" style="background:#ec4899;">Z</div>
        <div class="review-meta"><strong>Zainab Farooq</strong><small>6 weeks ago · Rawalpindi</small></div>
      </div>
      <div class="review-stars">★★★★★</div>
      <div class="review-title">Quality is amazing</div>
      <p class="review-text">I was skeptical at first but this thing is genuinely good quality. The magnetic attachment is very strong, doesn't fall off. Motion sensor range is perfect — about 2-3 meters. Highly recommended!</p>
      <span class="verified-badge">✓ Verified Customer</span>
    </div>

  </div>

  <!-- Review gate -->
  <div class="review-gate">
    <h3>Share Your Experience</h3>
    <p>Have you used the Motion Sensor Night Light? We'd love to hear your honest feedback!</p>
    <div class="review-gate-actions">
      <button class="write-review-btn" onclick="toggleGate()">✏️ Write a Review</button>
    </div>
    <div class="gate-message" id="gate-msg">
      <strong>📦 Please use the product first!</strong>
      To ensure genuine reviews, we only accept feedback from customers who have received and used the product. Once you've had a chance to try it, we'll be happy to hear from you!<br/><br/>
      <em>Already received your order? <a href="mailto:hello@snaplyr.com" style="color:var(--primary);">Email us</a> and we'll send you the review link.</em>
    </div>
  </div>
</div>

<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <div class="logo" style="color:#fff;font-size:22px;">Snap<span style="color:#f4a261;">lyr</span></div>
      <p>Premium smart lighting solutions for every home. Quality products, delivered across Pakistan.</p>
    </div>
    <div>
      <h4>Customer Care</h4>
      <ul>
        <li><a href="#">Contact Us</a></li>
        <li><a href="#">FAQs</a></li>
        <li><a href="#">Shipping Policy</a></li>
        <li><a href="#">Return &amp; Exchange</a></li>
      </ul>
    </div>
    <div>
      <h4>Track Your Order</h4>
      <ul>
        <li><a href="<?php echo function_exists('wc_get_account_endpoint_url') ? wc_get_account_endpoint_url('orders') : home_url('/my-account/orders/'); ?>">Orders</a></li>
        <li><a href="<?php echo function_exists('wc_get_account_endpoint_url') ? wc_get_account_endpoint_url('dashboard') : home_url('/my-account/'); ?>">Profile</a></li>
        <li><a href="#">Privacy Policy</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">&copy; <?php echo date('Y'); ?> Snaplyr. All rights reserved.</div>
</footer>

<?php wp_footer(); ?>

<script>
// ── Mobile nav ──
function toggleMobNav() {
  var n = document.getElementById('mobNav');
  n.classList.toggle('open');
}
document.addEventListener('click', function(e) {
  var nav = document.getElementById('mobNav');
  if (nav.classList.contains('open') && !nav.contains(e.target) && !e.target.closest('.mob-btn')) {
    nav.classList.remove('open');
  }
});

// ── Gallery ──
function switchImg(el) {
  document.getElementById('main-img').src = el.src;
  document.querySelectorAll('.gallery-thumbs img').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

// ── Size selector ──
var currentSale = 2649, currentOrig = 2899, currentSize = '50 CM';
var selectedQty = 1, selectedDiscount = 0;

function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentSale = parseInt(btn.dataset.sale);
  currentOrig = parseInt(btn.dataset.orig);
  currentSize = btn.dataset.size;
  document.getElementById('selected-size-label').textContent = currentSize;
  document.getElementById('price-orig').textContent = 'Rs.' + currentOrig.toLocaleString() + '.00 PKR';
  document.getElementById('price-sale').textContent = 'Rs.' + currentSale.toLocaleString() + '.00 PKR';
  if (document.getElementById('atc-size')) document.getElementById('atc-size').value = currentSize;
  updateBundlePrices();
}

function fmt(n) { return 'Rs.' + Math.round(n).toLocaleString(); }

function updateBundlePrices() {
  var s = currentSale, o = currentOrig;
  // qty 1
  document.getElementById('b1-sale').textContent = fmt(s * 1);
  document.getElementById('b1-orig').textContent = fmt(o * 1);
  // qty 2 / 10%
  document.getElementById('b2-sale').textContent = fmt(s * 2 * 0.90);
  document.getElementById('b2-orig').textContent = fmt(o * 2);
  // qty 3 / 20%
  document.getElementById('b3-sale').textContent = fmt(s * 3 * 0.80);
  document.getElementById('b3-orig').textContent = fmt(o * 3);
  // qty 4 / 23%
  document.getElementById('b4-sale').textContent = fmt(s * 4 * 0.77);
  document.getElementById('b4-orig').textContent = fmt(o * 4);
  // qty 5 / 26%
  document.getElementById('b5-sale').textContent = fmt(s * 5 * 0.74);
  document.getElementById('b5-orig').textContent = fmt(o * 5);
}

function selectBundle(qty, disc) {
  selectedQty = qty; selectedDiscount = disc;
  document.querySelectorAll('.bundle-option').forEach(b => b.classList.remove('active'));
  document.getElementById('bundle-' + qty).classList.add('active');
  if (document.getElementById('atc-qty')) document.getElementById('atc-qty').value = qty;
}

// ── Sale countdown (random 90–150 min) ──
(function() {
  var mins = 90 + Math.floor(Math.random() * 60);
  var end = Date.now() + mins * 60000;
  function tick() {
    var d = end - Date.now();
    if (d <= 0) { document.getElementById('sale-countdown').textContent = '⏳ Sale has ended!'; return; }
    var h = Math.floor(d / 3600000), m = Math.floor((d % 3600000) / 60000), s = Math.floor((d % 60000) / 1000);
    document.getElementById('sale-countdown').textContent = '⏳ Hurry! Sale ends in ' + h + 'h ' + m + 'm ' + s + 's';
    setTimeout(tick, 1000);
  }
  tick();
})();

// ── Dispatch timer (counts down to 6 PM today) ──
(function() {
  function tick() {
    var now = new Date();
    var cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
    var d = cutoff - now;
    if (d <= 0) d = 0;
    var h = Math.floor(d / 3600000), m = Math.floor((d % 3600000) / 60000), s = Math.floor((d % 60000) / 1000);
    document.getElementById('dispatch-timer').textContent = h + 'h ' + m + 'm ' + s + 's';

    // Delivery range: 5–7 days from today
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var d1 = new Date(now); d1.setDate(d1.getDate() + 5);
    var d2 = new Date(now); d2.setDate(d2.getDate() + 7);
    document.getElementById('delivery-min').textContent = months[d1.getMonth()] + ' ' + d1.getDate();
    document.getElementById('delivery-max').textContent = months[d2.getMonth()] + ' ' + d2.getDate();
    setTimeout(tick, 1000);
  }
  tick();
})();

// ── Purchase notifications ──
(function() {
  var names = [
    'Ahmed','Zaid','Usman','Ali','Hassan','Sara','Fatima','Ayesha','Nadia','Sana',
    'Bilal','Omar','Imran','Kamran','Asif','Hina','Rabia','Tariq','Hamza','Zara',
    'Nadeem','Aisha','Rizwan','Bushra','Farhan','Mehwish','Shoaib','Sobia','Waqar','Amna'
  ];
  var cities = [
    'Lahore','Karachi','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar',
    'Gujranwala','Sialkot','Quetta','Hyderabad','Abbottabad','Gojra','Sargodha',
    'Bahawalpur','Dera Ghazi Khan','Sheikhupura','Sukkur','Larkana','Mardan'
  ];
  var products = ['Motion Sensor Night Light (10 CM)','Motion Sensor Night Light (20 CM)','Motion Sensor Night Light (30 CM)','Motion Sensor Night Light (50 CM)'];
  var times = ['just now','1m ago','2m ago','3m ago','5m ago','7m ago'];
  // intervals in ms: 3s, 5s, 2s, 1s cycling with randomness
  var intervals = [3000, 5000, 2000, 1000, 4000, 3500, 2500, 1500];
  var idx = 0;

  function showNotif() {
    var n = names[Math.floor(Math.random() * names.length)];
    var c = cities[Math.floor(Math.random() * cities.length)];
    var p = products[Math.floor(Math.random() * products.length)];
    var t = times[Math.floor(Math.random() * times.length)];
    var el = document.getElementById('purchase-notif');
    document.getElementById('notif-name').textContent = n + ' from ' + c;
    document.getElementById('notif-action').textContent = 'just purchased ' + p;
    document.getElementById('notif-time').textContent = t;
    el.classList.add('show');
    setTimeout(function() { el.classList.remove('show'); }, 3500);
    idx = (idx + 1) % intervals.length;
    var next = intervals[idx] + Math.floor(Math.random() * 1000);
    setTimeout(showNotif, next + 3800);
  }

  setTimeout(showNotif, 3000);
})();

// ── Review gate toggle ──
function toggleGate() {
  var m = document.getElementById('gate-msg');
  m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

// Initial bundle price update
updateBundlePrices();
</script>
</body>
</html>
