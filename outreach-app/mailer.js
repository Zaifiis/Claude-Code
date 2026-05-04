const nodemailer = require('nodemailer');
const { getSettings } = require('./db');

function buildTransporter(cfg) {
  return nodemailer.createTransport({
    host: cfg.smtp_host || 'smtp.hostinger.com',
    port: parseInt(cfg.smtp_port || '465', 10),
    secure: (cfg.smtp_port || '465') === '465',
    auth: {
      user: cfg.smtp_user,
      pass: cfg.smtp_pass
    },
    tls: { rejectUnauthorized: false }
  });
}

function substituteTokens(text, prospect) {
  return text
    .replace(/\{first_name\}/g, prospect.first_name || prospect.email.split('@')[0])
    .replace(/\{last_name\}/g,  prospect.last_name  || '')
    .replace(/\{company\}/g,    prospect.company    || 'your company')
    .replace(/\{niche\}/g,      prospect.niche      || 'your industry');
}

async function sendEmail({ prospect, subject, body }) {
  const cfg = getSettings();
  if (!cfg.smtp_user || !cfg.smtp_pass) {
    throw new Error('SMTP credentials not configured. Go to Settings and save your SMTP details.');
  }
  const transporter = buildTransporter(cfg);
  const fromName  = cfg.from_name  || cfg.smtp_user;
  const fromEmail = cfg.from_email || cfg.smtp_user;

  const resolvedSubject = substituteTokens(subject, prospect);
  const resolvedBody    = substituteTokens(body,    prospect);

  await transporter.sendMail({
    from:    `"${fromName}" <${fromEmail}>`,
    to:      prospect.email,
    subject: resolvedSubject,
    text:    resolvedBody
  });

  return { resolvedSubject, resolvedBody };
}

async function testConnection(cfg) {
  const transporter = buildTransporter(cfg);
  await transporter.verify();
  await transporter.sendMail({
    from:    `"${cfg.from_name || cfg.smtp_user}" <${cfg.from_email || cfg.smtp_user}>`,
    to:      cfg.smtp_user,
    subject: 'Outreach App — SMTP test',
    text:    'Your SMTP connection is working correctly.'
  });
}

module.exports = { sendEmail, testConnection, substituteTokens };
