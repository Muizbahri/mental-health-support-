# Emergency Case Flow Implementation - Complete Guide

## 🚨 Overview

This document outlines the comprehensive emergency case flow with notifications and email functionality that has been implemented in the Mental Health Support System.

## ✅ Features Implemented

### 1. **Emergency Case Submission (User Public)**
- When a user submits an emergency case through `/app/user-public/emergency-case/page.jsx`
- **Automatic Email to Admin**: Sends a professional HTML email to `systemmanager112@gmail.com`
- **Admin Notification**: Creates a real-time notification in the admin dashboard
- **Database Storage**: Saves case details in the `emergency_cases` table

### 2. **Emergency Case Assignment (Admin)**
- When admin assigns a case to a counselor/psychiatrist through `/app/admin/manage-emergency/page.jsx`
- **Automatic Email to Professional**: Sends assignment email to the assigned counselor/psychiatrist
- **Professional Notification**: Creates a notification in the professional's dashboard
- **Assignment Tracking**: Updates database with assignment details

### 3. **Dynamic Notification System**
- **Real-time Notifications**: Dynamic notification drawer replacing dummy data
- **Unread Count Badges**: Shows unread notification count with red badges
- **Click-to-Redirect**: Notifications redirect to relevant pages when clicked
- **Auto-refresh**: Polls for new notifications every 30 seconds
- **Mark as Read**: Individual and bulk mark-as-read functionality

## 🗃️ Database Structure

### New Table: `notifications`
```sql
CREATE TABLE notifications (
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
```

## 📁 New Files Created

### Backend Files
1. **`backend/models/notifications.js`** - Notification database operations
2. **`backend/controllers/notificationsController.js`** - Notification API endpoints
3. **`backend/routes/notifications.js`** - Notification routes

### API Endpoints Added
- `GET /api/notifications` - Get notifications for a user
- `GET /api/notifications/unread-count` - Get unread notification count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

## 🔄 Modified Files

### Backend Updates
1. **`backend/server.js`** - Added notifications routes
2. **`backend/controllers/emergencyCaseController.js`** 
   - Enhanced `createPublicEmergencyCase` with email/notification
   - Enhanced `updateEmergencyCase` with assignment email/notification

### Frontend Updates
1. **`components/NotificationDrawer.jsx`** - Complete rewrite with real data
2. **`app/admin/dashboard/page.jsx`** - Added userType prop
3. **`app/counselor/dashboard/page.jsx`** - Added userType prop  
4. **`app/psychiatryst/dashboard/page.jsx`** - Added userType prop

## 📧 Email Templates

### Admin Emergency Alert Email
- **Subject**: "Emergency Case Received - Immediate Attention Required"
- **Content**: Patient details, submission time, action button
- **Call-to-Action**: Direct link to emergency management page

### Professional Assignment Email  
- **Subject**: "Emergency Case Assigned to You - Immediate Attention Required"
- **Content**: Case details, assignment info, professional dashboard link
- **Call-to-Action**: Direct link to emergency cases page

## 🔔 Notification Types

### Admin Notifications
- **Title**: "Emergency case received"
- **Message**: "New emergency case from [Patient Name] (IC: [IC Number])"
- **Redirect**: `/admin/manage-emergency`

### Professional Notifications
- **Title**: "Emergency case assigned to you"  
- **Message**: "Emergency case for [Patient Name] has been assigned to you"
- **Redirect**: `/counselor/emergency-reports` or `/psychiatryst/emergency-cases`

## 🔧 Technical Implementation Details

### Notification System Architecture
1. **Auto-detection of User ID**: Automatically extracts user ID from localStorage tokens
2. **User Type Mapping**: 
   - Admin: `userType="admin"`, `userId=null`
   - Counselor: `userType="counselor"`, `userId=counselor_id`
   - Psychiatrist: `userType="psychiatrist"`, `userId=psychiatrist_id`

### Email System
- **SMTP Configuration**: Uses existing nodemailer setup
- **Environment Variables**: Leverages `MAIL_USER`, `MAIL_PASS`, etc.
- **HTML Templates**: Professional responsive email design
- **Error Handling**: Non-blocking email failures (won't break emergency submission)

### Real-time Features
- **Auto-refresh**: Notifications update every 30 seconds
- **Unread Badges**: Red circular badges show unread count
- **Visual Indicators**: Blue dots and highlights for unread notifications
- **Click Handling**: Marks as read and navigates to relevant page

## 🎯 User Experience Flow

### 1. Emergency Case Submission
```
User submits case → Save to DB → Send admin email → Create admin notification → Success message
```

### 2. Admin Assignment
```
Admin assigns case → Update DB → Send professional email → Create professional notification → Success message
```

### 3. Notification Interaction
```
User clicks notification bell → Fetch notifications → Display in drawer → Click notification → Mark as read → Navigate to page
```

## 🛡️ Security & Error Handling

### Email Error Handling
- Non-blocking: Emergency case submission succeeds even if email fails
- Logging: All email errors are logged for debugging
- Graceful degradation: System continues to function without email

### Notification Security
- User isolation: Users only see their own notifications
- Role-based access: Notifications filtered by user type
- SQL injection protection: Parameterized queries throughout

### Authentication Integration
- Token-based: Integrates with existing auth system
- Auto-detection: Automatically determines user context
- Fallback handling: Graceful handling of missing/invalid tokens

## 🚀 How to Use

### For Admins
1. Emergency notifications appear automatically in dashboard
2. Click notification to go directly to emergency management
3. Assign cases to professionals through the management interface
4. System automatically notifies assigned professionals

### For Counselors/Psychiatrists  
1. Assignment notifications appear in dashboard
2. Click notification to view assigned emergency cases
3. Unread count badge shows pending notifications
4. Use "Mark all as read" to clear notifications

### For Public Users
1. Submit emergency cases through the emergency case form
2. System automatically processes and notifies admin
3. No additional action required from user

## 🔍 Testing & Verification

### Test the Email System
1. Submit an emergency case from user-public interface
2. Check `systemmanager112@gmail.com` for admin email
3. Assign the case to a professional in admin panel
4. Check professional's email for assignment notification

### Test the Notification System
1. Submit emergency case and check admin dashboard for notification
2. Click notification to verify redirect works
3. Assign case and check professional dashboard for notification
4. Verify unread count badges update correctly

## 📈 Future Enhancements

### Potential Improvements
1. **Push Notifications**: Browser push notifications for critical alerts
2. **SMS Integration**: Text message alerts for emergency cases
3. **Notification Preferences**: User-configurable notification settings
4. **Rich Notifications**: Embedded actions within notifications
5. **Analytics Dashboard**: Notification delivery and read rates

### Performance Optimizations
1. **WebSocket Integration**: Real-time notifications without polling
2. **Notification Batching**: Group multiple notifications
3. **Background Jobs**: Queue email sending for better performance
4. **Caching Layer**: Cache notification counts for faster load times

## 🎉 Success Criteria

✅ **Emergency case submission sends admin email**  
✅ **Emergency case submission creates admin notification**  
✅ **Case assignment sends professional email**  
✅ **Case assignment creates professional notification**  
✅ **Notifications show unread count badges**  
✅ **Notifications redirect to correct pages**  
✅ **Real-time notification updates**  
✅ **Mark as read functionality**  
✅ **Multi-user type support (admin/counselor/psychiatrist)**  
✅ **Professional HTML email templates**  
✅ **Error handling and graceful degradation**  

## 📞 Support

For technical support or questions about this implementation, please refer to the codebase comments or contact the development team.

---

**Implementation completed successfully! 🎉** 