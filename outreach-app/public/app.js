// ── Utilities ────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const opts = { method, headers: {} };
  if (body && !(body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    opts.body = body;
  }
  const res = await fetch(path, opts);
  return res.json();
}

let toastTimer;
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.add('hidden'); }, 4000);
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtNextSend(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  if (d <= now) return '<span style="color:var(--green)">Ready</span>';
  const diff = d - now;
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `in ${days}d`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `in ${hours}h`;
  return `in ${Math.floor(diff / 60000)}m`;
}

function badge(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Tab routing ───────────────────────────────────────────────────────────────

const tabs = ['dashboard','prospects','queue','sequences','settings'];

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    if (tab === 'dashboard')  loadDashboard();
    if (tab === 'prospects')  loadProspects();
    if (tab === 'queue')      loadQueue();
    if (tab === 'sequences')  loadSequences();
    if (tab === 'settings')   loadSettings();
  });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

async function loadDashboard() {
  const stats = await api('GET', '/api/stats');
  document.getElementById('stat-total').textContent     = stats.total;
  document.getElementById('stat-queue').textContent     = stats.inQueue;
  document.getElementById('stat-sent').textContent      = stats.sentToday;
  document.getElementById('stat-replied').textContent   = stats.replied;
  document.getElementById('stat-interested').textContent = stats.interested;
  document.getElementById('stat-completed').textContent = stats.completed;

  const activity = await api('GET', '/api/activity');
  const tbody = document.getElementById('activity-tbody');
  if (!activity.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No emails sent yet</td></tr>';
    return;
  }
  tbody.innerHTML = activity.map(r => `
    <tr>
      <td class="dim">${fmtDate(r.sent_at)}</td>
      <td>${esc(r.first_name)} ${esc(r.last_name)}</td>
      <td class="dim">${esc(r.email)}</td>
      <td>${esc(r.company) || '—'}</td>
      <td>Step ${r.step_number}</td>
      <td>${esc(r.subject)}</td>
      <td>${badge(r.status)}</td>
    </tr>`).join('');
}

document.getElementById('btn-send-all-dash').addEventListener('click', () => {
  switchToQueueAndSendAll();
});

async function switchToQueueAndSendAll() {
  document.querySelector('[data-tab="queue"]').click();
  await new Promise(r => setTimeout(r, 100));
  sendAll();
}

// ── Prospects ─────────────────────────────────────────────────────────────────

let allSequences = [];

async function loadProspects() {
  const status = document.getElementById('filter-status').value;
  const niche  = document.getElementById('filter-niche').value;
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (niche)  params.append('niche', niche);
  const prospects = await api('GET', '/api/prospects?' + params.toString());
  renderProspectsTable(prospects);
}

function renderProspectsTable(prospects) {
  const tbody = document.getElementById('prospects-tbody');
  if (!prospects.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No prospects found. Import a CSV to get started.</td></tr>';
    return;
  }
  tbody.innerHTML = prospects.map(p => `
    <tr data-id="${p.id}">
      <td>${esc(p.first_name)} ${esc(p.last_name)}</td>
      <td class="dim">${esc(p.email)}</td>
      <td>${esc(p.company) || '—'}</td>
      <td>${esc(p.niche) || '—'}</td>
      <td>${esc(p.sequence_name || '—')}</td>
      <td>Step ${p.current_step}</td>
      <td>${badge(p.status)}</td>
      <td>${fmtNextSend(p.next_send_at)}</td>
      <td>
        <div class="action-btns">
          ${p.status !== 'replied'      ? `<button class="btn-sm"    onclick="markProspect(${p.id},'replied')">Replied</button>` : ''}
          ${p.status !== 'interested'   ? `<button class="btn-sm"    onclick="markProspect(${p.id},'interested')">Interested</button>` : ''}
          ${p.status === 'active'       ? `<button class="btn-sm"    onclick="markProspect(${p.id},'unsubscribed')">Unsub</button>` : ''}
          ${p.status !== 'active'       ? `<button class="btn-sm"    onclick="markProspect(${p.id},'active')">Reactivate</button>` : ''}
          <button class="btn-danger" onclick="deleteProspect(${p.id})">Del</button>
        </div>
      </td>
    </tr>`).join('');
}

document.getElementById('btn-filter-apply').addEventListener('click', loadProspects);

window.markProspect = async (id, status) => {
  await api('PUT', '/api/prospects/' + id, { status });
  showToast(`Marked as ${status}`, 'success');
  loadProspects();
  loadDashboard();
};

window.deleteProspect = async (id) => {
  if (!confirm('Delete this prospect and all their email history?')) return;
  await api('DELETE', '/api/prospects/' + id);
  showToast('Prospect deleted', 'info');
  loadProspects();
};

// ── Import Modal ──────────────────────────────────────────────────────────────

