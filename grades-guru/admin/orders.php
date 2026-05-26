<?php
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';
requireLogin();
requireRole('admin');
$user = getCurrentUser();
$pdo  = getPDO();

// ── CSV Export ────────────────────────────────────────────────────────────────
$exportCsv = isset($_GET['export']) && $_GET['export'] === 'csv';

// ── Filters ───────────────────────────────────────────────────────────────────
$search        = trim($_GET['search']   ?? '');
$filterStatus  = $_GET['status']        ?? '';
$filterPayment = $_GET['payment']       ?? '';
$filterType    = $_GET['type']          ?? '';
$filterDateFrom= $_GET['date_from']     ?? '';
$filterDateTo  = $_GET['date_to']       ?? '';
$filterTl      = (int)($_GET['tl_id']  ?? 0);
$page          = max(1,(int)($_GET['page'] ?? 1));
$perPage       = 20;

// Build WHERE clause
$where  = [];
$params = [];

if ($search !== '') {
    $where[]  = "(t.serial_number LIKE ? OR t.task_name LIKE ? OR u.name LIKE ?)";
    $like     = "%{$search}%";
    $params[] = $like; $params[] = $like; $params[] = $like;
}
if ($filterStatus !== '') { $where[] = "t.status = ?"; $params[] = $filterStatus; }
if ($filterPayment !== '') { $where[] = "t.payment_status = ?"; $params[] = $filterPayment; }
if ($filterType !== '') { $where[] = "t.task_type = ?"; $params[] = $filterType; }
if ($filterDateFrom !== '') { $where[] = "t.deadline >= ?"; $params[] = $filterDateFrom; }
if ($filterDateTo !== '')   { $where[] = "t.deadline <= ?"; $params[] = $filterDateTo; }
if ($filterTl > 0) { $where[] = "t.tl_id = ?"; $params[] = $filterTl; }

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Count
$countStmt = $pdo->prepare(
    "SELECT COUNT(*) FROM tasks t JOIN users u ON u.id=t.client_id $whereClause"
);
$countStmt->execute($params);
$totalRows = (int)$countStmt->fetchColumn();
$pg = paginate($totalRows, $page, $perPage);

// Totals row
$totalsStmt = $pdo->prepare(
    "SELECT
       COALESCE(SUM(t.final_client_pay),0)              AS total_pay,
       COALESCE(SUM(t.writer_pay),0)                    AS total_writer,
       COALESCE(SUM(t.tl_pay),0)                        AS total_tl,
       COALESCE(SUM(t.profit),0)                        AS total_profit,
       COALESCE(SUM(t.amount_received),0)               AS total_received,
       COALESCE(SUM(t.final_client_pay - t.amount_received),0) AS total_due
     FROM tasks t JOIN users u ON u.id=t.client_id $whereClause"
);
$totalsStmt->execute($params);
$totals = $totalsStmt->fetch();

// Fetch paginated rows (or all for CSV)
if ($exportCsv) {
    $query = $pdo->prepare(
        "SELECT t.*, u.name AS client_name, tl.name AS tl_name
         FROM tasks t
         JOIN users u ON u.id=t.client_id
         LEFT JOIN users tl ON tl.id=t.tl_id
         $whereClause
         ORDER BY t.created_at DESC"
    );
    $query->execute($params);
    $orders = $query->fetchAll();
} else {
    $dataParams = array_merge($params, [$pg['offset'], $perPage]);
    $query = $pdo->prepare(
        "SELECT t.*, u.name AS client_name, tl.name AS tl_name
         FROM tasks t
         JOIN users u ON u.id=t.client_id
         LEFT JOIN users tl ON tl.id=t.tl_id
         $whereClause
         ORDER BY t.created_at DESC
         LIMIT ?,?"
    );
    $query->execute($dataParams);
    $orders = $query->fetchAll();
}

