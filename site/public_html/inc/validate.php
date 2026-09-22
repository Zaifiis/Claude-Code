<?php
/**
 * Form validation. Every rule returns a field => message map so the page can
 * re-render with inline errors and the API can answer with JSON.
 */
declare(strict_types=1);

function validate_contact(array $post): array
{
    $errors = [];

    if (input($post, 'name', 120) === '') {
        $errors['name'] = 'Tell us your name.';
    }

    $email = input($post, 'email', 190);
    if ($email === '') {
        $errors['email'] = 'We need an email to reply to.';
    } elseif (!is_valid_email($email)) {
        $errors['email'] = 'That email address does not look right.';
    }

    $message = input($post, 'message', 4000);
    if (mb_strlen($message) < 10) {
        $errors['message'] = 'A sentence or two about what you need, please.';
    }

    $website = input($post, 'website', 190);
    if ($website !== '' && !is_valid_url($website)) {
        $errors['website'] = 'Enter a full URL, e.g. https://yourcompany.com';
    }

    return $errors;
}

function validate_audit(array $post): array
{
    $errors = [];

    if (input($post, 'name', 120) === '') {
        $errors['name'] = 'Tell us your name.';
    }

    $email = input($post, 'email', 190);
    if ($email === '') {
        $errors['email'] = 'We need an email to send the audit to.';
    } elseif (!is_valid_email($email)) {
        $errors['email'] = 'That email address does not look right.';
    }

    if (input($post, 'company', 160) === '') {
        $errors['company'] = 'Which company is this for?';
    }

    $tasks = $post['tasks'] ?? [];
    if (!is_array($tasks) || $tasks === []) {
        $errors['tasks'] = 'Pick at least one thing that eats your week.';
    }

    return $errors;
}

function is_valid_email(string $email): bool
{
    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        return false;
    }
    // Reject the header-injection characters outright; they have no business
    // in an address and we interpolate this into mail headers later.
    return !preg_match('/[\r\n\t]/', $email);
}

function is_valid_url(string $url): bool
{
    if (!preg_match('~^https?://~i', $url)) {
        $url = 'https://' . $url;
    }
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

/** Normalise a user-typed website into something safe to store and link. */
function normalise_url(string $url): string
{
    $url = trim($url);
    if ($url === '') {
        return '';
    }
    if (!preg_match('~^https?://~i', $url)) {
        $url = 'https://' . $url;
    }
    return filter_var($url, FILTER_VALIDATE_URL) === false ? '' : $url;
}

/**
 * Keep only values we published in the form. Anything else is dropped, so a
 * crafted post can never widen the set of stored options.
 */
function only_allowed(array $values, array $allowed): array
{
    $clean = [];
    foreach ($values as $value) {
        if (is_string($value) && in_array($value, $allowed, true)) {
            $clean[] = $value;
        }
    }
    return array_values(array_unique($clean));
}
