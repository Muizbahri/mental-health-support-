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

  useEffect(() => {
    const now = new Date();
    setDate(now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    return () => clearInterval(interval);
  }, []);

  // Dummy data
  const psychiatristName = "Dr. Sarah Mitchell";
  const summary = [
    { label: "Active Cases", value: 24, change: "+3 this week", icon: <Users className="text-teal-600" size={28} /> },
    { label: "Today's Appointments", value: 8, change: "2 remaining", icon: <Calendar className="text-green-600" size={28} /> },
    { label: "Emergency Reports", value: 2, change: "Requires attention", icon: <AlertTriangle className="text-red-600" size={28} /> },
    { label: "New Referrals", value: 5, change: "Pending review", icon: <FileText className="text-orange-500" size={28} /> },
  ];
  const upcomingAppointments = [
    { name: "Emma Thompson", status: "confirmed", time: "09:00 AM", date: "Today", type: "Follow-up consultation" },
    { name: "Michael Rodriguez", status: "pending", time: "11:30 AM", date: "Today", type: "Initial Assessment" },
    { name: "Lisa Chen", status: "pending", time: "02:00 PM", date: "Today", type: "Medication Review" },
    { name: "David Wilson", status: "confirmed", time: "10:00 AM", date: "Tomorrow", type: "Therapy Session" },
  ];
  const activeCases = [
    { name: "Sarah Johnson", severity: "medium", diagnosis: "Major Depressive Disorder", updated: "2 days ago" },
    { name: "Robert Miller", severity: "high", diagnosis: "Anxiety Disorder", updated: "1 day ago" },
    { name: "Jennifer Davis", severity: "low", diagnosis: "Bipolar Disorder", updated: "1 week ago" },
    { name: "Alex Turner", severity: "medium", diagnosis: "PTSD", updated: "3 days ago" },
  ];
  const emergencyReports = [
    { name: "Mark Stevens", urgency: "Critical", desc: "Suicidal ideation reported", time: "45 minutes ago", reporter: "Crisis Hotline" },
    { name: "Amanda Foster", urgency: "High", desc: "Medication overdose concern", time: "1 hour ago", reporter: "Family Member" },
  ];
  const referralRequests = [
    { name: "Jessica White", type: "Standard", age: 28, desc: "Medication evaluation for anxiety", referredBy: "Dr. Maria Santos (Counselor)", time: "2 days ago", priority: "standard" },
    { name: "Thomas Brown", type: "Priority", age: 34, desc: "Bipolar disorder assessment", referredBy: "Dr. John Kim (Counselor)", time: "1 day ago", priority: "priority" },
    { name: "Rachel Green", type: "Standard", age: 29, desc: "Second opinion requested", referredBy: "Admin Team", time: "4 hours ago", priority: "standard" },
  ];
  const recentActivity = [
    { text: "Added clinical notes for Emma Thompson", time: "2 hours ago" },
    { text: "Completed session with Michael Rodriguez", time: "3 hours ago" },
    { text: "New referral from Dr. Maria Santos", time: "1 day ago" },
    { text: "Updated medication for Lisa Chen", time: "2 days ago" },
    { text: "Reviewed diagnostic assessment for David Wilson", time: "3 days ago" },
  ];
  const patientHistory = {
    search: "",
    recentlyAccessed: [
      { name: "Emma Thompson", type: "Clinical Notes", time: "2 hours ago" },
      { name: "Michael Rodriguez", type: "Prescription History", time: "1 day ago" },
      { name: "Lisa Chen", type: "Assessment Results", time: "2 days ago" },
    ],
  };

  function handleSidebarNav(path) {
    router.push(path);
  }
  function handleLogout() {
    localStorage.removeItem("psychiatrystUser");
    localStorage.removeItem("psychiatrystToken");
    localStorage.removeItem("full_name");
    router.push("/psychiatryst/login");
  }

  return (
    <div className="min-h-screen flex bg-[#f7fafd]">
      {/* Sidebar */}
      <PsychiatristSidebar activePage="DASHBOARD" />
      {/* Main Content */}
      <main className="flex-1 p-8 bg-[#f7fafd] min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#232347] mb-1">Good morning, {psychiatristName}</h1>
            <div className="text-gray-500 text-base">Welcome to your psychiatric practice dashboard</div>
          </div>
          <div className="flex items-center gap-4 text-gray-500 font-medium text-sm">
            <span>{date}</span>
            <span className="hidden md:inline-block">|</span>
            <span>{time}</span>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upcoming Appointments */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><Calendar size={18} /> Upcoming Appointments</div>
            <ul className="space-y-3">
              {upcomingAppointments.map((a, idx) => (
                <li key={a.name + idx} className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{a.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{a.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2"><Clock size={14} /> {a.time} • {a.date}</div>
                  <div className="text-xs text-gray-500">{a.type}</div>
                  <button className="text-xs text-teal-600 hover:underline font-medium mt-1">View Record</button>
                </li>
              ))}
            </ul>
          </section>
          {/* Active Cases */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><Users size={18} /> Active Cases ({activeCases.length})</div>
            <ul className="space-y-3">
              {activeCases.map((c, idx) => (
                <li key={c.name + idx} className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.severity === "high" ? "bg-red-100 text-red-700" : c.severity === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-teal-100 text-teal-700"}`}>{c.severity}</span>
                  </div>
                  <div className="text-xs text-gray-500">{c.diagnosis}</div>
                  <div className="text-xs text-gray-400">Updated {c.updated}</div>
                  <button className="text-xs text-teal-600 hover:underline font-medium mt-1">Details</button>
                </li>
              ))}
            </ul>
          </section>
          {/* Patient History & Tools */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><FileText size={18} /> Patient History & Tools</div>
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="Patient Search" className="w-full border rounded px-2 py-1 text-sm text-gray-700" />
                <button className="text-xs text-teal-600 hover:underline font-medium ml-2">Search Records</button>
              </div>
              <div className="flex flex-col gap-1 mb-2">
                <button className="text-xs text-teal-600 hover:underline font-medium text-left">Clinical Notes</button>
                <button className="text-xs text-teal-600 hover:underline font-medium text-left">Diagnostic Tools</button>
              </div>
              <div className="text-xs text-gray-500 font-semibold mb-1 mt-2">Recently Accessed</div>
              <ul className="text-xs text-gray-700">
                {patientHistory.recentlyAccessed.map((p, idx) => (
                  <li key={p.name + idx} className="flex justify-between items-center mb-1">
                    <span>{p.name} <span className="text-gray-400">({p.type})</span></span>
                    <span className="text-gray-400">{p.time}</span>
                    <button className="text-xs text-teal-600 hover:underline font-medium ml-2">Open</button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          {/* Emergency Reports */}
          <section className="lg:col-span-1 bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><AlertTriangle size={18} /> Emergency Reports ({emergencyReports.length})</div>
            <ul className="space-y-3">
              {emergencyReports.map((e, idx) => (
                <li key={e.name + idx} className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{e.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${e.urgency === "Critical" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{e.urgency}</span>
                  </div>
                  <div className="text-xs text-gray-500">{e.desc}</div>
                  <div className="text-xs text-gray-400">Reported by: {e.reporter}</div>
                  <div className="text-xs text-gray-400">{e.time}</div>
                  <button className="text-xs text-red-600 hover:underline font-medium mt-1">Urgent Review</button>
                </li>
              ))}
            </ul>
          </section>
        </div>
        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Referral Requests */}
          <section className="bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><FileText size={18} /> Referral Requests ({referralRequests.length})</div>
            <ul className="space-y-3">
              {referralRequests.map((r, idx) => (
                <li key={r.name + idx} className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{r.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.priority === "priority" ? "bg-yellow-100 text-yellow-700" : "bg-teal-100 text-teal-700"}`}>{r.type}</span>
                  </div>
                  <div className="text-xs text-gray-500">{r.desc}</div>
                  <div className="text-xs text-gray-400">Referred by: {r.referredBy}</div>
                  <div className="text-xs text-gray-400">{r.time}</div>
                  <div className="flex gap-2 mt-1">
                    <button className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium hover:bg-green-200">Accept</button>
                    <button className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium hover:bg-red-200">Decline</button>
                    <button className="text-xs text-teal-600 hover:underline font-medium">View Details</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          {/* Recent Activity */}
          <section className="bg-white rounded-xl shadow p-5 border border-gray-100 flex flex-col mb-4">
            <div className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2"><Info size={18} /> Recent Activity</div>
            <ul className="space-y-3">
              {recentActivity.map((a, idx) => (
                <li key={a.text + idx} className="flex items-center gap-2 border-b pb-2 last:border-b-0 last:pb-0">
                  <span className="text-gray-700 text-sm">{a.text}</span>
                  <span className="text-xs text-gray-400 ml-auto">{a.time}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
} 