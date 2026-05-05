const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'outreach.json');
let _data = null;

// ── Core I/O ─────────────────────────────────────────────────────────────────

function load() {
  if (_data) return _data;
  if (fs.existsSync(DATA_FILE)) {
    try { _data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch(e) { _data = null; }
  }
  if (!_data) {
    _data = {
      settings:       {},
      sequences:      [],
      sequence_steps: [],
      prospects:      [],
      sent_emails:      [],
      warmup_accounts:  [],
      warmup_logs:      [],
      senders:          [],
      _ids:             { sequences: 0, sequence_steps: 0, prospects: 0, sent_emails: 0, warmup_accounts: 0, warmup_logs: 0, senders: 0 }
    };
  }
  return _data;
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(load(), null, 2));
}

function nextId(table) {
  const d = load();
  d._ids[table] = (d._ids[table] || 0) + 1;
  return d._ids[table];
}

function nowIso() { return new Date().toISOString(); }

// ── Init / Seed ───────────────────────────────────────────────────────────────

function init() {
  const d = load();
  if (d.sequences.length === 0) { seedSequences(); save(); }
}

function addSeq(name, niche, description) {
  const d = load();
  const id = nextId('sequences');
  d.sequences.push({ id, name, niche, description });
  return id;
}

function addStep(sequence_id, step_number, delay_days, subject, body) {
  const d = load();
  const id = nextId('sequence_steps');
  d.sequence_steps.push({ id, sequence_id, step_number, delay_days, subject, body });
}

function seedSequences() {
  // ── MEDSPA ──────────────────────────────────────────────────────────────────
  const msId = addSeq('Medspa Outreach', 'medspa', 'For medical spas, aesthetics clinics, and beauty practices');

  addStep(msId, 1, 0, 'quick question, {first_name}',
`Hi {first_name},

Noticed {company} — most medspas I talk to are losing 30-40% of their leads just from slow follow-up. A potential client fills out a form, waits 2 days for a reply, and books somewhere else.

We automate your entire inquiry-to-appointment flow — instant responses, follow-up sequences, and booking reminders — so your staff focuses on clients, not chasing leads.

Worth 15 minutes to see if it makes sense for {company}?

[Your name]`);

  addStep(msId, 2, 3, '{company} — appointment follow-up',
`Hi {first_name},

Just following up on my last note.

One medspa client we worked with was losing roughly $6,000/month in leads that never got properly followed up. After automating their inquiry response and booking sequence, they recovered most of that within 5 weeks — without hiring anyone new.

Happy to share exactly what we built if that's relevant to {company}.

[Your name]`);

  addStep(msId, 3, 7, 'the 2-minute rule for medspa leads',
`Hi {first_name},

Quick insight: leads that get a response within 2 minutes are 21x more likely to book than those that wait an hour.

Most medspas respond manually — meaning leads go cold overnight and on weekends. We build automations that respond instantly, 24/7, and guide prospects through to a booked consultation automatically.

Would that be useful for {company}?

[Your name]`);

  addStep(msId, 4, 12, 'case study — 23% more appointments',
`Hi {first_name},

Thought this might be worth sharing: a medspa we worked with increased booked appointments by 23% in the first month just by automating three things — inquiry response, appointment reminders, and no-show follow-up.

No new ads. No new staff. Same leads, better conversion.

Is that the kind of problem you're working on at {company}?

[Your name]`);

  addStep(msId, 5, 21, 'last note — {company}',
`Hi {first_name},

I've reached out a few times without hearing back — going to assume the timing isn't right.

I'll close your file for now. If automating your appointment booking and lead follow-up ever becomes a priority, feel free to reach back out.

Best of luck with {company}.

[Your name]`);

  // ── SOLAR ────────────────────────────────────────────────────────────────────
  const solId = addSeq('Solar Outreach', 'solar', 'For solar installation companies and energy consultants');

  addStep(solId, 1, 0, 'quick question, {first_name}',
`Hi {first_name},

Most solar companies I talk to are spending 15+ hours/week manually following up with quote requests and scheduling site visits — and losing a third of those leads to slower response times.

We automate the flow from inquiry to confirmed site visit, so your team only talks to homeowners who are ready to move forward.

Worth 15 minutes to explore this for {company}?

[Your name]`);

  addStep(solId, 2, 3, '{company} — lead follow-up',
`Hi {first_name},

Following up on my last note.

A solar company we worked with was losing around 20 qualified leads per month just because follow-ups weren't happening fast enough. After automating their inquiry response, quote follow-up, and site visit scheduling — they closed 4 additional deals in the first month.

Happy to walk you through how we did it if relevant to {company}.

[Your name]`);

  addStep(solId, 3, 7, 'how fast does {company} follow up on leads?',
`Hi {first_name},

Speed-to-lead is the single biggest factor in solar sales conversion. Companies that respond within 5 minutes convert 8x more leads than those that wait an hour.

We build automations that respond to every inquiry instantly — qualify the lead, answer FAQs, and book the site visit — without your team lifting a finger.

Would that solve a real problem for {company}?

[Your name]`);

  addStep(solId, 4, 12, 'solar automation case study',
`Hi {first_name},

Thought this might be worth sharing: a solar company we helped was manually following up with 50-60 leads per week. Their close rate was around 12%. After automating lead response and scheduling:

— Response time: instant (was 4 hours average)
— Close rate: 19%
— Hours saved: 12 per week

Worth a quick call to see if something similar makes sense for {company}?

[Your name]`);

  addStep(solId, 5, 21, 'closing your file, {first_name}',
`Hi {first_name},

I've sent a few notes over the past few weeks without hearing back — going to assume the timing isn't right.

Closing your file on my end. If automating your lead follow-up and site visit scheduling ever becomes a priority, feel free to reach out.

Best of luck with {company}.

[Your name]`);

  // ── GENERAL ───────────────────────────────────────────────────────────────────
  const genId = addSeq('General Appointment-Based', 'general', 'For any local business that books appointments (HVAC, legal, dental, etc.)');

  addStep(genId, 1, 0, 'quick question, {first_name}',
`Hi {first_name},

Most appointment-based businesses I work with are losing 25-35% of their leads from slow follow-up and manual scheduling.

We automate the entire flow — from inquiry to confirmed appointment — so your team focuses on clients, not admin work.

Worth 15 minutes to see if this makes sense for {company}?

[Your name]`);

  addStep(genId, 2, 3, '{company} + appointment automation',
`Hi {first_name},

Just following up on my last note.

A client similar to {company} was spending 10+ hours/week on manual follow-up and scheduling. After automating it, they recovered those hours and increased their booking rate by 28%.

Happy to share exactly what we built.

[Your name]`);

  addStep(genId, 3, 7, 'are you losing leads after hours?',
`Hi {first_name},

Most businesses only respond to inquiries during office hours. But 40% of appointment requests come in evenings and weekends.

We build systems that respond instantly, 24/7 — answer questions, qualify leads, and book appointments automatically, without your team lifting a finger.

Would that be valuable for {company}?

[Your name]`);

  addStep(genId, 4, 12, 'what slow follow-up is costing {company}',
`Hi {first_name},

Quick math: if {company} gets 50 leads/month and converts 20% — that's 10 clients. If faster, automated follow-up lifts conversion to 28%, that's 4 more clients per month. At an average client value of even $500, that's $2,000/month in additional revenue from the same leads.

That's what automation delivers for most of our clients. Worth a conversation?

[Your name]`);

  addStep(genId, 5, 21, 'last note — {first_name}',
`Hi {first_name},

I've reached out a few times — going to assume the timing isn't right.

Closing your file for now. If automating your appointment booking or lead follow-up ever becomes a priority, feel free to get back in touch.

Best of luck with {company}.

[Your name]`);
}

