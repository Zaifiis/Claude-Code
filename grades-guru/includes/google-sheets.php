<?php
/**
 * Grades Guru — Google Sheets API Wrapper
 * Uses service-account JWT authentication via cURL (no external libraries needed).
 */
declare(strict_types=1);

require_once dirname(__DIR__) . '/config.php';

/**
 * Returns a Google OAuth2 access token using a service-account JSON key.
 * Caches the token in a temp file for 55 minutes.
 */
function sheetsGetAccessToken(): ?string
{
    if (!file_exists(SHEETS_CREDENTIALS_PATH)) {
        error_log('[GG Sheets] Credentials file not found: ' . SHEETS_CREDENTIALS_PATH);
        return null;
    }

    $cacheFile = sys_get_temp_dir() . '/gg_sheets_token.json';
    if (file_exists($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if ($cached && isset($cached['token'], $cached['expires']) && $cached['expires'] > time()) {
            return $cached['token'];
        }
    }

    $creds = json_decode(file_get_contents(SHEETS_CREDENTIALS_PATH), true);
    if (!$creds || !isset($creds['private_key'], $creds['client_email'])) {
        error_log('[GG Sheets] Invalid credentials file.');
        return null;
    }

    $now = time();
    $payload = [
        'iss'   => $creds['client_email'],
        'scope' => 'https://www.googleapis.com/auth/spreadsheets',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    ];

    // Build JWT
    $header    = base64url_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $body      = base64url_encode(json_encode($payload));
    $sigInput  = $header . '.' . $body;
    $signature = '';
    openssl_sign($sigInput, $signature, $creds['private_key'], 'sha256WithRSAEncryption');
    $jwt = $sigInput . '.' . base64url_encode($signature);

    // Exchange for access token
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_TIMEOUT        => 15,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        error_log('[GG Sheets] Token exchange failed: ' . $response);
        return null;
    }

    $data = json_decode($response, true);
    if (!isset($data['access_token'])) {
        error_log('[GG Sheets] No access_token in response.');
        return null;
    }

    file_put_contents($cacheFile, json_encode([
        'token'   => $data['access_token'],
        'expires' => $now + 3300, // 55 min
    ]));

    return $data['access_token'];
}

/**
 * Appends a row to the specified Google Sheet.
 *
 * @param string $spreadsheetId Google Spreadsheet ID.
 * @param string $sheetName     Sheet/tab name.
 * @param array  $values        1-D array of cell values.
 * @return bool
 */
function sheetsAppendRow(string $spreadsheetId, string $sheetName, array $values): bool
{
    $token = sheetsGetAccessToken();
    if (!$token) return false;

    $range    = urlencode($sheetName . '!A:S');
    $url      = "https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}/values/{$range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";

    $body = json_encode(['values' => [$values]]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT        => 20,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode < 200 || $httpCode >= 300) {
        error_log('[GG Sheets] Append failed (' . $httpCode . '): ' . $response);
        return false;
    }

    return true;
}

/**
 * Base64-URL encodes a string (no padding).
 */
function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
