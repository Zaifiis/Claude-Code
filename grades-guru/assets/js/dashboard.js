/**
 * Grades Guru — Dashboard JS
 * Handles sidebar toggle, notifications, table search, and chart helpers.
 */
(function () {
  'use strict';

  // ── Sidebar toggle ───────────────────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
  }

  // ── Notification dropdown ────────────────────────────────────────────────────
  const notifBtn      = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('open');
      // Mark as read
      fetch('../api/mark-notifications-read.php', { method: 'POST' }).catch(() => {});
      const badge = notifBtn.querySelector('.notif-badge');
      if (badge) badge.remove();
    });
    document.addEventListener('click', (e) => {
      if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('open');
      }
    });
  }

  // ── Flash message auto-dismiss ───────────────────────────────────────────────
  document.querySelectorAll('.flash-msg').forEach(msg => {
    setTimeout(() => {
      msg.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      msg.style.opacity    = '0';
      msg.style.transform  = 'translateY(-8px)';
      setTimeout(() => msg.remove(), 400);
    }, 5000);
  });

  // ── Copy to clipboard ────────────────────────────────────────────────────────
  window.copyText = function (elId, btn) {
    const text = document.getElementById(elId)?.textContent?.trim() || '';
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      btn.style.background = '#10B981';
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2200);
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

  // ── Table search filter ──────────────────────────────────────────────────────
  window.filterTable = function (inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    if (!input || !table) return;
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      table.querySelectorAll('tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  };

  // ── Confirm dialog ───────────────────────────────────────────────────────────
  window.confirmAction = function (msg) {
    return confirm(msg || 'Are you sure?');
  };

  // ── Modal helpers ────────────────────────────────────────────────────────────
  window.openModal = function (id) {
    const m = document.getElementById(id);
    if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  };
  window.closeModal = function (id) {
    const m = document.getElementById(id);
    if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay[style*="flex"]').forEach(m => {
        m.style.display = 'none';
        document.body.style.overflow = '';
      });
    }
  });

  // ── Live pay estimator ───────────────────────────────────────────────────────
  window.estimatePay = function () {
    const words     = parseInt(document.getElementById('word_count')?.value || 0);
    const typeEl    = document.querySelector('input[name="task_type"]:checked');
    const customEl  = document.getElementById('custom_price');
    const outEl     = document.getElementById('estimated_pay');
    if (!outEl) return;

    if (customEl && parseFloat(customEl.value) > 0) {
      outEl.textContent = 'PKR ' + parseFloat(customEl.value).toLocaleString('en-PK');
      return;
    }

    if (!words || !typeEl) { outEl.textContent = '—'; return; }
    const rate = typeEl.value === 'technical' ? 3 : 1.5;
    outEl.textContent = 'PKR ' + (words * rate).toLocaleString('en-PK');
  };

  // ── Auto-refresh notifications ───────────────────────────────────────────────
  (function scheduleNotifRefresh() {
    setInterval(() => {
      const badge = document.querySelector('.notif-badge');
      // Only fetch if no badge (meaning we haven't shown unread yet)
      if (!badge) {
        fetch('../api/notification-count.php').then(r => r.json()).then(d => {
          if (d.count > 0 && notifBtn) {
            const b = document.createElement('span');
            b.className   = 'notif-badge';
            b.textContent = Math.min(d.count, 9);
            notifBtn.appendChild(b);
          }
        }).catch(() => {});
      }
    }, 60000);
  })();

})();
