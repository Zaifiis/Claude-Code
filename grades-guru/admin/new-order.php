<?php
/**
 * Grades Guru — Admin: Log New Order
 */
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';
require_once '../includes/pricing.php';

requireLogin();
requireRole('admin');
$user = getCurrentUser();
$pdo  = getPDO();

$errors = [];

// Load clients and TLs for dropdowns
$clients = $pdo->query("SELECT id, name, email, discount_percentage FROM users WHERE role='client' AND status='active' ORDER BY name ASC")->fetchAll();
$tls     = $pdo->query("SELECT id, name FROM users WHERE role='tl' AND status='active' ORDER BY name ASC")->fetchAll();

// ── Handle POST ───────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid request token.';
    } else {
        $clientId    = (int)($_POST['client_id'] ?? 0);
        $taskName    = trim($_POST['task_name'] ?? '');
        $taskType    = $_POST['task_type'] ?? '';
        $subject     = trim($_POST['subject'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $deadline    = $_POST['deadline'] ?? '';
        $assignedDate= $_POST['assigned_date'] ?? date('Y-m-d');
        $writerName  = trim($_POST['writer_name'] ?? '');
        $tlId        = (int)($_POST['tl_id'] ?? 0);
        $wordCount   = (int)($_POST['word_count'] ?? 0);
        $customPrice = (float)($_POST['custom_price'] ?? 0);
        $writerPay   = (float)($_POST['writer_pay'] ?? 0);
        $discountInput = (float)($_POST['discount_applied'] ?? 0);
        $notes       = trim($_POST['notes'] ?? '');

        if (!$clientId)                              $errors[] = 'Client is required.';
        if (empty($taskName))                        $errors[] = 'Task name is required.';
        if (!in_array($taskType,['technical','simple'],true)) $errors[] = 'Task type is required.';
        if (empty($deadline))                        $errors[] = 'Deadline is required.';

        if (empty($errors)) {
            // Calculate financials
            $clientPay     = calculateClientPay($pdo, $wordCount, $taskType, $customPrice > 0 ? $customPrice : null);
            $tlPay         = $tlId > 0 ? calculateTLPay($pdo, $assignedDate) : 0.0;
            $discountApplied = $discountInput;
            $finalClientPay  = applyDiscount($clientPay, $discountApplied);
            $profit          = calculateProfit($finalClientPay, $writerPay, $tlPay);
            $serial          = generateSerialNumber($pdo);

            // Client name (denormalized)
            $cstmt = $pdo->prepare('SELECT name FROM users WHERE id = ? LIMIT 1');
            $cstmt->execute([$clientId]);
            $clientName = $cstmt->fetchColumn() ?: '';

            // Handle file upload
            $filePath = null;
            if (!empty($_FILES['task_file']['name'])) {
                $filePath = handleFileUpload($_FILES['task_file'], 'tasks');
            }

            $pdo->prepare(
                'INSERT INTO tasks
                 (serial_number,client_id,client_name,task_name,task_type,subject,description,
                  deadline,assigned_date,writer_name,tl_id,word_count,client_pay,writer_pay,
                  tl_pay,profit,discount_applied,final_client_pay,notes,file_path)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
            )->execute([
                $serial,$clientId,$clientName,$taskName,$taskType,$subject,$description,
                $deadline,$assignedDate,$writerName,$tlId ?: null,$wordCount,$clientPay,
                $writerPay,$tlPay,$profit,$discountApplied,$finalClientPay,$notes,$filePath,
            ]);

            $newTaskId = (int)$pdo->lastInsertId();

            // Reset client discount if applied
            if ($discountApplied > 0) {
                $pdo->prepare('UPDATE users SET discount_percentage = 0 WHERE id = ?')->execute([$clientId]);
            }

            // Notify client
            createNotification($pdo, $clientId, "New order logged: {$taskName} (#{$serial})", 'info');

            // Notify TL
            if ($tlId > 0) {
                createNotification($pdo, $tlId, "New task assigned: {$taskName} — Deadline: {$deadline}", 'info');
            }

            setFlash('success', "Order #{$serial} created successfully.");
            redirect(APP_URL . '/admin/order-detail.php?id=' . $newTaskId);
        }
    }
}

$csrfToken = getCsrfToken();
$unreadNotifs = getUnreadNotifications($pdo, (int)$user['id']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
  <style>
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
  .form-grid.col-3 { grid-template-columns:1fr 1fr 1fr; }
  .form-group { display:flex; flex-direction:column; gap:.375rem; }
  .form-label { font-size:.8125rem; font-weight:600; color:var(--text-muted); }
  .form-label .req { color:var(--danger); }
  .form-control { padding:.625rem .875rem; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.875rem; background:var(--bg); font-family:var(--font-body); outline:none; transition:border-color .2s,box-shadow .2s; width:100%; }
  .form-control:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(244,196,48,.12); }
  textarea.form-control { resize:vertical; }
  .radio-group { display:flex; gap:1rem; }
  .radio-card { flex:1; padding:.875rem 1rem; border:2px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; transition:var(--transition); text-align:center; }
  .radio-card input { position:absolute; opacity:0; }
  .radio-card.checked { border-color:var(--accent); background:rgba(244,196,48,.06); }
  .calc-preview { background:var(--primary); color:var(--accent); border-radius:var(--radius-sm); padding:1rem 1.25rem; font-family:var(--font-heading); font-size:1.375rem; font-weight:700; text-align:center; }
  .form-section-title { font-size:.8rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); border-bottom:1px solid var(--border); padding-bottom:.5rem; margin:1.5rem 0 1rem; }
  @media(max-width:640px){ .form-grid,.form-grid.col-3{ grid-template-columns:1fr; } }
  </style>
