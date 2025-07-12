"use client";
import { MessageCircle, Menu, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const feedbackTypes = [
  "General Feedback",
  "Bug Report",
  "Feature Request",
  "Urgent Issue",
];

// Status color mapping
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'acknowledged':
      return 'bg-green-100 text-green-700';
    case 'under review':
      return 'bg-yellow-100 text-yellow-800';
    case 'in progress':
      return 'bg-blue-100 text-blue-800';
    case 'resolved':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// Type color mapping
const getTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'feature request':
      return 'text-blue-700';
    case 'general feedback':
      return 'text-green-700';
    case 'bug report':
      return 'text-red-700';
    case 'urgent issue':
      return 'text-orange-700';
    default:
      return 'text-gray-700';
  }
};

export default function FeedbackPage() {
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState({ id: null, full_name: '', user_role: 'public' });
  const [userFeedbacks, setUserFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const charLimit = 1000;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auto-refresh feedback data every 15 seconds
  const { refresh: refreshFeedbacks } = useAutoRefresh(
    () => {
      if (user.id) {
        fetchUserFeedbacks(user.id);
      }
    },
    15000, // 15 seconds
    isAuthenticated && user.id !== null // Only refresh when authenticated and user ID is available
  );

  // Get user information and fetch their feedback
  useEffect(() => {
    const token = localStorage.getItem("publicToken");
    if (token) {
      setIsAuthenticated(true);
    }

    // Get user information from localStorage first (most reliable)
    const publicUserData = localStorage.getItem("publicUser");
    const userIdFromStorage = localStorage.getItem("user_public_id");
    const fullNameFromStorage = localStorage.getItem("full_name");
    
    let userInfo = null;
    
    if (publicUserData) {
      try {
        const userData = JSON.parse(publicUserData);
        userInfo = {
          id: userData.id || userIdFromStorage,
          full_name: userData.full_name || fullNameFromStorage || '',
          user_role: 'public'
        };
      } catch (err) {
        console.error("Error parsing publicUser data:", err);
      }
    }
    
    // Fallback to individual localStorage items
    if (!userInfo && (userIdFromStorage || fullNameFromStorage)) {
      userInfo = {
        id: userIdFromStorage,
        full_name: fullNameFromStorage || '',
        user_role: 'public'
      };
    }
    
    if (userInfo) {
      setUser(userInfo);
      console.log('Public user loaded from localStorage:', userInfo);
      console.log('User ID for feedback fetch:', userInfo.id, typeof userInfo.id);
      
      // Fetch user's feedback if we have user ID
      if (userInfo.id) {
        fetchUserFeedbacks(userInfo.id);
      } else {
        console.log('No user ID found - cannot fetch feedback');
      }
    } else {
      console.log('No user info found in localStorage:', {
        publicUserData: !!publicUserData,
        userIdFromStorage,
        fullNameFromStorage
      });
    }
    
    // Only fetch from API if we don't have user data in localStorage
    if (!publicUserData) {
      const token = localStorage.getItem("publicToken");
      if (!token) return;
      
      // Use the correct API endpoint for public user profile
      fetch(`/api/public-users/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          console.log('Profile API response:', data);
          if (data.success && data.data) {
            const userInfo = {
              id: data.data.id,
              full_name: data.data.full_name,
              user_role: 'public'
            };
            setUser(userInfo);
            // Update localStorage with fresh data
            localStorage.setItem("full_name", data.data.full_name);
            localStorage.setItem("user_public_id", data.data.id.toString());
            localStorage.setItem("publicUser", JSON.stringify(data.data));
            
            // Fetch user's feedback
            fetchUserFeedbacks(userInfo.id);
          }
        })
        .catch(err => {
          console.error('Profile fetch error:', err);
        });
    }
  }, []);

  // Fetch user's feedback from the backend using user_id
  const fetchUserFeedbacks = async (userId) => {
    if (!userId) {
      console.log('fetchUserFeedbacks called with no userId');
      return;
    }
    
    console.log('Fetching feedback for user_id:', userId);
    
    try {
      setLoading(true);
      const apiUrl = `/api/feedbacks/my-feedbacks?user_id=${userId}`;
      console.log('Making API call to:', apiUrl);
      
      const res = await fetch(apiUrl);
      const data = await res.json();
      
      console.log('API response:', { status: res.status, data });
      
      if (data.success) {
        console.log('Setting user feedbacks:', data.data);
        setUserFeedbacks(data.data || []);
      } else {
        console.error('Failed to fetch feedback:', data.message);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete feedback function using user_id
  const deleteFeedback = async (feedbackId) => {
    if (!user.id) {
      alert("User information not available. Please refresh the page.");
      return;
    }

    // Confirmation dialog
    if (!window.confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(feedbackId);
      const res = await fetch(`/api/feedbacks/user/${feedbackId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id
        })
      });

      const data = await res.json();
      
      if (data.success) {
        // Remove the deleted feedback from the local state
        setUserFeedbacks(prev => prev.filter(fb => fb.id !== feedbackId));
        alert("Feedback deleted successfully!");
      } else {
        alert(data.message || "Failed to delete feedback");
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert("Error deleting feedback. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !message) {
      alert("Please select a feedback type and write a message.");
      return;
    }

    if (!user.id || !user.full_name) {
      alert("User information not available. Please log in again.");
      return;
    }

    console.log('Public user feedback submission:', {
      user_id: user.id,
      full_name: user.full_name,
      user_role: user.user_role,
      type_of_feedback: type,
      feedback: message.substring(0, 50) + '...'
    });

    try {
      const res = await fetch("/api/feedbacks/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          full_name: user.full_name,
          user_role: user.user_role,
          type_of_feedback: type,
          feedback: message,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Feedback submitted successfully!");
        setType("");
        setMessage("");
        // Refresh the feedback list
        fetchUserFeedbacks(user.id);
      } else {
        throw new Error(data.message || "Failed to submit feedback.");
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* Hamburger menu for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-white rounded-full p-2 shadow-lg border border-gray-200"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={28} color="#000" />
      </button>
      {/* Sidebar as drawer on mobile, static on desktop */}
      <div>
        {/* Mobile Drawer */}
        <div
          className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} md:hidden`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 md:static md:translate-x-0 md:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:min-h-screen`}
        >
          {/* Close button for mobile */}
          <button
            className="md:hidden absolute top-4 right-4 z-50 bg-gray-100 rounded-full p-1 border border-gray-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} color="#000" />
          </button>
          <Sidebar activePage="FEEDBACK" />
        </aside>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 transition-all duration-200">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refresh: ON</span>
          </div>
        </div>
        <p className="text-gray-600 mb-8 text-lg">Your feedback helps us improve our mental health services. Please share your thoughts, suggestions, or report any issues.</p>
        {/* Submit Feedback */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="text-blue-500" size={22} />
            <span className="font-semibold text-gray-800 text-lg">Submit Feedback</span>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-gray-700 mb-1">Type of Feedback</label>
            <select
              name="feedbackType"
              id="feedbackType"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="">Select feedback type...</option>
              <option value="General Feedback">General Feedback</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Counselor Feedback">Counselor Feedback</option>
              <option value="Appointment Experience">Appointment Experience</option>
              <option value="Materials & Resources">Materials & Resources</option>
              <option value="Technical Issue">Technical Issue</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-gray-700 mb-1">Write your feedback...</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[100px] resize-vertical"
              maxLength={charLimit}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Please provide detailed feedback about your experience. Include any specific issues, suggestions for improvement, or positive experiences you'd like to share."
            />
            <div className="text-xs text-gray-400 mt-1">{message.length}/{charLimit} characters</div>
          </div>
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition flex items-center gap-2">
            <MessageCircle size={18} /> Submit Feedback
          </button>
        </section>
        {/* Feedback Guidelines */}
        <section className="rounded-2xl shadow p-6 mb-8 bg-gradient-to-br from-blue-50 to-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-semibold text-gray-800 mb-2">What to include:</div>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Specific details about your experience</li>
                <li>Steps that led to any issues</li>
                <li>Suggestions for improvement</li>
                <li>Positive feedback about what works well</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-800 mb-2">Response time:</div>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>General feedback: 3-5 business days</li>
                <li>Bug reports: 1-2 business days</li>
                <li>Urgent issues: Within 24 hours</li>
                <li>Feature requests: 1-2 weeks</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Recent Feedback */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="font-semibold text-gray-800 text-lg mb-4">Your Recent Feedback</div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading your feedback...</div>
          ) : userFeedbacks.length > 0 ? (
            <div className="flex flex-col gap-4">
              {userFeedbacks.map((fb) => (
                <div key={fb.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className={`font-semibold mb-1 ${getTypeColor(fb.type_of_feedback)}`}>{fb.type_of_feedback}</div>
                    <div className="text-gray-700 text-sm mb-2">"{fb.feedback}"</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor('Under Review')}`}>
                      Under Review
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 md:mt-0 md:ml-4">
                    <span className="text-gray-400 text-xs whitespace-nowrap">
                      {new Date(fb.feedback_date).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => deleteFeedback(fb.id)}
                      disabled={deletingId === fb.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete feedback"
                    >
                      {deletingId === fb.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No feedback submitted yet. Share your thoughts to help us improve!
            </div>
          )}
        </section>
      </main>
    </div>
  );
} 