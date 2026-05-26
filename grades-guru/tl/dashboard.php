<?php
/**
 * Grades Guru — TL Dashboard
 * Shows all tasks assigned to the current Team Lead.
 * IMPORTANT: No financial data is ever exposed here.
 */

require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

requireLogin();
requireRole('tl');

$user = getCurrentUser();
$pdo  = getPDO();

// ── Notifications ──────────────────────────────────────────────────────────────
$notifications    = getUnreadNotifications($pdo, (int)$user['id']);
$notifCount       = count($notifications);
markNotificationsRead($pdo, (int)$user['id']);

// ── Stats ──────────────────────────────────────────────────────────────────────
$monthStart = date('Y-m-01');
$monthEnd   = date('Y-m-t');

$stmtStats = $pdo->prepare(
    'SELECT
        SUM(status = "pending")     AS pending_count,
        SUM(status = "in_progress") AS in_progress_count,
        SUM(status = "completed"  AND assigned_date BETWEEN ? AND ?) AS completed_month,
        SUM(status = "delivered"  AND assigned_date BETWEEN ? AND ?) AS delivered_month
     FROM tasks
     WHERE tl_id = ?'
);
$stmtStats->execute([$monthStart, $monthEnd, $monthStart, $monthEnd, $user['id']]);
$stats = $stmtStats->fetch();

// ── Today's tasks ──────────────────────────────────────────────────────────────
$today = date('Y-m-d');
$stmtToday = $pdo->prepare(
    'SELECT t.id, t.serial_number, t.task_name, t.task_type, t.subject,
            t.deadline, t.assigned_date, t.word_count, t.status,
            u.name AS client_name
     FROM tasks t
     JOIN users u ON u.id = t.client_id
     WHERE t.tl_id = ? AND t.deadline = ?
       AND t.status NOT IN ("completed","delivered")
     ORDER BY t.deadline ASC'
);
$stmtToday->execute([$user['id'], $today]);
$todayTasks = $stmtToday->fetchAll();

// ── Filters ────────────────────────────────────────────────────────────────────
$filterStatus = $_GET['status'] ?? 'all';
$search       = trim($_GET['q'] ?? '');
$validStatuses = ['all','pending','in_progress','completed','delivered'];
if (!in_array($filterStatus, $validStatuses, true)) {
    $filterStatus = 'all';
}

$whereClause = 'WHERE t.tl_id = ?';
$params      = [(int)$user['id']];

if ($filterStatus !== 'all') {
    $whereClause .= ' AND t.status = ?';
    $params[]     = $filterStatus;
}
if ($search !== '') {
    $whereClause .= ' AND t.task_name LIKE ?';
    $params[]     = '%' . $search . '%';
}

$stmtTasks = $pdo->prepare(
    "SELECT t.id, t.serial_number, t.task_name, t.task_type, t.subject,
            t.deadline, t.assigned_date, t.word_count, t.status,
            u.name AS client_name
     FROM tasks t
     JOIN users u ON u.id = t.client_id
     {$whereClause}
     ORDER BY
         FIELD(t.status,'in_progress','pending','completed','delivered'),
         t.deadline ASC"
);
$stmtTasks->execute($params);
$tasks = $stmtTasks->fetchAll();

$flash = getFlash();

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusBadge(string $status): string
{
    return match ($status) {
        'pending'     => '<span class="badge badge-gray"><i class="fa-regular fa-clock"></i> Pending</span>',
        'in_progress' => '<span class="badge badge-gold"><i class="fa-solid fa-spinner"></i> In Progress</span>',
        'completed'   => '<span class="badge badge-navy"><i class="fa-solid fa-check"></i> Completed</span>',
        'delivered'   => '<span class="badge badge-emerald"><i class="fa-solid fa-paper-plane"></i> Delivered</span>',
        default       => '<span class="badge badge-gray">' . htmlspecialchars($status) . '</span>',
    };
}

