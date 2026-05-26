<?php
/**
 * Grades Guru — TL Task Detail
 * NO financial data shown here.
 */
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';
require_once '../includes/pricing.php';

requireLogin();
requireRole('tl');
$user = getCurrentUser();
$pdo  = getPDO();
$uid  = (int)$user['id'];

$taskId = (int)($_GET['id'] ?? 0);
if (!$taskId) { setFlash('error','Invalid task.'); redirect(APP_URL.'/tl/dashboard.php'); }

$stmt = $pdo->prepare(
    'SELECT t.id, t.serial_number, t.task_name, t.task_type, t.subject,
            t.description, t.deadline, t.assigned_date, t.word_count,
            t.status, t.notes, t.writer_name,
            u.name AS client_first_name
     FROM tasks t JOIN users u ON u.id = t.client_id
     WHERE t.id = ? AND t.tl_id = ? LIMIT 1'
);
$stmt->execute([$taskId, $uid]);
$task = $stmt->fetch();
if (!$task) { setFlash('error','Task not found.'); redirect(APP_URL.'/tl/dashboard.php'); }

$errors = [];
$flash  = null;

// ── Handle POST ───────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Invalid request. Please try again.';
    } else {
        $newStatus    = $_POST['status']     ?? $task['status'];
        $newWordCount = (int)($_POST['word_count'] ?? $task['word_count']);
        $tlNote       = trim($_POST['tl_note'] ?? '');

        $validStatuses = ['pending','in_progress','completed','delivered'];
        if (!in_array($newStatus, $validStatuses, true)) {
            $errors[] = 'Invalid status.';
        }
        if (in_array($newStatus, ['completed','delivered'], true) && $newWordCount <= 0) {
            $errors[] = 'Word count is required when marking as Completed or Delivered.';
        }

        if (empty($errors)) {
            $existingNotes = $task['notes'] ?? '';
            $newNotes = $existingNotes;
            if ($tlNote) {
                $ts = date('M j, Y H:i');
                $newNotes = $existingNotes
                    ? $existingNotes . "\n\n[TL Note – {$ts}]: " . $tlNote
                    : "[TL Note – {$ts}]: " . $tlNote;
            }

            $pdo->prepare(
                'UPDATE tasks SET status = ?, word_count = ?, notes = ? WHERE id = ? AND tl_id = ?'
            )->execute([$newStatus, $newWordCount, $newNotes, $taskId, $uid]);

            // Recalculate financials when delivered
            if ($newStatus === 'delivered') {
                recalculateTask($pdo, $taskId);
                // Notify client
                $stmt2 = $pdo->prepare('SELECT client_id FROM tasks WHERE id = ? LIMIT 1');
                $stmt2->execute([$taskId]);
                $cid = (int)($stmt2->fetchColumn() ?: 0);
                if ($cid) {
                    createNotification($pdo, $cid, "Your order '{$task['task_name']}' has been delivered!", 'success');
                }
            }

            setFlash('success', 'Task updated successfully.');
            redirect(APP_URL . '/tl/task-detail.php?id=' . $taskId);
        }
    }
}

$csrfToken = getCsrfToken();
$isOverdue = strtotime($task['deadline']) < strtotime('today') && !in_array($task['status'], ['completed','delivered']);

$steps = ['pending','in_progress','completed','delivered'];
$stepLabels = ['Pending','In Progress','Completed','Delivered'];
$curIdx = array_search($task['status'], $steps, true);

$notifications = getUnreadNotifications($pdo, $uid);
$unreadCount   = count($notifications);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= sanitize($task['task_name']) ?> — TL Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
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
    <div class="nav-label">Tasks</div>
    <a href="dashboard.php"  class="nav-link"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
    <a href="dashboard.php"  class="nav-link active"><i class="fa-solid fa-list-check"></i> My Tasks</a>
  </nav>
  <div class="sidebar-user">
    <div class="sidebar-user-info">
      <div class="user-avatar-sm"><?= strtoupper(substr($user['name'],0,1)) ?></div>
      <div><div class="sidebar-user-name"><?= sanitize($user['name']) ?></div>
      <div class="sidebar-user-email">Team Lead</div></div>
    </div>
    <a href="../logout.php" class="logout-link"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</a>
  </div>
</aside>

