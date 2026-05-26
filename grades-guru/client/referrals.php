<?php
/**
 * Grades Guru — Client Referrals Page
 */
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';
require_once '../includes/referral.php';

requireLogin();
requireRole('client');
$user = getCurrentUser();
$pdo  = getPDO();
$uid  = (int)$user['id'];

// Fresh user data
$stmt = $pdo->prepare('SELECT referral_code, referral_count, discount_percentage FROM users WHERE id = ?');
$stmt->execute([$uid]);
$dbUser = $stmt->fetch();
$referralCode  = $dbUser['referral_code'];
$referralCount = (int)$dbUser['referral_count'];
$discountPct   = (float)$dbUser['discount_percentage'];
$shareLink     = APP_URL . '/signup.php?ref=' . urlencode($referralCode);

// My referrals list
$referrals = getUserReferrals($pdo, $uid);

// Spin history
$spins = $pdo->prepare('SELECT spin_type, result, discount_value, used, created_at FROM spin_results WHERE user_id = ? ORDER BY created_at DESC');
$spins->execute([$uid]);
$spinHistory = $spins->fetchAll();

// Tier settings
$bonus1 = (float)(getSetting($pdo, 'referral_bonus_1') ?? 10);
$bonus2 = (float)(getSetting($pdo, 'referral_bonus_2') ?? 25);

$notifications = getUnreadNotifications($pdo, $uid);
$unreadCount   = count($notifications);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referrals — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
</head>
<body>
<div class="layout">

<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo">
    <a href="dashboard.php"><div class="logo-icon">GG</div><?= APP_NAME ?></a>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-label">Main</div>
    <a href="dashboard.php" class="nav-link"><i class="fa-solid fa-house"></i> Dashboard</a>
    <a href="orders.php"    class="nav-link"><i class="fa-solid fa-file-lines"></i> My Orders</a>
    <div class="nav-label">Rewards</div>
    <a href="referrals.php" class="nav-link active"><i class="fa-solid fa-users"></i> Referrals</a>
    <a href="spin.php"      class="nav-link"><i class="fa-solid fa-circle-notch"></i> Spin Wheel</a>
  </nav>
  <div class="sidebar-user">
    <div class="sidebar-user-info">
      <div class="user-avatar-sm"><?= strtoupper(substr($user['name'],0,1)) ?></div>
      <div><div class="sidebar-user-name"><?= sanitize($user['name']) ?></div>
      <div class="sidebar-user-email"><?= sanitize($user['email']) ?></div></div>
    </div>
    <a href="../logout.php" class="logout-link"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</a>
  </div>
</aside>

