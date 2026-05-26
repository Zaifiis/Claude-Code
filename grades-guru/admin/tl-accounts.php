<?php
/**
 * Grades Guru — Admin: TL Account Management
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

$errors  = [];
$editTl  = null;

// Toggle status
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['toggle_status'])) {
    if (validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $tid = (int)$_POST['tl_id'];
        $pdo->prepare("UPDATE users SET status=IF(status='active','inactive','active') WHERE id=? AND role='tl'")->execute([$tid]);
        setFlash('success','TL status updated.');
    }
    redirect(APP_URL.'/admin/tl-accounts.php');
}

// Create/edit TL
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_tl'])) {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid request.';
    } else {
        $editId  = (int)($_POST['edit_id'] ?? 0);
        $name    = trim($_POST['name'] ?? '');
        $email   = trim($_POST['email'] ?? '');
        $phone   = trim($_POST['phone'] ?? '');
        $pwd     = $_POST['password'] ?? '';
        $pwdConf = $_POST['password_confirm'] ?? '';

        if (empty($name))  $errors[] = 'Name is required.';
        if (empty($email) || !isValidEmail($email)) $errors[] = 'Valid email is required.';
        if (!$editId && empty($pwd)) $errors[] = 'Password is required for new accounts.';
        if ($pwd && $pwd !== $pwdConf) $errors[] = 'Passwords do not match.';

        if (empty($errors)) {
            // Check email unique
            $dup = $pdo->prepare("SELECT id FROM users WHERE email=? AND id != ? LIMIT 1");
            $dup->execute([$email, $editId]);
            if ($dup->fetch()) $errors[] = 'Email already in use.';
        }

        if (empty($errors)) {
            $refCode = generateReferralCode($name);
            if ($editId) {
                $sets = ['name=?','email=?','phone=?'];
                $vals = [$name,$email,$phone];
                if ($pwd) { $sets[]='password=?'; $vals[]=password_hash($pwd,PASSWORD_BCRYPT); }
                $vals[]=$editId;
                $pdo->prepare("UPDATE users SET ".implode(',',$sets)." WHERE id=? AND role='tl'")->execute($vals);
                setFlash('success','TL account updated.');
            } else {
                $pdo->prepare("INSERT INTO users (name,email,phone,password,role,referral_code) VALUES (?,?,?,?,?,?)")
                    ->execute([$name,$email,$phone,password_hash($pwd,PASSWORD_BCRYPT),'tl',$refCode]);
                setFlash('success','TL account created.');
            }
            redirect(APP_URL.'/admin/tl-accounts.php');
        }
    }
}

// Load edit target
if (isset($_GET['edit'])) {
    $es = $pdo->prepare("SELECT id,name,email,phone FROM users WHERE id=? AND role='tl' LIMIT 1");
    $es->execute([(int)$_GET['edit']]);
    $editTl = $es->fetch();
}

// TL list with task stats
$tls = $pdo->query(
    "SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
            COUNT(t.id) AS total_tasks,
            SUM(t.status IN('completed','delivered')) AS completed_tasks
     FROM users u
     LEFT JOIN tasks t ON t.tl_id = u.id
     WHERE u.role = 'tl'
     GROUP BY u.id
     ORDER BY u.created_at DESC"
)->fetchAll();

$flash     = getFlash();
$csrfToken = getCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TL Accounts — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">
  <style>
  .form-group{display:flex;flex-direction:column;gap:.375rem;margin-bottom:1.25rem;}
  .form-label{font-size:.8125rem;font-weight:600;color:var(--text-muted);}
  .form-control{padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);font-family:var(--font-body);outline:none;transition:border-color .2s;width:100%;}
  .form-control:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(244,196,48,.12);}
  .page-grid{display:grid;grid-template-columns:380px 1fr;gap:1.25rem;}
  @media(max-width:900px){.page-grid{grid-template-columns:1fr;}}
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
    <a href="tl-accounts.php" class="nav-link active"><i class="fa-solid fa-user-tie"></i> TL Accounts</a>
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
      <div class="topbar-title"><h1>TL Accounts</h1><p>Manage team leads</p></div>
    </div>
    <div class="topbar-right"><div class="topbar-avatar"><?= strtoupper(substr($user['name'],0,1)) ?></div></div>
  </header>
  <main class="page-content">

    <?php if(!empty($errors)): ?>
    <div class="flash-msg error"><i class="fa-solid fa-circle-exclamation"></i> <?= implode(' &bull; ', array_map('sanitize',$errors)) ?></div>
    <?php endif; ?>
    <?php if($flash): ?><div class="flash-msg <?= $flash['type'] ?>"><i class="fa-solid fa-circle-check"></i> <?= sanitize($flash['message']) ?></div><?php endif; ?>

    <div class="page-grid">

      <!-- Create/Edit Form -->
      <div class="card" style="align-self:start;">
        <div class="card-header">
          <h3><i class="fa-solid fa-<?= $editTl ? 'pen' : 'user-plus' ?>" style="color:var(--accent);margin-right:8px"></i>
            <?= $editTl ? 'Edit TL Account' : 'Create TL Account' ?>
          </h3>
          <?php if($editTl): ?><a href="tl-accounts.php" class="btn btn-sm btn-outline">Cancel Edit</a><?php endif; ?>
        </div>
        <form method="POST" class="card-body">
          <?= csrfField() ?>
          <input type="hidden" name="save_tl" value="1">
          <?php if($editTl): ?><input type="hidden" name="edit_id" value="<?= $editTl['id'] ?>"><?php endif; ?>

          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" name="name" class="form-control" required value="<?= sanitize($editTl['name'] ?? ($_POST['name'] ?? '')) ?>">
          </div>
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" name="email" class="form-control" required value="<?= sanitize($editTl['email'] ?? ($_POST['email'] ?? '')) ?>">
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" name="phone" class="form-control" value="<?= sanitize($editTl['phone'] ?? ($_POST['phone'] ?? '')) ?>" placeholder="+92300…">
          </div>
          <div class="form-group">
            <label class="form-label">Password <?= $editTl ? '(leave blank to keep current)' : '*' ?></label>
            <input type="password" name="password" class="form-control" placeholder="Min 8 characters" <?= $editTl ? '' : 'required' ?>>
          </div>
          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input type="password" name="password_confirm" class="form-control">
          </div>
          <button type="submit" class="btn btn-gold" style="width:100%;justify-content:center;">
            <i class="fa-solid fa-<?= $editTl ? 'floppy-disk' : 'user-plus' ?>"></i>
            <?= $editTl ? 'Save Changes' : 'Create Account' ?>
          </button>
        </form>
      </div>

      <!-- TL List -->
      <div class="card">
        <div class="card-header"><h3>All Team Leads (<?= count($tls) ?>)</h3></div>
        <?php if(empty($tls)): ?>
        <div class="empty-state"><i class="fa-solid fa-user-tie"></i><p>No TL accounts yet.</p></div>
        <?php else: ?>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Total Tasks</th><th>Completed</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
            <?php foreach($tls as $tl): ?>
            <tr>
              <td style="font-weight:600"><?= sanitize($tl['name']) ?></td>
              <td style="color:var(--text-muted);font-size:.85rem"><?= sanitize($tl['email']) ?></td>
              <td style="text-align:center;font-weight:700"><?= (int)$tl['total_tasks'] ?></td>
              <td style="text-align:center;color:var(--success);font-weight:700"><?= (int)$tl['completed_tasks'] ?></td>
              <td><?= $tl['status']==='active'
                ? '<span class="badge badge-emerald">Active</span>'
                : '<span class="badge badge-gray">Inactive</span>' ?></td>
              <td style="white-space:nowrap">
                <a href="tl-accounts.php?edit=<?= $tl['id'] ?>" class="btn btn-sm btn-outline">Edit</a>
                <form method="POST" style="display:inline;" onsubmit="return confirm('Toggle status?')">
                  <?= csrfField() ?>
                  <input type="hidden" name="toggle_status" value="1">
                  <input type="hidden" name="tl_id" value="<?= $tl['id'] ?>">
                  <button type="submit" class="btn btn-sm <?= $tl['status']==='active'?'btn-danger':'btn-emerald' ?>" style="margin-left:4px;">
                    <?= $tl['status']==='active'?'Disable':'Enable' ?>
                  </button>
                </form>
              </td>
            </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
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
