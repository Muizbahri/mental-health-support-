const emergencyCaseModel = require('../models/emergencyCase');
const counselorsModel = require('../models/counselors');
const psychiatristsModel = require('../models/psychiatrists');
const notificationsModel = require('../models/notifications');

exports.createEmergencyCase = async (req, res) => {
  try {
    const { name_patient, ic_number, date_time, status, assigned_to, role, counselor_id, psychiatrist_id } = req.body;
    console.log('Create emergency case - received date_time:', date_time, 'Type:', typeof date_time);
    
    if (!name_patient || !ic_number || !date_time || !status || !assigned_to || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    
    console.log('Processing emergency case assignment:', { role, assigned_to, counselor_id, psychiatrist_id });
    
    let finalCounselorId = null;
    let finalPsychiatristId = null;
    
    // If IDs are provided from frontend (admin), use them directly
    if (counselor_id !== undefined && counselor_id !== null) {
      finalCounselorId = counselor_id;
    } else if (psychiatrist_id !== undefined && psychiatrist_id !== null) {
      finalPsychiatristId = psychiatrist_id;
    } else {
      // Fallback: Look up by name if IDs not provided
      if (role === 'Counselor') {
        let counselor = await counselorsModel.getCounselorByEmail(assigned_to);
        if (!counselor) {
          counselor = await counselorsModel.getCounselorByFullName(assigned_to);
        }
        if (!counselor) {
          console.log('Counselor not found:', assigned_to);
          return res.status(400).json({ success: false, message: 'Assigned counselor not found.' });
        }
        
        // Check if user is trying to assign to themselves (if authenticated as counselor)
        if (req.user && req.user.role === 'counselor' && req.user.id === counselor.id) {
          console.log('Self-assignment attempt blocked:', { user_id: req.user.id, assigned_id: counselor.id });
          return res.status(400).json({ success: false, message: 'You cannot assign an emergency case to yourself.' });
        }
        
        finalCounselorId = counselor.id;
        console.log('Counselor assigned via lookup:', { name: counselor.full_name, id: finalCounselorId });
      } else if (role === 'Psychiatrist') {
        let psychiatrist = await psychiatristsModel.getPsychiatristByEmail(assigned_to);
        if (!psychiatrist) {
          psychiatrist = await psychiatristsModel.getPsychiatristByFullName(assigned_to);
        }
        if (!psychiatrist) {
          console.log('Psychiatrist not found:', assigned_to);
          return res.status(400).json({ success: false, message: 'Assigned psychiatrist not found.' });
        }
        
        // Check if user is trying to assign to themselves (if authenticated as psychiatrist)
        if (req.user && req.user.role === 'psychiatrist' && req.user.id === psychiatrist.id) {
          console.log('Self-assignment attempt blocked:', { user_id: req.user.id, assigned_id: psychiatrist.id });
          return res.status(400).json({ success: false, message: 'You cannot assign an emergency case to yourself.' });
        }
        
        finalPsychiatristId = psychiatrist.id;
        console.log('Psychiatrist assigned via lookup:', { name: psychiatrist.full_name, id: finalPsychiatristId });
      }
    }
    
    console.log('Final assignment IDs:', { counselor_id: finalCounselorId, psychiatrist_id: finalPsychiatristId });
    
    const id = await emergencyCaseModel.createEmergencyCase({ 
      name_patient, 
      ic_number, 
      date_time, 
      status, 
      assigned_to, 
      role, 
      counselor_id: finalCounselorId, 
      psychiatrist_id: finalPsychiatristId 
    });
    res.status(201).json({ success: true, message: 'Emergency case created successfully', id });
  } catch (error) {
    console.error('Error creating emergency case:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllEmergencyCases = async (req, res) => {
  try {
    let filter = {};
    // Only apply filters if specific query parameters are provided
    if (req.query.psychiatrist_id) {
      filter.psychiatrist_id = req.query.psychiatrist_id;
    } else if (req.query.counselor_id) {
      filter.counselor_id = req.query.counselor_id;
    }
    // If no filters are specified, get all cases (for admin view)
    const cases = await emergencyCaseModel.getAllEmergencyCases(filter);
    console.log(`Fetched ${cases.length} emergency cases with filter:`, filter);
    
    // Debug: Log the date_time format of the first case
    if (cases.length > 0) {
      console.log("Sample case date_time from DB:", cases[0].date_time);
      console.log("Sample date_time type:", typeof cases[0].date_time);
    }
    
    res.json({ success: true, data: cases });
  } catch (error) {
    console.error('Error fetching emergency cases:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEmergencyCase = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await emergencyCaseModel.deleteEmergencyCase(id);
    if (!success) return res.status(404).json({ success: false, message: 'Emergency case not found.' });
    res.json({ success: true, message: 'Emergency case deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEmergencyCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_patient, ic_number, date_time, status, assigned_to, role, counselor_id, psychiatrist_id } = req.body;
    
    console.log('Update request received for case ID:', id);
    console.log('Update emergency case - received date_time:', date_time, 'Type:', typeof date_time);
    console.log('Request body:', req.body);
    
    if (!name_patient || !ic_number || !date_time || !status || !assigned_to || !role) {
      console.log('Validation failed - missing required fields:', {
        name_patient: !!name_patient,
        ic_number: !!ic_number,
        date_time: !!date_time,
        status: !!status,
        assigned_to: !!assigned_to,
        role: !!role
      });
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    let finalCounselorId = null;
    let finalPsychiatristId = null;
    
    // If IDs are provided from frontend (admin), use them directly
    if (counselor_id !== undefined && counselor_id !== null) {
      finalCounselorId = counselor_id;
    } else if (psychiatrist_id !== undefined && psychiatrist_id !== null) {
      finalPsychiatristId = psychiatrist_id;
    } else {
      // Fallback: Look up by name if IDs not provided (for counselor/psychiatrist updates)
      if (role === 'Counselor') {
        let counselor = await counselorsModel.getCounselorByEmail(assigned_to);
        if (!counselor) {
          counselor = await counselorsModel.getCounselorByFullName(assigned_to);
        }
        if (counselor) {
          finalCounselorId = counselor.id;
        }
      } else if (role === 'Psychiatrist') {
        let psychiatrist = await psychiatristsModel.getPsychiatristByEmail(assigned_to);
        if (!psychiatrist) {
          psychiatrist = await psychiatristsModel.getPsychiatristByFullName(assigned_to);
        }
        if (psychiatrist) {
          finalPsychiatristId = psychiatrist.id;
        }
      }
    }
    
    console.log('Final update assignment IDs:', { counselor_id: finalCounselorId, psychiatrist_id: finalPsychiatristId });
    
    // Get current case data to check if assignment changed
    const currentCase = await emergencyCaseModel.getEmergencyCaseById(id);
    const isNewAssignment = currentCase && (
      currentCase.assigned_to !== assigned_to || 
      currentCase.role !== role ||
      currentCase.counselor_id !== finalCounselorId ||
      currentCase.psychiatrist_id !== finalPsychiatristId
    );
    
    console.log('Assignment check:', { 
      isNewAssignment, 
      currentAssigned: currentCase?.assigned_to, 
      newAssigned: assigned_to,
      currentRole: currentCase?.role,
      newRole: role
    });

    const success = await emergencyCaseModel.updateEmergencyCase(id, { 
      name_patient, 
      ic_number, 
      date_time, 
      status, 
      assigned_to, 
      role, 
      counselor_id: finalCounselorId, 
      psychiatrist_id: finalPsychiatristId 
    });
    
    if (!success) {
      console.log('Update failed - case not found or no changes made for ID:', id);
      return res.status(404).json({ success: false, message: 'Emergency case not found or no changes made.' });
    }
    
    // Send email and notification to assigned professional if this is a new assignment
    if (isNewAssignment && assigned_to && (finalCounselorId || finalPsychiatristId)) {
      console.log('Processing new assignment notification for:', { assigned_to, role, finalCounselorId, finalPsychiatristId });
      
      try {
        const transporter = require('../utils/email');
        
        let professionalEmail = null;
        let professionalName = assigned_to;
        let userType = role.toLowerCase();
        let userId = null;
        
        // Get professional's email and details based on role
        if (role === 'Counselor' && finalCounselorId) {
          const counselor = await counselorsModel.getCounselorById(finalCounselorId);
          console.log('Found counselor:', counselor);
          if (counselor) {
            professionalEmail = counselor.email;
            professionalName = counselor.full_name || assigned_to;
            userId = finalCounselorId;
          }
        } else if (role === 'Psychiatrist' && finalPsychiatristId) {
          const psychiatrist = await psychiatristsModel.getPsychiatristById(finalPsychiatristId);
          console.log('Found psychiatrist:', psychiatrist);
          if (psychiatrist) {
            professionalEmail = psychiatrist.email;
            professionalName = psychiatrist.full_name || assigned_to;
            userId = finalPsychiatristId;
          }
        }
        
        console.log('Professional details:', { 
          professionalEmail, 
          professionalName, 
          userType, 
          userId 
        });
        
        if (professionalEmail && userId) {
          // Send email to assigned professional
          console.log('Sending assignment email to:', professionalEmail);
          await transporter.sendMail({
            from: `"Mental Health System" <${process.env.MAIL_USER}>`,
            to: professionalEmail,
            subject: 'New Emergency Case Assigned to You - Immediate Attention Required',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">🚨 Emergency Case Assignment</h1>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #dee2e6;">
                  <h2 style="color: #333; margin-top: 0;">Hello ${professionalName},</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #555;">
                    You have been assigned a new emergency case by the admin. Please review the details below and take appropriate action as soon as possible.
                  </p>
                  
                  <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc3545;">
                    <h3 style="color: #dc3545; margin-top: 0;">Emergency Case Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Patient Name:</td>
                        <td style="padding: 8px 0; color: #555;">${name_patient}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">IC Number:</td>
                        <td style="padding: 8px 0; color: #555;">${ic_number}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Status:</td>
                        <td style="padding: 8px 0; color: #555;">${status}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Assigned Role:</td>
                        <td style="padding: 8px 0; color: #555;">${role}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Date/Time:</td>
                        <td style="padding: 8px 0; color: #555;">${new Date(date_time).toLocaleString()}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-weight: bold;">
                      ⚠️ Action Required: Please log in to your dashboard and review this emergency case immediately.
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/${userType}/${role === 'Counselor' ? 'emergency-reports' : 'emergency-cases'}" 
                       style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                      📋 View Emergency Cases
                    </a>
                  </div>
                  
                  <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px; text-align: center;">
                    <p style="color: #6c757d; font-size: 14px; margin: 0;">
                      This is an automated message from the Mental Health Support System.<br>
                      Please do not reply to this email.
                    </p>
                  </div>
                </div>
              </div>
            `
          });
          
          console.log('Email sent successfully to:', professionalEmail);
          
          // Create notification for assigned professional
          console.log('Creating notification for user:', { userType, userId });
          await notificationsModel.createNotification({
            user_type: userType,
            user_id: userId,
            title: 'Emergency case assigned to you',
            message: `New emergency case for ${name_patient} has been assigned to you`,
            data: {
              emergency_case_id: id,
              patient_name: name_patient,
              ic_number: ic_number,
              status: status,
              redirect_url: `/${userType}/${role === 'Counselor' ? 'emergency-reports' : 'emergency-cases'}`
            }
          });
          
          console.log('Notification created successfully for:', professionalName);
        } else {
          console.warn('Could not send notification - missing email or user ID:', { 
            professionalEmail, 
            userId,
            role,
            assigned_to 
          });
        }
      } catch (notificationError) {
        console.error('Error sending assignment email/notification:', notificationError);
        // Don't fail the entire request if email/notification fails
      }
    }
    
    console.log('Emergency case updated successfully:', id);
    res.json({ success: true, message: 'Emergency case updated successfully.' });
  } catch (error) {
    console.error('Error updating emergency case:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCasesByPsychiatristId = async (req, res) => {
  const psychiatrist_id = req.query.psychiatrist_id;
  if (!psychiatrist_id) return res.status(400).json({ error: "Missing psychiatrist_id" });
  const cases = await emergencyCaseModel.findByPsychiatristId(psychiatrist_id);
  res.json(cases);
};

exports.getPsychiatristCases = async (req, res) => {
  const psychiatrist_id = req.query.psychiatrist_id;
  if (!psychiatrist_id) return res.status(400).json({ error: 'Missing psychiatrist_id' });
  const data = await emergencyCaseModel.getByPsychiatristId(psychiatrist_id);
  return res.json({ data });
};

exports.getByPsychiatristId = async (req, res) => {
  const { id } = req.params;
  console.log("Controller: Received request for psychiatrist ID:", id);
  
  if (!id) {
    return res.status(400).json({ success: false, error: "Missing psychiatrist ID parameter" });
  }
  
  try {
    // First, let's check if this psychiatrist exists
    const psychiatrist = await psychiatristsModel.getPsychiatristById(id);
    console.log("Psychiatrist found:", psychiatrist ? psychiatrist.full_name : "NOT FOUND");
    
    const cases = await emergencyCaseModel.findByPsychiatristId(id);
    console.log(`Controller: Returning ${cases.length} cases for psychiatrist ID ${id}`);
    
    // Log each case found
    cases.forEach(caseItem => {
      console.log(`Case ID ${caseItem.id}: ${caseItem.name_patient} - assigned to ${caseItem.assigned_to} (psychiatrist_id: ${caseItem.psychiatrist_id})`);
    });
    
    res.json({ success: true, data: cases });
  } catch (err) {
    console.error("Error fetching psychiatrist cases:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Debug endpoint to check psychiatrist assignments
exports.debugPsychiatristAssignments = async (req, res) => {
  try {
    // Get psychiatrists using a direct database query to avoid any model issues
    const db = require('../config/db');
    const [psychiatristRows] = await db.query('SELECT id, full_name, email FROM psychiatrists');
    console.log("All psychiatrists in database:");
    psychiatristRows.forEach(p => {
      console.log(`  ID ${p.id}: ${p.full_name} (${p.email})`);
    });
    
    // Get all emergency cases with psychiatrist assignments
    const cases = await emergencyCaseModel.getAllEmergencyCases();
    const assignedCases = cases.filter(c => c.psychiatrist_id);
    console.log("Emergency cases with psychiatrist assignments:");
    assignedCases.forEach(c => {
      console.log(`  Case ID ${c.id}: ${c.name_patient} -> psychiatrist_id: ${c.psychiatrist_id}, assigned_to: ${c.assigned_to}`);
    });
    
    res.json({
      success: true,
      psychiatrists: psychiatristRows.map(p => ({ id: p.id, name: p.full_name, email: p.email })),
      assignedCases: assignedCases.map(c => ({ 
        id: c.id, 
        patient: c.name_patient, 
        psychiatrist_id: c.psychiatrist_id, 
        assigned_to: c.assigned_to 
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public emergency case creation (no authentication required, minimal fields)
exports.createPublicEmergencyCase = async (req, res) => {
  try {
    const { name_patient, ic_number } = req.body;
    
    if (!name_patient || !ic_number) {
      return res.status(400).json({ success: false, message: 'Full name and IC number are required.' });
    }
    
    // Only insert name_patient and ic_number - no other fields
    const id = await emergencyCaseModel.createPublicEmergencyCase({
      name_patient,
      ic_number
    });
    
    // Send email to admin and create notification
    try {
      const transporter = require('../utils/email');
      const notificationsModel = require('../models/notifications');
      
      // Send email to admin
      await transporter.sendMail({
        from: `"Mental Health System" <${process.env.MAIL_USER}>`,
        to: 'systemmanager112@gmail.com',
        subject: 'Emergency Case Received - Immediate Attention Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
              🚨 Emergency Case Received
            </h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Patient Information:</h3>
              <p><strong>Full Name:</strong> ${name_patient}</p>
              <p><strong>IC Number:</strong> ${ic_number}</p>
              <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Action Required:</strong> Please review and assign this emergency case to the appropriate professional as soon as possible.
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/manage-emergency" 
                 style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Emergency Cases
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              This is an automated message from the Mental Health Support System.
            </p>
          </div>
        `
      });
      
      // Create notification for admin
      await notificationsModel.createNotification({
        user_type: 'admin',
        user_id: null, // Admin doesn't have a specific user ID
        title: 'Emergency case received',
        message: `New emergency case from ${name_patient} (IC: ${ic_number})`,
        data: {
          emergency_case_id: id,
          patient_name: name_patient,
          ic_number: ic_number,
          redirect_url: '/admin/manage-emergency'
        }
      });
      
      console.log('Email sent to admin and notification created for emergency case ID:', id);
    } catch (notificationError) {
      console.error('Error sending email/notification for emergency case:', notificationError);
      // Don't fail the entire request if email/notification fails
    }
    
    res.status(201).json({ success: true, message: 'Emergency case submitted successfully', id });
  } catch (error) {
    console.error('Error creating public emergency case:', error);
    res.status(500).json({ success: false, message: 'Failed to submit emergency case' });
  }
}; 