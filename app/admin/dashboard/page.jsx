"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Home,
  Users,
  BookOpen,
  MessageCircle,
  AlertTriangle,
  LogOut,
  UserCircle,
  ArrowRight,
  Calendar,
  RefreshCw
} from "lucide-react";
import AdminSidebar from '../Sidebar';
import NotificationDrawer from '../../../components/NotificationDrawer';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const sidebarMenu = [
  { icon: <Home size={20} />, label: "Dashboard", path: "/admin/dashboard" },
  { icon: <Users size={20} />, label: "Manage Users", path: "/admin/manage-users" },
  { icon: <BookOpen size={20} />, label: "Manage Material", path: "/admin/manage-materials" },
  { icon: <MessageCircle size={20} />, label: "Manage Feedback", path: "/admin/manage-feedbacks" },
  { icon: <Calendar size={20} />, label: "Manage Appointments", path: "/admin/manage-appointments" },
  { icon: <AlertTriangle size={20} />, label: "Manage Emergency Case", path: "/admin/manage-emergency" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMaterials: 0,
    totalFeedbacks: 0,
    totalEmergencies: 0,
    totalAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  // Centralized data fetching function
  const fetchDashboardData = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Helper function to safely fetch and parse JSON
      const safeFetch = async (url, options = {}) => {
        try {
          const response = await fetch(url, options);
          
          // Check if response is ok
          if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
            return { success: false, data: [] };
          }

          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error(`Invalid content type for ${url}: ${contentType}`);
            return { success: false, data: [] };
          }

          const data = await response.json();
          return data;
        } catch (error) {
          console.error(`Error fetching ${url}:`, error);
          return { success: false, data: [] };
        }
      };

      // Fetch all statistics in parallel with error handling
      const [usersData, materialsData, feedbacksData, emergencyData, appointmentsData] = await Promise.all([
        safeFetch('/api/public-users', { headers: { 'Authorization': `Bearer ${token}` } }),
        safeFetch('/api/materials', { headers: { 'Authorization': `Bearer ${token}` } }),
        safeFetch('/api/feedbacks/all', { headers: { 'Authorization': `Bearer ${token}` } }),
        safeFetch('/api/emergency_cases', { headers: { 'Authorization': `Bearer ${token}` } }),
        safeFetch('/api/appointments/admin', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      // Update stats with fallback values
      setStats({
        totalUsers: (usersData && usersData.success && Array.isArray(usersData.data)) ? usersData.data.length : 0,
        totalMaterials: (materialsData && materialsData.success && Array.isArray(materialsData.data)) ? materialsData.data.length : 0,
        totalFeedbacks: (feedbacksData && feedbacksData.success && Array.isArray(feedbacksData.data)) ? feedbacksData.data.length : 0,
        totalEmergencies: (emergencyData && emergencyData.success && Array.isArray(emergencyData.data)) ? emergencyData.data.length : 0,
        totalAppointments: (appointmentsData && appointmentsData.success && Array.isArray(appointmentsData.data)) ? appointmentsData.data.length : 0
      });

      // Log any failed endpoints for debugging
      if (!usersData.success) console.warn('Users API failed');
      if (!materialsData.success) console.warn('Materials API failed');
      if (!feedbacksData.success) console.warn('Feedbacks API failed');
      if (!emergencyData.success) console.warn('Emergency cases API failed');
      if (!appointmentsData.success) console.warn('Appointments API failed');

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError('Failed to load dashboard data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh dashboard data every 15 seconds
  const { refresh: refreshDashboard } = useAutoRefresh(
    fetchDashboardData,
    15000, // 15 seconds
    true,
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-pink-50 flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-10">
        {/* Welcome/Profile */}
        <div className="flex flex-col sm:flex-row items-center mb-8 gap-4 sm:gap-0 justify-between">
          <div className="flex items-center gap-4">
            <Image src="/admin-mental.png" width={48} height={48} alt="Admin Avatar" className="rounded-full mr-0 sm:mr-4" />
            <div className="text-center sm:text-left">
              <div className="text-xl md:text-2xl font-semibold text-gray-800">Welcome, Admin!</div>
              <div className="text-gray-500 text-sm">System Administrator</div>
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
        {loading && !error ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 text-lg mb-2">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={refreshDashboard}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-10">
            <SummaryCard
              icon={<Users size={32} className="text-blue-500" />}
              title="Manage User"
              description="View and manage all users."
              count={stats.totalUsers}
              onClick={() => router.push('/admin/manage-users')}
            />
            <SummaryCard
              icon={<BookOpen size={32} className="text-green-500" />}
              title="Manage Material"
              description="Add or edit resources."
              count={stats.totalMaterials}
              onClick={() => router.push('/admin/manage-materials')}
            />
            <SummaryCard
              icon={<MessageCircle size={32} className="text-yellow-500" />}
              title="Manage Feedback"
              description="Review user feedback."
              count={stats.totalFeedbacks}
              onClick={() => router.push('/admin/manage-feedbacks')}
            />
            <SummaryCard
              icon={<Calendar size={32} className="text-purple-500" />}
              title="Manage Appointments"
              description="Oversee all appointments."
              count={stats.totalAppointments}
              onClick={() => router.push('/admin/manage-appointments')}
            />
            <SummaryCard
              icon={<AlertTriangle size={32} className="text-red-500" />}
              title="Manage Emergency Case"
              description="Handle emergency cases."
              count={stats.totalEmergencies}
              onClick={() => router.push('/admin/manage-emergency')}
            />
          </div>
        )}
        {/* Optionally add more dashboard content here */}
      </main>
    </div>
  );
}

function SummaryCard({ icon, title, description, count, onClick }) {
  return (
    <button
      className="w-full bg-white rounded-2xl shadow-md p-6 flex flex-col items-start hover:bg-blue-50 transition border border-gray-100 group"
      onClick={onClick}
    >
      <div className="mb-4">{icon}</div>
      <div className="text-2xl font-bold text-gray-800 mb-1">{count}</div>
      <div className="font-semibold text-lg text-gray-800 mb-1">{title}</div>
      <div className="text-gray-500 text-sm mb-4">{description}</div>
      <span className="flex items-center text-blue-600 font-medium text-sm group-hover:underline">
        Go to {title} <ArrowRight size={16} className="ml-1" />
      </span>
    </button>
  );
} 