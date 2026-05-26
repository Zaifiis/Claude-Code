<?php
/**
 * Grades Guru — Client Order Detail
 */
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

requireLogin();
requireRole('client');
$user = getCurrentUser();
$pdo  = getPDO();
$uid  = (int)$user['id'];

$taskId = (int)($_GET['id'] ?? 0);
if (!$taskId) { setFlash('error','Invalid order.'); redirect(APP_URL.'/client/orders.php'); }

$stmt = $pdo->prepare(
    'SELECT t.*, tl.name AS tl_name
     FROM tasks t
     LEFT JOIN users tl ON tl.id = t.tl_id
     WHERE t.id = ? AND t.client_id = ?
     LIMIT 1'
);
$stmt->execute([$taskId, $uid]);
$task = $stmt->fetch();
if (!$task) { setFlash('error','Order not found.'); redirect(APP_URL.'/client/orders.php'); }

// Payment history
$pmts = $pdo->prepare('SELECT amount, payment_method, payment_date, notes FROM payments WHERE task_id = ? ORDER BY payment_date DESC');
$pmts->execute([$taskId]);
$payments = $pmts->fetchAll();

$flash = getFlash();

// Status steps for timeline
$steps    = ['pending','in_progress','completed','delivered'];
$stepLabels = ['Pending','In Progress','Completed','Delivered'];
$curIdx   = array_search($task['status'], $steps, true);

