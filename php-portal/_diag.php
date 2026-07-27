<?php
/**
 * Diagnostic — visit /_diag.php to see exactly what's wrong.
 * DELETE this file once the app works (it reveals server details, not passwords).
 */
error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/plain; charset=utf-8');

echo "Content OS — diagnostics\n========================\n\n";
echo "PHP version : " . PHP_VERSION . (version_compare(PHP_VERSION, '8.0.0', '>=') ? "  (OK)\n" : "  (TOO OLD — set PHP 8.1+ in hPanel)\n");
echo "pdo_mysql   : " . (extension_loaded('pdo_mysql') ? "loaded (OK)\n" : "MISSING\n");

echo "\nReading config.php...\n";
$cfg = @include __DIR__ . '/config.php';
if (!is_array($cfg)) {
    echo "  ✗ config.php did not return an array.\n";
    echo "    This usually means a SYNTAX ERROR in config.php — most often a\n";
    echo "    quote (') or backslash (\\) inside your password breaking the string,\n";
    echo "    or a 'smart quote' pasted from elsewhere. Any PHP error should appear\n";
    echo "    above this line. Fix config.php and reload.\n";
    exit;
}
echo "  ✓ config.php parsed and returned an array.\n";
foreach (['db_host', 'db_name', 'db_user', 'db_pass'] as $k) {
    $v = (string) ($cfg[$k] ?? '');
    $shown = $k === 'db_pass' ? (($v === '' ? '(empty)' : '(set, ' . strlen($v) . ' chars)')) : $v;
    echo "    $k = $shown\n";
}

echo "\nConnecting to MySQL...\n";
try {
    $dsn = "mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset=utf8mb4";
    new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "  ✓ SUCCESS — database connection works!\n";
    echo "\nEverything looks good. Delete this _diag.php file, then open index.php.\n";
} catch (Throwable $e) {
    echo "  ✗ FAILED: " . $e->getMessage() . "\n\n";
    $msg = $e->getMessage();
    if (stripos($msg, 'Unknown database') !== false) {
        echo "  → db_name is wrong. In hPanel the real name has an account prefix,\n    e.g. u123456789_zaifiis — copy it exactly.\n";
    } elseif (stripos($msg, 'Access denied') !== false) {
        echo "  → db_user or db_pass is wrong, or the user isn't assigned to the DB.\n    In hPanel the username also has the u123456789_ prefix. Re-check the\n    password (regenerate it as letters+numbers only to avoid quoting issues).\n";
    } elseif (stripos($msg, 'refused') !== false || stripos($msg, 'No such file') !== false) {
        echo "  → db_host is wrong. On Hostinger shared hosting it should be localhost.\n";
    }
}
