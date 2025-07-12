"use client";
import { useState, useEffect } from "react";
import { MessageCircle, Info, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import CounselorSidebar from "../Sidebar";
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const FEEDBACK_TYPES = [
  "General Feedback",
  "Bug Report",
  "Feature Request",
  "Counselor Feedback",
  "Appointment Experience",
  "Materials & Resources",
  "Technical Issue"
];

const FEEDBACK_STATUS = {
  "Under Review": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Acknowledged": "bg-green-100 text-green-800 border-green-300"
};

// Status color mapping
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'acknowledged':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'under review':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'in progress':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'resolved':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

// Type color mapping
const getTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'feature request':
      return 'text-blue-700 border-blue-300';
    case 'general feedback':
      return 'text-green-700 border-green-300';
    case 'bug report':
      return 'text-red-700 border-red-300';
    case 'urgent issue':
      return 'text-orange-700 border-orange-300';
    default:
      return 'text-gray-700 border-gray-300';
  }
};

export default function CounselorFeedbackPage() {
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [userFeedbacks, setUserFeedbacks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [user, setUser] = useState({ id: null, full_name: '', user_role: 'counselor' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const charLimit = 1000;
  const chars = message.length;

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

  // Get user information and fetch their feedback on component mount
  useEffect(() => {
    const token = localStorage.getItem('counselorToken');
    if (token) {
      setIsAuthenticated(true);
    }

    // Get user info from localStorage (more reliable)
    const counselorUserData = localStorage.getItem("counselorUser");
    
    if (counselorUserData) {
      try {
        const userData = JSON.parse(counselorUserData);
        const userInfo = {
          id: userData?.id,
          full_name: userData?.full_name || '',
          user_role: 'counselor'
        };
        setUser(userInfo);
        
        // Fetch user's feedback if we have user ID
        if (userInfo.id) {
          fetchUserFeedbacks(userInfo.id);
        }
      } catch (err) {
        console.error("Error parsing counselor user data:", err);
      }
    }
  }, []);

  // Fetch user's feedback from the backend using user_id
  const fetchUserFeedbacks = async (userId) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/feedbacks/my-feedbacks?user_id=${userId}`);
      const data = await res.json();
      
      if (data.success) {
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!type || !message.trim()) return;
    setSubmitting(true);
    
    // Get user info from localStorage (more reliable)
    const counselorUserData = localStorage.getItem("counselorUser");
    let userData = null;
    
    if (counselorUserData) {
      try {
        userData = JSON.parse(counselorUserData);
      } catch (err) {
        console.error("Error parsing counselor user data:", err);
      }
    }

    if (!userData || !userData.id || !userData.full_name) {
      alert("User information not available. Please log in again.");
      setSubmitting(false);
      return;
    }
    
    console.log('Counselor feedback submission:', {
      user_id: userData.id,
      user_role: "counselor",
      full_name: userData.full_name,
      type_of_feedback: type,
      feedback: message.substring(0, 50) + '...'
    });
    
    const feedbackData = {
      user_id: userData.id,
      user_role: "counselor",
      full_name: userData.full_name,
      type_of_feedback: type,
      feedback: message
    };
    
    try {
      const res = await fetch("/api/feedbacks/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData)
      });
      if (res.ok) {
        alert("Feedback submitted successfully!");
        setType("");
        setMessage("");
        // Refresh the feedback list
        fetchUserFeedbacks(userData.id);
      } else {
        alert("Failed to submit feedback.");
      }
    } catch (err) {
      console.error('Counselor feedback error:', err);
      alert("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f7fafc]">
      <CounselorSidebar activePage="FEEDBACK" />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refresh: ON</span>
          </div>
        </div>
        <p className="text-gray-600 mb-8 max-w-2xl">Your feedback helps us improve our mental health services. Please share your thoughts, suggestions, or report any issues.</p>
        {/* Submit Feedback */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="text-blue-500" size={22} />
            <span className="font-semibold text-lg text-gray-800">Submit Feedback</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700">Type of Feedback</label>
              <select
                className="w-full border rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                value={type}
                onChange={e => setType(e.target.value)}
                required
              >
                <option value="">Select feedback type...</option>
                {FEEDBACK_TYPES.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">Write your feedback...</label>
              <textarea
                className="w-full border rounded-lg px-4 py-2 min-h-[100px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                placeholder="Please provide detailed feedback about your experience. Include any specific issues, suggestions for improvement, or positive experiences you'd like to share."
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, charLimit))}
                maxLength={charLimit}
                required
              />
              <div className="text-xs text-gray-500 text-right mt-1">{chars}/{charLimit} characters</div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition text-base flex items-center gap-2"
              disabled={submitting || !type || !message.trim()}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </section>
        {/* Feedback Guidelines */}
        <section className="rounded-2xl shadow p-6 mb-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
          <div className="font-semibold text-lg text-blue-900 mb-2 flex items-center gap-2"><Info size={20} /> Feedback Guidelines</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold mb-1">What to include:</div>
              <ul className="list-disc ml-5 text-gray-700 space-y-0.5">
                <li>Specific details about your experience</li>
                <li>Steps that led to any issues</li>
                <li>Suggestions for improvement</li>
                <li>Positive feedback about what works well</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-1">Response time:</div>
              <ul className="list-disc ml-5 text-gray-700 space-y-0.5">
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
          <div className="font-semibold text-lg text-gray-800 mb-4">Your Recent Feedback</div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading your feedback...</div>
          ) : userFeedbacks.length > 0 ? (
            <div className="space-y-4">
              {userFeedbacks.map(fb => (
                <div key={fb.id} className={`rounded-xl border-l-4 p-4 bg-blue-50/60 shadow-sm ${getTypeColor(fb.type_of_feedback)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold ${
                      fb.type_of_feedback === "Feature Request" ? "text-blue-700" :
                      fb.type_of_feedback === "General Feedback" ? "text-green-700" :
                      "text-gray-700"
                    }`}>
                      {fb.type_of_feedback}
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {new Date(fb.feedback_date).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => deleteFeedback(fb.id)}
                      disabled={deletingId === fb.id}
                      className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                      title="Delete feedback"
                    >
                      {deletingId === fb.id ? (
                        <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                  <div className="text-gray-800 mb-2">"{fb.feedback}"</div>
                  <span className={`inline-block px-3 py-1 text-xs rounded-full border font-semibold ${getStatusColor('Under Review')}`}>
                    Under Review
                  </span>
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