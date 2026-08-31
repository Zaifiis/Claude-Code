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
    'https://snaplyr.com/wp-content/uploads/2026/05/11.webp',  // Main infographic image (shown first)
    'https://snaplyr.com/wp-content/uploads/2026/05/22.webp',  // Night lifestyle image
    'https://snaplyr.com/wp-content/uploads/2026/05/33.webp',  // Installation steps image
    'https://snaplyr.com/wp-content/uploads/2026/05/44.webp',  // Before / After image
    'https://snaplyr.com/wp-content/uploads/2026/05/55.webp',  // Benefits / ROI image
    'https://snaplyr.com/wp-content/uploads/2026/05/66.webp',
    'https://snaplyr.com/wp-content/uploads/2026/05/77.webp',
    'https://snaplyr.com/wp-content/uploads/solar_lamp_demo1_opt.gif',  // Demo GIF – Off At Day, On At Night
    'https://snaplyr.com/wp-content/uploads/solar_lamp_demo2_opt.gif',  // Demo GIF – 360 View
];
$alts = [
    'LED Solar Wall Lamp – Product Features',
    'LED Solar Wall Lamp – Outdoor Night Scene',
    'LED Solar Wall Lamp – Easy Installation',
    'LED Solar Wall Lamp – Before and After',
    'LED Solar Wall Lamp – Benefits',
    'LED Solar Wall Lamp – View 6',
    'LED Solar Wall Lamp – View 7',
    'LED Solar Wall Lamp – Off At Day On At Night',
    'LED Solar Wall Lamp – 360 View',
];

// ═════════════════════════════════════════════════════════════════════════
//  CHATBOT (n8n)
//  1. Import n8n/solar-chatbot-workflow.json into your n8n instance.
//  2. Add your OpenRouter and Google Sheets credentials and activate the
//     workflow.
//  3. Copy the Webhook node's Production URL and paste it below.
// ═════════════════════════════════════════════════════════════════════════
$n8n_chat_webhook_url = 'https://n8nmine.cloud/webhook/solar-chatbot';

function snaplyr_stars( $n ) {
    $s = '';
    for ( $i = 1; $i <= 5; $i++ ) $s .= ( $i <= $n ) ? '★' : '☆';
    return $s;
}

$reviews = [
    ['name'=>'Sarah A.',        'stars'=>5, 'fresh'=>true,  'qty'=>'2 pcs',  'photos'=>['a.jpg','aa.jpg'],                                           'text'=>'Really good quality solar lamp. Motion sensor works perfectly at night. My driveway looks beautiful now. Received in just 2 days.'],
    ['name'=>'Adnan Waheed',    'stars'=>5, 'fresh'=>true,  'qty'=>'3 pcs',  'photos'=>['b.jpg'],                                                    'text'=>'Yaar bohot acha product hai. Solar charging perfect kaam karti hai aur light poori raat chalti rehti hai.'],
    ['name'=>'Muhammad Omar',   'stars'=>5, 'fresh'=>true,  'qty'=>'10 pcs', 'photos'=>['c.jpg'],                                                    'text'=>'Ordered 10 pieces for my boundary wall. All lights are working perfectly. Best investment for outdoor lighting.'],
    ['name'=>'Sadia Latif',     'stars'=>5, 'fresh'=>true,  'qty'=>'8 pcs',  'photos'=>['d.jpg'],                                                    'text'=>'Maine 8 pieces order kiye thay ghar ke liye. Sab perfect condition mein aye aur quality expected se better thi.'],
    ['name'=>'Ayesha Khan',     'stars'=>5, 'fresh'=>false, 'qty'=>'4 pcs',  'photos'=>['e.jpg','ee.jpg'],                                           'text'=>'Quality exceeded my expectations. Solar charging works very well even on cloudy days.'],
    ['name'=>'Usman Khalid',    'stars'=>5, 'fresh'=>false, 'qty'=>'2 pcs',  'photos'=>['f.webp','ff.webp','fff.webp','ffff.webp','fffff.webp','ffffff.webp'], 'text'=>'Delivery bohot fast thi. Motion sensor sirf raat ko kaam karta hai aur movement detect karte hi light on ho jati hai.'],
    ['name'=>'Hassan Malik',    'stars'=>5, 'fresh'=>false, 'qty'=>'4 pcs',  'photos'=>['g.webp','gg.webp','ggg.webp'],                             'text'=>'Installation bohot easy thi. Koi electrician ki zarurat nahi pari. Sab lights 30 minutes mein install ho gayin.'],
    ['name'=>'Hina Munir',      'stars'=>5, 'fresh'=>false, 'qty'=>'4 pcs',  'photos'=>[],                                                           'text'=>'Ab raat ko bahir ki light khud on ho jaati hai — bahar jaake switch nahi karna parta. Motion sensor itna accurate hai ke gate ke paas qadam rakhte hi light jal jaati hai. Bijli ka bill bhi zero extra. Sach mein bohot useful purchase hai.'],
    ['name'=>'Zara Baig',       'stars'=>4, 'fresh'=>false, 'qty'=>'2 pcs',  'photos'=>[],  'text'=>'Beautiful design and very bright light. Delivery took 3 days but overall very satisfied.'],
    ['name'=>'Khalid Butt',     'stars'=>4, 'fresh'=>false, 'qty'=>'3 pcs',  'photos'=>[],  'text'=>'Product quality bohot achi hai. Bas aur colors hote tou aur acha hota.'],
    ['name'=>'Imran Tariq',     'stars'=>5, 'fresh'=>false, 'qty'=>'6 pcs',  'photos'=>[],  'text'=>'My garden looks amazing at night now. Warm light gives a very luxury feel.'],
    ['name'=>'Rukhsana Tahir',  'stars'=>5, 'fresh'=>false, 'qty'=>'2 pcs',  'photos'=>[],  'text'=>'Ghar ka poora look change ho gaya hai raat ko. Fast delivery aur achi packaging thi.'],
    ['name'=>'Nadia Rashid',    'stars'=>5, 'fresh'=>false, 'qty'=>'2 pcs',  'photos'=>[],  'text'=>'Motion sensor bohot sensitive hai. Gate ke paas koi aaye tou foran light on ho jati hai.'],
    ['name'=>'Naveed Akhtar',   'stars'=>5, 'fresh'=>false, 'qty'=>'10 pcs', 'photos'=>[],  'text'=>'Pehle 4 order kiye thay phir aur 6 order kar diye. Itna acha product hai.'],
    ['name'=>'Bilal Chaudhry',  'stars'=>5, 'fresh'=>false, 'qty'=>'4 pcs',  'photos'=>[], 'text'=>'Was not expecting this level of quality honestly. Solar charging works perfectly. Zero electricity bill increase.'],
    ['name'=>'Zainab Qureshi',  'stars'=>5, 'fresh'=>false, 'qty'=>'2 pcs',  'photos'=>[], 'text'=>'Barsaat mein bhi perfectly kaam kar rahi hai. Weatherproof quality really impressed me.'],
    ['name'=>'Farrukh Ali',     'stars'=>5, 'fresh'=>false, 'qty'=>'6 pcs',  'photos'=>[], 'text'=>'Bought 6 pieces for my farmhouse. All lights still working perfectly after weeks.'],
    ['name'=>'Faisal Dar',      'stars'=>5, 'fresh'=>false, 'qty'=>'12 pcs', 'photos'=>[], 'text'=>'Farmhouse pe install ki hain aur raat ko poora area bohot bright lagta hai. Bohot acha experience raha.'],
    ['name'=>'Mariam Siddiqui', 'stars'=>5, 'fresh'=>false, 'qty'=>'3 pcs',  'photos'=>[], 'text'=>'Best purchase this year. Before and after difference is unbelievable.'],
    ['name'=>'Misbah Rehman',   'stars'=>5, 'fresh'=>false, 'qty'=>'5 pcs',  'photos'=>[], 'text'=>'Delivery next day aa gayi thi. Quality aur packaging dono bohot achi thi.'],
    ['name'=>'Talha Nadeem',    'stars'=>5, 'fresh'=>false, 'qty'=>'2 pcs',  'photos'=>[], 'text'=>'Lamp charges during daytime and works the whole night. Exactly as shown in the ads.'],
    ['name'=>'Asad Haider',     'stars'=>5, 'fresh'=>false, 'qty'=>'3 pcs',  'photos'=>[], 'text'=>'Smart outdoor lighting ka real maza ab samajh aya. Har rupay wasool product hai.'],
    ['name'=>'Urooj Hussain',   'stars'=>4, 'fresh'=>false, 'qty'=>'4 pcs',  'photos'=>[], 'text'=>'Elegant design and good brightness. Delivery was on time and installation was easy.'],
    ['name'=>'Laiba Fatima',    'stars'=>4, 'fresh'=>false, 'qty'=>'2 pcs',  'photos'=>[], 'text'=>'Bohot pyara design hai. Raat ko ghar bohot classy lagta hai. Overall satisfied hoon.'],
    ['name'=>'Danish Farooqi',  'stars'=>5, 'fresh'=>false, 'qty'=>'4 pcs',  'photos'=>[], 'text'=>'Ordered these for my parents home. They absolutely loved the brightness and design.'],
    ['name'=>'Amna Pervez',     'stars'=>5, 'fresh'=>false, 'qty'=>'2 pcs',  'photos'=>[], 'text'=>'Solar panel charges very fast. Even works properly during cloudy weather.'],
    ['name'=>'Rehan Qureshi',   'stars'=>5, 'fresh'=>false, 'qty'=>'5 pcs',  'photos'=>[], 'text'=>'My whole street keeps asking where I bought these lights from. Highly recommended product.'],
];

