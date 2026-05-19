<?php
/**
 * Template Name: Solar Product Page
 */

// ═════════════════════════════════════════════════════════════════════════
//  PRODUCT IMAGES
//  1. Go to: WordPress Admin > Media > Add New
//  2. Upload your 5 product photos
//  3. Click each uploaded image, copy the File URL shown on the right
//  4. Paste each URL below, replacing the placeholder text
// ═════════════════════════════════════════════════════════════════════════
$imgs = [
    'PASTE_IMAGE_1_URL_HERE',  // Main infographic image (shown first)
    'PASTE_IMAGE_2_URL_HERE',  // Night lifestyle image
    'PASTE_IMAGE_3_URL_HERE',  // Installation steps image
    'PASTE_IMAGE_4_URL_HERE',  // Before / After image
    'PASTE_IMAGE_5_URL_HERE',  // Benefits / ROI image
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
    ['name'=>'Sarah A.',        'stars'=>5, 'date'=>'May 12, 2025', 'qty'=>'2 pcs',  'text'=>'Absolutely love this solar lamp! The motion sensor detects movement from really far. My driveway looks stunning at night. Received in just 2 days!'],
    ['name'=>'Adnan Waheed',    'stars'=>5, 'date'=>'May 14, 2025', 'qty'=>'3 pcs',  'text'=>'Yaar ye product bohot kaam ka hai! Solar charging gajab kaam karti hai. Raat bhar jalti rehti hai. 10/10 recommend karta hoon!'],
    ['name'=>'Muhammad Omar',   'stars'=>5, 'date'=>'May 10, 2025', 'qty'=>'10 pcs', 'text'=>'Ordered 10 pieces for my entire boundary wall. Every single one works perfectly. Best investment for outdoor lighting!'],
    ['name'=>'Sadia Latif',     'stars'=>5, 'date'=>'May 11, 2025', 'qty'=>'8 pcs',  'text'=>'Maine 8 piece mangwaye thay ghar ki boundary ke liye. Sab ekdam sahi condition mein aye aur kaam bhi perfect hai!'],
    ['name'=>'Ayesha Khan',     'stars'=>5, 'date'=>'May 8, 2025',  'qty'=>'4 pcs',  'text'=>'Quality exceeded my expectations. Solar charges fast even on cloudy days. Would definitely order more!'],
    ['name'=>'Usman Khalid',    'stars'=>5, 'date'=>'May 9, 2025',  'qty'=>'2 pcs',  'text'=>'Delivery bohot fast thi, 2 din mein aa gayi. Quality dekh ke bohot khushi hui. Motion sensor bhi ekdam sahi kaam kar raha hai!'],
    ['name'=>'Hassan Malik',    'stars'=>5, 'date'=>'May 7, 2025',  'qty'=>'4 pcs',  'text'=>'Installation was so easy, no electrician needed. Mounted all 4 lamps in under 30 minutes. 100% recommend!'],
    ['name'=>'Hina Munir',      'stars'=>5, 'date'=>'May 6, 2025',  'qty'=>'4 pcs',  'text'=>'Ghar ka bahar bahut sundar lag raha hai ab raat ko. Solar light ki waja se bijli ka bill bhi nahi barhta. Bohot achi cheez hai!'],
    ['name'=>'Zara Baig',       'stars'=>4, 'date'=>'May 5, 2025',  'qty'=>'2 pcs',  'text'=>'Beautiful design and works great. Delivery took 3 days but product quality is excellent. Very happy with the purchase!'],
    ['name'=>'Khalid Butt',     'stars'=>4, 'date'=>'May 2, 2025',  'qty'=>'3 pcs',  'text'=>'Product bahut acha hai, sirf ek kaami hai ke color ka option nahi. Baki sab kuch ekdam zabardast. Zaroor khareedein!'],
    ['name'=>'Imran Tariq',     'stars'=>5, 'date'=>'May 4, 2025',  'qty'=>'6 pcs',  'text'=>'My garden looks like a 5-star hotel at night now! The warm light is perfect. Fast delivery and excellent packaging.'],
    ['name'=>'Rukhsana Tahir',  'stars'=>5, 'date'=>'Apr 30, 2025', 'qty'=>'2 pcs',  'text'=>'Mera beta bohot khush hua jab ye lamps lagaye. Ghar ekdam chamak utha raat ko. Fast delivery aur shukriya Snaplyr!'],
    ['name'=>'Nadia Rashid',    'stars'=>5, 'date'=>'May 3, 2025',  'qty'=>'2 pcs',  'text'=>'Motion sensor is super sensitive, lights up whenever anyone enters the gate. Feeling much safer at home now!'],
    ['name'=>'Naveed Akhtar',   'stars'=>5, 'date'=>'Apr 28, 2025', 'qty'=>'10 pcs', 'text'=>'Pehle order mein 4 liye thay, doosre order mein aur 6 le liye. Itna acha product hai! Installation bhi bohot easy thi.'],
    ['name'=>'Bilal Chaudhry',  'stars'=>5, 'date'=>'May 1, 2025',  'qty'=>'4 pcs',  'text'=>'Quality is top notch. Was skeptical about solar charging but it works amazingly well. Zero electricity bill increase!'],
    ['name'=>'Zainab Qureshi',  'stars'=>5, 'date'=>'Apr 26, 2025', 'qty'=>'2 pcs',  'text'=>'Barsaat mein bhi kaam karta raha, weatherproof sach mein hai. Quality se bilkul satisfied hoon. Bohot acha buy kiya!'],
    ['name'=>'Farrukh Ali',     'stars'=>5, 'date'=>'Apr 29, 2025', 'qty'=>'6 pcs',  'text'=>'Bought 6 pieces for my farmhouse boundary. All working perfectly after 2 months. Extremely durable product!'],
    ['name'=>'Faisal Dar',      'stars'=>5, 'date'=>'Apr 24, 2025', 'qty'=>'12 pcs', 'text'=>'Mere farmhouse pe 12 lamps lagaye hain. Raat ko bilkul chamak aata hai poora bahar. Zero current ka use. Bohot happy hoon!'],
    ['name'=>'Mariam Siddiqui', 'stars'=>5, 'date'=>'Apr 27, 2025', 'qty'=>'3 pcs',  'text'=>'Best purchase this year! The before/after difference is unbelievable. My neighbors keep asking where I bought these!'],
    ['name'=>'Misbah Rehman',   'stars'=>5, 'date'=>'Apr 22, 2025', 'qty'=>'5 pcs',  'text'=>'Chand roz pehle 5 piece order kiye, delivery next day aayi! Quality aur packaging dono ekdam perfect. Snaplyr pe trust hai!'],
    ['name'=>'Talha Nadeem',    'stars'=>5, 'date'=>'Apr 25, 2025', 'qty'=>'2 pcs',  'text'=>'Fast delivery, great quality. The lamp charges during the day and runs the whole night. Exactly as described!'],
    ['name'=>'Asad Haider',     'stars'=>5, 'date'=>'Apr 20, 2025', 'qty'=>'3 pcs',  'text'=>'Ye product lene ke baad mujhe pata chala kya hota hai smart outdoor lighting. Har ek rupay wasool hai. Bohot achi cheez!'],
    ['name'=>'Urooj Hussain',   'stars'=>4, 'date'=>'Apr 23, 2025', 'qty'=>'4 pcs',  'text'=>'Really nice product. Elegant design fits well with my home exterior. Delivery was on time. Very satisfied!'],
    ['name'=>'Laiba Fatima',    'stars'=>4, 'date'=>'Apr 18, 2025', 'qty'=>'2 pcs',  'text'=>'Bohot pyara design hai aur raat ko ghar bohot sundar dikhta hai. Delivery 3 din mein aayi. Overall satisfied hoon!'],
    ['name'=>'Danish Farooqi',  'stars'=>5, 'date'=>'Apr 21, 2025', 'qty'=>'4 pcs',  'text'=>'Ordered for my parents\' home as a gift. They absolutely love it. Easy setup and the light is very bright!'],
    ['name'=>'Amna Pervez',     'stars'=>5, 'date'=>'Apr 19, 2025', 'qty'=>'2 pcs',  'text'=>'The solar panel charges super fast. Even works in winter with less sunlight. Outstanding product!'],
    ['name'=>'Rehan Qureshi',   'stars'=>5, 'date'=>'Apr 17, 2025', 'qty'=>'5 pcs',  'text'=>'My entire street knows about this product because my house looks amazing at night! Recommended to 5 neighbors already.'],
];
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

    /* TOPBAR */
    .topbar { background: #1b1b1b; color: #fff; text-align: center; font-size: 12px; padding: 8px 12px; line-height: 1.4; }
    .topbar span { color: #f4a261; }

    /* HEADER */
    header {
      background: #fff; border-bottom: 1px solid var(--border);
      padding: 12px 20px; display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06); gap: 12px;
    }
    .logo { font-size: 20px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }
    .logo span { color: var(--primary); }
    .header-nav { display: flex; gap: 18px; font-size: 13px; font-weight: 500; }
    .header-nav a { white-space: nowrap; transition: color 0.2s; }
    .header-nav a:hover { color: var(--primary); }
    .header-icons { display: flex; gap: 14px; align-items: center; flex-shrink: 0; }
    .header-icons svg { width: 22px; height: 22px; cursor: pointer; }

    /* BREADCRUMB */
    .breadcrumb { max-width: 1100px; margin: 12px auto 0; padding: 0 16px; font-size: 12px; color: var(--muted); }
    .breadcrumb a { color: var(--muted); }

    /* PRODUCT WRAPPER */
    .product-wrapper {
      max-width: 1100px; margin: 16px auto 40px;
      padding: 0 16px; display: grid; grid-template-columns: 1fr 1fr;
      gap: 40px; align-items: start;
    }

    /* GALLERY */
    .gallery { position: sticky; top: 72px; }
    .gallery-main { border-radius: var(--radius); overflow: hidden; background: #eee; aspect-ratio: 1/1; position: relative; }
    .gallery-main img { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; }
    .badge-sale { position: absolute; top: 12px; left: 12px; background: var(--accent); color: #fff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; z-index: 1; }
    .gallery-thumbs { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .gallery-thumbs img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 2px solid transparent; cursor: pointer; transition: border-color 0.2s; flex-shrink: 0; }
    .gallery-thumbs img.active { border-color: var(--primary); }

    /* PRODUCT INFO */
    .product-info { display: flex; flex-direction: column; gap: 14px; }
    .product-title { font-size: 24px; font-weight: 800; line-height: 1.2; }
    .rating-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .stars { color: #f4a261; font-size: 15px; letter-spacing: 1px; }
    .trustbadge { background: #fff8ee; border: 1px solid #f4a261; border-radius: 5px; padding: 2px 8px; font-size: 12px; color: #b45309; font-weight: 600; }
    .price-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .price-original { text-decoration: line-through; color: var(--muted); font-size: 15px; }
    .price-sale { font-size: 26px; font-weight: 800; color: var(--accent); }
    .price-tag { background: var(--accent); color: #fff; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; }

    /* FEATURES BOX */
    .features-box { background: var(--primary-light); border-radius: var(--radius); padding: 14px; }
    .features-box h4 { font-size: 13px; font-weight: 700; margin-bottom: 10px; color: var(--primary); }
    .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .feature-item { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; }
    .feature-icon { width: 30px; height: 30px; background: var(--primary); border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 15px; }

    /* HAPPY BADGE */
    .happy-badge { background: #1b1b1b; color: #fff; border-radius: 30px; padding: 8px 16px; font-size: 12px; display: flex; align-items: center; gap: 8px; width: fit-content; }
    .happy-badge .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 1.5s infinite; flex-shrink: 0; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .urgency { color: var(--accent); font-weight: 700; font-size: 13px; }

    /* BUNDLE OPTIONS */
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

    /* COUNTDOWN */
    .countdown-box { background: #1b1b1b; color: #fff; border-radius: var(--radius); padding: 12px 14px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .countdown-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; flex-shrink: 0; }
    .countdown-timer { display: flex; gap: 6px; align-items: center; }
    .time-block { text-align: center; }
    .time-num { background: var(--accent); color: #fff; font-size: 18px; font-weight: 800; width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
    .time-sep { font-size: 18px; font-weight: 800; color: var(--accent); }
    .time-label { font-size: 9px; text-transform: uppercase; opacity: 0.6; margin-top: 2px; }

    /* ADD TO CART */
    .add-to-cart-btn { background: #1b1b1b; color: #fff; border: none; padding: 16px; font-size: 16px; font-weight: 700; border-radius: var(--radius); cursor: pointer; width: 100%; transition: background 0.2s; letter-spacing: 0.5px; touch-action: manipulation; }
    .add-to-cart-btn:hover { background: var(--primary); }
    .add-to-cart-btn:active { transform: scale(0.99); }

    /* SHIPPING INFO */
    .shipping-info { background: #f9fafb; border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px; font-size: 12px; line-height: 1.6; }
    .shipping-info strong { color: var(--primary); }
    .delivery-timeline { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 10px; }
    .delivery-step { text-align: center; }
    .delivery-icon { font-size: 20px; margin-bottom: 3px; }
    .delivery-step-title { font-size: 10px; font-weight: 700; color: var(--muted); }
    .delivery-step-date { font-size: 11px; font-weight: 600; }

    /* ACCORDION */
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

    /* REVIEWS SECTION */
    .reviews-section { max-width: 1100px; margin: 0 auto 60px; padding: 0 16px; scroll-margin-top: 80px; }
    .reviews-section > h2 { font-size: 22px; font-weight: 800; margin-bottom: 20px; }

    .reviews-summary {
      background: #fff; border-radius: var(--radius);
      padding: 24px; margin-bottom: 28px;
      box-shadow: var(--shadow);
      display: grid; grid-template-columns: 160px 1fr;
      gap: 32px; align-items: center;
    }
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
    .review-card {
      background: #fff; border-radius: var(--radius);
      padding: 16px; box-shadow: var(--shadow);
      display: flex; flex-direction: column; gap: 10px;
      border: 1px solid var(--border);
    }
    .review-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .reviewer-name { font-weight: 700; font-size: 14px; }
    .review-date { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .review-stars { color: #f4a261; font-size: 15px; letter-spacing: 1px; flex-shrink: 0; }
    .review-text { font-size: 13px; line-height: 1.65; color: #374151; flex: 1; }
    .review-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding-top: 8px; border-top: 1px solid var(--border); }
    .verified-badge { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #16a34a; font-weight: 600; }
    .review-qty { font-size: 11px; color: var(--muted); background: #f3f4f6; padding: 2px 8px; border-radius: 10px; }

    /* FOOTER */
    footer { background: #1b1b1b; color: #fff; padding: 36px 16px 20px; }
    .footer-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 36px; padding-bottom: 28px; border-bottom: 1px solid #333; }
    .footer-brand p { font-size: 13px; color: #9ca3af; line-height: 1.6; margin-top: 10px; }
    footer h4 { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
    footer ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    footer ul li a { font-size: 12px; color: #9ca3af; transition: color 0.2s; }
    footer ul li a:hover { color: #fff; }
    .footer-bottom { max-width: 1100px; margin: 14px auto 0; font-size: 11px; color: #6b7280; text-align: center; }

    /* RESPONSIVE: TABLET */
    @media (max-width: 900px) {
      .header-nav { gap: 14px; font-size: 12px; }
      .product-wrapper { gap: 28px; }
      .reviews-grid { grid-template-columns: repeat(2,1fr); }
      .reviews-summary { grid-template-columns: 130px 1fr; gap: 20px; }
    }

    /* RESPONSIVE: MOBILE */
    @media (max-width: 768px) {
      .topbar { font-size: 11px; padding: 7px 10px; }
      header { padding: 10px 14px; }
      .logo { font-size: 18px; }
      .header-nav { display: none; }
      .header-icons svg { width: 24px; height: 24px; }
      .breadcrumb { margin-top: 10px; padding: 0 14px; }
      .product-wrapper { grid-template-columns: 1fr; gap: 20px; margin: 12px auto 32px; padding: 0 14px; }
      .gallery { position: static; }
      .gallery-thumbs img { width: 56px; height: 56px; }
      .product-title { font-size: 20px; }
      .price-sale { font-size: 22px; }
      .features-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
      .feature-item { font-size: 11px; gap: 6px; }
      .feature-icon { width: 28px; height: 28px; font-size: 13px; }
      .bundle-option { padding: 9px 12px; gap: 10px; }
      .countdown-box { gap: 10px; padding: 10px 12px; }
      .time-num { width: 36px; height: 36px; font-size: 16px; }
      .time-sep { font-size: 16px; }
      .add-to-cart-btn { font-size: 15px; padding: 15px; }
      .reviews-section { padding: 0 14px; margin-bottom: 40px; }
      .reviews-summary { grid-template-columns: 1fr; text-align: center; }
      .reviews-avg { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
      .reviews-grid { grid-template-columns: 1fr; }
      .footer-grid { grid-template-columns: 1fr; gap: 20px; }
      footer { padding: 28px 14px 16px; }
    }

    /* RESPONSIVE: SMALL MOBILE */
    @media (max-width: 480px) {
      .product-title { font-size: 18px; }
      .price-sale { font-size: 20px; }
      .bundle-sub { display: none; }
      .countdown-box { flex-direction: column; align-items: flex-start; gap: 8px; }
      .countdown-timer { width: 100%; justify-content: flex-start; }
      .time-num { width: 38px; height: 38px; font-size: 17px; }
      .happy-badge { font-size: 11px; padding: 7px 14px; }
    }

    /* RESPONSIVE: VERY SMALL */
    @media (max-width: 360px) {
      .product-wrapper { padding: 0 10px; }
      .product-title { font-size: 17px; }
      .gallery-thumbs img { width: 48px; height: 48px; }
      .add-to-cart-btn { font-size: 14px; padding: 14px; }
    }
  </style>
</head>
<body>

<div class="topbar">
  <span>🚚</span> FREE DELIVERY ALL OVER PAKISTAN <span>🚚</span>
</div>

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

<div class="breadcrumb">
  <a href="<?php echo home_url(); ?>">Home</a> › LED Solar Wall Lamp
</div>

<div class="product-wrapper">

  <!-- GALLERY -->
  <div class="gallery">
    <div class="gallery-main">
      <span class="badge-sale">Sale</span>
      <img id="mainImg"
        src="<?php echo esc_url($imgs[0]); ?>"
        alt="<?php echo esc_attr($alts[0]); ?>"/>
    </div>
    <div class="gallery-thumbs">
      <?php foreach ($imgs as $i => $url): ?>
      <img
        <?php echo $i === 0 ? 'class="active"' : ''; ?>
        src="<?php echo esc_url($url); ?>"
        onclick="changeImg(this,'<?php echo esc_js($url); ?>')"
        alt="<?php echo esc_attr($alts[$i]); ?>"/>
      <?php endforeach; ?>
    </div>
  </div>

  <!-- PRODUCT INFO -->
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

    <!-- BUNDLE OPTIONS -->
    <div>
      <p class="bundle-label">Buy MORE – SAVE Upto 26%</p>
      <p style="font-size:11px;color:var(--muted);margin-bottom:10px;">SAVE BIG MEGA SALE OFFER</p>
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
      <span class="countdown-label">⌛ Offer Ends In</span>
      <div class="countdown-timer">
        <div class="time-block"><div class="time-num" id="cd-h">23</div><div class="time-label">Hours</div></div>
        <div class="time-sep">:</div>
        <div class="time-block"><div class="time-num" id="cd-m">58</div><div class="time-label">Mins</div></div>
        <div class="time-sep">:</div>
        <div class="time-block"><div class="time-num" id="cd-s">01</div><div class="time-label">Secs</div></div>
      </div>
    </div>

    <!-- ADD TO CART -->
    <form id="cartForm" method="get" action="<?php echo esc_url(home_url('/cart/')); ?>">
      <input type="hidden" name="add-to-cart" value="17"/>
      <input type="hidden" name="quantity" id="qtyInput" value="2"/>
      <button type="submit" class="add-to-cart-btn">🛒 Add to Cart</button>
    </form>

    <!-- SHIPPING INFO -->
    <div class="shipping-info">
      <p>🚚 <strong>Free Shipping</strong> to Pakistan &nbsp;|&nbsp; Order within <strong id="dispatchCountdown">06 Hours 00 Minutes</strong> for dispatch today.</p>
      <p style="margin-top:5px;color:var(--muted);font-size:11px;">You'll receive your package within 3–7 business days.</p>
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
          <p style="font-size:12px;line-height:1.7;">Free shipping on all orders across Pakistan. Orders processed within 1–2 business days. Delivery takes 3–7 business days.</p>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          🔄 Return &amp; Exchange <span class="arrow">▼</span>
        </div>
        <div class="accordion-body">
          <p style="font-size:12px;line-height:1.7;">We offer a 7-day return policy. Items must be in original condition. Contact our customer care team to initiate a return.</p>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- CUSTOMER REVIEWS -->
<div class="reviews-section" id="reviews">
  <h2>👏 Customer Reviews</h2>

  <!-- SUMMARY -->
  <div class="reviews-summary">
    <div class="reviews-avg">
      <div class="reviews-avg-num">4.9</div>
      <div class="reviews-avg-stars">★★★★★</div>
      <div class="reviews-avg-label">1,427+ Verified Reviews</div>
    </div>
    <div class="rating-bars">
      <div class="rating-bar-row">
        <span class="rating-bar-label">5</span>
        <span class="rating-bar-stars">★</span>
        <div class="rating-bar-track"><div class="rating-bar-fill" style="width:82%"></div></div>
        <span class="rating-bar-pct">82%</span>
      </div>
      <div class="rating-bar-row">
        <span class="rating-bar-label">4</span>
        <span class="rating-bar-stars">★</span>
        <div class="rating-bar-track"><div class="rating-bar-fill" style="width:14%"></div></div>
        <span class="rating-bar-pct">14%</span>
      </div>
      <div class="rating-bar-row">
        <span class="rating-bar-label">3</span>
        <span class="rating-bar-stars">★</span>
        <div class="rating-bar-track"><div class="rating-bar-fill" style="width:3%"></div></div>
        <span class="rating-bar-pct">3%</span>
      </div>
      <div class="rating-bar-row">
        <span class="rating-bar-label">2</span>
        <span class="rating-bar-stars">★</span>
        <div class="rating-bar-track"><div class="rating-bar-fill" style="width:1%"></div></div>
        <span class="rating-bar-pct">1%</span>
      </div>
      <div class="rating-bar-row">
        <span class="rating-bar-label">1</span>
        <span class="rating-bar-stars">★</span>
        <div class="rating-bar-track"><div class="rating-bar-fill" style="width:0%"></div></div>
        <span class="rating-bar-pct">0%</span>
      </div>
    </div>
  </div>

  <!-- REVIEW CARDS -->
  <div class="reviews-grid">
    <?php foreach ($reviews as $r): ?>
    <div class="review-card">
      <div class="review-top">
        <div>
          <div class="reviewer-name"><?php echo esc_html($r['name']); ?></div>
          <div class="review-date"><?php echo esc_html($r['date']); ?></div>
        </div>
        <div class="review-stars"><?php echo snaplyr_stars($r['stars']); ?></div>
      </div>
      <div class="review-text"><?php echo esc_html($r['text']); ?></div>
      <div class="review-footer">
        <div class="verified-badge">✅ Verified Purchase</div>
        <span class="review-qty">Ordered: <?php echo esc_html($r['qty']); ?></span>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
</div>

<!-- FOOTER -->
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
</script>

<?php wp_footer(); ?>
</body>
</html>
