<?php
/**
 * Grades Guru — Database Connection (PDO Singleton)
 * Provides a single shared PDO instance across the application.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config.php';

class Database
{
    private static ?PDO $instance = null;

    /**
     * Private constructor — prevents direct instantiation.
     */
    private function __construct() {}

    /**
     * Returns the shared PDO instance, creating it on first call.
     */
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            self::$instance = self::createConnection();
        }

        return self::$instance;
    }

    /**
     * Creates and configures the PDO connection.
     */
    private static function createConnection(): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=utf8mb4',
            DB_HOST,
            DB_NAME
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_PERSISTENT         => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            return $pdo;
        } catch (PDOException $e) {
            // Do not expose connection details in production
            $message = defined('IS_DEVELOPMENT') && IS_DEVELOPMENT
                ? 'Database connection failed: ' . $e->getMessage()
                : 'A database error occurred. Please try again later.';

            error_log('DB Connection Error: ' . $e->getMessage());

            http_response_code(503);
            die(json_encode([
                'success' => false,
                'message' => $message,
            ]));
        }
    }

    /**
     * Helper: begin a transaction.
     */
    public static function beginTransaction(): void
    {
        self::getInstance()->beginTransaction();
    }

    /**
     * Helper: commit a transaction.
     */
    public static function commit(): void
    {
        self::getInstance()->commit();
    }

    /**
     * Helper: roll back a transaction.
     */
    public static function rollBack(): void
    {
        if (self::getInstance()->inTransaction()) {
            self::getInstance()->rollBack();
        }
    }

    /**
     * Prevent cloning of the singleton instance.
     */
    private function __clone() {}

    /**
     * Prevent unserialization of the singleton instance.
     */
    public function __wakeup()
    {
        throw new \Exception('Cannot unserialize a singleton.');
    }
}

/**
 * Convenience function — returns the shared PDO instance.
 * Usage: $pdo = getPDO();
 */
function getPDO(): PDO
{
    return Database::getInstance();
}