$notifications = getUnreadNotifications($pdo, $uid);
$unreadCount   = count($notifications);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= sanitize($task['task_name']) ?> — <?= APP_NAME ?></title>
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
    <a href="orders.php"    class="nav-link active"><i class="fa-solid fa-file-lines"></i> My Orders</a>
    <div class="nav-label">Rewards</div>
    <a href="referrals.php" class="nav-link"><i class="fa-solid fa-users"></i> Referrals</a>
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
      <div class="topbar-title">
        <h1>Order Detail</h1>
        <p><a href="orders.php" style="color:var(--text-muted);text-decoration:none">Orders</a> &rsaquo; <?= sanitize(substr($task['task_name'],0,40)) ?></p>
      </div>
    </div>
    <div class="topbar-right">
      <button class="topbar-btn" id="notifBtn"><i class="fa-solid fa-bell"></i>
        <?php if($unreadCount): ?><span class="notif-badge"><?= min($unreadCount,9) ?></span><?php endif; ?>
      </button>
      <div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>

  <main class="page-content">

    <?php if($flash): ?>
    <div class="flash-msg <?= sanitize($flash['type']) ?>">
      <i class="fa-solid fa-circle-info"></i> <?= sanitize($flash['message']) ?>
    </div>
    <?php endif; ?>

    <!-- Status Timeline -->
    <div class="card">
      <div class="card-header">
        <h3><i class="fa-solid fa-timeline" style="color:var(--accent);margin-right:8px"></i> Order Status</h3>
        <?php
        $payBadge = ['due'=>'badge-red','partial'=>'badge-orange','paid'=>'badge-emerald'];
        ?>
        <span class="badge <?= $payBadge[$task['payment_status']] ?? 'badge-gray' ?>">
          Payment: <?= ucfirst($task['payment_status']) ?>
        </span>
      </div>
      <div class="card-body">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
          <?php foreach($steps as $i => $step): ?>
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;min-width:80px;text-align:center;">
            <div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.875rem;font-weight:700;
              <?php if($i < $curIdx): ?>background:var(--success);color:#fff;
              <?php elseif($i === $curIdx): ?>background:var(--accent);color:var(--primary);box-shadow:0 0 0 4px rgba(244,196,48,0.25);
              <?php else: ?>background:var(--bg-dark);color:var(--text-muted);<?php endif; ?>">
              <?php if($i < $curIdx): ?><i class="fa-solid fa-check"></i><?php else: echo $i+1; endif; ?>
            </div>
            <span style="font-size:.75rem;font-weight:600;color:<?= $i <= $curIdx ? 'var(--text)' : 'var(--text-muted)' ?>;">
              <?= $stepLabels[$i] ?>
            </span>
          </div>
          <?php if($i < count($steps)-1): ?>
          <div style="flex:1;height:2px;background:<?= $i < $curIdx ? 'var(--success)' : 'var(--border)' ?>;max-width:60px;"></div>
          <?php endif; ?>
          <?php endforeach; ?>
        </div>
      </div>
    </div>

    <!-- Two column -->
    <div style="display:grid;grid-template-columns:1fr 380px;gap:1.25rem;">

      <!-- Left: Order Info -->
      <div class="card">
        <div class="card-header"><h3><i class="fa-solid fa-file-lines" style="color:var(--primary);margin-right:8px"></i> Order Information</h3></div>
        <div class="card-body">
          <table style="width:100%;border-collapse:collapse;font-size:.875rem;">
            <?php
            $rows = [
              ['Serial Number', sanitize($task['serial_number'])],
              ['Task Name', sanitize($task['task_name'])],
              ['Type', ucfirst($task['task_type'])],
              ['Subject', sanitize($task['subject'] ?? '—')],
              ['Deadline', formatDate($task['deadline'])],
              ['Word Count', $task['word_count'] > 0 ? number_format((int)$task['word_count']).' words' : 'TBD'],
              ['Writer', sanitize($task['writer_name'] ?? '—')],
            ];
            foreach($rows as [$label,$val]): ?>
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:10px 12px;color:var(--text-muted);font-weight:600;width:40%;white-space:nowrap;"><?= $label ?></td>
              <td style="padding:10px 12px;color:var(--text);"><?= $val ?></td>
            </tr>
            <?php endforeach; ?>
          </table>
          <?php if($task['description']): ?>
          <div style="margin-top:1.25rem;">
            <div style="font-size:.8125rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem;">Description</div>
            <p style="font-size:.875rem;line-height:1.7;color:var(--text);"><?= nl2br(sanitize($task['description'])) ?></p>
          </div>
          <?php endif; ?>
          <?php if($task['notes']): ?>
          <div style="margin-top:1rem;padding:1rem;background:var(--bg);border-radius:var(--radius-sm);border-left:3px solid var(--accent);">
            <div style="font-size:.8125rem;font-weight:700;color:var(--text-muted);margin-bottom:.375rem;">Notes</div>
            <p style="font-size:.875rem;color:var(--text);line-height:1.6;"><?= nl2br(sanitize($task['notes'])) ?></p>
          </div>
          <?php endif; ?>
        </div>
      </div>

      <!-- Right: Payment -->
      <div style="display:flex;flex-direction:column;gap:1.25rem;">
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-money-bill-wave" style="color:var(--success);margin-right:8px"></i> Payment Summary</h3></div>
          <div class="card-body">
            <?php
            $due = (float)$task['final_client_pay'] - (float)$task['amount_received'];
            $rows2 = [
              ['Original Amount', formatCurrency((float)$task['client_pay'])],
              ['Discount', number_format((float)$task['discount_applied'],1).'%'],
              ['Final Amount', formatCurrency((float)$task['final_client_pay'])],
              ['Amount Paid', formatCurrency((float)$task['amount_received'])],
              ['Amount Due', formatCurrency(max(0, $due))],
            ];
            ?>
            <table style="width:100%;border-collapse:collapse;font-size:.875rem;">
              <?php foreach($rows2 as $i => [$label,$val]): ?>
              <tr style="border-bottom:1px solid var(--border);<?= $i === count($rows2)-1 ? 'border-bottom:none;' : '' ?>">
                <td style="padding:10px 8px;color:var(--text-muted);font-weight:600;"><?= $label ?></td>
                <td style="padding:10px 8px;text-align:right;font-weight:<?= $i >= 3 ? '700' : '500' ?>;color:<?= $i === count($rows2)-1 && $due > 0 ? 'var(--danger)' : 'var(--text)' ?>;"><?= $val ?></td>
              </tr>
              <?php endforeach; ?>
            </table>
            <?php if($due > 0): ?>
            <div style="margin-top:1rem;padding:.75rem 1rem;background:var(--danger-light);border-radius:var(--radius-sm);font-size:.8125rem;color:#7f1d1d;font-weight:600;">
              <i class="fa-solid fa-circle-exclamation"></i> PKR <?= number_format($due) ?> outstanding balance
            </div>
            <?php endif; ?>
          </div>
        </div>

        <?php if(!empty($payments)): ?>
        <div class="card">
          <div class="card-header"><h3>Payment History</h3></div>
          <div style="overflow:hidden;">
            <?php foreach($payments as $p): ?>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:.75rem 1.25rem;border-bottom:1px solid var(--border);font-size:.8125rem;">
              <div>
                <div style="font-weight:600;color:var(--text)"><?= formatDate($p['payment_date']) ?></div>
                <div style="color:var(--text-muted)"><?= sanitize($p['payment_method']) ?></div>
              </div>
              <div style="font-weight:700;color:var(--success)">+<?= formatCurrency((float)$p['amount']) ?></div>
            </div>
            <?php endforeach; ?>
          </div>
        </div>
        <?php endif; ?>

        <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>" target="_blank" rel="noopener"
           style="display:flex;align-items:center;justify-content:center;gap:.75rem;padding:1rem;background:#25D366;color:#fff;border-radius:var(--radius);font-weight:700;text-decoration:none;font-size:1rem;">
          <i class="fa-brands fa-whatsapp fa-lg"></i> Contact Support
        </a>
      </div>
    </div>

    <div style="text-align:left;">
      <a href="orders.php" class="btn btn-outline"><i class="fa-solid fa-arrow-left"></i> Back to Orders</a>
    </div>

  </main>
</div>
</div>
<script>
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
</script>
<!-- WhatsApp float -->
<a href="https://wa.me/<?= WHATSAPP_NUMBER ?>" target="_blank" rel="noopener"
   style="position:fixed;bottom:1.5rem;right:1.5rem;width:56px;height:56px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.75rem;box-shadow:0 4px 16px rgba(0,0,0,0.25);z-index:999;text-decoration:none;"
   title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
</body>
</html>
