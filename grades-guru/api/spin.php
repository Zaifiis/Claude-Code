<?php
/**
 * Grades Guru — Spin Wheel API
 * POST: processes a spin and returns the result as JSON.
 */
declare(strict_types=1);

require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

requireLogin();
$user = getCurrentUser();
$pdo  = getPDO();
$uid  = (int)$user['id'];

// ── CSRF ──────────────────────────────────────────────────────────────────────
$token = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
if (!validateCsrfToken($token)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid request token.']);
    exit;
}

// ── Validate spin_type ────────────────────────────────────────────────────────
$spinType = $_POST['spin_type'] ?? '';
if (!in_array($spinType, ['signup', 'monthly'], true)) {
    echo json_encode(['success' => false, 'message' => 'Invalid spin type.']);
    exit;
}

// ── Fresh user data from DB ───────────────────────────────────────────────────
$stmt = $pdo->prepare('SELECT spin_used, last_spin_date, discount_percentage FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$uid]);
$dbUser = $stmt->fetch();

if (!$dbUser) {
    echo json_encode(['success' => false, 'message' => 'User not found.']);
    exit;
}

$spinUsed     = (int)$dbUser['spin_used'];
$lastSpinDate = $dbUser['last_spin_date'];
$firstOfMonth = date('Y-m-01');
$monthlyEnabled = (getSetting($pdo, 'monthly_spin_enabled') === '1');

// ── Authorization check ───────────────────────────────────────────────────────
if ($spinType === 'signup' && $spinUsed === 1) {
    echo json_encode(['success' => false, 'message' => 'You have already used your signup spin.']);
    exit;
}
if ($spinType === 'monthly') {
    if (!$monthlyEnabled) {
        echo json_encode(['success' => false, 'message' => 'Monthly spin is currently disabled.']);
        exit;
    }
    if ($spinUsed === 0) {
        // Must complete signup spin first
        echo json_encode(['success' => false, 'message' => 'Please complete your signup spin first.']);
        exit;
    }
    if ($lastSpinDate !== null && $lastSpinDate >= $firstOfMonth) {
        echo json_encode(['success' => false, 'message' => 'You have already spun this month.']);
        exit;
    }
}

// ── Wheel segments (must match spin-wheel.js SEGMENTS order) ─────────────────
$segments = [
    0 => ['result' => '10% Discount',                    'discount_value' => 10,  'type' => 'discount',  'emoji' => '🎉'],
    1 => ['result' => 'Refer 1 Friend — Both Get 10%',   'discount_value' => 10,  'type' => 'referral_1','emoji' => '👥'],
    2 => ['result' => 'Refer 2 Friends — All Get 25%',   'discount_value' => 25,  'type' => 'referral_2','emoji' => '🎊'],
    3 => ['result' => 'Priority Delivery',                'discount_value' => 0,   'type' => 'priority',  'emoji' => '⚡'],
    4 => ['result' => '5% Discount',                     'discount_value' => 5,   'type' => 'discount',  'emoji' => '🏷️'],
    5 => ['result' => 'Try Again',                       'discount_value' => 0,   'type' => 'try_again', 'emoji' => '🔄'],
    6 => ['result' => 'Exclusive Offer — Contact Admin', 'discount_value' => 0,   'type' => 'exclusive', 'emoji' => '⭐'],
    7 => ['result' => '10% Discount',                    'discount_value' => 10,  'type' => 'discount',  'emoji' => '🎉'],
];

// Weighted random pick (index 0, 7 have more weight)
$weights = [3, 1, 1, 1, 2, 2, 1, 3]; // higher = more likely
$pool = [];
foreach ($weights as $idx => $w) {
    for ($i = 0; $i < $w; $i++) $pool[] = $idx;
}
$segmentIndex = $pool[array_rand($pool)];
$segment      = $segments[$segmentIndex];

// ── Save result ───────────────────────────────────────────────────────────────
$pdo->beginTransaction();
try {
    // Insert spin_result
    $pdo->prepare(
        'INSERT INTO spin_results (user_id, spin_type, result, discount_value, used)
         VALUES (?, ?, ?, ?, ?)'
    )->execute([
        $uid,
        $spinType,
        $segment['result'],
        $segment['discount_value'],
        $segment['type'] === 'try_again' ? 1 : 0,
    ]);

    // Apply discount if applicable
    if (in_array($segment['type'], ['discount', 'referral_1', 'referral_2'], true) && $segment['discount_value'] > 0) {
        $currentDiscount = (float)$dbUser['discount_percentage'];
        $newDiscount     = max($currentDiscount, (float)$segment['discount_value']);
        $pdo->prepare('UPDATE users SET discount_percentage = ? WHERE id = ?')
            ->execute([$newDiscount, $uid]);
    }

    // Mark spin used
    if ($spinType === 'signup') {
        $pdo->prepare('UPDATE users SET spin_used = 1 WHERE id = ?')->execute([$uid]);
    } else {
        $pdo->prepare('UPDATE users SET last_spin_date = CURDATE() WHERE id = ?')->execute([$uid]);
    }

    $pdo->commit();

    // Notification
    $msg = 'You spun the wheel and won: ' . $segment['result'] . '!';
    if ($segment['discount_value'] > 0) {
        $msg .= " Your {$segment['discount_value']}% discount is now active.";
    }
    createNotification($pdo, $uid, $msg, 'success');

} catch (Exception $e) {
    $pdo->rollBack();
    error_log('[GG Spin] ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again.']);
    exit;
}

echo json_encode([
    'success'       => true,
    'segment_index' => $segmentIndex,
    'result'        => $segment['result'],
    'discount_value'=> $segment['discount_value'],
    'type'          => $segment['type'],
    'emoji'         => $segment['emoji'],
]);