<div class="main-wrapper">
  <header class="topbar">
    <div style="display:flex;align-items:center;gap:12px;">
      <button class="hamburger" id="hamburger"><i class="fa-solid fa-bars"></i></button>
      <div class="topbar-title"><h1>Referral Program</h1><p>Share &amp; earn discounts</p></div>
    </div>
    <div class="topbar-right">
      <button class="topbar-btn" id="notifBtn"><i class="fa-solid fa-bell"></i>
        <?php if($unreadCount): ?><span class="notif-badge"><?= min($unreadCount,9) ?></span><?php endif; ?>
      </button>
      <div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>

  <main class="page-content">

    <!-- Discount status banner -->
    <?php if($discountPct > 0): ?>
    <div class="discount-banner">
      <i class="fa-solid fa-tag"></i>
      <div>
        <h4><?= number_format($discountPct) ?>% Discount Active</h4>
        <p>This discount will be applied automatically on your next order.</p>
      </div>
    </div>
    <?php endif; ?>

    <!-- Referral Code Card -->
    <div class="card">
      <div class="card-header">
        <h3><i class="fa-solid fa-share-nodes" style="color:var(--accent-dark);margin-right:8px"></i> Your Referral Code</h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start;">
          <div>
            <div class="code-label">Your unique referral code</div>
            <div class="code-value"><?= sanitize($referralCode) ?></div>
            <div class="copy-row">
              <span class="copy-text" id="codeText"><?= sanitize($referralCode) ?></span>
              <button class="copy-btn" onclick="copyText('codeText',this)"><i class="fa-regular fa-copy"></i> Copy Code</button>
            </div>
            <div class="copy-row" style="margin-top:8px;">
              <span class="copy-text" id="linkText" style="font-size:.75rem;"><?= sanitize($shareLink) ?></span>
              <button class="copy-btn" onclick="copyText('linkText',this)"><i class="fa-solid fa-link"></i> Copy Link</button>
            </div>
          </div>
          <div>
            <div class="progress-header" style="margin-bottom:6px;">
              <span style="font-weight:700;font-size:.875rem;"><?= $referralCount ?>/2 Friends Referred</span>
            </div>
            <div class="progress-bar-bg" style="margin-bottom:12px;">
              <div class="progress-bar-fill" style="width:<?= min(100,($referralCount/2)*100) ?>%"></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-top:1rem;">
              <div style="padding:.875rem;background:<?= $referralCount >= 1 ? 'var(--success-light)' : 'var(--bg)' ?>;border-radius:var(--radius-sm);border:1.5px solid <?= $referralCount >= 1 ? 'var(--success)' : 'var(--border)' ?>;text-align:center;">
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px;">Tier 1 — 1 Friend</div>
                <div style="font-size:1.375rem;font-weight:800;color:var(--primary);"><?= number_format($bonus1) ?>%</div>
                <div style="font-size:.7rem;color:var(--text-muted);">Discount for both</div>
                <?php if($referralCount >= 1): ?>
                <div style="font-size:.7rem;color:var(--success);font-weight:600;margin-top:4px;"><i class="fa-solid fa-check"></i> Earned!</div>
                <?php endif; ?>
              </div>
              <div style="padding:.875rem;background:<?= $referralCount >= 2 ? 'var(--success-light)' : 'var(--bg)' ?>;border-radius:var(--radius-sm);border:1.5px solid <?= $referralCount >= 2 ? 'var(--success)' : 'var(--border)' ?>;text-align:center;">
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px;">Tier 2 — 2 Friends</div>
                <div style="font-size:1.375rem;font-weight:800;color:var(--primary);"><?= number_format($bonus2) ?>%</div>
                <div style="font-size:.7rem;color:var(--text-muted);">Discount for all</div>
                <?php if($referralCount >= 2): ?>
                <div style="font-size:.7rem;color:var(--success);font-weight:600;margin-top:4px;"><i class="fa-solid fa-check"></i> Earned!</div>
                <?php endif; ?>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- How it works -->
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-circle-question" style="color:var(--primary);margin-right:8px"></i> How It Works</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;text-align:center;">
          <?php $steps3 = [
            ['fa-share-from-square','Share Your Code','Share your unique referral link or code with a friend.'],
            ['fa-user-plus','Friend Signs Up','Your friend creates an account using your code.'],
            ['fa-tag','Both Get Discounts','Admin confirms the referral and you both get discounts!'],
          ]; foreach($steps3 as $i => [$icon,$title,$desc]): ?>
          <div>
            <div style="width:56px;height:56px;background:rgba(244,196,48,0.12);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:1.375rem;color:var(--primary);">
              <i class="fa-solid <?= $icon ?>"></i>
            </div>
            <h4 style="font-size:.9375rem;margin-bottom:.375rem;"><?= $title ?></h4>
            <p style="font-size:.8125rem;color:var(--text-muted);line-height:1.6;"><?= $desc ?></p>
          </div>
          <?php endforeach; ?>
        </div>
      </div>
    </div>

    <!-- My referrals table -->
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-users" style="color:var(--primary);margin-right:8px"></i> My Referrals (<?= count($referrals) ?>)</h3></div>
      <?php if(empty($referrals)): ?>
      <div class="empty-state"><i class="fa-solid fa-user-plus"></i><p>No referrals yet. Share your code to get started!</p></div>
      <?php else: ?>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Friend</th><th>Joined</th><th>Status</th><th>Discount</th></tr></thead>
          <tbody>
          <?php foreach($referrals as $r):
            // Mask name: "A*** B***"
            $parts = explode(' ', trim($r['referred_name']));
            $masked = implode(' ', array_map(fn($p) => $p[0] . str_repeat('*', max(2,strlen($p)-1)), $parts));
          ?>
          <tr>
            <td><span style="font-weight:600"><?= sanitize($masked) ?></span></td>
            <td><?= formatDate($r['joined_at']) ?></td>
            <td><?= $r['status']==='confirmed'
              ? '<span class="badge badge-emerald"><i class="fa-solid fa-check"></i> Confirmed</span>'
              : '<span class="badge badge-orange"><i class="fa-solid fa-clock"></i> Pending</span>' ?></td>
            <td><?= $r['discount_given'] ? '<span class="badge badge-gold">✓ Applied</span>' : '<span class="badge badge-gray">Pending</span>' ?></td>
          </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <?php endif; ?>
    </div>

    <!-- Spin history -->
    <?php if(!empty($spinHistory)): ?>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-circle-notch" style="color:var(--primary);margin-right:8px"></i> Spin History</h3></div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Type</th><th>Result</th><th>Discount</th></tr></thead>
          <tbody>
          <?php foreach($spinHistory as $s): ?>
          <tr>
            <td><?= formatDate($s['created_at']) ?></td>
            <td><span class="badge badge-navy"><?= ucfirst($s['spin_type']) ?></span></td>
            <td><?= sanitize($s['result']) ?></td>
            <td><?= $s['discount_value'] > 0 ? '<span class="badge badge-gold">'.number_format((float)$s['discount_value']).'%</span>' : '—' ?></td>
          </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
    <?php endif; ?>

  </main>
</div>
</div>
<script src="../assets/js/dashboard.js"></script>
<a href="https://wa.me/<?= WHATSAPP_NUMBER ?>" target="_blank" rel="noopener"
   style="position:fixed;bottom:1.5rem;right:1.5rem;width:56px;height:56px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.75rem;box-shadow:0 4px 16px rgba(0,0,0,0.25);z-index:999;text-decoration:none;"
   title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
</body>
</html>
