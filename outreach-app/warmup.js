const nodemailer = require('nodemailer');
const db = require('./db');

// ── Warmup email templates (natural, conversational) ─────────────────────────

const SUBJECTS = [
  '[WU] quick check-in',
  '[WU] following up',
  '[WU] hey, got a minute?',
  '[WU] quick note',
  '[WU] checking in on this',
  '[WU] hope all is well',
  '[WU] quick question',
  '[WU] re: earlier',
  '[WU] touching base',
  '[WU] any update?',
];

const BODIES = [
  `Hey,\n\nJust wanted to follow up on this. Let me know when you have a moment to connect.\n\nThanks`,
  `Hi,\n\nHope your week is going well. Did you get a chance to look at what I sent earlier?\n\nBest`,
  `Hey,\n\nJust checking in — any update on your end? Happy to jump on a quick call if that's easier.\n\nThanks`,
  `Hi,\n\nQuick note to follow up. Let me know if you need anything from my side.\n\nBest regards`,
  `Hey,\n\nWanted to circle back on this. Let me know your thoughts when you get a chance.\n\nThanks`,
  `Hi,\n\nHope everything is going well on your end. Just wanted to touch base and see where things stand.\n\nBest`,
  `Hey,\n\nHaven't heard back — just wanted to make sure my last message didn't get lost. Let me know!\n\nThanks`,
  `Hi,\n\nQuick question when you get a moment — no rush, just whenever it's convenient for you.\n\nBest regards`,
];

