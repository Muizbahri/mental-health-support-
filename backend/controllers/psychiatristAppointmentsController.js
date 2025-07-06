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
        
        console.log('Creating psychiatrist appointment:', {
            psychiatrist_id,
            name_patient,
            contact,
            assigned_to,
            status,
            date_time,
            created_by
        });
        
        if (!name_patient || !contact || !assigned_to || !status || !date_time || !created_by) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: name_patient, contact, assigned_to, status, date_time, created_by' 
            });
        }
        
        // Check for conflicts
        const hasConflict = await psychiatristAppointmentsModel.checkPsychiatristAppointmentConflict(
            psychiatrist_id, 
            date_time
        );
        
        if (hasConflict) {
            return res.status(409).json({ 
                success: false, 
                message: 'Time slot conflict: Another appointment exists at this time' 
            });
        }
        
        const appointmentId = await psychiatristAppointmentsModel.createPsychiatristAppointment({
            name_patient,
            contact,
            assigned_to,
            psychiatrist_id,
            status,
            date_time,
            created_by
        });
        
        console.log('Psychiatrist appointment created successfully with ID:', appointmentId);
        res.status(201).json({ 
            success: true, 
            message: 'Psychiatrist appointment created successfully',
            id: appointmentId
        });
    } catch (err) {
        console.error('Error creating psychiatrist appointment:', err);
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
        
        // Fetch current appointment if name_patient or user_public_id is missing or blank
        let currentAppointment = null;
        if (!name_patient || name_patient.trim() === "" || !user_public_id) {
            const [rows] = await db.query('SELECT name_patient, user_public_id FROM psychiatrist_appointments WHERE id = ?', [id]);
            if (rows.length > 0) {
                currentAppointment = rows[0];
                if (!name_patient || name_patient.trim() === "") {
                    name_patient = currentAppointment.name_patient;
                }
                if (!user_public_id) {
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
        
        if (!name_patient || !contact || !assigned_to || !status || !date_time || !user_public_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: name_patient, contact, assigned_to, status, date_time, user_public_id' 
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