"use client";
import { useState, useEffect } from "react";
import { Calendar, Users, AlertTriangle, FileText, MessageCircle, UserCircle, Edit, ChevronRight, Plus, ClipboardList, BookOpen, LogOut } from "lucide-react";
import Image from "next/image";
import CounselorSidebar from "../Sidebar";
import { useRouter } from "next/navigation";

const sidebarMenu = [
  { icon: <Calendar size={20} />, label: "Dashboard", badge: null },
  { icon: <AlertTriangle size={20} />, label: "Emergency Reports", badge: 3, badgeColor: "bg-red-500" },
  { icon: <ClipboardList size={20} />, label: "Appointments", badge: 12, badgeColor: "bg-blue-500" },
  { icon: <BookOpen size={20} />, label: "Materials", badge: null },
  { icon: <MessageCircle size={20} />, label: "Feedback", badge: 5, badgeColor: "bg-pink-500" },
  { icon: <UserCircle size={20} />, label: "Profile", badge: null },
];

const stats = [
  {
    icon: <Calendar size={28} className="text-blue-500" />,
    label: "Upcoming Appointments",
    count: null,
    desc: "Next 7 days"
  },
  {
    icon: <Users size={28} className="text-green-500" />,
    label: "Active Cases",
    count: null,
    desc: "Currently managing"
  },
  {
    icon: <AlertTriangle size={28} className="text-red-500" />,
    label: "Emergency Reports",
    count: null,
    desc: "Requires attention"
  },
  {
    icon: <FileText size={28} className="text-purple-500" />,
    label: "Materials Shared",
    count: null,
    desc: "This month"
  }
];

const recentActivity = [
  {
    text: "Appointment scheduled with Maria Garcia",
    time: "2 hours ago"
  },
  {
    text: "Emergency report submitted - requires review",
    time: "4 hours ago",
    priority: true
  },
  {
    text: "New feedback received from John Smith",
    time: "6 hours ago"
  },
  {
    text: "Anxiety management guide shared with 3 patients",
    time: "1 day ago"
  }
];

export default function CounselorDashboard() {
  const [experience, setExperience] = useState("");
  const [editing, setEditing] = useState(false);
  const [expInput, setExpInput] = useState("");
  const [stats, setStats] = useState({ upcoming: null, active: null, emergency: null, materials: null });
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("counselorUser"));
    if (!user) return;
    // Fetch Upcoming Appointments (In Progress)
    fetch(`http://194.164.148.171:5000/api/appointments/counselor/${encodeURIComponent(user.full_name)}`)
      .then(res => res.json())
      .then(data => {
        const all = data.success ? data.data : [];
        setStats(s => ({
          ...s,
          upcoming: all.filter(a => a.status === "In Progress").length,
          active: all.length
        }));
      });
    // Fetch Emergency Cases
    fetch(`http://194.164.148.171:5000/api/emergency_cases?assigned_to=${encodeURIComponent(user.full_name)}`)
      .then(res => res.json())
      .then(data => setStats(s => ({ ...s, emergency: data.success ? data.data.length : 0 })));
    // Fetch Materials
    fetch("http://194.164.148.171:5000/api/materials")
      .then(res => res.json())
      .then(data => setStats(s => ({ ...s, materials: data.success ? data.data.length : 0 })));
  }, []);

  return (
    <div className="min-h-screen flex bg-[#f7fafc]">
      <CounselorSidebar activePage="DASHBOARD" />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Counselor Dashboard</h1>
            <div className="text-gray-600 mt-1">Welcome back, Dr. Sarah Johnson</div>
          </div>
          <div className="text-gray-500 font-semibold text-sm">Today<br /><span className="text-black text-base">{today}</span></div>
        </div>
        {/* Professional Experience */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-2">
            <div className="font-semibold text-lg text-gray-800">Your Professional Experience</div>
            <button className="flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium" onClick={() => setEditing(v => !v)}>
              <Edit size={16} /> Edit
            </button>
          </div>
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full border rounded p-2 text-gray-700"
                rows={4}
                value={expInput}
                onChange={e => setExpInput(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button className="px-4 py-1 bg-blue-600 text-white rounded" onClick={() => { setExperience(expInput); setEditing(false); }}>Save</button>
                <button className="px-4 py-1 bg-gray-200 text-gray-700 rounded" onClick={() => { setExpInput(experience); setEditing(false); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="text-gray-700 text-base bg-green-50 rounded p-3 border border-green-100">{experience || '-'}</div>
          )}
        </section>
        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
        <section className="flex gap-4 mb-6">
          <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg shadow transition text-lg" onClick={() => router.push('/counselor/emergency-reports')}>Review Emergency Cases</button>
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition text-lg" onClick={() => router.push('/counselor/appointments')}>Manage Appointments</button>
          <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow transition text-lg" onClick={() => router.push('/counselor/materials')}>Share Materials</button>
        </section>
        {/* Recent Activity */}
        <section className="bg-white rounded-xl shadow p-6">
          <div className="font-semibold text-lg text-gray-800 mb-4">Recent Activity</div>
          <ul className="space-y-3">
            {/* Render real activity data here when available */}
            <li className="text-gray-500 text-center">No recent activity.</li>
          </ul>
        </section>
      </main>
    </div>
  );
} 