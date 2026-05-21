<?php
/**
 * Template Name: Shop Page
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Shop – <?php bloginfo('name'); ?></title>
  <?php wp_head(); ?>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: #2d6a4f;
      --primary-light: #d8f3dc;
      --accent: #e63946;
      --gold: #f4a261;
      --text: #1b1b1b;
      --muted: #6b7280;
      --border: #e5e7eb;
      --radius: 10px;
      --shadow: 0 2px 16px rgba(0,0,0,0.08);
    }
    html { scroll-behavior: smooth; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: var(--text); background: #f8f9fa; margin: 0; -webkit-text-size-adjust: 100%; }
    a { text-decoration: none; color: inherit; }
    img { max-width: 100%; display: block; }

    /* ── Topbar ── */
    .topbar { background: #1b1b1b; color: #fff; text-align: center; font-size: 12px; padding: 8px 12px; line-height: 1.4; }
    .topbar span { color: #f4a261; }

    /* ── Header ── */
    header { background: #fff; border-bottom: 1px solid var(--border); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 6px rgba(0,0,0,0.06); gap: 12px; }
    .logo { font-size: 20px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }
    .logo span { color: var(--primary); }
    .header-nav { display: flex; gap: 18px; font-size: 13px; font-weight: 500; }
    .header-nav a { white-space: nowrap; transition: color 0.2s; }
    .header-nav a:hover { color: var(--primary); }
    .header-icons { display: flex; gap: 14px; align-items: center; flex-shrink: 0; }
    .header-icons svg { width: 22px; height: 22px; cursor: pointer; }

    /* ── Breadcrumb ── */
    .breadcrumb { max-width: 1100px; margin: 12px auto 0; padding: 0 16px; font-size: 12px; color: var(--muted); }
    .breadcrumb a { color: var(--muted); }
    .breadcrumb a:hover { color: var(--primary); }

    /* ── Shop Hero ── */
    .shop-hero { max-width: 1100px; margin: 32px auto 0; padding: 0 16px; text-align: center; }
    .shop-hero h1 { font-size: 32px; font-weight: 800; line-height: 1.2; margin-bottom: 10px; }
    .shop-hero p { font-size: 15px; color: var(--muted); max-width: 520px; margin: 0 auto; line-height: 1.6; }

    /* ── Products Grid ── */
    .products-section { max-width: 1100px; margin: 40px auto 60px; padding: 0 16px; }
    .products-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }

    /* ── Product Card ── */
    .product-card {
      background: #fff;
      border-radius: 14px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(0,0,0,0.13);
    }
    .product-card-img {
      position: relative;
      aspect-ratio: 4/3;
      overflow: hidden;
      background: #f0f0f0;
    }
    .product-card-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s;
    }
    .product-card:hover .product-card-img img { transform: scale(1.04); }
    .card-badge-sale {
      position: absolute;
      top: 12px;
      left: 12px;
      background: var(--accent);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      z-index: 1;
      letter-spacing: 0.5px;
    }
    .product-card-body {
      padding: 18px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }
    .card-product-name {
      font-size: 18px;
      font-weight: 800;
      line-height: 1.2;
      color: var(--text);
    }
    .card-rating-row {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
    }
    .card-stars { color: #f4a261; font-size: 15px; letter-spacing: 1px; }
    .card-rating-num { font-weight: 700; font-size: 13px; }
    .card-review-count { font-size: 12px; color: var(--muted); }
    .card-price-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .card-price-original { text-decoration: line-through; color: var(--muted); font-size: 14px; }
    .card-price-sale { font-size: 22px; font-weight: 800; color: var(--accent); }
    .card-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #1b1b1b;
      color: #fff;
      border: none;
      padding: 13px 20px;
      font-size: 14px;
      font-weight: 700;
      border-radius: var(--radius);
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
      letter-spacing: 0.3px;
      margin-top: auto;
      text-align: center;
    }
    .card-btn:hover { background: var(--primary); color: #fff; }
    .card-btn:active { transform: scale(0.99); }

    /* ── Footer ── */
    footer { background: #1b1b1b; color: #fff; padding: 36px 16px 20px; }
    .footer-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 36px; padding-bottom: 28px; border-bottom: 1px solid #333; }
    .footer-brand p { font-size: 13px; color: #9ca3af; line-height: 1.6; margin-top: 10px; }
    footer h4 { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
    footer ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    footer ul li a { font-size: 12px; color: #9ca3af; transition: color 0.2s; }
    footer ul li a:hover { color: #fff; }
    .footer-bottom { max-width: 1100px; margin: 14px auto 0; font-size: 11px; color: #6b7280; text-align: center; }

    /* ── Mobile Nav ── */
    .mob-btn { display: none; background: none; border: none; font-size: 26px; cursor: pointer; color: var(--text); padding: 2px 6px; line-height: 1; }
    .mob-nav { display: none; position: fixed; top: 57px; left: 0; right: 0; background: #fff; border-bottom: 2px solid var(--border); box-shadow: 0 6px 20px rgba(0,0,0,0.1); z-index: 99; padding: 8px 0; }
    .mob-nav.open { display: block; }
    .mob-nav a { display: flex; align-items: center; gap: 10px; padding: 14px 22px; font-size: 15px; font-weight: 600; color: var(--text); border-bottom: 1px solid #f3f4f6; text-decoration: none; transition: background 0.15s; }
    .mob-nav a:last-child { border-bottom: none; }
    .mob-nav a:hover, .mob-nav a.active-link { background: var(--primary-light); color: var(--primary); }
    .mob-nav a .nav-icon { font-size: 17px; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .topbar { font-size: 11px; padding: 7px 10px; }
      header { padding: 10px 14px; }
      .logo { font-size: 18px; }
      .header-nav { display: none; }
      .mob-btn { display: block; }
      .header-icons svg { width: 24px; height: 24px; }
      .breadcrumb { margin-top: 10px; padding: 0 14px; }
      .shop-hero { margin-top: 24px; padding: 0 14px; }
      .shop-hero h1 { font-size: 24px; }
      .shop-hero p { font-size: 14px; }
      .products-section { padding: 0 14px; margin-bottom: 40px; }
      .products-grid { grid-template-columns: 1fr; gap: 18px; }
      .card-product-name { font-size: 16px; }
      .card-price-sale { font-size: 20px; }
      .footer-grid { grid-template-columns: 1fr; gap: 20px; }
      footer { padding: 28px 14px 16px; }
    }
    @media (max-width: 480px) {
      .shop-hero h1 { font-size: 22px; }
      .card-product-name { font-size: 15px; }
      .card-price-sale { font-size: 18px; }
    }
  </style>
</head>
<body>
<div class="topbar"><span>🚚</span> FREE DELIVERY ALL OVER PAKISTAN <span>🚚</span></div>
<header>
  <button class="mob-btn" onclick="toggleMobNav()" aria-label="Menu">&#9776;</button>
  <div class="logo">Snap<span>lyr</span></div>
  <nav class="header-nav">
    <a href="<?php echo home_url(); ?>">Home</a>
    <a href="<?php echo home_url('/motion-sensor-night-light/'); ?>">Motion Sensor Light</a>
    <a href="<?php echo home_url('/our-products/'); ?>" class="active-link">Shop</a>
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
  <a href="<?php echo home_url('/motion-sensor-night-light/'); ?>"><span class="nav-icon">💡</span> Motion Sensor Light</a>
  <a href="<?php echo home_url('/our-products/'); ?>" class="active-link"><span class="nav-icon">🛍️</span> Shop All Products</a>
  <a href="<?php echo function_exists('wc_get_cart_url') ? wc_get_cart_url() : home_url('/cart/'); ?>"><span class="nav-icon">🛒</span> Cart</a>
  <a href="#"><span class="nav-icon">📞</span> Contact Us</a>
</nav>

<div class="breadcrumb">
  <a href="<?php echo home_url(); ?>">Home</a> › Our Products
</div>

<div class="shop-hero">
  <h1>Our Products</h1>
  <p>Premium quality lighting solutions, delivered across Pakistan</p>
</div>

<div class="products-section">
  <div class="products-grid">

    <!-- Product 1: LED Solar Wall Lamp -->
    <div class="product-card">
      <div class="product-card-img">
        <span class="card-badge-sale">Sale</span>
        <img src="https://snaplyr.com/wp-content/uploads/2026/05/1.webp" alt="LED Solar Wall Lamp | Outdoor"/>
      </div>
      <div class="product-card-body">
        <div class="card-product-name">LED Solar Wall Lamp | Outdoor</div>
        <div class="card-rating-row">
          <span class="card-stars">★★★★★</span>
          <span class="card-rating-num">4.9</span>
          <span class="card-review-count">| 1,427+ reviews</span>
        </div>
        <div class="card-price-row">
          <span class="card-price-original">Rs.4,500.00 PKR</span>
          <span class="card-price-sale">Rs.2,199.00 PKR</span>
        </div>
        <a href="<?php echo esc_url(home_url('/led-solar-wall-lamp/')); ?>" class="card-btn">
          Buy Now &nbsp;→
        </a>
      </div>
    </div>

    <!-- Product 2: Motion Sensor Night Light -->
    <div class="product-card">
      <div class="product-card-img">
        <span class="card-badge-sale">Sale</span>
        <img src="https://www.thebeamhouse.store/cdn/shop/files/e42ff886-fe8d-45be-b56e-9be116e6bce8.png?v=1754492881" alt="Motion Sensor Night Light"/>
      </div>
      <div class="product-card-body">
        <div class="card-product-name">Motion Sensor Night Light</div>
        <div class="card-rating-row">
          <span class="card-stars">★★★★★</span>
          <span class="card-rating-num">4.9</span>
          <span class="card-review-count">| 892+ reviews</span>
        </div>
        <div class="card-price-row">
          <span class="card-price-original">Rs.1,899.00 PKR</span>
          <span class="card-price-sale">Rs.1,650.00 PKR</span>
        </div>
        <a href="<?php echo esc_url(home_url('/motion-sensor-night-light/')); ?>" class="card-btn">
          Buy Now &nbsp;→
        </a>
      </div>
    </div>

  </div>
</div>

<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <div class="logo" style="color:#fff;font-size:22px;">Snap<span style="color:#f4a261;">lyr</span></div>
      <p>Premium outdoor lighting solutions for every home. Quality products, delivered across Pakistan.</p>
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
<script>
  function toggleMobNav() {
    var n = document.getElementById('mobNav');
    n.classList.toggle('open');
  }
  document.addEventListener('click', function(e) {
    var nav = document.getElementById('mobNav');
    if (nav && nav.classList.contains('open') && !nav.contains(e.target) && !e.target.closest('.mob-btn')) {
      nav.classList.remove('open');
    }
  });
</script>
<?php wp_footer(); ?>
</body>
</html>
