<?php
/**
 * Grades Guru — Admin: Order Detail & Edit
 */
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';
require_once '../includes/pricing.php';
require_once '../includes/google-sheets.php';

requireLogin();
requireRole('admin');
$user = getCurrentUser();
$pdo  = getPDO();

$taskId = (int)($_GET['id'] ?? 0);
if (!$taskId) redirect(APP_URL . '/admin/orders.php');

// Load task
$stmt = $pdo->prepare(
    "SELECT t.*, u.name AS client_name, u.email AS client_email,
            tl.name AS tl_name, tl.email AS tl_email,
            a.name AS created_by_name
     FROM tasks t
     JOIN users u  ON u.id = t.client_id
     LEFT JOIN users tl ON tl.id = t.tl_id
     LEFT JOIN users a  ON a.id = t.created_by
     WHERE t.id = ? LIMIT 1"
);
$stmt->execute([$taskId]);
$task = $stmt->fetch();
if (!$task) { setFlash('error', 'Order not found.'); redirect(APP_URL . '/admin/orders.php'); }

$errors = [];

// Handle status update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status'])) {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid request.';
    } else {
        $newStatus = $_POST['new_status'] ?? '';
        $validStatuses = ['pending','assigned','in_progress','completed','delivered','revision'];
        if (!in_array($newStatus, $validStatuses)) { $errors[] = 'Invalid status.'; }

        if (empty($errors)) {
            $pdo->prepare("UPDATE tasks SET status=?, updated_at=NOW() WHERE id=?")->execute([$newStatus, $taskId]);
            if ($newStatus === 'delivered') {
                createNotification($pdo, (int)$task['client_id'],
                    "Your order \"{$task['task_name']}\" has been delivered!", 'success');
                recalculateTask($pdo, $taskId);
            }
            setFlash('success', 'Status updated to ' . ucfirst($newStatus) . '.');
            redirect(APP_URL . "/admin/order-detail.php?id=$taskId");
        }
    }
}

// Handle full edit save
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_order'])) {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid request.';
    } else {
        $taskName   = trim($_POST['task_name'] ?? '');
        $taskType   = $_POST['task_type'] ?? 'simple';
        $wordCount  = (int)($_POST['word_count'] ?? 0);
        $writerPay  = (float)($_POST['writer_pay'] ?? 0);
        $customPrice= $_POST['custom_price'] ? (float)$_POST['custom_price'] : null;
        $tlId       = (int)($_POST['tl_id'] ?? 0) ?: null;
        $deadline   = $_POST['deadline'] ?? '';
        $notes      = trim($_POST['notes'] ?? '');
        $internalNote = trim($_POST['internal_note'] ?? '');

        if (empty($taskName)) $errors[] = 'Task name is required.';

        if (empty($errors)) {
            $clientPay    = calculateClientPay($pdo, $wordCount, $taskType, $customPrice);
            $discountPct  = (float)($task['discount_applied'] ?? 0);
            $finalPay     = $discountPct > 0 ? applyDiscount($clientPay, $discountPct) : $clientPay;
            $tlPay        = calculateTLPay($pdo, date('Y-m-d'), $tlId);
            $profit       = calculateProfit($finalPay, $writerPay, $tlPay);

            $pdo->prepare(
                "UPDATE tasks SET task_name=?, task_type=?, word_count=?, writer_pay=?,
                 custom_price=?, tl_id=?, deadline=?, notes=?, internal_note=?,
                 client_pay=?, final_client_pay=?, tl_pay=?, profit=?, updated_at=NOW()
                 WHERE id=?"
            )->execute([$taskName, $taskType, $wordCount ?: null, $writerPay, $customPrice,
                        $tlId, $deadline ?: null, $notes, $internalNote,
                        $clientPay, $finalPay, $tlPay, $profit, $taskId]);

            setFlash('success', 'Order updated successfully.');
            redirect(APP_URL . "/admin/order-detail.php?id=$taskId");
        }
    }
}

// Handle recalculate
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['recalculate'])) {
    if (validateCsrfToken($_POST['csrf_token'] ?? '')) {
        recalculateTask($pdo, $taskId);
        setFlash('success', 'Financials recalculated.');
        redirect(APP_URL . "/admin/order-detail.php?id=$taskId");
    }
}

// Handle sheets sync
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sync_sheets'])) {
    if (validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $row = [
            $task['serial_number'], $task['task_name'], $task['status'],
            $task['task_type'], $task['word_count'] ?? '', $task['deadline'] ?? '',
            $task['final_client_pay'] ?? 0, $task['amount_received'] ?? 0,
            $task['payment_status'], $task['client_name'], $task['tl_name'] ?? '',
            date('Y-m-d H:i:s')
        ];
        $ok = sheetsAppendRow(SPREADSHEET_ID, SHEET_NAME, $row);
        if ($ok) {
            $pdo->prepare("UPDATE tasks SET synced_to_sheets=1 WHERE id=?")->execute([$taskId]);
            setFlash('success', 'Synced to Google Sheets.');
        } else {
            setFlash('error', 'Sheets sync failed. Check credentials.');
        }
        redirect(APP_URL . "/admin/order-detail.php?id=$taskId");
    }
}

