const db = require('../config/db');
const psychiatristAppointmentsModel = require('../models/psychiatristAppointments');

exports.getPsychiatristAppointments = async (req, res) => {
    const psychiatristId = req.query.psychiatrist_id;
    if (!psychiatristId) return res.status(400).json({ error: 'Missing psychiatrist_id' });
    const rows = await psychiatristAppointmentsModel.getAppointmentsForPsychiatrist(psychiatristId);
    res.json({ data: rows });
};

exports.getAppointmentsByPsychiatrist = async (req, res) => {
    const psychiatrist_id = req.params.psychiatrist_id;
    const rows = await psychiatristAppointmentsModel.getAppointmentsForPsychiatrist(psychiatrist_id);
    res.json({ data: rows });
}; 

exports.createPsychiatristAppointment = async (req, res) => {
    try {
        const { psychiatrist_id } = req.params;
        const { name_patient, contact, assigned_to, status, date_time, created_by } = req.body;
        
        console.log('🎯 Creating psychiatrist appointment with:');
        console.log('  - psychiatrist_id:', psychiatrist_id, '(type:', typeof psychiatrist_id, ')');
        console.log('  - name_patient:', name_patient, '(type:', typeof name_patient, ')');
        console.log('  - contact:', contact, '(type:', typeof contact, ')');
        console.log('  - assigned_to:', assigned_to, '(type:', typeof assigned_to, ')');
        console.log('  - status:', status, '(type:', typeof status, ')');
        console.log('  - date_time:', date_time, '(type:', typeof date_time, ')');
        console.log('  - created_by:', created_by, '(type:', typeof created_by, ')');
        console.log('📋 Full req.body:', req.body);
        
        // Detailed field validation with specific error messages
        const missingFields = [];
        if (!name_patient || name_patient.trim() === '') missingFields.push('name_patient');
        if (!contact || contact.trim() === '') missingFields.push('contact');
        if (!assigned_to || assigned_to.trim() === '') missingFields.push('assigned_to');
        if (!status || status.trim() === '') missingFields.push('status');
        if (!date_time || date_time.trim() === '') missingFields.push('date_time');
        if (!created_by || created_by.trim() === '') missingFields.push('created_by');
        
        if (missingFields.length > 0) {
            console.log('❌ Missing fields:', missingFields);
            return res.status(400).json({ 
                success: false, 
                message: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }
        
        console.log('✅ All required fields validated');
        
        // Check for conflicts
        const hasConflict = await psychiatristAppointmentsModel.checkPsychiatristAppointmentConflict(
            psychiatrist_id, 
            date_time
        );
        
        if (hasConflict) {
            console.log('⚠️ Time slot conflict detected');
            return res.status(409).json({ 
                success: false, 
                message: 'Time slot conflict: Another appointment exists at this time' 
            });
        }
        
        console.log('✅ No time conflicts found');
        
        const appointmentData = {
            name_patient,
            contact,
            assigned_to,
            psychiatrist_id,
            status,
            date_time,
            created_by
        };
        
        console.log('📤 Calling model with data:', appointmentData);
        
        const appointmentId = await psychiatristAppointmentsModel.createPsychiatristAppointment(appointmentData);
        
        console.log('🎉 Psychiatrist appointment created successfully with ID:', appointmentId);
        res.status(201).json({ 
            success: true, 
            message: 'Psychiatrist appointment created successfully',
            id: appointmentId
        });
    } catch (err) {
        console.error('💥 Error creating psychiatrist appointment:', err);
        console.error('📍 Error stack:', err.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create psychiatrist appointment: ' + err.message 
        });
    }
};

exports.updatePsychiatristAppointment = async (req, res) => {
    try {
        const { psychiatrist_id, id } = req.params;
        let { name_patient, contact, assigned_to, status, date_time, user_public_id } = req.body;
        
        console.log('🔍 updatePsychiatristAppointment called with:', {
            psychiatrist_id,
            id,
            name_patient,
            status,
            user_public_id
        });
        
        // Fetch current appointment if name_patient is missing or blank
        let currentAppointment = null;
        if (!name_patient || name_patient.trim() === "") {
            const [rows] = await db.query('SELECT name_patient, user_public_id FROM psychiatrist_appointments WHERE id = ?', [id]);
            if (rows.length > 0) {
                currentAppointment = rows[0];
                if (!name_patient || name_patient.trim() === "") {
                    name_patient = currentAppointment.name_patient;
                }
                // Keep the original user_public_id if not provided in update (allow NULL)
                if (user_public_id === undefined) {
                    user_public_id = currentAppointment.user_public_id;
                }
            } else {
                return res.status(404).json({ success: false, message: 'Appointment not found for update' });
            }
        }
        
        console.log('Updating psychiatrist appointment:', {
            id,
            psychiatrist_id,
            name_patient,
            contact,
            assigned_to,
            status,
            date_time,
            user_public_id
        });
        
        if (!name_patient || !contact || !assigned_to || !status || !date_time) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: name_patient, contact, assigned_to, status, date_time' 
            });
        }
        
        // Check for conflicts (excluding current appointment)
        const hasConflict = await psychiatristAppointmentsModel.checkPsychiatristAppointmentConflict(
            psychiatrist_id, 
            date_time, 
            id
        );
        
        if (hasConflict) {
            return res.status(409).json({ 
                success: false, 
                message: 'Time slot conflict: Another appointment exists at this time' 
            });
        }
        
        // Get current appointment data to check for status changes
        const existingAppointment = await psychiatristAppointmentsModel.getPsychiatristAppointmentById(id);
        const previousStatus = existingAppointment ? existingAppointment.status : null;
        const statusChanged = previousStatus !== status;
        
        console.log('🔍 Psychiatrist status change detection:', {
          appointmentId: id,
          previousStatus,
          newStatus: status,
          statusChanged,
          user_public_id,
          willSendNotification: statusChanged && user_public_id && (status === 'Accepted' || status === 'Rejected')
        });
        
        const success = await psychiatristAppointmentsModel.updatePsychiatristAppointment(id, {
            name_patient,
            user_public_id,
            contact,
            assigned_to,
            psychiatrist_id,
            status,
            date_time
        });
        
        if (success) {
            console.log('Psychiatrist appointment updated successfully');
            
            // Send notification and email to user_public if status changed to Accepted or Rejected
            if (statusChanged && user_public_id && (status === 'Accepted' || status === 'Rejected')) {
                console.log('✅ Triggering email and notification for user_public (psychiatrist):', user_public_id);
                try {
                    // Get user_public details
                    const publicUsersModel = require('../models/publicUser');
                    const publicUser = await publicUsersModel.getPublicUserById(user_public_id);
                    
                    if (publicUser) {
                        const transporter = require('../utils/email');
                        const notificationsModel = require('../models/notifications');
                        
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
                        
                        // Determine email content based on status
                        const isAccepted = status === 'Accepted';
                        const statusIcon = isAccepted ? '✅' : '❌';
                        const statusColor = isAccepted ? '#4f46e5' : '#ef4444';
                        const statusText = isAccepted ? 'ACCEPTED' : 'REJECTED';
                        const actionMessage = isAccepted 
                            ? 'Your appointment has been confirmed. Please arrive on time for your consultation.'
                            : 'Unfortunately, your appointment request could not be accommodated. You may book a different time slot.';
                        
                        // Send email to user_public
                        await transporter.sendMail({
                            from: `"Mental Health System" <${process.env.MAIL_USER}>`,
                            to: publicUser.email,
                            subject: `Appointment ${statusText} - Dr. ${assigned_to}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                    <div style="background-color: ${statusColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                                        <h1 style="margin: 0; font-size: 24px;">${statusIcon} Appointment ${statusText}</h1>
                                    </div>
                                    
                                    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #dee2e6;">
                                        <h2 style="color: #333; margin-top: 0;">Hello ${publicUser.full_name},</h2>
                                        <p style="font-size: 16px; line-height: 1.6; color: #555;">
                                            Your appointment request with Dr. ${assigned_to} has been <strong>${status.toLowerCase()}</strong>.
                                        </p>
                                        
                                        <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${statusColor};">
                                            <h3 style="color: ${statusColor}; margin-top: 0;">Appointment Details:</h3>
                                            <table style="width: 100%; border-collapse: collapse;">
                                                <tr>
                                                    <td style="padding: 8px 0; font-weight: bold; color: #333;">Psychiatrist:</td>
                                                    <td style="padding: 8px 0; color: #555;">Dr. ${assigned_to}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; font-weight: bold; color: #333;">Appointment Type:</td>
                                                    <td style="padding: 8px 0; color: #555;">Psychiatrist Consultation</td>
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
                                                    <td style="padding: 8px 0; color: ${statusColor}; font-weight: bold;">${status}</td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <div style="background-color: ${isAccepted ? '#d1ecf1' : '#f8d7da'}; padding: 15px; border-radius: 6px; border-left: 4px solid ${isAccepted ? '#17a2b8' : '#dc3545'}; margin: 20px 0;">
                                            <p style="margin: 0; color: ${isAccepted ? '#0c5460' : '#721c24'}; font-weight: bold;">
                                                📋 ${actionMessage}
                                            </p>
                                        </div>
                                        
                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="${process.env.BASE_URL}/user-public/appointments" 
                                               style="background-color: ${statusColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                                               📅 View My Appointments
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
                        
                        console.log('✅ Email sent to user_public:', publicUser.email);
                        
                        // Create notification for user_public
                        await notificationsModel.createNotification({
                            user_type: 'user_public',
                            user_id: user_public_id,
                            title: `Appointment ${status.toLowerCase()}`,
                            message: `Your appointment request with Dr. ${assigned_to} has been ${status.toLowerCase()}`,
                            data: {
                                appointment_id: id,
                                professional_name: assigned_to,
                                appointment_date: formattedDate,
                                appointment_time: formattedTime,
                                appointment_type: 'Psychiatrist Consultation',
                                status: status,
                                redirect_url: '/user-public/appointments'
                            }
                        });
                        
                        console.log('✅ Notification created for user_public:', publicUser.full_name);
                    }
                } catch (emailError) {
                    console.error('❌ Error sending appointment status email/notification to user_public:', emailError);
                    // Don't fail the entire request if email/notification fails
                }
            }
            
            res.json({ 
                success: true, 
                message: 'Psychiatrist appointment updated successfully' 
            });
        } else {
            console.log('Psychiatrist appointment not found for update');
            res.status(404).json({ 
                success: false, 
                message: 'Psychiatrist appointment not found' 
            });
        }
    } catch (err) {
        console.error('Error updating psychiatrist appointment:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update psychiatrist appointment: ' + err.message 
        });
    }
};

exports.deletePsychiatristAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ success: false, message: 'Appointment ID is required' });
        }
        
        console.log('Deleting psychiatrist appointment with ID:', id);
        
        const success = await psychiatristAppointmentsModel.deletePsychiatristAppointment(id);
        
        if (success) {
            console.log('Psychiatrist appointment deleted successfully');
            res.json({ success: true, message: 'Psychiatrist appointment deleted successfully' });
        } else {
            console.log('Psychiatrist appointment not found');
            res.status(404).json({ success: false, message: 'Psychiatrist appointment not found' });
        }
    } catch (err) {
        console.error('Error deleting psychiatrist appointment:', err);
        res.status(500).json({ success: false, message: 'Failed to delete psychiatrist appointment' });
    }
}; 