<?php
/**
 * Grades Guru — Admin: Referral Management
 */
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';
require_once '../includes/referral.php';

requireLogin();
requireRole('admin');
$user = getCurrentUser();
$pdo  = getPDO();

// Handle confirm referral action
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm_referral'])) {
    if (validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $rid    = (int)$_POST['referral_id'];
        $result = confirmReferral($pdo, $rid);
        setFlash($result['success'] ? 'success' : 'error', $result['message']);
    }
    redirect(APP_URL . '/admin/referrals.php');
}

$filterStatus = $_GET['status'] ?? '';
$where  = $filterStatus ? "WHERE r.status = ?" : '';
$params = $filterStatus ? [$filterStatus] : [];

$stmt = $pdo->prepare(
    "SELECT r.id, r.referral_code, r.status, r.discount_given, r.created_at,
            u1.name AS referrer_name, u1.email AS referrer_email,
            u2.name AS referred_name, u2.email AS referred_email,
            u2.created_at AS joined_at
     FROM referrals r
     JOIN users u1 ON u1.id = r.referrer_id
     JOIN users u2 ON u2.id = r.referred_id
     $where
     ORDER BY r.created_at DESC"
);
$stmt->execute($params);
$referrals = $stmt->fetchAll();

// Stats
$statsRow = $pdo->query(
    "SELECT
      COUNT(*) AS total,
      SUM(status='pending') AS pending,
      SUM(status='confirmed') AS confirmed,
      SUM(discount_given=1) AS discounts_given
     FROM referrals"
)->fetch();

$flash     = getFlash();
$csrfToken = getCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referrals — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
</head>
<body>
<div class="layout">
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo"><a href="dashboard.php"><div class="logo-icon">GG</div><?= APP_NAME ?></a></div>
  <nav class="sidebar-nav">
    <div class="nav-label">Main</div>
    <a href="dashboard.php" class="nav-link"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
    <a href="orders.php" class="nav-link"><i class="fa-solid fa-list-check"></i> All Orders</a>
    <a href="new-order.php" class="nav-link"><i class="fa-solid fa-plus-circle"></i> New Order</a>
    <div class="nav-label">People</div>
    <a href="clients.php" class="nav-link"><i class="fa-solid fa-users"></i> Clients</a>
    <a href="referrals.php" class="nav-link active"><i class="fa-solid fa-share-nodes"></i> Referrals</a>
    <a href="tl-accounts.php" class="nav-link"><i class="fa-solid fa-user-tie"></i> TL Accounts</a>
    <div class="nav-label">Finance</div>
    <a href="payments.php" class="nav-link"><i class="fa-solid fa-money-bill-wave"></i> Payments</a>
    <a href="reports.php" class="nav-link"><i class="fa-solid fa-chart-line"></i> Reports</a>
    <div class="nav-label">System</div>
    <a href="sheets-sync.php" class="nav-link"><i class="fa-brands fa-google"></i> Sheets Sync</a>
    <a href="settings.php" class="nav-link"><i class="fa-solid fa-gear"></i> Settings</a>
  </nav>
  <div class="sidebar-user">
    <div class="sidebar-user-info">
      <div class="user-avatar-sm"><?= strtoupper(substr($user['name'],0,1)) ?></div>
      <div><div class="sidebar-user-name"><?= sanitize($user['name']) ?></div><div class="sidebar-user-email">Administrator</div></div>
    </div>
    <a href="../logout.php" class="logout-link"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</a>
  </div>
