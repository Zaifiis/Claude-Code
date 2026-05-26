<?php
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';
requireLogin();
requireRole('admin');
$user = getCurrentUser();
$pdo  = getPDO();

// ── This-month stats ──────────────────────────────────────────────────────────
$curMonth = date('n');
$curYear  = date('Y');

$row = $pdo->prepare(
    "SELECT
        COALESCE(SUM(final_client_pay),0)              AS revenue,
        COALESCE(SUM(writer_pay + tl_pay),0)           AS costs,
        COALESCE(SUM(final_client_pay - writer_pay - tl_pay),0) AS net_profit,
        COUNT(*)                                        AS task_count
     FROM tasks
     WHERE MONTH(created_at)=? AND YEAR(created_at)=?"
);
$row->execute([$curMonth, $curYear]);
$stats = $row->fetch();

$pendingRow = $pdo->prepare(
    "SELECT
        COALESCE(SUM(final_client_pay - amount_received),0) AS pending_amount,
        COUNT(*) AS pending_count
     FROM tasks
     WHERE payment_status != 'paid'"
);
$pendingRow->execute();
$pending = $pendingRow->fetch();

$activeClients = (int)$pdo->query(
    "SELECT COUNT(*) FROM users WHERE role='client' AND status='active'"
)->fetchColumn();

// ── Last 6 months chart data ───────────────────────────────────────────────────
$chartLabels  = [];
$chartRevenue = [];
$chartProfit  = [];
for ($i = 5; $i >= 0; $i--) {
    $ts = mktime(0,0,0, $curMonth - $i, 1, $curYear);
    $m  = (int)date('n', $ts);
    $y  = (int)date('Y', $ts);
    $chartLabels[] = date('M Y', $ts);

    $cr = $pdo->prepare(
        "SELECT COALESCE(SUM(final_client_pay),0) AS rev,
                COALESCE(SUM(final_client_pay - writer_pay - tl_pay),0) AS profit
         FROM tasks WHERE MONTH(created_at)=? AND YEAR(created_at)=?"
    );
    $cr->execute([$m, $y]);
    $cr = $cr->fetch();
    $chartRevenue[] = (float)$cr['rev'];
    $chartProfit[]  = (float)$cr['profit'];
}

// ── Task status distribution ───────────────────────────────────────────────────
$statusRow = $pdo->query(
    "SELECT status, COUNT(*) AS cnt FROM tasks GROUP BY status"
)->fetchAll(PDO::FETCH_KEY_PAIR);
$statusCounts = [
    'pending'     => (int)($statusRow['pending']     ?? 0),
    'in_progress' => (int)($statusRow['in_progress'] ?? 0),
    'completed'   => (int)($statusRow['completed']   ?? 0),
    'delivered'   => (int)($statusRow['delivered']   ?? 0),
];

// ── Recent orders ─────────────────────────────────────────────────────────────
$recentOrders = $pdo->query(
    "SELECT t.*, u.name AS client_name
     FROM tasks t JOIN users u ON u.id = t.client_id
     ORDER BY t.created_at DESC LIMIT 10"
)->fetchAll();

// ── Pending payments list ─────────────────────────────────────────────────────
$pendingPayments = $pdo->query(
    "SELECT t.id, t.serial_number, t.task_name, t.final_client_pay, t.amount_received,
            (t.final_client_pay - t.amount_received) AS amount_due, u.name AS client_name
     FROM tasks t JOIN users u ON u.id = t.client_id
     WHERE t.payment_status != 'paid' AND (t.final_client_pay - t.amount_received) > 0
     ORDER BY amount_due DESC LIMIT 8"
)->fetchAll();

