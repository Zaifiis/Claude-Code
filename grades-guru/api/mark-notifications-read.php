<?php
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
requireLogin();
$user = getCurrentUser();
markNotificationsRead(getPDO(), (int)$user['id']);
echo json_encode(['success' => true]);
