"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  UserCircle,
  Calendar,
  Users,
  AlertTriangle,
  FileText,
  MessageCircle,
  ClipboardList,
  BookOpen,
  LogOut,
  Search,
  ChevronRight,
  CheckCircle,
  XCircle,
  Info,
  Star,
  Hash,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Edit,
  Trash2,
  Send,
  RefreshCw,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PsychiatristSidebar from "../Sidebar";
import NotificationDrawer from '../../../components/NotificationDrawer';
import useAutoRefresh from '../../../hooks/useAutoRefresh';
import Image from "next/image";

const sidebarMenu = [
  { icon: <Calendar size={20} />, label: "Dashboard", path: "/psychiatryst/dashboard" },
  { icon: <UserCircle size={20} />, label: "Profile", path: "/psychiatryst/profile" },
  { icon: <ClipboardList size={20} />, label: "Appointments", path: "/psychiatryst/appointments" },
  { icon: <AlertTriangle size={20} />, label: "Emergency Cases", path: "/psychiatryst/emergency-cases" },
  { icon: <FileText size={20} />, label: "Referral Requests", path: "/psychiatryst/referral-requests" },
  { icon: <Users size={20} />, label: "Patient Cases", path: "/psychiatryst/patient-cases" },
  { icon: <BookOpen size={20} />, label: "Materials Shared", path: "/psychiatryst/materials" },
  { icon: <MessageCircle size={20} />, label: "Feedback", path: "/psychiatryst/feedback" },
];

