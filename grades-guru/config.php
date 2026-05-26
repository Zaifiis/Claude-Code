<?php
/**
 * Grades Guru - Application Configuration
 * Central configuration file for all constants and settings
 */

// ─── Database Configuration ───────────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'u765968554_db_0MJ1jjYZ');
define('DB_USER', 'u765968554_usr_0MJ1jjYZ');
define('DB_PASS', 'Zaifiis@123.com');

// ─── Google Sheets Integration ────────────────────────────────────────────────
define('SHEETS_CREDENTIALS_PATH', __DIR__ . '/includes/google-credentials.json');
define('SPREADSHEET_ID', 'YOUR_SHEET_ID');
define('SHEET_NAME', 'Master');

// ─── Application Settings ─────────────────────────────────────────────────────
define('APP_NAME', 'Grades Guru');
define('APP_URL', 'https://zaifiis.com/gradesguru');
define('ADMIN_EMAIL', 'admin@gradesguru.com');

// ─── Webhook Security ─────────────────────────────────────────────────────────
define('N8N_WEBHOOK_SECRET', 'change_this_secret');

// ─── Pricing Rates (PKR per word) ─────────────────────────────────────────────
define('RATE_TECHNICAL', 3.00);
define('RATE_SIMPLE', 1.50);

// ─── Team Lead Compensation ───────────────────────────────────────────────────
define('TL_MONTHLY_SALARY', 65000);
define('TL_WORKING_DAYS', 26);

// ─── Contact & Communication ──────────────────────────────────────────────────
define('WHATSAPP_NUMBER', '923001234567');

// ─── File Storage ─────────────────────────────────────────────────────────────
define('UPLOAD_PATH', __DIR__ . '/uploads/');

// ─── Session Security ─────────────────────────────────────────────────────────
define('SESSION_TIMEOUT', 7200); // 2 hours in seconds

// ─── Environment Detection ────────────────────────────────────────────────────
define('IS_DEVELOPMENT', false);
define('ERROR_REPORTING_LEVEL', IS_DEVELOPMENT ? E_ALL : 0);

// Configure error reporting based on environment
if (IS_DEVELOPMENT) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/logs/error.log');
}

// ─── CSRF Token Key ───────────────────────────────────────────────────────────
define('CSRF_TOKEN_KEY', 'gg_csrf_token');

// ─── Allowed Upload Types ─────────────────────────────────────────────────────
define('ALLOWED_UPLOAD_TYPES', ['pdf', 'doc', 'docx', 'txt', 'zip']);
define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024); // 10 MB