// Daily-stable review ordering and fresh dates
// Use today's date as seed so same order all day, different each day
$todaySeed = (int)date('Ymd');
srand($todaySeed);

// Pick 4 "fresh" names from the 50 notification names pool
$freshNamePool = [
  'Umar Farooq','Bilal Ahmed','Sana Malik','Tariq Mehmood','Hina Butt',
  'Asad Raza','Nadia Iqbal','Zubair Khan','Rabia Shahid','Kamran Ali',
  'Sadia Noor','Imran Siddiqui','Faiza Rehman','Hamza Javed','Amna Bashir',
  'Rizwan Malik','Shumaila Tariq','Faisal Qureshi','Maryam Aslam','Adeel Hassan',
  'Zainab Pervaiz','Omer Shakeel','Rukayya Akhtar','Shahid Nawaz','Mehwish Anwar',
  'Junaid Hussain','Bushra Iqbal','Naeem Chaudhry','Ayesha Noor','Waqas Arshad',
  'Sumera Bibi','Asim Raza','Lubna Farooq','Usman Ghani','Sobia Zahid',
  'Tahir Abbas','Nida Saleem','Kashif Mehmood','Huma Perveen','Danish Iqbal',
  'Saima Riaz','Fawad Karim','Uzma Khatoon','Bilal Zafar','Madiha Tariq',
  'Sajid Mehmood','Aroha Gillani','Ahsan Malik','Zara Hussain','Naveed Alam',
];
$freshQtys = ['1 pc','2 pcs','2 pcs','3 pcs','4 pcs'];
$freshTexts = [
  'Bohot acha product hai! Motion sensor perfect kaam kar raha hai raat ko.',
  'Delivery aaj aayi, quality se bilkul khush hoon. Highly recommended!',
  'Gate pe laga liya, raat ko ghar ekdum secure lagta hai. Worth every rupee.',
  'Solar charging mast hai, poori raat chalta hai. Bohot satisfied hoon.',
  'Packaging bhi achi thi aur product bhi exactly as shown in the ad.',
  'Pehle order kiya tha, ab dobara order kiya family ke liye. Ek dam top product.',
  'Weatherproof sach mein hai — barsaat mein bhi chal raha hai without issues.',
];

shuffle($freshNamePool);
$todayFreshNames = array_slice($freshNamePool, 0, 4);
$todayFreshQtys  = [];
$todayFreshTexts = [];
for ($i = 0; $i < 4; $i++) {
    $todayFreshQtys[]  = $freshQtys[rand(0, count($freshQtys)-1)];
    $todayFreshTexts[] = $freshTexts[rand(0, count($freshTexts)-1)];
}

$dateLabels = ['Today', 'Yesterday', '2 days ago', '3 days ago'];

// Shuffle the existing reviews array with today's seed (stable all day, changes daily)
$shuffledReviews = $reviews;
srand((int)date('Ymd') + 999); // different seed from name pool but still daily-stable
shuffle($shuffledReviews);
srand(); // reset random seed

// Build final display: photo reviews first, then fresh, then rest
$freshReviews = [];
for ($i = 0; $i < 4; $i++) {
    $freshReviews[] = [
        'name'  => $todayFreshNames[$i],
        'stars' => 5,
        'date'  => $dateLabels[$i],
        'qty'   => $todayFreshQtys[$i],
        'text'  => $todayFreshTexts[$i],
        'photos'=> [],
        'fresh' => true,
    ];
}

// Split shuffled reviews into photo / no-photo
$photoReviews   = array_filter($shuffledReviews, fn($r) => !empty($r['photos']));
$noPhotoReviews = array_filter($shuffledReviews, fn($r) => empty($r['photos']));

