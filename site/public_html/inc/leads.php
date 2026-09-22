<?php
/**
 * Saving an enquiry, scoring it, and telling somebody about it.
 *
 * Order matters: the row is written first and the emails go out afterwards.
 * If SMTP is down the enquiry is still in the database and visible in /admin,
 * which is the difference between a slow reply and a lost client.
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/**
 * @return array{ok: bool, ref: string, errors: array<string, string>}
 */
function lead_store(array $data): array
{
    $ref = lead_reference();

    $row = [
        'ref'          => $ref,
        'name'         => $data['name'],
        'email'        => $data['email'],
        'company'      => $data['company']  ?: null,
        'website'      => $data['website']  ?: null,
        'phone'        => $data['phone']    ?: null,
        'team_size'    => $data['team_size'] ?: null,
        'budget'       => $data['budget']   ?: null,
        'timeline'     => $data['timeline'] ?: null,
        'services'     => $data['services'] ? json_encode(array_values($data['services'])) : null,
        'message'      => $data['message']  ?: null,
        'answers'      => $data['answers'] ? json_encode($data['answers']) : null,
        'score'        => lead_score($data),
        'kind'         => $data['kind'] ?? 'contact',
        'status'       => 'new',
        'source_page'  => $data['source_page'] ?: null,
        'referrer'     => mb_substr((string) ($_SERVER['HTTP_REFERER'] ?? ''), 0, 255) ?: null,
        'utm_source'   => $data['utm_source']   ?: null,
        'utm_medium'   => $data['utm_medium']   ?: null,
        'utm_campaign' => $data['utm_campaign'] ?: null,
        'ip_hash'      => ip_hash(),
        'user_agent'   => mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255) ?: null,
        'created_at'   => now(),
        'updated_at'   => now(),
    ];

    try {
        $id = db_insert('leads', $row);
    } catch (Throwable $e) {
        error_log('lead_store failed: ' . $e->getMessage());
        return [
            'ok'     => false,
            'ref'    => '',
            'errors' => ['form' => 'We could not save that. Email us directly at ' . cfg('brand.email') . ' and we will pick it up.'],
        ];
    }

    $notified = lead_notify($row);
    lead_acknowledge($row);

    if ($notified) {
        try {
            db_update('leads', $id, ['notified_at' => now()]);
        } catch (Throwable $e) {
            error_log('lead notify timestamp failed: ' . $e->getMessage());
        }
    }

    return ['ok' => true, 'ref' => $ref, 'errors' => []];
}