const REPLY_BODIES = [
  `Thanks for reaching out! I'll take a look and get back to you shortly.\n\nBest`,
  `Got it, thanks for following up. Will respond properly soon.\n\nCheers`,
  `Appreciate you checking in! Give me a day to review and I'll get back to you.\n\nThanks`,
  `Hi, thanks for the note. I'll circle back with you shortly.\n\nBest regards`,
  `Thanks! Just saw this — will get back to you by end of day.\n\nBest`,
  `Got your message, thanks. Will follow up soon.\n\nCheers`,
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── SMTP Send ─────────────────────────────────────────────────────────────────

async function sendWarmupEmail(fromAccount, toAccount) {
  const transporter = nodemailer.createTransport({
    host:   fromAccount.smtp_host || 'smtp.hostinger.com',
    port:   parseInt(fromAccount.smtp_port || '465', 10),
    secure: (fromAccount.smtp_port || '465') === '465',
    auth:   { user: fromAccount.email, pass: fromAccount.smtp_pass },
    tls:    { rejectUnauthorized: false }
  });

  const subject = pick(SUBJECTS);
  const body    = pick(BODIES);

  await transporter.sendMail({
    from:    fromAccount.email,
    to:      toAccount.email,
    subject,
    text:    body
  });

  return { subject, body };
}

// ── IMAP Read + Reply ─────────────────────────────────────────────────────────

async function readAndReplyWarmupEmails(account) {
  let ImapFlow;
  try {
    ImapFlow = require('imapflow').ImapFlow;
  } catch(e) {
    return { rescued: 0, replied: 0, error: 'imapflow not installed' };
  }

  const client = new ImapFlow({
    host:   account.imap_host || 'imap.hostinger.com',
    port:   parseInt(account.imap_port || '993', 10),
    secure: true,
    auth:   { user: account.email, pass: account.smtp_pass },
    logger: false,
    tls:    { rejectUnauthorized: false }
  });

  let rescued = 0;
  let replied = 0;

  try {
    await client.connect();

    // Move warmup emails out of spam folders
    const spamFolders = ['Junk', 'Spam', 'INBOX.Junk', 'INBOX.Spam', 'Junk Email'];
    for (const folder of spamFolders) {
      try {
        const lock = await client.getMailboxLock(folder);
        try {
          const uids = await client.search({ subject: '[WU]' });
          if (uids.length > 0) {
            await client.messageMove(uids, 'INBOX');
            rescued += uids.length;
          }
        } finally {
          lock.release();
        }
      } catch(e) { /* folder doesn't exist on this provider */ }
    }

    // Read inbox for warmup emails
    const lock = await client.getMailboxLock('INBOX');
    try {
      const uids = await client.search({ subject: '[WU]', seen: false });

      for (const uid of uids) {
        await client.messageFlagsAdd(uid, ['\\Seen']);

        // Reply ~40% of the time
        if (Math.random() < 0.4) {
          try {
            const msg = await client.fetchOne(uid, { envelope: true });
            const replyTo      = msg.envelope?.from?.[0]?.address;
            const origSubject  = msg.envelope?.subject || '[WU] re';
            const replySubject = origSubject.startsWith('Re:') ? origSubject : 'Re: ' + origSubject;

            if (replyTo) {
              const transporter = nodemailer.createTransport({
                host:   account.smtp_host || 'smtp.hostinger.com',
                port:   parseInt(account.smtp_port || '465', 10),
                secure: true,
                auth:   { user: account.email, pass: account.smtp_pass },
                tls:    { rejectUnauthorized: false }
              });
              await transporter.sendMail({
                from:    account.email,
                to:      replyTo,
                subject: replySubject,
                text:    pick(REPLY_BODIES)
              });
              replied++;
            }
          } catch(e) { /* skip failed reply */ }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch(e) {
    console.error(`[Warmup] IMAP error for ${account.email}: ${e.message}`);
    return { rescued, replied, error: e.message };
  }

  return { rescued, replied };
}

// ── Warmup Cycle (called by scheduler) ───────────────────────────────────────

async function runWarmupCycle() {
  const accounts = db.getActiveWarmupAccounts();
  if (accounts.length < 2) {
    return { sent: 0, skipped: 0, message: 'Need at least 2 active warmup accounts' };
  }

  // Daily limit per account: start at 3, increase by 2 per week (max 40)
  const dailyPerAccount = parseInt(db.getSetting('warmup_daily_per_account') || '3', 10);

  let sent    = 0;
  let skipped = 0;

  for (const sender of accounts) {
    const sentToday = db.getWarmupSentToday(sender.id);
    if (sentToday >= dailyPerAccount) { skipped++; continue; }

    // Pick a random receiver — prefer different domain
    const others = accounts.filter(a => a.id !== sender.id);
    const diffDomain = others.filter(a => a.email.split('@')[1] !== sender.email.split('@')[1]);
    const receivers  = diffDomain.length > 0 ? diffDomain : others;
    const receiver   = pick(receivers);

    try {
      const { subject } = await sendWarmupEmail(sender, receiver);
      db.logWarmupSend(sender.id, receiver.id, subject);
      sent++;
      console.log(`[Warmup] Sent: ${sender.email} → ${receiver.email}`);
      await sleep(2000 + Math.random() * 3000); // 2-5s between sends
    } catch(e) {
      console.error(`[Warmup] Send failed ${sender.email} → ${receiver.email}: ${e.message}`);
    }
  }

  // IMAP check for all accounts
  for (const account of accounts) {
    await readAndReplyWarmupEmails(account);
    await sleep(1000);
  }

  console.log(`[Warmup] Cycle complete — sent: ${sent}, skipped: ${skipped}`);
  return { sent, skipped };
}

// ── Scheduler (runs every hour) ───────────────────────────────────────────────

let _schedulerRunning = false;
let _schedulerTimer   = null;

function startScheduler() {
  if (_schedulerRunning) return;
  _schedulerRunning = true;

  const run = async () => {
    const warmupEnabled = db.getSetting('warmup_enabled');
    if (warmupEnabled === 'true') {
      try { await runWarmupCycle(); } catch(e) { console.error('[Warmup] Scheduler error:', e.message); }
    }
    _schedulerTimer = setTimeout(run, 60 * 60 * 1000); // every hour
  };

  // First run after 5 minutes
  _schedulerTimer = setTimeout(run, 5 * 60 * 1000);
  console.log('[Warmup] Scheduler started — runs every hour');
}

function stopScheduler() {
  if (_schedulerTimer) clearTimeout(_schedulerTimer);
  _schedulerRunning = false;
}

module.exports = { runWarmupCycle, sendWarmupEmail, readAndReplyWarmupEmails, startScheduler, stopScheduler };
