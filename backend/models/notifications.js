const db = require('../config/db');

// Create notifications table if it doesn't exist
const createNotificationsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_type ENUM('admin', 'counselor', 'psychiatrist') NOT NULL,
      user_id INT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      data JSON,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_type_id (user_type, user_id),
      INDEX idx_created_at (created_at),
      INDEX idx_is_read (is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  try {
    await db.query(createTableQuery);
    console.log('✅ Notifications table created or verified successfully');
    
    // Insert some test notifications to verify the system works
    const testNotifications = [
      {
        user_type: 'admin',
        user_id: null,
        title: 'System Ready',
        message: 'Notification system is working correctly',
        data: JSON.stringify({ test: true, redirect_url: '/admin/dashboard' })
      },
      {
        user_type: 'counselor',
        user_id: 1,
        title: 'Test notification for counselor',
        message: 'This is a test notification for counselor dashboard',
        data: JSON.stringify({ test: true, redirect_url: '/counselor/emergency-reports' })
      },
      {
        user_type: 'psychiatrist',
        user_id: 1,
        title: 'Test notification for psychiatrist',
        message: 'This is a test notification for psychiatrist dashboard',
        data: JSON.stringify({ test: true, redirect_url: '/psychiatryst/emergency-cases' })
      }
    ];
    
    for (const notification of testNotifications) {
      try {
        const [existing] = await db.query(
          'SELECT id FROM notifications WHERE user_type = ? AND title = ? LIMIT 1',
          [notification.user_type, notification.title]
        );
        
        if (existing.length === 0) {
          await db.query(
            'INSERT INTO notifications (user_type, user_id, title, message, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [notification.user_type, notification.user_id, notification.title, notification.message, notification.data]
          );
          console.log('✅ Test notification created for', notification.user_type);
        }
      } catch (err) {
        console.error('Error creating test notification:', err);
      }
    }
  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
  }
};

// Initialize table when module loads
createNotificationsTable().catch(error => {
  console.error('❌ Failed to initialize notifications table:', error);
});

// Test database connection on module load
(async () => {
  try {
    const [result] = await db.query('SELECT 1 as test');
    console.log('✅ Database connection verified in notifications model');
  } catch (error) {
    console.error('❌ Database connection failed in notifications model:', error.message);
  }
})();

exports.createNotification = async ({ user_type, user_id, title, message, data }) => {
  try {
    console.log('📝 Creating notification:', { user_type, user_id, title, message });
    const [result] = await db.query(
      'INSERT INTO notifications (user_type, user_id, title, message, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [user_type, user_id || null, title, message || null, data ? JSON.stringify(data) : null]
    );
    console.log('✅ Notification created with ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

// Test database connection
exports.testConnection = async () => {
  try {
    const [result] = await db.query('SELECT 1 as test');
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

exports.getNotificationsByUser = async (user_type, user_id = null) => {
  try {
    console.log('📊 getNotificationsByUser called with:', { user_type, user_id });
    
    // Check database connection first
    if (!db) {
      console.error('❌ Database connection not available');
      throw new Error('Database connection not available');
    }
    
    let query = 'SELECT * FROM notifications WHERE user_type = ?';
    let params = [user_type];
    
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 20';
    
    console.log('🔍 Executing query:', query);
    console.log('🔍 With params:', params);
    
    const [rows] = await db.query(query, params);
    
    console.log('📊 Database returned:', rows?.length || 0, 'rows');
    
    if (!rows) {
      console.log('⚠️ Query returned null/undefined rows');
      return [];
    }
    
    console.log('📋 First few raw rows:', rows.slice(0, 2));
    
    // Parse JSON data for each notification with error handling
    const parsedNotifications = rows.map((row, index) => {
      try {
        return {
          ...row,
          data: row.data ? JSON.parse(row.data) : null
        };
      } catch (parseError) {
        console.error(`❌ Error parsing JSON for notification ${index}:`, parseError.message);
        console.error('❌ Raw data:', row.data);
        return {
          ...row,
          data: null // Return null if JSON parsing fails
        };
      }
    });
    
    console.log('✅ Returning parsed notifications:', parsedNotifications.length);
    
    return parsedNotifications;
  } catch (error) {
    console.error('❌ Error in getNotificationsByUser:');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Parameters:', { user_type, user_id });
    throw error;
  }
};

exports.markNotificationAsRead = async (id) => {
  try {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

exports.markAllNotificationsAsRead = async (user_type, user_id = null) => {
  try {
    let query = 'UPDATE notifications SET is_read = TRUE WHERE user_type = ? AND is_read = FALSE';
    let params = [user_type];
    
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    
    const [result] = await db.query(query, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

exports.deleteNotification = async (id) => {
  try {
    const [result] = await db.query('DELETE FROM notifications WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

exports.getUnreadCount = async (user_type, user_id = null) => {
  try {
    let query = 'SELECT COUNT(*) as count FROM notifications WHERE user_type = ? AND is_read = FALSE';
    let params = [user_type];
    
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    
    console.log('getUnreadCount - executing query:', query, 'with params:', params);
    
    const [rows] = await db.query(query, params);
    const count = rows[0].count || 0;
    
    console.log('getUnreadCount - result:', count, 'unread notifications');
    
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}; 