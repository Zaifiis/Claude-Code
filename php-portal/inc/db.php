<?php
/**
 * Database bootstrap: connect with PDO (SQLite by default, MySQL optional),
 * create the schema on first run, then seed starter content once. Idempotent
 * and safe to include on every request.
 */

function db_driver(): string
{
    $d = strtolower((string) ($GLOBALS['CONFIG']['db_driver'] ?? 'sqlite'));
    return $d === 'mysql' ? 'mysql' : 'sqlite';
}

/** Portable "insert, ignore duplicates" prefix for the current driver. */
function sql_insert_ignore(): string
{
    return db_driver() === 'mysql' ? 'INSERT IGNORE' : 'INSERT OR IGNORE';
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfg = $GLOBALS['CONFIG'];

    try {
        if (db_driver() === 'mysql') {
            if (($cfg['db_name'] ?? '') === '' || ($cfg['db_user'] ?? '') === '') {
                throw new RuntimeException('MySQL selected but db_name/db_user are empty in config.php.');
            }
            $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $cfg['db_host'], $cfg['db_name'], $cfg['db_charset']);
            $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } else {
            $path = $cfg['sqlite_path'];
            $dir = dirname($path);
            if (!is_dir($dir)) {
                @mkdir($dir, 0775, true);
            }
            if (!is_dir($dir) || !is_writable($dir)) {
                throw new RuntimeException("SQLite data folder is not writable: $dir");
            }
            $pdo = new PDO('sqlite:' . $path, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            $pdo->exec('PRAGMA journal_mode = WAL');
            $pdo->exec('PRAGMA foreign_keys = ON');
            $pdo->exec('PRAGMA busy_timeout = 5000');
        }
    } catch (Throwable $e) {
        http_response_code(500);
        if (!empty($cfg['debug'])) {
            exit('DB connection failed (' . db_driver() . '): ' . h($e->getMessage()));
        }
        if (db_driver() === 'sqlite') {
            exit(
                "<h1 style='font-family:sans-serif'>Storage folder not writable</h1>" .
                "<p style='font-family:sans-serif;max-width:640px'>The app could not create its database file. " .
                "In File Manager, make sure the <code>data</code> folder exists next to the app and is writable " .
                "(permissions 755 or 775). Nothing else is needed.</p>"
            );
        }
        exit(
            "<h1 style='font-family:sans-serif'>Database not connected</h1>" .
            "<p style='font-family:sans-serif;max-width:640px'>Open <code>config.php</code> and enter your MySQL " .
            "database name, user and password from hPanel &rarr; Databases, or set " .
            "<code>'db_driver' =&gt; 'sqlite'</code> to run with no database setup at all.</p>"
        );
    }

    install_schema($pdo);
    ensure_seed($pdo);
    return $pdo;
}

function table_exists(PDO $pdo, string $table): bool
{
    if (db_driver() === 'mysql') {
        // information_schema is a normal SELECT, so placeholders work (unlike
        // SHOW TABLES LIKE ? under native prepared statements).
        $stmt = $pdo->prepare(
            'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1'
        );
        $stmt->execute([$table]);
        return (bool) $stmt->fetchColumn();
    }
    $stmt = $pdo->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?");
    $stmt->execute([$table]);
    return (bool) $stmt->fetchColumn();
}

function column_exists(PDO $pdo, string $table, string $column): bool
{
    if (db_driver() === 'mysql') {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1'
        );
        $stmt->execute([$table, $column]);
        return (bool) $stmt->fetchColumn();
    }
    foreach ($pdo->query("PRAGMA table_info($table)")->fetchAll() as $col) {
        if (($col['name'] ?? '') === $column) {
            return true;
        }
    }
    return false;
}

function install_schema(PDO $pdo): void
{
    if (table_exists($pdo, 'content_items')) {
        // Older installs may predate password_hash — add it if needed.
        if (!column_exists($pdo, 'users', 'password_hash')) {
            $pdo->exec("ALTER TABLE users ADD COLUMN password_hash " .
                (db_driver() === 'mysql' ? "VARCHAR(255) NOT NULL DEFAULT ''" : "TEXT NOT NULL DEFAULT ''"));
        }
        return;
    }

    $file = db_driver() === 'mysql' ? '/schema.sql' : '/schema.sqlite.sql';
    $sql = file_get_contents(__DIR__ . $file);
    $sql = preg_replace('/^--.*$/m', '', $sql);
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
        $pdo->exec($stmt);
    }
}

function ensure_seed(PDO $pdo): void
{
    $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($count === 0) {
        require __DIR__ . '/seed.php';
        seed_database($pdo, $GLOBALS['CONFIG']);
    }
}
