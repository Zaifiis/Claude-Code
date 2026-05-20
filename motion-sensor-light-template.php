<?php
/**
 * Template Name: Motion Sensor Light Page
 */

$imgs = [
    'https://snaplyr.com/wp-content/uploads/2026/05/motion-1.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/motion-2.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/motion-3.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/motion-4.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/motion-5.webp',
];
$alts = [
    'Motion Sensor Night Light – Product View',
    'Motion Sensor Night Light – In Use',
    'Motion Sensor Night Light – Installation',
    'Motion Sensor Night Light – Features',
    'Motion Sensor Night Light – Modes',
];

if ( ! function_exists( 'snaplyr_stars' ) ) {
    function snaplyr_stars( $n ) {
        $s = '';
        for ( $i = 1; $i <= 5; $i++ ) $s .= ( $i <= $n ) ? '★' : '☆';
        return $s;
    }
}

$reviews = [
    ['name'=>'Fatima Noor',     'stars'=>5, 'date'=>'May 15, 2026', 'qty'=>'2 pcs',  'text'=>'Bohot useful product hai. Cabinet ke andar lagaya aur ab andheron mein cheezein dhundna itna asaan ho gaya. Motion sensor instant response deta hai.'],
    ['name'=>'Ahmed Raza',      'stars'=>5, 'date'=>'May 13, 2026', 'qty'=>'3 pcs',  'text'=>'Excellent product! USB-C charging is very convenient. Magnetic mounting works perfectly. Delivery was fast.'],
    ['name'=>'Sana Malik',      'stars'=>5, 'date'=>'May 11, 2026', 'qty'=>'4 pcs',  'text'=>'Maine 4 pieces order kiye bathroom, kitchen aur drawer ke liye. Sab perfectly kaam kar rahe hain. Very impressed.'],
    ['name'=>'Tariq Mahmood',   'stars'=>5, 'date'=>'May 10, 2026', 'qty'=>'2 pcs',  'text'=>'Perfect for wardrobe. Light turns on automatically when you open the door. Battery life is excellent with USB-C charging.'],
    ['name'=>'Rabia Hussain',   'stars'=>5, 'date'=>'May 8, 2026',  'qty'=>'3 pcs',  'text'=>'Slim design and very bright for a small light. Night sensing mode is my favorite — only activates when dark. Great product!'],
    ['name'=>'Kamran Shafiq',   'stars'=>4, 'date'=>'May 9, 2026',  'qty'=>'2 pcs',  'text'=>'Good quality and easy to install. Magnetic mounting is strong. The dimmable feature (long press) is a nice bonus.'],
    ['name'=>'Nadia Azeem',     'stars'=>5, 'date'=>'May 7, 2026',  'qty'=>'6 pcs',  'text'=>'Order kiye 6 pieces aur ghar ke har corner mein laga diye. Bijli ki zarurat nahi. USB charge ho jata hai. Highly recommended!'],
    ['name'=>'Shahzad Khan',    'stars'=>5, 'date'=>'May 6, 2026',  'qty'=>'2 pcs',  'text'=>'The PIR motion sensor is very accurate. No false triggers. Cool white light (6000K) is perfect for task lighting.'],
    ['name'=>'Amina Chaudhry',  'stars'=>4, 'date'=>'May 5, 2026',  'qty'=>'2 pcs',  'text'=>'Nice compact design. Works well under kitchen cabinets. Delivery was on time. Would buy again.'],
    ['name'=>'Bilal Ahmed',     'stars'=>5, 'date'=>'May 4, 2026',  'qty'=>'5 pcs',  'text'=>'Bought 5 pieces for office use. All working perfectly. No drilling required which made installation super easy.'],
    ['name'=>'Zainab Mirza',    'stars'=>5, 'date'=>'May 3, 2026',  'qty'=>'3 pcs',  'text'=>'Ghar mein teen jagah lagaya. Bathroom mein raat ko bahut helpful hai. Automatic on/off saves battery very well.'],
    ['name'=>'Usman Baig',      'stars'=>5, 'date'=>'May 2, 2026',  'qty'=>'2 pcs',  'text'=>'Multiple modes are very handy. I use always-on mode in living room and night sensing mode in bedroom. Great versatile product.'],
    ['name'=>'Hira Saleem',     'stars'=>5, 'date'=>'May 1, 2026',  'qty'=>'4 pcs',  'text'=>'Aik baar charge karo aur weeks tak tension nahi. Motion detection is spot on. Best purchase for home organization.'],
    ['name'=>'Fahad Iqbal',     'stars'=>4, 'date'=>'Apr 30, 2026', 'qty'=>'2 pcs',  'text'=>'Available in 3 sizes which is great. I got the 30cm version. Perfect fit under my kitchen shelf. Good quality overall.'],
    ['name'=>'Maryam Nawaz',    'stars'=>5, 'date'=>'Apr 28, 2026', 'qty'=>'3 pcs',  'text'=>'Packaging was excellent and delivery was fast. All 3 pieces working perfectly. Cool white light is very bright and clear.'],
];

