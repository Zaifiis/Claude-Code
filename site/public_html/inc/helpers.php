<?php
declare(strict_types=1);

/** Escape for HTML text and attributes. Use on EVERY dynamic value. */
function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Absolute URL for a site-relative path. */
function url(string $path = '/'): string
{
    $base = (string) cfg('url');
    if ($base === '') {
        $scheme = is_https() ? 'https' : 'http';
        $host   = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
        $base   = $scheme . '://' . $host;
    }
    return $base . '/' . ltrim($path, '/');
}

function is_https(): bool
{
    return (($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off')
        || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

/** Current request path without query string, e.g. "/pricing". */
function current_path(): string
{
    $path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
    return is_string($path) ? $path : '/';
}

/** True when $path is the page being viewed — used to mark the active nav link. */
function is_current(string $path): bool
{
    $here = rtrim(current_path(), '/');
    $here = $here === '' ? '/' : $here;
    $there = rtrim($path, '/');
    $there = $there === '' ? '/' : $there;
    return $here === $there || $here === $there . '.php';
}

function brand(string $key = 'name'): string
{
    return (string) cfg('brand.' . $key, '');
}

/** Trimmed string from an input array, capped so oversized posts can't bloat the DB. */
function input(array $source, string $key, int $maxLength = 500): string
{
    $value = $source[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }
    return mb_substr(trim($value), 0, $maxLength);
}

function redirect(string $path): never
{
    header('Location: ' . (str_starts_with($path, 'http') ? $path : url($path)), true, 302);
    exit;
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/** "22 Sep 2026, 14:03" from a DB datetime. */
function format_date(?string $datetime, string $format = 'j M Y, H:i'): string
{
    if ($datetime === null || $datetime === '') {
        return '—';
    }
    try {
        return (new DateTimeImmutable($datetime))->format($format);
    } catch (Exception) {
        return $datetime;
    }
}

function now(): string
{
    return (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
}
