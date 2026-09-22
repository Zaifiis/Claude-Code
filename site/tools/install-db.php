<?php
/**
 * Creates the tables in whichever database .env points at, and optionally
 * creates your first admin login.
 *
 *   php tools/install-db.php
 *   php tools/install-db.php --admin="Your Name" --email=you@example.com
 *
 * Safe to re-run: every statement is CREATE TABLE IF NOT EXISTS, and an
 * existing admin address is updated rather than duplicated.
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit("Run this from the command line.\n");
}

require __DIR__ . '/../public_html/inc/bootstrap.php';

$options = getopt('', ['admin:', 'email:', 'password:']);
$driver  = (string) cfg('db.driver');
$schema  = __DIR__ . '/../db/' . ($driver === 'sqlite' ? 'schema.sqlite.sql' : 'schema.sql');

if (!is_readable($schema)) {
    exit("Cannot read {$schema}\n");
}

echo "Driver:   {$driver}\n";
echo "Database: " . cfg('db.name') . "\n\n";

try {
    $pdo = db();
} catch (Throwable $e) {
    exit("Could not connect: " . $e->getMessage() . "\n");
}

/*
 * Split on semicolons at end of line. Enough for these two schema files, which
 * contain no stored routines or semicolons inside string literals.
 */
$sql = (string) file_get_contents($schema);
$sql = preg_replace('/^\s*--.*$/m', '', $sql) ?? $sql;

$applied = 0;
foreach (preg_split('/;\s*$/m', $sql) ?: [] as $statement) {
    $statement = trim($statement);
    if ($statement === '') {
        continue;
    }
    try {
        $pdo->exec($statement);
        $applied++;
    } catch (Throwable $e) {
        echo "  ! " . $e->getMessage() . "\n";
    }
}

echo "Applied {$applied} statements.\n";

// ── Optional admin account ──────────────────────────────────────────────────
if (isset($options['email'])) {
    $email = mb_strtolower(trim((string) $options['email']));
    $name  = trim((string) ($options['admin'] ?? 'Admin'));

    $password = (string) ($options['password'] ?? '');
    if ($password === '') {
        echo "\nPassword for {$email}: ";
        // Ask the shell to stop echoing, so the password stays out of scrollback.
        @shell_exec('stty -echo 2>/dev/null');
        $password = trim((string) fgets(STDIN));
        @shell_exec('stty echo 2>/dev/null');
        echo "\n";
    }

    if (strlen($password) < 12) {
        exit("Password must be at least 12 characters.\n");
    }

    $hash     = password_hash($password, PASSWORD_DEFAULT);
    $existing = db_one('SELECT id FROM admin_users WHERE email = ?', [$email]);

    if ($existing !== null) {
        db_update('admin_users', (int) $existing['id'], ['password_hash' => $hash, 'name' => $name]);
        echo "Updated the password for {$email}.\n";
    } else {
        db_insert('admin_users', [
            'name'          => $name,
            'email'         => $email,
            'password_hash' => $hash,
            'created_at'    => now(),
        ]);
        echo "Created admin {$email}.\n";
    }
}

echo "\nDone. Sign in at " . url('/admin/') . "\n";