// ── Settings ──────────────────────────────────────────────────────────────────

function getSetting(key)        { return load().settings[key] ?? null; }
function setSetting(key, value) { load().settings[key] = value; save(); }
function getSettings()          { return { ...load().settings }; }

// ── Sequences ─────────────────────────────────────────────────────────────────

function getSequences() {
  const d = load();
  return d.sequences.map(s => ({
    ...s,
    steps: d.sequence_steps.filter(st => st.sequence_id === s.id).sort((a,b) => a.step_number - b.step_number)
  }));
}

function getSequenceById(id) {
  const d = load();
  const seq = d.sequences.find(s => s.id === Number(id));
  if (!seq) return null;
  return {
    ...seq,
    steps: d.sequence_steps.filter(st => st.sequence_id === seq.id).sort((a,b) => a.step_number - b.step_number)
  };
}

function updateSequenceSteps(sequenceId, steps) {
  const d = load();
  for (const step of steps) {
    const s = d.sequence_steps.find(st => st.sequence_id === Number(sequenceId) && st.step_number === step.step_number);
    if (s) { s.subject = step.subject; s.body = step.body; }
  }
  save();
}

// ── Prospects ─────────────────────────────────────────────────────────────────

function getProspects(filters = {}) {
  const d = load();
  return d.prospects
    .filter(p => (!filters.status || p.status === filters.status) && (!filters.niche || p.niche === filters.niche))
    .sort((a,b) => b.enrolled_at?.localeCompare(a.enrolled_at || '') || 0);
}

function getProspectById(id) {
  return load().prospects.find(p => p.id === Number(id)) || null;
}

