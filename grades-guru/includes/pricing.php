<?php
/**
 * Grades Guru — Pricing & Pay Calculation
 * Centralises all financial calculations: client pay, TL pay, profit.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/functions.php';

// ─── Rate Lookup ───────────────────────────────────────────────────────────────

/**
 * Returns the per-word rate (PKR) for the given task type, sourced from the
 * settings table with a fallback to the config constants.
 *
 * @param PDO    $pdo      Active database connection.
 * @param string $taskType 'technical' | 'simple'
 * @return float           Per-word rate in PKR.
 */
function getTaskRate(PDO $pdo, string $taskType): float
{
    $key      = $taskType === 'technical' ? 'technical_rate' : 'simple_rate';
    $fallback = $taskType === 'technical' ? RATE_TECHNICAL : RATE_SIMPLE;

    $value = getSetting($pdo, $key);

    return ($value !== null && is_numeric($value))
        ? (float)$value
        : (float)$fallback;
}

// ─── Client Pay ────────────────────────────────────────────────────────────────

/**
 * Calculates the gross amount the client owes (before any discount).
 *
 * If $customPrice is provided and > 0, it is returned directly.
 * Otherwise: word_count × rate_per_word.
 *
 * @param PDO        $pdo         Active database connection.
 * @param int        $wordCount   Number of words in the task.
 * @param string     $taskType    'technical' | 'simple'
 * @param float|null $customPrice Optional fixed price override.
 * @return float                  Gross client pay in PKR.
 */
function calculateClientPay(PDO $pdo, int $wordCount, string $taskType, ?float $customPrice = null): float
{
    if ($customPrice !== null && $customPrice > 0) {
        return round($customPrice, 2);
    }

    if ($wordCount <= 0) {
        return 0.0;
    }

    $rate = getTaskRate($pdo, $taskType);
    return round($wordCount * $rate, 2);
}

// ─── TL Pay ────────────────────────────────────────────────────────────────────

/**
 * Calculates how much the TL earns per task on a given date.
 *
 * Formula: daily_salary / number_of_tasks_assigned_that_day
 *   daily_salary = tl_monthly_salary / working_days_per_month
 *
 * If there are no tasks for that date, or the task count is 0, returns 0.
 *
 * @param PDO         $pdo   Active database connection.
 * @param string      $date  Date string 'YYYY-MM-DD'.
 * @param int|null    $tlId  Restrict to a specific TL (optional).
 * @return float             TL pay per task in PKR (rounded to 2 dp).
 */
function calculateTLPay(PDO $pdo, string $date, ?int $tlId = null): float
{
    $monthlySalary = (float)(getSetting($pdo, 'tl_monthly_salary') ?? TL_MONTHLY_SALARY);
    $workingDays   = (int)(getSetting($pdo, 'working_days_per_month') ?? TL_WORKING_DAYS);

    if ($workingDays <= 0) {
        return 0.0;
    }

    $dailySalary = $monthlySalary / $workingDays;

    $taskCount = getTasksForDate($pdo, $date, $tlId);

    if ($taskCount <= 0) {
        return 0.0;
    }

    return round($dailySalary / $taskCount, 2);
}

// ─── Profit Calculation ────────────────────────────────────────────────────────

/**
 * Calculates the profit on a task.
 * profit = client_pay_received − writer_pay − tl_pay
 * (Uses final_client_pay i.e. after discount, not gross client_pay)
 *
 * @param float $finalClientPay Amount client actually pays (post-discount).
 * @param float $writerPay      Amount paid to the writer.
 * @param float $tlPay          Amount allocated to the TL.
 * @return float                Profit in PKR.
 */
function calculateProfit(float $finalClientPay, float $writerPay, float $tlPay): float
{
    return round($finalClientPay - $writerPay - $tlPay, 2);
}

// ─── Discount Application ──────────────────────────────────────────────────────

/**
 * Applies a percentage discount to a gross amount.
 *
 * @param float $amount      Gross amount.
 * @param float $discountPct Discount as a percentage (e.g. 10 = 10%).
 * @return float             Discounted amount.
 */
function applyDiscount(float $amount, float $discountPct): float
{
    if ($discountPct <= 0) {
        return round($amount, 2);
    }
    $discount = $amount * ($discountPct / 100);
    return round($amount - $discount, 2);
}

// ─── Full Task Recalculation ───────────────────────────────────────────────────

