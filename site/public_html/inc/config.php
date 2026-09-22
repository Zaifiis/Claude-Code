<?php
/**
 * Reads .env (one level above public_html) and exposes it as a typed array.
 * Never echo this array — it holds the DB password, mail password and app key.
 */
declare(strict_types=1);

/** Parse a KEY=value .env file. Supports #comments and "quoted values". */
function env_load(string $path): array
{
    if (!is_readable($path)) {
        return [];
    }
    $out = [];
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value);
        if (strlen($value) > 1 && ($value[0] === '"' || $value[0] === "'")
            && $value[0] === substr($value, -1)) {
            $value = substr($value, 1, -1);
        }
        $out[$key] = $value;
    }
    return $out;
}

function config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $env = env_load(dirname(__DIR__, 2) . '/.env');
    $get = static fn(string $k, string $default = ''): string
        => isset($env[$k]) && $env[$k] !== '' ? $env[$k] : $default;

    $brandEmail = $get('BRAND_EMAIL', 'hello@example.com');

    $config = [
        'env'   => $get('APP_ENV', 'production'),
        'url'   => rtrim($get('APP_URL', ''), '/'),
        'key'   => $get('APP_KEY'),
        'brand' => [
            'name'      => $get('BRAND_NAME', 'Kairo'),
            'tagline'   => $get('BRAND_TAGLINE', 'AI automation for teams that are done doing it manually'),
            'email'     => $brandEmail,
            'phone'     => $get('BRAND_PHONE'),
            'calendar'  => $get('BRAND_CALENDAR_URL'),
            'linkedin'  => $get('BRAND_LINKEDIN_URL'),
        ],
        'db' => [
            'driver' => $get('DB_DRIVER', 'mysql'),
            'host'   => $get('DB_HOST', 'localhost'),
            'port'   => $get('DB_PORT', '3306'),
            'name'   => $get('DB_NAME'),
            'user'   => $get('DB_USER'),
            'pass'   => $get('DB_PASS'),
        ],
        'mail' => [
            'transport' => $get('MAIL_TRANSPORT', 'mail'),
            'host'      => $get('MAIL_HOST'),
            'port'      => (int) $get('MAIL_PORT', '465'),
            'encryption'=> $get('MAIL_ENCRYPTION', 'ssl'),
            'user'      => $get('MAIL_USER'),
            'pass'      => $get('MAIL_PASS'),
            'from'      => $get('MAIL_FROM', $brandEmail),
            'from_name' => $get('MAIL_FROM_NAME', $get('BRAND_NAME', 'Kairo')),
            'to'        => $get('MAIL_TO', $brandEmail),
        ],
    ];

    return $config;
}

/** Dot-path config reader: cfg('brand.name'). */
function cfg(string $path, mixed $default = null): mixed
{
    $value = config();
    foreach (explode('.', $path) as $segment) {
        if (!is_array($value) || !array_key_exists($segment, $value)) {
            return $default;
        }
        $value = $value[$segment];
    }
    return $value;
}
