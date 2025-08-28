// Simple mailer wrapper. Reads SMTP_* env vars and exports sendMail(message)
const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
} else {
  // no transporter configured; keep null and let callers fallback to console.log
  transporter = null;
}

exports.sendMail = async (msg) => {
  if (!transporter) {
    console.log('mailer (noop) sendMail:', msg);
    return { noop: true };
  }
  return transporter.sendMail(msg);
};