</aside>
<div class="main-wrapper">
  <header class="topbar">
    <div style="display:flex;align-items:center;gap:12px;">
      <button class="hamburger" id="hamburger"><i class="fa-solid fa-bars"></i></button>
      <div class="topbar-title"><h1>Referrals</h1><p>Manage and confirm referrals</p></div>
    </div>
    <div class="topbar-right"><div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div></div>
  </header>
  <main class="page-content">

    <?php if($flash): ?>
    <div class="flash-msg <?= $flash['type'] ?>"><i class="fa-solid fa-circle-check"></i> <?= sanitize($flash['message']) ?></div>
    <?php endif; ?>

    <!-- Stats -->
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);">
      <?php $statsData=[
        ['Total Referrals',    $statsRow['total'],          'navy',   'fa-users'],
        ['Pending Confirmation',$statsRow['pending'],       'gold',   'fa-clock'],
        ['Confirmed',          $statsRow['confirmed'],      'emerald','fa-circle-check'],
        ['Discounts Applied',  $statsRow['discounts_given'],'blue',  'fa-tag'],
      ]; foreach($statsData as [$label,$val,$color,$icon]): ?>
      <div class="stat-card">
        <div class="stat-icon <?= $color ?>"><i class="fa-solid <?= $icon ?>"></i></div>
        <div class="stat-info">
          <div class="stat-label"><?= $label ?></div>
          <div class="stat-value"><?= (int)$val ?></div>
        </div>
      </div>
      <?php endforeach; ?>
    </div>

    <!-- Filter -->
    <div style="display:flex;gap:.75rem;">
      <a href="referrals.php" class="btn <?= !$filterStatus?'btn-navy':'btn-outline' ?>">All</a>
      <a href="referrals.php?status=pending" class="btn <?= $filterStatus==='pending'?'btn-gold':'btn-outline' ?>">Pending</a>
      <a href="referrals.php?status=confirmed" class="btn <?= $filterStatus==='confirmed'?'btn-emerald':'btn-outline' ?>">Confirmed</a>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-header"><h3>Referral List (<?= count($referrals) ?>)</h3></div>
      <?php if(empty($referrals)): ?>
      <div class="empty-state"><i class="fa-solid fa-share-nodes"></i><p>No referrals found.</p></div>
      <?php else: ?>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Referrer</th><th>New Client</th><th>Referral Code</th><th>Date</th><th>Status</th><th>Discount</th><th>Action</th></tr></thead>
          <tbody>
          <?php foreach($referrals as $r): ?>
          <tr>
            <td>
              <div style="font-weight:600"><?= sanitize($r['referrer_name']) ?></div>
              <div style="font-size:.75rem;color:var(--text-muted)"><?= sanitize($r['referrer_email']) ?></div>
            </td>
            <td>
              <div style="font-weight:600"><?= sanitize($r['referred_name']) ?></div>
              <div style="font-size:.75rem;color:var(--text-muted)"><?= sanitize($r['referred_email']) ?></div>
            </td>
            <td><span class="serial-no"><?= sanitize($r['referral_code']) ?></span></td>
            <td><?= formatDate($r['created_at']) ?></td>
            <td><?= $r['status']==='confirmed'
              ? '<span class="badge badge-emerald"><i class="fa-solid fa-check"></i> Confirmed</span>'
              : '<span class="badge badge-orange"><i class="fa-solid fa-clock"></i> Pending</span>' ?></td>
            <td><?= $r['discount_given'] ? '<span class="badge badge-gold">Applied</span>' : '<span class="badge badge-gray">—</span>' ?></td>
            <td>
              <?php if($r['status']==='pending'): ?>
              <form method="POST" style="display:inline;" onsubmit="return confirm('Confirm this referral and apply discounts?')">
                <?= csrfField() ?>
                <input type="hidden" name="confirm_referral" value="1">
                <input type="hidden" name="referral_id"      value="<?= $r['id'] ?>">
                <button type="submit" class="btn btn-sm btn-emerald"><i class="fa-solid fa-check"></i> Confirm</button>
              </form>
              <?php else: ?>
              <span style="font-size:.8rem;color:var(--text-muted)">Done</span>
              <?php endif; ?>
            </td>
          </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <?php endif; ?>
    </div>

  </main>
</div>
</div>
<script>document.getElementById('hamburger').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));</script>
</body>
</html>
