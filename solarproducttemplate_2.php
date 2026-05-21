<?php
/**
 * Template Name: Solar Product Page
 */

$imgs = [
    'https://snaplyr.com/wp-content/uploads/2026/05/1.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/2.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/3.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/4.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/5.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/6.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/7.webp',
];
$alts = [
    'LED Solar Wall Lamp – Product Features',
    'LED Solar Wall Lamp – Outdoor Night Scene',
    'LED Solar Wall Lamp – Easy Installation',
    'LED Solar Wall Lamp – Before and After',
    'LED Solar Wall Lamp – Benefits',
];

function snaplyr_stars( $n ) {
    $s = '';
    for ( $i = 1; $i <= 5; $i++ ) $s .= ( $i <= $n ) ? '★' : '☆';
    return $s;
}

$reviews = [
    ['name'=>'Sarah A.',        'stars'=>5, 'date'=>'May 12, 2025', 'qty'=>'2 pcs',  'text'=>'Really good quality solar lamp. Motion sensor works perfectly at night. My driveway looks beautiful now. Received in just 2 days.'],
    ['name'=>'Adnan Waheed',    'stars'=>5, 'date'=>'May 14, 2025', 'qty'=>'3 pcs',  'text'=>'Yaar bohot acha product hai. Solar charging perfect kaam karti hai aur light poori raat chalti rehti hai.'],
    ['name'=>'Muhammad Omar',   'stars'=>5, 'date'=>'May 10, 2025', 'qty'=>'10 pcs', 'text'=>'Ordered 10 pieces for my boundary wall. All lights are working perfectly. Best investment for outdoor lighting.'],
    ['name'=>'Sadia Latif',     'stars'=>5, 'date'=>'May 11, 2025', 'qty'=>'8 pcs',  'text'=>'Maine 8 pieces order kiye thay ghar ke liye. Sab perfect condition mein aye aur quality expected se better thi.'],
    ['name'=>'Ayesha Khan',     'stars'=>5, 'date'=>'May 8, 2025',  'qty'=>'4 pcs',  'text'=>'Quality exceeded my expectations. Solar charging works very well even on cloudy days.'],
    ['name'=>'Usman Khalid',    'stars'=>5, 'date'=>'May 9, 2025',  'qty'=>'2 pcs',  'text'=>'Delivery bohot fast thi. Motion sensor sirf raat ko kaam karta hai aur movement detect karte hi light on ho jati hai.'],
    ['name'=>'Hassan Malik',    'stars'=>5, 'date'=>'May 7, 2025',  'qty'=>'4 pcs',  'text'=>'Installation bohot easy thi. Koi electrician ki zarurat nahi pari. Sab lights 30 minutes mein install ho gayin.'],
    ['name'=>'Hina Munir',      'stars'=>5, 'date'=>'May 6, 2025',  'qty'=>'4 pcs',  'text'=>'Ab raat ko ghar bohot premium lagta hai. Bijli ka bill bhi increase nahi hota. Bohot useful cheez hai.'],
    ['name'=>'Zara Baig',       'stars'=>4, 'date'=>'May 5, 2025',  'qty'=>'2 pcs',  'text'=>'Beautiful design and very bright light. Delivery took 3 days but overall very satisfied.'],
    ['name'=>'Khalid Butt',     'stars'=>4, 'date'=>'May 2, 2025',  'qty'=>'3 pcs',  'text'=>'Product quality bohot achi hai. Bas aur colors hote tou aur acha hota.'],
    ['name'=>'Imran Tariq',     'stars'=>5, 'date'=>'May 4, 2025',  'qty'=>'6 pcs',  'text'=>'My garden looks amazing at night now. Warm light gives a very luxury feel.'],
    ['name'=>'Rukhsana Tahir',  'stars'=>5, 'date'=>'Apr 30, 2025', 'qty'=>'2 pcs',  'text'=>'Ghar ka poora look change ho gaya hai raat ko. Fast delivery aur achi packaging thi.'],
    ['name'=>'Nadia Rashid',    'stars'=>5, 'date'=>'May 3, 2025',  'qty'=>'2 pcs',  'text'=>'Motion sensor bohot sensitive hai. Gate ke paas koi aaye tou foran light on ho jati hai.'],
    ['name'=>'Naveed Akhtar',   'stars'=>5, 'date'=>'Apr 28, 2025', 'qty'=>'10 pcs', 'text'=>'Pehle 4 order kiye thay phir aur 6 order kar diye. Itna acha product hai.'],
    ['name'=>'Bilal Chaudhry',  'stars'=>5, 'date'=>'May 1, 2025',  'qty'=>'4 pcs',  'text'=>'Was not expecting this level of quality honestly. Solar charging works perfectly. Zero electricity bill increase.'],
    ['name'=>'Zainab Qureshi',  'stars'=>5, 'date'=>'Apr 26, 2025', 'qty'=>'2 pcs',  'text'=>'Barsaat mein bhi perfectly kaam kar rahi hai. Weatherproof quality really impressed me.'],
    ['name'=>'Farrukh Ali',     'stars'=>5, 'date'=>'Apr 29, 2025', 'qty'=>'6 pcs',  'text'=>'Bought 6 pieces for my farmhouse. All lights still working perfectly after weeks.'],
    ['name'=>'Faisal Dar',      'stars'=>5, 'date'=>'Apr 24, 2025', 'qty'=>'12 pcs', 'text'=>'Farmhouse pe install ki hain aur raat ko poora area bohot bright lagta hai. Bohot acha experience raha.'],
    ['name'=>'Mariam Siddiqui', 'stars'=>5, 'date'=>'Apr 27, 2025', 'qty'=>'3 pcs',  'text'=>'Best purchase this year. Before and after difference is unbelievable.'],
    ['name'=>'Misbah Rehman',   'stars'=>5, 'date'=>'Apr 22, 2025', 'qty'=>'5 pcs',  'text'=>'Delivery next day aa gayi thi. Quality aur packaging dono bohot achi thi.'],
    ['name'=>'Talha Nadeem',    'stars'=>5, 'date'=>'Apr 25, 2025', 'qty'=>'2 pcs',  'text'=>'Lamp charges during daytime and works the whole night. Exactly as shown in the ads.'],
    ['name'=>'Asad Haider',     'stars'=>5, 'date'=>'Apr 20, 2025', 'qty'=>'3 pcs',  'text'=>'Smart outdoor lighting ka real maza ab samajh aya. Har rupay wasool product hai.'],
    ['name'=>'Urooj Hussain',   'stars'=>4, 'date'=>'Apr 23, 2025', 'qty'=>'4 pcs',  'text'=>'Elegant design and good brightness. Delivery was on time and installation was easy.'],
    ['name'=>'Laiba Fatima',    'stars'=>4, 'date'=>'Apr 18, 2025', 'qty'=>'2 pcs',  'text'=>'Bohot pyara design hai. Raat ko ghar bohot classy lagta hai. Overall satisfied hoon.'],
    ['name'=>'Danish Farooqi',  'stars'=>5, 'date'=>'Apr 21, 2025', 'qty'=>'4 pcs',  'text'=>'Ordered these for my parents home. They absolutely loved the brightness and design.'],
    ['name'=>'Amna Pervez',     'stars'=>5, 'date'=>'Apr 19, 2025', 'qty'=>'2 pcs',  'text'=>'Solar panel charges very fast. Even works properly during cloudy weather.'],
    ['name'=>'Rehan Qureshi',   'stars'=>5, 'date'=>'Apr 17, 2025', 'qty'=>'5 pcs',  'text'=>'My whole street keeps asking where I bought these lights from. Highly recommended product.'],
];

