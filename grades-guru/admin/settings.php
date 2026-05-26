<?php
/**
 * Grades Guru — Admin Settings
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

$settings = getSettings($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        setFlash('error', 'Invalid request token.');
    } else {
        $keys = [
            'tl_monthly_salary', 'working_days_per_month', 'technical_rate', 'simple_rate',
            'referral_bonus_1', 'referral_bonus_2', 'spin_enabled', 'monthly_spin_enabled',
        ];
        foreach ($keys as $key) {
            $val = $_POST[$key] ?? '0';
            setSetting($pdo, $key, (string)(float)$val ?: $val);
        }
        setFlash('success', 'Settings saved.');
        redirect(APP_URL . '/admin/settings.php');
    }
}

$flash = getFlash();
$s = $settings;

function sv(array $s, string $k, $default = ''): string {
    return htmlspecialchars($s[$k] ?? $default, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settings — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
  <style>
  .settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
  .form-group { display:flex; flex-direction:column; gap:.375rem; margin-bottom:1.25rem; }
  .form-label { font-size:.8125rem; font-weight:600; color:var(--text-muted); }
  .form-control { padding:.625rem .875rem; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.875rem; background:var(--bg); font-family:var(--font-body); outline:none; transition:border-color .2s; }
  .form-control:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(244,196,48,.12); }
  .form-hint { font-size:.75rem; color:var(--text-muted); }
  .toggle-row { display:flex; align-items:center; justify-content:space-between; padding:1rem 0; border-bottom:1px solid var(--border); }
  .toggle-row:last-child { border-bottom:none; }
  .toggle-label { font-size:.9rem; font-weight:600; color:var(--text); }
  .toggle-sub   { font-size:.8rem; color:var(--text-muted); margin-top:2px; }
  .toggle { position:relative; width:48px; height:26px; }
  .toggle input { opacity:0; width:0; height:0; }
  .toggle-slider { position:absolute; inset:0; background:var(--border); border-radius:13px; cursor:pointer; transition:.3s; }
  .toggle-slider::before { content:''; position:absolute; width:20px; height:20px; left:3px; top:3px; background:#fff; border-radius:50%; transition:.3s; }
  .toggle input:checked + .toggle-slider { background:var(--success); }
  .toggle input:checked + .toggle-slider::before { transform:translateX(22px); }
  @media(max-width:640px){ .settings-grid{ grid-template-columns:1fr; } }
  </style>
</head>
<body>
<div class="layout">

<?php /* Sidebar */ ?>
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo"><a href="dashboard.php"><div class="logo-icon">GG</div><?= APP_NAME ?></a></div>
  <nav class="sidebar-nav">
    <div class="nav-label">Main</div>
    <a href="dashboard.php"   class="nav-link"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
    <a href="orders.php"      class="nav-link"><i class="fa-solid fa-list-check"></i> All Orders</a>
    <a href="new-order.php"   class="nav-link"><i class="fa-solid fa-plus-circle"></i> New Order</a>
    <div class="nav-label">People</div>
    <a href="clients.php"     class="nav-link"><i class="fa-solid fa-users"></i> Clients</a>
    <a href="referrals.php"   class="nav-link"><i class="fa-solid fa-share-nodes"></i> Referrals</a>
    <a href="tl-accounts.php" class="nav-link"><i class="fa-solid fa-user-tie"></i> TL Accounts</a>
    <div class="nav-label">Finance</div>
    <a href="payments.php"    class="nav-link"><i class="fa-solid fa-money-bill-wave"></i> Payments</a>
    <a href="reports.php"     class="nav-link"><i class="fa-solid fa-chart-line"></i> Reports</a>
    <div class="nav-label">System</div>
    <a href="sheets-sync.php" class="nav-link"><i class="fa-brands fa-google"></i> Sheets Sync</a>
    <a href="settings.php"    class="nav-link active"><i class="fa-solid fa-gear"></i> Settings</a>
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
      <div class="topbar-title"><h1>Settings</h1><p>System configuration</p></div>
    </div>
    <div class="topbar-right">
      <div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div>
    </div>
  </header>

  <main class="page-content">

    <?php if($flash): ?>
    <div class="flash-msg <?= sanitize($flash['type']) ?>"><i class="fa-solid fa-circle-check"></i> <?= sanitize($flash['message']) ?></div>
    <?php endif; ?>

    <form method="POST">
      <?= csrfField() ?>
      <div class="settings-grid">

        <!-- Pricing -->
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-tags" style="color:var(--accent);margin-right:8px"></i> Pricing Rates</h3></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Technical Rate (PKR/word)</label>
              <input type="number" name="technical_rate" class="form-control" step="0.01" min="0"
                     value="<?= sv($s,'technical_rate','3.00') ?>">
              <div class="form-hint">Excel, Python, PowerBI, data analysis, coding</div>
            </div>
            <div class="form-group">
              <label class="form-label">Simple Rate (PKR/word)</label>
              <input type="number" name="simple_rate" class="form-control" step="0.01" min="0"
                     value="<?= sv($s,'simple_rate','1.50') ?>">
              <div class="form-hint">Essays, reports, templates, business management</div>
            </div>
          </div>
        </div>

        <!-- TL Compensation -->
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-user-tie" style="color:var(--primary);margin-right:8px"></i> TL Compensation</h3></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">TL Monthly Salary (PKR)</label>
              <input type="number" name="tl_monthly_salary" class="form-control" min="0"
                     value="<?= sv($s,'tl_monthly_salary','65000') ?>">
            </div>
            <div class="form-group">
              <label class="form-label">Working Days Per Month</label>
              <input type="number" name="working_days_per_month" class="form-control" min="1" max="31"
                     value="<?= sv($s,'working_days_per_month','26') ?>">
              <div class="form-hint">TL pay per task = (Salary ÷ Days) ÷ Daily tasks</div>
            </div>
          </div>
        </div>

        <!-- Referral -->
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-users" style="color:var(--success);margin-right:8px"></i> Referral Bonuses</h3></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Tier 1 Bonus — Refer 1 Friend (%)</label>
              <input type="number" name="referral_bonus_1" class="form-control" min="0" max="100"
                     value="<?= sv($s,'referral_bonus_1','10') ?>">
              <div class="form-hint">Both referrer and new client receive this discount</div>
            </div>
            <div class="form-group">
              <label class="form-label">Tier 2 Bonus — Refer 2 Friends (%)</label>
              <input type="number" name="referral_bonus_2" class="form-control" min="0" max="100"
                     value="<?= sv($s,'referral_bonus_2','25') ?>">
              <div class="form-hint">All parties receive this discount</div>
            </div>
          </div>
        </div>

        <!-- Feature Toggles -->
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-toggle-on" style="color:var(--info);margin-right:8px"></i> Feature Toggles</h3></div>
          <div class="card-body">
            <div class="toggle-row">
              <div>
                <div class="toggle-label">Spin Wheel</div>
                <div class="toggle-sub">Allow clients to spin on signup</div>
              </div>
              <label class="toggle">
                <input type="hidden" name="spin_enabled" value="0">
                <input type="checkbox" name="spin_enabled" value="1" <?= ($s['spin_enabled'] ?? '1') === '1' ? 'checked' : '' ?>>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="toggle-row">
              <div>
                <div class="toggle-label">Monthly Spin</div>
                <div class="toggle-sub">Allow clients to spin once per month</div>
              </div>
              <label class="toggle">
                <input type="hidden" name="monthly_spin_enabled" value="0">
                <input type="checkbox" name="monthly_spin_enabled" value="1" <?= ($s['monthly_spin_enabled'] ?? '1') === '1' ? 'checked' : '' ?>>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

      </div>

      <!-- Save button -->
      <div style="margin-top:1.25rem;display:flex;justify-content:flex-end;gap:1rem;">
        <button type="reset" class="btn btn-outline">Reset</button>
        <button type="submit" class="btn btn-gold"><i class="fa-solid fa-floppy-disk"></i> Save Settings</button>
      </div>
    </form>

  </main>
</div>
</div>
<script>
document.getElementById('hamburger').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
// Fix toggle checkboxes: only submit the checked value
document.querySelectorAll('.toggle input[type="checkbox"]').forEach(cb => {
  const hidden = cb.previousElementSibling;
  cb.addEventListener('change', () => { hidden.disabled = cb.checked; });
  hidden.disabled = cb.checked;
});
</script>
</body>
</html>
