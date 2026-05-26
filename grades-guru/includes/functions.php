<?php
/**
 * Grades Guru — Core Utility / Helper Functions
 * All shared helpers used across the application.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config.php';
require_once __DIR__ . '/db.php';

// ─── Referral Code Generation ──────────────────────────────────────────────────

/**
 * Generates a unique referral code for a new user.
 * Format: GG-[NAME4]-[RAND4]  e.g. GG-ALIR-7K2P
 *
 * @param string $name  User's full name.
 * @return string       Unique referral code (uppercase).
 */
function generateReferralCode(string $name): string
{
    $pdo    = getPDO();
    $clean  = strtoupper(preg_replace('/[^A-Za-z]/', '', $name));
    $prefix = str_pad(substr($clean, 0, 4), 4, 'X');

    do {
        $rand = strtoupper(substr(bin2hex(random_bytes(4)), 0, 4));
        $code = 'GG-' . $prefix . '-' . $rand;

        $stmt = $pdo->prepare('SELECT id FROM users WHERE referral_code = ? LIMIT 1');
        $stmt->execute([$code]);
    } while ($stmt->fetch());

    return $code;
}

// ─── Serial Number Generation ──────────────────────────────────────────────────

/**
 * Generates the next sequential task serial number for the current year.
 * Format: GG-YYYY-XXXX  e.g. GG-2025-0042
 *
 * @param PDO $pdo  Active database connection.
 * @return string   Unique serial number.
 */
function generateSerialNumber(PDO $pdo): string
{
    $year = date('Y');

    // Find the highest numeric suffix used this year
    $stmt = $pdo->prepare(
        "SELECT MAX(CAST(SUBSTRING_INDEX(serial_number, '-', -1) AS UNSIGNED)) AS max_seq
         FROM tasks
         WHERE serial_number LIKE ?
         LIMIT 1"
    );
    $stmt->execute(["GG-{$year}-%"]);
    $row = $stmt->fetch();

    $next = ($row && $row['max_seq'] !== null) ? (int)$row['max_seq'] + 1 : 1;

    return sprintf('GG-%s-%04d', $year, $next);
}

// ─── Financial Calculations ────────────────────────────────────────────────────

/**
 * Calculates the gross amount a client owes for a task.
 * If $customPrice is supplied, it takes precedence over the word-count formula.
 *
 * @param int        $wordCount   Number of words.
 * @param string     $taskType    'technical' | 'simple'
 * @param float|null $customPrice Optional fixed price.
 * @return float                  Gross client pay in PKR.
 */
function calculateClientPay(int $wordCount, string $taskType, ?float $customPrice = null): float
{
    if ($customPrice !== null && $customPrice > 0) {
        return round($customPrice, 2);
    }

    if ($wordCount <= 0) {
        return 0.0;
    }

    $pdo  = getPDO();
    $key  = $taskType === 'technical' ? 'technical_rate' : 'simple_rate';
    $fall = $taskType === 'technical' ? RATE_TECHNICAL   : RATE_SIMPLE;
    $val  = getSetting($pdo, $key);
    $rate = ($val !== null && is_numeric($val)) ? (float)$val : (float)$fall;

    return round($wordCount * $rate, 2);
}

/**
 * Calculates TL pay per task for a given date.
 * daily_salary = tl_monthly_salary / working_days
 * tl_pay_per_task = daily_salary / tasks_assigned_that_day
 *
 * @param PDO    $pdo   Active database connection.
 * @param string $date  Date string 'YYYY-MM-DD'.
 * @return float         TL pay per task in PKR.
 */
function calculateTLPay(PDO $pdo, string $date): float
{
    $salary      = (float)(getSetting($pdo, 'tl_monthly_salary') ?? TL_MONTHLY_SALARY);
    $workingDays = (int)(getSetting($pdo, 'working_days_per_month') ?? TL_WORKING_DAYS);

    if ($workingDays <= 0) {
        return 0.0;
    }

    $daily = $salary / $workingDays;

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM tasks WHERE assigned_date = ?');
    $stmt->execute([$date]);
    $taskCount = (int)$stmt->fetchColumn();

    return $taskCount > 0 ? round($daily / $taskCount, 2) : 0.0;
}

/**
 * Calculates profit: final_client_pay − writer_pay − tl_pay.
 */
