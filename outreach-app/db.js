const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'outreach.db'));

function init() {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS sequences (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      niche       TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS sequence_steps (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sequence_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      delay_days  INTEGER NOT NULL DEFAULT 0,
      subject     TEXT NOT NULL,
      body        TEXT NOT NULL,
      FOREIGN KEY (sequence_id) REFERENCES sequences(id)
    );

    CREATE TABLE IF NOT EXISTS prospects (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name   TEXT,
      last_name    TEXT,
      email        TEXT UNIQUE NOT NULL,
      company      TEXT,
      niche        TEXT,
      status       TEXT NOT NULL DEFAULT 'active',
      sequence_id  INTEGER,
      current_step INTEGER NOT NULL DEFAULT 0,
      enrolled_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      next_send_at DATETIME,
      last_sent_at DATETIME,
      notes        TEXT,
      FOREIGN KEY (sequence_id) REFERENCES sequences(id)
    );

    CREATE TABLE IF NOT EXISTS sent_emails (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      prospect_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      subject     TEXT,
      body        TEXT,
      sent_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      status      TEXT NOT NULL DEFAULT 'sent',
      FOREIGN KEY (prospect_id) REFERENCES prospects(id)
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as c FROM sequences').get();
  if (count.c === 0) seedSequences();
}

function seedSequences() {
  const insertSeq = db.prepare(
    'INSERT INTO sequences (name, niche, description) VALUES (?, ?, ?)'
  );
  const insertStep = db.prepare(
    'INSERT INTO sequence_steps (sequence_id, step_number, delay_days, subject, body) VALUES (?, ?, ?, ?, ?)'
  );

  const seed = db.transaction(() => {
    // ── MEDSPA ──────────────────────────────────────────────────────────────
    const medspa = insertSeq.run(
      'Medspa Outreach',
      'medspa',
      'For medical spas, aesthetics clinics, and beauty practices'
    );
    const msId = medspa.lastInsertRowid;

    insertStep.run(msId, 1, 0, 'quick question, {first_name}',
`Hi {first_name},

Noticed {company} — most medspas I talk to are losing 30-40% of their leads just from slow follow-up. A potential client fills out a form, waits 2 days for a reply, and books somewhere else.

We automate your entire inquiry-to-appointment flow — instant responses, follow-up sequences, and booking reminders — so your staff focuses on clients, not chasing leads.

Worth 15 minutes to see if it makes sense for {company}?

[Your name]`);

    insertStep.run(msId, 2, 3, '{company} — appointment follow-up',
`Hi {first_name},

Just following up on my last note.

One medspa client we worked with was losing roughly $6,000/month in leads that never got properly followed up. After automating their inquiry response and booking sequence, they recovered most of that within 5 weeks — without hiring anyone new.

Happy to share exactly what we built if that's relevant to {company}.

[Your name]`);

    insertStep.run(msId, 3, 7, 'the 2-minute rule for medspa leads',
`Hi {first_name},

Quick insight: leads that get a response within 2 minutes are 21x more likely to book than those that wait an hour.

Most medspas respond manually — meaning leads go cold overnight and on weekends. We build automations that respond instantly, 24/7, and guide prospects through to a booked consultation automatically.

Would that be useful for {company}?

[Your name]`);

    insertStep.run(msId, 4, 12, 'case study — 23% more appointments',
`Hi {first_name},

Thought this might be worth sharing: a medspa we worked with increased booked appointments by 23% in the first month just by automating three things — inquiry response, appointment reminders, and no-show follow-up.

No new ads. No new staff. Same leads, better conversion.

Is that the kind of problem you're working on at {company}?

[Your name]`);

    insertStep.run(msId, 5, 21, 'last note — {company}',
`Hi {first_name},

I've reached out a few times without hearing back — going to assume the timing isn't right.

I'll close your file for now. If automating your appointment booking and lead follow-up ever becomes a priority, feel free to reach back out.

Best of luck with {company}.

[Your name]`);

    // ── SOLAR ────────────────────────────────────────────────────────────────
    const solar = insertSeq.run(
      'Solar Outreach',
      'solar',
      'For solar installation companies and energy consultants'
    );
    const solId = solar.lastInsertRowid;

    insertStep.run(solId, 1, 0, 'quick question, {first_name}',
`Hi {first_name},

Most solar companies I talk to are spending 15+ hours/week manually following up with quote requests and scheduling site visits — and losing a third of those leads to slower response times.

We automate the flow from inquiry to confirmed site visit, so your team only talks to homeowners who are ready to move forward.

Worth 15 minutes to explore this for {company}?

[Your name]`);

    insertStep.run(solId, 2, 3, '{company} — lead follow-up',
`Hi {first_name},

Following up on my last note.

A solar company we worked with was losing around 20 qualified leads per month just because follow-ups weren't happening fast enough. After automating their inquiry response, quote follow-up, and site visit scheduling — they closed 4 additional deals in the first month.

Happy to walk you through how we did it if relevant to {company}.

[Your name]`);

    insertStep.run(solId, 3, 7, 'how fast does {company} follow up on leads?',
`Hi {first_name},

Speed-to-lead is the single biggest factor in solar sales conversion. Companies that respond within 5 minutes convert 8x more leads than those that wait an hour.

We build automations that respond to every inquiry instantly — qualify the lead, answer FAQs, and book the site visit — without your team lifting a finger.

Would that solve a real problem for {company}?

[Your name]`);

    insertStep.run(solId, 4, 12, 'solar automation case study',
`Hi {first_name},

Thought this might be worth sharing: a solar company we helped was manually following up with 50-60 leads per week. Their close rate was around 12%. After automating lead response and scheduling:

— Response time: instant (was 4 hours average)
— Close rate: 19%
— Hours saved: 12 per week

Worth a quick call to see if something similar makes sense for {company}?

[Your name]`);

    insertStep.run(solId, 5, 21, 'closing your file, {first_name}',
`Hi {first_name},

I've sent a few notes over the past few weeks without hearing back — going to assume the timing isn't right.

Closing your file on my end. If automating your lead follow-up and site visit scheduling ever becomes a priority, feel free to reach out.

Best of luck with {company}.

[Your name]`);

    // ── GENERAL APPOINTMENT-BASED ────────────────────────────────────────────
    const general = insertSeq.run(
      'General Appointment-Based',
      'general',
      'For any local business that books appointments (HVAC, legal, dental, etc.)'
    );
    const genId = general.lastInsertRowid;

    insertStep.run(genId, 1, 0, 'quick question, {first_name}',
`Hi {first_name},

Most appointment-based businesses I work with are losing 25-35% of their leads from slow follow-up and manual scheduling.

We automate the entire flow — from inquiry to confirmed appointment — so your team focuses on clients, not admin work.

Worth 15 minutes to see if this makes sense for {company}?

[Your name]`);

    insertStep.run(genId, 2, 3, '{company} + appointment automation',
`Hi {first_name},

Just following up on my last note.

A client similar to {company} was spending 10+ hours/week on manual follow-up and scheduling. After automating it, they recovered those hours and increased their booking rate by 28%.

Happy to share exactly what we built.

[Your name]`);

    insertStep.run(genId, 3, 7, 'are you losing leads after hours?',
`Hi {first_name},

Most businesses only respond to inquiries during office hours. But 40% of appointment requests come in evenings and weekends.

We build systems that respond instantly, 24/7 — answer questions, qualify leads, and book appointments automatically, without your team lifting a finger.

Would that be valuable for {company}?

[Your name]`);

    insertStep.run(genId, 4, 12, 'what slow follow-up is costing {company}',
`Hi {first_name},

Quick math: if {company} gets 50 leads/month and converts 20% — that's 10 clients. If faster, automated follow-up lifts conversion to 28%, that's 4 more clients per month. At an average client value of even $500, that's $2,000/month in additional revenue from the same leads.

That's what automation delivers for most of our clients. Worth a conversation?

[Your name]`);

    insertStep.run(genId, 5, 21, 'last note — {first_name}',
`Hi {first_name},

I've reached out a few times — going to assume the timing isn't right.

Closing your file for now. If automating your appointment booking or lead follow-up ever becomes a priority, feel free to get back in touch.

Best of luck with {company}.

[Your name]`);
  });

  seed();
}

// ── Query helpers ────────────────────────────────────────────────────────────

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

function getSequences() {
  const seqs = db.prepare('SELECT * FROM sequences ORDER BY id').all();
  const steps = db.prepare('SELECT * FROM sequence_steps ORDER BY sequence_id, step_number').all();
  return seqs.map(s => ({
    ...s,
    steps: steps.filter(st => st.sequence_id === s.id)
  }));
}

function getSequenceById(id) {
  const seq = db.prepare('SELECT * FROM sequences WHERE id = ?').get(id);
  if (!seq) return null;
  seq.steps = db.prepare('SELECT * FROM sequence_steps WHERE sequence_id = ? ORDER BY step_number').all(id);
  return seq;
}

function updateSequenceSteps(sequenceId, steps) {
  const update = db.prepare(
    'UPDATE sequence_steps SET subject = ?, body = ? WHERE sequence_id = ? AND step_number = ?'
  );
  const tx = db.transaction(() => {
    for (const step of steps) {
      update.run(step.subject, step.body, sequenceId, step.step_number);
    }
  });
  tx();
}

function getProspects(filters = {}) {
  let query = 'SELECT * FROM prospects WHERE 1=1';
  const params = [];
  if (filters.status) { query += ' AND status = ?'; params.push(filters.status); }
  if (filters.niche)  { query += ' AND niche = ?';  params.push(filters.niche);  }
  query += ' ORDER BY enrolled_at DESC';
  return db.prepare(query).all(...params);
}

function getProspectById(id) {
  return db.prepare('SELECT * FROM prospects WHERE id = ?').get(id);
}

function insertProspect(p) {
  return db.prepare(`
    INSERT OR IGNORE INTO prospects
      (first_name, last_name, email, company, niche, sequence_id, enrolled_at, next_send_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(p.first_name, p.last_name, p.email, p.company, p.niche, p.sequence_id);
}

function updateProspect(id, fields) {
  const allowed = ['status', 'current_step', 'next_send_at', 'last_sent_at', 'notes', 'sequence_id'];
  const updates = Object.keys(fields).filter(k => allowed.includes(k));
  if (!updates.length) return;
  const sql = `UPDATE prospects SET ${updates.map(k => k + ' = ?').join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...updates.map(k => fields[k]), id);
}

function deleteProspect(id) {
  db.prepare('DELETE FROM sent_emails WHERE prospect_id = ?').run(id);
  db.prepare('DELETE FROM prospects WHERE id = ?').run(id);
}

function getQueue() {
  return db.prepare(`
    SELECT p.*, s.name as sequence_name
    FROM prospects p
    LEFT JOIN sequences s ON p.sequence_id = s.id
    WHERE p.status = 'active'
      AND p.next_send_at <= datetime('now')
      AND p.current_step < (
        SELECT MAX(step_number) FROM sequence_steps WHERE sequence_id = p.sequence_id
      )
    ORDER BY p.next_send_at ASC
  `).all();
}

function getQueueWithStep() {
  return db.prepare(`
    SELECT p.*, s.name as sequence_name,
      ss.subject as next_subject, ss.body as next_body,
      (p.current_step + 1) as next_step_number
    FROM prospects p
    LEFT JOIN sequences s ON p.sequence_id = s.id
    LEFT JOIN sequence_steps ss
      ON ss.sequence_id = p.sequence_id AND ss.step_number = (p.current_step + 1)
    WHERE p.status = 'active'
      AND p.next_send_at <= datetime('now')
      AND ss.id IS NOT NULL
    ORDER BY p.next_send_at ASC
  `).all();
}

function getSentTodayCount() {
  return db.prepare(`
    SELECT COUNT(*) as c FROM sent_emails
    WHERE DATE(sent_at) = DATE('now') AND status = 'sent'
  `).get().c;
}

function logSentEmail(prospectId, stepNumber, subject, body, status = 'sent') {
  db.prepare(`
    INSERT INTO sent_emails (prospect_id, step_number, subject, body, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(prospectId, stepNumber, subject, body, status);
}

function getRecentActivity(limit = 15) {
  return db.prepare(`
    SELECT se.*, p.first_name, p.last_name, p.email, p.company
    FROM sent_emails se
    JOIN prospects p ON p.id = se.prospect_id
    ORDER BY se.sent_at DESC
    LIMIT ?
  `).all(limit);
}

function getStats() {
  const total      = db.prepare("SELECT COUNT(*) as c FROM prospects").get().c;
  const active     = db.prepare("SELECT COUNT(*) as c FROM prospects WHERE status='active'").get().c;
  const replied    = db.prepare("SELECT COUNT(*) as c FROM prospects WHERE status='replied'").get().c;
  const interested = db.prepare("SELECT COUNT(*) as c FROM prospects WHERE status='interested'").get().c;
  const completed  = db.prepare("SELECT COUNT(*) as c FROM prospects WHERE status='completed'").get().c;
  const sentToday  = getSentTodayCount();
  const inQueue    = db.prepare(`
    SELECT COUNT(*) as c FROM prospects p
    JOIN sequence_steps ss ON ss.sequence_id = p.sequence_id AND ss.step_number = (p.current_step + 1)
    WHERE p.status = 'active' AND p.next_send_at <= datetime('now')
  `).get().c;
  return { total, active, replied, interested, completed, sentToday, inQueue };
}

module.exports = {
  db, init,
  getSetting, setSetting, getSettings,
  getSequences, getSequenceById, updateSequenceSteps,
  getProspects, getProspectById, insertProspect, updateProspect, deleteProspect,
  getQueue, getQueueWithStep,
  getSentTodayCount, logSentEmail, getRecentActivity, getStats
};
