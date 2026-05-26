<?php
/**
 * Grades Guru — Admin: Clients List
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

// Handle status toggle
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['toggle_status'])) {
    if (validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $cid = (int)$_POST['client_id'];
        $pdo->prepare("UPDATE users SET status = IF(status='active','inactive','active') WHERE id = ? AND role = 'client'")->execute([$cid]);
        setFlash('success', 'Client status updated.');
    }
    redirect(APP_URL . '/admin/clients.php');
}

$search       = trim($_GET['q'] ?? '');
$filterStatus = $_GET['status'] ?? '';
$page         = max(1,(int)($_GET['page'] ?? 1));
$perPage      = 20;

$where  = ["u.role = 'client'"];
$params = [];
if ($search) { $where[] = "(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)"; $like="%$search%"; $params[]=$like;$params[]=$like;$params[]=$like; }
if ($filterStatus) { $where[] = "u.status = ?"; $params[] = $filterStatus; }
$wc = 'WHERE ' . implode(' AND ', $where);

$cstmt = $pdo->prepare("SELECT COUNT(*) FROM users u $wc");
$cstmt->execute($params);
$total = (int)$cstmt->fetchColumn();
$pg = paginate($total, $page, $perPage);

$stmtData = $pdo->prepare(
    "SELECT u.id, u.name, u.email, u.phone, u.referral_code, u.referral_count,
            u.discount_percentage, u.status, u.created_at,
            COUNT(t.id) AS order_count,
            COALESCE(SUM(t.amount_received),0) AS total_paid,
            COALESCE(SUM(t.final_client_pay - t.amount_received),0) AS total_due
     FROM users u
     LEFT JOIN tasks t ON t.client_id = u.id
     $wc
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT ?,?"
);
$stmtData->execute(array_merge($params, [$pg['offset'], $perPage]));
$clients = $stmtData->fetchAll();

$flash     = getFlash();
$csrfToken = getCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clients — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
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
    <a href="dashboard.php"   class="nav-link"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
    <a href="orders.php"      class="nav-link"><i class="fa-solid fa-list-check"></i> All Orders</a>
    <a href="new-order.php"   class="nav-link"><i class="fa-solid fa-plus-circle"></i> New Order</a>
    <div class="nav-label">People</div>
    <a href="clients.php"     class="nav-link active"><i class="fa-solid fa-users"></i> Clients</a>
    <a href="referrals.php"   class="nav-link"><i class="fa-solid fa-share-nodes"></i> Referrals</a>
    <a href="tl-accounts.php" class="nav-link"><i class="fa-solid fa-user-tie"></i> TL Accounts</a>
    <div class="nav-label">Finance</div>
    <a href="payments.php"    class="nav-link"><i class="fa-solid fa-money-bill-wave"></i> Payments</a>
    <a href="reports.php"     class="nav-link"><i class="fa-solid fa-chart-line"></i> Reports</a>
    <div class="nav-label">System</div>
    <a href="sheets-sync.php" class="nav-link"><i class="fa-brands fa-google"></i> Sheets Sync</a>
    <a href="settings.php"    class="nav-link"><i class="fa-solid fa-gear"></i> Settings</a>
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
      <div class="topbar-title"><h1>Clients</h1><p><?= $total ?> total clients</p></div>
    </div>
    <div class="topbar-right"><div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div></div>
  </header>
  <main class="page-content">

    <?php if($flash): ?>
    <div class="flash-msg <?= $flash['type'] ?>"><i class="fa-solid fa-circle-check"></i> <?= sanitize($flash['message']) ?></div>
    <?php endif; ?>

    <!-- Filter bar -->
    <form method="GET" style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;background:var(--card-bg);padding:1rem 1.25rem;border-radius:var(--radius);border:1px solid var(--border);box-shadow:var(--shadow-sm);">
      <input type="text" name="q" value="<?= sanitize($search) ?>" placeholder="Search name, email, phone…" class="form-control" style="flex:1;min-width:200px;padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);outline:none;font-family:var(--font-body);">
      <select name="status" style="padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);font-family:var(--font-body);outline:none;">
        <option value="">All Status</option>
        <option value="active" <?= $filterStatus==='active'?'selected':'' ?>>Active</option>
        <option value="inactive" <?= $filterStatus==='inactive'?'selected':'' ?>>Inactive</option>
      </select>
      <button type="submit" class="btn btn-navy"><i class="fa-solid fa-search"></i> Search</button>
      <?php if($search||$filterStatus): ?><a href="clients.php" class="btn btn-outline">Clear</a><?php endif; ?>
    </form>

    <!-- Table -->
    <div class="card">
      <div class="card-header">
        <h3>All Clients</h3>
        <span style="font-size:.8rem;color:var(--text-muted)">Page <?= $pg['page'] ?> of <?= $pg['total_pages'] ?></span>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Client</th><th>Phone</th><th>Referral Code</th>
              <th>Refs</th><th>Discount</th><th>Orders</th>
              <th>Total Paid</th><th>Amount Due</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
          <?php if(empty($clients)): ?>
          <tr><td colspan="10" class="text-center text-muted" style="padding:2rem">No clients found.</td></tr>
          <?php else: ?>
          <?php foreach($clients as $c): ?>
          <tr>
            <td>
              <div style="font-weight:600;color:var(--primary)"><?= sanitize($c['name']) ?></div>
              <div style="font-size:.75rem;color:var(--text-muted)"><?= sanitize($c['email']) ?></div>
            </td>
            <td><?= sanitize($c['phone'] ?? '—') ?></td>
            <td><span class="serial-no"><?= sanitize($c['referral_code']) ?></span></td>
            <td style="text-align:center"><?= (int)$c['referral_count'] ?></td>
            <td><?= $c['discount_percentage'] > 0 ? '<span class="badge badge-gold">'.number_format((float)$c['discount_percentage'],0).'%</span>' : '—' ?></td>
            <td style="text-align:center;font-weight:600"><?= (int)$c['order_count'] ?></td>
            <td style="font-weight:600;color:var(--success)"><?= formatCurrency((float)$c['total_paid']) ?></td>
            <td style="font-weight:600;color:<?= (float)$c['total_due']>0 ? 'var(--danger)' : 'var(--text-muted)' ?>">
              <?= formatCurrency((float)$c['total_due']) ?>
            </td>
            <td><?= $c['status']==='active'
              ? '<span class="badge badge-emerald">Active</span>'
              : '<span class="badge badge-gray">Inactive</span>' ?></td>
            <td style="white-space:nowrap">
              <a href="client-detail.php?id=<?= $c['id'] ?>" class="btn btn-sm btn-outline">View</a>
              <form method="POST" style="display:inline;" onsubmit="return confirm('Toggle status?')">
                <?= csrfField() ?>
                <input type="hidden" name="toggle_status" value="1">
                <input type="hidden" name="client_id"    value="<?= $c['id'] ?>">
                <button type="submit" class="btn btn-sm <?= $c['status']==='active' ? 'btn-danger' : 'btn-emerald' ?>" style="margin-left:4px;">
                  <?= $c['status']==='active' ? 'Disable' : 'Enable' ?>
                </button>
              </form>
            </td>
          </tr>
          <?php endforeach; ?>
          <?php endif; ?>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <?php if($pg['total_pages'] > 1): ?>
      <div class="pagination">
        <?php for($p=1;$p<=$pg['total_pages'];$p++): ?>
        <a href="?q=<?= urlencode($search) ?>&status=<?= urlencode($filterStatus) ?>&page=<?= $p ?>"
           class="page-btn <?= $p===$pg['page']?'active':'' ?>"><?= $p ?></a>
        <?php endfor; ?>
      </div>
      <?php endif; ?>
    </div>

  </main>
</div>
</div>
<script>document.getElementById('hamburger').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));</script>
</body>
</html>