function calculateProfit(float $clientPay, float $writerPay, float $tlPay): float
{
    return round($clientPay - $writerPay - $tlPay, 2);
}

/**
 * Returns the discounted amount for a given percentage.
 */
function applyDiscount(float $amount, float $discountPct): float
{
    if ($discountPct <= 0) {
        return round($amount, 2);
    }
    return round($amount * (1 - $discountPct / 100), 2);
}

// ─── Settings ──────────────────────────────────────────────────────────────────

/**
 * Returns all settings as an associative array [key => value].
 *
 * @param PDO $pdo  Active database connection.
 * @return array<string, string>
 */
function getSettings(PDO $pdo): array
{
    static $cache = null;

    if ($cache !== null) {
        return $cache;
    }

    $stmt = $pdo->query('SELECT setting_key, setting_value FROM settings');
    $rows = $stmt->fetchAll();

    $cache = [];
    foreach ($rows as $row) {
        $cache[$row['setting_key']] = $row['setting_value'];
    }

    return $cache;
}

/**
 * Returns a single setting value by key, or null if not found.
 *
 * @param PDO    $pdo  Active database connection.
 * @param string $key  Setting key.
 * @return string|null
 */
function getSetting(PDO $pdo, string $key): ?string
{
    $all = getSettings($pdo);
    return $all[$key] ?? null;
}

/**
 * Persists a setting value (upsert).
 *
 * @param PDO    $pdo   Active database connection.
 * @param string $key   Setting key.
 * @param string $value New value.
 * @return bool
 */
