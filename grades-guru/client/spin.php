<?php
/**
 * Grades Guru — Client Spin Wheel Page
 */
declare(strict_types=1);
require_once '../config.php';
require_once '../includes/db.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

requireLogin();
requireRole('client');
$user = getCurrentUser();
$pdo  = getPDO();
$uid  = (int)$user['id'];

// Fresh DB data
$stmt = $pdo->prepare('SELECT spin_used, last_spin_date, name FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$uid]);
$dbUser = $stmt->fetch();

$spinUsed      = (int)$dbUser['spin_used'];
$lastSpinDate  = $dbUser['last_spin_date'];
$firstOfMonth  = date('Y-m-01');
$monthlyEnabled= (getSetting($pdo, 'monthly_spin_enabled') === '1');
$spinEnabled   = (getSetting($pdo, 'spin_enabled') === '1');

$canSpin   = false;
$spinType  = '';
$noSpinMsg = '';

if (!$spinEnabled) {
    $noSpinMsg = 'The spin wheel is currently disabled.';
} elseif ($spinUsed === 0) {
    $canSpin  = true;
    $spinType = 'signup';
} elseif ($monthlyEnabled && ($lastSpinDate === null || $lastSpinDate < $firstOfMonth)) {
    $canSpin  = true;
    $spinType = 'monthly';
} else {
    $nextMonth = date('F 1, Y', strtotime('first day of next month'));
    $noSpinMsg = "Your next spin is available on <strong>{$nextMonth}</strong>.";
}

$csrfToken = getCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spin the Wheel — <?= APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/spin-wheel.css">
</head>
<body>

<?php if (!$canSpin): ?>
<!-- ── No spin available ── -->
<div class="spin-page">
  <a href="dashboard.php" class="spin-logo">
    <div class="spin-logo-icon">GG</div>
    <span class="spin-logo-text"><?= APP_NAME ?></span>
  </a>

  <div class="no-spin-card">
    <div class="no-spin-icon"><i class="fa-solid fa-lock"></i></div>
    <h2 class="no-spin-title">Spin Not Available</h2>
    <p class="no-spin-desc"><?= $noSpinMsg ?></p>

    <?php if ($spinType === '' && $spinEnabled): ?>
    <div class="no-spin-date">
      <i class="fa-regular fa-calendar"></i>
      Come back next month for another spin!
    </div>
    <?php endif; ?>

    <a href="dashboard.php" class="no-spin-back">
      <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
    </a>
  </div>
</div>

<?php else: ?>
<!-- ── Spin wheel ── -->
<div class="spin-page">

  <div class="spin-header">
    <a href="dashboard.php" class="spin-logo">
      <div class="spin-logo-icon">GG</div>
      <span class="spin-logo-text"><?= APP_NAME ?></span>
    </a>

    <h1 class="spin-heading">
      <span>Spin</span> &amp; Win!
    </h1>
    <p class="spin-subtitle">
      <?= $spinType === 'signup' ? 'Welcome aboard! Spin your welcome wheel to claim a reward.' : 'Your monthly spin is ready — give it a whirl!' ?>
    </p>
  </div>

  <div class="wheel-container">

    <!-- Pointer -->
    <div class="wheel-pointer"></div>

    <!-- Wheel + button -->
    <div class="wheel-wrap">
      <canvas id="spinCanvas" width="460" height="460"></canvas>
      <div class="spin-btn-wrap">
        <button class="spin-btn" id="spinBtn" type="button">SPIN</button>
      </div>
    </div>

    <!-- Legend -->
    <div class="wheel-legend">
      <div class="legend-item"><span class="legend-dot" style="background:#F4C430"></span>10% Discount</div>
      <div class="legend-item"><span class="legend-dot" style="background:#0A1628"></span>Refer 1 Friend</div>
      <div class="legend-item"><span class="legend-dot" style="background:#F4C430"></span>Refer 2 Friends</div>
      <div class="legend-item"><span class="legend-dot" style="background:#10B981"></span>Priority Delivery</div>
      <div class="legend-item"><span class="legend-dot" style="background:#F4C430"></span>5% Discount</div>
      <div class="legend-item"><span class="legend-dot" style="background:#6b7280"></span>Try Again</div>
      <div class="legend-item"><span class="legend-dot" style="background:#7C3AED"></span>Exclusive Offer</div>
      <div class="legend-item"><span class="legend-dot" style="background:#F4C430"></span>10% Discount</div>
    </div>

  </div><!-- /.wheel-container -->
</div><!-- /.spin-page -->

<!-- ── Result modal ── -->
<div class="result-overlay" id="resultOverlay">
  <div class="result-modal">
    <span class="result-emoji" id="resultEmoji">🎉</span>
    <h2 class="result-title">You Won!</h2>
    <div class="result-prize" id="resultPrize">Loading…</div>
    <p class="result-desc" id="resultDesc"></p>
    <a href="dashboard.php" class="result-btn" id="resultBtn">
      <i class="fa-solid fa-house"></i> Go to Dashboard
    </a>
  </div>
</div>

<script>
const CSRF_TOKEN = <?= json_encode($csrfToken) ?>;
const SPIN_TYPE  = <?= json_encode($spinType) ?>;
const API_URL    = '<?= APP_URL ?>/api/spin.php';
</script>
<script src="../assets/js/spin-wheel.js"></script>
<script>
// Boot the wheel
SpinWheel.init('spinCanvas');

document.getElementById('spinBtn').addEventListener('click', function () {
  const btn = this;
  btn.disabled = true;
  btn.textContent = '…';

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'csrf_token=' + encodeURIComponent(CSRF_TOKEN) + '&spin_type=' + SPIN_TYPE,
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) {
      alert(data.message || 'Error. Please refresh and try again.');
      btn.disabled = false;
      btn.textContent = 'SPIN';
      return;
    }
    SpinWheel.spinTo(data.segment_index, function () {
      showResult(data);
    });
  })
  .catch(() => {
    alert('Network error. Please try again.');
    btn.disabled = false;
    btn.textContent = 'SPIN';
  });
});

function showResult(data) {
  document.getElementById('resultEmoji').textContent  = data.emoji || '🎉';
  document.getElementById('resultPrize').textContent  = data.result;

  let desc = '';
  if (data.discount_value > 0) {
    desc = `Your ${data.discount_value}% discount is now saved on your account and will be applied to your next order automatically.`;
  } else if (data.type === 'priority') {
    desc = 'Request priority delivery on your next order and we\'ll fast-track it for you!';
  } else if (data.type === 'exclusive') {
    desc = 'Contact admin via WhatsApp to claim your exclusive offer!';
  } else if (data.type === 'try_again') {
    desc = 'Better luck next time! Your monthly spin will refresh at the start of next month.';
    document.getElementById('resultTitle') && (document.querySelector('.result-title').textContent = 'Try Again!');
  } else {
    desc = 'Enjoy your reward!';
  }
  document.getElementById('resultDesc').textContent = desc;

  // Confetti
  if (data.type !== 'try_again') spawnConfetti();

  document.getElementById('resultOverlay').classList.add('show');
}

function spawnConfetti() {
  const colors = ['#F4C430','#0A1628','#10B981','#7C3AED','#EF4444','#ffffff'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `
        left:${Math.random()*100}%;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        animation-delay:${Math.random()*0.8}s;
        animation-duration:${2.5 + Math.random()*1.5}s;
        transform:rotate(${Math.random()*360}deg);
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }, i * 30);
  }
}
</script>
<?php endif; ?>
</body>
</html>
