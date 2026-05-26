<?php
/**
 * Grades Guru — HTML Mailer
 * All transactional emails sent via PHP mail() with branded HTML templates.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config.php';

// ─── Base Template ─────────────────────────────────────────────────────────────

/**
 * Wraps $bodyHtml in the standard GG branded email shell.
 */
function gg_email_wrap(string $preheader, string $bodyHtml): string
{
    $appName = APP_NAME;
    $appUrl  = APP_URL;
    $year    = date('Y');

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{$appName}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none}
    body{margin:0;padding:0;background-color:#F8F9FA;font-family:'DM Sans',Arial,sans-serif}
    .container{max-width:600px;margin:0 auto;background:#ffffff}
    .header{background:#0A1628;padding:32px 40px;text-align:center}
    .logo{font-size:28px;font-weight:700;color:#F4C430;letter-spacing:2px;text-decoration:none}
    .logo span{color:#ffffff}
    .body-content{padding:40px}
    .h1{font-size:26px;font-weight:700;color:#0A1628;margin:0 0 16px}
    .p{font-size:15px;line-height:1.7;color:#1A1A2E;margin:0 0 16px}
    .btn{display:inline-block;padding:14px 32px;background:#F4C430;color:#0A1628;
         font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;margin:24px 0}
    .divider{border:none;border-top:1px solid #e5e7eb;margin:32px 0}
    .badge{display:inline-block;padding:8px 20px;background:#0A1628;color:#F4C430;
           font-size:20px;font-weight:700;border-radius:6px;letter-spacing:3px;margin:8px 0}
    .footer{background:#0A1628;padding:24px 40px;text-align:center}
    .footer p{color:#94a3b8;font-size:13px;margin:4px 0}
    .footer a{color:#F4C430;text-decoration:none}
    .highlight-box{background:#F8F9FA;border-left:4px solid #F4C430;
                   padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0}
    .success-icon{font-size:48px;text-align:center;display:block;margin-bottom:16px}
  </style>
</head>
<body>
  <!-- Preheader -->
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all">{$preheader}&nbsp;</span>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8F9FA;padding:20px 0">
    <tr><td align="center">
      <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td class="header">
            <a href="{$appUrl}" class="logo">{$appName}</a>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="body-content">
            {$bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="footer">
            <p>&copy; {$year} {$appName}. All rights reserved.</p>
            <p><a href="{$appUrl}">Visit Website</a> &nbsp;|&nbsp; <a href="mailto:{$_ENV['ADMIN_EMAIL'] ?? ADMIN_EMAIL}">Contact Support</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Core mailer function — sends an HTML (+ text fallback) email.
 */
function gg_send_email(string $to, string $subject, string $preheader, string $bodyHtml): bool
{
    $boundary = md5(uniqid('gg_', true));
    $fromName = APP_NAME;
    $fromAddr = ADMIN_EMAIL;

    $html     = gg_email_wrap($preheader, $bodyHtml);
    $text     = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $bodyHtml));
    $text     = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text     = preg_replace('/[ \t]+/', ' ', $text);
    $text     = preg_replace("/\n{3,}/", "\n\n", trim($text));

    $headers  = implode("\r\n", [
        "From: {$fromName} <{$fromAddr}>",
        "Reply-To: {$fromAddr}",
        "MIME-Version: 1.0",
        "Content-Type: multipart/alternative; boundary=\"{$boundary}\"",
        "X-Mailer: GradesGuru/1.0",
        "X-Priority: 3",
    ]);

    $body = "--{$boundary}\r\n"
          . "Content-Type: text/plain; charset=UTF-8\r\n"
          . "Content-Transfer-Encoding: 8bit\r\n\r\n"
          . $text . "\r\n\r\n"
          . "--{$boundary}\r\n"
          . "Content-Type: text/html; charset=UTF-8\r\n"
          . "Content-Transfer-Encoding: 8bit\r\n\r\n"
          . $html . "\r\n\r\n"
          . "--{$boundary}--";

    try {
        $result = mail($to, $subject, $body, $headers);
        if (!$result) {
            error_log("[GG Mailer] mail() returned false for: {$to} | Subject: {$subject}");
        }
        return $result;
    } catch (Throwable $e) {
        error_log("[GG Mailer] Exception sending to {$to}: " . $e->getMessage());
        return false;
    }
}

// ─── Transactional Emails ──────────────────────────────────────────────────────

/**
 * Sends the welcome email to a newly registered user.
 */
function sendWelcomeEmail(array $user): bool
{
    $name         = htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8');
    $email        = $user['email'];
    $referralCode = htmlspecialchars($user['referral_code'], ENT_QUOTES, 'UTF-8');
    $loginUrl     = APP_URL . '/login.php';
    $appName      = APP_NAME;

    $body = <<<HTML
<h1 class="h1">Welcome to {$appName}, {$name}!</h1>
<p class="p">We're thrilled to have you on board. Your account has been created successfully and you're ready to start ordering high-quality academic content.</p>

<div class="highlight-box">
  <p style="margin:0;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600">Your Referral Code</p>
  <div class="badge">{$referralCode}</div>
  <p style="margin:8px 0 0;font-size:13px;color:#6b7280">Share this code with friends — you both earn discounts!</p>
</div>

<p class="p">Here's what you can do right now:</p>
<ul style="color:#1A1A2E;font-size:15px;line-height:2">
  <li>Submit your first assignment or essay task</li>
  <li>Spin the welcome wheel to unlock an instant discount</li>
  <li>Track your tasks in real-time from your dashboard</li>
</ul>

<div style="text-align:center">
  <a href="{$loginUrl}" class="btn">Go to My Dashboard &rarr;</a>
</div>

<hr class="divider" />
<p class="p" style="font-size:13px;color:#6b7280">If you did not create this account, please ignore this email or contact support immediately.</p>
HTML;

    return gg_send_email(
        $email,
        "Welcome to {$appName} — Your Account is Ready!",
        "Your Grades Guru account is set up. Log in now and spin the welcome wheel!",
        $body
    );
}

/**
 * Sends a referral-confirmed email when admin approves a referral.
 */
function sendReferralConfirmedEmail(array $user, float $discount): bool
{
    $name      = htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8');
    $email     = $user['email'];
    $discountF = number_format($discount, 0);
    $loginUrl  = APP_URL . '/login.php';

    $body = <<<HTML
<span class="success-icon">&#127881;</span>
<h1 class="h1">Your Referral was Confirmed!</h1>
<p class="p">Great news, {$name}! Your referral has been verified and approved.</p>

<div class="highlight-box">
  <p style="margin:0;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600">Your New Discount</p>
  <div class="badge">{$discountF}% OFF</div>
  <p style="margin:8px 0 0;font-size:13px;color:#6b7280">This discount will be automatically applied to your next order.</p>
</div>

<p class="p">Keep referring friends to unlock even bigger discounts — refer 2 friends for up to 25% off!</p>

<div style="text-align:center">
  <a href="{$loginUrl}" class="btn">Place an Order Now &rarr;</a>
</div>
HTML;

    return gg_send_email(
        $email,
        'Referral Confirmed — You\'ve Earned a Discount!',
        "Your referral was approved. Enjoy {$discountF}% off your next order!",
        $body
    );
}

/**
 * Notifies the client when their task has been delivered.
 */
function sendTaskDeliveredEmail(array $user, array $task): bool
{
    $name       = htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8');
    $email      = $user['email'];
    $taskName   = htmlspecialchars($task['task_name'], ENT_QUOTES, 'UTF-8');
    $serial     = htmlspecialchars($task['serial_number'], ENT_QUOTES, 'UTF-8');
    $deadline   = date('F j, Y', strtotime($task['deadline']));
    $dashUrl    = APP_URL . '/client/tasks.php?id=' . (int)$task['id'];

    $body = <<<HTML
<span class="success-icon">&#10003;</span>
<h1 class="h1">Your Task Has Been Delivered!</h1>
<p class="p">Hi {$name}, your task is complete and ready for download.</p>

<div class="highlight-box">
  <p style="margin:0;font-size:13px;color:#6b7280;font-weight:600">Task Details</p>
  <table style="width:100%;margin-top:12px;font-size:14px;color:#1A1A2E">
    <tr><td style="padding:4px 0;color:#6b7280;width:40%">Task ID</td><td><strong>{$serial}</strong></td></tr>
    <tr><td style="padding:4px 0;color:#6b7280">Task</td><td><strong>{$taskName}</strong></td></tr>
    <tr><td style="padding:4px 0;color:#6b7280">Deadline</td><td><strong>{$deadline}</strong></td></tr>
  </table>
</div>

<p class="p">Log in to your dashboard to download your completed task. If you have any feedback or revisions needed, please contact us immediately.</p>

<div style="text-align:center">
  <a href="{$dashUrl}" class="btn">Download Task &rarr;</a>
</div>

<hr class="divider" />
<p class="p" style="font-size:13px;color:#6b7280">Thank you for trusting Grades Guru. We look forward to helping you again!</p>
HTML;

    return gg_send_email(
        $email,
        "Task Delivered: {$taskName}",
        "Your task '{$taskName}' is ready for download.",
        $body
    );
}

/**
 * Sends a payment receipt to the client after a payment is recorded.
 */
function sendPaymentReceiptEmail(array $user, array $payment, array $task): bool
{
    $name     = htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8');
    $email    = $user['email'];
    $amount   = number_format((float)$payment['amount'], 2);
    $method   = htmlspecialchars($payment['payment_method'], ENT_QUOTES, 'UTF-8');
    $date     = date('F j, Y', strtotime($payment['payment_date']));
    $taskName = htmlspecialchars($task['task_name'], ENT_QUOTES, 'UTF-8');
    $serial   = htmlspecialchars($task['serial_number'], ENT_QUOTES, 'UTF-8');
    $dashUrl  = APP_URL . '/client/payments.php';

    $body = <<<HTML
<h1 class="h1">Payment Receipt</h1>
<p class="p">Hi {$name}, we've successfully recorded your payment. Here are the details:</p>

<div class="highlight-box">
  <table style="width:100%;font-size:14px;color:#1A1A2E">
    <tr><td style="padding:6px 0;color:#6b7280;width:40%">Receipt For</td><td><strong>{$taskName}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Task ID</td><td><strong>{$serial}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Amount Paid</td><td><strong style="color:#10B981;font-size:16px">PKR {$amount}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Payment Method</td><td><strong>{$method}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Payment Date</td><td><strong>{$date}</strong></td></tr>
  </table>
</div>

<p class="p">Please keep this receipt for your records. You can view all your payment history in your dashboard.</p>

<div style="text-align:center">
  <a href="{$dashUrl}" class="btn">View Payment History &rarr;</a>
</div>

<hr class="divider" />
<p class="p" style="font-size:13px;color:#6b7280">If you believe this payment was recorded in error, please contact our support team immediately.</p>
HTML;

    return gg_send_email(
        $email,
        "Payment Received — PKR {$amount}",
        "Your payment of PKR {$amount} for '{$taskName}' has been recorded.",
        $body
    );
}

/**
 * Notifies a team lead when a new task is assigned to them.
 */
function sendTLTaskAssignedEmail(array $tl, array $task): bool
{
    $name     = htmlspecialchars($tl['name'], ENT_QUOTES, 'UTF-8');
    $email    = $tl['email'];
    $taskName = htmlspecialchars($task['task_name'], ENT_QUOTES, 'UTF-8');
    $serial   = htmlspecialchars($task['serial_number'], ENT_QUOTES, 'UTF-8');
    $deadline = date('F j, Y', strtotime($task['deadline']));
    $type     = ucfirst($task['task_type']);
    $words    = number_format((int)$task['word_count']);
    $subject  = htmlspecialchars($task['subject'] ?? 'N/A', ENT_QUOTES, 'UTF-8');
    $dashUrl  = APP_URL . '/tl/tasks.php?id=' . (int)$task['id'];

    $body = <<<HTML
<h1 class="h1">New Task Assigned to You</h1>
<p class="p">Hi {$name}, a new task has been assigned to your team. Please review the details and assign a writer promptly.</p>

<div class="highlight-box">
  <table style="width:100%;font-size:14px;color:#1A1A2E">
    <tr><td style="padding:6px 0;color:#6b7280;width:40%">Task ID</td><td><strong>{$serial}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Task</td><td><strong>{$taskName}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Subject</td><td><strong>{$subject}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Type</td><td><strong>{$type}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Word Count</td><td><strong>{$words} words</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Deadline</td><td><strong style="color:#ef4444">{$deadline}</strong></td></tr>
  </table>
</div>

<div style="text-align:center">
  <a href="{$dashUrl}" class="btn">View Task Details &rarr;</a>
</div>
HTML;

    return gg_send_email(
        $email,
        "New Task Assigned: {$serial}",
        "A new {$type} task '{$taskName}' is waiting for your review.",
        $body
    );
}

/**
 * Sends the monthly spin reminder email to eligible clients.
 */
function sendMonthlySpinEmail(array $user): bool
{
    $name     = htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8');
    $email    = $user['email'];
    $spinUrl  = APP_URL . '/client/spin-wheel.php';
    $month    = date('F Y');

    $body = <<<HTML
<span class="success-icon">&#127777;&#65039;</span>
<h1 class="h1">Your Monthly Spin is Ready!</h1>
<p class="p">Hi {$name}! Great news — your monthly spin on the Grades Guru Reward Wheel is now available for <strong>{$month}</strong>.</p>

<p class="p">Spin the wheel to win one of these amazing rewards:</p>
<ul style="color:#1A1A2E;font-size:15px;line-height:2">
  <li>&#127381; 10% Discount on your next order</li>
  <li>&#128176; Priority Delivery upgrade</li>
  <li>&#127873; Exclusive Offer — just for you</li>
  <li>&#129309; Referral Bonus multiplier</li>
</ul>

<div style="text-align:center">
  <a href="{$spinUrl}" class="btn">Spin the Wheel Now &rarr;</a>
</div>

<hr class="divider" />
<p class="p" style="font-size:13px;color:#6b7280">This offer is only available once per month and expires at the end of {$month}. Don't miss out!</p>
HTML;

    return gg_send_email(
        $email,
        "Your Monthly Spin is Ready — Win Discounts!",
        "Spin the Grades Guru reward wheel this month and win exciting discounts!",
        $body
    );
}