/**
 * Recomputes all financial fields on a task row and persists them.
 *
 * Fields updated:
 *   client_pay, final_client_pay, tl_pay, profit
 *
 * writer_pay is managed externally (admin input) and is not overwritten here.
 *
 * @param PDO $pdo    Active database connection.
 * @param int $taskId tasks.id to recalculate.
 * @return bool        true on success.
 */
function recalculateTask(PDO $pdo, int $taskId): bool
{
    // Load the task
    $stmt = $pdo->prepare(
        'SELECT id, word_count, task_type, client_pay AS stored_client_pay,
                writer_pay, discount_applied, assigned_date, tl_id
         FROM tasks WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();

    if (!$task) {
        return false;
    }

    // Re-derive client_pay (word_count × rate, unless stored_client_pay was manual)
    $clientPay = calculateClientPay(
        $pdo,
        (int)$task['word_count'],
        $task['task_type']
    );

    // If an admin-entered custom price already exists, keep it
    if ((float)$task['stored_client_pay'] > 0 && (float)$task['stored_client_pay'] !== $clientPay) {
        $clientPay = (float)$task['stored_client_pay'];
    }

    // Apply discount
    $finalClientPay = applyDiscount($clientPay, (float)$task['discount_applied']);

    // TL pay based on assigned date
    $assignedDate = $task['assigned_date'] ?? date('Y-m-d');
    $tlPay        = calculateTLPay($pdo, $assignedDate, (int)($task['tl_id'] ?? 0));

    // Profit
    $profit = calculateProfit($finalClientPay, (float)$task['writer_pay'], $tlPay);

    // Persist
    $update = $pdo->prepare(
        'UPDATE tasks
         SET client_pay = ?, final_client_pay = ?, tl_pay = ?, profit = ?
         WHERE id = ?'
    );

    return $update->execute([
        $clientPay,
        $finalClientPay,
        $tlPay,
        $profit,
        $taskId,
    ]);
}

// ─── Task Count for TL Pay ─────────────────────────────────────────────────────

/**
 * Returns the number of tasks assigned on a specific date (optionally filtered
 * by TL ID).  Used by calculateTLPay().
 *
 * @param PDO      $pdo   Active database connection.
 * @param string   $date  Date string 'YYYY-MM-DD'.
 * @param int|null $tlId  Optional TL filter.
 * @return int             Count of tasks.
 */
function getTasksForDate(PDO $pdo, string $date, ?int $tlId = null): int
{
    if ($tlId && $tlId > 0) {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM tasks WHERE assigned_date = ? AND tl_id = ?'
        );
        $stmt->execute([$date, $tlId]);
    } else {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM tasks WHERE assigned_date = ?'
        );
        $stmt->execute([$date]);
    }

    return (int)$stmt->fetchColumn();
}

// ─── Summary Helpers ───────────────────────────────────────────────────────────

/**
 * Returns a summary of financial totals for the admin dashboard.
 * Optionally scoped to a date range.
 *
 * @param PDO         $pdo       Active database connection.
 * @param string|null $dateFrom  Start date 'YYYY-MM-DD' (inclusive).
 * @param string|null $dateTo    End date 'YYYY-MM-DD' (inclusive).
 * @return array{total_revenue, total_profit, total_writer_pay, total_tl_pay, task_count}
 */
function getFinancialSummary(PDO $pdo, ?string $dateFrom = null, ?string $dateTo = null): array
{
    $where  = [];
    $params = [];

    if ($dateFrom) {
        $where[]  = 'assigned_date >= ?';
        $params[] = $dateFrom;
    }
    if ($dateTo) {
        $where[]  = 'assigned_date <= ?';
        $params[] = $dateTo;
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $pdo->prepare(
        "SELECT
            COUNT(*)               AS task_count,
            SUM(final_client_pay)  AS total_revenue,
            SUM(profit)            AS total_profit,
            SUM(writer_pay)        AS total_writer_pay,
            SUM(tl_pay)            AS total_tl_pay,
            SUM(amount_received)   AS total_received,
            SUM(final_client_pay - amount_received) AS total_outstanding
         FROM tasks {$whereClause}"
    );
    $stmt->execute($params);
    $row = $stmt->fetch();

    return [
        'task_count'        => (int)($row['task_count']        ?? 0),
        'total_revenue'     => (float)($row['total_revenue']    ?? 0),
        'total_profit'      => (float)($row['total_profit']     ?? 0),
        'total_writer_pay'  => (float)($row['total_writer_pay'] ?? 0),
        'total_tl_pay'      => (float)($row['total_tl_pay']     ?? 0),
        'total_received'    => (float)($row['total_received']   ?? 0),
        'total_outstanding' => (float)($row['total_outstanding']?? 0),
    ];
}
