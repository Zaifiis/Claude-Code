<?php
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');
if (!isLoggedIn()) { echo json_encode(['count' => 0]); exit; }
$user = getCurrentUser();
$pdo  = getPDO();
$stmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
$stmt->execute([(int)$user['id']]);
echo json_encode(['count' => (int)$stmt->fetchColumn()]);