export default function PsychiatristDashboard() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [activeCases, setActiveCases] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [visibleActivities, setVisibleActivities] = useState(6);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  
  // Add user state for dynamic header
  const [user, setUser] = useState({ full_name: '', email: '', profile_image: '', id: null });
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState('');

  // Authentication check on page load
  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const user = JSON.parse(localStorage.getItem("psychiatrystUser"));
        const token = user?.token;
        
        if (!user || !token) {
          // No valid authentication found, redirect to login
          router.push("/psychiatryst/login");
          return false;
        }
        
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.push("/psychiatryst/login");
        return false;
      }
    };

    if (!checkAuthentication()) {
      return;
    }

    // Prevent back button access after logout
    const handlePopState = () => {
      const user = JSON.parse(localStorage.getItem("psychiatrystUser"));
      if (!user || !user.token) {
        router.push("/psychiatryst/login");
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  useEffect(() => {
    const now = new Date();
    setDate(now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    return () => clearInterval(interval);
  }, []);

  // Update recent activity timestamps every minute for accuracy
  useEffect(() => {
    if (recentActivity.length > 0) {
      const timestampUpdateInterval = setInterval(() => {
        // Force a re-render to update timestamps
        setRecentActivity(prev => [...prev]);
      }, 60000); // Update every minute
      
      return () => clearInterval(timestampUpdateInterval);
    }
  }, [recentActivity.length]);

  // Centralized data fetching function
  const fetchDashboardData = async () => {
    if (!isAuthenticated || !user.id) return;

    setLoading(true);
    setError("");
    try {
      const userData = JSON.parse(localStorage.getItem("psychiatrystUser"));
      const token = userData?.token;
      
      // Double-check authentication before API calls
      if (!userData || !token) {
        router.push("/psychiatryst/login");
        return;
      }
      
      // Fetch psychiatrist appointments using psychiatrist_id
      const apptRes = await fetch(`/api/psychiatrist-appointments/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Check if API response indicates authentication failure
      if (apptRes.status === 401 || apptRes.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      const apptData = await apptRes.json();
      const allAppointments = apptData.data || [];
      setAppointments(allAppointments);
      
      // Set active cases (accepted appointments)
      const acceptedAppointments = allAppointments.filter(a => a.status === 'accepted');
      setActiveCases(acceptedAppointments);
      
      // Fetch emergency cases assigned to this psychiatrist
      const emerRes = await fetch(`/api/emergency_cases?psychiatrist_id=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (emerRes.status === 401 || emerRes.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      const emerData = await emerRes.json();
      setEmergencies(emerData.success ? emerData.data : []);
      
      // Fetch referral requests for psychiatrist
      const refRes = await fetch(`/api/referral-requests/psychiatrist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (refRes.status === 401 || refRes.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      const refData = await refRes.json();
      setReferrals(refData.success ? refData.data : []);
      
      // Fetch materials
      const materialsRes = await fetch("/api/materials", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (materialsRes.status === 401 || materialsRes.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      const materialsData = await materialsRes.json();
      setMaterials(materialsData.success ? materialsData.data : []);
      
      // Fetch feedback for psychiatrist
      const feedbackRes = await fetch(`/api/feedbacks/psychiatrist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (feedbackRes.status === 401 || feedbackRes.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      const feedbackData = await feedbackRes.json();
      setFeedbacks(feedbackData.success ? feedbackData.data : []);
      
      // Generate comprehensive recent activity
      generateRecentActivity(allAppointments, emerData.data || [], materialsData.success ? materialsData.data : [], refData.success ? refData.data : [], feedbackData.success ? feedbackData.data : []);
    } catch (err) {
      console.error("Data fetch error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [isAuthenticated, router, user.id]);

  // Auto-refresh dashboard data every 12 seconds
  const { refresh: refreshDashboard } = useAutoRefresh(
    fetchDashboardData,
    12000, // 12 seconds
    isAuthenticated && !!user.id,
    [isAuthenticated, user.id]
  );

  // Fetch current user profile data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUser = async () => {
      setUserLoading(true);
      setUserError('');
      try {
        const userData = JSON.parse(localStorage.getItem("psychiatrystUser"));
        const token = userData?.token;
        
        if (!token) {
          setUserError('No token found. Please log in again.');
          setUserLoading(false);
          return;
        }
        
        const res = await fetch('/api/psychiatrists/profile/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            router.push("/psychiatryst/login");
            return;
          }
          setUserError('Failed to fetch user info.');
          setUserLoading(false);
          return;
        }
        
        const data = await res.json();
        if (data.success && data.data) {
          setUser({
            full_name: data.data.full_name || '',
            email: data.data.email || '',
            profile_image: data.data.profile_image || '',
            id: data.data.id || null // Add id to user state
          });
        } else {
          setUserError('Invalid user data received.');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setUserError('Network error while fetching user info.');
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, [isAuthenticated, router]);

  // Handle referral request actions
  const handleReferralAction = async (referralId, action) => {
    try {
      const userData = JSON.parse(localStorage.getItem("psychiatrystUser"));
      const token = userData?.token;
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        router.push("/psychiatryst/login");
        return;
      }

      const response = await fetch(`/api/referral-requests/${referralId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        // Refresh all dashboard data to ensure consistency
        refreshDashboard();
        
        alert(`Referral request ${action} successfully.`);
      } else {
        alert('Failed to update referral request.');
      }
    } catch (error) {
      console.error('Error updating referral:', error);
      alert('An error occurred while updating the referral request.');
    }
  };

  // Handle view details
  const handleViewDetails = (referralId) => {
    router.push(`/psychiatryst/referral-requests?id=${referralId}`);
  };

  // Process data for monthly statistics chart
  const getMonthlyStatistics = () => {
    const currentYear = new Date().getFullYear();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const monthlyData = months.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = new Date(currentYear, index + 1, 0);
      
      // Count all patients assigned to this psychiatrist (regardless of status)
      const totalPatients = referrals.filter(r => {
        const date = new Date(r.created_at);
        const isInMonth = date >= monthStart && date <= monthEnd;
        // Double-check that this referral is for the current psychiatrist
        const isForThisPsychiatrist = !r.psychiatrist_id || r.psychiatrist_id === user.id;
        return isInMonth && isForThisPsychiatrist;
      }).length;
      
      // Count emergency cases assigned to this psychiatrist
      const emergencyCases = emergencies.filter(e => {
        const date = new Date(e.created_at);
        const isInMonth = date >= monthStart && date <= monthEnd;
        // Double-check that this emergency case is assigned to the current psychiatrist
        const isForThisPsychiatrist = !e.psychiatrist_id || e.psychiatrist_id === user.id;
        return isInMonth && isForThisPsychiatrist;
      }).length;
      
      // Count referral requests received by this psychiatrist
      const referralRequests = referrals.filter(r => {
        const date = new Date(r.created_at);
        const isInMonth = date >= monthStart && date <= monthEnd;
        // Double-check that this referral is for the current psychiatrist
        const isForThisPsychiatrist = !r.psychiatrist_id || r.psychiatrist_id === user.id;
        return isInMonth && isForThisPsychiatrist;
      }).length;
      
      return {
        month,
        totalPatients,
        emergencyCases,
        referralRequests
      };
    });
    
    return monthlyData;
  };

  const generateRecentActivity = (appointments, emergencyCases, materials, referralRequests, feedbacks) => {
    const activities = [];
    
    // Helper function to safely parse dates
    const parseDate = (dateString) => {
      if (!dateString) return new Date();
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date() : date;
    };
    
    // Add appointment activities
    appointments.forEach(apt => {
      if (!apt.id) return; // Skip if no ID
      
      const created = parseDate(apt.created_at);
      const updated = parseDate(apt.updated_at || apt.created_at);
      const isUpdated = apt.updated_at && updated > created;
      
      activities.push({
        id: `appointment-${apt.id}`,
        type: 'appointment',
        icon: <Calendar size={16} />,
        iconColor: apt.status === 'accepted' ? 'text-green-500' : apt.status === 'confirmed' ? 'text-blue-500' : 'text-gray-500',
        title: isUpdated ? 'Appointment Updated' : 'Appointment Scheduled',
        description: `with ${apt.name_patient || 'Patient'}`,
        status: apt.status,
        timestamp: isUpdated ? updated : created,
        priority: apt.status === 'confirmed' || apt.status === 'pending',
        bgColor: apt.status === 'confirmed' ? 'bg-blue-50 border-blue-200' : apt.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'
      });
    });
    
    // Add emergency case activities
    emergencyCases.forEach(emergency => {
      if (!emergency.id) return; // Skip if no ID
      
      const created = parseDate(emergency.created_at);
      const updated = parseDate(emergency.updated_at || emergency.created_at);
      const isUpdated = emergency.updated_at && updated > created;
      
      activities.push({
        id: `emergency-${emergency.id}`,
        type: 'emergency',
        icon: <AlertTriangle size={16} />,
        iconColor: emergency.status === 'In Progress' ? 'text-red-500' : emergency.status === 'Pending' ? 'text-orange-500' : 'text-gray-500',
        title: isUpdated ? 'Emergency Case Updated' : 'Emergency Case Assigned',
        description: `${emergency.name_patient || 'Patient'} - ${emergency.urgency || 'Medium'} priority`,
        status: emergency.status,
        timestamp: isUpdated ? updated : created,
        priority: emergency.status === 'In Progress' || emergency.status === 'Pending',
        bgColor: emergency.status === 'In Progress' ? 'bg-red-50 border-red-200' : emergency.status === 'Pending' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'
      });
    });
    
    // Add material activities
    materials.forEach(material => {
      if (!material.id) return; // Skip if no ID
      
      activities.push({
        id: `material-${material.id}`,
        type: 'material',
        icon: <FileText size={16} />,
        iconColor: 'text-purple-500',
        title: 'Material Shared',
        description: material.title,
        status: 'Shared',
        timestamp: parseDate(material.created_at),
        priority: false,
        bgColor: 'bg-purple-50 border-purple-200'
      });
    });
    
    // Add referral request activities
    referralRequests.forEach(referral => {
      if (!referral.id) return; // Skip if no ID
      
      const created = parseDate(referral.created_at);
      const updated = parseDate(referral.updated_at || referral.created_at);
      const isUpdated = referral.updated_at && updated > created;
      
      activities.push({
        id: `referral-${referral.id}`,
        type: 'referral',
        icon: <ArrowRight size={16} />,
        iconColor: referral.status === 'accepted' ? 'text-green-500' : referral.status === 'pending' ? 'text-yellow-500' : 'text-gray-500',
        title: isUpdated ? 'Referral Request Updated' : 'Referral Request Received',
        description: `${referral.patient_name || referral.name_patient} - ${referral.disorder}`,
        status: referral.status,
        timestamp: isUpdated ? updated : created,
        priority: referral.status === 'pending',
        bgColor: referral.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : referral.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-gray-50'
      });
    });
    
    // Add feedback activities
    feedbacks.forEach(feedback => {
      if (!feedback.id) return; // Skip if no ID
      
      activities.push({
        id: `feedback-${feedback.id}`,
        type: 'feedback',
        icon: <MessageCircle size={16} />,
        iconColor: 'text-pink-500',
        title: 'Feedback Received',
        description: `${feedback.type_of_feedback} from ${feedback.full_name}`,
        status: 'Received',
        timestamp: parseDate(feedback.feedback_date),
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

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    let date;
    
    // Handle various input types (string, Date object, or timestamp)
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Unknown time';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Handle future dates (should not happen but just in case)
    if (diffInMs < 0) {
      return 'Just now';
    }
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
      case 'Completed':
        return <CheckCircle size={12} className="text-green-500" />;
      case 'confirmed':
      case 'In Progress':
        return <RefreshCw size={12} className="text-blue-500" />;
      case 'pending':
      case 'Pending':
        return <Clock size={12} className="text-yellow-500" />;
      case 'rejected':
      case 'Cancelled':
        return <XCircle size={12} className="text-red-500" />;
      default:
        return null;
    }
  };

  function handleSidebarNav(path) {
    router.push(path);
  }
  
  function handleLogout() {
    // Clear all possible authentication data from localStorage
    localStorage.removeItem("psychiatrystUser");
    localStorage.removeItem("psychiatrystToken");
    localStorage.removeItem("psychiatristUser");
    localStorage.removeItem("psychiatristToken");
    localStorage.removeItem("full_name");
    localStorage.removeItem("email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    
    // Clear all sessionStorage as well
    sessionStorage.clear();
    
    // Clear any cookies if they exist
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force page to reload and prevent back button access
    window.history.replaceState(null, null, '/psychiatryst/login');
    
    // Navigate to login page
    router.push("/psychiatryst/login");
    
    // Force a hard refresh to ensure all cached data is cleared
    setTimeout(() => {
      window.location.href = "/psychiatryst/login";
    }, 100);
  }

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  const summary = [
    { label: "Active Cases", value: referrals.length, change: "Referral requests", icon: <Users className="text-teal-600" size={28} /> },
    { 
      label: "Upcoming Appointments", 
      value: appointments.filter(a => {
        if (!a.date_time) return false;
        const appointmentDate = new Date(a.date_time);
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return appointmentDate >= now && appointmentDate <= nextWeek;
      }).length, 
      change: "Next 7 days", 
      icon: <Calendar className="text-green-600" size={28} /> 
    },
    { label: "Emergency Reports", value: emergencies.length, change: "", icon: <AlertTriangle className="text-red-600" size={28} /> },
    { label: "New Referrals", value: referrals.filter(r => r.status === 'pending').length, change: "Awaiting review", icon: <FileText className="text-orange-500" size={28} /> },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Sidebar */}
      <PsychiatristSidebar activePage="DASHBOARD" />
      {/* Main Content */}
      <main className="flex-1 w-full p-4 sm:p-8 min-h-screen bg-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center mb-8 gap-4 sm:gap-0 justify-between">
          <div className="flex items-center gap-4">
            {userLoading ? (
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mr-0 sm:mr-4"></div>
            ) : (
              <img 
                src={user.profile_image ? `/uploads/${user.profile_image}` : '/admin-mental.png'} 
                width={48} 
                height={48} 
                alt="Psychiatrist Avatar" 
                className="rounded-full mr-0 sm:mr-4 object-cover w-12 h-12" 
              />
            )}
            <div className="text-center sm:text-left">
              {userLoading ? (
                <>
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                </>
              ) : userError ? (
                <>
                  <div className="text-xl md:text-2xl font-semibold text-gray-800">Welcome, Psychiatrist!</div>
                  <div className="text-red-500 text-sm">{userError}</div>
                </>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-semibold text-gray-800">
                    Welcome, {user.full_name || 'Psychiatrist'}!
                  </div>
                  <div className="text-gray-500 text-sm">{user.email || 'System Psychiatrist'}</div>
                </>
              )}
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          {summary.map((card, idx) => (
            <div key={card.label} className="bg-white rounded-xl shadow p-6 flex flex-col items-start border border-gray-100">
              <div className="mb-2">{card.icon}</div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{card.value}</div>
              <div className="font-semibold text-gray-700 mb-0.5">{card.label}</div>
              <div className="text-xs text-gray-500">{card.change}</div>
            </div>
          ))}
        </div>
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Upcoming Appointments */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><Calendar size={18} /> Upcoming Appointments</div>
            <div className={`space-y-3 ${(() => {
              const upcomingAppointments = appointments.filter(a => {
                if (!a.date_time) return false;
                const appointmentDate = new Date(a.date_time);
                const now = new Date();
                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return appointmentDate >= now && appointmentDate <= nextWeek;
              });
              return upcomingAppointments.length > 3 ? 'max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400' : '';
            })()}`}>
              {(() => {
                const upcomingAppointments = appointments.filter(a => {
                  if (!a.date_time) return false;
                  const appointmentDate = new Date(a.date_time);
                  const now = new Date();
                  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return appointmentDate >= now && appointmentDate <= nextWeek;
                });
                
                if (upcomingAppointments.length === 0) {
                  return <div className="text-gray-400 text-sm">No upcoming appointments in the next 7 days.</div>;
                }
                
                return upcomingAppointments.map((a, idx) => (
                  <div key={a.id || idx} className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{a.name_patient}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === "accepted" ? "bg-green-100 text-green-700" : a.status === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{a.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2"><Clock size={14} /> {new Date(a.date_time).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Contact: {a.contact}</div>
                    <button className="text-xs text-teal-600 hover:underline font-medium mt-1">View Record</button>
                  </div>
                ));
              })()}
            </div>
          </section>
          {/* Referral Requests */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><FileText size={18} /> Referral Requests ({referrals.length})</div>
            <div className={`space-y-3 ${referrals.length > 3 ? 'max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400' : ''}`}>
              {referrals.length === 0 ? (
                <div className="text-gray-400 text-sm">No referral requests.</div>
              ) : (
                referrals.map((r, idx) => (
                  <div key={r.id || idx} className="flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{r.patient_name || r.name_patient || "-"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        r.status === "pending" ? "bg-yellow-100 text-yellow-700" : 
                        r.status === "accepted" ? "bg-green-100 text-green-700" : 
                        r.status === "rejected" ? "bg-red-100 text-red-700" : 
                        "bg-blue-100 text-blue-700"
                      }`}>{r.status || "Pending"}</span>
                    </div>
                    <div className="text-xs text-gray-500">{r.disorder || r.description || "-"}</div>
                    <div className="text-xs text-gray-400">Referred by: {r.referred_by || r.counselor_name || "-"}</div>
                    <div className="text-xs text-gray-400">Date: {r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}</div>
                    
                    {r.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button 
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium hover:bg-green-200 transition"
                          onClick={() => handleReferralAction(r.id, 'accepted')}
                        >
                          Accept
                        </button>
                        <button 
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium hover:bg-red-200 transition"
                          onClick={() => handleReferralAction(r.id, 'rejected')}
                        >
                          Decline
                        </button>
                        <button 
                          className="text-xs text-teal-600 hover:underline font-medium"
                          onClick={() => handleViewDetails(r.id)}
                        >
                          View Details
                        </button>
                      </div>
                    )}
                    
                    {r.status !== 'pending' && (
                      <button 
                        className="text-xs text-teal-600 hover:underline font-medium mt-1"
                        onClick={() => handleViewDetails(r.id)}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
          {/* Emergency Reports */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><AlertTriangle size={18} /> Emergency Reports ({emergencies.length})</div>
            <div className={`space-y-3 ${emergencies.length > 3 ? 'max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400' : ''}`}>
              {emergencies.length === 0 ? (
                <div className="text-gray-400 text-sm">No emergency reports.</div>
              ) : (
                emergencies.map((e, idx) => (
                  <div key={e.id || idx} className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{e.name_patient || e.name || "-"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${e.urgency === "Critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{e.urgency || "Medium"}</span>
                    </div>
                    <div className="text-xs text-gray-500">{e.description || e.desc || "-"}</div>
                    <div className="text-xs text-gray-400">Reported: {e.created_at || "-"}</div>
                    <button className="text-xs text-red-600 hover:underline font-medium mt-1">Urgent Review</button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Monthly Statistics Chart */}
          <section className="bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp size={18} /> Monthly Statistics - {new Date().getFullYear()}
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getMonthlyStatistics()}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="rect"
                  />
                  <Bar 
                    dataKey="totalPatients" 
                    fill="#10b981" 
                    name="Total Patients"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="emergencyCases" 
                    fill="#ef4444" 
                    name="Emergency Cases"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="referralRequests" 
                    fill="#3b82f6" 
                    name="Referral Requests"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          {/* Recent Activity */}
          <section className="bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><Info size={18} /> Recent Activity</div>
            <div className={recentActivity.length > 3 ? "max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400" : ""}>
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
        </div>
      </main>
    </div>
  );
} 