// ── Unread notifications ──────────────────────────────────────────────────────
$unreadNotifs = getUnreadNotifications($pdo, (int)$user['id']);
$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Admin Dashboard — <?= APP_NAME ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="../assets/css/dashboard.css" />
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
.stats-grid-6 { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-bottom: 26px; }
@media(max-width:1100px){ .stats-grid-6{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:640px){ .stats-grid-6{ grid-template-columns:1fr; } }
.charts-row { display: grid; grid-template-columns: 1fr 380px; gap: 24px; margin-bottom: 26px; }
@media(max-width:1000px){ .charts-row{ grid-template-columns:1fr; } }
.chart-wrap { position: relative; height: 280px; }
.pending-alert { background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius); padding: 18px 22px; margin-bottom: 24px; }
.pending-alert-title { display:flex; align-items:center; gap:8px; font-weight:700; color:#92400e; margin-bottom:12px; font-size:.95rem; }
.pending-item { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid #fde68a; font-size:.84rem; }
.pending-item:last-child { border-bottom:none; }
.quick-actions { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:28px; }
.actions-cell a { display:inline-flex; align-items:center; gap:4px; padding:5px 10px; border-radius:5px; font-size:.75rem; font-weight:600; text-decoration:none; }
.act-view { background:rgba(10,22,40,.07); color:var(--navy); }
.act-edit { background:rgba(244,196,48,.18); color:#7a5c00; }
.tbl-totals td { background:var(--navy); color:#fff; font-weight:700; }
</style>
</head>
<body>
<div class="layout">

<!-- ── Sidebar ─────────────────────────────────────────────────────────────── -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo">
    <a href="dashboard.php"><span class="logo-icon"><i class="fa-solid fa-graduation-cap"></i></span><?= APP_NAME ?></a>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-label">Main</div>
    <a href="dashboard.php" class="nav-link active"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
    <a href="orders.php"    class="nav-link"><i class="fa-solid fa-list-check"></i> All Orders</a>
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
      <div><div class="sidebar-user-name"><?= sanitize($user['name']) ?></div>
      <div class="sidebar-user-email"><?= sanitize($user['email']) ?></div></div>
    </div>
    <a href="../logout.php" class="logout-link"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</a>
  </div>
</aside>

<!-- ── Main Wrapper ───────────────────────────────────────────────────────── -->
<div class="main-wrapper">

  <!-- Topbar -->
  <header class="topbar">
    <div style="display:flex;align-items:center;gap:12px;">
      <button class="hamburger" id="hamburger" onclick="document.getElementById('sidebar').classList.toggle('open')">
        <i class="fa-solid fa-bars"></i>
      </button>
      <div class="topbar-title">
        <h1>Admin Dashboard</h1>
        <p><?= date('l, F j, Y') ?></p>
      </div>
    </div>
    <div class="topbar-right">
      <div class="notif-wrap">
        <button class="topbar-btn" id="notifBtn" title="Notifications">
          <i class="fa-solid fa-bell"></i>
          <?php if(count($unreadNotifs)): ?>
          <span class="notif-badge"><?= min(count($unreadNotifs),9) ?></span>
          <?php endif; ?>
        </button>
        <div class="notif-panel" id="notifPanel">
          <div class="notif-panel-header">
            <span class="notif-panel-title">Notifications</span>
            <button class="notif-mark-read" id="notifMarkRead">Mark all read</button>
          </div>
          <div class="notif-panel-body" id="notifPanelBody"></div>
        </div>
      </div>
      <div class="topbar-avatar" title="<?= sanitize($user['name']) ?>"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>

  <!-- Page Content -->
  <main class="page-content">

    <?php if($flash): ?>
    <div class="flash-msg <?= sanitize($flash['type']) ?>">
      <i class="fa-solid <?= $flash['type']==='success' ? 'fa-circle-check' : 'fa-circle-exclamation' ?>"></i>
      <?= sanitize($flash['message']) ?>
    </div>
    <?php endif; ?>

    <!-- Welcome -->
    <div class="welcome-header">
      <h1>Welcome back, <?= sanitize(explode(' ',$user['name'])[0]) ?>!</h1>
      <div class="date-tag"><i class="fa-regular fa-calendar"></i> <?= date('F Y') ?> Overview</div>
    </div>

    <!-- Stats Grid 3×2 -->
    <div class="stats-grid-6">
      <div class="stat-card">
        <div class="stat-icon navy"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="stat-info">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value"><?= formatCurrency((float)$stats['revenue']) ?></div>
          <div class="stat-sub">This month</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><i class="fa-solid fa-arrow-trend-down"></i></div>
        <div class="stat-info">
          <div class="stat-label">Total Costs</div>
          <div class="stat-value danger"><?= formatCurrency((float)$stats['costs']) ?></div>
          <div class="stat-sub">Writer + TL pay</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon emerald"><i class="fa-solid fa-chart-line"></i></div>
        <div class="stat-info">
          <div class="stat-label">Net Profit</div>
          <div class="stat-value success"><?= formatCurrency((float)$stats['net_profit']) ?></div>
          <div class="stat-sub">This month</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon gold"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="stat-info">
          <div class="stat-label">Pending Payments</div>
          <div class="stat-value" style="color:var(--gold-dark)"><?= formatCurrency((float)$pending['pending_amount']) ?></div>
          <div class="stat-sub">&#9888; <?= (int)$pending['pending_count'] ?> unpaid tasks</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon navy" style="background:rgba(59,130,246,.1);color:#3b82f6"><i class="fa-solid fa-users"></i></div>
        <div class="stat-info">
          <div class="stat-label">Active Clients</div>
          <div class="stat-value"><?= $activeClients ?></div>
          <div class="stat-sub">Currently active</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple"><i class="fa-solid fa-file-lines"></i></div>
        <div class="stat-info">
          <div class="stat-label">Tasks This Month</div>
          <div class="stat-value"><?= (int)$stats['task_count'] ?></div>
          <div class="stat-sub"><?= date('F Y') ?></div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <!-- Revenue vs Profit Bar Chart -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fa-solid fa-chart-bar" style="color:var(--gold-dark);margin-right:8px"></i>Revenue vs Profit</h3>
          <span style="font-size:.78rem;color:var(--gray-500)">Last 6 months</span>
        </div>
        <div class="card-body">
          <div class="chart-wrap"><canvas id="revenueProfitChart"></canvas></div>
        </div>
      </div>
      <!-- Task Status Doughnut -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fa-solid fa-circle-half-stroke" style="color:var(--navy);margin-right:8px"></i>Task Status</h3>
        </div>
        <div class="card-body">
          <div class="chart-wrap" style="height:240px"><canvas id="taskStatusChart"></canvas></div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;font-size:.78rem;">
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#94a3b8;margin-right:4px"></span>Pending <?= $statusCounts['pending'] ?></span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#F4C430;margin-right:4px"></span>In Progress <?= $statusCounts['in_progress'] ?></span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10B981;margin-right:4px"></span>Completed <?= $statusCounts['completed'] ?></span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#0A1628;margin-right:4px"></span>Delivered <?= $statusCounts['delivered'] ?></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <a href="new-order.php" class="btn btn-gold"><i class="fa-solid fa-plus"></i> New Order</a>
      <a href="new-payment.php" class="btn btn-emerald"><i class="fa-solid fa-money-bill"></i> Log Payment</a>
      <a href="reports.php" class="btn btn-navy"><i class="fa-solid fa-chart-line"></i> View Reports</a>
    </div>

    <!-- Pending Payments Alert -->
    <?php if(count($pendingPayments)): ?>
    <div class="pending-alert">
      <div class="pending-alert-title"><i class="fa-solid fa-triangle-exclamation"></i> Clients with Outstanding Balances</div>
      <?php foreach($pendingPayments as $pp): ?>
      <div class="pending-item">
        <div>
          <span style="font-weight:600;color:var(--navy)"><?= sanitize($pp['client_name']) ?></span>
          <span style="color:var(--gray-500);font-size:.75rem;margin-left:6px"><?= sanitize($pp['serial_number']) ?></span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-weight:700;color:#b45309"><?= formatCurrency((float)$pp['amount_due']) ?></span>
          <a href="order-detail.php?id=<?= (int)$pp['id'] ?>" style="font-size:.75rem;color:var(--navy)">View</a>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <!-- Recent Orders -->
    <div class="card">
      <div class="card-header">
        <h3><i class="fa-solid fa-clock-rotate-left" style="color:var(--navy);margin-right:8px"></i>Recent Orders</h3>
        <a href="orders.php" class="btn btn-outline btn-sm">View All</a>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Serial</th><th>Client</th><th>Task</th><th>Type</th>
              <th>Deadline</th><th>Status</th><th>Payment</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <?php if(empty($recentOrders)): ?>
            <tr><td colspan="8" class="text-center text-muted" style="padding:32px">No orders yet.</td></tr>
            <?php else: ?>
            <?php foreach($recentOrders as $o): ?>
            <tr>
              <td><span class="serial-no"><?= sanitize($o['serial_number']) ?></span></td>
              <td style="font-weight:600;color:var(--navy)"><?= sanitize($o['client_name']) ?></td>
              <td class="task-name"><?= sanitize($o['task_name']) ?></td>
              <td>
                <?php if($o['task_type']==='technical'): ?>
                <span class="badge badge-navy">Technical</span>
                <?php else: ?>
                <span class="badge badge-gray">Simple</span>
                <?php endif; ?>
              </td>
              <td style="white-space:nowrap"><?= formatDate($o['deadline']) ?></td>
              <td>
                <?php $sc=['pending'=>'badge-gray','in_progress'=>'badge-gold','completed'=>'badge-emerald','delivered'=>'badge-navy']; ?>
                <span class="badge <?= $sc[$o['status']] ?? 'badge-gray' ?>"><?= ucwords(str_replace('_',' ',$o['status'])) ?></span>
              </td>
              <td>
                <?php $pc=['due'=>'badge-red','partial'=>'badge-orange','paid'=>'badge-emerald']; ?>
                <span class="badge <?= $pc[$o['payment_status']] ?? 'badge-gray' ?>"><?= ucfirst($o['payment_status']) ?></span>
              </td>
              <td class="actions-cell">
                <a href="order-detail.php?id=<?= (int)$o['id'] ?>" class="act-view"><i class="fa-solid fa-eye"></i> View</a>
                <a href="order-detail.php?id=<?= (int)$o['id'] ?>&edit=1" class="act-edit" style="margin-left:4px"><i class="fa-solid fa-pen"></i> Edit</a>
              </td>
            </tr>
            <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>

  </main>
</div>
</div>

<script>
// ── Notification dropdown ─────────────────────────────────────────────────────
(function() {
  const NOTIFS = <?= json_encode(array_map(fn($n) => [
    'message'    => $n['message'],
    'type'       => $n['type'],
    'created_at' => timeAgo($n['created_at']),
  ], $unreadNotifs)) ?>;
  const btn   = document.getElementById('notifBtn');
  const panel = document.getElementById('notifPanel');
  const body  = document.getElementById('notifPanelBody');
  if (!btn) return;
  body.innerHTML = NOTIFS.length === 0
    ? '<div class="notif-panel-empty"><i class="fa-regular fa-bell-slash"></i>No unread notifications</div>'
    : NOTIFS.map(n => `<div class="notif-panel-item">
        <div class="notif-dot ${n.type}"></div>
        <div><div class="notif-text">${n.message}</div><div class="notif-time">${n.created_at}</div></div>
      </div>`).join('');
  btn.addEventListener('click', e => { e.stopPropagation(); panel.classList.toggle('show'); });
  document.addEventListener('click', () => panel.classList.remove('show'));
  panel.addEventListener('click', e => e.stopPropagation());
  document.getElementById('notifMarkRead').addEventListener('click', () => {
    fetch('../api/mark-notifications-read.php', { method:'POST' }).catch(()=>{});
    document.querySelector('.notif-badge')?.remove();
    body.innerHTML = '<div class="notif-panel-empty"><i class="fa-regular fa-bell-slash"></i>All caught up!</div>';
    panel.classList.remove('show');
  });
})();

// ── Revenue vs Profit Chart ────────────────────────────────────────────────────
const revCtx = document.getElementById('revenueProfitChart').getContext('2d');
new Chart(revCtx, {
  type: 'bar',
  data: {
    labels: <?= json_encode($chartLabels) ?>,
    datasets: [
      {
        label: 'Revenue',
        data:  <?= json_encode($chartRevenue) ?>,
        backgroundColor: 'rgba(244,196,48,0.85)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Profit',
        data:  <?= json_encode($chartProfit) ?>,
        backgroundColor: 'rgba(16,185,129,0.8)',
        borderRadius: 6,
        borderSkipped: false,
      }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { family:'DM Sans', size:12 } } } },
    scales: {
      x: { grid: { display:false }, ticks: { font:{family:'DM Sans',size:11} } },
      y: { beginAtZero:true, grid:{ color:'rgba(0,0,0,.05)' }, ticks:{ font:{family:'DM Sans',size:11}, callback: v => 'PKR '+v.toLocaleString() } }
    }
  }
});

// ── Task Status Doughnut ───────────────────────────────────────────────────────
const stCtx = document.getElementById('taskStatusChart').getContext('2d');
new Chart(stCtx, {
  type: 'doughnut',
  data: {
    labels: ['Pending','In Progress','Completed','Delivered'],
    datasets: [{
      data: [
        <?= $statusCounts['pending'] ?>,
        <?= $statusCounts['in_progress'] ?>,
        <?= $statusCounts['completed'] ?>,
        <?= $statusCounts['delivered'] ?>
      ],
      backgroundColor: ['#94a3b8','#F4C430','#10B981','#0A1628'],
      borderWidth: 3,
      borderColor: '#fff',
      hoverOffset: 6
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display:false } },
    cutout: '68%'
  }
});
</script>
</body>
</html>