function deadlineClass(string $deadline, string $status): string
{
    if (in_array($status, ['completed','delivered'], true)) {
        return '';
    }
    return strtotime($deadline) < strtotime('today') ? 'text-danger fw-bold' : '';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TL Dashboard — Grades Guru</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
  <style>
    .today-section {
      background: linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%);
      border: 1px solid rgba(244,196,48,.35);
      border-radius: var(--radius);
      padding: 20px 22px;
      margin-bottom: 24px;
    }
    .today-section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .today-section-header h3 {
      font-size: .95rem;
      color: var(--navy);
    }
    .today-badge {
      background: var(--gold);
      color: var(--navy);
      font-size: .65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
    }
    .today-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .today-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #fff;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-sm);
      padding: 8px 14px;
      font-size: .82rem;
      color: var(--navy);
      text-decoration: none;
      transition: all var(--transition);
      box-shadow: var(--shadow-sm);
    }
    .today-chip:hover {
      border-color: var(--gold);
      box-shadow: 0 2px 8px rgba(244,196,48,.25);
      transform: translateY(-1px);
      color: var(--navy);
    }
    .today-chip .chip-name { font-weight: 600; }
    .today-chip .chip-deadline {
      font-size: .72rem;
      color: var(--red);
      font-weight: 600;
    }
    .text-danger { color: var(--red) !important; }
    .fw-bold { font-weight: 700; }
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 18px;
      align-items: center;
    }
    .filter-tabs {
      display: flex;
      gap: 4px;
      background: var(--gray-100);
      border-radius: var(--radius-sm);
      padding: 3px;
    }
    .filter-tab {
      padding: 6px 14px;
      border-radius: 4px;
      font-size: .78rem;
      font-weight: 600;
      color: var(--gray-600);
      text-decoration: none;
      transition: all var(--transition);
    }
    .filter-tab:hover { color: var(--navy); background: #fff; }
    .filter-tab.active {
      background: var(--navy);
      color: #fff;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fff;
      border: 1.5px solid var(--gray-300);
      border-radius: var(--radius-sm);
      padding: 6px 12px;
      flex: 1;
      min-width: 200px;
      max-width: 320px;
    }
    .search-box i { color: var(--gray-500); font-size: .85rem; }
    .search-box input {
      border: none;
      outline: none;
      font-family: 'DM Sans', sans-serif;
      font-size: .85rem;
      width: 100%;
      color: var(--navy);
      background: transparent;
    }
    .actions-cell { white-space: nowrap; }
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--gray-500);
    }
    .empty-state i { font-size: 2.5rem; margin-bottom: 12px; color: var(--gray-300); }
    .empty-state p { font-size: .9rem; }
  </style>
