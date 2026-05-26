<?php
/**
 * Grades Guru — Admin: Google Sheets Sync
 */
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';
require_once '../includes/google-sheets.php';

requireLogin();
requireRole('admin');
$user = getCurrentUser();
$pdo  = getPDO();

$errors = [];

// Bulk sync unsynced tasks
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sync_all'])) {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid request.';
    } else {
        $unsynced = $pdo->query(
            "SELECT t.*, u.name AS client_name, tl.name AS tl_name
             FROM tasks t
             JOIN users u ON u.id=t.client_id
             LEFT JOIN users tl ON tl.id=t.tl_id
             WHERE t.sheets_synced=0 OR t.sheets_synced IS NULL"
        )->fetchAll();

        $synced  = 0;
        $failed  = 0;
        foreach($unsynced as $t) {
            $row = [
                $t['serial_number'], $t['task_name'], $t['status'],
                $t['task_type'], $t['word_count'] ?? '', $t['deadline'] ?? '',
                $t['final_client_pay'] ?? 0, $t['amount_received'] ?? 0,
                $t['payment_status'], $t['client_name'], $t['tl_name'] ?? '',
                date('Y-m-d H:i:s')
            ];
            if (sheetsAppendRow(SPREADSHEET_ID, SHEET_NAME, $row)) {
                $pdo->prepare("UPDATE tasks SET sheets_synced=1 WHERE id=?")->execute([$t['id']]);
                $synced++;
            } else {
                $failed++;
            }
        }
        if ($failed > 0) {
            setFlash('error', "Synced $synced tasks. $failed failed — check credentials.");
        } else {
            setFlash('success', $synced > 0 ? "Successfully synced $synced tasks to Google Sheets." : 'All tasks already synced.');
        }
        redirect(APP_URL . '/admin/sheets-sync.php');
    }
}

// Single task sync
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sync_one'])) {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid request.';
    } else {
        $tid  = (int)$_POST['task_id'];
        $stmt = $pdo->prepare(
            "SELECT t.*, u.name AS client_name, tl.name AS tl_name
             FROM tasks t JOIN users u ON u.id=t.client_id LEFT JOIN users tl ON tl.id=t.tl_id
             WHERE t.id=? LIMIT 1"
        );
        $stmt->execute([$tid]);
        $t = $stmt->fetch();
        if ($t) {
            $row = [
                $t['serial_number'], $t['task_name'], $t['status'],
                $t['task_type'], $t['word_count'] ?? '', $t['deadline'] ?? '',
                $t['final_client_pay'] ?? 0, $t['amount_received'] ?? 0,
                $t['payment_status'], $t['client_name'], $t['tl_name'] ?? '',
                date('Y-m-d H:i:s')
            ];
            $ok = sheetsAppendRow(SPREADSHEET_ID, SHEET_NAME, $row);
            if ($ok) {
                $pdo->prepare("UPDATE tasks SET sheets_synced=1 WHERE id=?")->execute([$tid]);
                setFlash('success', 'Task synced to Google Sheets.');
            } else {
                setFlash('error', 'Sync failed. Check Google Sheets credentials.');
            }
        }
        redirect(APP_URL . '/admin/sheets-sync.php');
    }
}

// Stats
$syncStats = $pdo->query(
    "SELECT COUNT(*) AS total,
            SUM(sheets_synced=1) AS synced,
            SUM(sheets_synced=0 OR sheets_synced IS NULL) AS unsynced
     FROM tasks"
)->fetch();

// Unsynced tasks list
$unsyncedTasks = $pdo->query(
    "SELECT t.id, t.serial_number, t.task_name, t.status, t.created_at, u.name AS client_name
     FROM tasks t JOIN users u ON u.id=t.client_id
     WHERE t.sheets_synced=0 OR t.sheets_synced IS NULL
     ORDER BY t.created_at DESC LIMIT 50"
)->fetchAll();

// Check credentials setup
$credFileExists    = file_exists(SHEETS_CREDENTIALS_PATH);
$spreadsheetSet    = SPREADSHEET_ID !== 'YOUR_SHEET_ID';
$webhookSecret     = N8N_WEBHOOK_SECRET;
$webhookUrl        = APP_URL . '/api/sheets-webhook.php';