function setSetting(PDO $pdo, string $key, string $value): bool
{
    $stmt = $pdo->prepare(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    return $stmt->execute([$key, $value]);
}

// ─── Notifications ─────────────────────────────────────────────────────────────

/**
 * Inserts a notification for a user.
 *
 * @param PDO    $pdo     Active database connection.
 * @param int    $userId  Target user ID.
 * @param string $message Notification text.
 * @param string $type    'info' | 'success' | 'warning'
 */
function createNotification(PDO $pdo, int $userId, string $message, string $type = 'info'): void
{
    try {
        $pdo->prepare(
            'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)'
        )->execute([$userId, $message, $type]);
    } catch (PDOException $e) {
        error_log('[GG] createNotification error: ' . $e->getMessage());
    }
}

/**
 * Returns unread notifications for a user, newest first.
 *
 * @param PDO $pdo     Active database connection.
 * @param int $userId  User ID.
 * @return array
 */
function getUnreadNotifications(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare(
        'SELECT id, message, type, created_at
         FROM notifications
         WHERE user_id = ? AND is_read = 0
         ORDER BY created_at DESC
         LIMIT 20'
    );
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

/**
 * Marks all unread notifications as read for a user.
 *
 * @param PDO $pdo     Active database connection.
 * @param int $userId  User ID.
 */
function markNotificationsRead(PDO $pdo, int $userId): void
{
    $pdo->prepare(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
    )->execute([$userId]);
}

// ─── Formatting ────────────────────────────────────────────────────────────────

/**
 * Sanitises a string for HTML output.
 *
 * @param string $input Raw input.
 * @return string       HTML-safe string.
 */
function sanitize(string $input): string
{
    return htmlspecialchars(trim($input), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * Formats a monetary amount as "PKR X,XXX.XX".
 *
 * @param float $amount Amount in PKR.
 * @return string
 */
function formatCurrency(float $amount): string
{
    return 'PKR ' . number_format($amount, 2);
}

/**
 * Formats a date string into a human-friendly format.
 * e.g. '2025-06-15' → 'Jun 15, 2025'
 *
 * @param string $date  Date string parseable by strtotime().
 * @return string
 */
function formatDate(string $date): string
{
    $ts = strtotime($date);
    return $ts !== false ? date('M j, Y', $ts) : $date;
}

/**
 * Returns a human-readable "time ago" string.
 *
 * @param string $datetime  Datetime string.
 * @return string
 */
function timeAgo(string $datetime): string
{
    $diff = time() - strtotime($datetime);
    if ($diff < 60)     return 'just now';
    if ($diff < 3600)   return floor($diff / 60) . ' min ago';
    if ($diff < 86400)  return floor($diff / 3600) . ' hrs ago';
    if ($diff < 604800) return floor($diff / 86400) . ' days ago';
    return date('M j, Y', strtotime($datetime));
}

// ─── Flash Messages ────────────────────────────────────────────────────────────

/**
 * Stores a flash message for the next page load.
 */
function setFlash(string $type, string $message): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

/**
 * Retrieves and clears the current flash message.
 *
 * @return array{type: string, message: string}|null
 */
function getFlash(): ?array
{
    if (!empty($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

// ─── Redirect ──────────────────────────────────────────────────────────────────

/**
 * HTTP redirect and halt.
 */
function redirect(string $url): never
{
    header('Location: ' . $url);
    exit;
}

/**
 * Redirects to the role-appropriate dashboard.
 */
function redirectToDashboard(string $role = ''): never
{
    $role = $role ?: ($_SESSION['user_role'] ?? 'client');
    $map  = [
        'admin'  => APP_URL . '/admin/dashboard.php',
        'tl'     => APP_URL . '/tl/dashboard.php',
        'client' => APP_URL . '/client/dashboard.php',
    ];
    redirect($map[$role] ?? APP_URL . '/client/dashboard.php');
}

// ─── Input Validation ──────────────────────────────────────────────────────────

/**
 * Returns true when the value is a valid email address.
 */
function isValidEmail(string $email): bool
{
    return (bool)filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * Returns true when the phone number looks valid.
 */
function isValidPhone(string $phone): bool
{
    return (bool)preg_match('/^[+\d\s\-]{7,20}$/', trim($phone));
}

/**
 * Validates password strength: min 8 chars, at least 1 upper, 1 lower, 1 digit, 1 special.
 */
function isStrongPassword(string $password): bool
{
    return strlen($password) >= 8
        && preg_match('/[A-Z]/', $password)
        && preg_match('/[a-z]/', $password)
        && preg_match('/\d/', $password)
        && preg_match('/[\W_]/', $password);
}

// ─── File Upload ───────────────────────────────────────────────────────────────

/**
 * Handles a file upload to the uploads directory.
 * Returns the relative file path on success, or null on failure.
 *
 * @param array  $file        $_FILES element.
 * @param string $subDir      Sub-directory under UPLOAD_PATH.
 * @return string|null        Relative path or null.
 */
function handleFileUpload(array $file, string $subDir = 'tasks'): ?string
{
    if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    if ($file['size'] > MAX_UPLOAD_SIZE) {
        return null;
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_UPLOAD_TYPES, true)) {
        return null;
    }

    $uploadDir = rtrim(UPLOAD_PATH, '/') . '/' . trim($subDir, '/') . '/';

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        error_log('[GG] Could not create upload directory: ' . $uploadDir);
        return null;
    }

    $fileName = bin2hex(random_bytes(16)) . '.' . $ext;
    $destPath = $uploadDir . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        error_log('[GG] move_uploaded_file failed for: ' . $file['name']);
        return null;
    }

    return $subDir . '/' . $fileName;
}

// ─── Pagination ────────────────────────────────────────────────────────────────

/**
 * Returns pagination data for a given total and per-page count.
 *
 * @param int $total      Total number of records.
 * @param int $page       Current page (1-based).
 * @param int $perPage    Records per page.
 * @return array{total, page, per_page, total_pages, offset}
 */
function paginate(int $total, int $page = 1, int $perPage = 20): array
{
    $page       = max(1, $page);
    $totalPages = max(1, (int)ceil($total / $perPage));
    $page       = min($page, $totalPages);

    return [
        'total'       => $total,
        'page'        => $page,
        'per_page'    => $perPage,
        'total_pages' => $totalPages,
        'offset'      => ($page - 1) * $perPage,
    ];
}

// ─── CSRF ──────────────────────────────────────────────────────────────────────

/**
 * Returns the HTML hidden input field for the CSRF token.
 */
function csrfField(): string
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (empty($_SESSION[CSRF_TOKEN_KEY])) {
        $_SESSION[CSRF_TOKEN_KEY] = bin2hex(random_bytes(32));
    }
    $token = htmlspecialchars($_SESSION[CSRF_TOKEN_KEY], ENT_QUOTES, 'UTF-8');
    return '<input type="hidden" name="csrf_token" value="' . $token . '">';
}
