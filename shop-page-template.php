<?php
/**
 * Template Name: Shop Page
 * Description: Shop / product listing page for The Beam House.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shop – The Beam House</title>
    <?php wp_head(); ?>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f8f7f4;
            color: #222;
        }

        /* ── Page Header ── */
        .shop-header {
            background: #fff;
            border-bottom: 1px solid #ece9e4;
            padding: 48px 20px 36px;
            text-align: center;
        }
        .shop-header h1 {
            font-size: 2.4rem;
            font-weight: 800;
            margin-bottom: 10px;
        }
        .shop-header p {
            font-size: 15px;
            color: #666;
            max-width: 520px;
            margin: 0 auto;
            line-height: 1.7;
        }

        /* ── Product Grid ── */
        .shop-grid-wrap {
            max-width: 1200px;
            margin: 48px auto;
            padding: 0 20px;
        }

        .shop-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 28px;
        }

        /* ── Product Card ── */
        .product-card {
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 2px 14px rgba(0,0,0,.07);
            transition: box-shadow .2s, transform .2s;
            display: flex;
            flex-direction: column;
        }
        .product-card:hover {
            box-shadow: 0 6px 28px rgba(0,0,0,.13);
            transform: translateY(-3px);
        }

        .card-image {
            width: 100%;
            aspect-ratio: 1 / 1;
            overflow: hidden;
            background: #f0ece6;
            display: block;
        }
        .card-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform .35s ease;
        }
        .product-card:hover .card-image img {
            transform: scale(1.04);
        }

        .card-body {
            padding: 20px 20px 24px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .card-badge {
            display: inline-block;
            background: #fff3ec;
            color: #e07b39;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 3px 9px;
            border-radius: 20px;
            margin-bottom: 10px;
            align-self: flex-start;
        }

        .card-title {
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 8px;
            line-height: 1.3;
        }

        .card-stars {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 12px;
        }
        .card-stars .stars { color: #f4a261; font-size: 14px; letter-spacing: 1px; }
        .card-stars .count { font-size: 12px; color: #888; }

        .card-description {
            font-size: 13px;
            color: #666;
            line-height: 1.65;
            margin-bottom: 18px;
            flex: 1;
        }

        .card-price-row {
            display: flex;
            align-items: baseline;
            gap: 10px;
            margin-bottom: 16px;
        }
        .card-price-now { font-size: 1.5rem; font-weight: 800; color: #e07b39; }
        .card-price-old { font-size: 0.95rem; color: #aaa; text-decoration: line-through; }
        .card-price-save {
            font-size: 11px;
            font-weight: 700;
            background: #fff3ec;
            color: #e07b39;
            padding: 2px 7px;
            border-radius: 20px;
        }

        .card-btn {
            display: block;
            width: 100%;
            padding: 12px;
            background: #e07b39;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 700;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
            transition: background .2s, transform .1s;
        }
        .card-btn:hover { background: #c9662a; }
        .card-btn:active { transform: scale(.98); }

        /* ── Trust Bar ── */
        .trust-bar {
            background: #fff;
            border-top: 1px solid #ece9e4;
            padding: 28px 20px;
            margin-top: 20px;
        }
        .trust-bar-inner {
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
            gap: 40px;
            flex-wrap: wrap;
        }
        .trust-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #555;
            font-weight: 600;
        }
        .trust-item .icon { font-size: 20px; }

        @media (max-width: 540px) {
            .shop-header h1 { font-size: 1.8rem; }
            .shop-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
            .card-body { padding: 14px 14px 18px; }
        }
        @media (max-width: 360px) {
            .shop-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body <?php body_class(); ?>>

<!-- ── Page Header ── -->
<div class="shop-header">
    <h1>Our Products</h1>
    <p>Eco-friendly outdoor lighting solutions — solar-powered, weatherproof, and built to last.</p>
</div>

<!-- ── Product Grid ── -->
<div class="shop-grid-wrap">
    <div class="shop-grid">

        <!-- ── Card: Solar Garden Lamp ── -->
        <?php
        $solar_slug    = 'solar-lamp';
        $solar_reviews = get_posts( [
            'post_type'      => 'snaplyr_review',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'meta_query'     => [ [ 'key' => '_snaplyr_product', 'value' => $solar_slug, 'compare' => '=' ] ],
        ] );
        $solar_count   = count( $solar_reviews );
        $solar_total   = 0;
        foreach ( $solar_reviews as $r ) {
            $solar_total += (int) get_post_meta( $r->ID, '_snaplyr_stars', true );
        }
        $solar_avg  = $solar_count > 0 ? round( $solar_total / $solar_count, 1 ) : 5.0;
        $solar_full = floor( $solar_avg );
        ?>
        <div class="product-card">
            <a href="<?php echo esc_url( home_url( '/solar-lamp/' ) ); ?>" class="card-image">
                <img src="https://www.thebeamhouse.store/cdn/shop/files/1.png?v=1757951678"
                     alt="Solar Garden Lamp">
            </a>
            <div class="card-body">
                <span class="card-badge">Best Seller</span>
                <div class="card-title">Solar Garden Lamp</div>
                <div class="card-stars">
                    <span class="stars">
                        <?php for ( $i = 1; $i <= 5; $i++ ) echo $i <= $solar_full ? '★' : '☆'; ?>
                    </span>
                    <span class="count"><?php echo esc_html( $solar_avg ); ?> (<?php echo esc_html( $solar_count ); ?>)</span>
                </div>
                <p class="card-description">
                    Solar-powered garden light that charges by day and automatically illuminates
                    your pathways and patios at dusk. IP65 weatherproof with zero running costs.
                </p>
                <div class="card-price-row">
                    <span class="card-price-now">$39.99</span>
                    <span class="card-price-old">$69.99</span>
                    <span class="card-price-save">Save 43%</span>
                </div>
                <a href="<?php echo esc_url( home_url( '/solar-lamp/' ) ); ?>" class="card-btn">View Product</a>
            </div>
        </div>

        <!-- ── Card: Motion Sensor Security Light ── -->
        <?php
        $motion_slug    = 'motion-sensor-light';
        $motion_reviews = get_posts( [
            'post_type'      => 'snaplyr_review',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'meta_query'     => [ [ 'key' => '_snaplyr_product', 'value' => $motion_slug, 'compare' => '=' ] ],
        ] );
        $motion_count   = count( $motion_reviews );
        $motion_total   = 0;
        foreach ( $motion_reviews as $r ) {
            $motion_total += (int) get_post_meta( $r->ID, '_snaplyr_stars', true );
        }
        $motion_avg  = $motion_count > 0 ? round( $motion_total / $motion_count, 1 ) : 5.0;
        $motion_full = floor( $motion_avg );
        ?>
        <div class="product-card">
            <a href="<?php echo esc_url( home_url( '/motion-sensor-light/' ) ); ?>" class="card-image">
                <img src="https://www.thebeamhouse.store/cdn/shop/files/e42ff886-fe8d-45be-b56e-9be116e6bce8.png?v=1754492881"
                     alt="Motion Sensor Security Light">
            </a>
            <div class="card-body">
                <span class="card-badge">Top Rated</span>
                <div class="card-title">Motion Sensor Security Light</div>
                <div class="card-stars">
                    <span class="stars">
                        <?php for ( $i = 1; $i <= 5; $i++ ) echo $i <= $motion_full ? '★' : '☆'; ?>
                    </span>
                    <span class="count"><?php echo esc_html( $motion_avg ); ?> (<?php echo esc_html( $motion_count ); ?>)</span>
                </div>
                <p class="card-description">
                    180° PIR motion-activated security light. Instantly floods your driveway,
                    porch, or garden with bright LED light when movement is detected. Solar-powered
                    and fully adjustable.
                </p>
                <div class="card-price-row">
                    <span class="card-price-now">$44.99</span>
                    <span class="card-price-old">$79.99</span>
                    <span class="card-price-save">Save 44%</span>
                </div>
                <a href="<?php echo esc_url( home_url( '/motion-sensor-light/' ) ); ?>" class="card-btn">View Product</a>
            </div>
        </div>

    </div><!-- /.shop-grid -->
</div><!-- /.shop-grid-wrap -->

<!-- ── Trust Bar ── -->
<div class="trust-bar">
    <div class="trust-bar-inner">
        <div class="trust-item"><span class="icon">🚚</span> Free Shipping on All Orders</div>
        <div class="trust-item"><span class="icon">🔄</span> 30-Day Returns</div>
        <div class="trust-item"><span class="icon">🔒</span> Secure Checkout</div>
        <div class="trust-item"><span class="icon">🌿</span> Eco-Friendly Products</div>
    </div>
</div>

<?php wp_footer(); ?>
</body>
</html>
<?php get_footer(); ?>