</head>
<body>
<div class="layout">

  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <a href="dashboard.php">
        <div class="logo-icon">GG</div>
        <span>Grades Guru</span>
      </a>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-label">Team Lead</div>
      <a href="dashboard.php" class="nav-link active">
        <i class="fa-solid fa-gauge-high"></i>
        Dashboard
      </a>
      <a href="dashboard.php?status=pending" class="nav-link">
        <i class="fa-regular fa-clock"></i>
        Pending Tasks
        <?php if ((int)($stats['pending_count'] ?? 0) > 0): ?>
          <span class="nav-badge pulse"><?= (int)$stats['pending_count'] ?></span>
        <?php endif; ?>
      </a>
      <a href="dashboard.php?status=in_progress" class="nav-link">
        <i class="fa-solid fa-spinner"></i>
        In Progress
        <?php if ((int)($stats['in_progress_count'] ?? 0) > 0): ?>
          <span class="nav-badge"><?= (int)$stats['in_progress_count'] ?></span>
        <?php endif; ?>
      </a>
    </nav>

    <div class="sidebar-user">
      <div class="sidebar-user-info">
        <div class="user-avatar-sm">
          <?= strtoupper(substr($user['name'], 0, 2)) ?>
        </div>
        <div>
          <div class="sidebar-user-name"><?= sanitize($user['name']) ?></div>
          <div class="sidebar-user-email">Team Lead</div>
        </div>
      </div>
      <a href="../logout.php" class="logout-link">
        <i class="fa-solid fa-right-from-bracket"></i>
        Sign Out
      </a>
    </div>
  </aside>

  <!-- Main -->
  <div class="main-wrapper">

    <!-- Topbar -->
    <header class="topbar">
      <div class="topbar-title">
        <h1>TL Dashboard</h1>
        <p><?= date('l, F j, Y') ?></p>
      </div>
      <div class="topbar-right">
        <?php if ($notifCount > 0): ?>
          <div style="position:relative;">
            <i class="fa-solid fa-bell" style="color:var(--gold); font-size:1.1rem;"></i>
            <span class="notif-badge"><?= $notifCount ?></span>
          </div>
        <?php endif; ?>
        <div class="topbar-avatar" title="<?= sanitize($user['name']) ?>">
          <?= strtoupper(substr($user['name'], 0, 2)) ?>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="page-content">

      <!-- Flash message -->
      <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] === 'success' ? 'success' : 'danger' ?>" style="
          background: <?= $flash['type'] === 'success' ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)' ?>;
          border: 1px solid <?= $flash['type'] === 'success' ? 'rgba(16,185,129,.35)' : 'rgba(239,68,68,.35)' ?>;
          color: <?= $flash['type'] === 'success' ? '#065f46' : '#991b1b' ?>;
          padding: 12px 18px;
          border-radius: var(--radius-sm);
          margin-bottom: 20px;
          font-size: .875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          <i class="fa-solid <?= $flash['type'] === 'success' ? 'fa-circle-check' : 'fa-circle-xmark' ?>"></i>
          <?= sanitize($flash['message']) ?>
        </div>
      <?php endif; ?>

      <!-- Welcome -->
      <div class="welcome-header">
        <h1>Welcome back, <?= sanitize(explode(' ', $user['name'])[0]) ?></h1>
        <div class="date-tag">
          <i class="fa-regular fa-calendar"></i>
          <?= date('l, F j, Y') ?>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon gold">
            <i class="fa-regular fa-clock"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Pending</div>
            <div class="stat-value"><?= (int)($stats['pending_count'] ?? 0) ?></div>
            <div class="stat-sub">Awaiting action</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon navy">
            <i class="fa-solid fa-spinner"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">In Progress</div>
            <div class="stat-value"><?= (int)($stats['in_progress_count'] ?? 0) ?></div>
            <div class="stat-sub">Currently active</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon emerald">
            <i class="fa-solid fa-check-double"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Completed</div>
            <div class="stat-value"><?= (int)($stats['completed_month'] ?? 0) ?></div>
            <div class="stat-sub">This month</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <i class="fa-solid fa-paper-plane"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Delivered</div>
            <div class="stat-value"><?= (int)($stats['delivered_month'] ?? 0) ?></div>
            <div class="stat-sub">This month</div>
          </div>
        </div>
      </div>

      <!-- Today's Tasks -->
      <?php if (!empty($todayTasks)): ?>
        <div class="today-section">
          <div class="today-section-header">
            <i class="fa-solid fa-bolt" style="color: var(--gold);"></i>
            <h3>Due Today</h3>
            <span class="today-badge"><?= count($todayTasks) ?></span>
          </div>
          <div class="today-chips">
            <?php foreach ($todayTasks as $t): ?>
              <a href="task-detail.php?id=<?= (int)$t['id'] ?>" class="today-chip">
                <i class="fa-solid fa-file-lines" style="color:var(--navy); font-size:.8rem;"></i>
                <span class="chip-name"><?= sanitize(mb_strimwidth($t['task_name'], 0, 40, '…')) ?></span>
                <?= statusBadge($t['status']) ?>
              </a>
            <?php endforeach; ?>
          </div>
        </div>
      <?php endif; ?>

      <!-- Tasks Table -->
      <div class="card">
        <div class="card-header">
          <h2><i class="fa-solid fa-list-check" style="color:var(--navy); margin-right:8px; font-size:.9rem;"></i>My Tasks</h2>
        </div>
        <div class="card-body" style="padding:18px 22px 8px;">

          <!-- Filter + Search -->
          <form method="get" class="filter-bar" id="filterForm">
            <div class="filter-tabs">
              <?php
              $tabs = ['all'=>'All','pending'=>'Pending','in_progress'=>'In Progress','completed'=>'Completed','delivered'=>'Delivered'];
              foreach ($tabs as $val => $label):
              ?>
                <a href="?status=<?= $val ?><?= $search ? '&q='.urlencode($search) : '' ?>"
                   class="filter-tab <?= $filterStatus === $val ? 'active' : '' ?>">
                  <?= $label ?>
                </a>
              <?php endforeach; ?>
            </div>
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" name="q" value="<?= sanitize($search) ?>"
                     placeholder="Search tasks…" id="searchInput">
              <?php if ($filterStatus !== 'all'): ?>
                <input type="hidden" name="status" value="<?= sanitize($filterStatus) ?>">
              <?php endif; ?>
            </div>
          </form>

          <!-- Table -->
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Serial No.</th>
                  <th>Task Name</th>
                  <th>Client</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Deadline</th>
                  <th>Assigned</th>
                  <th>Words</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <?php if (empty($tasks)): ?>
                  <tr>
                    <td colspan="10">
                      <div class="empty-state">
                        <i class="fa-solid fa-inbox"></i>
                        <p>No tasks found<?= $filterStatus !== 'all' ? ' for this filter' : '' ?>.</p>
                      </div>
                    </td>
                  </tr>
                <?php else: ?>
                  <?php foreach ($tasks as $task): ?>
                    <?php
                      $isOverdue = strtotime($task['deadline']) < strtotime('today')
                                   && !in_array($task['status'], ['completed','delivered'], true);
                    ?>
                    <tr>
                      <td><span class="serial-no"><?= sanitize($task['serial_number']) ?></span></td>
                      <td>
                        <a href="task-detail.php?id=<?= (int)$task['id'] ?>"
                           class="task-name" title="<?= sanitize($task['task_name']) ?>"
                           style="display:block; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--navy);">
                          <?= sanitize(mb_strimwidth($task['task_name'], 0, 50, '…')) ?>
                        </a>
                      </td>
                      <td><?= sanitize(explode(' ', $task['client_name'])[0]) ?></td>
                      <td><?= $task['subject'] ? sanitize($task['subject']) : '<span style="color:var(--gray-400);">—</span>' ?></td>
                      <td>
                        <span class="badge <?= $task['task_type'] === 'technical' ? 'badge-purple' : 'badge-navy' ?>">
                          <?= ucfirst($task['task_type']) ?>
                        </span>
                      </td>
                      <td>
                        <span class="<?= $isOverdue ? 'text-danger fw-bold' : '' ?>">
                          <?php if ($isOverdue): ?><i class="fa-solid fa-triangle-exclamation" style="font-size:.75rem;"></i> <?php endif; ?>
                          <?= formatDate($task['deadline']) ?>
                        </span>
                      </td>
                      <td><?= $task['assigned_date'] ? formatDate($task['assigned_date']) : '—' ?></td>
                      <td><?= (int)$task['word_count'] > 0 ? number_format((int)$task['word_count']) : '<span style="color:var(--gray-400);">0</span>' ?></td>
                      <td><?= statusBadge($task['status']) ?></td>
                      <td class="actions-cell">
                        <a href="task-detail.php?id=<?= (int)$task['id'] ?>" class="btn btn-navy btn-sm">
                          <i class="fa-solid fa-eye"></i> View
                        </a>
                        <a href="task-detail.php?id=<?= (int)$task['id'] ?>#update" class="btn btn-gold btn-sm" style="margin-left:4px;">
                          <i class="fa-solid fa-pen"></i> Update
                        </a>
                      </td>
                    </tr>
                  <?php endforeach; ?>
                <?php endif; ?>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          Showing <?= count($tasks) ?> task<?= count($tasks) !== 1 ? 's' : '' ?>
          <?= $filterStatus !== 'all' ? ' — filtered by <strong>' . sanitize(str_replace('_',' ',$filterStatus)) . '</strong>' : '' ?>
          <?= $search ? ' — search: <strong>' . sanitize($search) . '</strong>' : '' ?>
        </div>
      </div>

    </main>
  </div><!-- /.main-wrapper -->
</div><!-- /.layout -->

<script>
// Auto-submit search with short debounce
const searchInput = document.getElementById('searchInput');
let searchTimer;
if (searchInput) {
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      document.getElementById('filterForm').submit();
    }, 450);
  });
}
</script>

</body>
</html>