function insertProspect(p) {
  const d = load();
  const exists = d.prospects.find(x => x.email.toLowerCase() === p.email.toLowerCase());
  if (exists) return { changes: 0 };
  const now = nowIso();
  d.prospects.push({
    id:           nextId('prospects'),
    first_name:   p.first_name  || '',
    last_name:    p.last_name   || '',
    email:        p.email,
    company:      p.company     || '',
    niche:        p.niche       || 'general',
    status:       'active',
    sequence_id:  p.sequence_id ? Number(p.sequence_id) : null,
    current_step: 0,
    enrolled_at:  now,
    next_send_at: now,
    last_sent_at: null,
    notes:        ''
  });
  save();
  return { changes: 1 };
}

function updateProspect(id, fields) {
  const d = load();
  const p = d.prospects.find(x => x.id === Number(id));
  if (!p) return;
  const allowed = ['status','current_step','next_send_at','last_sent_at','notes','sequence_id'];
  for (const k of allowed) { if (fields[k] !== undefined) p[k] = fields[k]; }
  save();
}

function deleteProspect(id) {
  const d = load();
  d.sent_emails = d.sent_emails.filter(e => e.prospect_id !== Number(id));
  d.prospects   = d.prospects.filter(p => p.id !== Number(id));
  save();
}

// ── Queue ─────────────────────────────────────────────────────────────────────

function getQueueWithStep() {
  const d    = load();
  const now  = nowIso();
  return d.prospects
    .filter(p => p.status === 'active' && p.next_send_at && p.next_send_at <= now)
    .map(p => {
      const nextStepNum = p.current_step + 1;
      const step = d.sequence_steps.find(s => s.sequence_id === p.sequence_id && s.step_number === nextStepNum);
      if (!step) return null;
      const seq = d.sequences.find(s => s.id === p.sequence_id);
      return { ...p, sequence_name: seq?.name || '', next_subject: step.subject, next_body: step.body, next_step_number: nextStepNum };
    })
    .filter(Boolean)
    .sort((a,b) => a.next_send_at.localeCompare(b.next_send_at));
}

// ── Sent Emails ───────────────────────────────────────────────────────────────

function getSentTodayCount() {
  const today = nowIso().slice(0, 10);
  return load().sent_emails.filter(e => e.sent_at?.startsWith(today) && e.status === 'sent').length;
}

function logSentEmail(prospect_id, step_number, subject, body, status = 'sent', sender_email = '') {
  const d = load();
  d.sent_emails.push({ id: nextId('sent_emails'), prospect_id: Number(prospect_id), step_number, subject, body, sent_at: nowIso(), status, sender_email });
  save();
}

