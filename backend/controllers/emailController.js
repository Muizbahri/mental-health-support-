require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

exports.sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const info = await transporter.sendMail({
      from: '"Mental Health Support" <no-reply@yourapp.com>',
      to: email,
      subject: 'Welcome! Test Email from Mailtrap',
      text: 'This is a test email sent using Mailtrap + Nodemailer + .env config.',
      html: '<b>This is a test email sent using <span style="color:#22a;">Mailtrap</span> + Nodemailer + <code>.env</code> config.</b>'
    });

    res.json({ success: true, info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}; 