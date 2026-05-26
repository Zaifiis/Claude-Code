<?php
/**
 * Grades Guru — Sync Tasks to Google Sheets API
 * POST — admin only. Pushes unsynced (or specific) tasks to Google Sheets.
 */
declare(strict_types=1);

require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';
require_once '../includes/google-sheets.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

requireLogin();
requireRole('admin');
$pdo = getPDO();

$taskId = isset($_POST['task_id']) ? (int)$_POST['task_id'] : 0;
$syncAll = isset($_POST['all']) || isset($_GET['all']);

// ── Fetch tasks to sync ───────────────────────────────────────────────────────
if ($taskId > 0) {
    $stmt = $pdo->prepare(
        'SELECT t.*, u.name AS client_name_full, tl.name AS tl_name
         FROM tasks t
         JOIN users u ON u.id = t.client_id
         LEFT JOIN users tl ON tl.id = t.tl_id
         WHERE t.id = ? LIMIT 1'
    );
    $stmt->execute([$taskId]);
    $tasks = $stmt->fetchAll();
} else {
    $stmt = $pdo->query(
        'SELECT t.*, u.name AS client_name_full, tl.name AS tl_name
         FROM tasks t
         JOIN users u ON u.id = t.client_id
         LEFT JOIN users tl ON tl.id = t.tl_id
         WHERE t.sheets_synced = 0
         ORDER BY t.created_at ASC
         LIMIT 200'
    );
    $tasks = $stmt->fetchAll();
}

if (empty($tasks)) {
    echo json_encode(['success' => true, 'synced_count' => 0, 'message' => 'Nothing to sync.']);
    exit;
}

// ── Check credentials ─────────────────────────────────────────────────────────
if (!file_exists(SHEETS_CREDENTIALS_PATH) || SPREADSHEET_ID === 'YOUR_SHEET_ID') {
    // Mark as synced anyway in dev (graceful degradation)
    $ids = array_column($tasks, 'id');
    if (!empty($ids)) {
        $in  = implode(',', array_fill(0, count($ids), '?'));
        $pdo->prepare("UPDATE tasks SET sheets_synced = 1 WHERE id IN ($in)")->execute($ids);
    }
    echo json_encode([
        'success'      => true,
        'synced_count' => count($tasks),
        'message'      => 'Dev mode: Google Sheets not configured. Tasks marked as synced.',
    ]);
    exit;
}

// ── Push to Sheets ────────────────────────────────────────────────────────────
$syncedIds = [];
$errors    = [];

foreach ($tasks as $task) {
    $row = [
        $task['serial_number'],
        $task['client_name'] ?: $task['client_name_full'],
        $task['task_name'],
        ucfirst($task['task_type']),
        $task['subject'] ?? '',
        $task['assigned_date'] ?? '',
        $task['writer_name'] ?? '',
        (string)$task['word_count'],
        (string)$task['client_pay'],
        (string)$task['writer_pay'],
        (string)$task['tl_pay'],
        (string)$task['profit'],
        (string)$task['discount_applied'],
        (string)$task['final_client_pay'],
        ucfirst($task['payment_status']),
        (string)$task['amount_received'],
        ucwords(str_replace('_', ' ', $task['status'])),
        $task['deadline'],
        $task['notes'] ?? '',
    ];

    $result = sheetsAppendRow(SPREADSHEET_ID, SHEET_NAME, $row);

    if ($result) {
        $syncedIds[] = (int)$task['id'];
    } else {
        $errors[] = $task['serial_number'];
    }
}

// Mark synced
if (!empty($syncedIds)) {
    $in  = implode(',', array_fill(0, count($syncedIds), '?'));
    $pdo->prepare("UPDATE tasks SET sheets_synced = 1 WHERE id IN ($in)")->execute($syncedIds);
}

echo json_encode([
    'success'      => empty($errors),
    'synced_count' => count($syncedIds),
    'errors'       => $errors,
    'message'      => empty($errors)
        ? count($syncedIds) . ' task(s) synced successfully.'
        : count($syncedIds) . ' synced, ' . count($errors) . ' failed.',
]);