</head>
<body>
<div class="layout">

<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo"><a href="dashboard.php"><div class="logo-icon">GG</div><?= APP_NAME ?></a></div>
  <nav class="sidebar-nav">
    <div class="nav-label">Main</div>
    <a href="dashboard.php"   class="nav-link"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
    <a href="orders.php"      class="nav-link"><i class="fa-solid fa-list-check"></i> All Orders</a>
    <a href="new-order.php"   class="nav-link active"><i class="fa-solid fa-plus-circle"></i> New Order</a>
    <div class="nav-label">People</div>
    <a href="clients.php"     class="nav-link"><i class="fa-solid fa-users"></i> Clients</a>
    <a href="referrals.php"   class="nav-link"><i class="fa-solid fa-share-nodes"></i> Referrals</a>
    <a href="tl-accounts.php" class="nav-link"><i class="fa-solid fa-user-tie"></i> TL Accounts</a>
    <div class="nav-label">Finance</div>
    <a href="payments.php"    class="nav-link"><i class="fa-solid fa-money-bill-wave"></i> Payments</a>
    <a href="reports.php"     class="nav-link"><i class="fa-solid fa-chart-line"></i> Reports</a>
    <div class="nav-label">System</div>
    <a href="sheets-sync.php" class="nav-link"><i class="fa-brands fa-google"></i> Sheets Sync</a>
    <a href="settings.php"    class="nav-link"><i class="fa-solid fa-gear"></i> Settings</a>
  </nav>
  <div class="sidebar-user">
    <div class="sidebar-user-info">
      <div class="user-avatar-sm"><?= strtoupper(substr($user['name'],0,1)) ?></div>
      <div><div class="sidebar-user-name"><?= sanitize($user['name']) ?></div>
      <div class="sidebar-user-email">Administrator</div></div>
    </div>
    <a href="../logout.php" class="logout-link"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</a>
  </div>
</aside>