function getRecentActivity(limit = 15) {
  const d = load();
  return d.sent_emails
    .slice(-limit * 3)
    .reverse()
    .slice(0, limit)
    .map(e => {
      const p = d.prospects.find(x => x.id === e.prospect_id) || {};
      return { ...e, first_name: p.first_name || '', last_name: p.last_name || '', email: p.email || '', company: p.company || '' };
    });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function getStats() {
  const d        = load();
  const ps       = d.prospects;
  const total      = ps.length;
  const active     = ps.filter(p => p.status === 'active').length;
  const replied    = ps.filter(p => p.status === 'replied').length;
  const interested = ps.filter(p => p.status === 'interested').length;
  const completed  = ps.filter(p => p.status === 'completed').length;
  const sentToday  = getSentTodayCount();
  const inQueue    = getQueueWithStep().length;
  return { total, active, replied, interested, completed, sentToday, inQueue };
}

// ── Warmup Accounts ───────────────────────────────────────────────────────────

function getWarmupAccounts() {
  return load().warmup_accounts;
}

function getActiveWarmupAccounts() {
  return load().warmup_accounts.filter(a => a.status === 'active');
}

function addWarmupAccount(a) {
  const d = load();
  const exists = d.warmup_accounts.find(x => x.email.toLowerCase() === a.email.toLowerCase());
  if (exists) return null;
  const account = {
    id:        nextId('warmup_accounts'),
    email:     a.email,
    smtp_host: a.smtp_host || 'smtp.hostinger.com',
    smtp_port: a.smtp_port || '465',
    smtp_pass: a.smtp_pass,
    imap_host: a.imap_host || 'imap.hostinger.com',
    imap_port: a.imap_port || '993',
    status:    'active',
    added_at:  nowIso()
  };
  d.warmup_accounts.push(account);
  save();
  return account;
}

function updateWarmupAccount(id, fields) {
  const d = load();
  const a = d.warmup_accounts.find(x => x.id === Number(id));
  if (!a) return;
  const allowed = ['status', 'smtp_pass', 'smtp_host', 'smtp_port', 'imap_host', 'imap_port'];
  for (const k of allowed) { if (fields[k] !== undefined) a[k] = fields[k]; }
  save();
}

function deleteWarmupAccount(id) {
  const d = load();
  d.warmup_accounts = d.warmup_accounts.filter(a => a.id !== Number(id));
  d.warmup_logs     = d.warmup_logs.filter(l => l.from_id !== Number(id) && l.to_id !== Number(id));
  save();
}

function logWarmupSend(from_id, to_id, subject) {
  const d = load();
  d.warmup_logs.push({
    id: nextId('warmup_logs'),
    from_id: Number(from_id),
    to_id:   Number(to_id),
    subject,
    sent_at: nowIso(),
    replied: false
  });
  save();
}

function markWarmupReplied(logId) {
  const d = load();
  const l = d.warmup_logs.find(x => x.id === Number(logId));
  if (l) { l.replied = true; save(); }
}

function getWarmupSentToday(account_id) {
  const today = nowIso().slice(0, 10);
  return load().warmup_logs.filter(l => l.from_id === Number(account_id) && l.sent_at?.startsWith(today)).length;
}

function getWarmupStats() {
  const d     = load();
  const today = nowIso().slice(0, 10);
  const total       = d.warmup_accounts.length;
  const active      = d.warmup_accounts.filter(a => a.status === 'active').length;
  const sentToday   = d.warmup_logs.filter(l => l.sent_at?.startsWith(today)).length;
  const totalSent   = d.warmup_logs.length;
  const totalReplied = d.warmup_logs.filter(l => l.replied).length;
  const recentLogs  = d.warmup_logs.slice(-20).reverse().map(l => {
    const from = d.warmup_accounts.find(a => a.id === l.from_id);
    const to   = d.warmup_accounts.find(a => a.id === l.to_id);
    return { ...l, from_email: from?.email || '', to_email: to?.email || '' };
  });
  return { total, active, sentToday, totalSent, totalReplied, recentLogs };
}

// ── Senders (multi-sender rotation) ──────────────────────────────────────────

function getSenders() {
  return load().senders || [];
}

function getActiveSenders() {
  return (load().senders || []).filter(s => s.status === 'active');
}

function addSender(s) {
  const d = load();
  if (!d.senders) d.senders = [];
  const exists = d.senders.find(x => x.email.toLowerCase() === s.email.toLowerCase());
  if (exists) return null;
  const sender = {
    id:        nextId('senders'),
    email:     s.email,
    from_name: s.from_name || '',
    smtp_host: s.smtp_host || 'smtp.hostinger.com',
    smtp_port: s.smtp_port || '465',
    smtp_pass: s.smtp_pass,
    imap_host: s.imap_host || 'imap.hostinger.com',
    imap_port: s.imap_port || '993',
    status:    'active',
    added_at:  nowIso()
  };
  d.senders.push(sender);
  save();
  return sender;
}

function updateSender(id, fields) {
  const d = load();
  const s = (d.senders || []).find(x => x.id === Number(id));
  if (!s) return;
  const allowed = ['status', 'from_name', 'smtp_pass', 'smtp_host', 'smtp_port', 'imap_host', 'imap_port'];
  for (const k of allowed) { if (fields[k] !== undefined) s[k] = fields[k]; }
  save();
}

function deleteSender(id) {
  const d = load();
  d.senders = (d.senders || []).filter(s => s.id !== Number(id));
  save();
}

// Round-robin: pick the active sender with fewest sends today
function getNextSender() {
  const senders = getActiveSenders();
  if (!senders.length) return null;
  const today = nowIso().slice(0, 10);
  const d = load();
  return senders
    .map(s => ({
      ...s,
      sentToday: d.sent_emails.filter(e => e.sender_email === s.email && e.sent_at?.startsWith(today) && e.status === 'sent').length
    }))
    .sort((a, b) => a.sentToday - b.sentToday)[0];
}

function getSenderStats() {
  const today = nowIso().slice(0, 10);
  const d = load();
  return (d.senders || []).map(s => ({
    ...s,
    sentToday: d.sent_emails.filter(e => e.sender_email === s.email && e.sent_at?.startsWith(today) && e.status === 'sent').length,
    sentTotal: d.sent_emails.filter(e => e.sender_email === s.email && e.status === 'sent').length
  }));
}

module.exports = {
  init,
  getSetting, setSetting, getSettings,
  getSequences, getSequenceById, updateSequenceSteps,
  getProspects, getProspectById, insertProspect, updateProspect, deleteProspect,
  getQueueWithStep,
  getSentTodayCount, logSentEmail, getRecentActivity, getStats,
  getWarmupAccounts, getActiveWarmupAccounts, addWarmupAccount,
  updateWarmupAccount, deleteWarmupAccount,
  logWarmupSend, markWarmupReplied, getWarmupSentToday, getWarmupStats,
  getSenders, getActiveSenders, addSender, updateSender, deleteSender,
  getNextSender, getSenderStats
};