document.getElementById('btn-open-import').addEventListener('click', async () => {
  if (!allSequences.length) allSequences = await api('GET', '/api/sequences');
  const sel = document.getElementById('import-sequence');
  sel.innerHTML = '<option value="">— select sequence —</option>' +
    allSequences.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  document.getElementById('import-modal').classList.remove('hidden');
  document.getElementById('import-msg').className = 'msg';
});

['btn-close-import','btn-cancel-import'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    document.getElementById('import-modal').classList.add('hidden');
  });
});

document.getElementById('btn-do-import').addEventListener('click', async () => {
  const file   = document.getElementById('csv-file').files[0];
  const seqId  = document.getElementById('import-sequence').value;
  const niche  = document.getElementById('import-niche').value;
  const msgEl  = document.getElementById('import-msg');

  if (!file) { msgEl.textContent = 'Please select a CSV file.'; msgEl.className = 'msg error'; return; }
  if (!seqId) { msgEl.textContent = 'Please select a sequence.'; msgEl.className = 'msg error'; return; }

  const fd = new FormData();
  fd.append('csv', file);
  fd.append('sequence_id', seqId);
  fd.append('niche', niche);

  document.getElementById('btn-do-import').disabled = true;
  const result = await fetch('/api/prospects/import', { method: 'POST', body: fd }).then(r => r.json());
  document.getElementById('btn-do-import').disabled = false;

  if (result.error) {
    msgEl.textContent = result.error;
    msgEl.className = 'msg error';
  } else {
    msgEl.textContent = `Imported ${result.imported} prospects. Skipped ${result.skipped} duplicates/invalid.`;
    msgEl.className = 'msg success';
    loadProspects();
    setTimeout(() => document.getElementById('import-modal').classList.add('hidden'), 2000);
  }
});

// ── Queue ─────────────────────────────────────────────────────────────────────

async function loadQueue() {
  const [queue, stats] = await Promise.all([
    api('GET', '/api/queue'),
    api('GET', '/api/stats')
  ]);
  const daily   = parseInt(document.getElementById('daily-limit')?.value || '25', 10);
  const settings = await api('GET', '/api/settings');
  const limit   = parseInt(settings.daily_limit || '25', 10);
  const sent    = stats.sentToday;
  const pct     = Math.min(100, Math.round((sent / limit) * 100));

  document.getElementById('daily-progress-text').textContent = `${sent} / ${limit} sent today`;
  document.getElementById('daily-progress-fill').style.width = pct + '%';

  const tbody = document.getElementById('queue-tbody');
  if (!queue.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Queue is empty — all caught up!</td></tr>';
    return;
  }
  tbody.innerHTML = queue.map(p => `
    <tr id="qrow-${p.id}">
      <td>${esc(p.first_name)} ${esc(p.last_name)}</td>
      <td class="dim">${esc(p.email)}</td>
      <td>${esc(p.company) || '—'}</td>
      <td>${esc(p.sequence_name)}</td>
      <td>Step ${p.next_step_number}</td>
      <td>${esc(p.next_subject)}</td>
      <td><button class="btn-sm" onclick="sendOne(${p.id})">Send</button></td>
    </tr>`).join('');
}

window.sendOne = async (id) => {
  const btn = document.querySelector(`#qrow-${id} .btn-sm`);
  if (btn) btn.disabled = true;
  const result = await api('POST', '/api/queue/send/' + id);
  if (result.ok) {
    showToast(`Sent step ${result.step}: ${result.subject}`, 'success');
    document.getElementById('qrow-' + id)?.remove();
    loadDashboard();
    loadQueue();
  } else {
    showToast(result.error || 'Send failed', 'error');
    if (btn) btn.disabled = false;
  }
};

async function sendAll() {
  const btn = document.getElementById('btn-send-all-queue');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  const result = await api('POST', '/api/queue/send-all');
  btn.disabled = false;
  btn.textContent = 'Send All';

  if (result.error && !result.sent) {
    showToast(result.error, 'error');
  } else {
    let msg = `Sent ${result.sent} email${result.sent !== 1 ? 's' : ''}`;
    if (result.failed) msg += `, ${result.failed} failed`;
    if (result.skipped) msg += `, ${result.skipped} skipped (limit)`;
    showToast(msg, result.failed ? 'error' : 'success');
    loadQueue();
    loadDashboard();
  }
}

document.getElementById('btn-send-all-queue').addEventListener('click', sendAll);

// ── Sequences ─────────────────────────────────────────────────────────────────

