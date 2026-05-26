<?php
/**
 * Grades Guru — Client Dashboard
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

// ── Queries ──────────────────────────────────────────────────────────────────

// Fresh user data (discount may have changed since session)
$stmtU = $pdo->prepare('SELECT referral_count, discount_percentage, spin_used, last_spin_date FROM users WHERE id = ? LIMIT 1');
$stmtU->execute([$userId]);
$freshUser = $stmtU->fetch();
$discountPct   = (float)$freshUser['discount_percentage'];
$referralCount = (int)$freshUser['referral_count'];
$spinUsed      = (int)$freshUser['spin_used'];
$lastSpinDate  = $freshUser['last_spin_date'];

// Monthly spin availability
$firstOfMonth   = date('Y-m-01');
$monthlyEnabled = (getSetting($pdo, 'monthly_spin_enabled') === '1');
$canSpin = ($spinUsed === 0) ||
           ($monthlyEnabled && ($lastSpinDate === null || $lastSpinDate < $firstOfMonth));
$spinType = ($spinUsed === 0) ? 'signup' : 'monthly';

// Next spin date
$nextSpinDate = date('M 1, Y', strtotime('first day of next month'));

// Total orders count
$stmtCount = $pdo->prepare('SELECT COUNT(*) FROM tasks WHERE client_id = ?');
$stmtCount->execute([$userId]);
$totalOrders = (int)$stmtCount->fetchColumn();

// Total paid
$stmtPaid = $pdo->prepare('SELECT COALESCE(SUM(amount_received), 0) FROM tasks WHERE client_id = ?');
$stmtPaid->execute([$userId]);
$totalPaid = (float)$stmtPaid->fetchColumn();

// Total due
$stmtDue = $pdo->prepare("SELECT COALESCE(SUM(final_client_pay - amount_received), 0) FROM tasks WHERE client_id = ? AND payment_status != 'paid'");
$stmtDue->execute([$userId]);
$totalDue = (float)$stmtDue->fetchColumn();

// Recent 5 tasks
$stmtTasks = $pdo->prepare('SELECT serial_number, task_name, task_type, subject, word_count, final_client_pay, payment_status, status, deadline FROM tasks WHERE client_id = ? ORDER BY created_at DESC LIMIT 5');
$stmtTasks->execute([$userId]);
$recentTasks = $stmtTasks->fetchAll();

// Unread notifications
$notifications  = getUnreadNotifications($pdo, $userId);
$unreadCount    = count($notifications);
$recentNotifs   = array_slice($notifications, 0, 3);

// Referral code & share link
$referralCode = $user['referral_code'];
$shareLink    = APP_URL . '/signup.php?ref=' . urlencode($referralCode);

// Discount tier messaging
$nextTier     = '';
$refNeeded    = 0;
if ($referralCount < 1) {
    $nextTier  = '10%';
    $refNeeded = 1;
} elseif ($referralCount < 2) {
    $nextTier  = '25%';
    $refNeeded = 1;
}

$flash = getFlash();

// ── Status/payment badge helpers ─────────────────────────────────────────────
function statusBadge(string $status): string {
    return match ($status) {
        'pending'     => '<span class="badge badge-gray"><i class="fa-solid fa-clock"></i> Pending</span>',
        'in_progress' => '<span class="badge badge-navy"><i class="fa-solid fa-spinner"></i> In Progress</span>',
        'completed'   => '<span class="badge badge-emerald"><i class="fa-solid fa-check"></i> Completed</span>',
        'delivered'   => '<span class="badge badge-gold"><i class="fa-solid fa-truck"></i> Delivered</span>',
        default       => '<span class="badge badge-gray">' . htmlspecialchars($status) . '</span>',
    };
}

function paymentBadge(string $status): string {
    return match ($status) {
        'due'     => '<span class="badge badge-red"><i class="fa-solid fa-circle-exclamation"></i> Due</span>',
        'partial' => '<span class="badge badge-orange"><i class="fa-solid fa-hourglass-half"></i> Partial</span>',
        'paid'    => '<span class="badge badge-emerald"><i class="fa-solid fa-circle-check"></i> Paid</span>',
        default   => '<span class="badge badge-gray">' . htmlspecialchars($status) . '</span>',
    };
}

$firstName = explode(' ', trim($user['name']))[0];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard — Grades Guru</title>
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
      <a href="dashboard.php" class="nav-link active">
        <i class="fa-solid fa-house"></i> Dashboard
      </a>
      <a href="orders.php" class="nav-link">
        <i class="fa-solid fa-file-lines"></i> My Orders
        <?php if ($totalOrders > 0): ?>
          <span class="nav-badge"><?= $totalOrders ?></span>
        <?php endif; ?>
      </a>

      <div class="nav-label" style="margin-top:8px;">Rewards</div>
      <a href="referrals.php" class="nav-link">
        <i class="fa-solid fa-users"></i> Referrals
        <?php if ($referralCount > 0): ?>
          <span class="nav-badge"><?= $referralCount ?></span>
        <?php endif; ?>
      </a>
      <a href="spin.php" class="nav-link">
        <i class="fa-solid fa-circle-notch"></i> Spin Wheel
        <?php if ($canSpin): ?>
          <span class="nav-badge pulse">!</span>
        <?php endif; ?>
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

    <!-- Topbar -->
    <header class="topbar">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="hamburger" id="hamburger" aria-label="Menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="topbar-title">
          <h1>Dashboard</h1>
          <p><?= date('l, F j, Y') ?></p>
        </div>
      </div>
      <div class="topbar-right">
        <div class="notif-wrap">
          <button class="topbar-btn" id="notifBtn" title="Notifications" aria-label="Notifications">
            <i class="fa-solid fa-bell"></i>
            <?php if ($unreadCount > 0): ?>
              <span class="notif-badge"><?= min($unreadCount, 9) ?></span>
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
        <div class="topbar-avatar" title="<?= sanitize($user['name']) ?>">
          <?= strtoupper(substr($user['name'], 0, 1)) ?>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="page-content">

      <?php if ($flash): ?>
        <div class="flash-msg <?= sanitize($flash['type']) ?>">
          <i class="fa-solid fa-circle-info"></i>
          <?= sanitize($flash['message']) ?>
        </div>
      <?php endif; ?>

      <!-- Welcome -->
      <div class="welcome-header">
        <h1>Welcome back, <?= sanitize($firstName) ?>!</h1>
        <p class="date-tag">
          <i class="fa-regular fa-calendar"></i>
          <?= date('F j, Y') ?> &mdash; Here's your portal overview
        </p>
      </div>

      <!-- Discount Banner -->
      <?php if ($discountPct > 0): ?>
      <div class="discount-banner">
        <i class="fa-solid fa-tag"></i>
        <div>
          <h4><?= number_format($discountPct, 0) ?>% Discount Active on Next Order</h4>
          <p>Your referral reward is ready — it will be applied automatically to your next order.</p>
        </div>
      </div>
      <?php endif; ?>

      <!-- Stats Row -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon navy"><i class="fa-solid fa-file-lines"></i></div>
          <div class="stat-info">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value"><?= $totalOrders ?></div>
            <div class="stat-sub">All time</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon emerald"><i class="fa-solid fa-circle-check"></i></div>
          <div class="stat-info">
            <div class="stat-label">Total Paid</div>
            <div class="stat-value">PKR <?= number_format($totalPaid) ?></div>
            <div class="stat-sub">Amount settled</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><i class="fa-solid fa-clock-rotate-left"></i></div>
          <div class="stat-info">
            <div class="stat-label">Amount Due</div>
            <div class="stat-value <?= $totalDue > 0 ? 'danger' : '' ?>">
              PKR <?= number_format($totalDue) ?>
            </div>
            <div class="stat-sub"><?= $totalDue > 0 ? 'Outstanding balance' : 'All clear!' ?></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gold"><i class="fa-solid fa-percent"></i></div>
          <div class="stat-info">
            <div class="stat-label">Active Discount</div>
            <div class="stat-value <?= $discountPct > 0 ? 'success' : '' ?>">
              <?= number_format($discountPct, 0) ?>%
            </div>
            <div class="stat-sub"><?= $discountPct > 0 ? 'Applied to next order' : 'Refer friends to earn' ?></div>
          </div>
        </div>
      </div>

      <!-- Referral + Spin (two-col) -->
      <div class="grid-2 mb-3">

        <!-- Referral Card -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fa-solid fa-users" style="color:var(--gold-dark);margin-right:8px;"></i> Your Referral Code</h3>
            <a href="referrals.php" class="btn btn-sm btn-outline">View All</a>
          </div>
          <div class="card-body">
            <div class="referral-code-display">
              <div class="code-label">Your unique code</div>
              <div class="code-value" id="refCode"><?= sanitize($referralCode) ?></div>

              <div class="copy-row" style="margin-bottom:10px;">
                <span class="copy-text" id="refCodeText"><?= sanitize($referralCode) ?></span>
                <button class="copy-btn" onclick="copyText('refCodeText', this)">
                  <i class="fa-regular fa-copy"></i> Copy
                </button>
              </div>
              <div class="copy-row">
                <span class="copy-text" id="shareLinkText" style="font-size:.75rem;"><?= sanitize($shareLink) ?></span>
                <button class="copy-btn" onclick="copyText('shareLinkText', this)">
                  <i class="fa-solid fa-link"></i> Copy
                </button>
              </div>

              <!-- Progress -->
              <div class="progress-wrapper">
                <div class="progress-header">
                  <span><?= $referralCount ?> friend<?= $referralCount !== 1 ? 's' : '' ?> referred</span>
                  <span><?= $referralCount >= 2 ? 'Max tier reached!' : '2 needed for max discount' ?></span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width:<?= min(100, ($referralCount / 2) * 100) ?>%"></div>
                </div>
                <?php if ($refNeeded > 0 && $referralCount < 2): ?>
                  <div class="progress-hint">
                    <?= $refNeeded ?> more referral<?= $refNeeded !== 1 ? 's' : '' ?> for <?= $nextTier ?> discount
                  </div>
                <?php else: ?>
                  <div class="progress-hint" style="color:var(--gold);">
                    <i class="fa-solid fa-star"></i> You've reached the max discount tier!
                  </div>
                <?php endif; ?>
              </div>
            </div>
          </div>
        </div>

        <!-- Spin Wheel Promo -->
        <div style="display:flex;flex-direction:column;gap:20px;">
          <div class="spin-promo card" style="border:0;min-height:160px;">
            <div class="spin-promo-text">
              <h3><i class="fa-solid fa-circle-notch" style="margin-right:8px;"></i> Monthly Spin</h3>
              <p>Spin for exclusive discounts, priority delivery &amp; more rewards!</p>
              <?php if (!$canSpin): ?>
                <p class="spin-available-date"><i class="fa-regular fa-calendar"></i> Next spin available: <?= $nextSpinDate ?></p>
              <?php endif; ?>
            </div>
            <?php if ($canSpin): ?>
              <a href="spin.php" class="btn btn-gold btn-lg" style="white-space:nowrap;">
                <i class="fa-solid fa-circle-notch fa-spin"></i> Spin Now!
              </a>
            <?php else: ?>
              <button class="btn btn-lg btn-disabled" disabled style="white-space:nowrap;background:rgba(255,255,255,.15);color:rgba(255,255,255,.4);cursor:not-allowed;">
                <i class="fa-solid fa-lock"></i> Locked
              </button>
            <?php endif; ?>
          </div>

          <!-- WhatsApp -->
          <div class="card">
            <div class="card-body text-center">
              <p style="font-size:.85rem;color:var(--gray-600);margin-bottom:14px;">
                Ready to place a new order? Chat with us on WhatsApp!
              </p>
              <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>" target="_blank" rel="noopener" class="wa-btn">
                <i class="fa-brands fa-whatsapp"></i> Place New Order
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="card mb-3">
        <div class="card-header">
          <h3><i class="fa-solid fa-list-check" style="color:var(--navy);margin-right:8px;"></i> Recent Orders</h3>
          <a href="orders.php" class="btn btn-sm btn-outline">View All Orders</a>
        </div>
        <div class="table-wrapper">
          <?php if (empty($recentTasks)): ?>
            <div class="empty-state">
              <i class="fa-solid fa-file-circle-plus"></i>
              <p>No orders yet. Place your first order via WhatsApp!</p>
            </div>
          <?php else: ?>
          <table class="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Type</th>
                <th>Words</th>
                <th>Deadline</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($recentTasks as $task): ?>
              <tr>
                <td>
                  <div class="task-name" title="<?= sanitize($task['task_name']) ?>">
                    <?= sanitize($task['task_name']) ?>
                  </div>
                  <div class="serial-no"><?= sanitize($task['serial_number']) ?></div>
                </td>
                <td>
                  <?php if ($task['task_type'] === 'technical'): ?>
                    <span class="badge badge-purple">Technical</span>
                  <?php else: ?>
                    <span class="badge badge-navy">Simple</span>
                  <?php endif; ?>
                </td>
                <td><?= number_format((int)$task['word_count']) ?></td>
                <td><?= formatDate($task['deadline']) ?></td>
                <td class="fw-600">PKR <?= number_format((float)$task['final_client_pay']) ?></td>
                <td><?= paymentBadge($task['payment_status']) ?></td>
                <td><?= statusBadge($task['status']) ?></td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
          <?php endif; ?>
        </div>
      </div>

      <!-- Notifications Feed -->
      <?php if (!empty($recentNotifs)): ?>
      <div class="card">
        <div class="card-header">
          <h3><i class="fa-solid fa-bell" style="color:var(--gold-dark);margin-right:8px;"></i> Recent Notifications</h3>
          <?php if ($unreadCount > 3): ?>
            <span class="badge badge-red"><?= $unreadCount ?> unread</span>
          <?php endif; ?>
        </div>
        <div class="card-body" style="padding-top:8px;padding-bottom:8px;">
          <?php foreach ($recentNotifs as $notif): ?>
          <div class="notif-item">
            <div class="notif-dot <?= sanitize($notif['type']) ?>"></div>
            <div>
              <div class="notif-text"><?= sanitize($notif['message']) ?></div>
              <div class="notif-time"><i class="fa-regular fa-clock"></i> <?= timeAgo($notif['created_at']) ?></div>
            </div>
          </div>
          <?php endforeach; ?>
        </div>
      </div>
      <?php endif; ?>

    </main>
  </div><!-- /.main-wrapper -->
</div><!-- /.layout -->

<script>
// ── Copy to clipboard ────────────────────────────────────────────────────────
function copyText(elId, btn) {
  const text = document.getElementById(elId).textContent.trim();
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    btn.style.background = '#10B981';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
    }, 2000);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; }, 2000);
  });
}

// ── Mobile sidebar ───────────────────────────────────────────────────────────
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── Notification dropdown ─────────────────────────────────────────────────────
(function() {
  const NOTIFS = <?= json_encode(array_map(fn($n) => [
    'message'    => $n['message'],
    'type'       => $n['type'],
    'created_at' => timeAgo($n['created_at']),
  ], $notifications)) ?>;
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
</script>
</body>
</html>
