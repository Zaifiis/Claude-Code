<?php
/**
 * Grades Guru — Client Orders List
 */
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';
requireLogin();
requireRole('client');
$user = getCurrentUser();
$pdo  = getPDO();

$userId = (int)$user['id'];

// ── Filter inputs ─────────────────────────────────────────────────────────────
$filterStatus  = $_GET['status']   ?? '';
$filterPayment = $_GET['payment']  ?? '';
$filterFrom    = $_GET['from']     ?? '';
$filterTo      = $_GET['to']       ?? '';
$filterSearch  = trim($_GET['search'] ?? '');
$page          = max(1, (int)($_GET['page'] ?? 1));
$perPage       = 10;

// Allowed filter values
$validStatuses  = ['pending', 'in_progress', 'completed', 'delivered'];
$validPayments  = ['due', 'partial', 'paid'];
if (!in_array($filterStatus, $validStatuses, true))  $filterStatus  = '';
if (!in_array($filterPayment, $validPayments, true)) $filterPayment = '';

// ── Build query ───────────────────────────────────────────────────────────────
$where  = ['client_id = :uid'];
$params = [':uid' => $userId];

if ($filterStatus !== '') {
    $where[]  = 'status = :st';
    $params[':st'] = $filterStatus;
}
if ($filterPayment !== '') {
    $where[]  = 'payment_status = :ps';
    $params[':ps'] = $filterPayment;
}
if ($filterFrom !== '') {
    $where[]  = 'deadline >= :df';
    $params[':df'] = $filterFrom;
}
if ($filterTo !== '') {
    $where[]  = 'deadline <= :dt';
    $params[':dt'] = $filterTo;
}
if ($filterSearch !== '') {
    $where[]  = '(task_name LIKE :sq OR serial_number LIKE :sq2 OR subject LIKE :sq3)';
    $params[':sq']  = '%' . $filterSearch . '%';
    $params[':sq2'] = '%' . $filterSearch . '%';
    $params[':sq3'] = '%' . $filterSearch . '%';
}

$whereSQL = implode(' AND ', $where);

// Count total for pagination
$stmtCount = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE $whereSQL");
$stmtCount->execute($params);
$totalRecords = (int)$stmtCount->fetchColumn();

$pagination = paginate($totalRecords, $page, $perPage);

