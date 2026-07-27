<?php
/**
 * Diagnostic — visit /_diag.php to see exactly what's wrong.
 * DELETE this file once the app works.
 */
error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/plain; charset=utf-8');

echo "Content OS — diagnostics\n========================\n\n";
echo "PHP version : " . PHP_VERSION . (version_compare(PHP_VERSION, '8.0.0', '>=') ? "  (OK)\n" : "  (TOO OLD — set PHP 8.1+ in hPanel)\n");
echo "pdo_sqlite  : " . (extension_loaded('pdo_sqlite') ? "loaded (OK)\n" : "MISSING\n");
echo "pdo_mysql   : " . (extension_loaded('pdo_mysql') ? "loaded\n" : "not loaded\n");

echo "\nReading config.php...\n";
$cfg = @include __DIR__ . '/config.php';
if (!is_array($cfg)) {
    echo "  X config.php did not return an array — a SYNTAX ERROR (any error above).\n";
    exit;
}
$driver = strtolower($cfg['db_driver'] ?? 'sqlite');
echo "  OK config.php parsed. Engine: $driver\n";

echo "\nTesting the database...\n";
try {
    if ($driver === 'mysql') {
        $dsn = "mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset=utf8mb4";
        new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        echo "  OK MySQL connection works!\n";
    } else {
        $path = $cfg['sqlite_path'];
        $dir = dirname($path);
        echo "  data folder : $dir\n";
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        echo "  folder made : " . (is_dir($dir) ? "yes" : "NO") . "\n";
        echo "  writable    : " . (is_writable($dir) ? "yes" : "NO — set the 'data' folder to 755/775 in File Manager") . "\n";
        $pdo = new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdo->exec('CREATE TABLE IF NOT EXISTS _diag_test (x INTEGER)');
        $pdo->exec('DROP TABLE _diag_test');
        echo "  OK SQLite works — database file is ready.\n";
    }
    echo "\nAll good. Delete this _diag.php file, then open index.php.\n";
} catch (Throwable $e) {
    echo "  X FAILED: " . $e->getMessage() . "\n";
    if ($driver === 'sqlite') {
        echo "\n  → Almost always a permissions issue: make the 'data' folder writable\n    (755 or 775) in hPanel File Manager. No database setup is needed.\n";
    } else {
        $m = $e->getMessage();
        if (stripos($m, 'Unknown database') !== false) echo "\n  → db_name wrong (needs the u123456789_ prefix from hPanel).\n";
        elseif (stripos($m, 'Access denied') !== false) echo "\n  → db_user/db_pass wrong, or user not assigned to the database.\n";
    }
}
