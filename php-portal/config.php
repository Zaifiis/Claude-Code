<?php
/**
 * Content OS — configuration.
 *
 * DEFAULT: SQLite. You do NOT need to create any database, user or password.
 * Just upload the files and open the site — a database file is created
 * automatically inside the (protected) `data/` folder on first visit.
 *
 * Only switch to MySQL if you specifically want to: set 'db_driver' => 'mysql'
 * and fill in the MySQL section from hPanel -> Databases.
 */

return [
    // --- Which engine to use: 'sqlite' (zero-setup) or 'mysql' --------------
    'db_driver' => getenv('DB_DRIVER') ?: 'sqlite',

    // --- SQLite (used when db_driver = sqlite) -----------------------------
    // Where the database file lives. Default: a protected folder next to the
    // app. Nothing to configure.
    'sqlite_path' => getenv('SQLITE_PATH') ?: __DIR__ . '/data/content-os.sqlite',

    // --- MySQL (only used when db_driver = mysql) --------------------------
    'db_host' => getenv('DB_HOST') ?: 'localhost',
    'db_name' => getenv('DB_NAME') ?: '',
    'db_user' => getenv('DB_USER') ?: '',
    'db_pass' => getenv('DB_PASS') ?: '',
    'db_charset' => 'utf8mb4',

    // --- App ---------------------------------------------------------------
    'app_name' => 'Content OS',

    // The login account is created automatically on first run with these
    // credentials. CHANGE the password after your first login (Settings page).
    'owner_name'  => 'zaifiis',
    'owner_email' => 'hyfa3647@gmail.com',
    'default_password' => 'changeme',

    // Set true temporarily if a blank page appears, to see the real error.
    'debug' => (getenv('APP_DEBUG') === '1'),
];
