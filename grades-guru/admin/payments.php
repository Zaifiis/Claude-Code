<?php
/**
 * Grades Guru — Admin: Payment Log
 */
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

requireLogin();
requireRole('admin');
$user = getCurrentUser();
$pdo  = getPDO();

$search    = trim($_GET['q']       ?? '');
$filterFrom= $_GET['date_from']   ?? '';
$filterTo  = $_GET['date_to']     ?? '';
$filterMethod = $_GET['method']   ?? '';
$page      = max(1,(int)($_GET['page'] ?? 1));
$perPage   = 25;

$where  = [];
$params = [];
if ($search) {
    $where[] = "(u.name LIKE ? OR t.serial_number LIKE ?)";
    $like = "%$search%"; $params[]=$like; $params[]=$like;
}
if ($filterFrom)   { $where[] = "p.payment_date >= ?"; $params[] = $filterFrom; }
if ($filterTo)     { $where[] = "p.payment_date <= ?"; $params[] = $filterTo; }
if ($filterMethod) { $where[] = "p.payment_method = ?"; $params[] = $filterMethod; }
$wc = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$cstmt = $pdo->prepare("SELECT COUNT(*) FROM payments p JOIN users u ON u.id=p.client_id JOIN tasks t ON t.id=p.task_id $wc");
$cstmt->execute($params);
$total = (int)$cstmt->fetchColumn();

$sumStmt = $pdo->prepare("SELECT COALESCE(SUM(p.amount),0) FROM payments p JOIN users u ON u.id=p.client_id JOIN tasks t ON t.id=p.task_id $wc");
$sumStmt->execute($params);
$totalAmount = (float)$sumStmt->fetchColumn();

$pg = paginate($total, $page, $perPage);

$stmt = $pdo->prepare(
    "SELECT p.id, p.amount, p.payment_method, p.payment_date, p.notes,
            u.name AS client_name, t.serial_number, t.task_name,
            a.name AS recorded_by_name
     FROM payments p
     JOIN users u ON u.id = p.client_id
     JOIN tasks t ON t.id = p.task_id
     JOIN users a ON a.id = p.recorded_by
     $wc
     ORDER BY p.payment_date DESC, p.created_at DESC
     LIMIT ?,?"
);
$stmt->execute(array_merge($params, [$pg['offset'], $perPage]));
$payments = $stmt->fetchAll();

// Methods for filter
$methods = ['JazzCash','Easypaisa','Bank Transfer','Cash','Other'];

// Month total
$monthTotal = (float)$pdo->query(
    "SELECT COALESCE(SUM(amount),0) FROM payments WHERE MONTH(payment_date)=MONTH(CURDATE()) AND YEAR(payment_date)=YEAR(CURDATE())"
)->fetchColumn();

