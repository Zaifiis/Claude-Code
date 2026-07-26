<?php
/**
 * Database bootstrap: connect with PDO, create the schema on first run, then
 * seed starter content once. Idempotent and safe to include on every request.
 */

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfg = $GLOBALS['CONFIG'];
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $cfg['db_host'],
        $cfg['db_name'],
        $cfg['db_charset']
    );

    try {
        $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        if (!empty($cfg['debug'])) {
            exit('DB connection failed: ' . h($e->getMessage()));
        }
        exit(
            "<h1 style='font-family:sans-serif'>Database not connected</h1>" .
            "<p style='font-family:sans-serif;max-width:640px'>Open <code>config.php</code> and enter your MySQL " .
            "database name, user and password from hPanel &rarr; Databases. Host is usually " .
            "<code>localhost</code>.</p>"
        );
    }

    install_schema($pdo);
    ensure_seed($pdo);
    return $pdo;
}

function install_schema(PDO $pdo): void
{
    // Only run the (idempotent) DDL if the core table is missing — keeps normal
    // requests fast.
    $exists = $pdo->query("SHOW TABLES LIKE 'content_items'")->fetchColumn();
    if ($exists) {
        // Older installs may predate password_hash — add it if needed.
        $col = $pdo->query("SHOW COLUMNS FROM users LIKE 'password_hash'")->fetchColumn();
        if (!$col) {
            $pdo->exec("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''");
        }
        return;
    }

    $sql = file_get_contents(__DIR__ . '/schema.sql');
    // Strip line comments, then run each statement separately (PDO can't run a
    // multi-statement string with real prepares).
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
