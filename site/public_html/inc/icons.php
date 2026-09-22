<?php
/**
 * Inline SVG icons. Inline rather than sprites or an icon font so they inherit
 * colour, need no extra request, and survive the strict CSP.
 */
declare(strict_types=1);

function icon(string $name, string $class = 'icon'): string
{
    $paths = [
        'broadcast' => '<path d="M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/><path d="M8.1 8.1a5.5 5.5 0 0 0 0 7.8M15.9 15.9a5.5 5.5 0 0 0 0-7.8"/><path d="M5.3 5.3a9.5 9.5 0 0 0 0 13.4M18.7 18.7a9.5 9.5 0 0 0 0-13.4"/>',
        'spark'     => '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3 9 9M15 15l2.7 2.7M17.7 6.3 15 9M9 15l-2.7 2.7"/><circle cx="12" cy="12" r="2.6"/>',
        'flow'      => '<rect x="3" y="4" width="6" height="5" rx="1.5"/><rect x="15" y="4" width="6" height="5" rx="1.5"/><rect x="9" y="15" width="6" height="5" rx="1.5"/><path d="M6 9v2.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V9M12 13v2"/>',
        'inbox'     => '<path d="M3 13h4l1.5 3h7L17 13h4"/><path d="M4.4 5.6 3 13v4.5A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5V13l-1.4-7.4A2 2 0 0 0 17.6 4H6.4a2 2 0 0 0-2 1.6Z"/>',
        'chart'     => '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
        'check'     => '<path d="m4 12.5 5 5L20 6.5"/>',
        'arrow'     => '<path d="M5 12h14M13 6l6 6-6 6"/>',
        'shield'    => '<path d="M12 3 5 6v5.5c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
        'clock'     => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
        'key'       => '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M17 6l2.5 2.5M14.5 8.5 17 11"/>',
        'menu'      => '<path d="M4 7h16M4 12h16M4 17h16"/>',
        'close'     => '<path d="m6 6 12 12M18 6 6 18"/>',
        'mail'      => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
        'linkedin'  => '<path d="M6.5 9v9M6.5 5.5v.01M11 18v-5a3 3 0 0 1 6 0v5"/><path d="M11 18v-9"/>',
    ];

    $body = $paths[$name] ?? '';

    return sprintf(
        '<svg class="%s" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        . 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" '
        . 'aria-hidden="true" focusable="false">%s</svg>',
        e($class),
        $body
    );
}

/** The wordmark: a monogram tile plus the brand name. */
function logo_mark(string $class = 'logo__mark'): string
{
    return sprintf(
        '<svg class="%s" viewBox="0 0 32 32" aria-hidden="true" focusable="false">'
        . '<rect x="1" y="1" width="30" height="30" rx="9" fill="none" stroke="currentColor" stroke-width="1.8"/>'
        . '<path d="M11 9v14M11 16l7-7M11 16l7 7" fill="none" stroke="currentColor" '
        . 'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
        . '</svg>',
        e($class)
    );
}
