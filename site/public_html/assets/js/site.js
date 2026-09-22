/* =============================================================================
   Kairo — site behaviour
   Progressive enhancement only: every form works with JavaScript disabled.
   ============================================================================= */
(function () {
  'use strict';

  document.body.classList.remove('no-js');

  /* ── Sticky header shadow ───────────────────────────────────────────────── */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () {
      header.toggleAttribute('data-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Mobile navigation ──────────────────────────────────────────────────── */
  var navToggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');

  if (navToggle && nav) {
    var setNav = function (open) {
      navToggle.setAttribute('aria-expanded', String(open));
      nav.toggleAttribute('data-open', open);
    };

    navToggle.addEventListener('click', function () {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        navToggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (navToggle.getAttribute('aria-expanded') !== 'true') return;
      if (nav.contains(event.target) || navToggle.contains(event.target)) return;
      setNav(false);
    });
  }

  /* ── Async forms (newsletter) ───────────────────────────────────────────── */
  document.querySelectorAll('[data-ajax-form]').forEach(function (form) {
    var status = form.querySelector('[data-form-status]');
    var submit = form.querySelector('[type="submit"]');

    var say = function (message, state) {
      if (!status) return;
      status.textContent = message;
      status.setAttribute('data-state', state);
    };

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submit) submit.disabled = true;
      say('Sending…', 'pending');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.ok) {
            say(result.data.message || 'Done.', 'success');
            form.reset();
          } else {
            say(result.data.message || 'That did not go through. Try again?', 'error');
          }
        })
        .catch(function () {
          say('Network error — check your connection and try again.', 'error');
        })
        .finally(function () {
          if (submit) submit.disabled = false;
        });
    });
  });

  /* ── ROI calculator ─────────────────────────────────────────────────────── */
  var calc = document.querySelector('[data-calc]');
  if (calc) {
    var WEEKS_PER_YEAR = 46;      // allowing for holiday and downtime
    var AUTOMATABLE = 0.6;        // share of listed manual time we target
    var HOURS_PER_DAY = 8;

    var money = new Intl.NumberFormat('en-GB', {
      style: 'currency', currency: 'GBP', maximumFractionDigits: 0
    });
    var number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

    var inputs = calc.querySelectorAll('[data-calc-input]');

    var update = function () {
      var values = {};
      inputs.forEach(function (input) {
        values[input.name] = Number(input.value) || 0;
        var readout = calc.querySelector('[data-calc-readout="' + input.name + '"]');
        if (readout) {
          readout.textContent = input.dataset.prefix
            ? input.dataset.prefix + number.format(values[input.name])
            : number.format(values[input.name]);
        }
      });

      var hours = values.people * values.hours * WEEKS_PER_YEAR * AUTOMATABLE;
      var saved = hours * values.rate;

      var out = {
        hours: number.format(Math.round(hours)) + ' hrs',
        money: money.format(Math.round(saved)),
        days: number.format(Math.round(hours / HOURS_PER_DAY)) + ' days'
      };

      Object.keys(out).forEach(function (key) {
        var node = calc.querySelector('[data-calc-out="' + key + '"]');
        if (node) node.textContent = out[key];
      });
    };

    inputs.forEach(function (input) {
      input.addEventListener('input', update);
    });
    update();
  }

  /* ── Multi-step audit form ──────────────────────────────────────────────── */
  var wizard = document.querySelector('[data-wizard]');
  if (wizard) {
    var steps = Array.prototype.slice.call(wizard.querySelectorAll('[data-step]'));
    var bar = wizard.querySelector('[data-wizard-bar]');
    var label = wizard.querySelector('[data-wizard-label]');
    var backBtn = wizard.querySelector('[data-wizard-back]');
    var nextBtn = wizard.querySelector('[data-wizard-next]');
    var submitBtn = wizard.querySelector('[data-wizard-submit]');
    var index = 0;

    var render = function () {
      steps.forEach(function (step, i) {
        step.toggleAttribute('data-active', i === index);
      });

      var progress = ((index + 1) / steps.length) * 100;
      if (bar) bar.style.setProperty('--progress', progress + '%');
      if (label) label.textContent = 'Step ' + (index + 1) + ' of ' + steps.length;

      if (backBtn) backBtn.hidden = index === 0;
      if (nextBtn) nextBtn.hidden = index === steps.length - 1;
      if (submitBtn) submitBtn.hidden = index !== steps.length - 1;
    };

    /* Let the browser do the validating — same rules the server enforces. */
    var stepIsValid = function () {
      var fields = steps[index].querySelectorAll('input, select, textarea');
      for (var i = 0; i < fields.length; i++) {
        if (!fields[i].checkValidity()) {
          fields[i].reportValidity();
          return false;
        }
      }
      var group = steps[index].querySelector('[data-require-one]');
      if (group) {
        var checked = group.querySelectorAll('input[type="checkbox"]:checked').length;
        var hint = group.querySelector('[data-require-one-error]');
        if (checked === 0) {
          if (hint) hint.hidden = false;
          return false;
        }
        if (hint) hint.hidden = true;
      }
      return true;
    };

    var go = function (next) {
      if (next > index && !stepIsValid()) return;
      index = Math.min(Math.max(next, 0), steps.length - 1);
      render();
      var heading = steps[index].querySelector('h2, h3');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (nextBtn) nextBtn.addEventListener('click', function () { go(index + 1); });
    if (backBtn) backBtn.addEventListener('click', function () { go(index - 1); });

    /* Enter should advance a step, not submit from step one. */
    wizard.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      if (event.target.tagName === 'TEXTAREA') return;
      if (index < steps.length - 1) {
        event.preventDefault();
        go(index + 1);
      }
    });

    render();
  }
})();
