<?php
/**
 * Grades Guru — Admin: Reports & Analytics
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

$dateFrom = $_GET['date_from'] ?? date('Y-m-01');
$dateTo   = $_GET['date_to']   ?? date('Y-m-d');

// CSV export
if (isset($_GET['export'])) {
    $exportRows = $pdo->prepare(
        "SELECT t.serial_number, t.task_name, t.task_type, t.word_count,
                t.final_client_pay, t.amount_received,
                (t.final_client_pay - t.amount_received) AS amount_due,
                t.writer_pay, t.tl_pay, t.profit, t.status, t.payment_status,
                t.created_at, t.deadline,
                u.name AS client_name, tl.name AS tl_name
         FROM tasks t
         JOIN users u ON u.id=t.client_id
         LEFT JOIN users tl ON tl.id=t.tl_id
         WHERE DATE(t.created_at) BETWEEN ? AND ?
         ORDER BY t.created_at DESC"
    );
    $exportRows->execute([$dateFrom, $dateTo]);
    $rows = $exportRows->fetchAll();

    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="gg-report-'.$dateFrom.'-'.$dateTo.'.csv"');
    $out = fopen('php://output','w');
    fputcsv($out,['Serial','Task','Type','Words','Client Pay','Received','Due','Writer Pay','TL Pay','Profit','Status','Payment','Created','Deadline','Client','TL']);
    foreach($rows as $r) {
        fputcsv($out,[$r['serial_number'],$r['task_name'],$r['task_type'],$r['word_count'],
                      $r['final_client_pay'],$r['amount_received'],$r['amount_due'],
                      $r['writer_pay'],$r['tl_pay'],$r['profit'],
                      $r['status'],$r['payment_status'],$r['created_at'],$r['deadline'],
                      $r['client_name'],$r['tl_name']]);
    }
    fclose($out);
    exit;
}

// Summary totals
$totals = $pdo->prepare(
    "SELECT COUNT(*) AS total_orders,
            COALESCE(SUM(final_client_pay),0) AS total_revenue,
            COALESCE(SUM(amount_received),0) AS total_received,
            COALESCE(SUM(writer_pay),0) AS total_writer_cost,
            COALESCE(SUM(tl_pay),0) AS total_tl_cost,
            COALESCE(SUM(profit),0) AS total_profit,
            SUM(status='delivered') AS delivered_count,
            SUM(payment_status='paid') AS paid_count
     FROM tasks WHERE DATE(created_at) BETWEEN ? AND ?"
);
$totals->execute([$dateFrom, $dateTo]);
$totals = $totals->fetch();

// Daily revenue/profit for chart (last 30 days or date range)
$chartStmt = $pdo->prepare(
    "SELECT DATE(created_at) AS day,
            COALESCE(SUM(final_client_pay),0) AS revenue,
            COALESCE(SUM(profit),0) AS profit,
            COALESCE(SUM(writer_pay),0) AS writer_cost
     FROM tasks WHERE DATE(created_at) BETWEEN ? AND ?
     GROUP BY DATE(created_at) ORDER BY day ASC"
);
$chartStmt->execute([$dateFrom, $dateTo]);
$dailyData = $chartStmt->fetchAll();

$chartLabels  = array_map(fn($r) => $r['day'], $dailyData);
$chartRevenue = array_map(fn($r) => (float)$r['revenue'], $dailyData);
$chartProfit  = array_map(fn($r) => (float)$r['profit'], $dailyData);
$chartCost    = array_map(fn($r) => (float)$r['writer_cost'], $dailyData);

// Task status breakdown for doughnut
$statusBreak = $pdo->prepare(
    "SELECT status, COUNT(*) AS cnt FROM tasks
     WHERE DATE(created_at) BETWEEN ? AND ?
     GROUP BY status"
);
$statusBreak->execute([$dateFrom, $dateTo]);
$statusBreak = $statusBreak->fetchAll(PDO::FETCH_KEY_PAIR);

// Per-client breakdown
$clientBreak = $pdo->prepare(
    "SELECT u.name, u.email,
            COUNT(t.id) AS orders,
            COALESCE(SUM(t.final_client_pay),0) AS billed,
            COALESCE(SUM(t.amount_received),0) AS paid
     FROM tasks t JOIN users u ON u.id=t.client_id
     WHERE DATE(t.created_at) BETWEEN ? AND ?
     GROUP BY t.client_id ORDER BY billed DESC LIMIT 15"
);
$clientBreak->execute([$dateFrom, $dateTo]);
$clientBreak = $clientBreak->fetchAll();

// Per-TL breakdown
$tlBreak = $pdo->prepare(
    "SELECT u.name,
            COUNT(t.id) AS tasks,
            SUM(t.status='delivered') AS delivered,
            COALESCE(SUM(t.tl_pay),0) AS tl_cost
     FROM tasks t JOIN users u ON u.id=t.tl_id
     WHERE t.tl_id IS NOT NULL AND DATE(t.created_at) BETWEEN ? AND ?
     GROUP BY t.tl_id ORDER BY tasks DESC"
);
$tlBreak->execute([$dateFrom, $dateTo]);
$tlBreak = $tlBreak->fetchAll();

// Payment methods breakdown
$methodBreak = $pdo->prepare(
    "SELECT payment_method, COUNT(*) AS cnt, SUM(amount) AS total
     FROM payments WHERE payment_date BETWEEN ? AND ?
     GROUP BY payment_method ORDER BY total DESC"
);
$methodBreak->execute([$dateFrom, $dateTo]);
$methodBreak = $methodBreak->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reports — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
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
    <a href="payments.php" class="nav-link"><i class="fa-solid fa-money-bill-wave"></i> Payments</a>
    <a href="reports.php" class="nav-link active"><i class="fa-solid fa-chart-line"></i> Reports</a>
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
      <div class="topbar-title"><h1>Reports</h1><p>Analytics &amp; financial breakdown</p></div>
    </div>
    <div class="topbar-right">
      <a href="?date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>&export=1" class="btn btn-outline btn-sm"><i class="fa-solid fa-download"></i> Export CSV</a>
      <div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>
  <main class="page-content">

    <!-- Date filter -->
    <form method="GET" style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;background:var(--card-bg);padding:1rem 1.25rem;border-radius:var(--radius);border:1px solid var(--border);box-shadow:var(--shadow-sm);margin-bottom:1.25rem;">
      <label style="font-size:.85rem;font-weight:600;color:var(--text-muted)">From</label>
      <input type="date" name="date_from" value="<?= sanitize($dateFrom) ?>"
             style="padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);outline:none;font-family:var(--font-body);">
      <label style="font-size:.85rem;font-weight:600;color:var(--text-muted)">To</label>
      <input type="date" name="date_to" value="<?= sanitize($dateTo) ?>"
             style="padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);outline:none;font-family:var(--font-body);">
      <button type="submit" class="btn btn-navy"><i class="fa-solid fa-filter"></i> Apply</button>
      <!-- Quick filters -->
      <div style="display:flex;gap:.5rem;margin-left:auto;">
        <?php
        $quickRanges = [
          'This Month'  => [date('Y-m-01'), date('Y-m-d')],
          'Last Month'  => [date('Y-m-01',strtotime('first day of last month')), date('Y-m-t',strtotime('last month'))],
          'This Year'   => [date('Y-01-01'), date('Y-m-d')],
          'Last 30 Days'=> [date('Y-m-d',strtotime('-30 days')), date('Y-m-d')],
        ];
        foreach($quickRanges as $label=>[$f,$t]):
          $active = $dateFrom===$f && $dateTo===$t;
        ?>
        <a href="?date_from=<?= urlencode($f) ?>&date_to=<?= urlencode($t) ?>"
           class="btn btn-sm <?= $active?'btn-navy':'btn-outline' ?>"><?= $label ?></a>
        <?php endforeach; ?>
      </div>
    </form>

    <!-- Summary stats -->
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:1.25rem;">
      <?php $sData = [
        ['Total Revenue','fa-sack-dollar','gold',formatCurrency((float)$totals['total_revenue'])],
        ['Total Received','fa-check-circle','emerald',formatCurrency((float)$totals['total_received'])],
        ['Net Profit','fa-chart-line','navy',formatCurrency((float)$totals['total_profit'])],
        ['Writer Cost','fa-pen','red',formatCurrency((float)$totals['total_writer_cost'])],
        ['TL Cost','fa-user-tie','blue',formatCurrency((float)$totals['total_tl_cost'])],
        ['Orders','fa-list','navy',$totals['total_orders']],
        ['Delivered','fa-box-open','emerald',$totals['delivered_count']],
        ['Fully Paid','fa-receipt','gold',$totals['paid_count']],
      ]; foreach($sData as [$label,$icon,$color,$val]): ?>
      <div class="stat-card">
        <div class="stat-icon <?= $color ?>"><i class="fa-solid <?= $icon ?>"></i></div>
        <div class="stat-info"><div class="stat-label"><?= $label ?></div><div class="stat-value"><?= $val ?></div></div>
      </div>
      <?php endforeach; ?>
    </div>

    <!-- Charts row -->
    <div style="display:grid;grid-template-columns:1fr 320px;gap:1.25rem;margin-bottom:1.25rem;">

      <!-- Revenue/Profit/Cost bar chart -->
      <div class="card">
        <div class="card-header"><h3><i class="fa-solid fa-chart-bar" style="color:var(--accent);margin-right:8px"></i>Daily Revenue vs Profit</h3></div>
        <div class="card-body">
          <?php if(empty($dailyData)): ?>
          <div class="empty-state"><i class="fa-solid fa-chart-bar"></i><p>No data for selected range.</p></div>
          <?php else: ?>
          <canvas id="revenueChart" height="260"></canvas>
          <?php endif; ?>
        </div>
      </div>

      <!-- Status doughnut -->
      <div class="card">
        <div class="card-header"><h3><i class="fa-solid fa-chart-pie" style="color:var(--accent);margin-right:8px"></i>Order Status</h3></div>
        <div class="card-body" style="display:flex;align-items:center;justify-content:center;">
          <?php if(empty($statusBreak)): ?>
          <div class="empty-state"><i class="fa-solid fa-chart-pie"></i><p>No data.</p></div>
          <?php else: ?>
          <canvas id="statusChart" height="220"></canvas>
          <?php endif; ?>
        </div>
      </div>
    </div>

    <!-- Tables row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem;">

      <!-- Per-client table -->
      <div class="card">
        <div class="card-header"><h3><i class="fa-solid fa-users" style="color:var(--accent);margin-right:8px"></i>Top Clients</h3></div>
        <?php if(empty($clientBreak)): ?>
        <div class="empty-state"><i class="fa-solid fa-users"></i><p>No data.</p></div>
        <?php else: ?>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Client</th><th>Orders</th><th>Billed</th><th>Paid</th></tr></thead>
            <tbody>
            <?php foreach($clientBreak as $c): ?>
            <tr>
              <td>
                <div style="font-weight:600;color:var(--primary)"><?= sanitize($c['name']) ?></div>
                <div style="font-size:.75rem;color:var(--text-muted)"><?= sanitize($c['email']) ?></div>
              </td>
              <td style="text-align:center;font-weight:700"><?= (int)$c['orders'] ?></td>
              <td style="font-weight:700;color:var(--primary)"><?= formatCurrency((float)$c['billed']) ?></td>
              <td style="font-weight:700;color:var(--success)"><?= formatCurrency((float)$c['paid']) ?></td>
            </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
        </div>
        <?php endif; ?>
      </div>

      <!-- Per-TL table -->
      <div class="card">
        <div class="card-header"><h3><i class="fa-solid fa-user-tie" style="color:var(--accent);margin-right:8px"></i>TL Performance</h3></div>
        <?php if(empty($tlBreak)): ?>
        <div class="empty-state"><i class="fa-solid fa-user-tie"></i><p>No TL data.</p></div>
        <?php else: ?>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>TL</th><th>Tasks</th><th>Delivered</th><th>Rate</th><th>TL Cost</th></tr></thead>
            <tbody>
            <?php foreach($tlBreak as $tl): ?>
            <tr>
              <td style="font-weight:600"><?= sanitize($tl['name']) ?></td>
              <td style="text-align:center"><?= (int)$tl['tasks'] ?></td>
              <td style="text-align:center;color:var(--success);font-weight:700"><?= (int)$tl['delivered'] ?></td>
              <td style="text-align:center;color:var(--text-muted)">
                <?= $tl['tasks'] > 0 ? number_format((int)$tl['delivered']/(int)$tl['tasks']*100,0).'%' : '—' ?>
              </td>
              <td style="color:var(--danger);font-weight:700"><?= formatCurrency((float)$tl['tl_cost']) ?></td>
            </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
        </div>
        <?php endif; ?>
      </div>
    </div>

    <!-- Payment methods breakdown -->
    <?php if(!empty($methodBreak)): ?>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-credit-card" style="color:var(--accent);margin-right:8px"></i>Payment Methods</h3></div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Method</th><th>Transactions</th><th>Total Amount</th></tr></thead>
          <tbody>
          <?php foreach($methodBreak as $m): ?>
          <tr>
            <td style="font-weight:600"><?= sanitize($m['payment_method']) ?></td>
            <td style="text-align:center"><?= (int)$m['cnt'] ?></td>
            <td style="font-weight:700;color:var(--success)"><?= formatCurrency((float)$m['total']) ?></td>
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
<script>
document.getElementById('hamburger').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));

<?php if(!empty($dailyData)): ?>
// Revenue/Profit chart
new Chart(document.getElementById('revenueChart').getContext('2d'),{
  type:'bar',
  data:{
    labels: <?= json_encode($chartLabels) ?>,
    datasets:[
      {label:'Revenue (PKR)',data:<?= json_encode($chartRevenue) ?>,backgroundColor:'rgba(10,22,40,.75)',borderRadius:4},
      {label:'Writer Cost (PKR)',data:<?= json_encode($chartCost) ?>,backgroundColor:'rgba(239,68,68,.65)',borderRadius:4},
      {label:'Profit (PKR)',data:<?= json_encode($chartProfit) ?>,backgroundColor:'rgba(16,185,129,.75)',borderRadius:4},
    ]
  },
  options:{
    responsive:true,maintainAspectRatio:false,
    plugins:{legend:{position:'bottom',labels:{font:{family:'DM Sans,sans-serif'},boxWidth:12}}},
    scales:{x:{ticks:{font:{family:'DM Sans,sans-serif'},maxTicksLimit:12}},y:{ticks:{font:{family:'DM Sans,sans-serif'},callback:v=>'PKR '+v.toLocaleString()}}}
  }
});
<?php endif; ?>

<?php if(!empty($statusBreak)): ?>
const statusColors={pending:'#6b7280',assigned:'#0A1628',in_progress:'#F4C430',completed:'#3b82f6',delivered:'#10B981',revision:'#f97316'};
const statusKeys=<?= json_encode(array_keys($statusBreak)) ?>;
const statusVals=<?= json_encode(array_values($statusBreak)) ?>;
new Chart(document.getElementById('statusChart').getContext('2d'),{
  type:'doughnut',
  data:{
    labels:statusKeys.map(k=>k.charAt(0).toUpperCase()+k.slice(1).replace('_',' ')),
    datasets:[{data:statusVals,backgroundColor:statusKeys.map(k=>statusColors[k]||'#6b7280'),borderWidth:2,borderColor:'#fff'}]
  },
  options:{plugins:{legend:{position:'bottom',labels:{font:{family:'DM Sans,sans-serif'},boxWidth:12}}},cutout:'65%'}
});
<?php endif; ?>
</script>
</body>
</html>
