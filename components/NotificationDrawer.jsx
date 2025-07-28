import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

// Helper function to get user ID from localStorage based on user type
const getUserId = (userType) => {
  try {
    let token = null;
    
    switch (userType) {
      case 'counselor':
        token = localStorage.getItem('counselorToken');
        break;
      case 'psychiatrist':
        token = localStorage.getItem('psychiatrystToken'); // Note: psychiatryst not psychiatrist
        break;
      case 'user_public':
        // For user_public, get user_id directly from localStorage
        const userPublicId = localStorage.getItem('user_public_id');
        console.log('getUserId - user_public ID:', userPublicId);
        return userPublicId ? parseInt(userPublicId) : null;
      case 'admin':
      default:
        // Admin doesn't have a specific user ID
        console.log('getUserId for admin - returning null');
        return null;
    }
    
    console.log('getUserId - userType:', userType, 'token found:', !!token);
    
    if (!token || typeof token !== 'string') {
      console.log('getUserId - no valid token found');
      return null;
    }
    
    try {
      // Check if token is in JWT format (3 parts separated by dots)
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        // JWT token - decode the payload (second part)
        const payload = tokenParts[1];
        
        // Add padding if needed for base64 decoding
        const paddedPayload = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');
        
        // Replace URL-safe base64 characters with standard base64
        const standardBase64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
        
        const decoded = JSON.parse(atob(standardBase64));
        const userId = decoded.id || decoded.counselorId || decoded.psychiatristId || decoded.user_id || null;
        console.log('getUserId - JWT decoded:', { decoded, extractedUserId: userId });
        return userId;
      } else {
        // Simple base64 encoded token
        // Add padding if needed
        const paddedToken = token.padEnd(token.length + (4 - token.length % 4) % 4, '=');
        
        // Replace URL-safe base64 characters with standard base64
        const standardBase64 = paddedToken.replace(/-/g, '+').replace(/_/g, '/');
        
        const decoded = JSON.parse(atob(standardBase64));
        const userId = decoded.id || decoded.counselorId || decoded.psychiatristId || decoded.user_id || null;
        console.log('getUserId - Simple base64 decoded:', { decoded, extractedUserId: userId });
        return userId;
      }
    } catch (decodeError) {
      console.warn('Failed to decode token for user type:', userType, decodeError.message);
      return null;
    }
  } catch (error) {
    console.error('Error getting user ID for user type:', userType, error.message);
    return null;
  }
};

export default function NotificationDrawer({ userType = 'admin', userId = null }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef();
  
  // Auto-determine userId if not provided
  const effectiveUserId = userId || getUserId(userType);
  
  console.log('NotificationDrawer - userType:', userType, 'userId:', userId, 'effectiveUserId:', effectiveUserId);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      // Validate userType before making API call
      const validUserTypes = ['admin', 'counselor', 'psychiatrist', 'user_public'];
      if (!validUserTypes.includes(userType)) {
        console.error('❌ Invalid userType:', userType, 'Valid types:', validUserTypes);
        setNotifications([]);
        return;
      }
      
      setLoading(true);
      const params = new URLSearchParams({ user_type: userType });
      if (effectiveUserId) params.append('user_id', effectiveUserId.toString());
      
      console.log('🔄 Fetching notifications with params:', { userType, effectiveUserId, paramsString: params.toString() });
      
      const apiUrl = `/api/notifications?${params}`;
      console.log('🌐 Making request to:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('❌ Server error details:', errorData);
          errorDetails = errorData.message || errorData.error || errorDetails;
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError);
        }
        throw new Error(errorDetails);
      }
      
      const data = await response.json();
      
      console.log('✅ Notifications API response:', data);
      
      if (data.success) {
        setNotifications(data.data || []);
        console.log('✅ Set notifications:', data.data?.length || 0, 'notifications');
      } else {
        console.error('❌ Notifications API error:', data.message);
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      // Validate userType before making API call
      const validUserTypes = ['admin', 'counselor', 'psychiatrist', 'user_public'];
      if (!validUserTypes.includes(userType)) {
        console.error('❌ Invalid userType for unread count:', userType, 'Valid types:', validUserTypes);
        setUnreadCount(0);
        return;
      }
      
      const params = new URLSearchParams({ user_type: userType });
      if (effectiveUserId) params.append('user_id', effectiveUserId.toString());
      
      console.log('Fetching unread count with params:', { userType, effectiveUserId, paramsString: params.toString() });
      
      const response = await fetch(`/api/notifications/unread-count?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('✅ Unread count API response:', data);
      
      if (data.success) {
        setUnreadCount(data.count || 0);
        console.log('✅ Set unread count:', data.count || 0);
      } else {
        console.log('❌ Unread count API error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      // Mark notification as read
      if (!notification.is_read) {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PUT'
        });
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Navigate to appropriate page
      if (notification.data?.redirect_url) {
        router.push(notification.data.redirect_url);
        setOpen(false);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // Format time
  const formatTime = (dateString) => {
    const now = new Date();
    const notificationTime = new Date(dateString);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hr ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Fetch data on component mount and when drawer opens
  useEffect(() => {
    fetchUnreadCount();
    // Set up polling for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userType, effectiveUserId]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, userType, effectiveUserId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 relative"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Show notifications"
      >
        <Bell size={24} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-fade-in">
          <div className="p-4 border-b font-semibold text-gray-800 flex justify-between items-center">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-4 text-gray-500 text-center">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 hover:bg-blue-50 transition flex flex-col cursor-pointer ${
                    !notif.is_read ? 'bg-blue-25 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-gray-700 ${!notif.is_read ? 'font-semibold' : ''}`}>
                      {/* Add icon based on notification type */}
                      {notif.title.includes('appointment') ? '📅 ' : notif.title.includes('Emergency') ? '🚨 ' : '🔔 '}
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                  {notif.message && (
                    <span className="text-sm text-gray-500 mt-1">{notif.message}</span>
                  )}
                  {/* Show additional appointment details if available */}
                  {notif.data?.appointment_date && notif.data?.appointment_time && (
                    <div className="text-xs text-blue-600 mt-1 font-medium">
                      {notif.data.appointment_date} at {notif.data.appointment_time}
                    </div>
                  )}
                  <span className="text-xs text-gray-400 mt-2">{formatTime(notif.created_at)}</span>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50 text-center">
              <button 
                onClick={async () => {
                  try {
                    await fetch('/api/notifications/mark-all-read', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ user_type: userType, user_id: effectiveUserId })
                    });
                    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                    setUnreadCount(0);
                  } catch (error) {
                    console.error('Error marking all as read:', error);
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 