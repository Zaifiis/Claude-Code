const nodemailer = require('nodemailer');
const { getSettings, getNextSender } = require('./db');

function buildTransporter(cfg) {
  return nodemailer.createTransport({
    host:   cfg.smtp_host || 'smtp.hostinger.com',
    port:   parseInt(cfg.smtp_port || '465', 10),
    secure: (cfg.smtp_port || '465') === '465',
    auth:   { user: cfg.smtp_user || cfg.email, pass: cfg.smtp_pass },
    tls:    { rejectUnauthorized: false }
  });
}

function substituteTokens(text, prospect) {
  return text
    .replace(/\{first_name\}/g, prospect.first_name || prospect.email.split('@')[0])
    .replace(/\{last_name\}/g,  prospect.last_name  || '')
    .replace(/\{company\}/g,    prospect.company    || 'your company')
    .replace(/\{niche\}/g,      prospect.niche      || 'your industry');
}

// ── Single send (settings SMTP) ───────────────────────────────────────────────

async function sendEmail({ prospect, subject, body }) {
  const cfg = getSettings();
  if (!cfg.smtp_user || !cfg.smtp_pass) {
    throw new Error('SMTP credentials not configured. Go to Settings.');
  }
  const transporter  = buildTransporter({ ...cfg, smtp_user: cfg.smtp_user });
  const fromName     = cfg.from_name  || cfg.smtp_user;
  const fromEmail    = cfg.from_email || cfg.smtp_user;
  const resolvedSubject = substituteTokens(subject, prospect);
  const resolvedBody    = substituteTokens(body,    prospect);

  await transporter.sendMail({
    from:    `"${fromName}" <${fromEmail}>`,
    to:      prospect.email,
    subject: resolvedSubject,
    text:    resolvedBody
  });

  return { resolvedSubject, resolvedBody, senderEmail: fromEmail };
}

// ── Rotation send (picks best sender, falls back to settings) ─────────────────

async function sendEmailWithRotation({ prospect, subject, body }) {
  const resolvedSubject = substituteTokens(subject, prospect);
  const resolvedBody    = substituteTokens(body,    prospect);

  const sender = getNextSender();

  if (sender) {
    const transporter = buildTransporter({ smtp_host: sender.smtp_host, smtp_port: sender.smtp_port, smtp_pass: sender.smtp_pass, smtp_user: sender.email });
    const fromName    = sender.from_name || sender.email;
    await transporter.sendMail({
      from:    `"${fromName}" <${sender.email}>`,
      to:      prospect.email,
      subject: resolvedSubject,
      text:    resolvedBody
    });
    return { resolvedSubject, resolvedBody, senderEmail: sender.email };
  }

  // Fallback to settings SMTP
  const cfg = getSettings();
  if (!cfg.smtp_user || !cfg.smtp_pass) {
    throw new Error('No senders configured and no SMTP settings found. Go to Settings.');
  }
  const transporter = buildTransporter(cfg);
  const fromName    = cfg.from_name  || cfg.smtp_user;
  const fromEmail   = cfg.from_email || cfg.smtp_user;
  await transporter.sendMail({
    from:    `"${fromName}" <${fromEmail}>`,
    to:      prospect.email,
    subject: resolvedSubject,
    text:    resolvedBody
  });
  return { resolvedSubject, resolvedBody, senderEmail: fromEmail };
}

// ── Reply Detection (IMAP) ────────────────────────────────────────────────────

async function checkReplies() {
  let ImapFlow;
  try { ImapFlow = require('imapflow').ImapFlow; }
  catch(e) { return { repliesFound: 0, error: 'imapflow not installed' }; }

  const db       = require('./db');
  const cfg      = db.getSettings();
  const senders  = db.getActiveSenders();

  // Build list of IMAP accounts to check
  const accounts = [];
  if (cfg.smtp_user && cfg.smtp_pass) {
    accounts.push({
      email:     cfg.from_email || cfg.smtp_user,
      pass:      cfg.smtp_pass,
      imap_host: cfg.imap_host || 'imap.hostinger.com',
      imap_port: cfg.imap_port || '993'
    });
  }
  for (const s of senders) {
    if (!accounts.find(a => a.email === s.email)) {
      accounts.push({ email: s.email, pass: s.smtp_pass, imap_host: s.imap_host || 'imap.hostinger.com', imap_port: s.imap_port || '993' });
    }
  }

  if (!accounts.length) return { repliesFound: 0, error: 'No accounts configured' };

  // Get prospects who have been emailed (step > 0) and are still active
  const prospects   = db.getProspects({ status: 'active' }).filter(p => p.current_step > 0);
  const prospectMap = new Map(prospects.map(p => [p.email.toLowerCase(), p]));

  const lastCheck = db.getSetting('last_reply_check');
  const since     = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let repliesFound = 0;

  for (const account of accounts) {
    const client = new ImapFlow({
      host:   account.imap_host,
      port:   parseInt(account.imap_port, 10),
      secure: true,
      auth:   { user: account.email, pass: account.pass },
      logger: false,
      tls:    { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      try {
        const uids = await client.search({ since });
        if (uids.length > 0) {
          for await (const msg of client.fetch(uids, { envelope: true })) {
            const fromEmail = msg.envelope?.from?.[0]?.address?.toLowerCase();
            if (fromEmail && prospectMap.has(fromEmail)) {
              const prospect = prospectMap.get(fromEmail);
              db.updateProspect(prospect.id, { status: 'replied' });
              prospectMap.delete(fromEmail); // don't process twice
              repliesFound++;
              console.log(`[ReplyCheck] Reply detected from ${fromEmail}`);
            }
          }
        }
      } finally {
        lock.release();
      }
      await client.logout();
    } catch(e) {
      console.error(`[ReplyCheck] IMAP error for ${account.email}: ${e.message}`);
    }
  }

  db.setSetting('last_reply_check', new Date().toISOString());
  console.log(`[ReplyCheck] Done — ${repliesFound} new replies found`);
  return { repliesFound, checkedAt: new Date().toISOString() };
}

// ── SMTP Test ─────────────────────────────────────────────────────────────────

async function testConnection(cfg) {
  const transporter = buildTransporter({ ...cfg, smtp_user: cfg.smtp_user || cfg.email });
  await transporter.verify();
  await transporter.sendMail({
    from:    `"${cfg.from_name || cfg.smtp_user}" <${cfg.from_email || cfg.smtp_user}>`,
    to:      cfg.smtp_user || cfg.email,
    subject: 'Outreach App — SMTP test',
    text:    'Your SMTP connection is working correctly.'
  });
}

module.exports = { sendEmail, sendEmailWithRotation, checkReplies, testConnection, substituteTokens };
