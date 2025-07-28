"use client";
import { Home, Users, BookOpen, MessageCircle, Calendar, AlertTriangle, LogOut, ActivitySquare, ArrowRight, FileText, Brain, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const menu = [
  { key: "DASHBOARD", label: "Dashboard", icon: <Home size={20} />, path: "/admin/dashboard" },
  { key: "USERS", label: "Manage Users", icon: <Users size={20} />, path: "/admin/manage-users" },
  { key: "MATERIALS", label: "Manage Material", icon: <BookOpen size={20} />, path: "/admin/manage-materials" },
  { key: "FEEDBACKS", label: "Manage Feedback", icon: <MessageCircle size={20} />, path: "/admin/manage-feedbacks" },
  { key: "APPOINTMENTS", label: "Manage Appointments", icon: <Calendar size={20} />, path: "/admin/manage-appointments" },
  { key: "NGO", label: "Manage NGO Activity", icon: <ActivitySquare size={20} />, path: "/admin/manage-ngo" },
  { key: "EMERGENCY", label: "Manage Emergency Case", icon: <AlertTriangle size={20} />, path: "/admin/manage-emergency" },
  { key: "SCRAPE_ACTIVITIES", label: "Scrape Activities", icon: <FileText size={20} />, path: "/admin/scrape-activities" },
  { key: "REFERRAL", label: "Referral Request", icon: <ArrowRight size={20} />, path: "/admin/referral-request" },
  
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  return (
    <>
      {/* Mobile menu button */}
      <button className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow-lg" onClick={() => setOpen(true)}>
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>
      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 h-full w-64 bg-white rounded-xl shadow-lg m-0 md:m-4 p-0 z-40 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`} style={{maxWidth:'100vw'}}>
        <div className="flex flex-col justify-between h-full">
          <div className="p-4">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-2 rounded-xl mr-3">
                <Brain className="text-blue-500" size={28} />
              </div>
              <span className="font-semibold text-lg text-gray-700">MENTAL HEALTH CARE</span>
              <button className="md:hidden ml-auto text-gray-500" onClick={() => setOpen(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <ul className="space-y-1">
              {menu.map(item => (
                <li key={item.label}>
                  <button
                    className={`flex items-center w-full px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 font-medium transition ${
                      pathname === item.path ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {router.push(item.path); setOpen(false);}}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium transition w-full"
            >
              <LogOut size={20} />
              Log Out
            </button>
          </div>
        </div>
      </aside>
      {/* Overlay for mobile */}
      {open && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setOpen(false)}></div>}
    </>
  );
} 