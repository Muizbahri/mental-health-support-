const ngoActivitiesModel = require('../models/ngoActivities');

exports.getAllActivities = async (req, res) => {
  try {
    const activities = await ngoActivitiesModel.getAllActivities();
    
    // Ensure all dates are in consistent YYYY-MM-DD format
    const processedActivities = activities.map(activity => {
      if (activity.activity_date) {
        // Convert any datetime values to just the date part
        if (activity.activity_date instanceof Date) {
          const year = activity.activity_date.getFullYear();
          const month = String(activity.activity_date.getMonth() + 1).padStart(2, '0');
          const day = String(activity.activity_date.getDate()).padStart(2, '0');
          activity.activity_date = `${year}-${month}-${day}`;
        } else if (typeof activity.activity_date === 'string') {
          // If it's a datetime string, extract just the date part
          activity.activity_date = activity.activity_date.split('T')[0].split(' ')[0];
        }
      }
      return activity;
    });
    
    // Debug log: log the processed activity_date values
    console.log('PROCESSED ACTIVITIES:');
    processedActivities.forEach((activity, index) => {
      console.log(`Activity ${index + 1} - ID: ${activity.id}, Date: ${activity.activity_date}, Type: ${typeof activity.activity_date}`);
    });
    
    res.json({ success: true, data: processedActivities });
  } catch (error) {
    console.error('Error fetching NGO activities:', error);
    res.status(500).json({ message: 'Failed to fetch NGO activities', error: error.message });
  }
};

exports.createActivity = async (req, res) => {
  try {
    const activity = req.body;
    // Debug log: value received in backend
    console.log('RECEIVED ACTIVITY_DATE (create):', activity.activity_date, 'Type:', typeof activity.activity_date);
    
    // Map ngo_address from frontend to address for database
    if (activity.ngo_address) {
      activity.address = activity.ngo_address;
    }
    
    if (!activity.address || activity.address.trim() === '') {
      return res.status(400).json({ message: 'NGO Address is required.' });
    }
    
    // Attach file names if present
    if (req.files && req.files['ngo_registration_proof']) {
      activity.ngo_registration_proof = req.files['ngo_registration_proof'][0].filename;
    }
    if (req.files && req.files['supporting_document']) {
      activity.supporting_document = req.files['supporting_document'][0].filename;
    }
    
    // Process activity_date to ensure it's stored as a pure date without timezone conversion
    if (activity.activity_date) {
      // Ensure the date is in YYYY-MM-DD format and treat it as a local date
      const dateStr = String(activity.activity_date).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // It's already in the correct format, keep it as is
        activity.activity_date = dateStr;
      } else {
        // Try to parse and format it properly
        try {
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          activity.activity_date = `${year}-${month}-${day}`;
        } catch (error) {
          console.error('Date parsing error:', error);
          return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD format.' });
        }
      }
      console.log('SAVING ACTIVITY_DATE (create):', activity.activity_date, 'Type:', typeof activity.activity_date);
    }
    
    const id = await ngoActivitiesModel.createActivity(activity);
    res.json({ success: true, message: 'NGO activity submitted successfully', id });
  } catch (error) {
    console.error('NGO Insert Error:', error);
    res.status(500).json({ message: 'DB Insert Error', error: error.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const id = req.params.id;
    const activity = req.body;
    // Debug log: value received in backend
    console.log('RECEIVED ACTIVITY_DATE (update):', activity.activity_date, 'Type:', typeof activity.activity_date);
    
    // Attach file names if present
    if (req.files && req.files['ngo_registration_proof']) {
      activity.ngo_registration_proof = req.files['ngo_registration_proof'][0].filename;
    }
    if (req.files && req.files['supporting_document']) {
      activity.supporting_document = req.files['supporting_document'][0].filename;
    }
    
    // Map ngo_address from frontend to address for database
    if (activity.ngo_address) {
      activity.address = activity.ngo_address;
    }
    
    // If address is not provided, fetch the previous value and keep it
    if (!activity.address || activity.address.trim() === '') {
      const [rows] = await require('../models/db').query('SELECT address FROM ngo_activities WHERE id = ?', [id]);
      activity.address = rows[0]?.address || '';
      if (!activity.address) {
        return res.status(400).json({ message: 'NGO Address is required.' });
      }
    }
    
    // Process activity_date to ensure it's stored as a pure date without timezone conversion
    if (activity.activity_date) {
      // Ensure the date is in YYYY-MM-DD format and treat it as a local date
      const dateStr = String(activity.activity_date).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // It's already in the correct format, keep it as is
        activity.activity_date = dateStr;
      } else {
        // Try to parse and format it properly
        try {
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          activity.activity_date = `${year}-${month}-${day}`;
        } catch (error) {
          console.error('Date parsing error:', error);
          return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD format.' });
        }
      }
      console.log('SAVING ACTIVITY_DATE (update):', activity.activity_date, 'Type:', typeof activity.activity_date);
    }
    
    const success = await ngoActivitiesModel.updateActivity(id, activity);
    if (!success) return res.status(400).json({ message: 'No fields to update' });
    res.json({ success: true, message: 'NGO activity updated successfully' });
  } catch (error) {
    console.error('Error updating NGO activity:', error);
    res.status(500).json({ message: 'Failed to update NGO activity', error: error.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const id = req.params.id;
    const success = await ngoActivitiesModel.deleteActivity(id);
    if (!success) return res.status(404).json({ message: 'NGO activity not found' });
    res.json({ success: true, message: 'NGO activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting NGO activity:', error);
    res.status(500).json({ message: 'Failed to delete NGO activity', error: error.message });
  }
}; 