<?php
/**
 * Outbound mail with no Composer dependency: a small SMTP client (what
 * Hostinger recommends), PHP's mail() as a fallback, and a log transport for
 * local development.
 *
 * Sending is always best-effort — a lead is saved to the database first, so a
 * mail outage delays the notification but never loses the enquiry.
 */
declare(strict_types=1);

/**
 * @param string $to      Recipient address
 * @param string $subject Plain subject line
 * @param string $html    HTML body
 * @param string $text    Plain-text alternative
 * @param string $replyTo Optional Reply-To address
 */
function mail_send(
    string $to,
    string $subject,
    string $html,
    string $text = '',
    string $replyTo = ''
): bool {
    if (!is_valid_email($to)) {
        error_log('mail_send: refusing to send to invalid address');
        return false;
    }
    if ($replyTo !== '' && !is_valid_email($replyTo)) {
        $replyTo = '';
    }
    if ($text === '') {
        $text = trim(html_entity_decode(strip_tags(str_replace(
            ['</p>', '<br>', '<br/>', '<br />'],
            "\n",
            $html
        )), ENT_QUOTES, 'UTF-8'));
    }

    // CR/LF in a subject would let a caller inject extra headers.
    $subject   = preg_replace('/[\r\n]+/', ' ', $subject) ?? $subject;
    $transport = (string) cfg('mail.transport', 'mail');

    try {
        return match ($transport) {
            'smtp' => smtp_send($to, $subject, $html, $text, $replyTo),
            'log'  => mail_log($to, $subject, $html),
            default => mail_php($to, $subject, $html, $text, $replyTo),
        };
    } catch (Throwable $e) {
        error_log('mail_send failed (' . $transport . '): ' . $e->getMessage());
        return false;
    }
}

/** RFC 2047 encoding so non-ASCII subjects survive the trip. */
function mime_encode(string $value): string
{
    return preg_match('/[^\x20-\x7E]/', $value) === 1
        ? '=?UTF-8?B?' . base64_encode($value) . '?='
        : $value;
}

function mail_headers(string $replyTo, string $boundary): array
{
    $fromName = mime_encode((string) cfg('mail.from_name', brand()));
    $from     = (string) cfg('mail.from');

    $headers = [
        'From'         => sprintf('%s <%s>', $fromName, $from),
        'MIME-Version' => '1.0',
        'Content-Type' => 'multipart/alternative; boundary="' . $boundary . '"',
        'Date'         => date(DATE_RFC2822),
        'Message-ID'   => sprintf('<%s@%s>', bin2hex(random_bytes(12)), mail_hostname()),
    ];
    if ($replyTo !== '') {
        $headers['Reply-To'] = $replyTo;
    }
    return $headers;
}

function mail_hostname(): string
{
    $host = parse_url((string) cfg('url'), PHP_URL_HOST);
    return is_string($host) && $host !== '' ? $host : 'localhost';
}

function mail_body(string $html, string $text, string $boundary): string
{
    return implode("\r\n", [
        '--' . $boundary,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        chunk_split(base64_encode($text), 76, "\r\n"),
        '--' . $boundary,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        chunk_split(base64_encode($html), 76, "\r\n"),
        '--' . $boundary . '--',
        '',
    ]);
}

function mail_php(string $to, string $subject, string $html, string $text, string $replyTo): bool
{
    $boundary = 'b' . bin2hex(random_bytes(8));
    $headers  = mail_headers($replyTo, $boundary);
    $lines    = [];
    foreach ($headers as $name => $value) {
        $lines[] = $name . ': ' . $value;
    }
    return mail(
        $to,
        mime_encode($subject),
        mail_body($html, $text, $boundary),
        implode("\r\n", $lines)
    );
}

function mail_log(string $to, string $subject, string $html): bool
{
    if (!is_dir(APP_STORAGE)) {
        @mkdir(APP_STORAGE, 0750, true);
    }
    $entry = sprintf(
        "\n===== %s =====\nTo: %s\nSubject: %s\n\n%s\n",
        now(),
        $to,
        $subject,
        $html
    );
    return file_put_contents(APP_STORAGE . '/mail.log', $entry, FILE_APPEND | LOCK_EX) !== false;
}

