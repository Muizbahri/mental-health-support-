"use client";
import { useState, useEffect } from "react";
import { Calendar, Users, AlertTriangle, FileText, MessageCircle, UserCircle, ChevronRight, Plus, ClipboardList, BookOpen, LogOut, Clock, CheckCircle, XCircle, ArrowRight, Edit, Trash2, Send, Star, RefreshCw } from "lucide-react";
import CounselorSidebar from "../Sidebar";
import { useRouter } from "next/navigation";
import NotificationDrawer from '../../../components/NotificationDrawer';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const sidebarMenu = [
  { icon: <Calendar size={20} />, label: "Dashboard", badge: null },
  { icon: <AlertTriangle size={20} />, label: "Emergency Reports", badge: 3, badgeColor: "bg-red-500" },
  { icon: <ClipboardList size={20} />, label: "Appointments", badge: 12, badgeColor: "bg-blue-500" },
  { icon: <BookOpen size={20} />, label: "Materials", badge: null },
  { icon: <MessageCircle size={20} />, label: "Feedback", badge: 5, badgeColor: "bg-pink-500" },
  { icon: <UserCircle size={20} />, label: "Profile", badge: null },
];

export default function CounselorDashboard() {
  const [stats, setStats] = useState({ 
    upcoming: null, 
    active: null, 
    emergency: null, 
    materials: null 
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [visibleActivities, setVisibleActivities] = useState(6);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const router = useRouter();
  const [profile, setProfile] = useState({ full_name: '', profile_image: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [counselorId, setCounselorId] = useState(null);

  // Centralized data fetching function
  const fetchDashboardData = async () => {
    const user = JSON.parse(localStorage.getItem("counselorUser"));
    if (!user) {
      setError('No user data found. Please log in again.');
      setLoading(false);
      return;
    }
    
    try {
      // Fetch profile using the correct endpoint
      const res = await fetch("/api/counselors/profile/me", {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setProfile(data.data);
        setCounselorId(data.data.id);
        
        // After getting counselor profile, fetch counselor-specific data
        await fetchCounselorData(data.data.id, user.token);
      } else {
        setError(data.message || 'Failed to fetch profile data');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch profile data. Please try again.');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh dashboard data every 12 seconds
  const { refresh: refreshDashboard } = useAutoRefresh(
    fetchDashboardData,
    12000, // 12 seconds
    !!counselorId,
    [counselorId]
  );

  const fetchCounselorData = async (counselorId, token) => {
    try {
      // Fetch appointments by counselor ID using protected endpoint
      const appointmentsRes = await fetch(`/api/appointments/protected`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appointmentsData = await appointmentsRes.json();
      const appointments = appointmentsData.success ? appointmentsData.data : [];
      
      // Calculate upcoming appointments (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date_time);
        return aptDate >= now && aptDate <= nextWeek;
      });
      
      // Calculate active cases (appointments with status 'Accepted')
      const activeCases = appointments.filter(apt => apt.status === 'Accepted');
      
      // Fetch emergency cases by counselor ID
      const emergencyRes = await fetch(`/api/emergency_cases?counselor_id=${counselorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const emergencyData = await emergencyRes.json();
      const emergencyCases = emergencyData.success ? emergencyData.data : [];
      
      // Filter emergency cases requiring attention (status: 'In Progress' or 'Pending')
      const emergencyReports = emergencyCases.filter(emergency => 
        emergency.status === 'In Progress' || emergency.status === 'Pending'
      );
      
      // Fetch materials (for now get all, as materials don't have counselor_id field)
      const materialsRes = await fetch("/api/materials", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const materialsData = await materialsRes.json();
      const materials = materialsData.success ? materialsData.data : [];
      
      // Filter materials by current month (since we don't have counselor_id)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthMaterials = materials.filter(material => {
        const materialDate = new Date(material.created_at);
        return materialDate.getMonth() === currentMonth && materialDate.getFullYear() === currentYear;
      });
      
      // Fetch referral requests for counselor
      const referralRes = await fetch(`/api/referral-requests?counselor_id=${counselorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const referralData = await referralRes.json();
      const referralRequests = referralData.success ? referralData.data : [];
      
      // Fetch feedback for counselor
      const feedbackRes = await fetch(`/api/feedbacks/counselor`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const feedbackData = await feedbackRes.json();
      const feedbacks = feedbackData.success ? feedbackData.data : [];
      
      // Update stats
      setStats({
        upcoming: upcomingAppointments.length,
        active: activeCases.length + emergencyCases.filter(ec => ec.status === 'Accepted').length,
        emergency: emergencyReports.length,
        materials: thisMonthMaterials.length
      });
      
      // Generate recent activity
      generateRecentActivity(appointments, emergencyCases, materials, referralRequests, feedbacks);
      
    } catch (error) {
      console.error('Error fetching counselor data:', error);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (appointments, emergencyCases, materials, referralRequests, feedbacks) => {
    const activities = [];
    
    // Add appointment activities
    appointments.forEach(apt => {
      const created = new Date(apt.created_at);
      const updated = new Date(apt.updated_at || apt.created_at);
      const isUpdated = updated > created;
      
      activities.push({
        id: `appointment-${apt.id}`,
        type: 'appointment',
        icon: <Calendar size={16} />,
        iconColor: apt.status === 'Accepted' ? 'text-green-500' : apt.status === 'In Progress' ? 'text-blue-500' : 'text-gray-500',
        title: isUpdated ? 'Appointment Updated' : 'Appointment Scheduled',
        description: `with ${apt.name_patient || 'Patient'}`,
        status: apt.status,
        timestamp: isUpdated ? updated : created,
        priority: apt.status === 'In Progress' || apt.status === 'Pending',
        bgColor: apt.status === 'In Progress' ? 'bg-blue-50 border-blue-200' : apt.status === 'Pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'
      });
    });
    
    // Add emergency case activities
    emergencyCases.forEach(emergency => {
      const created = new Date(emergency.created_at);
      const updated = new Date(emergency.updated_at || emergency.created_at);
      const isUpdated = updated > created;
      
      activities.push({
        id: `emergency-${emergency.id}`,
        type: 'emergency',
        icon: <AlertTriangle size={16} />,
        iconColor: emergency.status === 'In Progress' ? 'text-red-500' : emergency.status === 'Pending' ? 'text-orange-500' : 'text-gray-500',
        title: isUpdated ? 'Emergency Case Updated' : 'Emergency Case Assigned',
        description: `${emergency.name_patient || 'Patient'} - ${emergency.status}`,
        status: emergency.status,
        timestamp: isUpdated ? updated : created,
        priority: emergency.status === 'In Progress' || emergency.status === 'Pending',
        bgColor: emergency.status === 'In Progress' ? 'bg-red-50 border-red-200' : emergency.status === 'Pending' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'
      });
    });
    
    // Add material activities
    materials.forEach(material => {
      activities.push({
        id: `material-${material.id}`,
        type: 'material',
        icon: <FileText size={16} />,
        iconColor: 'text-purple-500',
        title: 'Material Shared',
        description: material.title,
        status: 'Shared',
        timestamp: new Date(material.created_at),
        priority: false,
        bgColor: 'bg-purple-50 border-purple-200'
      });
    });
    
    // Add referral request activities
    referralRequests.forEach(referral => {
      const created = new Date(referral.created_at);
      const updated = new Date(referral.updated_at || referral.created_at);
      const isUpdated = updated > created;
      
      activities.push({
        id: `referral-${referral.id}`,
        type: 'referral',
        icon: <ArrowRight size={16} />,
        iconColor: referral.status === 'Accepted' ? 'text-green-500' : referral.status === 'Pending' ? 'text-yellow-500' : 'text-gray-500',
        title: isUpdated ? 'Referral Request Updated' : 'Referral Request Created',
        description: `${referral.patient_name} - ${referral.disorder}`,
        status: referral.status,
        timestamp: isUpdated ? updated : created,
        priority: referral.status === 'Pending',
        bgColor: referral.status === 'Pending' ? 'bg-yellow-50 border-yellow-200' : referral.status === 'Accepted' ? 'bg-green-50 border-green-200' : 'bg-gray-50'
      });
    });
    
    // Add feedback activities
    feedbacks.forEach(feedback => {
      activities.push({
        id: `feedback-${feedback.id}`,
        type: 'feedback',
        icon: <MessageCircle size={16} />,
        iconColor: 'text-pink-500',
        title: 'Feedback Received',
        description: `${feedback.type_of_feedback} from ${feedback.full_name}`,
        status: 'Received',
        timestamp: new Date(feedback.feedback_date),
        priority: feedback.type_of_feedback === 'Complaint',
        bgColor: feedback.type_of_feedback === 'Complaint' ? 'bg-red-50 border-red-200' : 'bg-pink-50 border-pink-200'
      });
    });
    
    // Sort by most recent timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Set activities and determine if "Load More" should be shown
    setRecentActivity(activities);
    setShowLoadMore(activities.length > 6);
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) { // Less than a day
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 10080) { // Less than a week
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleLoadMore = () => {
    setVisibleActivities(prev => prev + 6);
  };

  const handleShowLess = () => {
    setVisibleActivities(6);
  };

  // Function to get the correct image source
  const getImageSrc = () => {
    if (profile.profile_image) {
      return `/uploads/${profile.profile_image}`;
    }
    return "/admin-mental.png"; // Default placeholder image
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Accepted':
      case 'Completed':
        return <CheckCircle size={12} className="text-green-500" />;
      case 'In Progress':
        return <RefreshCw size={12} className="text-blue-500" />;
      case 'Pending':
        return <Clock size={12} className="text-yellow-500" />;
      case 'Rejected':
      case 'Cancelled':
        return <XCircle size={12} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      <CounselorSidebar activePage="DASHBOARD" />
      <main className="flex-1 w-full p-4 sm:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-center mb-8 gap-4 sm:gap-0 justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={getImageSrc()} 
                  width={48} 
                  height={48} 
                  alt="Counselor Avatar" 
                  className="rounded-full mr-0 sm:mr-4"
                  onError={(e) => {
                    e.target.src = "/admin-mental.png"; // Fallback to default image
                  }}
                />
                <div className="text-center sm:text-left">
                  <div className="text-xl md:text-2xl font-semibold text-gray-800">
                    {profile.full_name ? `Welcome, ${profile.full_name}!` : "Welcome, Counselor!"}
                  </div>
                  <div className="text-gray-500 text-sm">{profile.email || "Counselor Dashboard"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Auto-refresh: ON</span>
                </div>
                <NotificationDrawer />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-4 sm:gap-0">
              <div>
                <h1 className="text-3xl font-bold text-blue-800">Counselor Dashboard</h1>
                <div className="text-gray-600 mt-1">Welcome back, {profile.full_name || "Counselor"}</div>
              </div>
              <div className="text-gray-500 font-semibold text-sm">Today<br /><span className="text-black text-base">{today}</span></div>
            </div>

            {/* Stats Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
                <div className="mb-2"><Calendar size={28} className="text-blue-500" /></div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{stats.upcoming !== null ? stats.upcoming : '-'}</div>
                <div className="font-semibold text-gray-700 mb-0.5">Upcoming Appointments</div>
                <div className="text-xs text-gray-500">Next 7 days</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
                <div className="mb-2"><Users size={28} className="text-green-500" /></div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{stats.active !== null ? stats.active : '-'}</div>
                <div className="font-semibold text-gray-700 mb-0.5">Active Cases</div>
                <div className="text-xs text-gray-500">Currently managing</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
                <div className="mb-2"><AlertTriangle size={28} className="text-red-500" /></div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{stats.emergency !== null ? stats.emergency : '-'}</div>
                <div className="font-semibold text-gray-700 mb-0.5">Emergency Reports</div>
                <div className="text-xs text-gray-500">Requires attention</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
                <div className="mb-2"><FileText size={28} className="text-purple-500" /></div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{stats.materials !== null ? stats.materials : '-'}</div>
                <div className="font-semibold text-gray-700 mb-0.5">Materials Shared</div>
                <div className="text-xs text-gray-500">This month</div>
              </div>
            </section>
            {/* Quick Actions */}
            <section className="flex flex-col sm:flex-row gap-4 mb-6">
              <button className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg shadow transition text-lg" onClick={() => router.push('/counselor/emergency-reports')}>Review Emergency Cases</button>
              <button className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition text-lg" onClick={() => router.push('/counselor/appointments')}>Manage Appointments</button>
              <button className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow transition text-lg" onClick={() => router.push('/counselor/materials')}>Share Materials</button>
            </section>
            {/* Recent Activity */}
            <section className="bg-white rounded-xl shadow p-4 sm:p-6">
              <div className="font-semibold text-lg text-gray-800 mb-4">Recent Activity</div>
              <div className={recentActivity.length > 3 ? "max-h-80 overflow-y-auto" : ""}>
                <ul className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, visibleActivities).map((activity, index) => (
                      <li key={activity.id} className={`p-3 rounded-lg border ${activity.bgColor}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`mt-1 ${activity.iconColor}`}>
                              {activity.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${activity.priority ? 'text-red-800' : 'text-gray-800'}`}>
                                  {activity.title}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(activity.status)}
                                  <span className="text-xs text-gray-500">{activity.status}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {getTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 text-center py-8">No recent activity.</li>
                  )}
                </ul>
                {showLoadMore && visibleActivities < recentActivity.length && (
                  <div className="text-center mt-4">
                    <button
                      onClick={handleLoadMore}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Load More ({recentActivity.length - visibleActivities} more)
                    </button>
                  </div>
                )}
                {visibleActivities > 6 && (
                  <div className="text-center mt-2">
                    <button
                      onClick={handleShowLess}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
} 