$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payments — <?= APP_NAME ?></title>
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
    <a href="referrals.php" class="nav-link"><i class="fa-solid fa-share-nodes"></i> Referrals</a>
    <a href="tl-accounts.php" class="nav-link"><i class="fa-solid fa-user-tie"></i> TL Accounts</a>
    <div class="nav-label">Finance</div>
    <a href="payments.php" class="nav-link active"><i class="fa-solid fa-money-bill-wave"></i> Payments</a>
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
      <div class="topbar-title"><h1>Payments</h1><p>Payment history &amp; tracking</p></div>
    </div>
    <div class="topbar-right">
      <a href="new-payment.php" class="btn btn-gold btn-sm"><i class="fa-solid fa-plus"></i> Log Payment</a>
      <div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>
  <main class="page-content">

    <?php if($flash): ?>
    <div class="flash-msg <?= $flash['type'] ?>"><i class="fa-solid fa-circle-check"></i> <?= sanitize($flash['message']) ?></div>
    <?php endif; ?>

    <!-- Stats -->
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
      <div class="stat-card">
        <div class="stat-icon emerald"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="stat-info"><div class="stat-label">This Month Received</div><div class="stat-value success"><?= formatCurrency($monthTotal) ?></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon navy"><i class="fa-solid fa-list"></i></div>
        <div class="stat-info"><div class="stat-label">Matching Records</div><div class="stat-value"><?= $total ?></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon gold"><i class="fa-solid fa-sigma"></i></div>
        <div class="stat-info"><div class="stat-label">Filtered Total</div><div class="stat-value"><?= formatCurrency($totalAmount) ?></div></div>
      </div>
    </div>

    <!-- Filters -->
    <form method="GET" style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;background:var(--card-bg);padding:1rem 1.25rem;border-radius:var(--radius);border:1px solid var(--border);box-shadow:var(--shadow-sm);">
      <input type="text" name="q" value="<?= sanitize($search) ?>" placeholder="Search client or serial…"
             style="flex:1;min-width:180px;padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);outline:none;font-family:var(--font-body);">
      <input type="date" name="date_from" value="<?= sanitize($filterFrom) ?>"
             style="padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);outline:none;font-family:var(--font-body);">
      <input type="date" name="date_to" value="<?= sanitize($filterTo) ?>"
             style="padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);outline:none;font-family:var(--font-body);">
      <select name="method" style="padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);outline:none;font-family:var(--font-body);">
        <option value="">All Methods</option>
        <?php foreach($methods as $m): ?>
        <option value="<?= $m ?>" <?= $filterMethod===$m?'selected':'' ?>><?= $m ?></option>
        <?php endforeach; ?>
      </select>
      <button type="submit" class="btn btn-navy"><i class="fa-solid fa-search"></i> Filter</button>
      <?php if($search||$filterFrom||$filterTo||$filterMethod): ?>
      <a href="payments.php" class="btn btn-outline">Clear</a>
      <?php endif; ?>
    </form>

    <!-- Table -->
    <div class="card">
      <div class="card-header">
        <h3>Payment Records</h3>
        <span style="font-size:.8rem;color:var(--text-muted)"><?= $total ?> records found</span>
      </div>
      <?php if(empty($payments)): ?>
      <div class="empty-state"><i class="fa-solid fa-receipt"></i><p>No payments found.</p></div>
      <?php else: ?>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Client</th><th>Task</th><th>Amount</th><th>Method</th><th>Recorded By</th><th>Notes</th></tr></thead>
          <tbody>
          <?php foreach($payments as $p): ?>
          <tr>
            <td><?= formatDate($p['payment_date']) ?></td>
            <td style="font-weight:600"><?= sanitize($p['client_name']) ?></td>
            <td>
              <a href="order-detail.php?id=<?= $p['task_id'] ?? '' ?>" style="color:var(--primary);font-size:.85rem">
                <?= sanitize(substr($p['task_name'],0,35)) ?>
              </a>
              <div class="serial-no"><?= sanitize($p['serial_number']) ?></div>
            </td>
            <td style="font-weight:700;color:var(--success)"><?= formatCurrency((float)$p['amount']) ?></td>
            <td><span class="badge badge-navy"><?= sanitize($p['payment_method']) ?></span></td>
            <td style="font-size:.8rem;color:var(--text-muted)"><?= sanitize($p['recorded_by_name']) ?></td>
            <td style="font-size:.8rem;color:var(--text-muted)"><?= sanitize(substr($p['notes'] ?? '',0,40)) ?></td>
          </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <?php if($pg['total_pages']>1): ?>
      <div class="pagination">
        <?php for($p2=1;$p2<=$pg['total_pages'];$p2++): ?>
        <a href="?q=<?= urlencode($search) ?>&date_from=<?= urlencode($filterFrom) ?>&date_to=<?= urlencode($filterTo) ?>&method=<?= urlencode($filterMethod) ?>&page=<?= $p2 ?>"
           class="page-btn <?= $p2===$pg['page']?'active':'' ?>"><?= $p2 ?></a>
        <?php endfor; ?>
      </div>
      <?php endif; ?>
      <?php endif; ?>
    </div>

  </main>
</div>
</div>
<script>document.getElementById('hamburger').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));</script>
</body>
</html>
