/**
 * Grades Guru — Spin Wheel Engine
 * Draws the wheel on a canvas and animates it to the target segment.
 * Called from spin.php with window.SpinWheel config.
 */

(function () {
  'use strict';

  // ── Segment definitions ────────────────────────────────────────────────────
  const SEGMENTS = [
    { label: '10%\nDiscount',               color: '#F4C430', text: '#0A1628' },
    { label: 'Refer 1 Friend\n+10% for Both', color: '#0A1628', text: '#F4C430' },
    { label: 'Refer 2 Friends\n+25% for All', color: '#F4C430', text: '#0A1628' },
    { label: 'Priority\nDelivery',            color: '#10B981', text: '#ffffff' },
    { label: '5%\nDiscount',                  color: '#F4C430', text: '#0A1628' },
    { label: 'Try\nAgain',                    color: '#6b7280', text: '#ffffff' },
    { label: 'Exclusive Offer\nContact Admin', color: '#7C3AED', text: '#ffffff' },
    { label: '10%\nDiscount',               color: '#F4C430', text: '#0A1628' },
  ];

  const NUM    = SEGMENTS.length;
  const SLICE  = (2 * Math.PI) / NUM;

  let canvas, ctx, W, CX, CY, R;
  let currentAngle  = 0;   // radians, cumulative rotation
  let isSpinning    = false;

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    W   = canvas.width;
    CX  = W / 2;
    CY  = W / 2;
    R   = W / 2 - 8;
    drawWheel(currentAngle);
  }

  // ── Drawing ────────────────────────────────────────────────────────────────
  function drawWheel(angleOffset) {
    ctx.clearRect(0, 0, W, W);
    drawShadow();
    drawSlices(angleOffset);
    drawInnerRing();
    drawCenter();
  }

  function drawShadow() {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur  = 24;
    ctx.beginPath();
    ctx.arc(CX, CY, R + 2, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fill();
    ctx.restore();
  }

  function drawSlices(angleOffset) {
    for (let i = 0; i < NUM; i++) {
      const start = angleOffset + i * SLICE;
      const end   = start + SLICE;
      const seg   = SEGMENTS[i];

      // Slice background
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.arc(CX, CY, R, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      // Slice border
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(start + SLICE / 2);
      ctx.textAlign    = 'right';
      ctx.fillStyle    = seg.text;
      ctx.font         = `700 ${Math.round(W * 0.033)}px 'DM Sans', sans-serif`;

      const lines = seg.label.split('\n');
      const lineH = Math.round(W * 0.038);
      const tx    = R - 18;
      const ty    = -((lines.length - 1) * lineH) / 2;

      lines.forEach((line, li) => {
        ctx.fillText(line, tx, ty + li * lineH + 4);
      });
      ctx.restore();
    }
  }

  function drawInnerRing() {
    ctx.beginPath();
    ctx.arc(CX, CY, R + 3, 0, 2 * Math.PI);
    ctx.strokeStyle = '#F4C430';
    ctx.lineWidth   = 5;
    ctx.stroke();

    // Outer decorative dots
    for (let i = 0; i < NUM; i++) {
      const a = (2 * Math.PI / NUM) * i + currentAngle;
      const dx = CX + (R + 7) * Math.cos(a);
      const dy = CY + (R + 7) * Math.sin(a);
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#F4C430';
      ctx.fill();
    }
  }

  function drawCenter() {
    // Outer hub
    ctx.beginPath();
    ctx.arc(CX, CY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#0A1628';
    ctx.fill();
    ctx.strokeStyle = '#F4C430';
    ctx.lineWidth   = 3;
    ctx.stroke();

    // Inner hub
    ctx.beginPath();
    ctx.arc(CX, CY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#F4C430';
    ctx.fill();
  }

  // ── Animation ──────────────────────────────────────────────────────────────
  /**
   * Spin to segmentIndex (0-based).
   * @param {number} segmentIndex
   * @param {Function} onComplete  Called when animation ends.
   */
  function spinTo(segmentIndex, onComplete) {
    if (isSpinning) return;
    isSpinning = true;

    // Target: pointer is at the top (−π/2).
    // Segment i occupies [i*SLICE, (i+1)*SLICE] offset from 0.
    // We want the center of segment i to be at −π/2.
    // segmentCenter (without rotation) = i * SLICE + SLICE/2
    // We need: currentAngle + extra = −π/2 − segmentCenter  (mod 2π)
    const segmentCenter = segmentIndex * SLICE + SLICE / 2;
    const target = -Math.PI / 2 - segmentCenter;

    // Normalise target relative to currentAngle
    let delta = target - currentAngle;
    // Force at least 5 full rotations for drama
    const fullSpins = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
    // Make delta positive
    delta = ((delta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const totalDelta = fullSpins + delta;

    const duration  = 5000 + Math.random() * 1500; // 5–6.5s
    const startTime = performance.now();
    const startAngle = currentAngle;

    function easeOut(t) {
      // Cubic ease-out
      return 1 - Math.pow(1 - t, 3);
    }

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      currentAngle = startAngle + totalDelta * easeOut(t);
      drawWheel(currentAngle);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        isSpinning = false;
        if (typeof onComplete === 'function') onComplete();
      }
    }

    requestAnimationFrame(step);
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  window.SpinWheel = {
    init,
    spinTo,
    get isSpinning() { return isSpinning; },
  };

}());