<div class="main-wrapper">
  <header class="topbar">
    <div style="display:flex;align-items:center;gap:12px;">
      <button class="hamburger" id="hamburger"><i class="fa-solid fa-bars"></i></button>
      <div class="topbar-title">
        <h1>Task Detail</h1>
        <p><a href="dashboard.php" style="color:var(--text-muted);text-decoration:none">Dashboard</a> &rsaquo; Task</p>
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

    <?php if(!empty($errors)): ?>
    <div class="flash-msg error"><i class="fa-solid fa-circle-exclamation"></i> <?= implode('<br>',array_map('sanitize',$errors)) ?></div>
    <?php endif; ?>

    <?php $flash = getFlash(); if($flash): ?>
    <div class="flash-msg <?= sanitize($flash['type']) ?>"><i class="fa-solid fa-circle-check"></i> <?= sanitize($flash['message']) ?></div>
    <?php endif; ?>

    <!-- Deadline alert -->
    <?php if($isOverdue): ?>
    <div class="flash-msg error"><i class="fa-solid fa-triangle-exclamation"></i> This task is <strong>overdue</strong>! Deadline was <?= formatDate($task['deadline']) ?>.</div>
    <?php endif; ?>

    <div style="display:grid;grid-template-columns:1fr 360px;gap:1.25rem;">

      <!-- Task info -->
      <div style="display:flex;flex-direction:column;gap:1.25rem;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3><?= sanitize($task['task_name']) ?></h3>
              <div class="serial-no" style="margin-top:4px"><?= sanitize($task['serial_number']) ?></div>
            </div>
            <span class="badge <?= $task['task_type']==='technical' ? 'badge-navy' : 'badge-gray' ?>">
              <?= ucfirst($task['task_type']) ?>
            </span>
          </div>
          <div class="card-body">
            <table style="width:100%;border-collapse:collapse;font-size:.875rem;">
              <?php $rows = [
                ['Subject', sanitize($task['subject'] ?? '—')],
                ['Deadline', '<span style="'.($isOverdue?'color:var(--danger);font-weight:700':'').'">'.$task['deadline'].'</span>'],
                ['Assigned Date', sanitize($task['assigned_date'] ?? '—')],
                ['Word Count', $task['word_count'] > 0 ? number_format((int)$task['word_count']).' words' : 'Not set yet'],
                ['Writer', sanitize($task['writer_name'] ?? '—')],
                ['Client', sanitize(explode(' ',$task['client_first_name'])[0])],
              ];
              foreach($rows as [$label,$val]): ?>
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:10px 8px;color:var(--text-muted);font-weight:600;width:38%;white-space:nowrap;"><?= $label ?></td>
                <td style="padding:10px 8px;"><?= $val ?></td>
              </tr>
              <?php endforeach; ?>
            </table>
            <?php if($task['description']): ?>
            <div style="margin-top:1.25rem;">
              <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:.5rem;">Description</div>
              <p style="font-size:.875rem;line-height:1.75;color:var(--text);"><?= nl2br(sanitize($task['description'])) ?></p>
            </div>
            <?php endif; ?>
            <?php if($task['notes']): ?>
            <div style="margin-top:1rem;background:var(--bg);border-left:3px solid var(--accent);padding:1rem;border-radius:0 var(--radius-sm) var(--radius-sm) 0;">
              <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:.375rem;">Notes</div>
              <p style="font-size:.875rem;line-height:1.6;white-space:pre-line;"><?= sanitize($task['notes']) ?></p>
            </div>
            <?php endif; ?>
          </div>
        </div>
      </div>

      <!-- Update form -->
      <div style="display:flex;flex-direction:column;gap:1.25rem;">

        <!-- Status timeline -->
        <div class="card">
          <div class="card-header"><h3>Progress</h3></div>
          <div class="card-body">
            <div class="timeline">
              <?php foreach($steps as $i => $step): ?>
              <div class="timeline-item">
                <div class="timeline-dot <?= $i < $curIdx ? 'done' : ($i === $curIdx ? 'active' : '') ?>"></div>
                <div class="timeline-label" style="<?= $i === $curIdx ? 'color:var(--accent);' : '' ?>"><?= $stepLabels[$i] ?></div>
              </div>
              <?php endforeach; ?>
            </div>
          </div>
        </div>

        <!-- Update form -->
        <div class="card">
          <div class="card-header"><h3><i class="fa-solid fa-pen" style="color:var(--accent);margin-right:8px"></i> Update Task</h3></div>
          <form method="POST" class="card-body" style="display:flex;flex-direction:column;gap:1rem;">
            <?= csrfField() ?>

            <div>
              <label style="font-size:.8125rem;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">Status</label>
              <select name="status" style="width:100%;padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);font-family:var(--font-body);outline:none;">
                <?php foreach($steps as $s): ?>
                <option value="<?= $s ?>" <?= $task['status']===$s?'selected':'' ?>><?= ucwords(str_replace('_',' ',$s)) ?></option>
                <?php endforeach; ?>
              </select>
            </div>

            <div>
              <label style="font-size:.8125rem;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">
                Word Count <span style="color:var(--danger)">*</span> (required for Completed/Delivered)
              </label>
              <input type="number" name="word_count" min="0" value="<?= (int)$task['word_count'] ?>"
                     style="width:100%;padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);font-family:var(--font-body);outline:none;">
            </div>

            <div>
              <label style="font-size:.8125rem;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">Add Note (optional)</label>
              <textarea name="tl_note" rows="3"
                        style="width:100%;padding:.625rem .875rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem;background:var(--bg);font-family:var(--font-body);resize:vertical;outline:none;"></textarea>
            </div>

            <button type="submit" class="btn btn-gold" style="width:100%;justify-content:center;">
              <i class="fa-solid fa-floppy-disk"></i> Save Changes
            </button>
          </form>
        </div>

        <a href="dashboard.php" class="btn btn-outline" style="text-align:center;justify-content:center;">
          <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
        </a>
      </div>
    </div>

  </main>
</div>
</div>
<script>
document.getElementById('hamburger').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
</script>
</body>
</html>
