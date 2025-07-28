const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  auth: {
    user: process.env.MAIL_USER || 'default@example.com',
    pass: process.env.MAIL_PASS || 'default-password',
  },
});

async function sendTestMail(to, subject, text) {
  const mailOptions = {
    from: '"Mental Health System" <no-reply@yourapp.com>',
    to,
    subject,
    text,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendTestMail }; 