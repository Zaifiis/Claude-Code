<?php
/**
 * Grades Guru — Admin: Log New Payment
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

// All tasks with outstanding balances
$tasks = $pdo->query(
    "SELECT t.id, t.serial_number, t.task_name, t.final_client_pay, t.amount_received,
            (t.final_client_pay - t.amount_received) AS amount_due,
            u.name AS client_name
     FROM tasks t JOIN users u ON u.id = t.client_id
     WHERE t.payment_status != 'paid'
     ORDER BY u.name ASC, t.created_at DESC"
)->fetchAll();

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid request token.';
    } else {
        $taskId  = (int)($_POST['task_id'] ?? 0);
        $amount  = (float)($_POST['amount'] ?? 0);
        $method  = trim($_POST['payment_method'] ?? '');
        $date    = $_POST['payment_date'] ?? date('Y-m-d');
        $notes   = trim($_POST['notes'] ?? '');

        if (!$taskId)              $errors[] = 'Select a task.';
        if ($amount <= 0)          $errors[] = 'Amount must be greater than 0.';
        if (empty($method))        $errors[] = 'Payment method is required.';
        if (empty($date))          $errors[] = 'Payment date is required.';

        if (empty($errors)) {
            // Get task
            $stmtT = $pdo->prepare('SELECT id, client_id, final_client_pay, amount_received FROM tasks WHERE id = ? LIMIT 1');
            $stmtT->execute([$taskId]);
            $task = $stmtT->fetch();
            if (!$task) { $errors[] = 'Task not found.'; }
        }

        if (empty($errors)) {
            $pdo->beginTransaction();
            try {
                // Insert payment
                $pdo->prepare(
                    'INSERT INTO payments (task_id,client_id,amount,payment_method,payment_date,notes,recorded_by)
                     VALUES (?,?,?,?,?,?,?)'
                )->execute([$taskId, $task['client_id'], $amount, $method, $date, $notes, (int)$user['id']]);

                // Update task
                $newReceived = (float)$task['amount_received'] + $amount;
                $finalPay    = (float)$task['final_client_pay'];
                if ($newReceived >= $finalPay) {
                    $payStatus = 'paid';
                } elseif ($newReceived > 0) {
                    $payStatus = 'partial';
                } else {
                    $payStatus = 'due';
                }

                $pdo->prepare('UPDATE tasks SET amount_received = ?, payment_status = ? WHERE id = ?')
                    ->execute([$newReceived, $payStatus, $taskId]);

                $pdo->commit();

                // Notify client
                createNotification($pdo, (int)$task['client_id'],
                    "Payment of " . formatCurrency($amount) . " received via {$method}. Thank you!",
                    'success');

                setFlash('success', 'Payment of ' . formatCurrency($amount) . ' logged successfully.');
                redirect(APP_URL . '/admin/payments.php');
            } catch (Exception $e) {
                $pdo->rollBack();
                $errors[] = 'Database error. Please try again.';
                error_log('[GG Payment] ' . $e->getMessage());
            }
        }
    }
}

$csrfToken = getCsrfToken();
$methods   = ['JazzCash','Easypaisa','Bank Transfer','Cash','Other'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log Payment — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
  <style>
  .form-group { display:flex; flex-direction:column; gap:.375rem; margin-bottom:1.25rem; }
  .form-label { font-size:.8125rem; font-weight:600; color:var(--text-muted); }
  .form-control { padding:.625rem .875rem; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.875rem; background:var(--bg); font-family:var(--font-body); outline:none; transition:border-color .2s; width:100%; }
  .form-control:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(244,196,48,.12); }
  .due-preview { background:var(--danger-light); color:#7f1d1d; border-radius:var(--radius-sm); padding:.75rem 1rem; font-weight:700; font-size:1.1rem; }
  </style>
</head>
<body>
<div class="layout">
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo"><a href="dashboard.php"><div class="logo-icon">GG</div><?= APP_NAME ?></a></div>
  <nav class="sidebar-nav">
    <div class="nav-label">Finance</div>
    <a href="payments.php" class="nav-link"><i class="fa-solid fa-money-bill-wave"></i> Payments</a>
    <a href="new-payment.php" class="nav-link active"><i class="fa-solid fa-plus"></i> Log Payment</a>
    <div class="nav-label">Main</div>
    <a href="dashboard.php" class="nav-link"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
    <a href="orders.php" class="nav-link"><i class="fa-solid fa-list-check"></i> All Orders</a>
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
      <div class="topbar-title"><h1>Log Payment</h1><p>Record a client payment</p></div>
    </div>
    <div class="topbar-right"><div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div></div>
  </header>
  <main class="page-content">

    <?php if(!empty($errors)): ?>
    <div class="flash-msg error"><i class="fa-solid fa-circle-exclamation"></i> <?= implode(' &bull; ', array_map('sanitize',$errors)) ?></div>
    <?php endif; ?>

    <div style="max-width:600px;">
      <form method="POST" class="card">
        <div class="card-header"><h3><i class="fa-solid fa-money-bill" style="color:var(--success);margin-right:8px"></i> Payment Details</h3></div>
        <div class="card-body">
          <?= csrfField() ?>

          <div class="form-group">
            <label class="form-label">Task / Order <span style="color:var(--danger)">*</span></label>
            <select name="task_id" id="taskSelect" class="form-control" required>
              <option value="">— Select task —</option>
              <?php foreach($tasks as $t): ?>
              <option value="<?= $t['id'] ?>"
                      data-due="<?= $t['amount_due'] ?>"
                      <?= (int)($_POST['task_id']??0)===$t['id']?'selected':'' ?>>
                <?= sanitize($t['client_name']) ?> | <?= sanitize($t['serial_number']) ?> — <?= sanitize(substr($t['task_name'],0,35)) ?>
                (Due: PKR <?= number_format((float)$t['amount_due']) ?>)
              </option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Amount Due</label>
            <div class="due-preview" id="duePreview">Select a task above</div>
          </div>

          <div class="form-group">
            <label class="form-label">Payment Amount (PKR) <span style="color:var(--danger)">*</span></label>
            <input type="number" name="amount" id="amountField" class="form-control" min="0.01" step="0.01"
                   value="<?= htmlspecialchars($_POST['amount'] ?? '') ?>" required placeholder="0.00">
          </div>

          <div class="form-group">
            <label class="form-label">Payment Method <span style="color:var(--danger)">*</span></label>
            <select name="payment_method" class="form-control" required>
              <option value="">— Select —</option>
              <?php foreach($methods as $m): ?>
              <option value="<?= $m ?>" <?= ($_POST['payment_method']??'')===$m?'selected':'' ?>><?= $m ?></option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Payment Date <span style="color:var(--danger)">*</span></label>
            <input type="date" name="payment_date" class="form-control" value="<?= sanitize($_POST['payment_date'] ?? date('Y-m-d')) ?>" required>
          </div>

          <div class="form-group">
            <label class="form-label">Notes (optional)</label>
            <textarea name="notes" class="form-control" rows="2"><?= sanitize($_POST['notes'] ?? '') ?></textarea>
          </div>
        </div>
        <div style="padding:1rem 1.25rem;border-top:1px solid var(--border);background:var(--bg);display:flex;gap:.75rem;justify-content:flex-end;">
          <a href="payments.php" class="btn btn-outline">Cancel</a>
          <button type="submit" class="btn btn-emerald"><i class="fa-solid fa-check"></i> Record Payment</button>
        </div>
      </form>
    </div>

  </main>
</div>
</div>
<script>
document.getElementById('hamburger').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));

const taskSelect  = document.getElementById('taskSelect');
const duePreview  = document.getElementById('duePreview');
const amountField = document.getElementById('amountField');

taskSelect.addEventListener('change', function () {
  const opt = this.options[this.selectedIndex];
  const due = parseFloat(opt.dataset.due) || 0;
  if (due > 0) {
    duePreview.textContent = 'PKR ' + due.toLocaleString('en-PK', {maximumFractionDigits:2});
    duePreview.style.background = 'var(--danger-light)';
    amountField.value = due.toFixed(2);
  } else {
    duePreview.textContent = 'No outstanding balance';
    duePreview.style.background = 'var(--success-light)';
    duePreview.style.color = '#065f46';
    amountField.value = '';
  }
});
</script>
</body>
</html>