// Fetch approved reviews from DB for this product
$db_reviews = get_posts([
    'post_type'      => 'snaplyr_review',
    'post_status'    => 'publish',
    'posts_per_page' => -1,
    'meta_query'     => [[
        'key'   => '_snaplyr_product',
        'value' => 'solar-lamp',
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
    .accordion-body.open { max-height: 800px; padding: 12px 14px; }
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
    @media (max-width: 768px) { .topbar { font-size: 11px; padding: 7px 10px; } header { padding: 10px 14px; } .logo { font-size: 18px; } .header-nav { display: none; } .mob-btn { display: block; } .header-icons svg { width: 24px; height: 24px; } .breadcrumb { margin-top: 10px; padding: 0 14px; } .product-wrapper { grid-template-columns: 1fr; gap: 20px; margin: 12px auto 32px; padding: 0 14px; } .gallery { position: static; } .gallery-thumbs img { width: 56px; height: 56px; } .product-title { font-size: 20px; } .price-sale { font-size: 22px; } .features-grid { grid-template-columns: 1fr 1fr; gap: 8px; } .feature-item { font-size: 11px; gap: 6px; } .feature-icon { width: 28px; height: 28px; font-size: 13px; } .bundle-option { padding: 9px 12px; gap: 10px; } .countdown-box { gap: 10px; padding: 10px 12px; } .time-num { width: 36px; height: 36px; font-size: 16px; } .time-sep { font-size: 16px; } .add-to-cart-btn { font-size: 15px; padding: 15px; } .reviews-section { padding: 0 14px; margin-bottom: 40px; } .reviews-summary { grid-template-columns: 1fr; text-align: center; } .reviews-avg { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; } .reviews-grid { grid-template-columns: 1fr; } .footer-grid { grid-template-columns: 1fr; gap: 20px; } footer { padding: 28px 14px 16px; } .review-gate-actions { flex-direction: column; } .write-review-btn { width: 100%; } }
    @media (max-width: 480px) { .product-title { font-size: 18px; } .price-sale { font-size: 20px; } .bundle-sub { display: none; } .countdown-box { flex-direction: column; align-items: flex-start; gap: 8px; } .countdown-timer { width: 100%; justify-content: flex-start; } .time-num { width: 38px; height: 38px; font-size: 17px; } .happy-badge { font-size: 11px; padding: 7px 14px; } }
    @media (max-width: 360px) { .product-wrapper { padding: 0 10px; } .product-title { font-size: 17px; } .gallery-thumbs img { width: 48px; height: 48px; } .add-to-cart-btn { font-size: 14px; padding: 14px; } }
  </style>
</head>
<body>

<!-- Purchase Notification Popup -->
<div id="purchase-notif" style="
  position:fixed;bottom:20px;left:20px;z-index:9999;
  background:#fff;border:1px solid #e5e7eb;border-radius:12px;
  padding:12px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.15);
  display:flex;align-items:center;gap:12px;max-width:290px;
  transform:translateY(120px);opacity:0;transition:all 0.4s ease;
  font-family:'Segoe UI',Arial,sans-serif;font-size:13px;
">
  <div style="width:42px;height:42px;border-radius:50%;background:#d8f3dc;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💡</div>
  <div style="flex:1;min-width:0;">
    <strong id="pn-name" style="display:block;font-weight:700;color:#1b1b1b;font-size:13px;"></strong>
    <span id="pn-action" style="color:#6b7280;font-size:11px;display:block;margin-top:1px;"></span>
  </div>
  <div id="pn-time" style="font-size:10px;color:#9ca3af;white-space:nowrap;flex-shrink:0;"></div>
</div>

<div class="topbar"><span>🚚</span> FREE DELIVERY ALL OVER PAKISTAN <span>🚚</span></div>
<header>
  <button class="mob-btn" onclick="toggleMobNav()" aria-label="Menu">&#9776;</button>
  <div class="logo">Snap<span>lyr</span></div>
  <nav class="header-nav">
    <a href="<?php echo home_url(); ?>" class="active-link">Home</a>
    <a href="<?php echo home_url('/motion-sensor-night-light/'); ?>">Motion Sensor Light</a>
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
  <a href="<?php echo home_url(); ?>" class="active-link"><span class="nav-icon">🏠</span> Home</a>
  <a href="<?php echo home_url('/motion-sensor-night-light/'); ?>"><span class="nav-icon">💡</span> Motion Sensor Light</a>
  <a href="<?php echo home_url('/our-products/'); ?>"><span class="nav-icon">🛍️</span> Shop All Products</a>
  <a href="<?php echo function_exists('wc_get_cart_url') ? wc_get_cart_url() : home_url('/cart/'); ?>"><span class="nav-icon">🛒</span> Cart</a>
  <a href="#"><span class="nav-icon">📞</span> Contact Us</a>
</nav>
<div class="breadcrumb"><a href="<?php echo home_url(); ?>">Home</a> › LED Solar Wall Lamp</div>
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
    <div class="product-title">LED Solar Wall Lamp | Outdoor</div>
    <div class="rating-row">
      <div class="stars">★★★★★</div>
      <span style="font-weight:700;font-size:13px;">4.9</span>
      <span style="color:var(--muted);font-size:12px;">| 1,427+ reviews</span>
      <span class="trustbadge">Trustscore 4.9</span>
    </div>
    <div>
      <div class="price-row">
        <span class="price-original">Rs.4,500.00 PKR</span>
        <span class="price-sale">Rs.2,199.00 PKR</span>
        <span class="price-tag">Sale</span>
      </div>
      <p style="font-size:11px;color:var(--muted);margin-top:4px;">Shipping calculated at checkout.</p>
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
    <div>
      <p class="bundle-label">Buy MORE – SAVE Upto 26%</p>
      <p style="font-size:11px;color:var(--muted);margin-bottom:10px;">SAVE BIG MEGA SALE OFFER</p>
      <div class="bundle-options">
        <label class="bundle-option" onclick="selectBundle(this,1)">
          <input type="radio" name="bundle" value="1"/>
          <div class="bundle-main"><div class="bundle-title">Buy 1</div><div class="bundle-sub">Standard</div></div>
          <div class="bundle-price-col"><div class="bundle-price">PKR 2,199</div></div>
        </label>
        <label class="bundle-option selected" onclick="selectBundle(this,2)">
          <span class="bundle-badge badge-popular">POPULAR</span>
          <input type="radio" name="bundle" value="2" checked/>
          <div class="bundle-main"><div class="bundle-title">Buy 2</div><div class="bundle-sub" style="color:var(--accent);">10% OFF</div></div>
          <div class="bundle-price-col"><div class="bundle-price" style="color:var(--accent);">PKR 3,958</div><div class="bundle-old-price">PKR 4,398</div></div>
        </label>
        <label class="bundle-option" onclick="selectBundle(this,3)">
          <span class="bundle-badge badge-best">BEST VALUE</span>
          <input type="radio" name="bundle" value="3"/>
          <div class="bundle-main"><div class="bundle-title">Buy 3</div><div class="bundle-sub">20% OFF</div></div>
          <div class="bundle-price-col"><div class="bundle-price">PKR 5,277</div><div class="bundle-old-price">PKR 6,597</div></div>
        </label>
        <label class="bundle-option" onclick="selectBundle(this,4)">
          <input type="radio" name="bundle" value="4"/>
          <div class="bundle-main"><div class="bundle-title">Buy 4</div><div class="bundle-sub">23% OFF</div></div>
          <div class="bundle-price-col"><div class="bundle-price">PKR 6,773</div><div class="bundle-old-price">PKR 8,796</div></div>
        </label>
        <label class="bundle-option" onclick="selectBundle(this,5)">
          <span class="bundle-badge badge-save">SAVE MOST</span>
          <input type="radio" name="bundle" value="5"/>
          <div class="bundle-main"><div class="bundle-title">Buy 5</div><div class="bundle-sub">26% OFF</div></div>
          <div class="bundle-price-col"><div class="bundle-price">PKR 8,135</div><div class="bundle-old-price">PKR 10,995</div></div>
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
      <input type="hidden" name="add-to-cart" value="17"/>
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
      <div class="reviews-avg-label">1,427+ Verified Reviews</div>
    </div>
    <div class="rating-bars">
      <div class="rating-bar-row"><span class="rating-bar-label">5</span><span class="rating-bar-stars">★</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:82%"></div></div><span class="rating-bar-pct">82%</span></div>
      <div class="rating-bar-row"><span class="rating-bar-label">4</span><span class="rating-bar-stars">★</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:14%"></div></div><span class="rating-bar-pct">14%</span></div>
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
        <input type="hidden" name="product" value="solar-lamp"/>
        <?php wp_nonce_field('snaplyr_submit_review', 'snaplyr_review_nonce'); ?>

        <div class="review-form-group">
          <label for="reviewer_name">Your Name <span style="color:var(--accent);">*</span></label>
          <input type="text" id="reviewer_name" name="reviewer_name" placeholder="e.g. Sarah A." required/>
        </div>

        <div class="review-form-group">
          <label>Your Rating <span style="color:var(--accent);">*</span></label>
          <div class="star-rating" role="radiogroup" aria-label="Star rating">
            <input type="radio" id="sl_star5" name="stars" value="5" required/>
            <label for="sl_star5" title="5 stars">★</label>
            <input type="radio" id="sl_star4" name="stars" value="4"/>
            <label for="sl_star4" title="4 stars">★</label>
            <input type="radio" id="sl_star3" name="stars" value="3"/>
            <label for="sl_star3" title="3 stars">★</label>
            <input type="radio" id="sl_star2" name="stars" value="2"/>
            <label for="sl_star2" title="2 stars">★</label>
            <input type="radio" id="sl_star1" name="stars" value="1"/>
            <label for="sl_star1" title="1 star">★</label>
          </div>
        </div>

        <div class="review-form-group">
          <label for="qty">Quantity Ordered <span style="color:var(--muted);font-weight:400;">(optional, e.g. 2 pcs)</span></label>
          <input type="text" id="qty" name="qty" placeholder="e.g. 2 pcs"/>
        </div>

        <div class="review-form-group">
          <label for="review_text">Your Review <span style="color:var(--accent);">*</span></label>
          <textarea id="review_text" name="review_text" rows="4" placeholder="Tell others about your experience with this product..." required></textarea>
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

  // ── Purchase Notifications ──
  (function() {
    const allNames = [
      // Classic / traditional Pakistani names
      'Ahmed','Muhammad','Usman','Ali','Hassan','Bilal','Omar','Imran','Kamran','Asif',
      'Tariq','Hamza','Waqar','Farhan','Shoaib','Rizwan','Zaid','Adeel','Saad','Faisal',
      'Nadeem','Ahsan','Waseem','Salman','Junaid','Tahir','Raza','Amir','Naeem','Khalid',
      'Aamir','Ijaz','Pervaiz','Shahid','Arshad','Bashir','Nasir','Ghulam','Qasim','Iqbal',
      // Women – classic
      'Fatima','Ayesha','Sara','Nadia','Sana','Hina','Rabia','Mehwish','Sobia','Amna',
      'Zainab','Mariam','Rukhsana','Shaista','Nargis','Samina','Parveen','Razia','Kiran','Lubna',
      'Noor','Bushra','Fauzia','Nasreen','Shaheen','Zara','Alia','Sidra','Iram','Saima',
      // Young / modern Pakistani names (2000s–2010s)
      'Ayan','Rayan','Zayan','Daniyal','Rayyan','Huzaifa','Musa','Ibrahim','Yahya','Suleman',
      'Armaan','Zayn','Aarav','Hamdan','Faris','Zubair','Anas','Talha','Abuzar','Muaaz',
      'Mahnoor','Aiza','Hoorain','Eman','Maryam','Hoor','Laraib','Inaya','Alishba','Zoha',
      'Nimra','Areesha','Hania','Maha','Tania','Aroha','Quratulain','Shanzay','Parisa','Rida',
      // Young men – trending
      'Shaheer','Ahad','Fawad','Wahaj','Sheheryar','Bilal Abbas','Asad','Sami','Danish','Zohair',
      'Haseeb','Rafay','Rauf','Tooba','Subhan','Saim','Hammad','Moiz','Zubyan','Farrukh',
      // Unique / new-gen
      'Aryan','Cyrus','Emaan','Izhan','Rehaan','Jibraan','Rayaan','Kian','Ehan','Shayan',
      'Amal','Nayab','Sehar','Minahil','Bisma','Ushna','Sundus','Tayyaba','Ifrah','Zunera',
      // Punjabi / regional flavour
      'Gurdeep','Chaudhry Ahsan','Raja Imran','Rana Ali','Sheikh Bilal','Malik Usman','Syed Omar',
      'Chaudary Raza','Pasha','Butt Saab','Javed','Pervez','Ramzan','Ghulam Mustafa','Nazar'
    ];
    const cities = [
      'Lahore','Karachi','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar',
      'Gujranwala','Sialkot','Quetta','Hyderabad','Abbottabad','Gojra','Sargodha',
      'Bahawalpur','Dera Ghazi Khan','Sheikhupura','Sukkur','Larkana','Mardan',
      'Sahiwal','Rahim Yar Khan','Okara','Gujrat','Wah Cantt','Jhelum','Attock',
      'Muzaffarabad','Mirpur','Chakwal','Khanewal','Vehari','Pakpattan','Chiniot',
      'Hafizabad','Narowal','Mandi Bahauddin','Toba Tek Singh','Jhang','Kasur'
    ];
    const products = [
      'LED Solar Wall Lamp','Solar Wall Lamp (Pack of 2)','Outdoor Solar Light','Solar Wall Lamp'
    ];
    const times = ['just now','1m ago','2m ago','3m ago','4m ago','5m ago','6m ago','8m ago'];
    // Shuffle names so they don't repeat until the full list cycles
    function shuffle(arr) {
      let a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    let namePool = shuffle(allNames);
    let nameIdx = 0;
    // Intervals: 3s, 5s, 2s, 1s, 4s cycling with small random jitter
    const baseIntervals = [3000, 5000, 2000, 1000, 4000, 3500, 2500, 1500, 6000, 2000];
    let intIdx = 0;

    function showNotif() {
      if (nameIdx >= namePool.length) { namePool = shuffle(allNames); nameIdx = 0; }
      const name = namePool[nameIdx++];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const prod = products[Math.floor(Math.random() * products.length)];
      const time = times[Math.floor(Math.random() * times.length)];
      const el = document.getElementById('purchase-notif');
      document.getElementById('pn-name').textContent = name + ' from ' + city;
      document.getElementById('pn-action').textContent = 'just purchased ' + prod;
      document.getElementById('pn-time').textContent = time;
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
      setTimeout(() => { el.style.transform = 'translateY(120px)'; el.style.opacity = '0'; }, 3500);
      intIdx = (intIdx + 1) % baseIntervals.length;
      const next = baseIntervals[intIdx] + Math.floor(Math.random() * 800);
      setTimeout(showNotif, next + 4000);
    }

    setTimeout(showNotif, 3000);
  })();

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
