<?php
/**
 * Shared helpers: escaping, ids, dates, CSRF, flash messages, and safe
 * reference-URL parsing (ported from lib/domain/references.ts).
 */

/** HTML-escape for output. Use everywhere user data is printed. */
function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** RFC-4122-ish v4 UUID (matches the TEXT id design of the original app). */
function uuid(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function now_sql(): string
{
    return date('Y-m-d H:i:s');
}

/** Convert an <input type="datetime-local"> value to a MySQL DATETIME (or null). */
function datetime_local_to_sql(?string $v): ?string
{
    $v = trim((string) $v);
    if ($v === '') {
        return null;
    }
    $ts = strtotime($v);
    return $ts ? date('Y-m-d H:i:s', $ts) : null;
}

/** Convert a MySQL DATETIME back to an <input type="datetime-local"> value. */
function sql_to_datetime_local(?string $v): string
{
    if (!$v) {
        return '';
    }
    $ts = strtotime($v);
    return $ts ? date('Y-m-d\TH:i', $ts) : '';
}

function fmt_date(?string $v, string $format = 'M j, Y'): string
{
    if (!$v) {
        return '';
    }
    $ts = strtotime($v);
    return $ts ? date($format, $ts) : '';
}

function fmt_datetime(?string $v): string
{
    return fmt_date($v, 'M j, Y · g:i A');
}

/** Human "3 days ago" style relative time. */
function time_ago(?string $v): string
{
    if (!$v) {
        return '';
    }
    $ts = strtotime($v);
    if (!$ts) {
        return '';
    }
    $diff = time() - $ts;
    if ($diff < 60) {
        return 'just now';
    }
    $units = [31536000 => 'year', 2592000 => 'month', 604800 => 'week', 86400 => 'day', 3600 => 'hour', 60 => 'minute'];
    foreach ($units as $secs => $name) {
        if ($diff >= $secs) {
            $n = (int) floor($diff / $secs);
            return $n . ' ' . $name . ($n > 1 ? 's' : '') . ' ago';
        }
    }
    return 'just now';
}

/** Compact number formatting: 1200 -> 1.2K. */
function fmt_num(int $n): string
{
    if ($n >= 1000000) {
        return rtrim(rtrim(number_format($n / 1000000, 1), '0'), '.') . 'M';
    }
    if ($n >= 1000) {
        return rtrim(rtrim(number_format($n / 1000, 1), '0'), '.') . 'K';
    }
    return (string) $n;
}

/** First two initials from a name, for the avatar chip. */
function initials(string $name): string
{
    $parts = preg_split('/\s+/', trim($name)) ?: [];
    $out = '';
    foreach ($parts as $p) {
        if ($p !== '') {
            $out .= mb_strtoupper(mb_substr($p, 0, 1));
        }
        if (mb_strlen($out) >= 2) {
            break;
        }
    }
    return $out !== '' ? $out : 'U';
}

// --- CSRF -------------------------------------------------------------------

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . h(csrf_token()) . '">';
}

function csrf_check(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $ok = isset($_POST['_csrf']) && hash_equals($_SESSION['csrf'] ?? '', (string) $_POST['_csrf']);
        if (!$ok) {
            http_response_code(400);
            exit('Invalid form token. Go back and try again.');
        }
    }
}

// --- Flash messages ---------------------------------------------------------

function flash(string $msg): void
{
    $_SESSION['flash'][] = $msg;
}

function take_flash(): array
{
    $f = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $f;
}

function redirect(string $to): never
{
    header('Location: ' . $to);
    exit;
}

// --- Reference URL parsing (safe embedding) ---------------------------------

function ref_safe_url(string $raw): ?array
{
    $trimmed = trim($raw);
    if ($trimmed === '') {
        return null;
    }
    $withProto = preg_match('#^https?://#i', $trimmed) ? $trimmed : 'https://' . $trimmed;
    $parts = parse_url($withProto);
    if (!$parts || empty($parts['host'])) {
        return null;
    }
    $scheme = strtolower($parts['scheme'] ?? 'https');
    if (!in_array($scheme, ['http', 'https'], true)) {
        return null;
    }
    $parts['url'] = $withProto;
    $parts['host_clean'] = preg_replace('/^www\./', '', strtolower($parts['host']));
    return $parts;
}

