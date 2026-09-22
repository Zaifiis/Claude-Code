<?php
/**
 * Opening half of every public page.
 *
 * Expects $page:
 *   title       string  page title, brand name is appended
 *   description string  meta description
 *   path        string  canonical path, e.g. '/pricing'
 *   jsonld      array   optional structured data (encoded and CSP-hashed)
 *   bodyClass   string  optional extra class on <body>
 */
declare(strict_types=1);

$page        = $page ?? [];
$pageTitle   = (string) ($page['title'] ?? brand());
$pageDesc    = (string) ($page['description'] ?? cfg('brand.tagline'));
$pagePath    = (string) ($page['path'] ?? current_path());
$bodyClass   = trim('no-js ' . (string) ($page['bodyClass'] ?? ''));
$fullTitle   = $pageTitle === brand()
    ? sprintf('%s — %s', brand(), cfg('brand.tagline'))
    : sprintf('%s — %s', $pageTitle, brand());

$jsonldRaw = null;
if (!empty($page['jsonld'])) {
    $jsonldRaw = json_encode(
        $page['jsonld'],
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
    ) ?: null;
}

security_headers($jsonldRaw !== null ? csp_hash($jsonldRaw) : null);

// Cache-bust assets on content change rather than on every deploy.
$cssVersion = (string) @filemtime(APP_PUBLIC . '/assets/css/site.css');
$jsVersion  = (string) @filemtime(APP_PUBLIC . '/assets/js/site.js');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($fullTitle) ?></title>
<meta name="description" content="<?= e($pageDesc) ?>">
<link rel="canonical" href="<?= e(url($pagePath)) ?>">
<meta name="theme-color" content="#07090e">

<meta property="og:type" content="website">
<meta property="og:site_name" content="<?= e(brand()) ?>">
<meta property="og:title" content="<?= e($fullTitle) ?>">
<meta property="og:description" content="<?= e($pageDesc) ?>">
<meta property="og:url" content="<?= e(url($pagePath)) ?>">
<meta property="og:image" content="<?= e(url('/assets/img/og.svg')) ?>">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/site.css?v=<?= e($cssVersion) ?>">
<script src="/assets/js/site.js?v=<?= e($jsVersion) ?>" defer></script>
<?php if ($jsonldRaw !== null): ?>
<script type="application/ld+json"><?= $jsonldRaw ?></script>
<?php endif; ?>
</head>
<body<?= $bodyClass !== '' ? ' class="' . e($bodyClass) . '"' : '' ?>>
<a class="skip-link" href="#main">Skip to content</a>
<?php require APP_INC . '/partials/header.php'; ?>
<main id="main">
