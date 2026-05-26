<?php
/**
 * Grades Guru — Referral Code Check API
 * GET ?code=GG-XXXX-XXXX — returns JSON validity and referrer first name.
 */
declare(strict_types=1);

require_once '../config.php';
require_once '../includes/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['valid' => false]);
    exit;
}

$code = strtoupper(trim($_GET['code'] ?? ''));

if (strlen($code) < 6) {
    echo json_encode(['valid' => false]);
    exit;
}

$pdo  = getPDO();
$stmt = $pdo->prepare(
    'SELECT name FROM users WHERE referral_code = ? AND status = "active" LIMIT 1'
);
$stmt->execute([$code]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['valid' => false, 'name' => null]);
    exit;
}

$firstName = explode(' ', trim($user['name']))[0];
echo json_encode(['valid' => true, 'name' => htmlspecialchars($firstName, ENT_QUOTES, 'UTF-8')]);
