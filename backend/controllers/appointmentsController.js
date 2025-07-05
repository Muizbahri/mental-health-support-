const appointmentsModel = require('../models/appointments');
const { authenticateToken, isAdmin, isCounselor } = require('../middleware/authMiddleware');
const counselorsModel = require('../models/counselors');
const psychiatristAppointmentsModel = require('../models/psychiatristAppointments');
const psychiatristsModel = require('../models/psychiatrists');

exports.createAppointment = async (req, res) => {
  try {
    const { role, name_patient, contact, assigned_to, status, date_time } = req.body;
    if (!role || !name_patient || !contact || !assigned_to || !status || !date_time) {
      return res.status(400).json({ error: 'Missing required fields' });
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
    const id = await appointmentsModel.createAppointment({ role, name_patient, contact, assigned_to, status, date_time, created_by, counselor_id });
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
    const { role, name_patient, contact, assigned_to, status, date_time } = req.body;
    const user = req.user;
    // Fetch the appointment to check ownership
    const [appointment] = await appointmentsModel.getAppointments({ id });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    if (user.role !== 'admin' && appointment.created_by !== user.email && appointment.assigned_to !== user.full_name) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    const success = await appointmentsModel.updateAppointment(id, { role, name_patient, contact, assigned_to, status, date_time, created_by: appointment.created_by });
    if (!success) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
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
    const { role, name_patient, assigned_to, status, date_time, contact } = req.body;
    
    if (!role || !name_patient || !assigned_to || !status || !date_time) {
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
        contact: userContact,
        assigned_to,
        psychiatrist_id: psychiatrist.id,
        status,
        date_time,
        created_by: name_patient // Use patient name as created_by for public appointments
      };
      
      const id = await psychiatristAppointmentsModel.createPsychiatristAppointment(appointmentData);
      return res.status(201).json({ message: 'Psychiatrist appointment created successfully', id });
      
    } else if (role === 'Counselor') {
      // Find counselor by full name to get counselor_id
      const counselor = await counselorsModel.getCounselorByFullName(assigned_to);
      if (!counselor) {
        return res.status(400).json({ error: 'Assigned counselor not found' });
      }
      
      // Check for appointment conflict
      const hasConflict = await appointmentsModel.checkAppointmentConflict(
        counselor.id, 
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
        contact: userContact,
        assigned_to,
        status,
        date_time,
        created_by: name_patient, // Use patient name as created_by for public appointments
        counselor_id: counselor.id
      };
      
      const id = await appointmentsModel.createAppointment(appointmentData);
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
    const { user } = req.query;
    
    if (!user) {
      return res.status(400).json({ error: 'User parameter is required' });
    }
    
    console.log('Fetching appointments for user:', user);
    
    // Get counselor appointments using broader filter
    // Filter by both name_patient and created_by to catch appointments created by the user
    const allCounselorAppointments = await appointmentsModel.getAppointments({});
    
    // Filter counselor appointments more robustly
    const counselorAppointments = allCounselorAppointments.filter(apt => {
      const nameMatch = apt.name_patient && apt.name_patient.trim().toLowerCase() === user.trim().toLowerCase();
      const createdByMatch = apt.created_by && apt.created_by.trim().toLowerCase() === user.trim().toLowerCase();
      return nameMatch || createdByMatch;
    });
    
    console.log('Found counselor appointments:', counselorAppointments.length);
    
    // Get all psychiatrist appointments and filter
    const allPsychiatristAppointments = await psychiatristAppointmentsModel.getAllPsychiatristAppointments();
    
    // Filter psychiatrist appointments more robustly
    const userPsychiatristAppointments = allPsychiatristAppointments.filter(apt => {
      const nameMatch = apt.name_patient && apt.name_patient.trim().toLowerCase() === user.trim().toLowerCase();
      const createdByMatch = apt.created_by && apt.created_by.trim().toLowerCase() === user.trim().toLowerCase();
      return nameMatch || createdByMatch;
    });
    
    console.log('Found psychiatrist appointments:', userPsychiatristAppointments.length);
    
    // Combine both appointment types
    const allAppointments = [
      ...counselorAppointments,
      ...userPsychiatristAppointments.map(apt => ({
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
    const { role, name_patient, assigned_to, status, date_time, contact } = req.body;
    
    if (!role || !name_patient || !assigned_to || !status || !date_time) {
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
      // Find counselor by full name to get counselor_id
      const counselor = await counselorsModel.getCounselorByFullName(assigned_to);
      if (!counselor) {
        return res.status(400).json({ error: 'Assigned counselor not found' });
      }
      
      // Check for appointment conflict (excluding current appointment)
      const hasConflict = await appointmentsModel.checkAppointmentConflict(
        counselor.id, 
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
        contact: userContact,
        assigned_to,
        status,
        date_time,
        created_by: name_patient
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