// Fetch page of tasks
$stmtTasks = $pdo->prepare("
    SELECT id, serial_number, task_name, task_type, subject, deadline,
           word_count, client_pay, discount_applied, final_client_pay,
           payment_status, amount_received, status, created_at
    FROM tasks
    WHERE $whereSQL
    ORDER BY created_at DESC
    LIMIT :lim OFFSET :off
");
foreach ($params as $k => $v) {
    $stmtTasks->bindValue($k, $v);
}
$stmtTasks->bindValue(':lim', $perPage, PDO::PARAM_INT);
$stmtTasks->bindValue(':off', $pagination['offset'], PDO::PARAM_INT);
$stmtTasks->execute();
$tasks = $stmtTasks->fetchAll();

// Summary totals (unfiltered for this user; filtered for what's shown)
$stmtSum = $pdo->prepare("SELECT
    COALESCE(SUM(final_client_pay), 0) AS total_amount,
    COALESCE(SUM(amount_received), 0)  AS total_paid,
    COALESCE(SUM(final_client_pay - amount_received), 0) AS total_due
    FROM tasks WHERE $whereSQL");
$stmtSum->execute($params);
$summary = $stmtSum->fetch();

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusBadge(string $s): string {
    return match ($s) {
        'pending'     => '<span class="badge badge-gray"><i class="fa-solid fa-clock"></i> Pending</span>',
        'in_progress' => '<span class="badge badge-navy"><i class="fa-solid fa-spinner"></i> In Progress</span>',
        'completed'   => '<span class="badge badge-emerald"><i class="fa-solid fa-check"></i> Completed</span>',
        'delivered'   => '<span class="badge badge-gold"><i class="fa-solid fa-truck"></i> Delivered</span>',
        default       => '<span class="badge badge-gray">' . htmlspecialchars($s) . '</span>',
    };
}
function paymentBadge(string $s): string {
    return match ($s) {
        'due'     => '<span class="badge badge-red"><i class="fa-solid fa-circle-exclamation"></i> Due</span>',
        'partial' => '<span class="badge badge-orange"><i class="fa-solid fa-hourglass-half"></i> Partial</span>',
        'paid'    => '<span class="badge badge-emerald"><i class="fa-solid fa-circle-check"></i> Paid</span>',
        default   => '<span class="badge badge-gray">' . htmlspecialchars($s) . '</span>',
    };
}

// Unread notifications count
$stmtNotif = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
$stmtNotif->execute([$userId]);
$unreadCount = (int)$stmtNotif->fetchColumn();

// ── Build page URL helper ─────────────────────────────────────────────────────
function pageUrl(int $p): string {
    $q = $_GET;
    $q['page'] = $p;
    return '?' . http_build_query($q);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Orders — Grades Guru</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
</head>
<body>
<div class="layout">

  <!-- ── Sidebar ──────────────────────────────────────────────── -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <a href="dashboard.php">
        <div class="logo-icon">GG</div>
        Grades Guru
      </a>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-label">Main</div>
      <a href="dashboard.php" class="nav-link">
        <i class="fa-solid fa-house"></i> Dashboard
      </a>
      <a href="orders.php" class="nav-link active">
        <i class="fa-solid fa-file-lines"></i> My Orders
      </a>
      <div class="nav-label" style="margin-top:8px;">Rewards</div>
      <a href="referrals.php" class="nav-link">
        <i class="fa-solid fa-users"></i> Referrals
      </a>
      <a href="spin.php" class="nav-link">
        <i class="fa-solid fa-circle-notch"></i> Spin Wheel
      </a>
    </nav>
    <div class="sidebar-user">
      <div class="sidebar-user-info">
        <div class="user-avatar-sm"><?= strtoupper(substr($user['name'], 0, 1)) ?></div>
        <div>
          <div class="sidebar-user-name"><?= sanitize($user['name']) ?></div>
          <div class="sidebar-user-email"><?= sanitize($user['email']) ?></div>
        </div>
      </div>
      <a href="../logout.php" class="logout-link">
        <i class="fa-solid fa-right-from-bracket"></i> Sign Out
      </a>
    </div>
  </aside>

  <!-- ── Main ─────────────────────────────────────────────────── -->
  <div class="main-wrapper">
    <header class="topbar">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="hamburger" id="hamburger"><i class="fa-solid fa-bars"></i></button>
        <div class="topbar-title">
          <h1>My Orders</h1>
          <p><?= $totalRecords ?> order<?= $totalRecords !== 1 ? 's' : '' ?> total</p>
        </div>
      </div>
      <div class="topbar-right">
        <button class="topbar-btn" title="Notifications">
          <i class="fa-solid fa-bell"></i>
          <?php if ($unreadCount > 0): ?>
            <span class="notif-badge"><?= min($unreadCount, 9) ?></span>
          <?php endif; ?>
        </button>
        <div class="topbar-avatar"><?= strtoupper(substr($user['name'], 0, 1)) ?></div>
      </div>
    </header>

    <main class="page-content">

      <!-- Filter Bar -->
      <form method="GET" action="">
        <div class="filter-bar">
          <div class="filter-group">
            <label>Status</label>
            <select name="status">
              <option value="">All Statuses</option>
              <option value="pending"     <?= $filterStatus === 'pending'     ? 'selected' : '' ?>>Pending</option>
              <option value="in_progress" <?= $filterStatus === 'in_progress' ? 'selected' : '' ?>>In Progress</option>
              <option value="completed"   <?= $filterStatus === 'completed'   ? 'selected' : '' ?>>Completed</option>
              <option value="delivered"   <?= $filterStatus === 'delivered'   ? 'selected' : '' ?>>Delivered</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Payment</label>
            <select name="payment">
              <option value="">All Payments</option>
              <option value="due"     <?= $filterPayment === 'due'     ? 'selected' : '' ?>>Due</option>
              <option value="partial" <?= $filterPayment === 'partial' ? 'selected' : '' ?>>Partial</option>
              <option value="paid"    <?= $filterPayment === 'paid'    ? 'selected' : '' ?>>Paid</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Deadline From</label>
            <input type="date" name="from" value="<?= sanitize($filterFrom) ?>">
          </div>
          <div class="filter-group">
            <label>Deadline To</label>
            <input type="date" name="to" value="<?= sanitize($filterTo) ?>">
          </div>
          <div class="filter-group search">
            <label>Search</label>
            <input type="text" name="search" placeholder="Task name, serial, subject..."
                   value="<?= sanitize($filterSearch) ?>">
          </div>
          <div class="filter-actions">
            <button type="submit" class="btn btn-navy">
              <i class="fa-solid fa-magnifying-glass"></i> Filter
            </button>
            <a href="orders.php" class="btn btn-outline">
              <i class="fa-solid fa-rotate-left"></i> Reset
            </a>
          </div>
        </div>
      </form>

      <!-- Orders Table -->
      <div class="card">
        <div class="table-wrapper">
          <?php if (empty($tasks)): ?>
            <div class="empty-state">
              <i class="fa-solid fa-file-magnifying-glass"></i>
              <p>No orders match your filters.</p>
              <a href="orders.php" class="btn btn-outline mt-2">Clear Filters</a>
            </div>
          <?php else: ?>
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Task Name</th>
                <th>Type</th>
                <th>Subject</th>
                <th>Deadline</th>
                <th>Words</th>
                <th>Base Pay</th>
                <th>Disc%</th>
                <th>Final Pay</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <?php $rowNum = $pagination['offset'] + 1; ?>
              <?php foreach ($tasks as $task): ?>
              <tr>
                <td>
                  <span class="serial-no"><?= $rowNum++ ?></span>
                  <div class="serial-no" style="font-size:.68rem;color:var(--gray-400);">
                    <?= sanitize($task['serial_number']) ?>
                  </div>
                </td>
                <td>
                  <div class="task-name" title="<?= sanitize($task['task_name']) ?>">
                    <?= sanitize($task['task_name']) ?>
                  </div>
                </td>
                <td>
                  <?php if ($task['task_type'] === 'technical'): ?>
                    <span class="badge badge-purple">Technical</span>
                  <?php else: ?>
                    <span class="badge badge-navy">Simple</span>
                  <?php endif; ?>
                </td>
                <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  <?= sanitize($task['subject'] ?? '—') ?>
                </td>
                <td>
                  <?php
                    $deadlineTs = strtotime($task['deadline']);
                    $isPast = $deadlineTs < time() && !in_array($task['status'], ['completed','delivered'], true);
                  ?>
                  <span style="<?= $isPast ? 'color:var(--red);font-weight:600;' : '' ?>">
                    <?= formatDate($task['deadline']) ?>
                  </span>
                </td>
                <td><?= number_format((int)$task['word_count']) ?></td>
                <td>PKR <?= number_format((float)$task['client_pay']) ?></td>
                <td>
                  <?php if ((float)$task['discount_applied'] > 0): ?>
                    <span class="badge badge-gold"><?= number_format((float)$task['discount_applied'], 1) ?>%</span>
                  <?php else: ?>
                    <span class="text-muted">—</span>
                  <?php endif; ?>
                </td>
                <td class="fw-700" style="color:var(--navy);">
                  PKR <?= number_format((float)$task['final_client_pay']) ?>
                </td>
                <td><?= paymentBadge($task['payment_status']) ?></td>
                <td><?= statusBadge($task['status']) ?></td>
                <td>
                  <a href="order-detail.php?id=<?= (int)$task['id'] ?>" class="btn btn-sm btn-navy">
                    <i class="fa-solid fa-eye"></i> View
                  </a>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
          <?php endif; ?>
        </div>

        <!-- Pagination -->
        <?php if ($pagination['total_pages'] > 1): ?>
        <div class="pagination">
          <?php if ($pagination['page'] > 1): ?>
            <a href="<?= pageUrl(1) ?>" class="page-link" title="First">
              <i class="fa-solid fa-angles-left"></i>
            </a>
            <a href="<?= pageUrl($pagination['page'] - 1) ?>" class="page-link">
              <i class="fa-solid fa-angle-left"></i>
            </a>
          <?php else: ?>
            <span class="page-link disabled"><i class="fa-solid fa-angles-left"></i></span>
            <span class="page-link disabled"><i class="fa-solid fa-angle-left"></i></span>
          <?php endif; ?>

          <?php
            $startPage = max(1, $pagination['page'] - 2);
            $endPage   = min($pagination['total_pages'], $pagination['page'] + 2);
            for ($i = $startPage; $i <= $endPage; $i++):
          ?>
            <a href="<?= pageUrl($i) ?>" class="page-link <?= $i === $pagination['page'] ? 'active' : '' ?>">
              <?= $i ?>
            </a>
          <?php endfor; ?>

          <?php if ($pagination['page'] < $pagination['total_pages']): ?>
            <a href="<?= pageUrl($pagination['page'] + 1) ?>" class="page-link">
              <i class="fa-solid fa-angle-right"></i>
            </a>
            <a href="<?= pageUrl($pagination['total_pages']) ?>" class="page-link" title="Last">
              <i class="fa-solid fa-angles-right"></i>
            </a>
          <?php else: ?>
            <span class="page-link disabled"><i class="fa-solid fa-angle-right"></i></span>
            <span class="page-link disabled"><i class="fa-solid fa-angles-right"></i></span>
          <?php endif; ?>
        </div>
        <?php endif; ?>

        <!-- Summary Bar -->
        <?php if ($totalRecords > 0): ?>
        <div class="summary-bar">
          <div class="summary-item">
            <i class="fa-solid fa-list"></i>
            <strong><?= $totalRecords ?></strong> order<?= $totalRecords !== 1 ? 's' : '' ?>
          </div>
          <div class="summary-item gold">
            Total: <strong>PKR <?= number_format((float)$summary['total_amount']) ?></strong>
          </div>
          <div class="summary-item success">
            Paid: <strong>PKR <?= number_format((float)$summary['total_paid']) ?></strong>
          </div>
          <div class="summary-item danger">
            Due: <strong>PKR <?= number_format((float)$summary['total_due']) ?></strong>
          </div>
          <div class="summary-item" style="margin-left:auto;font-size:.75rem;opacity:.6;">
            Page <?= $pagination['page'] ?> of <?= $pagination['total_pages'] ?>
          </div>
        </div>
        <?php endif; ?>

      </div><!-- /.card -->

    </main>
  </div>
</div>

<script>
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
</script>
</body>
</html>