/** Human-readable, collision-resistant reference, e.g. KA-260922-7F3QX. */
function lead_reference(): string
{
    $prefix = strtoupper(mb_substr(preg_replace('/[^A-Za-z]/', '', brand()) ?: 'LEAD', 0, 2));
    $alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    $suffix = '';
    for ($i = 0; $i < 5; $i++) {
        $suffix .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return sprintf('%s-%s-%s', $prefix, date('ymd'), $suffix);
}

/**
 * A blunt 0–100 fit score so the admin list sorts itself. It is a triage aid,
 * not a verdict — a "still exploring" enquiry can be the best call of the week.
 */
function lead_score(array $data): int
{
    $score = 20;

    $score += match ($data['budget'] ?? '') {
        '50k-plus' => 30,
        '15k-50k'  => 25,
        '5k-15k'   => 18,
        'under-5k' => 8,
        default    => 0,
    };

    $score += match ($data['timeline'] ?? '') {
        'asap'    => 25,
        '1-month' => 18,
        'quarter' => 10,
        default   => 2,
    };

    $score += match ($data['team_size'] ?? '') {
        '200+'   => 15,
        '51-200' => 13,
        '11-50'  => 10,
        '2-10'   => 6,
        default  => 3,
    };

    if (!empty($data['company']))  { $score += 4; }
    if (!empty($data['website']))  { $score += 3; }
    if (!empty($data['phone']))    { $score += 3; }
    if (mb_strlen((string) ($data['message'] ?? '')) > 240) { $score += 5; }

    return max(0, min(100, $score));
}

/** Internal "you have a new lead" email. */
function lead_notify(array $row): bool
{
    $to = (string) cfg('mail.to');
    if ($to === '' || !is_valid_email($to)) {
        return false;
    }

    $fields = [
        'Reference'  => $row['ref'],
        'Name'       => $row['name'],
        'Email'      => $row['email'],
        'Company'    => $row['company'],
        'Website'    => $row['website'],
        'Phone'      => $row['phone'],
        'Team size'  => $row['team_size'],
        'Budget'     => $row['budget'],
        'Timeline'   => $row['timeline'],
        'Fit score'  => $row['score'] . ' / 100',
        'Source'     => $row['source_page'],
        'Campaign'   => $row['utm_campaign'],
    ];

    $rows = '';
    foreach ($fields as $label => $value) {
        if ($value === null || $value === '') {
            continue;
        }
        $rows .= sprintf(
            '<tr><td style="padding:6px 14px 6px 0;color:#6b7280;font-size:13px;'
            . 'vertical-align:top;white-space:nowrap">%s</td>'
            . '<td style="padding:6px 0;font-size:14px;color:#111827">%s</td></tr>',
            e((string) $label),
            e((string) $value)
        );
    }

    $extra = '';
    if (!empty($row['services'])) {
        $services = json_decode((string) $row['services'], true);
        if (is_array($services)) {
            $extra .= email_block('Interested in', implode(', ', array_map('strval', $services)));
        }
    }
    if (!empty($row['answers'])) {
        $answers = json_decode((string) $row['answers'], true);
        if (is_array($answers)) {
            $lines = [];
            foreach ($answers as $key => $value) {
                $lines[] = ucfirst(str_replace('_', ' ', (string) $key)) . ': '
                    . (is_array($value) ? implode(', ', array_map('strval', $value)) : (string) $value);
            }
            $extra .= email_block('Audit answers', implode("\n", $lines));
        }
    }
    if (!empty($row['message'])) {
        $extra .= email_block('Message', (string) $row['message']);
    }

    $html = email_wrap(
        'New enquiry — ' . $row['name'],
        '<table style="border-collapse:collapse;width:100%">' . $rows . '</table>' . $extra
        . '<p style="margin:24px 0 0;font-size:13px;color:#6b7280">Open it in the '
        . '<a href="' . e(url('/admin/leads.php')) . '" style="color:#4f46e5">lead desk</a>.</p>'
    );

    return mail_send(
        $to,
        sprintf('[%s] New enquiry from %s (%d/100)', brand(), $row['name'], $row['score']),
        $html,
        '',
        (string) $row['email']
    );
}

/** Auto-reply to whoever got in touch. */
function lead_acknowledge(array $row): bool
{
    $calendar = (string) cfg('brand.calendar');
    $cta = $calendar !== ''
        ? '<p style="margin:0 0 16px"><a href="' . e($calendar)
          . '" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;'
          . 'border-radius:8px;text-decoration:none;font-weight:600">Grab a time that suits you</a></p>'
        : '';

    $html = email_wrap(
        'Thanks — we have got it',
        '<p style="margin:0 0 16px">Hi ' . e(explode(' ', (string) $row['name'])[0]) . ',</p>'
        . '<p style="margin:0 0 16px">Thanks for getting in touch. A human reads every one of '
        . 'these, and you will hear back within one working day.</p>'
        . '<p style="margin:0 0 16px">Your reference is <strong>' . e((string) $row['ref'])
        . '</strong> — quote it if you reply to this thread.</p>'
        . $cta
        . '<p style="margin:0;color:#6b7280;font-size:14px">— The ' . e(brand()) . ' team</p>'
    );

    return mail_send(
        (string) $row['email'],
        sprintf('We got your message — %s', brand()),
        $html,
        '',
        (string) cfg('brand.email')
    );
}

/** A labelled paragraph block inside an email body. */
function email_block(string $label, string $body): string
{
    return sprintf(
        '<div style="margin-top:20px"><div style="font-size:12px;letter-spacing:.08em;'
        . 'text-transform:uppercase;color:#6b7280;margin-bottom:6px">%s</div>'
        . '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;'
        . 'padding:12px 14px;font-size:14px;color:#111827;white-space:pre-wrap">%s</div></div>',
        e($label),
        e($body)
    );
}

/**
 * Email shell. Inline styles and a table-free layout, because every mail
 * client disagrees about everything except inline CSS.
 */
function email_wrap(string $heading, string $body): string
{
    return '<!doctype html><html><body style="margin:0;padding:24px;'
        . 'background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif">'
        . '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;'
        . 'border:1px solid #e5e7eb;padding:28px">'
        . '<div style="font-weight:700;font-size:15px;letter-spacing:-.01em;margin-bottom:20px">'
        . e(brand()) . '</div>'
        . '<h1 style="margin:0 0 18px;font-size:19px;line-height:1.3;color:#111827">' . e($heading) . '</h1>'
        . $body
        . '</div>'
        . '<p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#9ca3af;text-align:center">'
        . e(brand()) . ' &middot; <a href="' . e(url('/')) . '" style="color:#9ca3af">' . e(url('/')) . '</a></p>'
        . '</body></html>';
}
