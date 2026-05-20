<?php
/**
 * Plugin Name: Snaplyr Review System
 * Description: Custom review system for Snaplyr e-commerce store. Handles review submission, approval workflow, and display integration for product pages.
 * Version: 1.0
 * Author: Snaplyr
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ─────────────────────────────────────────────
// 1. Register Custom Post Type: snaplyr_review
// ─────────────────────────────────────────────
function snaplyr_register_review_post_type() {
    $labels = [
        'name'               => 'Reviews',
        'singular_name'      => 'Review',
        'menu_name'          => 'Reviews',
        'add_new'            => 'Add New Review',
        'add_new_item'       => 'Add New Review',
        'edit_item'          => 'Edit Review',
        'new_item'           => 'New Review',
        'view_item'          => 'View Review',
        'search_items'       => 'Search Reviews',
        'not_found'          => 'No reviews found',
        'not_found_in_trash' => 'No reviews found in trash',
        'all_items'          => 'All Reviews',
    ];

    $args = [
        'labels'              => $labels,
        'public'              => false,
        'publicly_queryable'  => false,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'menu_position'       => 25,
        'menu_icon'           => 'dashicons-star-filled',
        'query_var'           => false,
        'rewrite'             => false,
        'capability_type'     => 'post',
        'has_archive'         => false,
        'hierarchical'        => false,
        'supports'            => [ 'title', 'custom-fields' ],
        'show_in_rest'        => false,
    ];

    register_post_type( 'snaplyr_review', $args );
}
add_action( 'init', 'snaplyr_register_review_post_type' );

// ─────────────────────────────────────────────
// 2. Register Custom Meta Fields
// ─────────────────────────────────────────────
function snaplyr_register_review_meta() {
    $meta_fields = [
        '_snaplyr_stars' => [
            'type'              => 'integer',
            'description'       => 'Star rating (1–5)',
            'single'            => true,
            'sanitize_callback' => 'absint',
            'auth_callback'     => '__return_true',
            'show_in_rest'      => false,
        ],
        '_snaplyr_qty' => [
            'type'              => 'string',
            'description'       => 'Quantity ordered (e.g. "2 pcs")',
            'single'            => true,
            'sanitize_callback' => 'sanitize_text_field',
            'auth_callback'     => '__return_true',
            'show_in_rest'      => false,
        ],
        '_snaplyr_product' => [
            'type'              => 'string',
            'description'       => 'Product slug (e.g. solar-lamp)',
            'single'            => true,
            'sanitize_callback' => 'sanitize_text_field',
            'auth_callback'     => '__return_true',
            'show_in_rest'      => false,
        ],
        '_snaplyr_date_text' => [
            'type'              => 'string',
            'description'       => 'Human-readable date (e.g. May 20, 2026)',
            'single'            => true,
            'sanitize_callback' => 'sanitize_text_field',
            'auth_callback'     => '__return_true',
            'show_in_rest'      => false,
        ],
        '_snaplyr_review_text' => [
            'type'              => 'string',
            'description'       => 'Review body text',
            'single'            => true,
            'sanitize_callback' => 'sanitize_textarea_field',
            'auth_callback'     => '__return_true',
            'show_in_rest'      => false,
        ],
    ];

    foreach ( $meta_fields as $key => $args ) {
        register_post_meta( 'snaplyr_review', $key, $args );
    }
}
add_action( 'init', 'snaplyr_register_review_meta' );

// ─────────────────────────────────────────────
// 3. Handle Form Submission via admin-post.php
// ─────────────────────────────────────────────
function snaplyr_handle_review_submission() {
    // Verify nonce
    if (
        ! isset( $_POST['snaplyr_review_nonce'] ) ||
        ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['snaplyr_review_nonce'] ) ), 'snaplyr_submit_review' )
    ) {
        wp_die( 'Security check failed. Please go back and try again.', 'Error', [ 'back_link' => true ] );
    }

    // Sanitize inputs
    $reviewer_name = isset( $_POST['reviewer_name'] ) ? sanitize_text_field( wp_unslash( $_POST['reviewer_name'] ) ) : '';
    $stars         = isset( $_POST['stars'] )         ? absint( $_POST['stars'] )                                     : 0;
    $qty           = isset( $_POST['qty'] )           ? sanitize_text_field( wp_unslash( $_POST['qty'] ) )             : '';
    $product       = isset( $_POST['product'] )       ? sanitize_text_field( wp_unslash( $_POST['product'] ) )         : '';
    $review_text   = isset( $_POST['review_text'] )   ? sanitize_textarea_field( wp_unslash( $_POST['review_text'] ) ) : '';

    // Validate required fields
    if ( empty( $reviewer_name ) || empty( $review_text ) || $stars < 1 || $stars > 5 ) {
        $referer = wp_get_referer() ? wp_get_referer() : home_url( '/' );
        wp_redirect( add_query_arg( 'review', 'error', $referer ) );
        exit;
    }

    // Build date text
    $date_text = date_i18n( 'F j, Y' );

    // Create the review post with pending status
    $post_id = wp_insert_post( [
        'post_title'  => $reviewer_name,
        'post_type'   => 'snaplyr_review',
        'post_status' => 'pending',
        'post_author' => 0,
    ] );

    if ( is_wp_error( $post_id ) ) {
        $referer = wp_get_referer() ? wp_get_referer() : home_url( '/' );
        wp_redirect( add_query_arg( 'review', 'error', $referer ) );
        exit;
    }

    // Store meta
    update_post_meta( $post_id, '_snaplyr_stars',       $stars );
    update_post_meta( $post_id, '_snaplyr_qty',         $qty );
    update_post_meta( $post_id, '_snaplyr_product',     $product );
    update_post_meta( $post_id, '_snaplyr_date_text',   $date_text );
    update_post_meta( $post_id, '_snaplyr_review_text', $review_text );

    // Redirect back with success param
    $referer = wp_get_referer() ? wp_get_referer() : home_url( '/' );
    // Strip any existing review param before adding new one
    $referer = remove_query_arg( 'review', $referer );
    wp_redirect( add_query_arg( 'review', 'submitted', $referer ) );
    exit;
}
add_action( 'wp_ajax_snaplyr_submit_review',           'snaplyr_handle_review_submission' );
add_action( 'wp_ajax_nopriv_snaplyr_submit_review',    'snaplyr_handle_review_submission' );
// Also handle direct admin-post.php form submission (non-AJAX)
add_action( 'admin_post_snaplyr_submit_review',        'snaplyr_handle_review_submission' );
add_action( 'admin_post_nopriv_snaplyr_submit_review', 'snaplyr_handle_review_submission' );

// ─────────────────────────────────────────────
// 4. Custom Admin Columns for Review List
// ─────────────────────────────────────────────
function snaplyr_review_columns( $columns ) {
    // Insert our custom columns after the title
    $new = [];
    foreach ( $columns as $key => $value ) {
        $new[ $key ] = $value;
        if ( $key === 'title' ) {
            $new['snaplyr_stars']   = 'Stars';
            $new['snaplyr_product'] = 'Product';
            $new['snaplyr_qty']     = 'Qty Ordered';
        }
    }
    return $new;
}
add_filter( 'manage_snaplyr_review_posts_columns', 'snaplyr_review_columns' );

function snaplyr_review_column_content( $column, $post_id ) {
    switch ( $column ) {
        case 'snaplyr_stars':
            $stars = (int) get_post_meta( $post_id, '_snaplyr_stars', true );
            $stars = max( 1, min( 5, $stars ) );
            $output = '';
            for ( $i = 1; $i <= 5; $i++ ) {
                $output .= ( $i <= $stars )
                    ? '<span style="color:#f4a261;font-size:16px;">&#9733;</span>'
                    : '<span style="color:#ccc;font-size:16px;">&#9734;</span>';
            }
            echo $output . ' <strong>(' . esc_html( $stars ) . '/5)</strong>';
            break;

        case 'snaplyr_product':
            $product = get_post_meta( $post_id, '_snaplyr_product', true );
            echo '<code>' . esc_html( $product ) . '</code>';
            break;

        case 'snaplyr_qty':
            $qty = get_post_meta( $post_id, '_snaplyr_qty', true );
            echo esc_html( $qty ? $qty : '—' );
            break;
    }
}
add_action( 'manage_snaplyr_review_posts_custom_column', 'snaplyr_review_column_content', 10, 2 );

// Make stars column sortable
function snaplyr_review_sortable_columns( $columns ) {
    $columns['snaplyr_stars']   = 'snaplyr_stars';
    $columns['snaplyr_product'] = 'snaplyr_product';
    return $columns;
}
add_filter( 'manage_edit-snaplyr_review_sortable_columns', 'snaplyr_review_sortable_columns' );

// ─────────────────────────────────────────────
// 5. Show review meta in admin edit screen
// ─────────────────────────────────────────────
function snaplyr_review_meta_box() {
    add_meta_box(
        'snaplyr_review_details',
        'Review Details',
        'snaplyr_review_meta_box_html',
        'snaplyr_review',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes', 'snaplyr_review_meta_box' );

function snaplyr_review_meta_box_html( $post ) {
    $stars       = get_post_meta( $post->ID, '_snaplyr_stars',       true );
    $qty         = get_post_meta( $post->ID, '_snaplyr_qty',         true );
    $product     = get_post_meta( $post->ID, '_snaplyr_product',     true );
    $date_text   = get_post_meta( $post->ID, '_snaplyr_date_text',   true );
    $review_text = get_post_meta( $post->ID, '_snaplyr_review_text', true );

    wp_nonce_field( 'snaplyr_save_review_meta', 'snaplyr_meta_nonce' );
    ?>
    <table class="form-table" style="width:100%;">
        <tr>
            <th style="width:160px;"><label for="snaplyr_stars">Stars (1–5)</label></th>
            <td><input type="number" id="snaplyr_stars" name="snaplyr_stars" value="<?php echo esc_attr( $stars ); ?>" min="1" max="5" style="width:60px;" /></td>
        </tr>
        <tr>
            <th><label for="snaplyr_product">Product Slug</label></th>
            <td><input type="text" id="snaplyr_product" name="snaplyr_product" value="<?php echo esc_attr( $product ); ?>" style="width:280px;" /></td>
        </tr>
        <tr>
            <th><label for="snaplyr_qty">Quantity Ordered</label></th>
            <td><input type="text" id="snaplyr_qty" name="snaplyr_qty" value="<?php echo esc_attr( $qty ); ?>" style="width:120px;" /></td>
        </tr>
        <tr>
            <th><label for="snaplyr_date_text">Display Date</label></th>
            <td><input type="text" id="snaplyr_date_text" name="snaplyr_date_text" value="<?php echo esc_attr( $date_text ); ?>" style="width:200px;" /></td>
        </tr>
        <tr>
            <th><label for="snaplyr_review_text">Review Text</label></th>
            <td><textarea id="snaplyr_review_text" name="snaplyr_review_text" rows="5" style="width:100%;"><?php echo esc_textarea( $review_text ); ?></textarea></td>
        </tr>
    </table>
    <?php
}

function snaplyr_save_review_meta( $post_id ) {
    if ( ! isset( $_POST['snaplyr_meta_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['snaplyr_meta_nonce'] ) ), 'snaplyr_save_review_meta' ) ) {
        return;
    }
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    if ( isset( $_POST['snaplyr_stars'] ) ) {
        update_post_meta( $post_id, '_snaplyr_stars', absint( $_POST['snaplyr_stars'] ) );
    }
    if ( isset( $_POST['snaplyr_product'] ) ) {
        update_post_meta( $post_id, '_snaplyr_product', sanitize_text_field( wp_unslash( $_POST['snaplyr_product'] ) ) );
    }
    if ( isset( $_POST['snaplyr_qty'] ) ) {
        update_post_meta( $post_id, '_snaplyr_qty', sanitize_text_field( wp_unslash( $_POST['snaplyr_qty'] ) ) );
    }
    if ( isset( $_POST['snaplyr_date_text'] ) ) {
        update_post_meta( $post_id, '_snaplyr_date_text', sanitize_text_field( wp_unslash( $_POST['snaplyr_date_text'] ) ) );
    }
    if ( isset( $_POST['snaplyr_review_text'] ) ) {
        update_post_meta( $post_id, '_snaplyr_review_text', sanitize_textarea_field( wp_unslash( $_POST['snaplyr_review_text'] ) ) );
    }
}
add_action( 'save_post_snaplyr_review', 'snaplyr_save_review_meta' );
