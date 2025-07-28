const transporter = require('../utils/email');

exports.sendTestEmail = async (req, res) => {
  try {
    const toEmail = req.body?.email || process.env.MAIL_USER;
    await transporter.sendMail({
      from: `"Mental Health System" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: "Test Email from Gmail SMTP",
      text: "This is a test email sent from Nodemailer via Gmail SMTP.",
      html: "<b>This is a test email sent from Nodemailer via Gmail SMTP.</b>"
    });
    res.json({ success: true, message: "Test email sent successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}; 