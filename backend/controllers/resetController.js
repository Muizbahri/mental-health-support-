const crypto = require('crypto');
const transporter = require('../utils/email');
const publicUserModel = require('../models/publicUser');
const counselorsModel = require('../models/counselors');
const psychiatristsModel = require('../models/psychiatrists');
const passwordResetTokensModel = require('../models/passwordResetTokens');

// Generate reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate expiration time (15 minutes from now)
function generateExpirationTime() {
  return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
}

// Send reset email
async function sendResetEmail(email, resetToken, userType) {
  // Map userType to correct URL path
  let urlPath;
  switch (userType) {
    case 'public':
      urlPath = 'user-public';
      break;
    case 'counselor':
      urlPath = 'counselor';
      break;
    case 'psychiatrist':
      urlPath = 'psychiatryst';
      break;
    default:
      urlPath = userType;
  }
  
  const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/${urlPath}/set-new-password?token=${resetToken}`;
  
  const mailOptions = {
    from: '"Mental Health System" <no-reply@mentalhealth.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>You have requested to reset your password for the Mental Health Support System.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p>This link will expire in 15 minutes for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">Mental Health Support System</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    return false;
  }
}

// 1. Generate & send token
exports.requestResetToken = async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email || !userType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and user type are required' 
      });
    }

    let user = null;

    // Find user based on type
    switch (userType) {
      case 'public':
        user = await publicUserModel.getPublicUserByEmail(email);
        break;
      case 'counselor':
        user = await counselorsModel.getCounselorByEmail(email);
        break;
      case 'psychiatrist':
        user = await psychiatristsModel.getPsychiatristByEmail(email);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user type' 
        });
    }

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        success: true, 
        message: 'If an account with this email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token and expiration
    const resetToken = generateResetToken();
    const expiresAt = generateExpirationTime();

    // Store token in database
    await passwordResetTokensModel.createResetToken(email, resetToken, userType, expiresAt);

    // Send reset email
    const emailSent = await sendResetEmail(email, resetToken, userType);

    if (emailSent) {
      res.status(200).json({ 
        success: true, 
        message: 'If an account with this email exists, a password reset link has been sent.' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send reset email. Please try again.' 
      });
    }

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// 2. Reset password
exports.resetUserPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }

    // Validate token from database
    const tokenData = await passwordResetTokensModel.getResetToken(token);
    if (!tokenData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Find user based on token data
    let user = null;
    switch (tokenData.user_type) {
      case 'public':
        user = await publicUserModel.getPublicUserByEmail(tokenData.email);
        break;
      case 'counselor':
        user = await counselorsModel.getCounselorByEmail(tokenData.email);
        break;
      case 'psychiatrist':
        user = await psychiatristsModel.getPsychiatristByEmail(tokenData.email);
        break;
    }

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Store password as entered by user (no hashing)
    const plainPassword = newPassword;

    // Update password based on user type
    let updateSuccess = false;
    switch (tokenData.user_type) {
      case 'public':
        updateSuccess = await publicUserModel.updatePassword(user.id, plainPassword);
        break;
      case 'counselor':
        updateSuccess = await counselorsModel.updatePassword(user.id, plainPassword);
        break;
      case 'psychiatrist':
        updateSuccess = await psychiatristsModel.updatePassword(user.id, plainPassword);
        break;
    }

    if (updateSuccess) {
      // Mark token as used
      await passwordResetTokensModel.markTokenAsUsed(token);
      res.status(200).json({ 
        success: true, 
        message: 'Password has been reset successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update password' 
      });
    }

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// 3. Validate reset token
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      });
    }

    const tokenData = await passwordResetTokensModel.getResetToken(token);
    if (!tokenData) {
      return res.json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Token is valid' 
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}; 