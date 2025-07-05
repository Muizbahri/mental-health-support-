const emergencyCaseModel = require('../models/emergencyCase');
const counselorsModel = require('../models/counselors');
const psychiatristsModel = require('../models/psychiatrists');

exports.createEmergencyCase = async (req, res) => {
  try {
    const { name_patient, ic_number, date_time, status, assigned_to, role } = req.body;
    if (!name_patient || !ic_number || !date_time || !status || !assigned_to || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    let counselor_id = null;
    let psychiatrist_id = null;
    
    console.log('Processing emergency case assignment:', { role, assigned_to });
    
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
      
      counselor_id = counselor.id;
      console.log('Counselor assigned:', { name: counselor.full_name, id: counselor_id });
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
      
      psychiatrist_id = psychiatrist.id;
      console.log('Psychiatrist assigned:', { name: psychiatrist.full_name, id: psychiatrist_id });
    }
    const id = await emergencyCaseModel.createEmergencyCase({ name_patient, ic_number, date_time, status, assigned_to, role, counselor_id, psychiatrist_id });
    res.status(201).json({ success: true, message: 'Emergency case created successfully', id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllEmergencyCases = async (req, res) => {
  try {
    let filter = {};
    if (req.query.psychiatrist_id) {
      filter.psychiatrist_id = req.query.psychiatrist_id;
    } else if (req.query.counselor_id) {
      filter.counselor_id = req.query.counselor_id;
    }
    const cases = await emergencyCaseModel.getAllEmergencyCases(filter);
    res.json({ success: true, data: cases });
  } catch (error) {
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
    const { name_patient, ic_number, date_time, status, assigned_to, role } = req.body;
    if (!name_patient || !ic_number || !date_time || !status || !assigned_to || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Get the current case to check existing assignment
    const currentCase = await emergencyCaseModel.getEmergencyCaseById(id);
    if (!currentCase) {
      return res.status(404).json({ success: false, message: 'Emergency case not found.' });
    }

    let counselor_id = null;
    let psychiatrist_id = null;
    
    console.log('Updating emergency case assignment:', { id, role, assigned_to });
    console.log('Current case assignment:', { 
      current_assigned_to: currentCase.assigned_to, 
      current_psychiatrist_id: currentCase.psychiatrist_id,
      current_counselor_id: currentCase.counselor_id 
    });
    
    if (role === 'Counselor') {
      let counselor = await counselorsModel.getCounselorByEmail(assigned_to);
      if (!counselor) {
        counselor = await counselorsModel.getCounselorByFullName(assigned_to);
      }
      if (!counselor) {
        console.log('Counselor not found during update:', assigned_to);
        return res.status(400).json({ success: false, message: 'Assigned counselor not found.' });
      }
      
      // Only check self-assignment if the assignment is actually changing
      const isAssignmentChanging = currentCase.counselor_id !== counselor.id;
      if (isAssignmentChanging && req.user && req.user.role === 'counselor' && req.user.id === counselor.id) {
        console.log('Self-assignment attempt blocked (update):', { user_id: req.user.id, assigned_id: counselor.id });
        return res.status(400).json({ success: false, message: 'You cannot assign an emergency case to yourself.' });
      }
      
      counselor_id = counselor.id;
      console.log('Counselor assigned during update:', { name: counselor.full_name, id: counselor_id, assignment_changed: isAssignmentChanging });
    } else if (role === 'Psychiatrist') {
      let psychiatrist = await psychiatristsModel.getPsychiatristByEmail(assigned_to);
      if (!psychiatrist) {
        psychiatrist = await psychiatristsModel.getPsychiatristByFullName(assigned_to);
      }
      if (!psychiatrist) {
        console.log('Psychiatrist not found during update:', assigned_to);
        return res.status(400).json({ success: false, message: 'Assigned psychiatrist not found.' });
      }
      
      // Only check self-assignment if the assignment is actually changing
      const isAssignmentChanging = currentCase.psychiatrist_id !== psychiatrist.id;
      if (isAssignmentChanging && req.user && req.user.role === 'psychiatrist' && req.user.id === psychiatrist.id) {
        console.log('Self-assignment attempt blocked (update):', { user_id: req.user.id, assigned_id: psychiatrist.id });
        return res.status(400).json({ success: false, message: 'You cannot assign an emergency case to yourself.' });
      }
      
      psychiatrist_id = psychiatrist.id;
      console.log('Psychiatrist assigned during update:', { name: psychiatrist.full_name, id: psychiatrist_id, assignment_changed: isAssignmentChanging });
    }
    const success = await emergencyCaseModel.updateEmergencyCase(id, { name_patient, ic_number, date_time, status, assigned_to, role, counselor_id, psychiatrist_id });
    if (!success) return res.status(404).json({ success: false, message: 'Emergency case not found.' });
    res.json({ success: true, message: 'Emergency case updated successfully.' });
  } catch (error) {
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
    
    res.status(201).json({ success: true, message: 'Emergency case submitted successfully', id });
  } catch (error) {
    console.error('Error creating public emergency case:', error);
    res.status(500).json({ success: false, message: 'Failed to submit emergency case' });
  }
}; 