async function loadSequences() {
  allSequences = await api('GET', '/api/sequences');
  const container = document.getElementById('sequences-list');
  container.innerHTML = allSequences.map(seq => `
    <div class="seq-card" id="seq-card-${seq.id}">
      <div class="seq-card-header" onclick="toggleSeq(${seq.id})">
        <div>
          <h3>${esc(seq.name)}</h3>
          <div class="seq-meta">${esc(seq.description)} &nbsp;·&nbsp; ${seq.steps.length} steps</div>
        </div>
        <span class="dim">▾</span>
      </div>
      <div class="seq-card-body" id="seq-body-${seq.id}">
        <p class="token-hint">Tokens: <code>{first_name}</code> <code>{last_name}</code> <code>{company}</code> <code>{niche}</code></p>
        ${seq.steps.map(step => `
          <div class="step-editor">
            <div class="step-editor-header">
              <span class="step-day-badge">Day ${step.delay_days}</span>
              <span class="dim">Step ${step.step_number}</span>
            </div>
            <label style="font-size:12px;color:var(--text-dim);margin-bottom:4px;display:block">Subject</label>
            <input type="text"
              id="subj-${seq.id}-${step.step_number}"
              value="${esc(step.subject)}"
              placeholder="Subject line" />
            <label style="font-size:12px;color:var(--text-dim);margin-bottom:4px;display:block">Body</label>
            <textarea
              id="body-${seq.id}-${step.step_number}"
              rows="8"
              placeholder="Email body">${esc(step.body)}</textarea>
          </div>`).join('')}
        <div class="seq-save-row">
          <button class="btn-primary" onclick="saveSeq(${seq.id}, ${seq.steps.length})">Save Changes</button>
        </div>
      </div>
    </div>`).join('');
}

window.toggleSeq = (id) => {
  const body = document.getElementById('seq-body-' + id);
  body.classList.toggle('open');
};

window.saveSeq = async (seqId, stepCount) => {
  const steps = [];
  for (let i = 1; i <= stepCount; i++) {
    steps.push({
      step_number: i,
      subject: document.getElementById(`subj-${seqId}-${i}`)?.value || '',
      body:    document.getElementById(`body-${seqId}-${i}`)?.value || ''
    });
  }
  const result = await api('PUT', `/api/sequences/${seqId}/steps`, { steps });
  if (result.ok) showToast('Sequence saved', 'success');
  else showToast('Save failed', 'error');
};

// ── Settings ──────────────────────────────────────────────────────────────────

async function loadSettings() {
  const s = await api('GET', '/api/settings');
  document.getElementById('smtp-host').value  = s.smtp_host  || 'smtp.hostinger.com';
  document.getElementById('smtp-port').value  = s.smtp_port  || '465';
  document.getElementById('smtp-user').value  = s.smtp_user  || '';
  document.getElementById('smtp-pass').value  = '';
  document.getElementById('from-name').value  = s.from_name  || '';
  document.getElementById('from-email').value = s.from_email || '';
  document.getElementById('daily-limit').value = s.daily_limit || '25';
}

document.getElementById('btn-save-settings').addEventListener('click', async () => {
  const body = {
    smtp_host:   document.getElementById('smtp-host').value.trim(),
    smtp_port:   document.getElementById('smtp-port').value.trim(),
    smtp_user:   document.getElementById('smtp-user').value.trim(),
    from_name:   document.getElementById('from-name').value.trim(),
    from_email:  document.getElementById('from-email').value.trim(),
    daily_limit: document.getElementById('daily-limit').value.trim()
  };
  const pass = document.getElementById('smtp-pass').value;
  if (pass) body.smtp_pass = pass;

  const result = await api('POST', '/api/settings', body);
  const msg = document.getElementById('settings-msg');
  if (result.ok) {
    msg.textContent = 'Settings saved.';
    msg.className = 'msg success';
  } else {
    msg.textContent = result.error || 'Failed to save.';
    msg.className = 'msg error';
  }
  setTimeout(() => { msg.className = 'msg'; }, 3000);
});

document.getElementById('btn-test-smtp').addEventListener('click', async () => {
  const btn = document.getElementById('btn-test-smtp');
  btn.disabled = true;
  btn.textContent = 'Testing…';
  const body = {
    smtp_host:  document.getElementById('smtp-host').value.trim(),
    smtp_port:  document.getElementById('smtp-port').value.trim(),
    smtp_user:  document.getElementById('smtp-user').value.trim(),
    smtp_pass:  document.getElementById('smtp-pass').value,
    from_name:  document.getElementById('from-name').value.trim(),
    from_email: document.getElementById('from-email').value.trim()
  };
  const result = await api('POST', '/api/settings/test', body);
  const msg = document.getElementById('settings-msg');
  if (result.ok) {
    msg.textContent = result.message;
    msg.className = 'msg success';
  } else {
    msg.textContent = result.error;
    msg.className = 'msg error';
  }
  btn.disabled = false;
  btn.textContent = 'Test Connection';
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadDashboard();
