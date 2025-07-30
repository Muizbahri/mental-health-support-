const appointmentsModel = require('../models/appointments');
const { authenticateToken, isAdmin, isCounselor } = require('../middleware/authMiddleware');
const counselorsModel = require('../models/counselors');
const psychiatristAppointmentsModel = require('../models/psychiatristAppointments');
const psychiatristsModel = require('../models/psychiatrists');

// Admin methods (no authentication required)
exports.createAdminAppointment = async (req, res) => {
  try {
    const { role, name_patient, contact, assigned_to, status, date_time, psychiatrist_id } = req.body;
    
    if (!role || !name_patient || !assigned_to || !status || !date_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Admin creating appointment:', { role, name_patient, assigned_to, status, date_time });

    if (role === 'Psychiatrist') {
      // Use provided psychiatrist_id or find by name
      let finalPsychiatristId = psychiatrist_id;
      if (!finalPsychiatristId) {
        const psychiatrist = await psychiatristsModel.getPsychiatristByFullName(assigned_to);
        if (!psychiatrist) {
          return res.status(400).json({ error: 'Assigned psychiatrist not found' });
        }
        finalPsychiatristId = psychiatrist.id;
      }

      const appointmentData = {
        name_patient,
        contact: contact || 'admin@system.com',
        assigned_to,
        psychiatrist_id: finalPsychiatristId,
        status,
        date_time,
        created_by: 'admin'
      };

      const id = await psychiatristAppointmentsModel.createPsychiatristAppointment(appointmentData);
      return res.status(201).json({ success: true, message: 'Psychiatrist appointment created', id });

    } else if (role === 'Counselor') {
      // Find counselor by name to get counselor_id
      const counselor = await counselorsModel.getCounselorByFullName(assigned_to);
      if (!counselor) {
        return res.status(400).json({ error: 'Assigned counselor not found' });
      }

      const appointmentData = {
        role,
        name_patient,
        contact: contact || 'admin@system.com',
        assigned_to,
        status,
        date_time,
        created_by: 'admin',
        counselor_id: counselor.id
      };

      const id = await appointmentsModel.createAppointment(appointmentData);
      return res.status(201).json({ success: true, message: 'Counselor appointment created', id });

    } else {
      return res.status(400).json({ error: 'Invalid role. Must be "Counselor" or "Psychiatrist"' });
    }

  } catch (error) {
    console.error('Error in createAdminAppointment:', error);
    res.status(500).json({ error: error.message || 'Server error while creating appointment' });
  }
};

exports.getAdminAppointments = async (req, res) => {
  try {
    console.log('Admin fetching all appointments');
    
    // Get both counselor and psychiatrist appointments
    const counselorAppointments = await appointmentsModel.getAppointments({});
    const psychiatristAppointments = await psychiatristAppointmentsModel.getAllPsychiatristAppointments();

    // Add role field to counselor appointments if missing
    const counselorData = counselorAppointments.map(apt => ({
      ...apt,
      role: apt.role || 'Counselor'
    }));

    // Add role field to psychiatrist appointments
    const psychiatristData = psychiatristAppointments.map(apt => ({
      ...apt,
      role: 'Psychiatrist'
    }));

    // Combine all appointments
    const allAppointments = [...counselorData, ...psychiatristData];

    console.log(`Admin fetched ${counselorData.length} counselor and ${psychiatristData.length} psychiatrist appointments`);

    res.json({ success: true, data: allAppointments });
  } catch (err) {
    console.error('Error in getAdminAppointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

exports.updateAdminAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, name_patient, contact, assigned_to, status, date_time, psychiatrist_id } = req.body;

    if (!role || !name_patient || !assigned_to || !status || !date_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Admin updating appointment:', { id, role, name_patient, assigned_to });

    if (role === 'Psychiatrist') {
      // Use provided psychiatrist_id or find by name
      let finalPsychiatristId = psychiatrist_id;
      if (!finalPsychiatristId) {
        const psychiatrist = await psychiatristsModel.getPsychiatristByFullName(assigned_to);
        if (!psychiatrist) {
          return res.status(400).json({ error: 'Assigned psychiatrist not found' });
        }
        finalPsychiatristId = psychiatrist.id;
      }

      const success = await psychiatristAppointmentsModel.updatePsychiatristAppointment(id, {
        name_patient,
        contact: contact || 'admin@system.com',
        assigned_to,
        psychiatrist_id: finalPsychiatristId,
        status,
        date_time
      });

      if (!success) {
        return res.status(404).json({ success: false, message: 'Psychiatrist appointment not found' });
      }

    } else if (role === 'Counselor') {
      // Find counselor by name to get counselor_id
      const counselor = await counselorsModel.getCounselorByFullName(assigned_to);
      if (!counselor) {
        return res.status(400).json({ error: 'Assigned counselor not found' });
      }

      const success = await appointmentsModel.updateAppointment(id, {
        role,
        name_patient,
        contact: contact || 'admin@system.com',
        assigned_to,
        status,
        date_time,
        created_by: 'admin',
        counselor_id: counselor.id
      });

      if (!success) {
        return res.status(404).json({ success: false, message: 'Counselor appointment not found' });
      }

    } else {
      return res.status(400).json({ error: 'Invalid role. Must be "Counselor" or "Psychiatrist"' });
    }

    res.json({ success: true, message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Error in updateAdminAppointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAdminAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Admin deleting appointment ID:', id);
    
    // Try to delete from both tables since appointments can be in either
    let success = false;
    
    // Try counselor appointments table first
    try {
      const counselorResult = await appointmentsModel.deleteAppointment(id);
      if (counselorResult) {
        console.log('Successfully deleted counselor appointment');
        success = true;
      }
    } catch (err) {
      console.log('Not found in counselor appointments table');
    }
    
    // If not found in counselor table, try psychiatrist appointments table
    if (!success) {
      try {
        const psychiatristResult = await psychiatristAppointmentsModel.deletePsychiatristAppointment(id);
        if (psychiatristResult) {
          console.log('Successfully deleted psychiatrist appointment');
          success = true;
        }
      } catch (err) {
        console.log('Not found in psychiatrist appointments table');
      }
    }
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Appointment not found in either table' });
    }
    
    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAdminAppointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { role, name_patient, contact, assigned_to, status, date_time, user_public_id } = req.body;
    if (!role || !name_patient || !contact || !assigned_to || !status || !date_time) {
      return res.status(400).json({ error: 'Missing required fields: role, name_patient, contact, assigned_to, status, date_time' });
    }
    // Validate date_time is at least 1 hour in the future
    const now = new Date();
    const selected = new Date(date_time);
    if (selected - now < 60 * 60 * 1000) {
      return res.status(400).json({ error: 'Appointment must be at least 1 hour from now.' });
    }
    // Use req.user for created_by
    const created_by = req.user && req.user.email ? req.user.email : null;
    if (role === 'Psychiatrist') {
      const { psychiatrist_id } = req.body;
      if (!psychiatrist_id) return res.status(400).json({ error: 'Missing psychiatrist_id' });
      if (!name_patient || !contact || !assigned_to || !status || !date_time || !created_by) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const id = await psychiatristAppointmentsModel.createPsychiatristAppointment({ name_patient, contact, assigned_to, psychiatrist_id, status, date_time, created_by });
      return res.status(201).json({ message: 'Psychiatrist appointment created', id });
    }
    let counselor_id = null;
    if (req.user.role === 'counselor') {
      counselor_id = req.user.id;
    } else if (req.user.role === 'admin') {
      // Try to find counselor by assigned_to (email or full_name)
      let counselor = await counselorsModel.getCounselorByEmail(assigned_to);
      if (!counselor) {
        counselor = await counselorsModel.getCounselorByFullName(assigned_to);
      }
      if (!counselor) {
        return res.status(400).json({ error: 'Assigned counselor not found.' });
      }
      counselor_id = counselor.id;
    }
    const id = await appointmentsModel.createAppointment({ role, name_patient, user_public_id, contact, assigned_to, status, date_time, created_by, counselor_id });
    res.status(201).json({ message: 'Appointment created', id });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error while creating appointment' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};
    if (user.role === 'admin') {
      // Admin sees all appointments, no filters
      filter = {};
    } else if (user.role === 'counselor') {
      // Counselors: only see their own appointments by counselor_id
      filter.counselor_id = user.id;
    }
    const appointments = await appointmentsModel.getAppointments(filter);
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

exports.getAppointmentsByAssignee = async (req, res) => {
  try {
    const { assigned_to } = req.params;
    const appointments = await appointmentsModel.getAppointmentsByAssignee(assigned_to);
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments for assignee' });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    let { role, name_patient, contact, assigned_to, status, date_time, user_public_id, counselor_id } = req.body;
    const user = req.user;
    // Fetch the appointment to check ownership and get current values
    const [appointment] = await appointmentsModel.getAppointments({ id });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    if (user.role !== 'admin' && appointment.created_by !== user.email && appointment.assigned_to !== user.full_name) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    // Retain original values if missing in payload
    if (!name_patient || name_patient.trim() === "") name_patient = appointment.name_patient;
    if (!user_public_id) user_public_id = appointment.user_public_id;
    if (!counselor_id) counselor_id = appointment.counselor_id;
    const success = await appointmentsModel.updateAppointment(id, { role, name_patient, user_public_id, contact, assigned_to, status, date_time, created_by: appointment.created_by, counselor_id });
    if (!success) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    
    // Create notification for public user if status changed and user_public_id exists
    try {
      if (user_public_id && (status === 'Accepted' || status === 'Rejected')) {
        console.log('🔔 Status change detected, creating notification for public user:', {
          user_public_id,
          status,
          assigned_to
        });
        
        // Get public user details
        const publicUser = await publicUsersModel.getPublicUserById(user_public_id);
        
        if (publicUser) {
          // Format date and time for notification
          const appointmentDateTime = new Date(date_time);
          const formattedDate = appointmentDateTime.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
          });
          const formattedTime = appointmentDateTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          const statusMessage = status === 'Accepted' ? 'accepted' : 'rejected';
          const statusIcon = status === 'Accepted' ? '✅' : '❌';
          
          console.log('🔔 Creating notification for public user:', {
            user_type: 'public_user',
            user_id: user_public_id,
            title: `Appointment ${statusMessage}`,
            message: `${statusIcon} Your counseling appointment with ${assigned_to} on ${formattedDate} at ${formattedTime} has been ${statusMessage}`
          });
          
          // Create notification for public user
          await notificationsModel.createNotification({
            user_type: 'public_user',
            user_id: user_public_id,
            title: `Appointment ${statusMessage}`,
            message: `${statusIcon} Your counseling appointment with ${assigned_to} on ${formattedDate} at ${formattedTime} has been ${statusMessage}`,
            data: {
              appointment_id: id,
              appointment_type: 'Counseling Session',
              appointment_date: formattedDate,
              appointment_time: formattedTime,
              counselor_name: assigned_to,
              status: status,
              redirect_url: '/user-public/appointments'
            }
          });
          
          console.log('✅ Notification created for public user:', publicUser.full_name, 'Status:', status);
        } else {
          console.log('❌ Public user not found with ID:', user_public_id);
        }
      } else {
        console.log('ℹ️ No notification needed. user_public_id:', user_public_id, 'status:', status);
      }
    } catch (notificationError) {
      console.error('❌ Error creating notification for public user:', notificationError);
      // Don't fail the entire request if notification fails
    }
    
    res.json({ success: true, message: 'Appointment updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // For admin, try to delete from both tables since appointments can be in either
    if (user.role === 'admin') {
      console.log('Admin attempting to delete appointment ID:', id);
      
      // Try counselor appointments table first
      let success = false;
      try {
        const counselorResult = await appointmentsModel.deleteAppointment(id);
        if (counselorResult) {
          console.log('Successfully deleted counselor appointment');
          success = true;
        }
      } catch (err) {
        console.log('Not found in counselor appointments table');
      }
      
      // If not found in counselor table, try psychiatrist appointments table
      if (!success) {
        try {
          const psychiatristResult = await psychiatristAppointmentsModel.deletePsychiatristAppointment(id);
          if (psychiatristResult) {
            console.log('Successfully deleted psychiatrist appointment');
            success = true;
          }
        } catch (err) {
          console.log('Not found in psychiatrist appointments table');
        }
      }
      
      if (!success) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }
      
      return res.json({ success: true, message: 'Appointment deleted successfully.' });
    }
    
    // For non-admin users, use original logic with permissions checking
    const [appointment] = await appointmentsModel.getAppointments({ id });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    if (appointment.created_by !== user.email && appointment.assigned_to !== user.full_name) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    const success = await appointmentsModel.deleteAppointment(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    res.json({ success: true, message: 'Appointment deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteAppointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPsychiatristAppointments = async (req, res) => {
  try {
    const appointments = await psychiatristAppointmentsModel.getAllPsychiatristAppointments();
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch psychiatrist appointments' });
  }
};

exports.getPsychiatristAppointmentsForUser = async (req, res) => {
  try {
    // Use req.user.id if available, else fallback to query param or full_name
    let psychiatrist_id = req.user && req.user.id;
    if (!psychiatrist_id && req.query.psychiatrist_id) psychiatrist_id = req.query.psychiatrist_id;
    if (!psychiatrist_id && req.query.full_name) {
      const psychiatrist = await psychiatristsModel.getPsychiatristByFullName(req.query.full_name);
      psychiatrist_id = psychiatrist ? psychiatrist.id : null;
    }
    if (!psychiatrist_id) {
      return res.status(400).json({ error: 'Missing psychiatrist_id or user not authenticated.' });
    }
    const appointments = await psychiatristAppointmentsModel.getPsychiatristAppointmentsByPsychiatristId(psychiatrist_id);
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch psychiatrist appointments for user' });
  }
};

// Public appointment creation (no authentication required)
exports.createPublicAppointment = async (req, res) => {
  try {
    const { role, name_patient, user_public_id, assigned_to, status, date_time, contact } = req.body;
    
    if (!role || !name_patient || !user_public_id || !assigned_to || !status || !date_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Creating public appointment:', { role, name_patient, user_public_id, assigned_to, status, date_time });

    // Business hours validation: 8:00 AM to 7:00 PM
    const appointmentDate = new Date(date_time);
    const hour = appointmentDate.getHours();
    
    if (hour < 8 || hour >= 19) {
      return res.status(400).json({ 
        error: 'Appointments can only be booked between 8:00 AM and 7:00 PM' 
      });
    }

    // Use contact from request or default
    const userContact = contact || 'user@example.com';
    
    if (role === 'Psychiatrist') {
      // Find psychiatrist by full name to get psychiatrist_id
      const psychiatrist = await psychiatristsModel.getPsychiatristByFullName(assigned_to);
      if (!psychiatrist) {
        return res.status(400).json({ error: 'Assigned psychiatrist not found' });
      }
      
      // Check for appointment conflict
      const hasConflict = await psychiatristAppointmentsModel.checkPsychiatristAppointmentConflict(
        psychiatrist.id, 
        date_time
      );
      
      if (hasConflict) {
        return res.status(409).json({ 
          error: 'This time slot is already booked. Please choose another hour.' 
        });
      }
      
      const appointmentData = {
        name_patient,
        user_public_id,
        contact: userContact,
        assigned_to,
        psychiatrist_id: psychiatrist.id,
        status,
        date_time,
        created_by: user_public_id // Use user_public_id as created_by for public appointments
      };
      
      const id = await psychiatristAppointmentsModel.createPsychiatristAppointment(appointmentData);
      
      // Send email and notification to psychiatrist
      try {
        const transporter = require('../utils/email');
        
        if (psychiatrist.email) {
          // Format date and time for email
          const appointmentDateTime = new Date(date_time);
          const formattedDate = appointmentDateTime.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
          });
          const formattedTime = appointmentDateTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          // Send email to psychiatrist
          await transporter.sendMail({
            from: `"Mental Health System" <${process.env.MAIL_USER}>`,
            to: psychiatrist.email,
            subject: 'New Appointment Scheduled - Action Required',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">📅 New Appointment Scheduled</h1>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #dee2e6;">
                  <h2 style="color: #333; margin-top: 0;">Hello Dr. ${psychiatrist.full_name}!</h2>
                  
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    You have a new psychiatrist consultation appointment scheduled with the following details:
                  </p>
                  
                  <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; font-weight: bold; color: #333; width: 30%;">Patient:</td>
                        <td style="padding: 10px 0; color: #555;">${name_patient}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; font-weight: bold; color: #333;">Date:</td>
                        <td style="padding: 10px 0; color: #555;">${formattedDate}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; font-weight: bold; color: #333;">Time:</td>
                        <td style="padding: 10px 0; color: #555;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-weight: bold; color: #333;">Contact:</td>
                        <td style="padding: 10px 0; color: #555;">${userContact}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8; margin: 20px 0;">
                    <p style="margin: 0; color: #0c5460; font-weight: bold;">
                      💡 Please log in to your dashboard to view and manage this appointment.
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/psychiatryst/appointments" 
                       style="background-color: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                      📋 View Appointments
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
          
          console.log('✅ Email sent to psychiatrist:', psychiatrist.email);
          
          // Create notification for psychiatrist
          console.log('🔔 Creating notification for psychiatrist:', {
            user_type: 'psychiatrist',
            user_id: psychiatrist.id,
            title: 'New appointment scheduled',
            message: `New appointment with ${name_patient} on ${formattedDate} at ${formattedTime}`
          });
          
          await notificationsModel.createNotification({
            user_type: 'psychiatrist',
            user_id: psychiatrist.id,
            title: 'New appointment scheduled',
            message: `New appointment with ${name_patient} on ${formattedDate} at ${formattedTime}`,
            data: {
              appointment_id: id,
              patient_name: name_patient,
              appointment_date: formattedDate,
              appointment_time: formattedTime,
              appointment_type: 'Psychiatrist Consultation',
              redirect_url: '/psychiatryst/appointments'
            }
          });
          
          console.log('✅ Notification created for psychiatrist:', psychiatrist.full_name);
        }
      } catch (emailError) {
        console.error('❌ Error sending appointment email/notification:', emailError);
        // Don't fail the entire request if email/notification fails
      }
      
      return res.status(201).json({ message: 'Psychiatrist appointment created successfully', id });
      
    } else if (role === 'Counselor') {
      // Use counselor_id from frontend if provided and valid
      let counselor_id = req.body.counselor_id;
      let counselor = null;
      if (!counselor_id) {
        // Fallback: Find counselor by full name to get counselor_id
        counselor = await counselorsModel.getCounselorByFullName(assigned_to);
        if (!counselor) {
          return res.status(400).json({ error: 'Assigned counselor not found' });
        }
        counselor_id = counselor.id;
      }
      // Check for appointment conflict
      const hasConflict = await appointmentsModel.checkAppointmentConflict(
        counselor_id, 
        date_time
      );
      if (hasConflict) {
        return res.status(409).json({ 
          error: 'This time slot is already booked. Please choose another hour.' 
        });
      }
      const appointmentData = {
        role,
        name_patient,
        user_public_id,
        contact: userContact,
        assigned_to,
        status,
        date_time,
        created_by: user_public_id, // Use user_public_id as created_by for public appointments
        counselor_id
      };
      const id = await appointmentsModel.createAppointment(appointmentData);
      
      // Get counselor details if not already fetched
      if (!counselor) {
        counselor = await counselorsModel.getCounselorById(counselor_id);
      }
      
      // Send email and notification to counselor
      try {
        const transporter = require('../utils/email');
        
        if (counselor && counselor.email) {
          // Format date and time for email
          const appointmentDateTime = new Date(date_time);
          const formattedDate = appointmentDateTime.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
          });
          const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          // Send email to counselor
          await transporter.sendMail({
            from: `"Mental Health System" <${process.env.MAIL_USER}>`,
            to: counselor.email,
            subject: 'New Appointment Scheduled - Action Required',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">📅 New Appointment Scheduled</h1>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #dee2e6;">
                  <h2 style="color: #333; margin-top: 0;">Hello ${counselor.full_name},</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #555;">
                    A new appointment has been scheduled with you. Please review the details below:
                  </p>
                  
                  <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <h3 style="color: #10b981; margin-top: 0;">Appointment Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Patient Name:</td>
                        <td style="padding: 8px 0; color: #555;">${name_patient}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Appointment Type:</td>
                        <td style="padding: 8px 0; color: #555;">Counseling Session</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Date:</td>
                        <td style="padding: 8px 0; color: #555;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Time:</td>
                        <td style="padding: 8px 0; color: #555;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Status:</td>
                        <td style="padding: 8px 0; color: #555;">${status}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Contact:</td>
                        <td style="padding: 8px 0; color: #555;">${userContact}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8; margin: 20px 0;">
                    <p style="margin: 0; color: #0c5460; font-weight: bold;">
                      💡 Please log in to your dashboard to view and manage this appointment.
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/counselor/appointments" 
                       style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                       📋 View Appointments
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
          
          console.log('✅ Email sent to counselor:', counselor.email);
          
          // Create notification for counselor
          console.log('🔔 Creating notification for counselor:', {
            user_type: 'counselor',
            user_id: counselor.id,
            title: 'New appointment scheduled',
            message: `New appointment with ${name_patient} on ${formattedDate} at ${formattedTime}`
          });
          
          await notificationsModel.createNotification({
            user_type: 'counselor',
            user_id: counselor.id,
            title: 'New appointment scheduled',
            message: `New appointment with ${name_patient} on ${formattedDate} at ${formattedTime}`,
            data: {
              appointment_id: id,
              patient_name: name_patient,
              appointment_date: formattedDate,
              appointment_time: formattedTime,
              appointment_type: 'Counseling Session',
              redirect_url: '/counselor/appointments'
            }
          });
          
          console.log('✅ Notification created for counselor:', counselor.full_name);
        }
      } catch (emailError) {
        console.error('❌ Error sending appointment email/notification:', emailError);
        // Don't fail the entire request if email/notification fails
      }
      
      return res.status(201).json({ message: 'Counselor appointment created successfully', id });
      
    } else {
      return res.status(400).json({ error: 'Invalid role. Must be "Counselor" or "Psychiatrist"' });
    }
    
  } catch (error) {
    console.error('Error creating public appointment:', error);
    res.status(500).json({ error: error.message || 'Server error while creating appointment' });
  }
};

// Public appointment retrieval (no authentication required)
exports.getPublicAppointments = async (req, res) => {
  try {
    const { user_public_id } = req.query;
    
    if (!user_public_id) {
      return res.status(400).json({ error: 'user_public_id parameter is required' });
    }
    
    console.log('Fetching appointments for user_public_id:', user_public_id);
    
    // Get counselor appointments using user_public_id
    const counselorAppointments = await appointmentsModel.getAppointmentsByUserId(user_public_id);
    console.log('Found counselor appointments:', counselorAppointments.length);
    
    // Get psychiatrist appointments using user_public_id
    const psychiatristAppointments = await psychiatristAppointmentsModel.getPsychiatristAppointmentsByUserId(user_public_id);
    console.log('Found psychiatrist appointments:', psychiatristAppointments.length);
    
    // Combine both appointment types
    const allAppointments = [
      ...counselorAppointments,
      ...psychiatristAppointments.map(apt => ({
        ...apt,
        role: 'Psychiatrist' // Add role field for consistency
      }))
    ];
    
    console.log('Total appointments returned:', allAppointments.length);
    
    res.json({ success: true, data: allAppointments });
  } catch (err) {
    console.error('Error fetching public appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Public appointment update (no authentication required)
exports.updatePublicAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, name_patient, user_public_id, assigned_to, status, date_time, contact } = req.body;
    
    if (!role || !name_patient || !user_public_id || !assigned_to || !status || !date_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Business hours validation: 8:00 AM to 7:00 PM
    const appointmentDate = new Date(date_time);
    const hour = appointmentDate.getHours();
    
    if (hour < 8 || hour >= 19) {
      return res.status(400).json({ 
        error: 'Appointments can only be booked between 8:00 AM and 7:00 PM' 
      });
    }
    
    // Use contact from request or default
    const userContact = contact || 'user@example.com';
    
    if (role === 'Psychiatrist') {
      // Find psychiatrist by full name to get psychiatrist_id
      const psychiatrist = await psychiatristsModel.getPsychiatristByFullName(assigned_to);
      if (!psychiatrist) {
        return res.status(400).json({ error: 'Assigned psychiatrist not found' });
      }
      
      // Check for appointment conflict (excluding current appointment)
      const hasConflict = await psychiatristAppointmentsModel.checkPsychiatristAppointmentConflict(
        psychiatrist.id, 
        date_time, 
        id // Exclude current appointment from conflict check
      );
      
      if (hasConflict) {
        return res.status(409).json({ 
          error: 'This time slot is already booked. Please choose another hour.' 
        });
      }
      
      // Update in psychiatrist_appointments table
      const success = await psychiatristAppointmentsModel.updatePsychiatristAppointment(id, {
        name_patient,
        user_public_id,
        contact: userContact,
        assigned_to,
        psychiatrist_id: psychiatrist.id,
        status,
        date_time
      });
      
      if (!success) {
        return res.status(404).json({ success: false, message: 'Psychiatrist appointment not found' });
      }
      
    } else if (role === 'Counselor') {
      // Use counselor_id from frontend if provided and valid
      let counselor_id = req.body.counselor_id;
      let counselor = null;
      if (!counselor_id) {
        // Fallback: Find counselor by full name to get counselor_id
        counselor = await counselorsModel.getCounselorByFullName(assigned_to);
        if (!counselor) {
          return res.status(400).json({ error: 'Assigned counselor not found' });
        }
        counselor_id = counselor.id;
      }
      // Check for appointment conflict (excluding current appointment)
      const hasConflict = await appointmentsModel.checkAppointmentConflict(
        counselor_id, 
        date_time, 
        id // Exclude current appointment from conflict check
      );
      if (hasConflict) {
        return res.status(409).json({ 
          error: 'This time slot is already booked. Please choose another hour.' 
        });
      }
      // Update in appointments table
      const success = await appointmentsModel.updateAppointment(id, {
        role,
        name_patient,
        user_public_id,
        contact: userContact,
        assigned_to,
        status,
        date_time,
        created_by: user_public_id,
        counselor_id
      });
      if (!success) {
        return res.status(404).json({ success: false, message: 'Counselor appointment not found' });
      }
      
    } else {
      return res.status(400).json({ error: 'Invalid role. Must be "Counselor" or "Psychiatrist"' });
    }
    
    res.json({ success: true, message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Error updating public appointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public appointment deletion (no authentication required)
exports.deletePublicAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to delete from both tables since we don't know which table the appointment is in
    let success = false;
    
    // First try appointments table
    const counselorResult = await appointmentsModel.deleteAppointment(id);
    if (counselorResult) {
      success = true;
    } else {
      // If not found in appointments, try psychiatrist_appointments table
      const psychiatristResult = await psychiatristAppointmentsModel.deletePsychiatristAppointment(id);
      if (psychiatristResult) {
        success = true;
      }
    }
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting public appointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 