const notificationsModel = require('../models/notifications');

exports.getNotifications = async (req, res) => {
  try {
    const { user_type, user_id } = req.query;
    
    console.log('📨 getNotifications API called');
    console.log('📋 Request details:', {
      method: req.method,
      url: req.url,
      query: req.query,
      headers: req.headers,
      user_type,
      user_id
    });
    
    // Check if notificationsModel is available
    if (!notificationsModel) {
      console.error('❌ notificationsModel is not available');
      return res.status(500).json({
        success: false,
        message: 'Notifications model not initialized',
        error: 'Model not available'
      });
    }
    
    if (!user_type) {
      console.log('❌ user_type is missing');
      return res.status(400).json({
        success: false,
        message: 'user_type is required'
      });
    }
    
    // Validate user_type
    const validUserTypes = ['admin', 'counselor', 'psychiatrist', 'public_user'];
    if (!validUserTypes.includes(user_type)) {
      console.log('❌ Invalid user_type:', user_type);
      return res.status(400).json({
        success: false,
        message: 'Invalid user_type. Must be admin, counselor, psychiatrist, or public_user'
      });
    }
    
    const parsedUserId = user_id ? parseInt(user_id) : null;
    console.log('🔍 About to call getNotificationsByUser with:', { user_type, parsedUserId });
    
    // Check if the function exists
    if (!notificationsModel.getNotificationsByUser) {
      console.error('❌ getNotificationsByUser function not found');
      return res.status(500).json({
        success: false,
        message: 'getNotificationsByUser function not available',
        error: 'Function not found'
      });
    }
    
    const notifications = await notificationsModel.getNotificationsByUser(
      user_type, 
      parsedUserId
    );
    
    console.log('✅ Retrieved notifications:', notifications?.length || 0, 'notifications for', user_type, 'user_id:', parsedUserId);
    if (notifications && notifications.length > 0) {
      console.log('📋 First notification:', notifications[0]);
    }
    
    res.json({
      success: true,
      data: notifications || [],
      count: notifications?.length || 0
    });
  } catch (error) {
    console.error('❌ Error in getNotifications controller:');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    
    // Send detailed error for debugging
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching notifications',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { user_type, user_id } = req.query;
    
    console.log('getUnreadCount API called with params:', { user_type, user_id, query: req.query });
    
    if (!user_type) {
      return res.status(400).json({
        success: false,
        message: 'user_type is required'
      });
    }
    
    const parsedUserId = user_id ? parseInt(user_id) : null;
    console.log('Calling getUnreadCount with:', { user_type, parsedUserId });
    
    const count = await notificationsModel.getUnreadCount(
      user_type, 
      parsedUserId
    );
    
    console.log('Retrieved unread count:', count, 'for', user_type, 'user_id:', parsedUserId);
    
    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      count: 0
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await notificationsModel.markNotificationAsRead(parseInt(id));
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { user_type, user_id } = req.body;
    
    if (!user_type) {
      return res.status(400).json({
        success: false,
        message: 'user_type is required'
      });
    }
    
    const count = await notificationsModel.markAllNotificationsAsRead(
      user_type, 
      user_id ? parseInt(user_id) : null
    );
    
    res.json({
      success: true,
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await notificationsModel.deleteNotification(parseInt(id));
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
}; 