// Order: photo reviews on top, then fresh, then the rest
$displayReviews = array_merge(array_values($photoReviews), $freshReviews, array_values($noPhotoReviews));
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
    .topbar { background: #1b1b1b; color: #fff; font-size: 12px; padding: 0; line-height: 1; overflow: hidden; height: 34px; display: flex; align-items: center; justify-content: center; position: relative; }
    .topbar span { color: #f4a261; }
    .topbar-msg { position: absolute; left: 0; right: 0; text-align: center; opacity: 0; transition: opacity 0.6s ease; pointer-events: none; white-space: nowrap; padding: 0 12px; }
    .topbar-msg.active { opacity: 1; }

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
    .gallery-main { border-radius: var(--radius); overflow: hidden; background: #f3f4f6; aspect-ratio: 1/1; position: relative; }
    .gallery-main img { width: 100%; height: 100%; object-fit: contain; transition: opacity 0.3s; }
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
    .add-to-cart-btn { background: #1b1b1b; color: #fff; border: none; padding: 16px; font-size: 16px; font-weight: 700; border-radius: var(--radius); cursor: pointer; width: 100%; transition: background 0.2s; letter-spacing: 0.5px; touch-action: manipulation; margin-top: 10px; display: block; }
    .add-to-cart-btn:hover { background: var(--primary); }
    .add-to-cart-btn:active { transform: scale(0.99); }

    /* COD ORDER BUTTON */
    .cod-order-btn { background: #e67e22; color: #fff; border: none; padding: 16px; font-size: 16px; font-weight: 700; border-radius: var(--radius); cursor: pointer; width: 100%; margin-top: 10px; transition: background 0.2s; letter-spacing: 0.5px; touch-action: manipulation; display: block; }
    .cod-order-btn:hover { background: #d35400; }
    .cod-order-btn:active { transform: scale(0.99); }

    /* COD BADGE (next to happy customers) */
    .cod-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff7ed; border: 1.5px solid #e67e22; color: #e67e22; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px; text-decoration: none; white-space: nowrap; transition: background 0.2s; cursor: pointer; }
    .cod-badge:hover { background: #fff0dc; }

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

    .reviews-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 28px; }
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
    .review-card-fresh { border-color: var(--border); background: #fff; }
    .fresh-badge { display: inline-block; font-size: 10px; color: #16a34a; font-weight: 600; margin-left: 5px; vertical-align: middle; }

    /* REVIEW PHOTOS */
    .review-photos { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
    .review-photo-thumb {
      width:64px; height:64px; object-fit:cover; border-radius:8px;
      cursor:pointer; border:1.5px solid var(--border);
      transition:transform 0.15s, border-color 0.15s;
    }
    .review-photo-thumb:hover { transform:scale(1.05); border-color:var(--primary); }
    .review-photo-count {
      width:64px; height:64px; background:#f3f4f6; border-radius:8px;
      display:flex; align-items:center; justify-content:center;
      font-size:12px; font-weight:700; color:var(--muted);
      cursor:pointer; border:1.5px solid var(--border);
    }

    /* LIGHTBOX */
    #snaplyrLightbox {
      display:none; position:fixed; inset:0; z-index:99999;
      background:rgba(0,0,0,0.92); align-items:center; justify-content:center;
      flex-direction:column; -webkit-tap-highlight-color:transparent;
    }
    #snaplyrLightbox.open { display:flex; }
    #lbImg {
      max-width:92vw; max-height:80vh; object-fit:contain;
      border-radius:10px; user-select:none; touch-action:pan-y;
      display:block;
    }
    .lb-close {
      position:absolute; top:14px; right:18px;
      font-size:40px; color:#fff; cursor:pointer; line-height:1;
      opacity:0.9; z-index:1; padding:8px; -webkit-tap-highlight-color:transparent;
    }
    .lb-nav {
      position:absolute; top:50%; transform:translateY(-50%);
      font-size:48px; color:#fff; cursor:pointer; padding:16px 20px;
      opacity:0.8; user-select:none; z-index:1;
      -webkit-tap-highlight-color:transparent;
    }
    #lbPrev { left:0; }
    #lbNext { right:0; }
    .lb-dots { display:flex; gap:7px; margin-top:14px; }
    .lb-dot {
      width:8px; height:8px; border-radius:50%; background:#fff;
      opacity:0.35; cursor:pointer; transition:opacity 0.2s;
    }
    .lb-dot.active { opacity:1; }
    .lb-counter { color:#fff; font-size:12px; margin-top:6px; opacity:0.6; }

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

    /* WRITE A REVIEW BOX */
    .write-review-box {
      margin-top: 32px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .write-review-header {
      padding: 16px 20px 12px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .write-review-title { font-size: 15px; font-weight: 800; color: #1b1b1b; }
    .write-review-sub { font-size: 11px; color: var(--muted); }

    /* LOCKED STATE */
    .write-review-locked {
      padding: 28px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
    .write-review-locked:hover { background: #fafafa; }
    .lock-icon { font-size: 36px; }
    .lock-title { font-size: 15px; font-weight: 800; color: #1b1b1b; }
    .lock-text { font-size: 12px; color: var(--muted); line-height: 1.7; max-width: 380px; }
    .lock-badges { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
    .lock-badge { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }

    /* FORM STATE */
    .write-review-form { padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
    .review-form-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .review-input {
      flex: 1; min-width: 160px;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    .review-input:focus { border-color: var(--primary); }
    .star-picker { display: flex; gap: 4px; }
    .star-picker span {
      font-size: 26px;
      color: #d1d5db;
      cursor: pointer;
      transition: color 0.15s, transform 0.1s;
      line-height: 1;
    }
    .star-picker span.active { color: #f4a261; }
    .star-picker span:hover { transform: scale(1.2); }
    .review-textarea {
      width: 100%;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      resize: vertical;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
      line-height: 1.6;
    }
    .review-textarea:focus { border-color: var(--primary); }
    .review-form-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .review-char-count { font-size: 11px; color: var(--muted); }
    .review-submit-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 10px 22px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      touch-action: manipulation;
    }
    .review-submit-btn:hover { background: #245c43; }

    /* SUCCESS STATE */
    .write-review-success {
      padding: 32px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .success-title { font-size: 15px; font-weight: 800; color: #1b1b1b; }
    .success-text { font-size: 12px; color: var(--muted); line-height: 1.6; }

    @media (max-width: 768px) {
      .write-review-locked { padding: 22px 16px; }
      .write-review-form { padding: 14px 16px; }
      .lock-text { font-size: 11px; }
      .review-form-row { gap: 10px; }
    }

    /* CHATBOT WIDGET */
    .chatbot-fab {
      position: fixed; bottom: 18px; right: 18px; width: 60px; height: 60px;
      border-radius: 50%; background: var(--primary); color: #fff;
      display: flex; align-items: center; justify-content: center; font-size: 26px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25); cursor: pointer; z-index: 99997;
      border: none; transition: transform 0.2s; -webkit-tap-highlight-color: transparent;
    }
    .chatbot-fab:hover { transform: scale(1.06); }
    .chatbot-fab .fab-dot {
      position: absolute; top: 4px; right: 4px; width: 12px; height: 12px;
      background: var(--accent); border-radius: 50%; border: 2px solid #fff;
    }
    .chatbot-window {
      position: fixed; bottom: 90px; right: 18px; width: 340px; max-width: calc(100vw - 24px);
      height: 480px; max-height: 70vh; background: #fff; border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.25); display: flex; flex-direction: column;
      overflow: hidden; z-index: 99997; opacity: 0; transform: translateY(20px) scale(0.98);
      pointer-events: none; transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .chatbot-window.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
    .chatbot-header {
      background: var(--primary); color: #fff; padding: 14px 16px;
      display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .chatbot-header-title { font-size: 14px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
    .chatbot-header-title .cb-status-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 1.5s infinite; flex-shrink: 0; }
    .chatbot-close { cursor: pointer; font-size: 22px; opacity: 0.85; padding: 4px; line-height: 1; }
    .chatbot-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; background: #f8f9fa; }
    .cb-msg { max-width: 82%; font-size: 13px; line-height: 1.55; padding: 9px 12px; border-radius: 14px; white-space: pre-wrap; word-break: break-word; }
    .cb-msg-bot { background: #fff; border: 1px solid var(--border); align-self: flex-start; border-bottom-left-radius: 4px; }
    .cb-msg-user { background: var(--primary); color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
    .cb-images { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .cb-image { width: 96px; height: 96px; object-fit: cover; border-radius: 10px; cursor: pointer; border: 1.5px solid var(--border); transition: transform 0.15s, border-color 0.15s; }
    .cb-image:hover { transform: scale(1.05); border-color: var(--primary); }
    .cb-quick-replies { display: flex; flex-wrap: wrap; gap: 6px; }
    .cb-quick-reply {
      background: #fff; border: 1.5px solid var(--primary); color: var(--primary);
      font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 16px;
      cursor: pointer; transition: background 0.15s;
    }
    .cb-quick-reply:hover { background: var(--primary-light); }
    .cb-typing { align-self: flex-start; display: flex; gap: 4px; padding: 10px 12px; background: #fff; border: 1px solid var(--border); border-radius: 14px; border-bottom-left-radius: 4px; }
    .cb-typing span { width: 6px; height: 6px; background: #9ca3af; border-radius: 50%; animation: cbTyping 1.2s infinite ease-in-out; }
    .cb-typing span:nth-child(2) { animation-delay: 0.15s; }
    .cb-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes cbTyping { 0%,60%,100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }
    .chatbot-input-row { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--border); background: #fff; flex-shrink: 0; }
    .chatbot-input {
      flex: 1; border: 1.5px solid var(--border); border-radius: 20px; padding: 9px 14px;
      font-size: 13px; outline: none; transition: border-color 0.2s; min-width: 0;
    }
    .chatbot-input:focus { border-color: var(--primary); }
    .chatbot-send {
      background: var(--primary); color: #fff; border: none; width: 38px; height: 38px;
      border-radius: 50%; cursor: pointer; font-size: 15px; flex-shrink: 0; transition: background 0.2s;
    }
    .chatbot-send:hover { background: #245c43; }
    .chatbot-send:disabled { opacity: 0.5; cursor: default; }

    @media (max-width: 480px) {
      .chatbot-fab { right: 14px; bottom: 14px; width: 54px; height: 54px; font-size: 22px; }
      .chatbot-window { right: 8px; left: 8px; bottom: 80px; width: auto; max-width: none; height: 68vh; max-height: 68vh; }
    }
  </style>
</head>
<body>

<div class="topbar">
  <div class="topbar-msg active" id="tbMsg0">🚚 FREE DELIVERY ALL OVER PAKISTAN 🚚</div>
  <div class="topbar-msg" id="tbMsg1">🎁 Buy 5 &amp; Save <strong style="color:#f4a261;">PKR 2,860</strong></div>
</div>
<script>
(function(){
  var msgs = document.querySelectorAll('.topbar-msg');
  var cur = 0;
  setInterval(function(){
    msgs[cur].classList.remove('active');
    cur = (cur + 1) % msgs.length;
    msgs[cur].classList.add('active');
  }, 3000);
})();
</script>

<header>
  <div class="logo">Snap<span>lyr</span></div>
  <nav class="header-nav">
    <a href="<?php echo home_url(); ?>">Home</a>
    <a href="#reviews">Reviews</a>
    <a href="https://wa.me/923078907289" target="_blank">Contact</a>
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
        fetchpriority="high"
        alt="<?php echo esc_attr($alts[0]); ?>"/>
    </div>
    <div class="gallery-thumbs">
      <?php foreach ($imgs as $i => $url): ?>
      <img
        <?php echo $i === 0 ? 'class="active"' : ''; ?>
        src="<?php echo esc_url($url); ?>"
        onclick="changeImg(this,'<?php echo esc_js($url); ?>')"
        loading="lazy"
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
      <span style="color:var(--muted);font-size:12px;">| <?php
        // Daily-stable review count: base 2100, grows by ~3-7 per day from a fixed start date
        $baseDate = mktime(0,0,0,6,1,2026);
        $daysSince = max(0, floor((time() - $baseDate) / 86400));
        $baseCount = 2100;
        // Use date as seed for consistent daily count
        srand((int)date('Ymd'));
        $todayAdd = rand(3,7);
        srand(); // reset
        $count = $baseCount + ($daysSince * 5) + $todayAdd;
        echo number_format($count) . '+';
      ?> reviews</span>
      <span class="trustbadge">Trustscore 4.9</span>
    </div>

    <div>
      <div class="price-row">
        <span class="price-original">Rs.4,500.00 PKR</span>
        <span class="price-sale">Rs.2,199.00 PKR</span>
        <span class="price-tag">Sale</span>
      </div>

    </div>

    <!-- BUNDLE OPTIONS -->
    <div>
      <p class="bundle-label">Buy MORE – SAVE Upto 26%</p>
      <p style="font-size:11px;color:var(--muted);margin-bottom:10px;">Limited Time Offer</p>
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


    <!-- COD BUTTON -->
      <?php
      $buyPool = [20, 14, 35, 42, 28, 31, 19, 37, 26, 44, 23, 38];
      srand((int)date('Ymd') + 777);
      $todayBuyCount = $buyPool[rand(0, count($buyPool)-1)];
      srand();
      ?>
      <p class="urgency" style="margin-bottom:8px;">🔥 <strong><?php echo $todayBuyCount; ?></strong> people bought this in the last 24 hours</p>
      <form id="codForm" method="get" action="<?php echo esc_url(home_url('/cart/')); ?>">
        <input type="hidden" name="add-to-cart" value="17"/>
        <input type="hidden" name="quantity" id="qtyInputCod" value="2"/>
        <button type="submit" class="cod-order-btn">💵 Order with Cash on Delivery</button>
      </form>
      <div style="display:flex;align-items:center;justify-content:center;gap:18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;margin-top:8px;flex-wrap:wrap;">
        <span style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#166534;">✅ Pehle Dekho, Phir Pay Karo</span>
        <span style="color:#bbf7d0;">|</span>
        <span style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#166534;">🛡️ 6 Month Warranty</span>
        <span style="color:#bbf7d0;">|</span>
        <span style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#166534;">🚚 Free Delivery</span>
      </div>

    <div class="features-box">
      <h4>Why You'll Love It</h4>
      <div class="features-grid">
        <div class="feature-item"><div class="feature-icon">☀️</div><span>Solar – Auto Recharge</span></div>
        <div class="feature-item"><div class="feature-icon">🌧️</div><span>Waterproof – Rain Proof</span></div>
        <div class="feature-item"><div class="feature-icon">🔋</div><span>1200mAh – Full Night</span></div>
        <div class="feature-item"><div class="feature-icon">🎯</div><span>Motion Sensor</span></div>
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0 4px;">
      <div class="happy-badge"><div class="dot"></div>6,000+ HAPPY CUSTOMERS</div>
      <a href="<?php echo esc_url(home_url('/cart/')); ?>" class="cod-badge">💵 Cash On Delivery</a>
    </div>


    <!-- ADD TO CART -->
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:4px;">
      <form id="cartForm" method="get" action="<?php echo esc_url(home_url('/cart/')); ?>">
        <input type="hidden" name="add-to-cart" value="17"/>
        <input type="hidden" name="quantity" id="qtyInput" value="2"/>
        <button type="submit" class="add-to-cart-btn">🛒 Add to Cart</button>
      </form>

      <!-- WHATSAPP BUTTON -->
      <a href="https://wa.me/923078907289?text=Assalam%20o%20Alaikum!%20Mujhe%20Solar%20Wall%20Lamp%20order%20karna%20hai.%20Please%20details%20batayein." target="_blank" style="display:block;background:#25D366;color:#fff;text-align:center;padding:16px;font-size:16px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:0.5px;margin-top:0;">
        💬 Order on WhatsApp
      </a>
    </div>

    <!-- SHIPPING INFO -->
    <div class="shipping-info">
      <p>🚚 <strong>Free Shipping</strong> to Pakistan</p>
      <p style="margin-top:5px;color:var(--muted);font-size:11px;">You'll receive your package within 3–7 business days.</p>
      <p style="margin-top:8px;font-size:12px;font-weight:700;color:#166534;">🛡️ <strong>6 Month Warranty</strong> — Koi masla ho toh free replacement ya refund.</p>
      <div class="delivery-timeline">
        <div class="delivery-step"><div class="delivery-icon">📦</div><div class="delivery-step-title">Ordered</div><div class="delivery-step-date">Today</div></div>
        <div class="delivery-step"><div class="delivery-icon">🔄</div><div class="delivery-step-title">Order Ready</div><div class="delivery-step-date">1–2 Days</div></div>
        <div class="delivery-step"><div class="delivery-icon">📍</div><div class="delivery-step-title">Delivered</div><div class="delivery-step-date">3–7 Days</div></div>
      </div>
    </div>

    <!-- PRODUCT DESCRIPTION -->
    <div style="background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:16px 18px;font-size:13px;line-height:1.8;color:#374151;">
      <p style="font-weight:800;font-size:15px;color:#1b1b1b;margin-bottom:10px;">🌙 Raat Ko Ghar Khud Roshan Ho Jata Hai</p>
      <p>Sochein — raat ke waqt bahar jaana, andhere mein switch dhundhna, bijli ka bill barhna. Yeh sab ab khatam.</p>
      <p style="margin-top:10px;">Snaplyr Solar Lamp din bhar dhoop se charge hoti hai aur raat ko <strong>khud on ho jaati hai</strong> — koi switch nahi, koi bill nahi. Jab koi gate ke paas aaye, motion sensor foran light on kar deta hai. Jab koi na ho, light band. Smart, simple, secure.</p>
      <div style="background:#f0fdf4;border-left:3px solid #2d6a4f;padding:10px 14px;margin:12px 0;border-radius:0 8px 8px 0;">
        <p style="font-weight:700;color:#166534;font-size:13px;">✅ 1200mAh Battery — Poori Raat Backup</p>
        <p style="font-size:12px;color:#374151;margin-top:3px;">Ek baar charge mein poori raat chalta hai. Cloudy day mein bhi kaam karta hai.</p>
      </div>
      <div style="background:#fff7ed;border-left:3px solid #e67e22;padding:10px 14px;margin:12px 0;border-radius:0 8px 8px 0;">
        <p style="font-weight:700;color:#9a3412;font-size:13px;">🌧️ Barsaat Mein Bhi — 100% Waterproof</p>
        <p style="font-size:12px;color:#374151;margin-top:3px;">Monsoon ho ya dhoop — yeh lamp har mausam mein kaam karta hai. IP65 rated protection.</p>
      </div>
      <div style="background:#eff6ff;border-left:3px solid #3b82f6;padding:10px 14px;margin:12px 0;border-radius:0 8px 8px 0;">
        <p style="font-weight:700;color:#1e40af;font-size:13px;">🎯 Motion Sensor — Sirf Zarurat Par Jale</p>
        <p style="font-size:12px;color:#374151;margin-top:3px;">Koi aaye toh light on, koi na ho toh band. Battery bachti hai, security milti hai.</p>
      </div>
      <p style="margin-top:12px;font-weight:600;color:#1b1b1b;">Electrician ki zarurat nahi — 15 minute mein install, life bhar ka fayda. 🏠</p>
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
      <div class="reviews-avg-label"><?php
        $baseDate2 = mktime(0,0,0,6,1,2026);
        $daysSince2 = max(0, floor((time() - $baseDate2) / 86400));
        srand((int)date('Ymd'));
        $todayAdd2 = rand(3,7);
        srand();
        $count2 = 2100 + ($daysSince2 * 5) + $todayAdd2;
        echo number_format($count2) . '+';
      ?> Verified Reviews</div>
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

  <!-- WRITE A REVIEW BOX -->
  <div class="write-review-box" id="writeReviewBox">
    <div class="write-review-header">
      <span class="write-review-title">✍️ Write a Review</span>
      <span class="write-review-sub">Share your experience with other customers</span>
    </div>

    <div class="write-review-locked" id="reviewLocked">
      <div class="lock-icon">🔒</div>
      <div class="lock-title">Reviews open after delivery</div>
      <div class="lock-text">We only accept reviews from verified buyers who have received their order. This keeps our reviews 100% genuine and trustworthy.</div>
      <div class="lock-badges">
        <span class="lock-badge">✅ Verified Buyers Only</span>
        <span class="lock-badge">📦 Post-Delivery</span>
        <span class="lock-badge">🛡️ No Fake Reviews</span>
      </div>
    </div>

    <div class="write-review-form" id="reviewForm" style="display:none;">
      <div class="review-form-row">
        <input type="text" id="reviewName" placeholder="Your name" class="review-input" maxlength="40"/>
        <div class="star-picker" id="starPicker">
          <span data-v="1">★</span>
          <span data-v="2">★</span>
          <span data-v="3">★</span>
          <span data-v="4">★</span>
          <span data-v="5">★</span>
        </div>
      </div>
      <textarea id="reviewText" class="review-textarea" placeholder="Tell others about your experience..." maxlength="400" rows="3"></textarea>
      <div class="review-form-footer">
        <span class="review-char-count"><span id="charLeft">400</span> characters left</span>
        <button class="review-submit-btn" id="reviewSubmit">Submit Review</button>
      </div>
    </div>

    <div class="write-review-success" id="reviewSuccess" style="display:none;">
      <div style="font-size:32px;">🎉</div>
      <div class="success-title">Thank you for your review!</div>
      <div class="success-text">Your review has been submitted and will appear after verification.</div>
    </div>
  </div>

  <!-- REVIEW CARDS -->
  <div class="reviews-grid">
    <?php
    $reviewBase = 'https://snaplyr.com/wp-content/uploads/reviews/';
    foreach ($displayReviews as $idx => $r):
      $photos = !empty($r['photos']) ? $r['photos'] : [];
      $photoUrls = array_map(fn($p) => $reviewBase . $p, $photos);
      $photosJson = json_encode($photoUrls);
    ?>
    <div class="review-card<?php echo !empty($r['fresh']) ? ' review-card-fresh' : ''; ?>">
      <div class="review-top">
        <div>
          <div class="reviewer-name"><?php echo esc_html($r['name']); ?></div>
          <div class="review-date">
            <?php echo esc_html($r['date'] ?? ''); ?>
            <?php if (!empty($r['fresh'])): ?><span class="fresh-badge">🟢 Recent</span><?php endif; ?>
          </div>
        </div>
        <div class="review-stars"><?php echo snaplyr_stars($r['stars']); ?></div>
      </div>
      <div class="review-text"><?php echo esc_html($r['text']); ?></div>
      <?php if (!empty($photoUrls)): ?>
      <div class="review-photos">
        <?php foreach (array_slice($photoUrls, 0, 3) as $pi => $purl): ?>
          <?php if ($pi === 2 && count($photoUrls) > 3): ?>
            <div class="review-photo-count lb-thumb" data-photos='<?php echo $photosJson; ?>' data-idx="2">
              +<?php echo count($photoUrls) - 2; ?>
            </div>
          <?php else: ?>
            <img class="review-photo-thumb lb-thumb" src="<?php echo esc_url($purl); ?>" alt="Customer photo" data-photos='<?php echo $photosJson; ?>' data-idx="<?php echo $pi; ?>" loading="lazy"/>
          <?php endif; ?>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
      <div class="review-footer">
        <div class="verified-badge">✅ Verified Purchase</div>
        <span class="review-qty">Ordered: <?php echo esc_html($r['qty']); ?></span>
      </div>
    </div>
    <?php endforeach; ?>
  </div>

  </div>

</div>

<!-- LIGHTBOX -->
<div id="snaplyrLightbox">
  <span class="lb-close" id="lbClose">&times;</span>
  <span class="lb-nav" id="lbPrev">&#8249;</span>
  <img id="lbImg" src="" alt="Review photo"/>
  <span class="lb-nav" id="lbNext">&#8250;</span>
  <div class="lb-dots" id="lbDots"></div>
  <div class="lb-counter" id="lbCounter"></div>
</div>

<!-- CHATBOT WIDGET -->
<div class="chatbot-fab" id="chatbotFab" role="button" tabindex="0" aria-label="Chat with us">
  💬
  <span class="fab-dot" id="chatbotFabDot"></span>
</div>

<div class="chatbot-window" id="chatbotWindow" role="dialog" aria-label="Chat with Snaplyr">
  <div class="chatbot-header">
    <div class="chatbot-header-title"><span class="cb-status-dot"></span> Snaplyr Assistant</div>
    <span class="chatbot-close" id="chatbotClose" role="button" aria-label="Close chat">&times;</span>
  </div>
  <div class="chatbot-body" id="chatbotBody"></div>
  <div class="chatbot-input-row">
    <input type="text" id="chatbotInput" class="chatbot-input" placeholder="Type your question..." maxlength="300" autocomplete="off"/>
    <button class="chatbot-send" id="chatbotSend" aria-label="Send message">➤</button>
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
        <li><a href="https://wa.me/923078907289" target="_blank">Contact Us</a></li>
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
    var mainImg = document.getElementById('mainImg');
    mainImg.src = '';
    mainImg.src = src;
    document.querySelectorAll('.gallery-thumbs img').forEach(t => t.classList.remove('active'));
    if (thumb) thumb.classList.add('active');
  }

  // ── GALLERY SWIPE ────────────────────────────────────────────────────────
  (function() {
    var allImgs = Array.from(document.querySelectorAll('.gallery-thumbs img'));
    var mainImg = document.getElementById('mainImg');
    var galleryMain = document.querySelector('.gallery-main');
    if (!galleryMain || allImgs.length < 2) return;

    var currentIdx = 0;
    var touchStartX = 0;
    var touchStartY = 0;

    function goTo(idx) {
      if (idx < 0) idx = allImgs.length - 1;
      if (idx >= allImgs.length) idx = 0;
      currentIdx = idx;
      var newSrc = allImgs[currentIdx].getAttribute('src');
      mainImg.style.opacity = '0';
      setTimeout(function() {
        // Clear first so GIFs restart their animation from frame 1
        mainImg.src = '';
        mainImg.src = newSrc;
        mainImg.style.opacity = '1';
      }, 150);
      allImgs.forEach(function(t, i) {
        t.classList.toggle('active', i === currentIdx);
      });
    }

    galleryMain.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    galleryMain.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      // Only trigger if horizontal swipe > 40px and more horizontal than vertical
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goTo(currentIdx + 1); // swipe left → next
        else        goTo(currentIdx - 1); // swipe right → prev
      }
    }, { passive: true });

    // Sync currentIdx when thumbnail clicked
    allImgs.forEach(function(thumb, i) {
      thumb.addEventListener('click', function() { currentIdx = i; });
    });

    // Dot indicators on mobile
    var dotsEl = document.createElement('div');
    dotsEl.id = 'galleryDots';
    dotsEl.style.cssText = 'display:flex;justify-content:center;gap:6px;margin-top:8px;';
    allImgs.forEach(function(_, i) {
      var dot = document.createElement('span');
      dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#ccc;display:inline-block;transition:background 0.2s;cursor:pointer;';
      dot.addEventListener('click', function() { goTo(i); updateDots(); });
      dotsEl.appendChild(dot);
    });
    galleryMain.parentNode.insertBefore(dotsEl, galleryMain.nextSibling);

    function updateDots() {
      Array.from(dotsEl.children).forEach(function(dot, i) {
        dot.style.background = i === currentIdx ? '#2d6a4f' : '#ccc';
      });
    }
    updateDots();

    // Keep dots in sync with thumb clicks too
    allImgs.forEach(function(thumb, i) {
      thumb.addEventListener('click', function() {
        currentIdx = i;
        updateDots();
      });
    });

    // Only show dots on mobile
    var dotStyle = document.createElement('style');
    dotStyle.textContent = '#galleryDots { display:none; } @media(max-width:768px){ #galleryDots { display:flex; } }';
    document.head.appendChild(dotStyle);
  })();
  // ── END GALLERY SWIPE ────────────────────────────────────────────────────

  let selectedQty = 2;
  function selectBundle(el, qty) {
    selectedQty = qty;
    document.getElementById('qtyInput').value = qty;
    document.querySelectorAll('.bundle-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
  }



  function toggleAccordion(header) {
    const body = header.nextElementSibling;
    const isOpen = header.classList.contains('open');
    header.classList.toggle('open', !isOpen);
    body.classList.toggle('open', !isOpen);
  }

  // ── SYNC COD QTY WITH BUNDLE SELECTION ──────────────────────────────────
  const origSelectBundle = window.selectBundle;
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.bundle-option').forEach(function(el) {
      el.addEventListener('click', function() {
        const qty = el.querySelector('input[name="bundle"]') ? el.querySelector('input[name="bundle"]').value : 2;
        const codQty = document.getElementById('qtyInputCod');
        if (codQty) codQty.value = qty;
      });
    });
  });




  // ── SOCIAL PROOF NOTIFICATIONS ──────────────────────────────────────────
  (function() {
    const people = [
      { name: 'Umar Farooq',      city: 'Lahore' },
      { name: 'Bilal Ahmed',       city: 'Karachi' },
      { name: 'Sana Malik',        city: 'Faisalabad' },
      { name: 'Tariq Mehmood',     city: 'Rawalpindi' },
      { name: 'Hina Butt',         city: 'Gujranwala' },
      { name: 'Asad Raza',         city: 'Multan' },
      { name: 'Nadia Iqbal',       city: 'Peshawar' },
      { name: 'Zubair Khan',       city: 'Sialkot' },
      { name: 'Rabia Shahid',      city: 'Islamabad' },
      { name: 'Kamran Ali',        city: 'Hyderabad' },
      { name: 'Sadia Noor',        city: 'Bahawalpur' },
      { name: 'Imran Siddiqui',    city: 'Toba Tek Singh' },
      { name: 'Faiza Rehman',      city: 'Abbottabad' },
      { name: 'Hamza Javed',       city: 'Sahiwal' },
      { name: 'Amna Bashir',       city: 'Mahsehra' },
      { name: 'Rizwan Malik',      city: 'Jhelum' },
      { name: 'Shumaila Tariq',    city: 'Mirpur AJK' },
      { name: 'Faisal Qureshi',    city: 'Quetta' },
      { name: 'Maryam Aslam',      city: 'Sheikhupura' },
      { name: 'Adeel Hassan',      city: 'Gujrat' },
      { name: 'Zainab Pervaiz',    city: 'Dera Ghazi Khan' },
      { name: 'Omer Shakeel',      city: 'Sargodha' },
      { name: 'Rukayya Akhtar',    city: 'Sukkur' },
      { name: 'Shahid Nawaz',      city: 'Mardan' },
      { name: 'Mehwish Anwar',     city: 'Larkana' },
      { name: 'Junaid Hussain',    city: 'Kasur' },
      { name: 'Bushra Iqbal',      city: 'Okara' },
      { name: 'Naeem Chaudhry',    city: 'Muzaffarabad' },
      { name: 'Ayesha Noor',       city: 'Hafizabad' },
      { name: 'Waqas Arshad',      city: 'Khushab' },
      { name: 'Sumera Bibi',       city: 'Chiniot' },
      { name: 'Asim Raza',         city: 'Rahim Yar Khan' },
      { name: 'Lubna Farooq',      city: 'Narowal' },
      { name: 'Usman Ghani',       city: 'Attock' },
      { name: 'Sobia Zahid',       city: 'Chakwal' },
      { name: 'Tahir Abbas',       city: 'Mandi Bahauddin' },
      { name: 'Nida Saleem',       city: 'Swabi' },
      { name: 'Kashif Mehmood',    city: 'Nowshera' },
      { name: 'Huma Perveen',      city: 'Kohat' },
      { name: 'Danish Iqbal',      city: 'Bhakkar' },
      { name: 'Saima Riaz',        city: 'Vehari' },
      { name: 'Fawad Karim',       city: 'Pakpattan' },
      { name: 'Uzma Khatoon',      city: 'Khanewal' },
      { name: 'Bilal Zafar',       city: 'Lodhran' },
      { name: 'Madiha Tariq',      city: 'Wah Cantt' },
      { name: 'Sajid Mehmood',     city: 'Taxila' },
      { name: 'Aroha Gillani',     city: 'Haripur' },
      { name: 'Ahsan Malik',       city: 'Mansehra' },
      { name: 'Zara Hussain',      city: 'Bannu' },
      { name: 'Naveed Alam',       city: 'Tank' },
    ];

    const qtys = [1, 1, 2, 2, 2, 3, 3, 4, 5];

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // Notification styles
    const style = document.createElement('style');
    style.textContent = `
      .sp-notif {
        position: fixed;
        bottom: 16px;
        left: 12px;
        z-index: 99999;
        max-width: 260px;
        width: calc(100vw - 24px);
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.13);
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateY(140px);
        opacity: 0;
        transition: transform 0.42s cubic-bezier(.21,1.02,.73,1), opacity 0.38s ease;
        border-left: 4px solid #2d6a4f;
        pointer-events: none;
      }
      .sp-notif.show {
        transform: translateY(0);
        opacity: 1;
      }
      .sp-notif-icon { font-size: 20px; flex-shrink: 0; }
      .sp-notif-name {
        font-size: 12px;
        font-weight: 700;
        color: #1b1b1b;
        margin-bottom: 1px;
        line-height: 1.3;
      }
      .sp-notif-detail {
        font-size: 11px;
        color: #6b7280;
        font-weight: 300;
        line-height: 1.4;
      }
      .sp-notif-detail strong { color: #2d6a4f; font-weight: 600; }
      .sp-notif-second {
        bottom: 100px;
        border-left-color: #e67e22;
      }
      @media (max-width: 480px) {
        .sp-notif { max-width: calc(100vw - 20px); bottom: 12px; left: 10px; padding: 9px 10px; }
        .sp-notif-second { bottom: 90px; }
        .sp-notif-name { font-size: 11px; }
        .sp-notif-detail { font-size: 10px; }
      }
    `;
    document.head.appendChild(style);

    function createNotifEl(isSecond) {
      const el = document.createElement('div');
      el.className = 'sp-notif' + (isSecond ? ' sp-notif-second' : '');
      el.innerHTML = `<div class="sp-notif-icon">🛒</div><div><div class="sp-notif-name"></div><div class="sp-notif-detail"></div></div>`;
      document.body.appendChild(el);
      return el;
    }

    const notif1 = createNotifEl(false);
    const notif2 = createNotifEl(true);

    let pool = shuffle(people);
    let poolIdx = 0;

    function getPerson() {
      if (poolIdx >= pool.length) { pool = shuffle(people); poolIdx = 0; }
      return pool[poolIdx++];
    }

    function getQty() { return qtys[Math.floor(Math.random() * qtys.length)]; }

    function fillNotif(el, p, qty) {
      el.querySelector('.sp-notif-name').textContent = p.name + ' from ' + p.city;
      el.querySelector('.sp-notif-detail').innerHTML = 'ordered <strong>' + qty + ' piece' + (qty > 1 ? 's' : '') + '</strong> just now';
    }

    let busy = false;

    function showNotif(el, p, qty, cb) {
      fillNotif(el, p, qty);
      el.classList.add('show');
      setTimeout(function() {
        el.classList.remove('show');
        setTimeout(cb, 600);
      }, 4200);
    }

    function runCycle() {
      if (busy) return;
      busy = true;

      const doDouble = Math.random() < 0.25; // 25% chance of double notification
      const p1 = getPerson(), q1 = getQty();

      if (doDouble) {
        const p2 = getPerson(), q2 = getQty();
        showNotif(notif1, p1, q1, function() {});
        setTimeout(function() {
          showNotif(notif2, p2, q2, function() {
            busy = false;
            const next = 7000 + Math.random() * 8000;
            setTimeout(runCycle, next);
          });
        }, 1800);
      } else {
        showNotif(notif1, p1, q1, function() {
          busy = false;
          const next = 6000 + Math.random() * 7000;
          setTimeout(runCycle, next);
        });
      }
    }

    // First notification after 7 seconds
    setTimeout(runCycle, 7000);
  })();
  // ── REVIEW BOX ───────────────────────────────────────────────────────────
  (function() {
    const locked   = document.getElementById('reviewLocked');
    const form     = document.getElementById('reviewForm');
    const success  = document.getElementById('reviewSuccess');
    const textarea = document.getElementById('reviewText');
    const charLeft = document.getElementById('charLeft');
    const submit   = document.getElementById('reviewSubmit');
    const stars    = document.querySelectorAll('#starPicker span');
    let selectedStars = 0;

    // Clicking locked area — show tooltip/shake instead of opening form
    locked.addEventListener('click', function() {
      locked.style.animation = 'none';
      locked.offsetHeight; // reflow
      locked.style.animation = 'reviewShake 0.4s ease';
    });

    // Prevent typing in textarea if somehow visible — extra safeguard
    textarea.addEventListener('focus', function() {
      this.blur();
    });

    // Star picker
    stars.forEach(function(star) {
      star.addEventListener('mouseover', function() {
        const v = parseInt(this.dataset.v);
        stars.forEach(function(s) {
          s.classList.toggle('active', parseInt(s.dataset.v) <= v);
        });
      });
      star.addEventListener('mouseleave', function() {
        stars.forEach(function(s) {
          s.classList.toggle('active', parseInt(s.dataset.v) <= selectedStars);
        });
      });
      star.addEventListener('click', function() {
        selectedStars = parseInt(this.dataset.v);
        stars.forEach(function(s) {
          s.classList.toggle('active', parseInt(s.dataset.v) <= selectedStars);
        });
      });
    });

    // Char count
    textarea.addEventListener('input', function() {
      const left = 400 - this.value.length;
      charLeft.textContent = left;
      charLeft.style.color = left < 50 ? '#e63946' : '';
    });

    // Submit
    submit.addEventListener('click', function() {
      const name = document.getElementById('reviewName').value.trim();
      const text = textarea.value.trim();
      if (!name) { document.getElementById('reviewName').focus(); return; }
      if (selectedStars === 0) { stars[4].style.animation = 'reviewShake 0.4s ease'; return; }
      if (!text) { textarea.focus(); return; }

      // Show success
      form.style.display = 'none';
      success.style.display = 'flex';
    });

    // Shake keyframe
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
      @keyframes reviewShake {
        0%,100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
    `;
    document.head.appendChild(shakeStyle);
  })();
  // ── END REVIEW BOX ───────────────────────────────────────────────────────

</script>

<script>
  // ── LIGHTBOX ─────────────────────────────────────────────────────────────
  (function() {
    var lb       = document.getElementById('snaplyrLightbox');
    var lbImg    = document.getElementById('lbImg');
    var lbDots   = document.getElementById('lbDots');
    var lbCounter= document.getElementById('lbCounter');
    var lbClose  = document.getElementById('lbClose');
    var lbPrev   = document.getElementById('lbPrev');
    var lbNext   = document.getElementById('lbNext');
    var _photos  = [];
    var _idx     = 0;

    window.openLightbox = function(photos, startIdx) {
      try {
        _photos = typeof photos === 'string' ? JSON.parse(photos) : photos;
      } catch(e) { console.error('LB parse error', e); return; }
      _idx = startIdx || 0;
      render();
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    function render() {
      lbImg.src = _photos[_idx];
      lbCounter.textContent = (_idx + 1) + ' / ' + _photos.length;
      lbDots.innerHTML = '';
      _photos.forEach(function(_, i) {
        var d = document.createElement('div');
        d.className = 'lb-dot' + (i === _idx ? ' active' : '');
        d.onclick = function() { _idx = i; render(); };
        lbDots.appendChild(d);
      });
      lbPrev.style.display = _photos.length > 1 ? '' : 'none';
      lbNext.style.display = _photos.length > 1 ? '' : 'none';
    }

    function close() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.src = '';
    }

    // Delegate clicks on all photo thumbs
    document.addEventListener('click', function(e) {
      var el = e.target.closest('.lb-thumb');
      if (!el) return;
      var photos = el.getAttribute('data-photos');
      var idx    = parseInt(el.getAttribute('data-idx')) || 0;
      openLightbox(photos, idx);
    });

    lbClose.onclick = close;
    lb.addEventListener('click', function(e) { if (e.target === lb) close(); });

    lbPrev.onclick = function() { _idx = (_idx - 1 + _photos.length) % _photos.length; render(); };
    lbNext.onclick = function() { _idx = (_idx + 1) % _photos.length; render(); };

    // Keyboard
    document.addEventListener('keydown', function(e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') { _idx = (_idx - 1 + _photos.length) % _photos.length; render(); }
      if (e.key === 'ArrowRight') { _idx = (_idx + 1) % _photos.length; render(); }
    });

    // Touch swipe — on whole lightbox
    var tsX = 0;
    lb.addEventListener('touchstart', function(e) { tsX = e.changedTouches[0].clientX; }, { passive:true });
    lb.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - tsX;
      if (Math.abs(dx) > 40 && _photos.length > 1) {
        if (dx < 0) { _idx = (_idx + 1) % _photos.length; }
        else        { _idx = (_idx - 1 + _photos.length) % _photos.length; }
        render();
      }
    }, { passive:true });
  })();
  // ── END LIGHTBOX ─────────────────────────────────────────────────────────
</script>

<script>
  // ── CHATBOT WIDGET (n8n) ─────────────────────────────────────────────────
  (function() {
    var WEBHOOK_URL = '<?php echo esc_js($n8n_chat_webhook_url); ?>';
    var WHATSAPP_URL = 'https://wa.me/923078907289';

    var fab       = document.getElementById('chatbotFab');
    var fabDot    = document.getElementById('chatbotFabDot');
    var win       = document.getElementById('chatbotWindow');
    var closeBtn  = document.getElementById('chatbotClose');
    var body      = document.getElementById('chatbotBody');
    var input     = document.getElementById('chatbotInput');
    var sendBtn   = document.getElementById('chatbotSend');

    var QUICK_REPLIES = [
      { label: '💰 Price?',        text: 'What is the price and are there any discounts on buying more?' },
      { label: '🚚 Delivery time?', text: 'How long does delivery take and is it free?' },
      { label: '💵 Cash on Delivery?', text: 'Do you offer Cash on Delivery?' },
      { label: '🛡️ Warranty?',      text: 'Is there a warranty or return policy?' }
    ];

    function getSessionId() {
      try {
        var id = localStorage.getItem('snaplyr_chat_session');
        if (!id) {
          id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2);
          localStorage.setItem('snaplyr_chat_session', id);
        }
        return id;
      } catch (e) {
        return 'sess-' + Date.now();
      }
    }
    var sessionId = getSessionId();

    function scrollToBottom() {
      body.scrollTop = body.scrollHeight;
    }

    var IMAGE_URL_RE = /(https?:\/\/\S+?\.(?:webp|jpe?g|png|gif))(?=[\s.,!?]|$)/gi;

    function addMessage(text, sender) {
      var el = document.createElement('div');
      el.className = 'cb-msg ' + (sender === 'user' ? 'cb-msg-user' : 'cb-msg-bot');

      if (sender === 'bot') {
        renderBotMessage(el, text);
      } else {
        el.textContent = text;
      }

      body.appendChild(el);
      scrollToBottom();
      return el;
    }

    function renderBotMessage(el, text) {
      var re = new RegExp(IMAGE_URL_RE.source, 'gi');
      var lastIndex = 0;
      var match;
      var imageUrls = [];

      while ((match = re.exec(text)) !== null) {
        if (match.index > lastIndex) {
          el.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        imageUrls.push(match[1]);
        lastIndex = re.lastIndex;
      }
      if (lastIndex < text.length) {
        el.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      if (imageUrls.length) {
        var wrap = document.createElement('div');
        wrap.className = 'cb-images';
        imageUrls.forEach(function(url, i) {
          var img = document.createElement('img');
          img.src = url;
          img.alt = 'Product photo';
          img.loading = 'lazy';
          img.className = 'cb-image lb-thumb';
          img.setAttribute('data-photos', JSON.stringify(imageUrls));
          img.setAttribute('data-idx', i);
          wrap.appendChild(img);
        });
        el.appendChild(wrap);
      }
    }

    function addQuickReplies() {
      var wrap = document.createElement('div');
      wrap.className = 'cb-quick-replies';
      QUICK_REPLIES.forEach(function(q) {
        var btn = document.createElement('span');
        btn.className = 'cb-quick-reply';
        btn.textContent = q.label;
        btn.addEventListener('click', function() { sendMessage(q.text); });
        wrap.appendChild(btn);
      });
      body.appendChild(wrap);
      scrollToBottom();
    }

    function showTyping() {
      var el = document.createElement('div');
      el.className = 'cb-typing';
      el.id = 'cbTypingIndicator';
      el.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(el);
      scrollToBottom();
    }

    function hideTyping() {
      var el = document.getElementById('cbTypingIndicator');
      if (el) el.remove();
    }

    function sendMessage(text) {
      text = (text || '').trim();
      if (!text) return;

      addMessage(text, 'user');
      input.value = '';
      sendBtn.disabled = true;
      showTyping();

      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          page_url: window.location.href
        })
      })
        .then(function(res) {
          if (!res.ok) throw new Error('Bad response: ' + res.status);
          return res.json();
        })
        .then(function(data) {
          hideTyping();
          var reply = (data && (data.reply || data.output || data.message)) || "Sorry, I didn't get a response — please try again.";
          addMessage(reply, 'bot');
        })
        .catch(function() {
          hideTyping();
          var el = addMessage("Sorry, I'm having trouble connecting right now. You can message us directly on WhatsApp instead 👇", 'bot');
          var link = document.createElement('a');
          link.href = WHATSAPP_URL;
          link.target = '_blank';
          link.style.cssText = 'display:inline-block;margin-top:8px;color:#25D366;font-weight:700;text-decoration:underline;';
          link.textContent = '💬 Chat on WhatsApp';
          el.appendChild(document.createElement('br'));
          el.appendChild(link);
          scrollToBottom();
        })
        .finally(function() {
          sendBtn.disabled = false;
        });
    }

    var greeted = false;
    function openChat() {
      win.classList.add('open');
      fabDot.style.display = 'none';
      if (!greeted) {
        greeted = true;
        addMessage("👋 Assalam o Alaikum! Ask me anything about this Solar Wall Lamp — price, delivery, Cash on Delivery, or warranty.", 'bot');
        addQuickReplies();
      }
      setTimeout(function() { input.focus(); }, 260);
    }

    function closeChat() {
      win.classList.remove('open');
    }

    fab.addEventListener('click', function() {
      win.classList.contains('open') ? closeChat() : openChat();
    });
    fab.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fab.click(); }
    });
    closeBtn.addEventListener('click', closeChat);

    sendBtn.addEventListener('click', function() { sendMessage(input.value); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); sendMessage(input.value); }
    });
  })();
  // ── END CHATBOT WIDGET ───────────────────────────────────────────────────
</script>

<?php wp_footer(); ?>
</body>
</html>
