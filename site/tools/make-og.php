<?php
/**
 * Regenerates public_html/assets/img/og.png — the preview card social networks
 * and chat apps show when someone pastes a link to the site.
 *
 * Run it after changing BRAND_NAME or BRAND_TAGLINE:
 *
 *     php tools/make-og.php
 *
 * PNG rather than SVG on purpose: most platforms will not render an SVG card.
 */
declare(strict_types=1);

require __DIR__ . '/../public_html/inc/config.php';

if (!extension_loaded('gd')) {
    fwrite(STDERR, "The gd extension is not available, so the card cannot be drawn.\n");
    exit(1);
}

/** First usable sans-serif on this machine. */
function find_font(array $candidates): ?string
{
    foreach ($candidates as $path) {
        if (is_readable($path)) {
            return $path;
        }
    }
    return null;
}

$bold = find_font([
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
]);
$book = find_font([
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/TTF/DejaVuSans.ttf',
]) ?? $bold;

if ($bold === null) {
    fwrite(STDERR, "No TrueType font found. Install dejavu-fonts or edit the paths in this script.\n");
    exit(1);
}

const W = 1200;
const H = 630;

$image = imagecreatetruecolor(W, H);
imageantialias($image, true);

$ink      = imagecolorallocate($image, 233, 237, 245);
$muted    = imagecolorallocate($image, 139, 149, 168);
$accent   = imagecolorallocate($image, 108, 140, 255);
$mint     = imagecolorallocate($image, 55, 225, 180);

// Vertical gradient background, dark blue-black top to black bottom.
for ($y = 0; $y < H; $y++) {
    $t = $y / H;
    $colour = imagecolorallocate(
        $image,
        (int) (11 - 4 * $t),
        (int) (15 - 6 * $t),
        (int) (24 - 10 * $t)
    );
    imageline($image, 0, $y, W, $y, $colour);
}

/*
 * Two soft radial glows, blended per pixel. Stacking translucent ellipses
 * would accumulate into a solid disc, so the falloff is computed directly.
 */
$glows = [
    ['x' => 210,  'y' => 40,  'r' => 620, 'rgb' => [70, 96, 210], 'peak' => 0.85],
    ['x' => 1050, 'y' => 120, 'r' => 480, 'rgb' => [30, 140, 130], 'peak' => 0.40],
];

for ($y = 0; $y < H; $y++) {
    for ($x = 0; $x < W; $x++) {
        $rgb = imagecolorat($image, $x, $y);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;
        $touched = false;

        foreach ($glows as $glow) {
            $dx = $x - $glow['x'];
            $dy = $y - $glow['y'];
            $d  = sqrt($dx * $dx + $dy * $dy);
            if ($d >= $glow['r']) {
                continue;
            }
            // Squared falloff reads as light rather than as a shape.
            $a = (1 - $d / $glow['r']) ** 2 * $glow['peak'];
            $r = (int) ($r + ($glow['rgb'][0] - $r) * $a);
            $g = (int) ($g + ($glow['rgb'][1] - $g) * $a);
            $b = (int) ($b + ($glow['rgb'][2] - $b) * $a);
            $touched = true;
        }

        if ($touched) {
            imagesetpixel($image, $x, $y, imagecolorallocate($image, $r, $g, $b));
        }
    }
}

// Monogram tile.
$tileX = 86;
$tileY = 84;
$tile  = 76;
imagesetthickness($image, 3);
imagerectangle($image, $tileX, $tileY, $tileX + $tile, $tileY + $tile, $accent);
imagesetthickness($image, 5);
imageline($image, $tileX + 24, $tileY + 20, $tileX + 24, $tileY + 56, $accent);
imageline($image, $tileX + 24, $tileY + 38, $tileX + 54, $tileY + 20, $accent);
imageline($image, $tileX + 24, $tileY + 38, $tileX + 54, $tileY + 56, $accent);

$brandName = (string) cfg('brand.name');
$tagline   = (string) cfg('brand.tagline');

imagettftext($image, 27, 0, $tileX + $tile + 26, $tileY + 52, $ink, $bold, $brandName);

/** Greedy word wrap against a pixel width. */
function wrap(string $text, string $font, float $size, int $maxWidth): array
{
    $lines = [];
    $line  = '';
    foreach (explode(' ', $text) as $word) {
        $attempt = $line === '' ? $word : $line . ' ' . $word;
        $box     = imagettfbbox($size, 0, $font, $attempt);
        if ($box !== false && ($box[2] - $box[0]) > $maxWidth && $line !== '') {
            $lines[] = $line;
            $line    = $word;
        } else {
            $line = $attempt;
        }
    }
    if ($line !== '') {
        $lines[] = $line;
    }
    return $lines;
}

$y = 292;
foreach (wrap($tagline, $bold, 44, W - 190) as $line) {
    imagettftext($image, 44, 0, 86, $y, $ink, $bold, $line);
    $y += 64;
}

imagettftext($image, 21, 0, 86, $y + 30, $muted, $book,
    'Audited. Built. Documented. Yours to keep.');

// Accent rule along the bottom edge.
imagefilledrectangle($image, 0, H - 8, (int) (W * 0.45), H, $accent);
imagefilledrectangle($image, (int) (W * 0.45), H - 8, (int) (W * 0.62), H, $mint);

$target = __DIR__ . '/../public_html/assets/img/og.png';
imagepng($image, $target, 9);
imagedestroy($image);

printf("Wrote %s (%d bytes)\n", realpath($target) ?: $target, (int) filesize($target));
