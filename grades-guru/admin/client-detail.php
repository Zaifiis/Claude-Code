<?php
/**
 * Grades Guru — Admin: Client Detail
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

$clientId = (int)($_GET['id'] ?? 0);
if (!$clientId) redirect(APP_URL . '/admin/clients.php');

$stmt = $pdo->prepare("SELECT * FROM users WHERE id=? AND role='client' LIMIT 1");
$stmt->execute([$clientId]);
$client = $stmt->fetch();
if (!$client) { setFlash('error','Client not found.'); redirect(APP_URL.'/admin/clients.php'); }

$errors = [];

// Handle discount update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_discount'])) {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) { $errors[] = 'Invalid request.'; }
    else {
        $disc = min(100, max(0, (float)($_POST['discount_percentage'] ?? 0)));
        $pdo->prepare("UPDATE users SET discount_percentage=? WHERE id=?")->execute([$disc, $clientId]);
        setFlash('success','Discount updated.');
        redirect(APP_URL."/admin/client-detail.php?id=$clientId");
    }
}

// Handle status toggle
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['toggle_status'])) {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) { $errors[] = 'Invalid request.'; }
    else {
        $pdo->prepare("UPDATE users SET status=IF(status='active','inactive','active') WHERE id=?")->execute([$clientId]);
        setFlash('success','Status updated.');
        redirect(APP_URL."/admin/client-detail.php?id=$clientId");
    }
}

// Reload
$stmt->execute([$clientId]);
$client = $stmt->fetch();

// Stats
$statsRow = $pdo->prepare(
    "SELECT COUNT(id) AS total_orders,
            COALESCE(SUM(final_client_pay),0) AS total_billed,
            COALESCE(SUM(amount_received),0) AS total_paid,
            COALESCE(SUM(final_client_pay-amount_received),0) AS total_due,
            SUM(status='delivered') AS delivered,
            SUM(payment_status='paid') AS fully_paid
     FROM tasks WHERE client_id=?"
);
$statsRow->execute([$clientId]);
$stats = $statsRow->fetch();

// Orders
$orders = $pdo->prepare(
    "SELECT t.id, t.serial_number, t.task_name, t.task_type, t.status,
            t.payment_status, t.final_client_pay, t.amount_received, t.deadline, t.created_at,
            u.name AS tl_name
     FROM tasks t LEFT JOIN users u ON u.id=t.tl_id
     WHERE t.client_id=? ORDER BY t.created_at DESC"
);
$orders->execute([$clientId]);
$orders = $orders->fetchAll();

// Payments
$payments = $pdo->prepare(
    "SELECT p.*, t.serial_number, t.task_name, a.name AS recorded_by
     FROM payments p JOIN tasks t ON t.id=p.task_id JOIN users a ON a.id=p.recorded_by
     WHERE p.client_id=? ORDER BY p.payment_date DESC"
);
$payments->execute([$clientId]);
$payments = $payments->fetchAll();

// Referrals made by this client
$referralsMade = $pdo->prepare(
    "SELECT r.*, u2.name AS referred_name, u2.email AS referred_email
     FROM referrals r JOIN users u2 ON u2.id=r.referred_id
     WHERE r.referrer_id=? ORDER BY r.created_at DESC"
);
$referralsMade->execute([$clientId]);
$referralsMade = $referralsMade->fetchAll();

// Spin history
$spins = $pdo->prepare(
    "SELECT * FROM spin_results WHERE user_id=? ORDER BY spun_at DESC LIMIT 20"
);
$spins->execute([$clientId]);
$spins = $spins->fetchAll();

$flash     = getFlash();
$csrfToken = getCsrfToken();
$statusColors = ['pending'=>'badge-gray','assigned'=>'badge-navy','in_progress'=>'badge-gold','completed'=>'badge-blue','delivered'=>'badge-emerald','revision'=>'badge-orange'];
$payColors    = ['due'=>'badge-orange','partial'=>'badge-gold','paid'=>'badge-emerald'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= sanitize($client['name']) ?> — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
  <style>
  .form-group{display:flex;flex-direction:column;gap:.375rem;margin-bottom:1.25rem;}
  .form-label{font-size:.8125rem;font-weight:600;color:var(--text-muted);}
  .form-control{padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);font-family:var(--font-body);outline:none;transition:border-color .2s;width:100%;}
  .form-control:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(244,196,48,.12);}
  .profile-header{display:flex;align-items:center;gap:1.25rem;background:var(--card-bg);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;margin-bottom:1.25rem;box-shadow:var(--shadow-sm);}
  .profile-avatar{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:#fff;flex-shrink:0;}
  .profile-name{font-family:var(--font-heading);font-size:1.5rem;font-weight:700;color:var(--primary);}
  .profile-meta{font-size:.85rem;color:var(--text-muted);margin-top:.2rem;}
  </style>
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
    <a href="clients.php" class="nav-link active"><i class="fa-solid fa-users"></i> Clients</a>
    <a href="referrals.php" class="nav-link"><i class="fa-solid fa-share-nodes"></i> Referrals</a>
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
      <div class="topbar-title"><h1>Client Profile</h1><p><?= sanitize($client['name']) ?></p></div>
    </div>
    <div class="topbar-right">
      <a href="clients.php" class="btn btn-outline btn-sm"><i class="fa-solid fa-arrow-left"></i> Back</a>
      <div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>
  <main class="page-content">

    <?php if(!empty($errors)): ?>
    <div class="flash-msg error"><i class="fa-solid fa-circle-exclamation"></i> <?= implode(' &bull; ', array_map('sanitize',$errors)) ?></div>
    <?php endif; ?>
    <?php if($flash): ?><div class="flash-msg <?= $flash['type'] ?>"><i class="fa-solid fa-circle-check"></i> <?= sanitize($flash['message']) ?></div><?php endif; ?>

    <!-- Profile header -->
    <div class="profile-header">
      <div class="profile-avatar"><?= strtoupper(substr($client['name'],0,1)) ?></div>
      <div style="flex:1">
        <div class="profile-name"><?= sanitize($client['name']) ?></div>
        <div class="profile-meta">
          <i class="fa-solid fa-envelope"></i> <?= sanitize($client['email']) ?>
          <?php if($client['phone']): ?> &nbsp;|&nbsp; <i class="fa-solid fa-phone"></i> <?= sanitize($client['phone']) ?><?php endif; ?>
          &nbsp;|&nbsp; Joined <?= formatDate($client['created_at']) ?>
        </div>
        <div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;">
          <?= $client['status']==='active' ? '<span class="badge badge-emerald">Active</span>' : '<span class="badge badge-gray">Inactive</span>' ?>
          <?php if($client['discount_percentage'] > 0): ?>
          <span class="badge badge-gold"><?= number_format((float)$client['discount_percentage'],0) ?>% Discount</span>
          <?php endif; ?>
          <span class="badge badge-navy">Ref: <?= sanitize($client['referral_code']) ?></span>
          <span class="badge badge-blue"><?= (int)$client['referral_count'] ?> Referrals</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:.5rem;">
        <form method="POST" style="display:inline;">
          <?= csrfField() ?>
          <input type="hidden" name="toggle_status" value="1">
          <button type="submit" class="btn btn-sm <?= $client['status']==='active'?'btn-danger':'btn-emerald' ?>" onclick="return confirm('Toggle client status?')">
            <?= $client['status']==='active'?'Disable':'Enable' ?>
          </button>
        </form>
        <a href="new-order.php?client_id=<?= $client['id'] ?>" class="btn btn-sm btn-gold"><i class="fa-solid fa-plus"></i> New Order</a>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:1.25rem;">
      <?php $sData = [
        ['Total Orders','fa-list',     'navy',   $stats['total_orders']],
        ['Total Billed','fa-sack-dollar','gold', formatCurrency((float)$stats['total_billed'])],
        ['Total Paid',  'fa-check',    'emerald',formatCurrency((float)$stats['total_paid'])],
        ['Amount Due',  'fa-clock',    'red',    formatCurrency((float)$stats['total_due'])],
        ['Delivered',   'fa-box',      'blue',   $stats['delivered']],
        ['Fully Paid',  'fa-receipt',  'emerald',$stats['fully_paid']],
      ]; foreach($sData as [$label,$icon,$color,$val]): ?>
      <div class="stat-card">
        <div class="stat-icon <?= $color ?>"><i class="fa-solid <?= $icon ?>"></i></div>
        <div class="stat-info"><div class="stat-label"><?= $label ?></div><div class="stat-value"><?= $val ?></div></div>
      </div>
      <?php endforeach; ?>
    </div>

    <div style="display:grid;grid-template-columns:300px 1fr;gap:1.25rem;">

      <!-- Sidebar: discount edit + referral code -->
      <div style="display:flex;flex-direction:column;gap:1.25rem;">
        <div class="card" style="align-self:start;">
          <div class="card-header"><h3><i class="fa-solid fa-tag" style="color:var(--accent);margin-right:8px"></i>Discount</h3></div>
          <form method="POST" class="card-body">
            <?= csrfField() ?>
            <input type="hidden" name="save_discount" value="1">
            <div class="form-group">
              <label class="form-label">Discount Percentage</label>
              <input type="number" name="discount_percentage" class="form-control" min="0" max="100" step="0.5"
                     value="<?= number_format((float)$client['discount_percentage'],1) ?>">
            </div>
            <button type="submit" class="btn btn-gold" style="width:100%;justify-content:center;">Save Discount</button>
          </form>
        </div>

        <?php if(!empty($spins)): ?>
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-dice" style="color:var(--accent);margin-right:8px"></i>Spin History</h3></div>
          <div style="padding:.5rem 0;">
          <?php foreach($spins as $sp): ?>
          <div style="padding:.6rem 1.25rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:.85rem;color:var(--primary)"><?= sanitize($sp['result']) ?></div>
            <div style="font-size:.75rem;color:var(--text-muted)"><?= formatDate($sp['spun_at']) ?></div>
          </div>
          <?php endforeach; ?>
          </div>
        </div>
        <?php endif; ?>
      </div>

      <!-- Main: orders + payments + referrals -->
      <div style="display:flex;flex-direction:column;gap:1.25rem;">

        <!-- Orders -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fa-solid fa-list-check" style="color:var(--accent);margin-right:8px"></i>Orders (<?= count($orders) ?>)</h3>
            <a href="new-order.php?client_id=<?= $client['id'] ?>" class="btn btn-sm btn-gold"><i class="fa-solid fa-plus"></i> New</a>
          </div>
          <?php if(empty($orders)): ?>
          <div class="empty-state"><i class="fa-solid fa-list-check"></i><p>No orders yet.</p></div>
          <?php else: ?>
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>Serial</th><th>Task</th><th>Status</th><th>Payment</th><th>Billed</th><th>Deadline</th><th></th></tr></thead>
              <tbody>
              <?php foreach($orders as $o): ?>
              <tr>
                <td><span class="serial-no"><?= sanitize($o['serial_number']) ?></span></td>
                <td style="max-width:200px"><div class="task-name"><?= sanitize($o['task_name']) ?></div></td>
                <td><span class="badge <?= $statusColors[$o['status']] ?? 'badge-gray' ?>"><?= ucfirst(str_replace('_',' ',$o['status'])) ?></span></td>
                <td><span class="badge <?= $payColors[$o['payment_status']] ?? 'badge-gray' ?>"><?= ucfirst($o['payment_status']) ?></span></td>
                <td style="font-weight:700"><?= formatCurrency((float)$o['final_client_pay']) ?></td>
                <td style="font-size:.8rem;color:var(--text-muted)"><?= $o['deadline'] ? formatDate($o['deadline']) : '—' ?></td>
                <td><a href="order-detail.php?id=<?= $o['id'] ?>" class="btn btn-sm btn-outline">View</a></td>
              </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
          </div>
          <?php endif; ?>
        </div>

        <!-- Payments -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fa-solid fa-receipt" style="color:var(--success);margin-right:8px"></i>Payment History (<?= count($payments) ?>)</h3>
            <a href="new-payment.php" class="btn btn-sm btn-gold"><i class="fa-solid fa-plus"></i> Log</a>
          </div>
          <?php if(empty($payments)): ?>
          <div class="empty-state"><i class="fa-solid fa-receipt"></i><p>No payments yet.</p></div>
          <?php else: ?>
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Task</th><th>Amount</th><th>Method</th></tr></thead>
              <tbody>
              <?php foreach($payments as $p): ?>
              <tr>
                <td><?= formatDate($p['payment_date']) ?></td>
                <td style="font-size:.8rem;color:var(--text-muted)"><?= sanitize(substr($p['task_name'],0,35)) ?><br><span class="serial-no"><?= sanitize($p['serial_number']) ?></span></td>
                <td style="font-weight:700;color:var(--success)"><?= formatCurrency((float)$p['amount']) ?></td>
                <td><span class="badge badge-navy"><?= sanitize($p['payment_method']) ?></span></td>
              </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
          </div>
          <div style="padding:.75rem 1.25rem;border-top:1px solid var(--border);font-weight:700;text-align:right;">
            Total paid: <span style="color:var(--success)"><?= formatCurrency(array_sum(array_column($payments,'amount'))) ?></span>
          </div>
          <?php endif; ?>
        </div>

        <!-- Referrals made -->
        <?php if(!empty($referralsMade)): ?>
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-share-nodes" style="color:var(--accent);margin-right:8px"></i>Referrals Made (<?= count($referralsMade) ?>)</h3></div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>Referred Client</th><th>Joined</th><th>Status</th><th>Discount Applied</th></tr></thead>
              <tbody>
              <?php foreach($referralsMade as $r): ?>
              <tr>
                <td>
                  <div style="font-weight:600"><?= sanitize($r['referred_name']) ?></div>
                  <div style="font-size:.75rem;color:var(--text-muted)"><?= sanitize($r['referred_email']) ?></div>
                </td>
                <td><?= formatDate($r['created_at']) ?></td>
                <td><?= $r['status']==='confirmed'?'<span class="badge badge-emerald">Confirmed</span>':'<span class="badge badge-orange">Pending</span>' ?></td>
                <td><?= $r['discount_given']?'<span class="badge badge-gold">Yes</span>':'<span class="badge badge-gray">—</span>' ?></td>
              </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        </div>
        <?php endif; ?>

      </div>
    </div>

  </main>
</div>
</div>
<script>document.getElementById('hamburger').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));</script>
</body>
</html>
