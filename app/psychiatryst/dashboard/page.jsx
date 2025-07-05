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
} from "lucide-react";
import PsychiatristSidebar from "../Sidebar";
import NotificationDrawer from '../../../components/NotificationDrawer';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const user = JSON.parse(localStorage.getItem("psychiatrystUser"));
        const token = user?.token;
        const fullName = user?.full_name;
        
        // Double-check authentication before API calls
        if (!user || !token) {
          router.push("/psychiatryst/login");
          return;
        }
        
        const apptRes = await fetch(`/api/appointments/assignee/${encodeURIComponent(fullName)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Check if API response indicates authentication failure
        if (apptRes.status === 401 || apptRes.status === 403) {
          localStorage.clear();
          router.push("/psychiatryst/login");
          return;
        }
        
        const apptData = await apptRes.json();
        setAppointments(apptData.success ? apptData.data : []);
        
        const emerRes = await fetch(`/api/emergency_cases?assigned_to=${encodeURIComponent(fullName)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (emerRes.status === 401 || emerRes.status === 403) {
          localStorage.clear();
          router.push("/psychiatryst/login");
          return;
        }
        
        const emerData = await emerRes.json();
        setEmergencies(emerData.success ? emerData.data : []);
        
        const refRes = await fetch(`http://localhost:5000/api/referral-requests/psychiatrist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (refRes.status === 401 || refRes.status === 403) {
          localStorage.clear();
          router.push("/psychiatryst/login");
          return;
        }
        
        const refData = await refRes.json();
        setReferrals(refData.success ? refData.data : []);
        setActiveCases([]);
        setRecentActivity([]);
      } catch (err) {
        console.error("Data fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAuthenticated, router]);

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
    { label: "Active Cases", value: activeCases.length, change: "", icon: <Users className="text-teal-600" size={28} /> },
    { label: "Today's Appointments", value: appointments.filter(a => a.date_time && a.date_time.slice(0,10) === new Date().toISOString().slice(0,10)).length, change: "", icon: <Calendar className="text-green-600" size={28} /> },
    { label: "Emergency Reports", value: emergencies.length, change: "", icon: <AlertTriangle className="text-red-600" size={28} /> },
    { label: "New Referrals", value: referrals.length, change: "", icon: <FileText className="text-orange-500" size={28} /> },
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
            <Image src="/admin-mental.png" width={48} height={48} alt="Psychiatrist Avatar" className="rounded-full mr-0 sm:mr-4" />
            <div className="text-center sm:text-left">
              <div className="text-xl md:text-2xl font-semibold text-gray-800">Welcome, Psychiatrist!</div>
              <div className="text-gray-500 text-sm">System Psychiatrist</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Upcoming Appointments */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><Calendar size={18} /> Upcoming Appointments</div>
            <ul className="space-y-3">
              {appointments.length === 0 ? (
                <li className="text-gray-400 text-sm">No upcoming appointments.</li>
              ) : (
                appointments.map((a, idx) => (
                  <li key={a.id || idx} className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{a.name_patient}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{a.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2"><Clock size={14} /> {a.date_time}</div>
                    <div className="text-xs text-gray-500">{a.type || a.role}</div>
                    <button className="text-xs text-teal-600 hover:underline font-medium mt-1">View Record</button>
                  </li>
                ))
              )}
            </ul>
          </section>
          {/* Active Cases */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><Users size={18} /> Active Cases ({activeCases.length})</div>
            <ul className="space-y-3">
              {activeCases.length === 0 ? (
                <li className="text-gray-400 text-sm">No active cases.</li>
              ) : (
                activeCases.map((c, idx) => (
                  <li key={c.id || idx} className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{c.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.severity === "high" ? "bg-red-100 text-red-700" : c.severity === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-teal-100 text-teal-700"}`}>{c.severity}</span>
                    </div>
                    <div className="text-xs text-gray-500">{c.diagnosis}</div>
                    <div className="text-xs text-gray-400">Updated {c.updated}</div>
                    <button className="text-xs text-teal-600 hover:underline font-medium mt-1">Details</button>
                  </li>
                ))
              )}
            </ul>
          </section>
          {/* Patient History & Tools */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><FileText size={18} /> Patient History & Tools</div>
            <div className="mb-2 text-gray-400 text-sm">No data available.</div>
          </section>
          {/* Emergency Reports */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><AlertTriangle size={18} /> Emergency Reports ({emergencies.length})</div>
            <ul className="space-y-3">
              {emergencies.length === 0 ? (
                <li className="text-gray-400 text-sm">No emergency reports.</li>
              ) : (
                emergencies.map((e, idx) => (
                  <li key={e.id || idx} className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{e.name_patient || e.name || "-"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${e.urgency === "Critical" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{e.urgency || "-"}</span>
                    </div>
                    <div className="text-xs text-gray-500">{e.description || e.desc || "-"}</div>
                    <div className="text-xs text-gray-400">Reported by: {e.reporter || "-"}</div>
                    <div className="text-xs text-gray-400">{e.time || e.created_at || "-"}</div>
                    <button className="text-xs text-red-600 hover:underline font-medium mt-1">Urgent Review</button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Referral Requests */}
          <section className="bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><FileText size={18} /> Referral Requests ({referrals.length})</div>
            <ul className="space-y-3">
              {referrals.length === 0 ? (
                <li className="text-gray-400 text-sm">No referral requests.</li>
              ) : (
                referrals.map((r, idx) => (
                  <li key={r.id || idx} className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{r.name_patient || r.name || "-"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.priority === "priority" ? "bg-yellow-100 text-yellow-700" : "bg-teal-100 text-teal-700"}`}>{r.type || r.status || "-"}</span>
                    </div>
                    <div className="text-xs text-gray-500">{r.description || r.desc || "-"}</div>
                    <div className="text-xs text-gray-400">Referred by: {r.referredBy || r.counselor_name || "-"}</div>
                    <div className="text-xs text-gray-400">{r.time || r.created_at || "-"}</div>
                    <div className="flex gap-2 mt-1">
                      <button className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium hover:bg-green-200">Accept</button>
                      <button className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium hover:bg-red-200">Decline</button>
                      <button className="text-xs text-teal-600 hover:underline font-medium">View Details</button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
          {/* Recent Activity */}
          <section className="bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><Info size={18} /> Recent Activity</div>
            <ul className="space-y-3">
              {recentActivity.length === 0 ? (
                <li className="text-gray-400 text-sm">No recent activity.</li>
              ) : (
                recentActivity.map((a, idx) => (
                  <li key={a.text + idx} className="flex items-center gap-2 border-b pb-2 last:border-b-0 last:pb-0">
                    <span className="text-gray-700 text-sm">{a.text}</span>
                    <span className="text-xs text-gray-400 ml-auto">{a.time}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
} 