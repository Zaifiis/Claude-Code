<?php
/**
 * Template Name: Solar Product Page
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>LED Solar Wall Lamp | Outdoor – <?php bloginfo('name'); ?></title>
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
    body { font-family: 'Segoe UI', Arial, sans-serif; color: var(--text); background: #f8f9fa; margin: 0; }
    a { text-decoration: none; color: inherit; }
    img { max-width: 100%; display: block; }

    .topbar {
      background: #1b1b1b; color: #fff;
      text-align: center; font-size: 13px;
      padding: 8px 16px;
    }
    .topbar span { color: #f4a261; }

    header {
      background: #fff;
      border-bottom: 1px solid var(--border);
      padding: 14px 24px;
      display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    }
    .logo { font-size: 22px; font-weight: 800; }
    .logo span { color: var(--primary); }
    .header-icons { display: flex; gap: 18px; align-items: center; }
    .header-icons svg { width: 22px; height: 22px; cursor: pointer; }

    .breadcrumb {
      max-width: 1100px; margin: 14px auto 0;
      padding: 0 20px; font-size: 12px; color: var(--muted);
    }

    .product-wrapper {
      max-width: 1100px; margin: 16px auto 40px;
      padding: 0 20px;
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 40px; align-items: start;
    }

    .gallery { position: sticky; top: 80px; }
    .gallery-main {
      border-radius: var(--radius); overflow: hidden;
      background: #eee; aspect-ratio: 1/1; position: relative;
    }
    .gallery-main img { width: 100%; height: 100%; object-fit: cover; }
    .badge-sale {
      position: absolute; top: 14px; left: 14px;
      background: var(--accent); color: #fff;
      font-size: 12px; font-weight: 700;
      padding: 4px 10px; border-radius: 20px;
    }
    .gallery-thumbs { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
    .gallery-thumbs img {
      width: 70px; height: 70px; object-fit: cover;
      border-radius: 8px; border: 2px solid transparent;
      cursor: pointer; transition: border-color 0.2s;
    }
    .gallery-thumbs img.active { border-color: var(--primary); }

    .product-info { display: flex; flex-direction: column; gap: 16px; }
    .product-title { font-size: 26px; font-weight: 800; line-height: 1.2; }

    .rating-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .stars { color: #f4a261; font-size: 16px; }
    .trustbadge {
      background: #fff8ee; border: 1px solid #f4a261;
      border-radius: 5px; padding: 2px 8px;
      font-size: 12px; color: #b45309; font-weight: 600;
    }

    .price-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .price-original { text-decoration: line-through; color: var(--muted); font-size: 16px; }
    .price-sale { font-size: 26px; font-weight: 800; color: var(--accent); }
    .price-tag {
      background: var(--accent); color: #fff;
      padding: 2px 10px; border-radius: 4px;
      font-size: 12px; font-weight: 700;
    }

    .features-box { background: var(--primary-light); border-radius: var(--radius); padding: 16px; }
    .features-box h4 { font-size: 14px; font-weight: 700; margin-bottom: 12px; color: var(--primary); }
    .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .feature-item { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
    .feature-icon {
      width: 32px; height: 32px; background: var(--primary);
      border-radius: 8px; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; font-size: 16px;
    }

    .happy-badge {
      background: #1b1b1b; color: #fff;
      border-radius: 30px; padding: 8px 18px;
      font-size: 13px; display: flex; align-items: center;
      gap: 8px; width: fit-content;
    }
    .happy-badge .dot {
      width: 8px; height: 8px; background: #22c55e;
      border-radius: 50%; animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

    .urgency { color: var(--accent); font-weight: 700; font-size: 14px; }

    .bundle-label { font-size: 15px; font-weight: 700; }
    .bundle-options { display: flex; flex-direction: column; gap: 10px; }
    .bundle-option {
      border: 2px solid var(--border); border-radius: var(--radius);
      padding: 12px 16px; cursor: pointer;
      display: flex; align-items: center; gap: 14px;
      transition: border-color 0.2s, background 0.2s;
      position: relative;
    }
    .bundle-option.selected { border-color: var(--primary); background: var(--primary-light); }
    .bundle-option input[type="radio"] { accent-color: var(--primary); width: 16px; height: 16px; flex-shrink: 0; }
    .bundle-main { flex: 1; }
    .bundle-title { font-weight: 700; font-size: 14px; }
    .bundle-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .bundle-price-col { text-align: right; }
    .bundle-price { font-weight: 800; font-size: 15px; }
    .bundle-old-price { text-decoration: line-through; color: var(--muted); font-size: 12px; }
    .bundle-badge {
      position: absolute; top: -10px; right: 12px;
      font-size: 11px; font-weight: 700;
      padding: 2px 8px; border-radius: 10px;
    }
    .badge-popular { background: var(--accent); color: #fff; }
    .badge-best { background: var(--primary); color: #fff; }
    .badge-save { background: var(--gold); color: #fff; }

    .countdown-box {
      background: #1b1b1b; color: #fff;
      border-radius: var(--radius); padding: 12px 16px;
      display: flex; align-items: center; gap: 14px;
    }
    .countdown-label { font-size: 11px; text-transform: uppercase; opacity: 0.7; flex-shrink: 0; }
    .countdown-timer { display: flex; gap: 8px; align-items: center; }
    .time-block { text-align: center; }
    .time-num {
      background: var(--accent); color: #fff;
      font-size: 20px; font-weight: 800;
      width: 44px; height: 44px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    .time-sep { font-size: 20px; font-weight: 800; color: var(--accent); }
    .time-label { font-size: 9px; text-transform: uppercase; opacity: 0.6; margin-top: 3px; }

    .add-to-cart-btn {
      background: #1b1b1b; color: #fff; border: none;
      padding: 18px; font-size: 17px; font-weight: 700;
      border-radius: var(--radius); cursor: pointer;
      width: 100%; transition: background 0.2s;
      letter-spacing: 0.5px;
    }
    .add-to-cart-btn:hover { background: var(--primary); }

    .shipping-info {
      background: #f9fafb; border: 1px solid var(--border);
      border-radius: var(--radius); padding: 14px 16px; font-size: 13px;
    }
    .shipping-info strong { color: var(--primary); }
    .delivery-timeline {
      display: grid; grid-template-columns: repeat(3,1fr);
      gap: 10px; margin-top: 12px;
    }
    .delivery-step { text-align: center; }
    .delivery-icon { font-size: 22px; margin-bottom: 4px; }
    .delivery-step-title { font-size: 11px; font-weight: 700; color: var(--muted); }
    .delivery-step-date { font-size: 12px; font-weight: 600; }

    .accordion { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .accordion-item { border-bottom: 1px solid var(--border); }
    .accordion-item:last-child { border-bottom: none; }
    .accordion-header {
      padding: 14px 16px; font-weight: 700; font-size: 14px;
      cursor: pointer; display: flex; justify-content: space-between;
      align-items: center; background: #fff; transition: background 0.2s;
    }
    .accordion-header:hover { background: #f9fafb; }
    .accordion-header .arrow { transition: transform 0.3s; }
    .accordion-header.open .arrow { transform: rotate(180deg); }
    .accordion-body { padding: 0 16px; max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.3s; }
    .accordion-body.open { max-height: 600px; padding: 14px 16px; }
    .specs-list { list-style: none; display: flex; flex-direction: column; gap: 7px; }
    .specs-list li { display: flex; gap: 10px; font-size: 13px; }
    .specs-list li::before { content: '✅'; flex-shrink: 0; }
    .specs-list li strong { margin-right: 4px; }

    .related-section { max-width: 1100px; margin: 0 auto 60px; padding: 0 20px; }
    .related-section h2 { font-size: 22px; font-weight: 800; margin-bottom: 20px; }
    .related-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
    .related-card {
      background: #fff; border-radius: var(--radius);
      overflow: hidden; box-shadow: var(--shadow);
      transition: transform 0.2s; cursor: pointer;
    }
    .related-card:hover { transform: translateY(-3px); }
    .related-card-img { aspect-ratio: 1/1; background: #eee; overflow: hidden; position: relative; }
    .related-card-img img { width: 100%; height: 100%; object-fit: cover; }
    .related-card-body { padding: 12px; }
    .related-card-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; line-height: 1.3; }
    .related-prices { display: flex; align-items: center; gap: 8px; }
    .related-old { text-decoration: line-through; color: var(--muted); font-size: 12px; }
    .related-new { font-weight: 800; font-size: 14px; color: var(--accent); }

    footer { background: #1b1b1b; color: #fff; padding: 40px 20px 20px; }
    .footer-grid {
      max-width: 1100px; margin: 0 auto;
      display: grid; grid-template-columns: 2fr 1fr 1fr;
      gap: 40px; padding-bottom: 30px;
      border-bottom: 1px solid #333;
    }
    .footer-brand p { font-size: 13px; color: #9ca3af; line-height: 1.6; margin-top: 10px; }
    footer h4 { font-size: 14px; font-weight: 700; margin-bottom: 14px; }
    footer ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    footer ul li a { font-size: 13px; color: #9ca3af; transition: color 0.2s; }
    footer ul li a:hover { color: #fff; }
    .footer-bottom { max-width: 1100px; margin: 16px auto 0; font-size: 12px; color: #6b7280; text-align: center; }

    @media (max-width: 768px) {
      .product-wrapper { grid-template-columns: 1fr; gap: 24px; }
      .gallery { position: static; }
      .product-title { font-size: 22px; }
      .related-grid { grid-template-columns: repeat(2,1fr); }
      .footer-grid { grid-template-columns: 1fr; gap: 24px; }
      .features-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<div class="topbar">
  <span>🚚</span> FREE DELIVERY ALL OVER PAKISTAN <span>🚚</span>
</div>

<header>
  <div class="logo">Snap<span>lyr</span></div>
  <nav style="display:flex;gap:24px;font-size:14px;font-weight:500;">
    <a href="<?php echo home_url(); ?>">Home</a>
    <a href="<?php echo get_permalink(wc_get_page_id('shop')); ?>">Shop</a>
    <a href="#">Contact</a>
  </nav>
  <div class="header-icons">
    <a href="<?php echo wc_get_cart_url(); ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    </a>
  </div>
</header>

<div class="breadcrumb">
  <a href="<?php echo home_url(); ?>">Home</a> › LED Solar Wall Lamp
</div>

<div class="product-wrapper">

  <!-- GALLERY -->
  <div class="gallery">
    <div class="gallery-main">
      <span class="badge-sale">Sale</span>
      <img id="mainImg" src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80" alt="LED Solar Wall Lamp"/>
    </div>
    <div class="gallery-thumbs">
      <img class="active" src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&q=80" onclick="changeImg(this,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80')" alt="1"/>
      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80" onclick="changeImg(this,'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80')" alt="2"/>
      <img src="https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=150&q=80" onclick="changeImg(this,'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=600&q=80')" alt="3"/>
      <img src="https://images.unsplash.com/photo-1545259742-56e2c9e0b74c?w=150&q=80" onclick="changeImg(this,'https://images.unsplash.com/photo-1545259742-56e2c9e0b74c?w=600&q=80')" alt="4"/>
    </div>
  </div>

  <!-- PRODUCT INFO -->
  <div class="product-info">

    <div class="product-title">LED Solar Wall Lamp | Outdoor</div>

    <div class="rating-row">
      <div class="stars">★★★★★</div>
      <span style="font-weight:700;font-size:14px;">4.9</span>
      <span style="color:var(--muted);font-size:13px;">| 1,427+ reviews</span>
      <span class="trustbadge">Trustscore 4.9</span>
    </div>

    <div>
      <div class="price-row">
        <span class="price-original">Rs.4,500.00 PKR</span>
        <span class="price-sale">Rs.2,199.00 PKR</span>
        <span class="price-tag">Sale</span>
      </div>
      <p style="font-size:12px;color:var(--muted);margin-top:4px;">Shipping calculated at checkout.</p>
    </div>

    <div class="features-box">
      <h4>Why You'll Love It</h4>
      <div class="features-grid">
        <div class="feature-item"><div class="feature-icon">💡</div><span>Dual Bright LED Bulbs</span></div>
        <div class="feature-item"><div class="feature-icon">☀️</div><span>Solar Powered – Auto Recharge</span></div>
        <div class="feature-item"><div class="feature-icon">🌧️</div><span>Weatherproof for All Seasons</span></div>
        <div class="feature-item"><div class="feature-icon">🎯</div><span>Motion Detection for Security</span></div>
      </div>
    </div>

    <div class="happy-badge"><div class="dot"></div>1,000+ HAPPY CUSTOMERS</div>

    <p class="urgency">⚡ Hurry! Only 35 left in stock.</p>

    <!-- BUNDLE OPTIONS -->
    <div>
      <p class="bundle-label">Buy MORE – SAVE Upto 26%</p>
      <p style="font-size:12px;color:var(--muted);margin-bottom:10px;">SAVE BIG MEGA SALE OFFER</p>
      <div class="bundle-options">

        <label class="bundle-option" onclick="selectBundle(this,1)">
          <input type="radio" name="bundle" value="1"/>
          <div class="bundle-main">
            <div class="bundle-title">Buy 1</div>
            <div class="bundle-sub">Standard</div>
          </div>
          <div class="bundle-price-col">
            <div class="bundle-price">PKR 2,199</div>
          </div>
        </label>

        <label class="bundle-option selected" onclick="selectBundle(this,2)">
          <span class="bundle-badge badge-popular">POPULAR</span>
          <input type="radio" name="bundle" value="2" checked/>
          <div class="bundle-main">
            <div class="bundle-title">Buy 2</div>
            <div class="bundle-sub" style="color:var(--accent);">10% OFF</div>
          </div>
          <div class="bundle-price-col">
            <div class="bundle-price" style="color:var(--accent);">PKR 3,958</div>
            <div class="bundle-old-price">PKR 4,398</div>
          </div>
        </label>

        <label class="bundle-option" onclick="selectBundle(this,3)">
          <span class="bundle-badge badge-best">BEST VALUE</span>
          <input type="radio" name="bundle" value="3"/>
          <div class="bundle-main">
            <div class="bundle-title">Buy 3</div>
            <div class="bundle-sub">20% OFF</div>
          </div>
          <div class="bundle-price-col">
            <div class="bundle-price">PKR 5,277</div>
            <div class="bundle-old-price">PKR 6,597</div>
          </div>
        </label>

        <label class="bundle-option" onclick="selectBundle(this,4)">
          <input type="radio" name="bundle" value="4"/>
          <div class="bundle-main">
            <div class="bundle-title">Buy 4</div>
            <div class="bundle-sub">23% OFF</div>
          </div>
          <div class="bundle-price-col">
            <div class="bundle-price">PKR 6,773</div>
            <div class="bundle-old-price">PKR 8,796</div>
          </div>
        </label>

        <label class="bundle-option" onclick="selectBundle(this,5)">
          <span class="bundle-badge badge-save">SAVE MOST</span>
          <input type="radio" name="bundle" value="5"/>
          <div class="bundle-main">
            <div class="bundle-title">Buy 5</div>
            <div class="bundle-sub">26% OFF</div>
          </div>
          <div class="bundle-price-col">
            <div class="bundle-price">PKR 8,135</div>
            <div class="bundle-old-price">PKR 10,995</div>
          </div>
        </label>

      </div>
    </div>

    <!-- COUNTDOWN -->
    <div class="countdown-box">
      <span class="countdown-label">⏳ Offer Ends In</span>
      <div class="countdown-timer">
        <div class="time-block"><div class="time-num" id="cd-h">23</div><div class="time-label">Hours</div></div>
        <div class="time-sep">:</div>
        <div class="time-block"><div class="time-num" id="cd-m">58</div><div class="time-label">Mins</div></div>
        <div class="time-sep">:</div>
        <div class="time-block"><div class="time-num" id="cd-s">01</div><div class="time-label">Secs</div></div>
      </div>
    </div>

    <!-- ADD TO CART — sends to WooCommerce cart with correct quantity -->
    <form id="cartForm" method="get" action="<?php echo esc_url(home_url('/cart/')); ?>">
      <input type="hidden" name="add-to-cart" value="15"/>
      <input type="hidden" name="quantity" id="qtyInput" value="2"/>
      <button type="submit" class="add-to-cart-btn">Add to Cart</button>
    </form>

    <!-- SHIPPING INFO -->
    <div class="shipping-info">
      <p>🚚 <strong>Free Shipping</strong> to Pakistan &nbsp;|&nbsp; Order within next <strong id="dispatchCountdown">06 Hours 00 Minutes</strong> for dispatch today.</p>
      <p style="margin-top:6px;color:var(--muted);font-size:12px;">You'll receive your package within 3–7 business days.</p>
      <div class="delivery-timeline">
        <div class="delivery-step"><div class="delivery-icon">📦</div><div class="delivery-step-title">Ordered</div><div class="delivery-step-date">Today</div></div>
        <div class="delivery-step"><div class="delivery-icon">🔄</div><div class="delivery-step-title">Order Ready</div><div class="delivery-step-date">1–2 Days</div></div>
        <div class="delivery-step"><div class="delivery-icon">📍</div><div class="delivery-step-title">Delivered</div><div class="delivery-step-date">3–7 Days</div></div>
      </div>
    </div>

    <!-- ACCORDION -->
    <div class="accordion">
      <div class="accordion-item">
        <div class="accordion-header open" onclick="toggleAccordion(this)">
          📋 Product Specifications <span class="arrow">▼</span>
        </div>
        <div class="accordion-body open">
          <ul class="specs-list">
            <li><strong>Brand:</strong> Snaplyr</li>
            <li><strong>Material:</strong> Durable Plastic</li>
            <li><strong>Finish:</strong> Polished with Matte Metal Accents</li>
            <li><strong>Light Fixture Type:</strong> Wall Sconce (Detachable)</li>
            <li><strong>Lamp Type:</strong> Lantern</li>
            <li><strong>Mounting Type:</strong> Semi Flush Mount</li>
            <li><strong>Control Method:</strong> Motion Sensor</li>
            <li><strong>Power Supply:</strong> Solar Charging</li>
            <li><strong>Battery Type:</strong> Built-in Lithium Battery (Solar)</li>
            <li><strong>Battery Capacity:</strong> 1200mAh</li>
            <li><strong>Remote Control:</strong> Not Included</li>
            <li><strong>Light Source:</strong> Included</li>
          </ul>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          🚚 Shipping Policy <span class="arrow">▼</span>
        </div>
        <div class="accordion-body">
          <p style="font-size:13px;line-height:1.7;">Free shipping on all orders across Pakistan. Orders processed within 1–2 business days. Delivery takes 3–7 business days.</p>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          🔄 Return &amp; Exchange <span class="arrow">▼</span>
        </div>
        <div class="accordion-body">
          <p style="font-size:13px;line-height:1.7;">We offer a 7-day return policy. Items must be in original condition. Contact our customer care team to initiate a return.</p>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- RELATED PRODUCTS -->
<div class="related-section">
  <h2>You may also like</h2>
  <div class="related-grid">
    <div class="related-card">
      <div class="related-card-img">
        <span class="badge-sale" style="position:absolute;top:10px;left:10px;font-size:11px;padding:3px 8px;">Sale</span>
        <img src="https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&q=80" alt="Motion Sensor Light"/>
      </div>
      <div class="related-card-body">
        <div class="related-card-title">Motion Sensor USB Rechargeable LED Night Light</div>
        <div class="related-prices">
          <span class="related-old">Rs.1,500.00</span>
          <span class="related-new">Rs.1,090.00 PKR</span>
        </div>
      </div>
    </div>
    <div class="related-card">
      <div class="related-card-img">
        <span class="badge-sale" style="position:absolute;top:10px;left:10px;font-size:11px;padding:3px 8px;">Sale</span>
        <img src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&q=80" alt="Solar Fixed Light"/>
      </div>
      <div class="related-card-body">
        <div class="related-card-title">Solar Charging Fixed Light (Heavy Duty)</div>
        <div class="related-prices">
          <span class="related-old">Rs.5,440.00</span>
          <span class="related-new">Rs.2,945.00 PKR</span>
        </div>
      </div>
    </div>
    <div class="related-card">
      <div class="related-card-img">
        <img src="https://images.unsplash.com/photo-1495576775051-8af0d10f79b7?w=400&q=80" alt="Crystal Ball Night Light"/>
      </div>
      <div class="related-card-body">
        <div class="related-card-title">Crystal Ball Night Light – 3D Engraved</div>
        <div class="related-prices"><span class="related-new">Rs.1,450.00 PKR</span></div>
      </div>
    </div>
    <div class="related-card">
      <div class="related-card-img">
        <span class="badge-sale" style="position:absolute;top:10px;left:10px;font-size:11px;padding:3px 8px;">Sale</span>
        <img src="https://images.unsplash.com/photo-1563461661026-49631dd5d68e?w=400&q=80" alt="Solar RGB Light"/>
      </div>
      <div class="related-card-body">
        <div class="related-card-title">Solar RGB Lights | Zero Electricity Bill</div>
        <div class="related-prices">
          <span class="related-old">Rs.4,440.00</span>
          <span class="related-new">Rs.2,999.00 PKR</span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- FOOTER -->
<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <div class="logo" style="color:#fff;font-size:24px;">Snap<span style="color:#f4a261;">lyr</span></div>
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
        <li><a href="<?php echo wc_get_account_endpoint_url('orders'); ?>">Orders</a></li>
        <li><a href="<?php echo wc_get_account_endpoint_url('dashboard'); ?>">Profile</a></li>
        <li><a href="#">Privacy Policy</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">&copy; <?php echo date('Y'); ?> Snaplyr. All rights reserved.</div>
</footer>

<script>
  function changeImg(thumb, src) {
    document.getElementById('mainImg').src = src;
    document.querySelectorAll('.gallery-thumbs img').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
  }

  let selectedQty = 2;
  function selectBundle(el, qty) {
    selectedQty = qty;
    document.getElementById('qtyInput').value = qty;
    document.querySelectorAll('.bundle-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
  }

  function startCountdown(sec) {
    let r = sec;
    const h = document.getElementById('cd-h');
    const m = document.getElementById('cd-m');
    const s = document.getElementById('cd-s');
    function tick() {
      if (r <= 0) r = 0;
      h.textContent = String(Math.floor(r/3600)).padStart(2,'0');
      m.textContent = String(Math.floor((r%3600)/60)).padStart(2,'0');
      s.textContent = String(r%60).padStart(2,'0');
      if (r > 0) { r--; setTimeout(tick, 1000); }
    }
    tick();
  }
  startCountdown(23*3600 + 58*60 + 1);

  function dispatchTimer() {
    const cutoff = new Date();
    cutoff.setHours(18,0,0,0);
    if (new Date() >= cutoff) cutoff.setDate(cutoff.getDate()+1);
    const el = document.getElementById('dispatchCountdown');
    setInterval(() => {
      const diff = Math.max(0, cutoff - new Date());
      el.textContent = String(Math.floor(diff/3600000)).padStart(2,'0') + ' Hours ' + String(Math.floor((diff%3600000)/60000)).padStart(2,'0') + ' Minutes';
    }, 60000);
  }
  dispatchTimer();

  function toggleAccordion(header) {
    const body = header.nextElementSibling;
    const isOpen = header.classList.contains('open');
    header.classList.toggle('open', !isOpen);
    body.classList.toggle('open', !isOpen);
  }
</script>

<?php wp_footer(); ?>
</body>
</html>
