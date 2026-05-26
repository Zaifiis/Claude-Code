<?php
/**
 * Grades Guru — n8n Webhook: Google Sheets → DB Sync
 * POST — receives row data from n8n when a Sheet row changes.
 */
declare(strict_types=1);

require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/functions.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// ── Verify webhook secret ─────────────────────────────────────────────────────
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? '');
$auth = str_replace('Bearer ', '', $auth);

if (!hash_equals(N8N_WEBHOOK_SECRET, $auth)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// ── Parse body ────────────────────────────────────────────────────────────────
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON body']);
    exit;
}

// Expected keys from n8n (match Google Sheets columns A-S)
$serial = strtoupper(trim($data['serial_number'] ?? $data['A'] ?? ''));
if (empty($serial)) {
    echo json_encode(['success' => false, 'message' => 'serial_number is required']);
    exit;
}

$pdo  = getPDO();
$stmt = $pdo->prepare('SELECT id FROM tasks WHERE serial_number = ? LIMIT 1');
$stmt->execute([$serial]);
$task = $stmt->fetch();

$wordCount     = (int)($data['word_count']     ?? $data['H'] ?? 0);
$paymentStatus = strtolower($data['payment_status'] ?? $data['O'] ?? '');
$taskStatus    = strtolower(str_replace(' ', '_', $data['task_status'] ?? $data['Q'] ?? ''));
$notes         = $data['notes'] ?? $data['S'] ?? '';
$writerPay     = (float)($data['writer_pay']   ?? $data['J'] ?? 0);
$amountReceived= (float)($data['amount_received'] ?? $data['P'] ?? 0);

// Validate enums
$validPayStatus  = ['due', 'partial', 'paid'];
$validTaskStatus = ['pending', 'in_progress', 'completed', 'delivered'];
if (!in_array($paymentStatus, $validPayStatus, true))  $paymentStatus  = '';
if (!in_array($taskStatus,    $validTaskStatus, true)) $taskStatus     = '';

if ($task) {
    // Update existing task
    $sets    = [];
    $params  = [];

    if ($wordCount > 0)      { $sets[] = 'word_count = ?';      $params[] = $wordCount; }
    if ($paymentStatus)      { $sets[] = 'payment_status = ?';  $params[] = $paymentStatus; }
    if ($taskStatus)         { $sets[] = 'status = ?';          $params[] = $taskStatus; }
    if ($writerPay > 0)      { $sets[] = 'writer_pay = ?';      $params[] = $writerPay; }
    if ($amountReceived > 0) { $sets[] = 'amount_received = ?'; $params[] = $amountReceived; }
    if ($notes)              { $sets[] = 'notes = ?';           $params[] = $notes; }
    $sets[]    = 'sheets_synced = 1';
    $params[]  = (int)$task['id'];

    if (count($sets) > 1) {
        $sql = 'UPDATE tasks SET ' . implode(', ', $sets) . ' WHERE id = ?';
        $pdo->prepare($sql)->execute($params);
    }

    echo json_encode(['success' => true, 'action' => 'updated', 'task_id' => (int)$task['id']]);
} else {
    echo json_encode(['success' => false, 'message' => "Task with serial '{$serial}' not found. Create tasks via the admin panel."]);
}
