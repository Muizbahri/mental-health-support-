const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

// GET /api/notifications/test - Test endpoint to verify API is working
router.get('/test', (req, res) => {
  console.log('🧪 Notifications test endpoint called');
  res.json({
    success: true,
    message: 'Notifications API is working correctly',
    timestamp: new Date().toISOString(),
    endpoint: '/api/notifications',
    environment: {
      BASE_URL: process.env.BASE_URL || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  });
});

// GET /api/notifications/test-email-urls - Test email URL generation
router.get('/test-email-urls', (req, res) => {
  const baseUrl = process.env.BASE_URL;
  
  res.json({
    success: true,
    message: 'Email URL generation test',
    baseUrl: baseUrl || 'BASE_URL not set',
    generatedUrls: {
      counselorAppointments: `${baseUrl}/counselor/appointments`,
      psychiatristAppointments: `${baseUrl}/psychiatryst/appointments`,
      adminEmergency: `${baseUrl}/admin/manage-emergency`,
      counselorEmergency: `${baseUrl}/counselor/emergency-reports`,
      psychiatristEmergency: `${baseUrl}/psychiatryst/emergency-cases`
    },
    timestamp: new Date().toISOString()
  });
});

// POST /api/notifications/test-appointment-bidirectional - Test bidirectional appointment notifications
router.post('/test-appointment-bidirectional', async (req, res) => {
  try {
    const notificationsModel = require('../models/notifications');
    
    // Create test notifications for the bidirectional flow
    const testNotifications = [
      // 1. User books appointment -> Notification for counselor
      {
        user_type: 'counselor',
        user_id: 1,
        title: 'New appointment scheduled',
        message: 'New appointment with Nur Aina Zulaikha on 28/07/2025 at 10:00 AM',
        data: {
          appointment_id: 1001,
          patient_name: 'Nur Aina Zulaikha',
          appointment_date: '28/07/2025',
          appointment_time: '10:00 AM',
          appointment_type: 'Counseling Session',
          redirect_url: '/counselor/appointments'
        }
      },
      // 2. Counselor accepts -> Notification for user_public
      {
        user_type: 'user_public',
        user_id: 1,
        title: 'Appointment accepted',
        message: 'Your appointment request with Siti Aminah has been accepted',
        data: {
          appointment_id: 1001,
          professional_name: 'Siti Aminah',
          appointment_date: '28/07/2025',
          appointment_time: '10:00 AM',
          appointment_type: 'Counseling Session',
          status: 'Accepted',
          redirect_url: '/user-public/appointments'
        }
      },
      // 3. User books appointment -> Notification for psychiatrist
      {
        user_type: 'psychiatrist',
        user_id: 1,
        title: 'New appointment scheduled',
        message: 'New appointment with John Smith on 29/07/2025 at 2:00 PM',
        data: {
          appointment_id: 1002,
          patient_name: 'John Smith',
          appointment_date: '29/07/2025',
          appointment_time: '2:00 PM',
          appointment_type: 'Psychiatrist Consultation',
          redirect_url: '/psychiatryst/appointments'
        }
      },
      // 4. Psychiatrist rejects -> Notification for user_public
      {
        user_type: 'user_public',
        user_id: 2,
        title: 'Appointment rejected',
        message: 'Your appointment request with Dr. Aiman Zaid has been rejected',
        data: {
          appointment_id: 1002,
          professional_name: 'Dr. Aiman Zaid',
          appointment_date: '29/07/2025',
          appointment_time: '2:00 PM',
          appointment_type: 'Psychiatrist Consultation',
          status: 'Rejected',
          redirect_url: '/user-public/appointments'
        }
      }
    ];
    
    const createdIds = [];
    for (const notification of testNotifications) {
      const id = await notificationsModel.createNotification(notification);
      createdIds.push(id);
    }
    
    res.json({
      success: true,
      message: 'Bidirectional appointment notification flow test completed',
      flow: [
        '1. User books appointment → Counselor/Psychiatrist gets notification',
        '2. Professional accepts/rejects → User gets notification'
      ],
      created_notification_ids: createdIds,
      count: createdIds.length,
      test_scenarios: [
        'Counselor receives booking notification',
        'User receives acceptance notification',
        'Psychiatrist receives booking notification', 
        'User receives rejection notification'
      ]
    });
  } catch (error) {
    console.error('Error creating bidirectional test notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bidirectional test notifications',
      error: error.message
    });
  }
});

// POST /api/notifications/test-appointment - Test appointment notification creation
router.post('/test-appointment', async (req, res) => {
  try {
    const notificationsModel = require('../models/notifications');
    
    // Create test appointment notifications
    const testNotifications = [
      {
        user_type: 'counselor',
        user_id: 1,
        title: 'New appointment scheduled',
        message: 'New appointment with John Doe on 28/07/2025 at 10:00 AM',
        data: {
          appointment_id: 999,
          patient_name: 'John Doe',
          appointment_date: '28/07/2025',
          appointment_time: '10:00 AM',
          appointment_type: 'Counseling Session',
          redirect_url: '/counselor/appointments'
        }
      },
      {
        user_type: 'psychiatrist',
        user_id: 1,
        title: 'New appointment scheduled',
        message: 'New appointment with Jane Smith on 29/07/2025 at 2:00 PM',
        data: {
          appointment_id: 998,
          patient_name: 'Jane Smith',
          appointment_date: '29/07/2025',
          appointment_time: '2:00 PM',
          appointment_type: 'Psychiatrist Consultation',
          redirect_url: '/psychiatryst/appointments'
        }
      }
    ];
    
    const createdIds = [];
    for (const notification of testNotifications) {
      const id = await notificationsModel.createNotification(notification);
      createdIds.push(id);
    }
    
    res.json({
      success: true,
      message: 'Test appointment notifications created successfully',
      created_notification_ids: createdIds,
      count: createdIds.length
    });
  } catch (error) {
    console.error('Error creating test notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notifications',
      error: error.message
    });
  }
});

// GET /api/notifications - Get notifications for a user
router.get('/', notificationsController.getNotifications);

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', notificationsController.getUnreadCount);

// PUT /api/notifications/:id/read - Mark a specific notification as read
router.put('/:id/read', notificationsController.markAsRead);

// PUT /api/notifications/mark-all-read - Mark all notifications as read for a user
router.put('/mark-all-read', notificationsController.markAllAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', notificationsController.deleteNotification);

module.exports = router; 