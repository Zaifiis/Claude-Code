<?php
/**
 * Page chrome: <head>, top bar, and left sidebar navigation. Pages call
 * layout_header($title, $active) then render their body, then layout_footer().
 */

function nav_items(): array
{
    return [
        ['key' => 'dashboard', 'label' => 'Dashboard',  'href' => 'index.php',      'icon' => '▚'],
        ['key' => 'inbox',     'label' => 'Inbox',       'href' => 'inbox.php',      'icon' => '↘'],
        ['key' => 'ideas',     'label' => 'Ideas',       'href' => 'ideas.php',      'icon' => '✦'],
        ['key' => 'pipeline',  'label' => 'Pipeline',    'href' => 'pipeline.php',   'icon' => '☰'],
        ['key' => 'scripts',   'label' => 'Scripts',     'href' => 'scripts.php',    'icon' => '✎'],
        ['key' => 'calendar',  'label' => 'Calendar',    'href' => 'calendar.php',   'icon' => '▤'],
        ['key' => 'library',   'label' => 'Library',     'href' => 'references.php', 'icon' => '⚑'],
        ['key' => 'analytics', 'label' => 'Analytics',   'href' => 'analytics.php',  'icon' => '◔'],
        ['key' => 'archive',   'label' => 'Archive',     'href' => 'archive.php',    'icon' => '⌗'],
        ['key' => 'settings',  'label' => 'Settings',    'href' => 'settings.php',   'icon' => '⚙'],
    ];
}

function layout_header(string $title, string $active = ''): void
{
    $cfg = $GLOBALS['CONFIG'];
    $user = current_user();
    $appName = $cfg['app_name'];
    ?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= h($title) ?> · <?= h($appName) ?></title>
<link rel="stylesheet" href="<?= h(base_url('assets/style.css')) ?>">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✳️</text></svg>">
</head>
<body>
<input type="checkbox" id="navtoggle" hidden>
<div class="app">
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark">✳</span>
      <span class="brand-name"><?= h($appName) ?></span>
    </div>
    <a class="new-btn" href="<?= h(base_url('edit.php')) ?>">+ New content</a>
    <nav>
      <?php foreach (nav_items() as $it): ?>
        <a class="nav-link<?= $active === $it['key'] ? ' is-active' : '' ?>" href="<?= h(base_url($it['href'])) ?>">
          <span class="nav-icon"><?= $it['icon'] ?></span><?= h($it['label']) ?>
        </a>
      <?php endforeach; ?>
    </nav>
    <?php if ($user): ?>
    <div class="sidebar-user">
      <span class="avatar"><?= h(initials($user['name'])) ?></span>
      <span class="sidebar-user-name"><?= h($user['name']) ?></span>
      <a class="logout" href="<?= h(base_url('logout.php')) ?>" title="Log out">⏻</a>
    </div>
    <?php endif; ?>
  </aside>

  <main class="main">
    <header class="topbar">
      <label for="navtoggle" class="navtoggle-btn" aria-label="Menu">☰</label>
      <h1 class="page-title"><?= h($title) ?></h1>
      <form class="topbar-search" method="get" action="<?= h(base_url('search.php')) ?>">
        <input type="search" name="q" placeholder="Search content…" value="<?= h($_GET['q'] ?? '') ?>">
      </form>
    </header>

    <?php foreach (take_flash() as $msg): ?>
      <div class="flash"><?= h($msg) ?></div>
    <?php endforeach; ?>

    <div class="content">
<?php
}

function layout_footer(): void
{
    ?>
    </div>
  </main>
</div>
</body>
</html>
<?php
}

/** Small coloured pill (platform / status / priority badge). */
function pill(string $label, string $color, string $variant = 'soft'): string
{
    if ($variant === 'dot') {
        return '<span class="pill"><span class="dot" style="background:' . h($color) . '"></span>' . h($label) . '</span>';
    }
    // Soft tinted background derived from the colour.
    return '<span class="pill pill-soft" style="--pc:' . h($color) . '">' . h($label) . '</span>';
}

function status_badge(?string $status): string
{
    return pill(label_for(STATUSES, $status), color_for(STATUSES, $status), 'dot');
}

function platform_badge(?string $platform): string
{
    return pill(label_for(PLATFORMS, $platform), color_for(PLATFORMS, $platform), 'soft');
}

function priority_badge(?string $priority): string
{
    return pill(label_for(PRIORITIES, $priority), color_for(PRIORITIES, $priority), 'dot');
}

/** Render a content card (used across list views). */
function content_card(array $item): void
{
    $href = base_url('content.php?id=' . urlencode($item['id']));
    ?>
    <a class="card" href="<?= h($href) ?>">
      <div class="card-badges">
        <?= platform_badge($item['platform']) ?>
        <span class="card-format"><?= h(label_for(FORMATS, $item['format'])) ?></span>
      </div>
      <div class="card-title"><?= h($item['title'] !== '' ? $item['title'] : 'Untitled') ?></div>
      <?php if (!empty($item['hook'])): ?>
        <div class="card-hook"><?= h(mb_strimwidth($item['hook'], 0, 120, '…')) ?></div>
      <?php endif; ?>
      <div class="card-meta">
        <?= status_badge($item['status']) ?>
        <?= priority_badge($item['priority']) ?>
      </div>
      <?php if (!empty($item['tags'])): ?>
        <div class="card-tags">
          <?php foreach (array_slice($item['tags'], 0, 4) as $t): ?>
            <span class="tag">#<?= h($t) ?></span>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
      <div class="card-foot">
        <?php if (!empty($item['scheduled_at']) && $item['status'] === 'scheduled'): ?>
          <span>📅 <?= h(fmt_date($item['scheduled_at'])) ?></span>
        <?php elseif (!empty($item['published_at'])): ?>
          <span>✔ Posted <?= h(fmt_date($item['published_at'])) ?></span>
        <?php else: ?>
          <span><?= h(time_ago($item['updated_at'])) ?></span>
        <?php endif; ?>
        <?php if (!empty($item['metrics'])): ?>
          <span class="card-views"><?= h(fmt_num((int) $item['metrics']['views'])) ?> views</span>
        <?php endif; ?>
      </div>
    </a>
    <?php
}

/** Render a grid of content cards, or an empty state. */
function content_grid(array $items, string $emptyMsg): void
{
    if (!$items) {
        empty_state($emptyMsg, '+ New content', base_url('edit.php'));
        return;
    }
    echo '<div class="grid">';
    foreach ($items as $it) {
        content_card($it);
    }
    echo '</div>';
}

/** A simple list-view page: header + count + card grid. */
function render_list_view(string $title, string $active, array $listOpts, string $emptyMsg, string $lead = ''): void
{
    require_login();
    $items = content_list($listOpts);
    layout_header($title, $active);
    echo '<div class="section-head"><h2>' . h($title) . '</h2><span class="count">' . count($items) . '</span></div>';
    if ($lead !== '') {
        echo '<p class="subtle" style="margin-top:-8px;margin-bottom:18px">' . h($lead) . '</p>';
    }
    content_grid($items, $emptyMsg);
    layout_footer();
}

/** Empty-state block. */
function empty_state(string $msg, ?string $ctaLabel = null, ?string $ctaHref = null): void
{
    ?>
    <div class="empty">
      <div class="empty-mark">✳</div>
      <p><?= h($msg) ?></p>
      <?php if ($ctaLabel && $ctaHref): ?>
        <a class="btn" href="<?= h($ctaHref) ?>"><?= h($ctaLabel) ?></a>
      <?php endif; ?>
    </div>
    <?php
}
