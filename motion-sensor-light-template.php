<?php
/**
 * Template Name: Motion Sensor Light Product Page
 * Description: Product page template for the Motion Sensor Security Light.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();

$imgs = [
    'https://www.thebeamhouse.store/cdn/shop/files/e42ff886-fe8d-45be-b56e-9be116e6bce8.png?v=1754492881',
    'https://www.thebeamhouse.store/cdn/shop/files/WhatsApp_Image_2025-05-11_at_07.23.44_707595f7.jpg?v=1754492881',
    'https://www.thebeamhouse.store/cdn/shop/files/WhatsApp_Image_2025-05-11_at_07.23.45_7f3323f7.jpg?v=1754492881',
    'https://www.thebeamhouse.store/cdn/shop/files/4734f474-7f4e-4d31-8ed5-1e8409c1da4d.png?v=1754492881',
];

$product_slug = 'motion-sensor-light';
$product_name = 'Motion Sensor Security Light';

// Fetch published reviews for this product
$reviews = get_posts( [
    'post_type'      => 'snaplyr_review',
    'post_status'    => 'publish',
    'posts_per_page' => -1,
    'orderby'        => 'date',
    'order'          => 'DESC',
    'meta_query'     => [
        [
            'key'     => '_snaplyr_product',
            'value'   => $product_slug,
            'compare' => '=',
        ],
    ],
] );

// Calculate average rating
$total_stars  = 0;
$review_count = count( $reviews );
foreach ( $reviews as $r ) {
    $total_stars += (int) get_post_meta( $r->ID, '_snaplyr_stars', true );
}
$avg_stars = $review_count > 0 ? round( $total_stars / $review_count, 1 ) : 5.0;
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html( $product_name ); ?> – The Beam House</title>
    <?php wp_head(); ?>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f8f7f4;
            color: #222;
        }

        /* ── Hero / Product Section ── */
        .product-hero {
            max-width: 1100px;
            margin: 40px auto;
            padding: 0 20px;
            display: flex;
            gap: 48px;
            flex-wrap: wrap;
        }

        /* Gallery */
        .gallery-wrap { flex: 1 1 420px; min-width: 280px; }

        .gallery-main {
            width: 100%;
            aspect-ratio: 1 / 1;
            border-radius: 14px;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 4px 18px rgba(0,0,0,.10);
            margin-bottom: 14px;
        }
        .gallery-main img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: opacity .3s;
        }

        .gallery-thumbs {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .gallery-thumbs button {
            width: 72px;
            height: 72px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid transparent;
            cursor: pointer;
            padding: 0;
            background: none;
            transition: border-color .2s;
        }
        .gallery-thumbs button.active,
        .gallery-thumbs button:hover {
            border-color: #e07b39;
        }
        .gallery-thumbs button img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        /* Product Info */
        .product-info { flex: 1 1 340px; min-width: 260px; padding-top: 6px; }

        .product-info .badge {
            display: inline-block;
            background: #e07b39;
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 3px 10px;
            border-radius: 20px;
            margin-bottom: 14px;
        }

        .product-info h1 {
            font-size: 2rem;
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 12px;
        }

        .rating-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 18px;
        }
        .stars { color: #f4a261; font-size: 18px; letter-spacing: 2px; }
        .rating-count { color: #666; font-size: 13px; }

        .price-row {
            display: flex;
            align-items: baseline;
            gap: 12px;
            margin-bottom: 22px;
        }
        .price-now { font-size: 2.2rem; font-weight: 800; color: #e07b39; }
        .price-old { font-size: 1.1rem; color: #aaa; text-decoration: line-through; }
        .price-save {
            background: #fff3ec;
            color: #e07b39;
            font-size: 12px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
        }

        .product-description {
            font-size: 15px;
            line-height: 1.75;
            color: #444;
            margin-bottom: 22px;
        }

        .features-list {
            list-style: none;
            margin-bottom: 28px;
        }
        .features-list li {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 14px;
            color: #333;
            margin-bottom: 10px;
        }
        .features-list li::before {
            content: '✓';
            color: #e07b39;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 2px;
        }

        /* Qty + CTA */
        .qty-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        .qty-label { font-size: 14px; font-weight: 600; color: #555; }
        .qty-controls {
            display: flex;
            align-items: center;
            border: 1.5px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .qty-controls button {
            background: none;
            border: none;
            width: 36px;
            height: 36px;
            font-size: 18px;
            cursor: pointer;
            color: #444;
            transition: background .2s;
        }
        .qty-controls button:hover { background: #f0ece6; }
        .qty-controls input {
            width: 44px;
            text-align: center;
            border: none;
            border-left: 1.5px solid #ddd;
            border-right: 1.5px solid #ddd;
            height: 36px;
            font-size: 15px;
            font-weight: 600;
            outline: none;
        }

        .btn-atc {
            width: 100%;
            padding: 15px;
            background: #e07b39;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 17px;
            font-weight: 700;
            cursor: pointer;
            letter-spacing: .5px;
            transition: background .2s, transform .1s;
            margin-bottom: 12px;
        }
        .btn-atc:hover { background: #c9662a; }
        .btn-atc:active { transform: scale(.98); }

        .btn-buy {
            width: 100%;
            padding: 15px;
            background: #222;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 17px;
            font-weight: 700;
            cursor: pointer;
            letter-spacing: .5px;
            transition: background .2s;
        }
        .btn-buy:hover { background: #444; }

        .trust-row {
            display: flex;
            gap: 18px;
            margin-top: 18px;
            flex-wrap: wrap;
        }
        .trust-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #666;
        }
        .trust-item span.icon { font-size: 16px; }

        /* ── Features Section ── */
        .section-features {
            max-width: 1100px;
            margin: 60px auto;
            padding: 0 20px;
        }
        .section-title {
            text-align: center;
            font-size: 1.8rem;
            font-weight: 800;
            margin-bottom: 36px;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 24px;
        }
        .feature-card {
            background: #fff;
            border-radius: 14px;
            padding: 28px 22px;
            text-align: center;
            box-shadow: 0 2px 12px rgba(0,0,0,.06);
        }
        .feature-card .icon { font-size: 36px; margin-bottom: 14px; }
        .feature-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .feature-card p { font-size: 13px; color: #666; line-height: 1.6; }

        /* ── Reviews Section ── */
        .section-reviews {
            max-width: 1100px;
            margin: 60px auto;
            padding: 0 20px;
        }
        .reviews-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 32px;
        }
        .reviews-summary {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .summary-score {
            font-size: 3rem;
            font-weight: 800;
            color: #e07b39;
            line-height: 1;
        }
        .summary-stars { color: #f4a261; font-size: 22px; display: block; }
        .summary-count { color: #888; font-size: 13px; }

        .review-card {
            background: #fff;
            border-radius: 14px;
            padding: 22px 24px;
            margin-bottom: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,.06);
        }
        .review-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            flex-wrap: wrap;
            gap: 8px;
        }
        .reviewer-name { font-weight: 700; font-size: 15px; }
        .review-date { font-size: 12px; color: #aaa; }
        .review-stars { color: #f4a261; font-size: 15px; margin-bottom: 6px; }
        .review-qty { font-size: 12px; color: #888; margin-bottom: 8px; }
        .review-text { font-size: 14px; color: #444; line-height: 1.7; }

        /* Review Form */
        .review-form-wrap {
            background: #fff;
            border-radius: 14px;
            padding: 28px 24px;
            box-shadow: 0 2px 10px rgba(0,0,0,.06);
            margin-top: 32px;
        }
        .review-form-wrap h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 20px; }

        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; color: #555; }
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 10px 13px;
            border: 1.5px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            transition: border-color .2s;
            font-family: inherit;
        }
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus { border-color: #e07b39; }
        .form-group textarea { resize: vertical; min-height: 90px; }

        .star-picker { display: flex; gap: 6px; }
        .star-picker input[type=radio] { display: none; }
        .star-picker label {
            font-size: 28px;
            color: #ddd;
            cursor: pointer;
            transition: color .15s;
        }
        .star-picker input[type=radio]:checked ~ label,
        .star-picker label:hover,
        .star-picker label:hover ~ label { color: #f4a261; }
        .star-picker { flex-direction: row-reverse; }

        .btn-submit-review {
            padding: 12px 28px;
            background: #e07b39;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: background .2s;
        }
        .btn-submit-review:hover { background: #c9662a; }

        .notice-success {
            background: #e6f9ee;
            color: #1a7a3c;
            border: 1px solid #a3d9b8;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 18px;
            font-size: 14px;
        }
        .notice-error {
            background: #fdecea;
            color: #c0392b;
            border: 1px solid #f5b7b1;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 18px;
            font-size: 14px;
        }

        @media (max-width: 680px) {
            .product-hero { flex-direction: column; gap: 28px; }
            .product-info h1 { font-size: 1.5rem; }
            .price-now { font-size: 1.8rem; }
        }
    </style>
</head>
<body <?php body_class(); ?>>

<?php
// Review submission notices
$review_status = isset( $_GET['review'] ) ? sanitize_text_field( wp_unslash( $_GET['review'] ) ) : '';
?>

<!-- ────────────────────────────────────────
     PRODUCT HERO
──────────────────────────────────────── -->
<section class="product-hero">

    <!-- Gallery -->
    <div class="gallery-wrap">
        <div class="gallery-main">
            <img id="main-img"
                 src="<?php echo esc_url( $imgs[0] ); ?>"
                 alt="<?php echo esc_attr( $product_name ); ?>">
        </div>
        <div class="gallery-thumbs">
            <?php foreach ( $imgs as $i => $src ) : ?>
                <button class="<?php echo $i === 0 ? 'active' : ''; ?>"
                        onclick="setImg(this, '<?php echo esc_js( $src ); ?>')">
                    <img src="<?php echo esc_url( $src ); ?>"
                         alt="<?php echo esc_attr( $product_name . ' image ' . ( $i + 1 ) ); ?>">
                </button>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Info -->
    <div class="product-info">
        <span class="badge">Top Rated</span>
        <h1><?php echo esc_html( $product_name ); ?></h1>

        <div class="rating-row">
            <span class="stars">
                <?php
                $full = floor( $avg_stars );
                for ( $i = 1; $i <= 5; $i++ ) {
                    echo $i <= $full ? '★' : '☆';
                }
                ?>
            </span>
            <span><?php echo esc_html( $avg_stars ); ?></span>
            <span class="rating-count">(<?php echo esc_html( $review_count ); ?> reviews)</span>
        </div>

        <div class="price-row">
            <span class="price-now">$44.99</span>
            <span class="price-old">$79.99</span>
            <span class="price-save">Save 44%</span>
        </div>

        <p class="product-description">
            Keep your home safe and well-lit with our Motion Sensor Security Light.
            Featuring a wide-angle PIR motion detector, it floods your driveway, porch,
            or garden with bright LED light the instant it detects movement — deterring
            intruders and guiding your way in the dark.
        </p>

        <ul class="features-list">
            <li>180° wide-angle PIR motion detection</li>
            <li>Instant bright LED illumination on movement</li>
            <li>IP65 weatherproof — works in any climate</li>
            <li>Adjustable sensitivity, range, and duration</li>
            <li>Solar-powered with built-in rechargeable battery</li>
            <li>Easy wall mount — installs in minutes</li>
        </ul>

        <div class="qty-row">
            <span class="qty-label">Qty:</span>
            <div class="qty-controls">
                <button type="button" onclick="changeQty(-1)" aria-label="Decrease quantity">−</button>
                <input type="number" id="qty-input" value="1" min="1" max="99" readonly>
                <button type="button" onclick="changeQty(1)" aria-label="Increase quantity">+</button>
            </div>
        </div>

        <button class="btn-atc" type="button">Add to Cart</button>
        <button class="btn-buy" type="button">Buy It Now</button>

        <div class="trust-row">
            <div class="trust-item"><span class="icon">🚚</span> Free Shipping</div>
            <div class="trust-item"><span class="icon">🔄</span> 30-Day Returns</div>
            <div class="trust-item"><span class="icon">🔒</span> Secure Checkout</div>
            <div class="trust-item"><span class="icon">🛡️</span> 1-Year Warranty</div>
        </div>
    </div>
</section>

<!-- ────────────────────────────────────────
     FEATURE HIGHLIGHTS
──────────────────────────────────────── -->
<section class="section-features">
    <h2 class="section-title">Why Choose Our Motion Sensor Light?</h2>
    <div class="features-grid">
        <div class="feature-card">
            <div class="icon">👁️</div>
            <h3>180° Motion Detection</h3>
            <p>Wide-angle PIR sensor catches movement across a broad zone.</p>
        </div>
        <div class="feature-card">
            <div class="icon">⚡</div>
            <h3>Instant Illumination</h3>
            <p>Light activates within milliseconds of detecting motion.</p>
        </div>
        <div class="feature-card">
            <div class="icon">🌧️</div>
            <h3>All-Weather Proof</h3>
            <p>IP65 rated — built to handle rain, frost, and summer heat.</p>
        </div>
        <div class="feature-card">
            <div class="icon">☀️</div>
            <h3>Solar Powered</h3>
            <p>Charges by day, guards by night — zero electricity costs.</p>
        </div>
        <div class="feature-card">
            <div class="icon">🔧</div>
            <h3>Easy Installation</h3>
            <p>Simple wall-mount bracket — up and running in minutes.</p>
        </div>
        <div class="feature-card">
            <div class="icon">🎛️</div>
            <h3>Fully Adjustable</h3>
            <p>Tune sensitivity, detection range, and light duration to your needs.</p>
        </div>
    </div>
</section>

<!-- ────────────────────────────────────────
     REVIEWS
──────────────────────────────────────── -->
<section class="section-reviews">
    <div class="reviews-header">
        <h2 class="section-title" style="margin-bottom:0;">Customer Reviews</h2>
        <div class="reviews-summary">
            <span class="summary-score"><?php echo esc_html( $avg_stars ); ?></span>
            <div>
                <span class="summary-stars">
                    <?php
                    $full = floor( $avg_stars );
                    for ( $i = 1; $i <= 5; $i++ ) {
                        echo $i <= $full ? '★' : '☆';
                    }
                    ?>
                </span>
                <span class="summary-count"><?php echo esc_html( $review_count ); ?> verified reviews</span>
            </div>
        </div>
    </div>

    <?php if ( $review_count > 0 ) : ?>
        <?php foreach ( $reviews as $r ) :
            $r_stars = (int) get_post_meta( $r->ID, '_snaplyr_stars', true );
            $r_qty   = get_post_meta( $r->ID, '_snaplyr_qty', true );
            $r_date  = get_post_meta( $r->ID, '_snaplyr_date_text', true );
            $r_text  = get_post_meta( $r->ID, '_snaplyr_review_text', true );
            $r_stars = max( 1, min( 5, $r_stars ) );
        ?>
            <div class="review-card">
                <div class="review-top">
                    <span class="reviewer-name"><?php echo esc_html( $r->post_title ); ?></span>
                    <span class="review-date"><?php echo esc_html( $r_date ); ?></span>
                </div>
                <div class="review-stars">
                    <?php for ( $i = 1; $i <= 5; $i++ ) echo $i <= $r_stars ? '★' : '☆'; ?>
                </div>
                <?php if ( $r_qty ) : ?>
                    <div class="review-qty">Ordered: <?php echo esc_html( $r_qty ); ?></div>
                <?php endif; ?>
                <div class="review-text"><?php echo esc_html( $r_text ); ?></div>
            </div>
        <?php endforeach; ?>
    <?php else : ?>
        <p style="color:#888;font-size:14px;">No reviews yet. Be the first!</p>
    <?php endif; ?>

    <!-- Review Submission Form -->
    <div class="review-form-wrap">
        <h3>Write a Review</h3>

        <?php if ( $review_status === 'submitted' ) : ?>
            <div class="notice-success">Thank you! Your review has been submitted and is awaiting approval.</div>
        <?php elseif ( $review_status === 'error' ) : ?>
            <div class="notice-error">There was a problem submitting your review. Please try again.</div>
        <?php endif; ?>

        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
            <?php wp_nonce_field( 'snaplyr_submit_review', 'snaplyr_review_nonce' ); ?>
            <input type="hidden" name="action" value="snaplyr_submit_review">
            <input type="hidden" name="product" value="<?php echo esc_attr( $product_slug ); ?>">

            <div class="form-group">
                <label for="reviewer_name">Your Name</label>
                <input type="text" id="reviewer_name" name="reviewer_name" required placeholder="e.g. James T.">
            </div>

            <div class="form-group">
                <label>Star Rating</label>
                <div class="star-picker">
                    <?php for ( $i = 5; $i >= 1; $i-- ) : ?>
                        <input type="radio" id="star<?php echo $i; ?>" name="stars" value="<?php echo $i; ?>"
                               <?php echo $i === 5 ? 'checked' : ''; ?>>
                        <label for="star<?php echo $i; ?>">★</label>
                    <?php endfor; ?>
                </div>
            </div>

            <div class="form-group">
                <label for="qty">Quantity Ordered (optional)</label>
                <input type="text" id="qty" name="qty" placeholder="e.g. 2 pcs">
            </div>

            <div class="form-group">
                <label for="review_text">Your Review</label>
                <textarea id="review_text" name="review_text" required placeholder="Share your experience..."></textarea>
            </div>

            <button type="submit" class="btn-submit-review">Submit Review</button>
        </form>
    </div>
</section>

<script>
function setImg(btn, src) {
    document.getElementById('main-img').src = src;
    document.querySelectorAll('.gallery-thumbs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function changeQty(delta) {
    var input = document.getElementById('qty-input');
    var val = parseInt(input.value, 10) || 1;
    val = Math.max(1, Math.min(99, val + delta));
    input.value = val;
}
</script>

<?php wp_footer(); ?>
</body>
</html>
<?php get_footer(); ?>
