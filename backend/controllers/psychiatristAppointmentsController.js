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