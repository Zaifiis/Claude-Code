/**
 * Grades Guru — Main JS (public pages)
 */
(function () {
  'use strict';

  // ── Mobile Nav ───────────────────────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', navMenu.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('open');
      }
    });
  }

  // ── Smooth scroll for anchor links ──────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Flash / alert auto-dismiss ───────────────────────────────────────────────
  document.querySelectorAll('.alert, .flash-msg').forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      alert.style.opacity    = '0';
      alert.style.transform  = 'translateY(-8px)';
      setTimeout(() => alert.remove(), 400);
    }, 5000);
  });

  // ── Copy to clipboard ────────────────────────────────────────────────────────
  window.copyToClipboard = function (text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = '&#10003; Copied!';
      btn.style.background = '#10B981';
      setTimeout(() => {
        btn.innerHTML  = orig;
        btn.style.background = '';
      }, 2200);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      Object.assign(ta.style, { position:'fixed', top:'-9999px', opacity:'0' });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  };

  // ── Navbar scroll shadow ─────────────────────────────────────────────────────
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ── Referral code check (signup page) ───────────────────────────────────────
  const refInput = document.getElementById('referral_code');
  if (refInput) {
    let debounceTimer;
    refInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const code = refInput.value.trim().toUpperCase();
      const hint = document.getElementById('refHint');
      if (!hint) return;
      if (code.length < 8) { hint.textContent = ''; return; }
      hint.textContent = 'Checking...';
      hint.style.color = '#6b7280';
      debounceTimer = setTimeout(() => {
        fetch(`/grades-guru/api/referral-check.php?code=${encodeURIComponent(code)}`)
          .then(r => r.json())
          .then(data => {
            if (data.valid) {
              hint.textContent = `✓ Valid code — referred by ${data.name}`;
              hint.style.color = '#10B981';
            } else {
              hint.textContent = '✗ Invalid referral code';
              hint.style.color = '#EF4444';
            }
          })
          .catch(() => { hint.textContent = ''; });
      }, 600);
    });
  }

  // ── Animate elements on scroll ───────────────────────────────────────────────
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in, .slide-up').forEach(el => observer.observe(el));
  }

})();
