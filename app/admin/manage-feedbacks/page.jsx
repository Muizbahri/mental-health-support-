"use client";
import { useRouter, usePathname } from "next/navigation";
import { Home, Users, BookOpen, MessageCircle, AlertTriangle, LogOut, Edit, Trash2, Plus, Calendar, User, Reply } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import AdminSidebar from '../Sidebar';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const sidebarMenu = [
  { icon: <Home size={20} />, label: "Dashboard", path: "/admin/dashboard" },
  { icon: <Users size={20} />, label: "Manage Users", path: "/admin/manage-users" },
  { icon: <BookOpen size={20} />, label: "Manage Materials", path: "/admin/manage-materials" },
  { icon: <MessageCircle size={20} />, label: "Manage Feedback", path: "/admin/manage-feedbacks" },
  { icon: <Calendar size={20} />, label: "Manage Appointments", path: "/admin/manage-appointments" },
  { icon: <AlertTriangle size={20} />, label: "Manage Emergency Cases", path: "/admin/manage-emergency" },
];

// Role color mapping
const getRoleColor = (role) => {
  switch (role?.toLowerCase()) {
    case 'public':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'counselor':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'psychiatrist':
      return 'bg-purple-100 text-purple-700 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

export default function ManageFeedbacksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [modal, setModal] = useState({ open: false, feedback: null });
<<<<<<< HEAD
=======
  const [responseModal, setResponseModal] = useState({ open: false, feedback: null });
>>>>>>> 923c6e4110cfd6dbd6e37a2ae66c7b98f9749ac9
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  // Auto-refresh feedbacks data every 12 seconds
  const { refresh: refreshFeedbacks } = useAutoRefresh(
    fetchFeedbacks,
    12000, // 12 seconds
    isAuthenticated // Only refresh when authenticated
  );

  async function fetchFeedbacks() {
    setLoading(true);
    try {
      const response = await fetch('/api/feedbacks/all');
      const data = await response.json();
      
      if (data.success) {
        const mappedFeedbacks = (data.data || []).map(row => {
          let date = row.feedback_date || '';
          // If date is in ISO format, convert to YYYY-MM-DD in local time for input[type=date]
          if (date && date.length > 10) {
            const d = new Date(date);
            // Adjust for timezone offset so the date matches the DB
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            date = d.toISOString().slice(0, 10);
          }
          return {
            ...row,
            fullName: row.full_name,
            typeOfFeedback: row.type_of_feedback,
            userRole: row.user_role,
            date,
          };
        });
        setFeedbacks(mappedFeedbacks);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (isAuthenticated) {
      fetchFeedbacks(); 
    }
  }, [isAuthenticated]);

  function handleAdd() {
    setModal({ open: true, feedback: null });
  }
  
  function handleEdit(feedback) {
    setModal({ open: true, feedback });
  }
  
  function handleClose() {
    setModal({ open: false, feedback: null });
  }
<<<<<<< HEAD
=======

  function handleRespond(feedback) {
    setResponseModal({ open: true, feedback });
  }

  function handleCloseResponse() {
    setResponseModal({ open: false, feedback: null });
  }

  async function handleSubmitResponse(feedbackId, adminResponse) {
    try {
      const response = await fetch(`/api/feedbacks/respond/${feedbackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_response: adminResponse }),
      });

      const data = await response.json();
      if (data.success) {
        handleCloseResponse();
        fetchFeedbacks(); // Refresh the list
      } else {
        alert(data.message || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    }
  }
>>>>>>> 923c6e4110cfd6dbd6e37a2ae66c7b98f9749ac9
  
  async function handleSubmit(form, isEdit) {
    const payload = {
      user_id: form.userId || null, // Allow null for legacy support
      user_role: form.userRole,
      full_name: form.fullName,
      type_of_feedback: form.typeOfFeedback,
      feedback: form.feedback,
    };
    
    // Note: Date is not included when editing - it remains unchanged
    
    if (isEdit && modal.feedback && modal.feedback.id) {
      await fetch(`/api/feedbacks/${modal.feedback.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      // For new feedback, backend will automatically set current date/time
      await fetch('/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    handleClose();
    fetchFeedbacks();
  }
  
  async function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      await fetch(`/api/feedbacks/${id}`, { method: 'DELETE' });
      fetchFeedbacks();
    }
  }

  // Filter feedbacks based on search term and role filter
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.typeOfFeedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.feedback.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || feedback.userRole === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen w-full bg-white flex">
      <AdminSidebar />
      <main className="flex-1 w-full p-4 sm:p-8 space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-3xl text-gray-900">Manage All Feedback</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-refresh: ON</span>
            </div>
          </div>
          <button 
            className="border border-neutral-300 px-5 py-2 rounded-lg hover:bg-neutral-100 transition flex items-center gap-2 text-gray-900 font-medium" 
            onClick={handleAdd}
          >
            <Plus size={18} /> Add Feedback
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Feedback</label>
            <input
              type="text"
              placeholder="Search by name, type, or feedback content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="public">Public Users</option>
              <option value="counselor">Counselors</option>
              <option value="psychiatrist">Psychiatrists</option>
            </select>
          </div>
        </div>

        {/* Feedback Count */}
        <div className="text-sm text-gray-600 mb-4">
          Showing {filteredFeedbacks.length} of {feedbacks.length} feedback entries
        </div>

        {/* All Feedback Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading feedback...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left font-semibold text-gray-800">User Role</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-800">Full Name</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-800">Type of Feedback</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-800">Feedback</th>
<<<<<<< HEAD
=======
                    <th className="py-3 px-4 text-left font-semibold text-gray-800">Admin Response</th>
>>>>>>> 923c6e4110cfd6dbd6e37a2ae66c7b98f9749ac9
                    <th className="py-3 px-4 text-left font-semibold text-gray-800">Date</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbacks.length === 0 ? (
                    <tr>
<<<<<<< HEAD
                      <td colSpan={6} className="text-center text-gray-400 py-8">
=======
                      <td colSpan={7} className="text-center text-gray-400 py-8">
>>>>>>> 923c6e4110cfd6dbd6e37a2ae66c7b98f9749ac9
                        {searchTerm || roleFilter !== "all" ? "No feedback matches your search criteria" : "No feedback found"}
                      </td>
                    </tr>
                  ) : (
                    filteredFeedbacks.map(row => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${getRoleColor(row.userRole)}`}>
                            {row.userRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-800 font-medium">{row.fullName}</td>
                        <td className="py-3 px-4 text-gray-800">{row.typeOfFeedback}</td>
                        <td className="py-3 px-4 text-gray-800 max-w-xs">
                          <div className="truncate" title={row.feedback}>
                            {row.feedback.length > 50 ? row.feedback.substring(0, 50) + '...' : row.feedback}
                          </div>
                        </td>
<<<<<<< HEAD
=======
                        <td className="py-3 px-4 text-gray-800 max-w-xs">
                          {row.admin_response ? (
                            <div>
                              <div className="truncate text-sm" title={row.admin_response}>
                                {row.admin_response.length > 40 ? row.admin_response.substring(0, 40) + '...' : row.admin_response}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Responded: {row.responded_at ? new Date(row.responded_at).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-sm">No response yet</span>
                          )}
                        </td>
>>>>>>> 923c6e4110cfd6dbd6e37a2ae66c7b98f9749ac9
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(row.feedback_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button 
<<<<<<< HEAD
=======
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50" 
                              onClick={() => handleRespond(row)}
                              title={row.admin_response ? "Update response" : "Add response"}
                            >
                              <Reply size={16} />
                            </button>
                            <button 
>>>>>>> 923c6e4110cfd6dbd6e37a2ae66c7b98f9749ac9
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" 
                              onClick={() => handleEdit(row)}
                              title="Edit feedback"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50" 
                              onClick={() => handleDelete(row.id)}
                              title="Delete feedback"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {modal.open && (
          <FeedbackModal feedback={modal.feedback} onClose={handleClose} onSubmit={handleSubmit} />
<<<<<<< HEAD
=======
        )}

        {responseModal.open && (
          <AdminResponseModal 
            feedback={responseModal.feedback} 
            onClose={handleCloseResponse} 
            onSubmit={handleSubmitResponse} 
          />
>>>>>>> 923c6e4110cfd6dbd6e37a2ae66c7b98f9749ac9
        )}
      </main>
    </div>
  );
}

function FeedbackModal({ feedback, onClose, onSubmit }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState(feedback ? { 
    ...feedback,
    userRole: feedback.userRole || feedback.user_role
  } : { 
    userId: '',
    userRole: 'public', 
    fullName: '', 
    typeOfFeedback: '', 
    feedback: '', 
    date: todayStr 
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form, !!feedback);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <form onSubmit={handleSubmit} className="relative z-10 bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-2 text-gray-900">{feedback ? 'Edit' : 'Add'} Feedback</h3>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">User Role</label>
          <select 
            name="userRole" 
            value={form.userRole} 
            onChange={handleChange} 
            className="border rounded-lg px-3 py-2 text-gray-900" 
            required
          >
            <option value="public">Public User</option>
            <option value="counselor">Counselor</option>
            <option value="psychiatrist">Psychiatrist</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">User ID (Optional)</label>
          <input 
            name="userId" 
            value={form.userId || ''} 
            onChange={handleChange} 
            className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400" 
            placeholder="Leave empty for legacy support"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">Full Name</label>
          <input 
            name="fullName" 
            value={form.fullName} 
            onChange={handleChange} 
            className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400" 
            required 
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">Type of Feedback</label>
          <select 
            name="typeOfFeedback" 
            value={form.typeOfFeedback} 
            onChange={handleChange} 
            className="border rounded-lg px-3 py-2 text-gray-900" 
            required
          >
            <option value="">Select feedback type...</option>
            <option value="General Feedback">General Feedback</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Counselor Feedback">Counselor Feedback</option>
            <option value="Appointment Experience">Appointment Experience</option>
            <option value="Materials & Resources">Materials & Resources</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Urgent Issue">Urgent Issue</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">Feedback</label>
          <textarea 
            name="feedback" 
            value={form.feedback} 
            onChange={handleChange} 
            className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400" 
            rows={4} 
            required 
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">Date</label>
          {feedback ? (
            <>
              <input
                name="date"
                type="text"
                value={new Date(feedback.feedback_date).toLocaleDateString()}
                className="border rounded-lg px-3 py-2 text-gray-600 bg-gray-50 cursor-not-allowed"
                disabled
                readOnly
              />
              <div className="text-xs text-gray-500 italic">
                Original submission date cannot be changed
              </div>
            </>
          ) : (
            <div className="border rounded-lg px-3 py-2 text-gray-600 bg-gray-50 italic">
              Will be set to current date/time automatically
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-4">
          <button 
            type="button" 
            className="px-4 py-2 rounded-lg border border-gray-400 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50" 
            disabled={loading}
          >
            {loading ? (feedback ? 'Saving...' : 'Adding...') : (feedback ? 'Save' : 'Add')}
          </button>
<<<<<<< HEAD
=======
        </div>
      </form>
    </div>
  );
}

function AdminResponseModal({ feedback, onClose, onSubmit }) {
  const [response, setResponse] = useState(feedback?.admin_response || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!response.trim()) {
      alert('Please enter a response');
      return;
    }
    setLoading(true);
    await onSubmit(feedback.id, response.trim());
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <form onSubmit={handleSubmit} className="relative z-10 bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl mx-auto flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-2 text-gray-900">
          {feedback?.admin_response ? 'Update Admin Response' : 'Add Admin Response'}
        </h3>
        
        {/* Display Original Feedback */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Original Feedback:</h4>
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-600">From: </span>
            <span className="text-sm text-gray-800">{feedback?.fullName || feedback?.full_name}</span>
            <span className="ml-4 text-sm font-medium text-gray-600">Type: </span>
            <span className="text-sm text-gray-800">{feedback?.typeOfFeedback || feedback?.type_of_feedback}</span>
          </div>
          <p className="text-gray-800 text-sm">{feedback?.feedback}</p>
          <div className="text-xs text-gray-500 mt-2">
            Submitted: {feedback?.feedback_date ? new Date(feedback.feedback_date).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        
        {/* Response Input */}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">Admin Response</label>
          <textarea 
            value={response} 
            onChange={(e) => setResponse(e.target.value)}
            className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 min-h-[120px]" 
            rows={6} 
            required 
            placeholder="Enter your response to this feedback..."
          />
          <div className="text-xs text-gray-500">
            This response will be visible to the user who submitted the feedback.
          </div>
        </div>
        
        {/* Existing Response Info */}
        {feedback?.admin_response && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-1">Current Response:</div>
            <div className="text-sm text-blue-700 mb-2">{feedback.admin_response}</div>
            <div className="text-xs text-blue-600">
              Responded: {feedback.responded_at ? new Date(feedback.responded_at).toLocaleString() : 'N/A'}
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-4">
          <button 
            type="button" 
            className="px-4 py-2 rounded-lg border border-gray-400 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50" 
            disabled={loading}
          >
            {loading ? 'Submitting...' : (feedback?.admin_response ? 'Update Response' : 'Submit Response')}
          </button>
>>>>>>> 923c6e4110cfd6dbd6e37a2ae66c7b98f9749ac9
        </div>
      </form>
    </div>
  );
} 