// Reload after possible update
$stmt->execute([$taskId]);
$task = $stmt->fetch();

// Payment history
$payments = $pdo->prepare(
    "SELECT p.*, a.name AS recorded_by_name FROM payments p
     JOIN users a ON a.id = p.recorded_by
     WHERE p.task_id = ? ORDER BY p.payment_date DESC"
);
$payments->execute([$taskId]);
$payments = $payments->fetchAll();

// TL list for dropdown
$tls = $pdo->query("SELECT id,name FROM users WHERE role='tl' AND status='active' ORDER BY name")->fetchAll();

$flash     = getFlash();
$csrfToken = getCsrfToken();

$statusColors = [
    'pending'    => 'badge-gray',
    'assigned'   => 'badge-navy',
    'in_progress'=> 'badge-gold',
    'completed'  => 'badge-blue',
    'delivered'  => 'badge-emerald',
    'revision'   => 'badge-orange',
];
$statusLabels = [
    'pending'    => 'Pending',
    'assigned'   => 'Assigned',
    'in_progress'=> 'In Progress',
    'completed'  => 'Completed',
    'delivered'  => 'Delivered',
    'revision'   => 'Revision',
];
$allStatuses = array_keys($statusColors);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order <?= sanitize($task['serial_number']) ?> — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
  <style>
  .form-group{display:flex;flex-direction:column;gap:.375rem;margin-bottom:1.25rem;}
  .form-label{font-size:.8125rem;font-weight:600;color:var(--text-muted);}
  .form-control{padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);font-family:var(--font-body);outline:none;transition:border-color .2s;width:100%;}
  .form-control:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(244,196,48,.12);}
  .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;}
  .detail-item{background:var(--bg);border-radius:var(--radius-sm);padding:.75rem 1rem;border:1px solid var(--border);}
  .detail-item-label{font-size:.75rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.25rem;}
  .detail-item-value{font-size:.95rem;font-weight:600;color:var(--primary);}
  .fin-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;}
  @media(max-width:900px){.fin-grid{grid-template-columns:repeat(2,1fr);}.detail-grid{grid-template-columns:1fr;}}
  .fin-card{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:1rem;text-align:center;}
  .fin-card-label{font-size:.75rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;}
  .fin-card-value{font-size:1.25rem;font-weight:700;margin-top:.25rem;}
  .status-bar{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;}
  .action-bar{display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1.25rem;}
  </style>