function ref_youtube_id(array $u): ?string
{
    $host = $u['host_clean'];
    $yt = in_array($host, ['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'], true);
    if (!$yt) {
        return null;
    }
    $path = $u['path'] ?? '';
    parse_str($u['query'] ?? '', $q);
    $id = null;
    if ($host === 'youtu.be') {
        $id = trim($path, '/');
        $id = explode('/', $id)[0] ?? null;
    } elseif (str_starts_with($path, '/watch')) {
        $id = $q['v'] ?? null;
    } elseif (preg_match('#^/(shorts|embed|live)/([^/]+)#', $path, $m)) {
        $id = $m[2];
    }
    if ($id && preg_match('/^[a-zA-Z0-9_-]{6,20}$/', $id)) {
        return $id;
    }
    return null;
}

function ref_detect_platform(array $u): string
{
    $host = $u['host_clean'];
    $path = $u['path'] ?? '';
    if (in_array($host, ['youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com'], true)) {
        return str_starts_with($path, '/shorts/') ? 'youtube_shorts' : 'youtube';
    }
    if (in_array($host, ['instagram.com', 'instagr.am'], true)) {
        return 'instagram';
    }
    if ($host === 'tiktok.com' || str_ends_with($host, '.tiktok.com')) {
        return 'tiktok';
    }
    if ($host === 'linkedin.com' || str_ends_with($host, '.linkedin.com') || $host === 'lnkd.in') {
        return 'linkedin';
    }
    if (in_array($host, ['x.com', 'twitter.com', 't.co'], true)) {
        return 'x';
    }
    if (in_array($host, ['facebook.com', 'fb.com', 'fb.watch'], true)) {
        return 'facebook';
    }
    return 'other';
}

/**
 * Parse a raw reference URL into platform + safe embed/thumbnail info.
 * We only ever build embed URLs ourselves (YouTube), never iframe an
 * arbitrary user URL.
 *
 * @return array{platform:string,url:string,host:string,embed_url:?string,thumbnail_url:?string,valid:bool}
 */
function parse_reference(string $raw): array
{
    $u = ref_safe_url($raw);
    if (!$u) {
        return [
            'platform' => 'other', 'url' => trim($raw), 'host' => '',
            'embed_url' => null, 'thumbnail_url' => null, 'valid' => false,
        ];
    }
    $platform = ref_detect_platform($u);
    $ytId = ref_youtube_id($u);
    if ($ytId) {
        return [
            'platform' => $platform,
            'url' => $u['url'],
            'host' => $u['host_clean'],
            'embed_url' => 'https://www.youtube-nocookie.com/embed/' . $ytId,
            'thumbnail_url' => 'https://i.ytimg.com/vi/' . $ytId . '/hqdefault.jpg',
            'valid' => true,
        ];
    }
    return [
        'platform' => $platform,
        'url' => $u['url'],
        'host' => $u['host_clean'],
        'embed_url' => null,
        'thumbnail_url' => null,
        'valid' => true,
    ];
}

/** Derive a reasonable title from a URL when the user hasn't given one. */
function title_from_url(string $raw): string
{
    $u = ref_safe_url($raw);
    if (!$u) {
        $t = trim($raw);
        return $t !== '' ? mb_substr($t, 0, 80) : 'Untitled reference';
    }
    $host = $u['host_clean'];
    $segs = array_values(array_filter(explode('/', $u['path'] ?? '')));
    $seg = end($segs) ?: '';
    $cleaned = trim(preg_replace('/\.\w+$/', '', preg_replace('/[-_]+/', ' ', urldecode($seg))));
    if ($cleaned && mb_strlen($cleaned) > 2 && !preg_match('/^[0-9a-f]{16,}$/i', $cleaned)) {
        return mb_substr($cleaned, 0, 90);
    }
    return $host ?: 'Untitled reference';
}