<div class="main-wrapper">
  <header class="topbar">
    <div style="display:flex;align-items:center;gap:12px;">
      <button class="hamburger" id="hamburger"><i class="fa-solid fa-bars"></i></button>
      <div class="topbar-title"><h1>New Order</h1><p>Log an incoming order</p></div>
    </div>
    <div class="topbar-right">
      <button class="topbar-btn"><i class="fa-solid fa-bell"></i>
        <?php if(count($unreadNotifs)): ?><span class="notif-badge"><?= count($unreadNotifs) ?></span><?php endif; ?>
      </button>
      <div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>

  <main class="page-content">

    <?php if(!empty($errors)): ?>
    <div class="flash-msg error"><i class="fa-solid fa-circle-exclamation"></i>
      <?= implode(' &bull; ', array_map('sanitize', $errors)) ?>
    </div>
    <?php endif; ?>

    <form method="POST" enctype="multipart/form-data">
      <?= csrfField() ?>

      <!-- Order Details card -->
      <div class="card" style="margin-bottom:1.25rem;">
        <div class="card-header"><h3><i class="fa-solid fa-file-pen" style="color:var(--accent);margin-right:8px"></i> Order Details</h3></div>
        <div class="card-body">

          <div class="form-section-title">Client & Task</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Client <span class="req">*</span></label>
              <select name="client_id" id="clientSelect" class="form-control" required>
                <option value="">— Select client —</option>
                <?php foreach($clients as $c): ?>
                <option value="<?= $c['id'] ?>" data-discount="<?= $c['discount_percentage'] ?>"
                  <?= (isset($_POST['client_id']) && (int)$_POST['client_id'] === $c['id']) ? 'selected' : '' ?>>
                  <?= sanitize($c['name']) ?> — <?= sanitize($c['email']) ?>
                </option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Task Name <span class="req">*</span></label>
              <input type="text" name="task_name" class="form-control" required
                     value="<?= sanitize($_POST['task_name'] ?? '') ?>" placeholder="e.g. Business Report Analysis">
            </div>
          </div>

          <div class="form-section-title">Task Type & Subject</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Task Type <span class="req">*</span></label>
              <div class="radio-group">
                <label class="radio-card <?= ($_POST['task_type'] ?? '') === 'technical' ? 'checked' : '' ?>">
                  <input type="radio" name="task_type" value="technical" onchange="updateTypeCards(this)">
                  <div style="font-weight:700;color:var(--primary)">Technical</div>
                  <div style="font-size:.75rem;color:var(--text-muted)">PKR 3/word</div>
                </label>
                <label class="radio-card <?= ($_POST['task_type'] ?? '') === 'simple' ? 'checked' : '' ?>">
                  <input type="radio" name="task_type" value="simple" onchange="updateTypeCards(this)">
                  <div style="font-weight:700;color:var(--primary)">Simple</div>
                  <div style="font-size:.75rem;color:var(--text-muted)">PKR 1.5/word</div>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Subject</label>
              <input type="text" name="subject" class="form-control" value="<?= sanitize($_POST['subject'] ?? '') ?>" placeholder="e.g. Economics, Python, Finance">
            </div>
          </div>

          <div class="form-group" style="margin-top:1rem;">
            <label class="form-label">Description</label>
            <textarea name="description" class="form-control" rows="4" placeholder="Order requirements and details…"><?= sanitize($_POST['description'] ?? '') ?></textarea>
          </div>

          <div class="form-section-title">Dates & Assignment</div>
          <div class="form-grid col-3">
            <div class="form-group">
              <label class="form-label">Deadline <span class="req">*</span></label>
              <input type="date" name="deadline" class="form-control" required value="<?= sanitize($_POST['deadline'] ?? '') ?>">
            </div>
            <div class="form-group">
              <label class="form-label">Assigned Date</label>
              <input type="date" name="assigned_date" class="form-control" value="<?= sanitize($_POST['assigned_date'] ?? date('Y-m-d')) ?>">
            </div>
            <div class="form-group">
              <label class="form-label">Writer Name</label>
              <input type="text" name="writer_name" class="form-control" value="<?= sanitize($_POST['writer_name'] ?? '') ?>" placeholder="Freelancer name">
            </div>
          </div>

          <div class="form-group" style="margin-top:1rem;">
            <label class="form-label">Team Lead (TL)</label>
            <select name="tl_id" class="form-control">
              <option value="">— No TL assigned —</option>
              <?php foreach($tls as $tl): ?>
              <option value="<?= $tl['id'] ?>" <?= ((int)($_POST['tl_id'] ?? 0) === $tl['id']) ? 'selected' : '' ?>>
                <?= sanitize($tl['name']) ?>
              </option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group" style="margin-top:1rem;">
            <label class="form-label">File Attachment (PDF, DOC, DOCX, XLSX — max 10MB)</label>
            <input type="file" name="task_file" accept=".pdf,.doc,.docx,.xlsx" class="form-control" style="padding:.5rem .875rem;">
          </div>

          <div class="form-group" style="margin-top:1rem;">
            <label class="form-label">Notes</label>
            <textarea name="notes" class="form-control" rows="2" placeholder="Internal notes…"><?= sanitize($_POST['notes'] ?? '') ?></textarea>
          </div>
        </div>
      </div>

      <!-- Financials card -->
      <div class="card" style="margin-bottom:1.25rem;">
        <div class="card-header"><h3><i class="fa-solid fa-calculator" style="color:var(--success);margin-right:8px"></i> Pricing & Financials</h3></div>
        <div class="card-body">
          <div class="form-grid col-3">
            <div class="form-group">
              <label class="form-label">Word Count</label>
              <input type="number" name="word_count" id="wordCount" class="form-control" min="0"
                     value="<?= (int)($_POST['word_count'] ?? 0) ?>" oninput="recalculate()">
            </div>
            <div class="form-group">
              <label class="form-label">Custom Price Override (PKR)</label>
              <input type="number" name="custom_price" id="customPrice" class="form-control" min="0" step="0.01"
                     value="<?= (float)($_POST['custom_price'] ?? 0) ?>" oninput="recalculate()" placeholder="Leave 0 for auto">
            </div>
            <div class="form-group">
              <label class="form-label">Writer Pay (PKR)</label>
              <input type="number" name="writer_pay" id="writerPay" class="form-control" min="0" step="0.01"
                     value="<?= (float)($_POST['writer_pay'] ?? 0) ?>" oninput="recalculate()">
            </div>
          </div>
          <div class="form-grid" style="margin-top:1rem;">
            <div class="form-group">
              <label class="form-label">Discount to Apply (%) <span style="font-size:.75rem;color:var(--text-muted)">(client's active discount shown below)</span></label>
              <input type="number" name="discount_applied" id="discountField" class="form-control" min="0" max="100" step="0.01"
                     value="<?= (float)($_POST['discount_applied'] ?? 0) ?>" oninput="recalculate()">
              <div id="clientDiscountHint" style="font-size:.75rem;color:var(--text-muted);margin-top:4px;"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Estimated Pay Preview</label>
              <div class="calc-preview" id="estPay">PKR 0</div>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:1rem;justify-content:flex-end;">
        <a href="orders.php" class="btn btn-outline">Cancel</a>
        <button type="submit" class="btn btn-gold"><i class="fa-solid fa-floppy-disk"></i> Create Order</button>
      </div>
    </form>

  </main>
</div>
</div>

<script>
const RATES = { technical: 3, simple: 1.5 };
let currentType = '';

function updateTypeCards(radio) {
  document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('checked'));
  radio.closest('.radio-card').classList.add('checked');
  currentType = radio.value;
  recalculate();
}

function recalculate() {
  const words    = parseInt(document.getElementById('wordCount').value) || 0;
  const custom   = parseFloat(document.getElementById('customPrice').value) || 0;
  const discount = parseFloat(document.getElementById('discountField').value) || 0;
  let pay = custom > 0 ? custom : (words * (RATES[currentType] || 0));
  const final = pay * (1 - discount / 100);
  document.getElementById('estPay').textContent = 'PKR ' + final.toLocaleString('en-PK', {maximumFractionDigits:2});
}

// Auto-fill discount from client selection
document.getElementById('clientSelect').addEventListener('change', function () {
  const opt     = this.options[this.selectedIndex];
  const discount = parseFloat(opt.dataset.discount) || 0;
  const hint    = document.getElementById('clientDiscountHint');
  if (discount > 0) {
    document.getElementById('discountField').value = discount;
    hint.textContent = '⚑ Client has ' + discount + '% active discount — pre-filled.';
    hint.style.color = '#10B981';
  } else {
    document.getElementById('discountField').value = 0;
    hint.textContent = 'Client has no active discount.';
    hint.style.color = '';
  }
  recalculate();
});

document.getElementById('hamburger').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
</script>
</body>
</html>