</head>
<body>
<div class="layout">
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo"><a href="dashboard.php"><div class="logo-icon">GG</div><?= APP_NAME ?></a></div>
  <nav class="sidebar-nav">
    <div class="nav-label">Main</div>
    <a href="dashboard.php" class="nav-link"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
    <a href="orders.php" class="nav-link active"><i class="fa-solid fa-list-check"></i> All Orders</a>
    <a href="new-order.php" class="nav-link"><i class="fa-solid fa-plus-circle"></i> New Order</a>
    <div class="nav-label">People</div>
    <a href="clients.php" class="nav-link"><i class="fa-solid fa-users"></i> Clients</a>
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
      <div class="topbar-title">
        <h1><?= sanitize($task['serial_number']) ?></h1>
        <p><?= sanitize(substr($task['task_name'],0,55)) ?></p>
      </div>
    </div>
    <div class="topbar-right">
      <a href="orders.php" class="btn btn-outline btn-sm"><i class="fa-solid fa-arrow-left"></i> Back</a>
      <div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>
  <main class="page-content">

    <?php if(!empty($errors)): ?>
    <div class="flash-msg error"><i class="fa-solid fa-circle-exclamation"></i> <?= implode(' &bull; ', array_map('sanitize',$errors)) ?></div>
    <?php endif; ?>
    <?php if($flash): ?><div class="flash-msg <?= $flash['type'] ?>"><i class="fa-solid fa-circle-check"></i> <?= sanitize($flash['message']) ?></div><?php endif; ?>

    <!-- Action bar -->
    <div class="action-bar">
      <span class="badge <?= $statusColors[$task['status']] ?? 'badge-gray' ?>" style="font-size:.9rem;padding:.45rem .85rem;">
        <?= $statusLabels[$task['status']] ?? ucfirst($task['status']) ?>
      </span>
      <form method="POST" style="display:inline-flex;align-items:center;gap:.5rem;">
        <?= csrfField() ?>
        <input type="hidden" name="update_status" value="1">
        <select name="new_status" class="form-control" style="width:auto;padding:.4rem .7rem;font-size:.85rem;">
          <?php foreach($allStatuses as $s): ?>
          <option value="<?= $s ?>" <?= $s===$task['status']?'selected':'' ?>><?= $statusLabels[$s] ?></option>
          <?php endforeach; ?>
        </select>
        <button type="submit" class="btn btn-navy btn-sm">Update Status</button>
      </form>
      <form method="POST" style="display:inline;">
        <?= csrfField() ?>
        <input type="hidden" name="recalculate" value="1">
        <button type="submit" class="btn btn-outline btn-sm"><i class="fa-solid fa-rotate"></i> Recalculate</button>
      </form>
      <form method="POST" style="display:inline;" onsubmit="return confirm('Sync this order to Google Sheets?')">
        <?= csrfField() ?>
        <input type="hidden" name="sync_sheets" value="1">
        <button type="submit" class="btn btn-sm <?= $task['synced_to_sheets'] ? 'btn-outline' : 'btn-emerald' ?>">
          <i class="fa-brands fa-google"></i> <?= $task['synced_to_sheets'] ? 'Re-sync Sheets' : 'Sync to Sheets' ?>
        </button>
      </form>
      <a href="new-payment.php?task_id=<?= $task['id'] ?>" class="btn btn-gold btn-sm"><i class="fa-solid fa-money-bill"></i> Log Payment</a>
    </div>

    <!-- Financials -->
    <div class="fin-grid" style="margin-bottom:1.25rem;">
      <div class="fin-card">
        <div class="fin-card-label">Client Pay</div>
        <div class="fin-card-value" style="color:var(--primary)"><?= formatCurrency((float)$task['final_client_pay']) ?></div>
        <?php if($task['discount_applied'] > 0): ?>
        <div style="font-size:.75rem;color:var(--text-muted)">After <?= $task['discount_applied'] ?>% discount</div>
        <?php endif; ?>
      </div>
      <div class="fin-card">
        <div class="fin-card-label">Amount Received</div>
        <div class="fin-card-value" style="color:var(--success)"><?= formatCurrency((float)$task['amount_received']) ?></div>
        <div style="font-size:.75rem;color:var(--text-muted)">
          <span class="badge <?= $task['payment_status']==='paid'?'badge-emerald':($task['payment_status']==='partial'?'badge-gold':'badge-orange') ?>">
            <?= ucfirst($task['payment_status']) ?>
          </span>
        </div>
      </div>
      <div class="fin-card">
        <div class="fin-card-label">Writer Pay</div>
        <div class="fin-card-value" style="color:var(--danger)"><?= formatCurrency((float)$task['writer_pay']) ?></div>
      </div>
      <div class="fin-card">
        <div class="fin-card-label">Profit</div>
        <div class="fin-card-value" style="color:<?= (float)$task['profit'] >= 0 ? 'var(--success)' : 'var(--danger)' ?>">
          <?= formatCurrency((float)$task['profit']) ?>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">

      <!-- Order Info + Edit Form -->
      <div class="card" style="align-self:start;">
        <div class="card-header"><h3><i class="fa-solid fa-pen" style="color:var(--accent);margin-right:8px"></i>Order Details</h3></div>
        <form method="POST" class="card-body">
          <?= csrfField() ?>
          <input type="hidden" name="save_order" value="1">

          <div class="form-group">
            <label class="form-label">Task Name *</label>
            <input type="text" name="task_name" class="form-control" required value="<?= sanitize($task['task_name']) ?>">
          </div>

          <div class="detail-grid" style="margin-bottom:1.25rem;">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Task Type</label>
              <select name="task_type" class="form-control">
                <option value="technical" <?= $task['task_type']==='technical'?'selected':'' ?>>Technical (PKR <?= RATE_TECHNICAL ?>/word)</option>
                <option value="simple" <?= $task['task_type']==='simple'?'selected':'' ?>>Simple (PKR <?= RATE_SIMPLE ?>/word)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Word Count</label>
              <input type="number" name="word_count" class="form-control" value="<?= (int)$task['word_count'] ?>" min="0">
            </div>
          </div>

          <div class="detail-grid" style="margin-bottom:1.25rem;">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Writer Pay (PKR)</label>
              <input type="number" name="writer_pay" class="form-control" step="0.01" value="<?= number_format((float)$task['writer_pay'],2,'.','') ?>">
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Custom Price (PKR)</label>
              <input type="number" name="custom_price" class="form-control" step="0.01" value="<?= $task['custom_price'] ? number_format((float)$task['custom_price'],2,'.','') : '' ?>" placeholder="Auto-calculated">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Assign TL</label>
            <select name="tl_id" class="form-control">
              <option value="">— Unassigned —</option>
              <?php foreach($tls as $tl): ?>
              <option value="<?= $tl['id'] ?>" <?= (int)$task['tl_id']===$tl['id']?'selected':'' ?>><?= sanitize($tl['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Deadline</label>
            <input type="date" name="deadline" class="form-control" value="<?= sanitize($task['deadline'] ?? '') ?>">
          </div>

          <div class="form-group">
            <label class="form-label">Client Notes</label>
            <textarea name="notes" class="form-control" rows="2"><?= sanitize($task['notes'] ?? '') ?></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Internal Note (Admin Only)</label>
            <textarea name="internal_note" class="form-control" rows="2"><?= sanitize($task['internal_note'] ?? '') ?></textarea>
          </div>

          <button type="submit" class="btn btn-gold" style="width:100%;justify-content:center;">
            <i class="fa-solid fa-floppy-disk"></i> Save Changes
          </button>
        </form>
      </div>

      <!-- Right column: order info + payments -->
      <div style="display:flex;flex-direction:column;gap:1.25rem;">

        <!-- Key info -->
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-circle-info" style="color:var(--accent);margin-right:8px"></i>Key Info</h3></div>
          <div class="card-body">
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-item-label">Client</div>
                <div class="detail-item-value">
                  <a href="client-detail.php?id=<?= $task['client_id'] ?>" style="color:var(--primary)"><?= sanitize($task['client_name']) ?></a>
                </div>
                <div style="font-size:.75rem;color:var(--text-muted)"><?= sanitize($task['client_email']) ?></div>
              </div>
              <div class="detail-item">
                <div class="detail-item-label">Team Lead</div>
                <div class="detail-item-value"><?= $task['tl_name'] ? sanitize($task['tl_name']) : '<span style="color:var(--text-muted)">Unassigned</span>' ?></div>
              </div>
              <div class="detail-item">
                <div class="detail-item-label">Serial</div>
                <div class="detail-item-value"><span class="serial-no"><?= sanitize($task['serial_number']) ?></span></div>
              </div>
              <div class="detail-item">
                <div class="detail-item-label">Created</div>
                <div class="detail-item-value"><?= formatDate($task['created_at']) ?></div>
              </div>
              <?php if($task['deadline']): ?>
              <div class="detail-item">
                <div class="detail-item-label">Deadline</div>
                <div class="detail-item-value" style="color:<?= strtotime($task['deadline']) < time() && $task['status'] !== 'delivered' ? 'var(--danger)' : 'var(--primary)' ?>">
                  <?= formatDate($task['deadline']) ?>
                  <?php if(strtotime($task['deadline']) < time() && $task['status'] !== 'delivered'): ?>
                  <span class="badge badge-orange" style="margin-left:4px">Overdue</span>
                  <?php endif; ?>
                </div>
              </div>
              <?php endif; ?>
              <div class="detail-item">
                <div class="detail-item-label">Sheets Sync</div>
                <div class="detail-item-value">
                  <?= $task['synced_to_sheets'] ? '<span class="badge badge-emerald">Synced</span>' : '<span class="badge badge-gray">Not synced</span>' ?>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment history -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fa-solid fa-receipt" style="color:var(--success);margin-right:8px"></i>Payments</h3>
            <a href="new-payment.php?task_id=<?= $task['id'] ?>" class="btn btn-sm btn-gold"><i class="fa-solid fa-plus"></i> Log</a>
          </div>
          <?php if(empty($payments)): ?>
          <div class="empty-state"><i class="fa-solid fa-receipt"></i><p>No payments yet.</p></div>
          <?php else: ?>
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>By</th></tr></thead>
              <tbody>
              <?php foreach($payments as $p): ?>
              <tr>
                <td><?= formatDate($p['payment_date']) ?></td>
                <td style="font-weight:700;color:var(--success)"><?= formatCurrency((float)$p['amount']) ?></td>
                <td><span class="badge badge-navy"><?= sanitize($p['payment_method']) ?></span></td>
                <td style="font-size:.8rem;color:var(--text-muted)"><?= sanitize($p['recorded_by_name']) ?></td>
              </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
          </div>
          <div style="padding:.75rem 1.25rem;border-top:1px solid var(--border);font-weight:700;text-align:right;">
            Total: <span style="color:var(--success)"><?= formatCurrency(array_sum(array_column($payments,'amount'))) ?></span>
            / <span style="color:var(--primary)"><?= formatCurrency((float)$task['final_client_pay']) ?></span>
          </div>
          <?php endif; ?>
        </div>

        <!-- TL note -->
        <?php if($task['tl_note'] ?? ''): ?>
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-comment" style="color:var(--accent);margin-right:8px"></i>TL Note</h3></div>
          <div class="card-body" style="color:var(--text-muted);font-size:.9rem;line-height:1.6"><?= nl2br(sanitize($task['tl_note'])) ?></div>
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