/**
 * Minimal SMTP client: implicit TLS (port 465) or STARTTLS (587), AUTH LOGIN.
 * Every step checks the reply code and throws with the server's own message,
 * which is what you want in the error log when a host changes its settings.
 */
function smtp_send(string $to, string $subject, string $html, string $text, string $replyTo): bool
{
    $host = (string) cfg('mail.host');
    $port = (int) cfg('mail.port', 465);
    $enc  = (string) cfg('mail.encryption', 'ssl');
    $user = (string) cfg('mail.user');
    $pass = (string) cfg('mail.pass');

    if ($host === '') {
        throw new RuntimeException('MAIL_HOST is not configured');
    }

    $transport = $enc === 'ssl' ? 'ssl://' : 'tcp://';
    $socket = @stream_socket_client(
        $transport . $host . ':' . $port,
        $errno,
        $errstr,
        15,
        STREAM_CLIENT_CONNECT
    );
    if ($socket === false) {
        throw new RuntimeException("connect to {$host}:{$port} failed: {$errstr} ({$errno})");
    }
    stream_set_timeout($socket, 15);

    try {
        smtp_expect($socket, 220);

        $hostname = mail_hostname();
        smtp_command($socket, 'EHLO ' . $hostname, 250);

        if ($enc === 'tls') {
            smtp_command($socket, 'STARTTLS', 220);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS negotiation failed');
            }
            smtp_command($socket, 'EHLO ' . $hostname, 250);
        }

        if ($user !== '') {
            smtp_command($socket, 'AUTH LOGIN', 334);
            smtp_command($socket, base64_encode($user), 334);
            smtp_command($socket, base64_encode($pass), 235);
        }

        $from = (string) cfg('mail.from');
        smtp_command($socket, 'MAIL FROM:<' . $from . '>', 250);
        smtp_command($socket, 'RCPT TO:<' . $to . '>', 250);
        smtp_command($socket, 'DATA', 354);

        $boundary = 'b' . bin2hex(random_bytes(8));
        $headers  = mail_headers($replyTo, $boundary);
        $headers['To']      = $to;
        $headers['Subject'] = mime_encode($subject);

        $message = '';
        foreach ($headers as $name => $value) {
            $message .= $name . ': ' . $value . "\r\n";
        }
        $message .= "\r\n" . mail_body($html, $text, $boundary);

        // Dot-stuffing: a line that is just "." would otherwise end DATA early.
        $message = preg_replace('/^\./m', '..', $message) ?? $message;

        smtp_write($socket, $message . "\r\n.");
        smtp_expect($socket, 250);
        smtp_write($socket, 'QUIT');

        return true;
    } finally {
        @fclose($socket);
    }
}

/** @param resource $socket */
function smtp_write($socket, string $line): void
{
    if (fwrite($socket, $line . "\r\n") === false) {
        throw new RuntimeException('failed writing to SMTP socket');
    }
}

/** @param resource $socket */
function smtp_command($socket, string $command, int $expected): string
{
    smtp_write($socket, $command);
    return smtp_expect($socket, $expected);
}

/**
 * Read a full (possibly multi-line) SMTP reply and assert its code.
 * @param resource $socket
 */
function smtp_expect($socket, int $expected): string
{
    $reply = '';
    while (($line = fgets($socket, 515)) !== false) {
        $reply .= $line;
        // Continuation lines look like "250-STARTTLS"; the last is "250 OK".
        if (strlen($line) < 4 || $line[3] !== '-') {
            break;
        }
    }
    if ($reply === '') {
        throw new RuntimeException('no reply from SMTP server (timeout?)');
    }
    $code = (int) substr($reply, 0, 3);
    if ($code !== $expected) {
        throw new RuntimeException(sprintf(
            'SMTP expected %d, got: %s',
            $expected,
            trim($reply)
        ));
    }
    return $reply;
}
