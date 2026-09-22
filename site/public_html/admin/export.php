<?php
/** CSV export of the current lead filter. */
declare(strict_types=1);
require __DIR__ . '/auth.php';

require_admin();

$status = input($_GET, 'status', 20);
$kind   = input($_GET, 'kind', 20);
$query  = input($_GET, 'q', 100);

$where  = [];
$params = [];

if (in_array($status, ['new', 'contacted', 'qualified', 'won', 'lost', 'spam'], true)) {
    $where[]  = 'status = ?';
    $params[] = $status;
}
if (in_array($kind, ['contact', 'audit'], true)) {
    $where[]  = 'kind = ?';
    $params[] = $kind;
}
if ($query !== '') {
    $where[] = '(name LIKE ? OR email LIKE ? OR company LIKE ? OR ref LIKE ?)';
    $like    = '%' . $query . '%';
    array_push($params, $like, $like, $like, $like);
}

$sql = 'SELECT ref, created_at, kind, status, score, name, email, company, website, phone,'
     . ' team_size, budget, timeline, services, message, answers, source_page, utm_source,'
     . ' utm_medium, utm_campaign, notes FROM leads'
     . ($where === [] ? '' : ' WHERE ' . implode(' AND ', $where))
     . ' ORDER BY created_at DESC';

try {
    $rows = db_all($sql, $params);
} catch (Throwable $e) {
    error_log('export failed: ' . $e->getMessage());
    http_response_code(500);
    exit('Export failed. Check the error log.');
}

/**
 * Spreadsheets treat a leading =, +, - or @ as a formula, so a lead who types
 * one into a form could run code in whoever opens the export. Prefix a quote.
 */
function csv_safe(?string $value): string
{
    $value = (string) $value;
    return $value !== '' && str_contains("=+-@\t\r", $value[0]) ? "'" . $value : $value;
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="leads-' . date('Y-m-d') . '.csv"');
header('Cache-Control: no-store, private');

$out = fopen('php://output', 'w');
if ($out === false) {
    exit;
}

// BOM so Excel opens UTF-8 correctly.
fwrite($out, "\xEF\xBB\xBF");

fputcsv($out, [
    'Reference', 'Received', 'Type', 'Status', 'Fit score', 'Name', 'Email', 'Company',
    'Website', 'Phone', 'Team size', 'Budget', 'Timeline', 'Services', 'Message',
    'Audit answers', 'Source page', 'UTM source', 'UTM medium', 'UTM campaign', 'Notes',
], ',', '"', '\\');

foreach ($rows as $row) {
    fputcsv($out, array_map(
        static fn($value): string => csv_safe(is_string($value) ? $value : (string) $value),
        array_values($row)
    ), ',', '"', '\\');
}

fclose($out);
