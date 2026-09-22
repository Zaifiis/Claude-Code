<?php
/** Sign out. POST only, so a stray <img> tag cannot log anyone out. */
declare(strict_types=1);
require __DIR__ . '/auth.php';

admin_session_start();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST' || !csrf_session_verify(input($_POST, 'csrf', 200))) {
    redirect('/admin/leads.php');
}

admin_logout();
redirect('/admin/');