// Fetch approved reviews from DB for this product
$db_reviews = get_posts([
    'post_type'      => 'snaplyr_review',
    'post_status'    => 'publish',
    'posts_per_page' => -1,
    'meta_query'     => [[
        'key'   => '_snaplyr_product',
        'value' => 'motion-sensor-light',
    ]],
    'orderby' => 'date',
    'order'   => 'DESC',
]);
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
    button, input, label { font-family: inherit; }
    .topbar { background: #1b1b1b; color: #fff; text-align: center; font-size: 12px; padding: 8px 12px; line-height: 1.4; }
    .topbar span { color: #f4a261; }
    header { background: #fff; border-bottom: 1px solid var(--border); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 6px rgba(0,0,0,0.06); gap: 12px; }
    .logo { font-size: 20px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }
    .logo span { color: var(--primary); }
    .header-nav { display: flex; gap: 18px; font-size: 13px; font-weight: 500; }
    .header-nav a { white-space: nowrap; transition: color 0.2s; }
    .header-nav a:hover { color: var(--primary); }
    .header-icons { display: flex; gap: 14px; align-items: center; flex-shrink: 0; }
    .header-icons svg { width: 22px; height: 22px; cursor: pointer; }
    .breadcrumb { max-width: 1100px; margin: 12px auto 0; padding: 0 16px; font-size: 12px; color: var(--muted); }
    .breadcrumb a { color: var(--muted); }
    .product-wrapper { max-width: 1100px; margin: 16px auto 40px; padding: 0 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
    .gallery { position: sticky; top: 72px; }
    .gallery-main { border-radius: var(--radius); overflow: hidden; background: #eee; aspect-ratio: 1/1; position: relative; }
    .gallery-main img { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; }
    .badge-sale { position: absolute; top: 12px; left: 12px; background: var(--accent); color: #fff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; z-index: 1; }
    .gallery-thumbs { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .gallery-thumbs img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 2px solid transparent; cursor: pointer; transition: border-color 0.2s; flex-shrink: 0; }
    .gallery-thumbs img.active { border-color: var(--primary); }
    .product-info { display: flex; flex-direction: column; gap: 14px; }
    .product-title { font-size: 24px; font-weight: 800; line-height: 1.2; }
    .rating-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .stars { color: #f4a261; font-size: 15px; letter-spacing: 1px; }
    .trustbadge { background: #fff8ee; border: 1px solid #f4a261; border-radius: 5px; padding: 2px 8px; font-size: 12px; color: #b45309; font-weight: 600; }
    .price-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .price-original { text-decoration: line-through; color: var(--muted); font-size: 15px; }
    .price-sale { font-size: 26px; font-weight: 800; color: var(--accent); }
    .price-tag { background: var(--accent); color: #fff; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; }
    .features-box { background: var(--primary-light); border-radius: var(--radius); padding: 14px; }
    .features-box h4 { font-size: 13px; font-weight: 700; margin-bottom: 10px; color: var(--primary); }
    .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .feature-item { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; }
    .feature-icon { width: 30px; height: 30px; background: var(--primary); border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 15px; }
    .happy-badge { background: #1b1b1b; color: #fff; border-radius: 30px; padding: 8px 16px; font-size: 12px; display: flex; align-items: center; gap: 8px; width: fit-content; }
    .happy-badge .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 1.5s infinite; flex-shrink: 0; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .urgency { color: var(--accent); font-weight: 700; font-size: 13px; }
    .bundle-label { font-size: 14px; font-weight: 700; }
    .bundle-options { display: flex; flex-direction: column; gap: 10px; }
    .bundle-option { border: 2px solid var(--border); border-radius: var(--radius); padding: 10px 14px; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: border-color 0.2s, background 0.2s; position: relative; }
    .bundle-option.selected { border-color: var(--primary); background: var(--primary-light); }
    .bundle-option input[type="radio"] { accent-color: var(--primary); width: 16px; height: 16px; flex-shrink: 0; }
    .bundle-main { flex: 1; min-width: 0; }
    .bundle-title { font-weight: 700; font-size: 13px; }
    .bundle-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .bundle-price-col { text-align: right; flex-shrink: 0; }
    .bundle-price { font-weight: 800; font-size: 14px; white-space: nowrap; }
    .bundle-old-price { text-decoration: line-through; color: var(--muted); font-size: 11px; }
    .bundle-badge { position: absolute; top: -10px; right: 10px; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; }
    .badge-popular { background: var(--accent); color: #fff; }
    .badge-best { background: var(--primary); color: #fff; }
    .badge-save { background: var(--gold); color: #fff; }
    .countdown-box { background: #1b1b1b; color: #fff; border-radius: var(--radius); padding: 12px 14px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .countdown-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; flex-shrink: 0; }
    .countdown-timer { display: flex; gap: 6px; align-items: center; }
    .time-block { text-align: center; }
    .time-num { background: var(--accent); color: #fff; font-size: 18px; font-weight: 800; width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
    .time-sep { font-size: 18px; font-weight: 800; color: var(--accent); }
    .time-label { font-size: 9px; text-transform: uppercase; opacity: 0.6; margin-top: 2px; }
    .add-to-cart-btn { background: #1b1b1b; color: #fff; border: none; padding: 16px; font-size: 16px; font-weight: 700; border-radius: var(--radius); cursor: pointer; width: 100%; transition: background 0.2s; letter-spacing: 0.5px; touch-action: manipulation; }
    .add-to-cart-btn:hover { background: var(--primary); }
    .add-to-cart-btn:active { transform: scale(0.99); }
    .shipping-info { background: #f9fafb; border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px; font-size: 12px; line-height: 1.6; }
    .shipping-info strong { color: var(--primary); }
    .delivery-timeline { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 10px; }
    .delivery-step { text-align: center; }
    .delivery-icon { font-size: 20px; margin-bottom: 3px; }
    .delivery-step-title { font-size: 10px; font-weight: 700; color: var(--muted); }
    .delivery-step-date { font-size: 11px; font-weight: 600; }
    .accordion { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .accordion-item { border-bottom: 1px solid var(--border); }
    .accordion-item:last-child { border-bottom: none; }
    .accordion-header { padding: 13px 14px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #fff; transition: background 0.2s; touch-action: manipulation; user-select: none; }
    .accordion-header:hover { background: #f9fafb; }
    .accordion-header .arrow { transition: transform 0.3s; flex-shrink: 0; margin-left: 8px; }
    .accordion-header.open .arrow { transform: rotate(180deg); }
    .accordion-body { padding: 0 14px; max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.3s; }
    .accordion-body.open { max-height: 1000px; padding: 12px 14px; }
    .specs-list { list-style: none; display: flex; flex-direction: column; gap: 7px; }
    .specs-list li { display: flex; gap: 8px; font-size: 12px; line-height: 1.5; }
    .specs-list li::before { content: '✅'; flex-shrink: 0; }
    .specs-list li strong { margin-right: 2px; flex-shrink: 0; }
    .reviews-section { max-width: 1100px; margin: 0 auto 60px; padding: 0 16px; scroll-margin-top: 80px; }
    .reviews-section > h2 { font-size: 22px; font-weight: 800; margin-bottom: 20px; }
    .reviews-summary { background: #fff; border-radius: var(--radius); padding: 24px; margin-bottom: 28px; box-shadow: var(--shadow); display: grid; grid-template-columns: 160px 1fr; gap: 32px; align-items: center; }
    .reviews-avg { text-align: center; }
    .reviews-avg-num { font-size: 58px; font-weight: 800; line-height: 1; color: var(--text); }
    .reviews-avg-stars { color: #f4a261; font-size: 22px; margin: 6px 0 4px; letter-spacing: 2px; }
    .reviews-avg-label { font-size: 12px; color: var(--muted); }
    .rating-bars { display: flex; flex-direction: column; gap: 8px; }
    .rating-bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
    .rating-bar-label { width: 28px; text-align: right; color: var(--muted); white-space: nowrap; }
    .rating-bar-stars { color: #f4a261; font-size: 11px; flex-shrink: 0; }
    .rating-bar-track { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
    .rating-bar-fill { height: 100%; background: #f4a261; border-radius: 4px; transition: width 0.5s ease; }
    .rating-bar-pct { width: 30px; color: var(--muted); font-size: 11px; }
    .reviews-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
    .review-card { background: #fff; border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--border); }
    .review-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .reviewer-name { font-weight: 700; font-size: 14px; }
    .review-date { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .review-stars { color: #f4a261; font-size: 15px; letter-spacing: 1px; flex-shrink: 0; }
    .review-text { font-size: 13px; line-height: 1.65; color: #374151; flex: 1; }
    .review-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding-top: 8px; border-top: 1px solid var(--border); }
    .verified-badge { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #16a34a; font-weight: 600; }
    .review-qty { font-size: 11px; color: var(--muted); background: #f3f4f6; padding: 2px 8px; border-radius: 10px; }

    /* ── Write a Review styles ─────────────────────────────── */
    .write-review-section { margin-top: 36px; }
    .write-review-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 13px 28px;
      font-size: 15px;
      font-weight: 700;
      border-radius: var(--radius);
      cursor: pointer;
      transition: background 0.2s, transform 0.15s;
      letter-spacing: 0.3px;
    }
    .write-review-btn:hover { background: #235c43; transform: translateY(-1px); }
    .write-review-btn:active { transform: scale(0.98); }
    .review-gate {
      display: none;
      background: #fff8ee;
      border: 1px solid #f4a261;
      border-radius: var(--radius);
      padding: 20px 22px;
      margin-top: 16px;
      max-width: 620px;
    }
    .review-gate p {
      font-size: 14px;
      line-height: 1.7;
      color: #374151;
      margin-bottom: 16px;
    }
    .review-gate-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .gate-btn-no {
      background: #f3f4f6;
      color: var(--text);
      border: 1px solid var(--border);
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .gate-btn-no:hover { background: #e5e7eb; }
    .gate-btn-yes {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .gate-btn-yes:hover { background: #235c43; }
    .review-form-wrap {
      display: none;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin-top: 16px;
      max-width: 620px;
      box-shadow: var(--shadow);
    }
    .review-form-wrap h3 {
      font-size: 17px;
      font-weight: 800;
      margin-bottom: 18px;
      color: var(--text);
    }
    .review-form-group { margin-bottom: 16px; }
    .review-form-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--text);
    }
    .review-form-group input[type="text"],
    .review-form-group textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
      color: var(--text);
      background: #f9fafb;
      transition: border-color 0.2s, background 0.2s;
      resize: vertical;
    }
    .review-form-group input[type="text"]:focus,
    .review-form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
      background: #fff;
    }
    /* CSS Star Rating — reverse-order radio trick */
    .star-rating {
      display: flex;
      flex-direction: row-reverse;
      gap: 2px;
      width: fit-content;
    }
    .star-rating input[type="radio"] { display: none; }
    .star-rating label {
      font-size: 32px;
      color: #d1d5db;
      cursor: pointer;
      transition: color 0.15s;
      line-height: 1;
      padding: 0 2px;
    }
    .star-rating input[type="radio"]:checked ~ label { color: #f4a261; }
    .star-rating label:hover,
    .star-rating label:hover ~ label { color: #f4a261; }
    .review-submit-btn {
      background: #1b1b1b;
      color: #fff;
      border: none;
      padding: 13px 28px;
      font-size: 14px;
      font-weight: 700;
      border-radius: var(--radius);
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
      margin-top: 4px;
    }
    .review-submit-btn:hover { background: var(--primary); }
    .review-success-msg {
      background: #d8f3dc;
      border: 1px solid #2d6a4f;
      border-radius: var(--radius);
      padding: 16px 20px;
      color: #1a4731;
      font-size: 14px;
      font-weight: 600;
      margin-top: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 620px;
    }
    .review-success-msg .success-icon { font-size: 22px; flex-shrink: 0; }
    /* ── End Write a Review styles ─────────────────────────── */

    footer { background: #1b1b1b; color: #fff; padding: 36px 16px 20px; }
    .footer-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 36px; padding-bottom: 28px; border-bottom: 1px solid #333; }
    .footer-brand p { font-size: 13px; color: #9ca3af; line-height: 1.6; margin-top: 10px; }
    footer h4 { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
    footer ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    footer ul li a { font-size: 12px; color: #9ca3af; transition: color 0.2s; }
    footer ul li a:hover { color: #fff; }
    .footer-bottom { max-width: 1100px; margin: 14px auto 0; font-size: 11px; color: #6b7280; text-align: center; }
    @media (max-width: 900px) { .header-nav { gap: 14px; font-size: 12px; } .product-wrapper { gap: 28px; } .reviews-grid { grid-template-columns: repeat(2,1fr); } .reviews-summary { grid-template-columns: 130px 1fr; gap: 20px; } }
    @media (max-width: 768px) { .topbar { font-size: 11px; padding: 7px 10px; } header { padding: 10px 14px; } .logo { font-size: 18px; } .header-nav { display: none; } .header-icons svg { width: 24px; height: 24px; } .breadcrumb { margin-top: 10px; padding: 0 14px; } .product-wrapper { grid-template-columns: 1fr; gap: 20px; margin: 12px auto 32px; padding: 0 14px; } .gallery { position: static; } .gallery-thumbs img { width: 56px; height: 56px; } .product-title { font-size: 20px; } .price-sale { font-size: 22px; } .features-grid { grid-template-columns: 1fr 1fr; gap: 8px; } .feature-item { font-size: 11px; gap: 6px; } .feature-icon { width: 28px; height: 28px; font-size: 13px; } .bundle-option { padding: 9px 12px; gap: 10px; } .countdown-box { gap: 10px; padding: 10px 12px; } .time-num { width: 36px; height: 36px; font-size: 16px; } .time-sep { font-size: 16px; } .add-to-cart-btn { font-size: 15px; padding: 15px; } .reviews-section { padding: 0 14px; margin-bottom: 40px; } .reviews-summary { grid-template-columns: 1fr; text-align: center; } .reviews-avg { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; } .reviews-grid { grid-template-columns: 1fr; } .footer-grid { grid-template-columns: 1fr; gap: 20px; } footer { padding: 28px 14px 16px; } .review-gate-actions { flex-direction: column; } .write-review-btn { width: 100%; } }
    @media (max-width: 480px) { .product-title { font-size: 18px; } .price-sale { font-size: 20px; } .bundle-sub { display: none; } .countdown-box { flex-direction: column; align-items: flex-start; gap: 8px; } .countdown-timer { width: 100%; justify-content: flex-start; } .time-num { width: 38px; height: 38px; font-size: 17px; } .happy-badge { font-size: 11px; padding: 7px 14px; } }
    @media (max-width: 360px) { .product-wrapper { padding: 0 10px; } .product-title { font-size: 17px; } .gallery-thumbs img { width: 48px; height: 48px; } .add-to-cart-btn { font-size: 14px; padding: 14px; } }
  </style>
</head>
<body>
<div class="topbar"><span>🚚</span> FREE DELIVERY ALL OVER PAKISTAN <span>🚚</span></div>
<header>
  <div class="logo">Snap<span>lyr</span></div>
  <nav class="header-nav">
    <a href="<?php echo home_url(); ?>">Home</a>
    <a href="#reviews">Reviews</a>
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
<div class="breadcrumb"><a href="<?php echo home_url(); ?>">Home</a> › Motion Sensor Night Light</div>
<div class="product-wrapper">
  <div class="gallery">
    <div class="gallery-main">
      <span class="badge-sale">Sale</span>
      <img id="mainImg" src="<?php echo esc_url($imgs[0]); ?>" alt="<?php echo esc_attr($alts[0]); ?>"/>
    </div>
    <div class="gallery-thumbs">
      <?php foreach ($imgs as $i => $url): ?>
      <img <?php echo $i === 0 ? 'class="active"' : ''; ?> src="<?php echo esc_url($url); ?>" onclick="changeImg(this,'<?php echo esc_js($url); ?>')" alt="<?php echo esc_attr($alts[$i] ?? ''); ?>"/>
      <?php endforeach; ?>
    </div>
  </div>
  <div class="product-info">
    <div class="product-title">Motion Sensor Night Light</div>
    <div class="rating-row">
      <div class="stars">★★★★★</div>
      <span style="font-weight:700;font-size:13px;">4.9</span>
      <span style="color:var(--muted);font-size:12px;">| 892+ reviews</span>
      <span class="trustbadge">Trustscore 4.9</span>
    </div>
    <div>
      <div class="price-row">
        <span class="price-original">Rs.1,899.00 PKR</span>
        <span class="price-sale">Rs.1,650.00 PKR</span>
        <span class="price-tag">Sale</span>
      </div>
      <p style="font-size:11px;color:var(--muted);margin-top:4px;">Shipping calculated at checkout.</p>
    </div>
    <div class="features-box">
      <h4>Why You'll Love It</h4>
      <div class="features-grid">
        <div class="feature-item"><div class="feature-icon">🎯</div><span>Smart Motion Sensor Activation</span></div>
        <div class="feature-item"><div class="feature-icon">🔌</div><span>USB Type-C Rechargeable Battery</span></div>
        <div class="feature-item"><div class="feature-icon">🧲</div><span>Magnetic &amp; Adhesive Installation</span></div>
        <div class="feature-item"><div class="feature-icon">✨</div><span>Slim Portable &amp; Versatile Design</span></div>
      </div>
    </div>
    <div class="happy-badge"><div class="dot"></div>800+ HAPPY CUSTOMERS</div>
    <p class="urgency">⚡ Hurry! Only 28 left in stock.</p>
    <div>
      <p class="bundle-label">Buy MORE – SAVE Upto 26%</p>
      <p style="font-size:11px;color:var(--muted);margin-bottom:10px;">SAVE BIG MEGA SALE OFFER</p>
      <div class="bundle-options">
        <label class="bundle-option" onclick="selectBundle(this,1)">
          <input type="radio" name="bundle" value="1"/>
          <div class="bundle-main"><div class="bundle-title">Buy 1</div><div class="bundle-sub">Standard</div></div>
          <div class="bundle-price-col"><div class="bundle-price">PKR 1,650</div></div>
        </label>
        <label class="bundle-option selected" onclick="selectBundle(this,2)">
          <span class="bundle-badge badge-popular">POPULAR</span>
          <input type="radio" name="bundle" value="2" checked/>
          <div class="bundle-main"><div class="bundle-title">Buy 2</div><div class="bundle-sub" style="color:var(--accent);">10% OFF</div></div>
          <div class="bundle-price-col"><div class="bundle-price" style="color:var(--accent);">PKR 2,970</div><div class="bundle-old-price">PKR 3,300</div></div>
        </label>
        <label class="bundle-option" onclick="selectBundle(this,3)">
          <span class="bundle-badge badge-best">BEST VALUE</span>
          <input type="radio" name="bundle" value="3"/>
          <div class="bundle-main"><div class="bundle-title">Buy 3</div><div class="bundle-sub">20% OFF</div></div>
          <div class="bundle-price-col"><div class="bundle-price">PKR 3,960</div><div class="bundle-old-price">PKR 4,950</div></div>
        </label>
        <label class="bundle-option" onclick="selectBundle(this,4)">
          <input type="radio" name="bundle" value="4"/>
          <div class="bundle-main"><div class="bundle-title">Buy 4</div><div class="bundle-sub">23% OFF</div></div>
          <div class="bundle-price-col"><div class="bundle-price">PKR 5,082</div><div class="bundle-old-price">PKR 6,600</div></div>
        </label>
        <label class="bundle-option" onclick="selectBundle(this,5)">
          <span class="bundle-badge badge-save">SAVE MOST</span>
          <input type="radio" name="bundle" value="5"/>
          <div class="bundle-main"><div class="bundle-title">Buy 5</div><div class="bundle-sub">26% OFF</div></div>
          <div class="bundle-price-col"><div class="bundle-price">PKR 6,105</div><div class="bundle-old-price">PKR 8,250</div></div>
        </label>
      </div>
    </div>
    <div class="countdown-box">
      <span class="countdown-label">⌛ Offer Ends In</span>
      <div class="countdown-timer">
        <div class="time-block"><div class="time-num" id="cd-h">23</div><div class="time-label">Hours</div></div>
        <div class="time-sep">:</div>
        <div class="time-block"><div class="time-num" id="cd-m">58</div><div class="time-label">Mins</div></div>
        <div class="time-sep">:</div>
        <div class="time-block"><div class="time-num" id="cd-s">01</div><div class="time-label">Secs</div></div>
      </div>
    </div>
    <form id="cartForm" method="get" action="<?php echo esc_url(home_url('/cart/')); ?>">
      <input type="hidden" name="add-to-cart" value="18"/>
      <input type="hidden" name="quantity" id="qtyInput" value="2"/>
      <button type="submit" class="add-to-cart-btn">🛒 Add to Cart</button>
    </form>
    <div class="shipping-info">
      <p>🚚 <strong>Free Shipping</strong> to Pakistan &nbsp;|&nbsp; Order within <strong id="dispatchCountdown">06 Hours 00 Minutes</strong> for dispatch today.</p>
      <p style="margin-top:5px;color:var(--muted);font-size:11px;">You'll receive your package within 3–7 business days.</p>
      <div class="delivery-timeline">
        <div class="delivery-step"><div class="delivery-icon">📦</div><div class="delivery-step-title">Ordered</div><div class="delivery-step-date">Today</div></div>
        <div class="delivery-step"><div class="delivery-icon">🔄</div><div class="delivery-step-title">Order Ready</div><div class="delivery-step-date">1–2 Days</div></div>
        <div class="delivery-step"><div class="delivery-icon">📍</div><div class="delivery-step-title">Delivered</div><div class="delivery-step-date">3–7 Days</div></div>
      </div>
    </div>
    <div class="accordion">
      <div class="accordion-item">
        <div class="accordion-header open" onclick="toggleAccordion(this)">📋 Product Specifications <span class="arrow">▼</span></div>
        <div class="accordion-body open">
          <ul class="specs-list">
            <li><strong>Product Name:</strong> PIR Motion Sensor Cabinet Light</li>
            <li><strong>Brand:</strong> Snaplyr</li>
            <li><strong>Input Voltage:</strong> DC 5V</li>
            <li><strong>Charging:</strong> USB Type-C</li>
            <li><strong>Available Lengths:</strong> 10cm / 20cm / 30cm / 50cm</li>
            <li><strong>Light Color:</strong> Cool White (6000–7000K)</li>
            <li><strong>Features:</strong> Rechargeable, Wireless, Dimmable</li>
            <li><strong>Installation:</strong> Magnetic Suction (No drilling required)</li>
            <li><strong>Modes:</strong> Always-On / Night Sensing / All-Day Sensing / OFF / Dimmable (long press)</li>
          </ul>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">💡 Features &amp; Modes Detail <span class="arrow">▼</span></div>
        <div class="accordion-body">
          <ul class="specs-list">
            <li><strong>Always-On Mode:</strong> Light stays on continuously as long as power is available — perfect for hallways and pathways.</li>
            <li><strong>Night Sensing Mode:</strong> Light activates automatically only when it detects darkness — ideal for bedrooms and bathrooms.</li>
            <li><strong>All-Day Sensing Mode:</strong> Motion sensor active 24/7 regardless of ambient light — best for closets and cabinets.</li>
            <li><strong>OFF Mode:</strong> Light remains off until you manually switch modes — saves battery when not needed.</li>
            <li><strong>Dimmable:</strong> Long-press the power button to cycle through brightness levels for your preferred intensity.</li>
            <li><strong>Magnetic Mounting:</strong> Strong magnetic base attaches to any metal surface instantly — no screws or drilling needed.</li>
            <li><strong>Adhesive Option:</strong> Included adhesive pad for non-magnetic surfaces like wood, tile, or plastic.</li>
            <li><strong>USB Type-C Charging:</strong> Charge with any standard USB-C cable — fully charges in 2–3 hours and lasts weeks per charge.</li>
            <li><strong>PIR Sensor Range:</strong> Detects movement within 3–5 meters — responsive and accurate with minimal false triggers.</li>
          </ul>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">🚚 Shipping Policy <span class="arrow">▼</span></div>
        <div class="accordion-body"><p style="font-size:12px;line-height:1.7;">Free shipping on all orders across Pakistan. Orders processed within 1–2 business days. Delivery takes 3–7 business days.</p></div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">🔄 Return &amp; Exchange <span class="arrow">▼</span></div>
        <div class="accordion-body"><p style="font-size:12px;line-height:1.7;">We offer a 7-day return policy. Items must be in original condition. Contact our customer care team to initiate a return.</p></div>
      </div>
    </div>
  </div>
</div>
<div class="reviews-section" id="reviews">
  <h2>👏 Customer Reviews</h2>
  <div class="reviews-summary">
    <div class="reviews-avg">
      <div class="reviews-avg-num">4.9</div>
      <div class="reviews-avg-stars">★★★★★</div>
      <div class="reviews-avg-label">892+ Verified Reviews</div>
    </div>
    <div class="rating-bars">
      <div class="rating-bar-row"><span class="rating-bar-label">5</span><span class="rating-bar-stars">★</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:84%"></div></div><span class="rating-bar-pct">84%</span></div>
      <div class="rating-bar-row"><span class="rating-bar-label">4</span><span class="rating-bar-stars">★</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:12%"></div></div><span class="rating-bar-pct">12%</span></div>
      <div class="rating-bar-row"><span class="rating-bar-label">3</span><span class="rating-bar-stars">★</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:3%"></div></div><span class="rating-bar-pct">3%</span></div>
      <div class="rating-bar-row"><span class="rating-bar-label">2</span><span class="rating-bar-stars">★</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:1%"></div></div><span class="rating-bar-pct">1%</span></div>
      <div class="rating-bar-row"><span class="rating-bar-label">1</span><span class="rating-bar-stars">★</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:0%"></div></div><span class="rating-bar-pct">0%</span></div>
    </div>
  </div>
  <div class="reviews-grid">
    <?php foreach ($reviews as $r): ?>
    <div class="review-card">
      <div class="review-top">
        <div><div class="reviewer-name"><?php echo esc_html($r['name']); ?></div><div class="review-date"><?php echo esc_html($r['date']); ?></div></div>
        <div class="review-stars"><?php echo snaplyr_stars($r['stars']); ?></div>
      </div>
      <div class="review-text"><?php echo esc_html($r['text']); ?></div>
      <div class="review-footer">
        <div class="verified-badge">✅ Verified Purchase</div>
        <span class="review-qty">Ordered: <?php echo esc_html($r['qty']); ?></span>
      </div>
    </div>
    <?php endforeach; ?>
    <?php foreach ($db_reviews as $db_r):
      $db_stars       = (int) get_post_meta($db_r->ID, '_snaplyr_stars',       true);
      $db_qty         = get_post_meta($db_r->ID, '_snaplyr_qty',         true);
      $db_date_text   = get_post_meta($db_r->ID, '_snaplyr_date_text',   true);
      $db_review_text = get_post_meta($db_r->ID, '_snaplyr_review_text', true);
      $db_name        = get_the_title($db_r->ID);
    ?>
    <div class="review-card">
      <div class="review-top">
        <div>
          <div class="reviewer-name"><?php echo esc_html($db_name); ?></div>
          <div class="review-date"><?php echo esc_html($db_date_text); ?></div>
        </div>
        <div class="review-stars"><?php echo snaplyr_stars($db_stars); ?></div>
      </div>
      <div class="review-text"><?php echo esc_html($db_review_text); ?></div>
      <div class="review-footer">
        <div class="verified-badge">✅ Verified Purchase</div>
        <?php if ($db_qty): ?>
        <span class="review-qty">Ordered: <?php echo esc_html($db_qty); ?></span>
        <?php endif; ?>
      </div>
    </div>
    <?php endforeach; ?>
  </div>

  <!-- Write a Review Section -->
  <div class="write-review-section">
    <?php if (isset($_GET['review']) && $_GET['review'] === 'submitted'): ?>
    <div class="review-success-msg">
      <span class="success-icon">🎉</span>
      <div>
        <strong>Thank you for your review!</strong><br>
        <span style="font-weight:400;font-size:13px;">Your review has been submitted and is pending approval. It will appear here once approved.</span>
      </div>
    </div>
    <?php else: ?>
    <button class="write-review-btn" id="writeReviewBtn" onclick="showReviewGate()">✍️ Write a Review</button>

    <div class="review-gate" id="reviewGate">
      <p>📦 Reviews can only be submitted after you've received and used the product. This ensures all reviews are genuine and helpful to other customers.</p>
      <div class="review-gate-actions">
        <button class="gate-btn-no" onclick="closeReviewGate()">❌ I haven't received it yet</button>
        <button class="gate-btn-yes" onclick="showReviewForm()">✅ I've received my order — Write Review</button>
      </div>
    </div>

    <div class="review-form-wrap" id="reviewFormWrap">
      <h3>✍️ Write Your Review</h3>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <input type="hidden" name="action" value="snaplyr_submit_review"/>
        <input type="hidden" name="product" value="motion-sensor-light"/>
        <?php wp_nonce_field('snaplyr_submit_review', 'snaplyr_review_nonce'); ?>

        <div class="review-form-group">
          <label for="ms_reviewer_name">Your Name <span style="color:var(--accent);">*</span></label>
          <input type="text" id="ms_reviewer_name" name="reviewer_name" placeholder="e.g. Ahmed R." required/>
        </div>

        <div class="review-form-group">
          <label>Your Rating <span style="color:var(--accent);">*</span></label>
          <div class="star-rating" role="radiogroup" aria-label="Star rating">
            <input type="radio" id="ms_star5" name="stars" value="5" required/>
            <label for="ms_star5" title="5 stars">★</label>
            <input type="radio" id="ms_star4" name="stars" value="4"/>
            <label for="ms_star4" title="4 stars">★</label>
            <input type="radio" id="ms_star3" name="stars" value="3"/>
            <label for="ms_star3" title="3 stars">★</label>
            <input type="radio" id="ms_star2" name="stars" value="2"/>
            <label for="ms_star2" title="2 stars">★</label>
            <input type="radio" id="ms_star1" name="stars" value="1"/>
            <label for="ms_star1" title="1 star">★</label>
          </div>
        </div>

        <div class="review-form-group">
          <label for="ms_qty">Quantity Ordered <span style="color:var(--muted);font-weight:400;">(optional, e.g. 2 pcs)</span></label>
          <input type="text" id="ms_qty" name="qty" placeholder="e.g. 2 pcs"/>
        </div>

        <div class="review-form-group">
          <label for="ms_review_text">Your Review <span style="color:var(--accent);">*</span></label>
          <textarea id="ms_review_text" name="review_text" rows="4" placeholder="Tell others about your experience with this product..." required></textarea>
        </div>

        <button type="submit" class="review-submit-btn">🚀 Submit Review</button>
      </form>
    </div>
    <?php endif; ?>
  </div>
</div>
<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <div class="logo" style="color:#fff;font-size:22px;">Snap<span style="color:#f4a261;">lyr</span></div>
      <p>Premium lighting solutions for every home. Quality products, delivered across Pakistan.</p>
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

  // Review gate / form show-hide logic
  function showReviewGate() {
    const gate = document.getElementById('reviewGate');
    const form = document.getElementById('reviewFormWrap');
    gate.style.display = 'block';
    if (form) form.style.display = 'none';
    gate.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function closeReviewGate() {
    const gate = document.getElementById('reviewGate');
    if (gate) gate.style.display = 'none';
  }
  function showReviewForm() {
    const gate = document.getElementById('reviewGate');
    const form = document.getElementById('reviewFormWrap');
    if (gate) gate.style.display = 'none';
    if (form) {
      form.style.display = 'block';
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
</script>
<?php wp_footer(); ?>
</body>
</html>