$flash     = getFlash();
$csrfToken = getCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sheets Sync — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
  <style>
  .setup-step{display:flex;gap:1rem;align-items:flex-start;padding:1rem 0;border-bottom:1px solid var(--border);}
  .setup-step:last-child{border-bottom:none;}
  .step-num{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;flex-shrink:0;}
  .step-ok{background:var(--success);color:#fff;}
  .step-pending{background:var(--border);color:var(--text-muted);}
  .code-block{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:.75rem 1rem;font-family:monospace;font-size:.85rem;word-break:break-all;margin:.5rem 0;}
  .status-dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px;}
  .dot-ok{background:var(--success);}
  .dot-warn{background:var(--warning,#f59e0b);}
  .dot-err{background:var(--danger);}
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
    <a href="clients.php" class="nav-link"><i class="fa-solid fa-users"></i> Clients</a>
    <a href="referrals.php" class="nav-link"><i class="fa-solid fa-share-nodes"></i> Referrals</a>
    <a href="tl-accounts.php" class="nav-link"><i class="fa-solid fa-user-tie"></i> TL Accounts</a>
    <div class="nav-label">Finance</div>
    <a href="payments.php" class="nav-link"><i class="fa-solid fa-money-bill-wave"></i> Payments</a>
    <a href="reports.php" class="nav-link"><i class="fa-solid fa-chart-line"></i> Reports</a>
    <div class="nav-label">System</div>
    <a href="sheets-sync.php" class="nav-link active"><i class="fa-brands fa-google"></i> Sheets Sync</a>
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
      <div class="topbar-title"><h1>Google Sheets Sync</h1><p>Manage bidirectional sync</p></div>
    </div>
    <div class="topbar-right">
      <?php if((int)$syncStats['unsynced'] > 0): ?>
      <form method="POST" style="display:inline;" onsubmit="return confirm('Sync all <?= (int)$syncStats['unsynced'] ?> unsynced tasks?')">
        <?= csrfField() ?>
        <input type="hidden" name="sync_all" value="1">
        <button type="submit" class="btn btn-emerald btn-sm"><i class="fa-brands fa-google"></i> Sync All (<?= (int)$syncStats['unsynced'] ?>)</button>
      </form>
      <?php endif; ?>
      <div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>
  <main class="page-content">

    <?php if(!empty($errors)): ?>
    <div class="flash-msg error"><i class="fa-solid fa-circle-exclamation"></i> <?= implode(' &bull; ', array_map('sanitize',$errors)) ?></div>
    <?php endif; ?>
    <?php if($flash): ?><div class="flash-msg <?= $flash['type'] ?>"><i class="fa-solid fa-circle-check"></i> <?= sanitize($flash['message']) ?></div><?php endif; ?>

    <!-- Sync stats -->
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:1.25rem;">
      <div class="stat-card">
        <div class="stat-icon navy"><i class="fa-solid fa-database"></i></div>
        <div class="stat-info"><div class="stat-label">Total Orders</div><div class="stat-value"><?= (int)$syncStats['total'] ?></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon emerald"><i class="fa-brands fa-google"></i></div>
        <div class="stat-info"><div class="stat-label">Synced to Sheets</div><div class="stat-value success"><?= (int)$syncStats['synced'] ?></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon gold"><i class="fa-solid fa-clock"></i></div>
        <div class="stat-info"><div class="stat-label">Pending Sync</div><div class="stat-value"><?= (int)$syncStats['unsynced'] ?></div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 380px;gap:1.25rem;">

      <!-- Unsynced tasks -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fa-solid fa-clock" style="color:var(--accent);margin-right:8px"></i>Pending Sync (<?= count($unsyncedTasks) ?>)</h3>
        </div>
        <?php if(empty($unsyncedTasks)): ?>
        <div class="empty-state">
          <i class="fa-brands fa-google" style="color:var(--success)"></i>
          <p style="color:var(--success);font-weight:600">All orders are synced!</p>
        </div>
        <?php else: ?>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Serial</th><th>Task</th><th>Client</th><th>Status</th><th>Created</th><th></th></tr></thead>
            <tbody>
            <?php foreach($unsyncedTasks as $t): ?>
            <tr>
              <td><span class="serial-no"><?= sanitize($t['serial_number']) ?></span></td>
              <td style="max-width:180px"><div class="task-name"><?= sanitize($t['task_name']) ?></div></td>
              <td style="font-size:.85rem"><?= sanitize($t['client_name']) ?></td>
              <td><span class="badge badge-gray"><?= ucfirst(str_replace('_',' ',$t['status'])) ?></span></td>
              <td style="font-size:.8rem;color:var(--text-muted)"><?= formatDate($t['created_at']) ?></td>
              <td>
                <form method="POST" style="display:inline;">
                  <?= csrfField() ?>
                  <input type="hidden" name="sync_one" value="1">
                  <input type="hidden" name="task_id"  value="<?= $t['id'] ?>">
                  <button type="submit" class="btn btn-sm btn-emerald"><i class="fa-brands fa-google"></i></button>
                </form>
              </td>
            </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
        </div>
        <?php endif; ?>
      </div>

      <!-- Setup guide -->
      <div style="display:flex;flex-direction:column;gap:1.25rem;">

        <!-- Status panel -->
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-plug" style="color:var(--accent);margin-right:8px"></i>Connection Status</h3></div>
          <div class="card-body">
            <div style="display:flex;align-items:center;margin-bottom:.75rem;">
              <span class="status-dot <?= $credFileExists ? 'dot-ok' : 'dot-err' ?>"></span>
              <span style="font-weight:600">Service Account Credentials</span>
              <span style="margin-left:auto;font-size:.8rem;color:var(--text-muted)"><?= $credFileExists ? 'Found' : 'Missing' ?></span>
            </div>
            <div style="display:flex;align-items:center;margin-bottom:.75rem;">
              <span class="status-dot <?= $spreadsheetSet ? 'dot-ok' : 'dot-warn' ?>"></span>
              <span style="font-weight:600">Spreadsheet ID</span>
              <span style="margin-left:auto;font-size:.8rem;color:var(--text-muted)"><?= $spreadsheetSet ? 'Configured' : 'Not set' ?></span>
            </div>
            <div style="display:flex;align-items:center;">
              <span class="status-dot dot-ok"></span>
              <span style="font-weight:600">Webhook Endpoint</span>
              <span style="margin-left:auto;font-size:.8rem;color:var(--success)">Active</span>
            </div>
          </div>
        </div>

        <!-- Webhook URL -->
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-link" style="color:var(--accent);margin-right:8px"></i>n8n Webhook</h3></div>
          <div class="card-body">
            <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:.75rem;">Use this URL in your n8n workflow to push Sheets → DB updates:</p>
            <div class="code-block" id="webhookUrl"><?= sanitize($webhookUrl) ?></div>
            <button onclick="navigator.clipboard.writeText(document.getElementById('webhookUrl').textContent);this.innerHTML='<i class=\'fa-solid fa-check\'></i> Copied!';setTimeout(()=>this.innerHTML='<i class=\'fa-solid fa-copy\'></i> Copy',2000)" class="btn btn-outline btn-sm" style="width:100%;justify-content:center;">
              <i class="fa-solid fa-copy"></i> Copy URL
            </button>
            <p style="font-size:.8rem;color:var(--text-muted);margin-top:.75rem;">
              Set the <code>Authorization</code> header to:<br>
              <code>Bearer <?= htmlspecialchars(substr($webhookSecret,0,12)) ?>…</code>
            </p>
          </div>
        </div>

        <!-- Setup guide -->
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-book" style="color:var(--accent);margin-right:8px"></i>Setup Guide</h3></div>
          <div class="card-body">
            <div class="setup-step">
              <div class="step-num <?= $credFileExists ? 'step-ok' : 'step-pending' ?>">
                <?= $credFileExists ? '<i class="fa-solid fa-check"></i>' : '1' ?>
              </div>
              <div>
                <div style="font-weight:600;margin-bottom:.25rem">Create Service Account</div>
                <div style="font-size:.82rem;color:var(--text-muted)">Go to Google Cloud Console → IAM → Service Accounts. Create a new account and download the JSON key.</div>
              </div>
            </div>
            <div class="setup-step">
              <div class="step-num <?= $credFileExists ? 'step-ok' : 'step-pending' ?>">
                <?= $credFileExists ? '<i class="fa-solid fa-check"></i>' : '2' ?>
              </div>
              <div>
                <div style="font-weight:600;margin-bottom:.25rem">Upload Credentials</div>
                <div style="font-size:.82rem;color:var(--text-muted)">Save the JSON file to:</div>
                <div class="code-block"><?= sanitize(SHEETS_CREDENTIALS_PATH) ?></div>
              </div>
            </div>
            <div class="setup-step">
              <div class="step-num <?= $spreadsheetSet ? 'step-ok' : 'step-pending' ?>">
                <?= $spreadsheetSet ? '<i class="fa-solid fa-check"></i>' : '3' ?>
              </div>
              <div>
                <div style="font-weight:600;margin-bottom:.25rem">Configure Spreadsheet</div>
                <div style="font-size:.82rem;color:var(--text-muted)">Set <code>SPREADSHEET_ID</code> in config.php. Share the sheet with your service account email.</div>
              </div>
            </div>
            <div class="setup-step">
              <div class="step-num step-pending">4</div>
              <div>
                <div style="font-weight:600;margin-bottom:.25rem">Set Up n8n Workflow</div>
                <div style="font-size:.82rem;color:var(--text-muted)">Create a Google Sheets trigger in n8n that posts to the webhook URL above on row changes. Set the secret in the Authorization header.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </main>
</div>
</div>
<script>document.getElementById('hamburger').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));</script>
</body>
</html>
