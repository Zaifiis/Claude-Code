<?php
/**
 * Thin PDO wrapper. MySQL in production (Hostinger), SQLite for local testing —
 * the SQL used throughout the app is deliberately portable between the two.
 */
declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $db     = cfg('db');
    $driver = $db['driver'] ?? 'mysql';

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    if ($driver === 'sqlite') {
        $pdo = new PDO('sqlite:' . $db['name'], null, null, $options);
        $pdo->exec('PRAGMA foreign_keys = ON');
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $db['host'],
        $db['port'],
        $db['name']
    );
    $pdo = new PDO($dsn, $db['user'], $db['pass'], $options);

    return $pdo;
}

/** Run a prepared statement. Values are ALWAYS bound, never interpolated. */
function db_run(string $sql, array $params = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function db_all(string $sql, array $params = []): array
{
    return db_run($sql, $params)->fetchAll();
}

function db_one(string $sql, array $params = []): ?array
{
    $row = db_run($sql, $params)->fetch();
    return $row === false ? null : $row;
}

function db_value(string $sql, array $params = []): mixed
{
    $value = db_run($sql, $params)->fetchColumn();
    return $value === false ? null : $value;
}

/** Insert an associative array into $table and return the new row id. */
function db_insert(string $table, array $data): int
{
    $columns      = array_keys($data);
    $placeholders = array_map(static fn(string $c): string => ':' . $c, $columns);
    $sql = sprintf(
        'INSERT INTO %s (%s) VALUES (%s)',
        $table,
        implode(', ', $columns),
        implode(', ', $placeholders)
    );
    db_run($sql, $data);
    return (int) db()->lastInsertId();
}

/** Update $table by id from an associative array. */
function db_update(string $table, int $id, array $data): void
{
    $assignments = [];
    foreach (array_keys($data) as $column) {
        $assignments[] = $column . ' = :' . $column;
    }
    $data['id'] = $id;
    db_run(
        sprintf('UPDATE %s SET %s WHERE id = :id', $table, implode(', ', $assignments)),
        $data
    );
}

/** True when the database is reachable — used by the admin health check. */
function db_healthy(): bool
{
    try {
        db()->query('SELECT 1');
        return true;
    } catch (Throwable) {
        return false;
    }
}