// ── CSV output ────────────────────────────────────────────────────────────────
if ($exportCsv) {
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="orders_' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Serial','Client','Task','Type','TL','Deadline','Words','Client Pay','Writer Pay','TL Pay','Profit','Discount%','Final Pay','Payment Status','Task Status','Sheets Synced']);
    foreach ($orders as $o) {
        fputcsv($out, [
            $o['serial_number'], $o['client_name'], $o['task_name'], $o['task_type'],
            $o['tl_name'] ?? '', $o['deadline'], $o['word_count'],
            $o['client_pay'], $o['writer_pay'], $o['tl_pay'], $o['profit'],
            $o['discount_applied'], $o['final_client_pay'],
            $o['payment_status'], $o['status'], $o['sheets_synced'] ? 'Yes' : 'No'
        ]);
    }
    fclose($out);
    exit;
}

// ── TL list for filter ────────────────────────────────────────────────────────
$tlList = $pdo->query("SELECT id, name FROM users WHERE role='tl' AND status='active' ORDER BY name")->fetchAll();

$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>All Orders — <?= APP_NAME ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="../assets/css/dashboard.css" />
<style>
.tbl-totals td { background:var(--navy); color:#fff; font-weight:700; font-size:.82rem; }
.sync-yes { color:var(--emerald); } .sync-no { color:var(--gray-400); }
.actions-cell a { display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:5px;font-size:.74rem;font-weight:600;text-decoration:none;margin-right:2px; }
.act-view { background:rgba(10,22,40,.07);color:var(--navy); }
.act-edit { background:rgba(244,196,48,.18);color:#7a5c00; }
</style>
</head>
<body>
<div class="layout">

<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo"><a href="dashboard.php"><span class="logo-icon"><i class="fa-solid fa-graduation-cap"></i></span><?= APP_NAME ?></a></div>
  <nav class="sidebar-nav">
    <div class="nav-label">Main</div>
    <a href="dashboard.php" class="nav-link"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
    <a href="orders.php"    class="nav-link active"><i class="fa-solid fa-list-check"></i> All Orders</a>
    <a href="new-order.php" class="nav-link"><i class="fa-solid fa-plus-circle"></i> New Order</a>
    <div class="nav-label">People</div>
    <a href="clients.php"   class="nav-link"><i class="fa-solid fa-users"></i> Clients</a>
    <a href="referrals.php" class="nav-link"><i class="fa-solid fa-share-nodes"></i> Referrals</a>
    <a href="tl-accounts.php" class="nav-link"><i class="fa-solid fa-user-tie"></i> TL Accounts</a>
    <div class="nav-label">Finance</div>
    <a href="payments.php"  class="nav-link"><i class="fa-solid fa-money-bill-wave"></i> Payments</a>
    <a href="reports.php"   class="nav-link"><i class="fa-solid fa-chart-line"></i> Reports</a>
    <div class="nav-label">System</div>
    <a href="sheets-sync.php" class="nav-link"><i class="fa-brands fa-google"></i> Sheets Sync</a>
    <a href="settings.php"  class="nav-link"><i class="fa-solid fa-gear"></i> Settings</a>
  </nav>
  <div class="sidebar-user">
    <div class="sidebar-user-info">
      <div class="user-avatar-sm"><?= strtoupper(substr($user['name'],0,1)) ?></div>
      <div><div class="sidebar-user-name"><?= sanitize($user['name']) ?></div><div class="sidebar-user-email"><?= sanitize($user['email']) ?></div></div>
    </div>
    <a href="../logout.php" class="logout-link"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</a>
  </div>
</aside>

<div class="main-wrapper">
  <header class="topbar">
    <div style="display:flex;align-items:center;gap:12px">
      <button class="hamburger" onclick="document.getElementById('sidebar').classList.toggle('open')"><i class="fa-solid fa-bars"></i></button>
      <div class="topbar-title"><h1>All Orders</h1><p><?= $totalRows ?> total orders</p></div>
    </div>
    <div class="topbar-right">
      <a href="new-order.php" class="btn btn-gold btn-sm"><i class="fa-solid fa-plus"></i> New Order</a>
      <div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>

  <main class="page-content">
    <?php if($flash): ?>
    <div class="flash-msg <?= sanitize($flash['type']) ?>"><i class="fa-solid fa-circle-check"></i> <?= sanitize($flash['message']) ?></div>
    <?php endif; ?>

    <!-- Filter Bar -->
    <form method="GET" action="" class="filter-bar">
      <div class="filter-group search">
        <label>Search</label>
        <input type="text" name="search" placeholder="Serial, task name, client..." value="<?= sanitize($search) ?>" />
      </div>
      <div class="filter-group">
        <label>Task Status</label>
        <select name="status">
          <option value="">All Statuses</option>
          <?php foreach(['pending','in_progress','completed','delivered'] as $s): ?>
          <option value="<?= $s ?>" <?= $filterStatus===$s?'selected':'' ?>><?= ucwords(str_replace('_',' ',$s)) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="filter-group">
        <label>Payment</label>
        <select name="payment">
          <option value="">All</option>
          <?php foreach(['due','partial','paid'] as $p): ?>
          <option value="<?= $p ?>" <?= $filterPayment===$p?'selected':'' ?>><?= ucfirst($p) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="filter-group">
        <label>Type</label>
        <select name="type">
          <option value="">All</option>
          <option value="technical" <?= $filterType==='technical'?'selected':'' ?>>Technical</option>
          <option value="simple"    <?= $filterType==='simple'?'selected':'' ?>>Simple</option>
        </select>
      </div>
      <div class="filter-group">
        <label>TL</label>
        <select name="tl_id">
          <option value="0">All TLs</option>
          <?php foreach($tlList as $tl): ?>
          <option value="<?= (int)$tl['id'] ?>" <?= $filterTl===(int)$tl['id']?'selected':'' ?>><?= sanitize($tl['name']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="filter-group">
        <label>Deadline From</label>
        <input type="date" name="date_from" value="<?= sanitize($filterDateFrom) ?>" />
      </div>
      <div class="filter-group">
        <label>Deadline To</label>
        <input type="date" name="date_to" value="<?= sanitize($filterDateTo) ?>" />
      </div>
      <div class="filter-actions">
        <button type="submit" class="btn btn-navy btn-sm"><i class="fa-solid fa-filter"></i> Filter</button>
        <a href="orders.php" class="btn btn-outline btn-sm">Reset</a>
        <a href="?<?= http_build_query(array_merge($_GET,['export'=>'csv'])) ?>" class="btn btn-outline btn-sm"><i class="fa-solid fa-download"></i> CSV</a>
      </div>
    </form>

    <!-- Table -->
    <div class="card">
      <div class="table-wrapper">
        <table class="data-table" style="font-size:.8rem;">
          <thead>
            <tr>
              <th>#</th><th>Serial</th><th>Client</th><th>Task</th><th>Type</th>
              <th>TL</th><th>Deadline</th><th>Words</th>
              <th>Client Pay</th><th>Writer Pay</th><th>TL Pay</th><th>Profit</th>
              <th>Disc%</th><th>Final Pay</th><th>Payment</th><th>Status</th>
              <th>Synced</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <?php if(empty($orders)): ?>
            <tr><td colspan="18" class="empty-state"><i class="fa-solid fa-inbox"></i><p>No orders found.</p></td></tr>
            <?php else: ?>
            <?php $n = $pg['offset']+1; foreach($orders as $o): ?>
            <tr>
              <td style="color:var(--gray-400);font-size:.75rem"><?= $n++ ?></td>
              <td><span class="serial-no"><?= sanitize($o['serial_number']) ?></span></td>
              <td style="white-space:nowrap;font-weight:600;color:var(--navy)"><?= sanitize($o['client_name']) ?></td>
              <td class="task-name" style="max-width:160px"><?= sanitize($o['task_name']) ?></td>
              <td>
                <?php if($o['task_type']==='technical'): ?>
                <span class="badge badge-navy" style="font-size:.68rem">Tech</span>
                <?php else: ?>
                <span class="badge badge-gray" style="font-size:.68rem">Simple</span>
                <?php endif; ?>
              </td>
              <td style="white-space:nowrap;color:var(--gray-600)"><?= sanitize($o['tl_name'] ?? '—') ?></td>
              <td style="white-space:nowrap"><?= formatDate($o['deadline']) ?></td>
              <td><?= number_format((int)$o['word_count']) ?></td>
              <td><?= number_format((float)$o['client_pay'],2) ?></td>
              <td style="color:var(--red)"><?= number_format((float)$o['writer_pay'],2) ?></td>
              <td style="color:var(--red)"><?= number_format((float)$o['tl_pay'],2) ?></td>
              <td style="color:var(--emerald);font-weight:600"><?= number_format((float)$o['profit'],2) ?></td>
              <td><?= number_format((float)$o['discount_applied'],1) ?>%</td>
              <td style="font-weight:700"><?= number_format((float)$o['final_client_pay'],2) ?></td>
              <td>
                <?php $pc=['due'=>'badge-red','partial'=>'badge-orange','paid'=>'badge-emerald']; ?>
                <span class="badge <?= $pc[$o['payment_status']] ?? 'badge-gray' ?>" style="font-size:.68rem"><?= ucfirst($o['payment_status']) ?></span>
              </td>
              <td>
                <?php $sc=['pending'=>'badge-gray','in_progress'=>'badge-gold','completed'=>'badge-emerald','delivered'=>'badge-navy']; ?>
                <span class="badge <?= $sc[$o['status']] ?? 'badge-gray' ?>" style="font-size:.68rem"><?= ucwords(str_replace('_',' ',$o['status'])) ?></span>
              </td>
              <td class="text-center">
                <?php if($o['sheets_synced']): ?>
                <i class="fa-solid fa-check sync-yes" title="Synced"></i>
                <?php else: ?>
                <i class="fa-solid fa-xmark sync-no" title="Not synced"></i>
                <?php endif; ?>
              </td>
              <td class="actions-cell">
                <a href="order-detail.php?id=<?= (int)$o['id'] ?>" class="act-view"><i class="fa-solid fa-eye"></i> View</a>
                <a href="order-detail.php?id=<?= (int)$o['id'] ?>&edit=1" class="act-edit"><i class="fa-solid fa-pen"></i> Edit</a>
              </td>
            </tr>
            <?php endforeach; ?>
            <!-- Totals Row -->
            <tr class="tbl-totals">
              <td colspan="8" style="color:rgba(255,255,255,.7)">Totals (filtered)</td>
              <td><?= number_format((float)$totals['total_pay'],2) ?></td>
              <td><?= number_format((float)$totals['total_writer'],2) ?></td>
              <td><?= number_format((float)$totals['total_tl'],2) ?></td>
              <td style="color:var(--gold)"><?= number_format((float)$totals['total_profit'],2) ?></td>
              <td></td>
              <td style="color:var(--gold)"><?= number_format((float)$totals['total_pay'],2) ?></td>
              <td colspan="4"></td>
            </tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <?php if($pg['total_pages'] > 1): ?>
      <div class="pagination">
        <?php if($pg['page']>1): ?>
        <a href="?<?= http_build_query(array_merge($_GET,['page'=>$pg['page']-1])) ?>" class="page-link"><i class="fa-solid fa-chevron-left"></i></a>
        <?php endif; ?>
        <?php for($p=max(1,$pg['page']-2); $p<=min($pg['total_pages'],$pg['page']+2); $p++): ?>
        <a href="?<?= http_build_query(array_merge($_GET,['page'=>$p])) ?>" class="page-link <?= $p===$pg['page']?'active':'' ?>"><?= $p ?></a>
        <?php endfor; ?>
        <?php if($pg['page']<$pg['total_pages']): ?>
        <a href="?<?= http_build_query(array_merge($_GET,['page'=>$pg['page']+1])) ?>" class="page-link"><i class="fa-solid fa-chevron-right"></i></a>
        <?php endif; ?>
      </div>
      <?php endif; ?>
    </div>

  </main>
</div>
</div>
</body>
</html>
