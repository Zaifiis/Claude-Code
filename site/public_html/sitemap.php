<?php
/**
 * XML sitemap, generated so it can never drift out of sync with the pages
 * that exist. Reached at /sitemap.xml via the rewrite in .htaccess.
 */
declare(strict_types=1);
require __DIR__ . '/inc/bootstrap.php';

header('Content-Type: application/xml; charset=utf-8');

/** path => [change frequency, priority] */
$pages = [
    '/'         => ['weekly',  '1.0'],
    '/services' => ['monthly', '0.9'],
    '/work'     => ['monthly', '0.8'],
    '/pricing'  => ['monthly', '0.9'],
    '/about'    => ['yearly',  '0.6'],
    '/audit'    => ['monthly', '0.9'],
    '/contact'  => ['yearly',  '0.7'],
    '/privacy'  => ['yearly',  '0.2'],
    '/terms'    => ['yearly',  '0.2'],
];

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ($pages as $path => [$frequency, $priority]) {
    $file     = APP_PUBLIC . ($path === '/' ? '/index.php' : $path . '.php');
    $modified = @filemtime($file) ?: time();

    printf(
        "  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n"
        . "    <changefreq>%s</changefreq>\n    <priority>%s</priority>\n  </url>\n",
        htmlspecialchars(url($path), ENT_XML1),
        date('Y-m-d', $modified),
        $frequency,
        $priority
    );
}

echo '</urlset>' . "\n";
