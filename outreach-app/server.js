require('dotenv').config();
const express  = require('express');
const multer   = require('multer');
const { parse } = require('csv-parse/sync');
const path     = require('path');
const db       = require('./db');
const { sendEmail, testConnection } = require('./mailer');

db.init();

const app    = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── STATS ────────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  res.json(db.getStats());
});

// ── SETTINGS ─────────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const s = db.getSettings();
  delete s.smtp_pass; // never send password to frontend in plain text
  res.json(s);
});

app.post('/api/settings', (req, res) => {
  const allowed = ['smtp_host','smtp_port','smtp_user','smtp_pass','from_name','from_email','daily_limit'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) db.setSetting(key, req.body[key]);
  }
  res.json({ ok: true });
});

app.post('/api/settings/test', async (req, res) => {
  try {
    await testConnection(req.body);
    res.json({ ok: true, message: 'Connection successful — test email sent to ' + req.body.smtp_user });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ── SEQUENCES ─────────────────────────────────────────────────────────────────
app.get('/api/sequences', (req, res) => {
  res.json(db.getSequences());
});

app.put('/api/sequences/:id/steps', (req, res) => {
  const { steps } = req.body;
  if (!Array.isArray(steps)) return res.status(400).json({ error: 'steps must be array' });
  db.updateSequenceSteps(req.params.id, steps);
  res.json({ ok: true });
});

// ── PROSPECTS ─────────────────────────────────────────────────────────────────
app.get('/api/prospects', (req, res) => {
  const { status, niche } = req.query;
  res.json(db.getProspects({ status, niche }));
});

app.put('/api/prospects/:id', (req, res) => {
  db.updateProspect(req.params.id, req.body);
  res.json({ ok: true });
});

app.delete('/api/prospects/:id', (req, res) => {
  db.deleteProspect(req.params.id);
  res.json({ ok: true });
});

app.post('/api/prospects/import', upload.single('csv'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

  const sequenceId = req.body.sequence_id ? parseInt(req.body.sequence_id, 10) : null;
  const defaultNiche = req.body.niche || null;

  let records;
  try {
    records = parse(req.file.buffer.toString('utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err) {
    return res.status(400).json({ error: 'Could not parse CSV: ' + err.message });
  }

  let imported = 0;
  let skipped  = 0;
  const errors = [];

  for (const row of records) {
    const norm = {};
    for (const k of Object.keys(row)) {
      norm[k.toLowerCase().trim()] = row[k];
    }

    const email = norm.email || norm['e-mail'];
    if (!email || !email.includes('@')) { skipped++; continue; }

    let firstName = norm.first_name || norm.firstname || '';
    let lastName  = norm.last_name  || norm.lastname  || '';
    if (!firstName && norm.name) {
      const parts = norm.name.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName  = parts.slice(1).join(' ') || '';
    }

    const company = norm.company || norm.business || norm['company name'] || '';
    const niche   = norm.niche   || defaultNiche || 'general';

    try {
      const result = db.insertProspect({ first_name: firstName, last_name: lastName, email, company, niche, sequence_id: sequenceId });
      if (result.changes > 0) imported++;
      else skipped++;
    } catch (e) {
      errors.push(email + ': ' + e.message);
    }
  }

  res.json({ ok: true, imported, skipped, errors });
});

// ── QUEUE ─────────────────────────────────────────────────────────────────────
app.get('/api/queue', (req, res) => {
  res.json(db.getQueueWithStep());
});

app.post('/api/queue/send/:prospectId', async (req, res) => {
  const daily = parseInt(db.getSetting('daily_limit') || '25', 10);
  const sentToday = db.getSentTodayCount();
  if (sentToday >= daily) {
    return res.status(429).json({ error: `Daily limit of ${daily} emails reached. Come back tomorrow.` });
  }

  const prospect = db.getProspectById(req.params.prospectId);
  if (!prospect) return res.status(404).json({ error: 'Prospect not found' });
  if (prospect.status !== 'active') {
    return res.status(400).json({ error: 'Prospect is not active (' + prospect.status + ')' });
  }

  const seq = db.getSequenceById(prospect.sequence_id);
  if (!seq) return res.status(400).json({ error: 'No sequence assigned to this prospect' });

  const nextStepNum = prospect.current_step + 1;
  const step = seq.steps.find(s => s.step_number === nextStepNum);
  if (!step) {
    db.updateProspect(prospect.id, { status: 'completed' });
    return res.status(400).json({ error: 'No more steps in sequence — prospect marked completed' });
  }

  try {
    const { resolvedSubject, resolvedBody } = await sendEmail({
      prospect,
      subject: step.subject,
      body:    step.body
    });

    db.logSentEmail(prospect.id, step.step_number, resolvedSubject, resolvedBody, 'sent');

    const nextStep = seq.steps.find(s => s.step_number === nextStepNum + 1);
    const updates  = {
      current_step: nextStepNum,
      last_sent_at: new Date().toISOString()
    };
    if (nextStep) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + nextStep.delay_days - step.delay_days);
      // simpler: always set next_send_at = now + (nextStep.delay_days - step.delay_days) days
      const sendAt = new Date();
      sendAt.setDate(sendAt.getDate() + (nextStep.delay_days - step.delay_days));
      updates.next_send_at = sendAt.toISOString();
    } else {
      updates.status = 'completed';
    }
    db.updateProspect(prospect.id, updates);

    res.json({ ok: true, step: nextStepNum, subject: resolvedSubject });
  } catch (err) {
    db.logSentEmail(prospect.id, step.step_number, step.subject, step.body, 'error');
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/queue/send-all', async (req, res) => {
  const daily     = parseInt(db.getSetting('daily_limit') || '25', 10);
  const sentToday = db.getSentTodayCount();
  const remaining = daily - sentToday;

  if (remaining <= 0) {
    return res.status(429).json({ error: `Daily limit of ${daily} reached.`, sent: 0, remaining: 0 });
  }

  const queue = db.getQueueWithStep();
  const toSend = queue.slice(0, remaining);

  const results = { sent: 0, failed: 0, errors: [] };

  for (const item of toSend) {
    try {
      const { resolvedSubject, resolvedBody } = await sendEmail({
        prospect: item,
        subject:  item.next_subject,
        body:     item.next_body
      });
      db.logSentEmail(item.id, item.next_step_number, resolvedSubject, resolvedBody, 'sent');

      const seq      = db.getSequenceById(item.sequence_id);
      const curStep  = seq.steps.find(s => s.step_number === item.next_step_number);
      const nextStep = seq.steps.find(s => s.step_number === item.next_step_number + 1);
      const updates  = { current_step: item.next_step_number, last_sent_at: new Date().toISOString() };
      if (nextStep) {
        const sendAt = new Date();
        sendAt.setDate(sendAt.getDate() + (nextStep.delay_days - (curStep ? curStep.delay_days : 0)));
        updates.next_send_at = sendAt.toISOString();
      } else {
        updates.status = 'completed';
      }
      db.updateProspect(item.id, updates);
      results.sent++;
    } catch (err) {
      db.logSentEmail(item.id, item.next_step_number, item.next_subject, item.next_body, 'error');
      results.failed++;
      results.errors.push({ email: item.email, error: err.message });
    }
  }

  results.skipped  = Math.max(0, queue.length - toSend.length);
  results.remaining = Math.max(0, remaining - results.sent);
  res.json(results);
});

// ── ACTIVITY ──────────────────────────────────────────────────────────────────
app.get('/api/activity', (req, res) => {
  res.json(db.getRecentActivity(20));
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✓ Outreach app running at http://localhost:${PORT}\n`);
});
