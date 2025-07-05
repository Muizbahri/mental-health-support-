const referralRequestsModel = require('../models/referralRequests');
const db = require('../models/db');
const transporter = require('../utils/email');

exports.getReferralRequests = async (req, res) => {
  try {
    const { psychiatrist_id, status, counselor_id, role } = req.query;
    const filter = { psychiatrist_id, status };
    if (role !== 'admin' && counselor_id) filter.counselor_id = counselor_id;
    const requests = await referralRequestsModel.getReferralRequests(filter);
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('ReferralRequestsController.getReferralRequests error:', error);
    res.status(500).json({ message: 'Failed to fetch referral requests', error: error.message });
  }
};

exports.getReferralRequestsForPsychiatrist = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Get psychiatrist ID from authenticated user
    const psychiatristId = req.user.id;
    
    console.log(`Fetching referral requests for psychiatrist ID: ${psychiatristId}, status: ${status}`);
    
    const filter = { psychiatrist_id: psychiatristId };
    if (status && status !== 'All') {
      filter.status = status;
    }
    
    const requests = await referralRequestsModel.getReferralRequests(filter);
    console.log(`Found ${requests.length} referral requests for psychiatrist ${psychiatristId}`);
    
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('ReferralRequestsController.getReferralRequestsForPsychiatrist error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch referral requests', error: error.message });
  }
};

exports.createReferralRequest = async (req, res) => {
  try {
    const { patient_name, referred_by, disorder, status, psychiatrist_id, counselor_id } = req.body;
    if (!patient_name || !referred_by || !disorder || !status || !psychiatrist_id) {
      return res.status(400).json({ message: 'All fields are required (except counselor_id for admin)' });
    }
    const id = await referralRequestsModel.createReferralRequest({ patient_name, referred_by, disorder, status, psychiatrist_id, counselor_id: counselor_id || null });
    // Fetch psychiatrist email and send notification
    const [psychiatristRows] = await db.query('SELECT email FROM psychiatrists WHERE id = ?', [psychiatrist_id]);
    const psychiatristEmail = psychiatristRows[0]?.email;
    if (psychiatristEmail) {
      await transporter.sendMail({
        from: `"Mental Health System" <${process.env.MAIL_USER}>`,
        to: psychiatristEmail,
        subject: "Referral Request Notification",
        text: `You have a new referral request.`,
        html: `<b>New Referral Request</b><br>Patient: ${patient_name}<br>Status: ${status}<br><a href=\"http://yourapp.com/psychiatryst/referral-requests\">View details</a>`
      });
    }
    res.json({ message: 'Referral request created successfully', id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create referral request', error: error.message });
  }
};

exports.updateReferralRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Check if user is authenticated and is trying to update their own request
    if (req.user && req.user.role === 'psychiatrist') {
      // First, check if this request belongs to the authenticated psychiatrist
      const existingRequest = await referralRequestsModel.getReferralRequests({ id });
      if (existingRequest.length === 0) {
        return res.status(404).json({ success: false, message: 'Referral request not found' });
      }
      
      if (existingRequest[0].psychiatrist_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only update your own referral requests' });
      }
    }
    
    const success = await referralRequestsModel.updateReferralRequest(id, data);
    if (!success) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }
    
    // Optionally send notification if status is updated
    if (data.status && data.psychiatrist_id) {
      const [psychiatristRows] = await db.query('SELECT email FROM psychiatrists WHERE id = ?', [data.psychiatrist_id]);
      const psychiatristEmail = psychiatristRows[0]?.email;
      if (psychiatristEmail) {
        await transporter.sendMail({
          from: `"Mental Health System" <${process.env.MAIL_USER}>`,
          to: psychiatristEmail,
          subject: "Referral Request Status Updated",
          text: `Referral request status updated to ${data.status}.`,
          html: `<b>Referral Request Status Updated</b><br>Patient: ${data.patient_name || ''}<br>Status: ${data.status}<br><a href="http://yourapp.com/psychiatryst/referral-requests">View details</a>`
        });
      }
    }
    res.json({ success: true, message: 'Referral request updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update referral request', error: error.message });
  }
};

exports.deleteReferralRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is authenticated and is trying to delete their own request
    if (req.user && req.user.role === 'psychiatrist') {
      // First, check if this request belongs to the authenticated psychiatrist
      const existingRequest = await referralRequestsModel.getReferralRequests({ id });
      if (existingRequest.length === 0) {
        return res.status(404).json({ success: false, message: 'Referral request not found' });
      }
      
      if (existingRequest[0].psychiatrist_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only delete your own referral requests' });
      }
    }
    
    const success = await referralRequestsModel.deleteReferralRequest(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Referral request not found' });
    }
    res.json({ success: true, message: 'Referral request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete referral request', error: error.message });
  }
}; 