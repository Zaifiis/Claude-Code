<?php
/**
 * Content OS — configuration.
 *
 * EDIT THE VALUES BELOW after you create a MySQL database in Hostinger hPanel
 * (Databases -> Management). On Hostinger shared hosting the host is almost
 * always "localhost". Everything else (schema creation, seeding, the login
 * account) happens automatically on first visit.
 *
 * You can also leave these as-is and instead set the matching environment
 * variables (DB_HOST, DB_NAME, DB_USER, DB_PASS) in hPanel — env values win.
 */

return [
    // --- MySQL connection (from hPanel -> Databases) -----------------------
    'db_host' => getenv('DB_HOST') ?: 'localhost',
    'db_name' => getenv('DB_NAME') ?: 'u000000000_contentos',
    'db_user' => getenv('DB_USER') ?: 'u000000000_contentos',
    'db_pass' => getenv('DB_PASS') ?: 'CHANGE_ME',
    'db_charset' => 'utf8mb4',

    // --- App ---------------------------------------------------------------
    // Shown in the header and browser title.
    'app_name' => 'Content OS',

    // The login account is created automatically on first run with these
    // credentials. CHANGE the password after your first login (Settings page),
    // or change it here before first run. Email is just a label.
    'owner_name'  => 'You',
    'owner_email' => 'you@example.com',
    'default_password' => 'changeme',

    // Set true temporarily if a blank page appears, to see the real error.
    'debug' => (getenv('APP_DEBUG') === '1'),
];
