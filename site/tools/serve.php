<?php
/**
 * Router for PHP's built-in server, so local previews behave like Apache:
 * clean URLs, a real 404 page, and /sitemap.xml.
 *
 *     php -S localhost:8000 -t site/public_html site/tools/serve.php
 */
declare(strict_types=1);

$root = __DIR__ . '/../public_html';
$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
$path = '/' . ltrim((string) $path, '/');

// Never serve the application internals, matching inc/.htaccess.
if (preg_match('~^/(inc|\.)~', $path) === 1) {
    http_response_code(403);
    exit('Forbidden');
}

if ($path === '/sitemap.xml') {
    require $root . '/sitemap.php';
    return true;
}

$file = realpath($root . $path);

// Existing static file: let the built-in server handle it.
if ($file !== false && is_file($file) && str_starts_with($file, realpath($root) ?: $root)) {
    return false;
}

// Directory index.
if ($file !== false && is_dir($file) && is_file($file . '/index.php')) {
    require $file . '/index.php';
    return true;
}

// Extensionless URL → matching .php file.
$candidate = realpath($root . rtrim($path, '/') . '.php');
if ($candidate !== false && is_file($candidate) && str_starts_with($candidate, realpath($root) ?: $root)) {
    require $candidate;
    return true;
}

http_response_code(404);
require $root . '/404.php';
return true;
