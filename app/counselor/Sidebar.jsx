"use client";
import { AlertTriangle, ClipboardList, FileText, MessageCircle, UserCircle, BookOpen, LogOut, User, ArrowRight, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const menu = [
  { key: "DASHBOARD", label: "Dashboard", icon: <UserCircle size={20} />, href: "/counselor/dashboard" },
  { key: "EMERGENCY", label: "Emergency Reports", icon: <AlertTriangle size={20} />, href: "/counselor/emergency-reports" },
  { key: "APPOINTMENTS", label: "Appointments", icon: <ClipboardList size={20} />, href: "/counselor/appointments" },
  { key: "MATERIALS", label: "Materials", icon: <FileText size={20} />, href: "/counselor/materials" },
  { key: "FEEDBACK", label: "Feedback", icon: <MessageCircle size={20} />, href: "/counselor/feedbacks" },
  { key: "REFERRAL", label: "Referral Request", icon: <ArrowRight size={20} />, href: "/counselor/referral-request" },
  { key: "SCRAPE_ACTIVITIES", label: "Scrape Activities", icon: <FileText size={20} />, href: "/counselor/scrape-activities" },
  { key: "PROFILE", label: "Profile", icon: <User size={20} />, href: "/counselor/profile" },
];

export default function CounselorSidebar({ activePage }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("counselorToken");
    localStorage.removeItem("counselorUser");
    localStorage.removeItem("full_name");
    router.push("/counselor/login");
  };

  return (
    <>
      {/* Mobile menu button */}
      <button className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow-lg" onClick={() => setOpen(true)}>
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>
      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`} style={{maxWidth:'100vw'}}>
        <div className="flex flex-col justify-between h-full py-8 px-4">
          <div>
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="bg-blue-100 p-2 rounded-xl">
                <HeartHandshake className="text-blue-500" size={28} />
              </div>
              <span className="font-bold text-xl text-gray-800 leading-tight">MENTAL HEALTH <span className="font-normal">CARE</span></span>
              <button className="md:hidden ml-auto text-gray-500" onClick={() => setOpen(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {menu.map((item) => (
                <Link key={item.key} href={item.href} tabIndex={0} className="outline-none focus:ring-2 focus:ring-blue-400 rounded-lg">
                  <SidebarItem
                    icon={item.icon}
                    label={item.label}
                    active={pathname === item.href}
                  />
                </Link>
              ))}
            </nav>
          </div>
          <div className="mb-2">
            <div onClick={handleLogout}>
              <SidebarItem icon={<LogOut size={20} />} label="Log Out" bottom red />
            </div>
          </div>
        </div>
      </aside>
      {/* Overlay for mobile */}
      {open && <div className="fixed inset-0 bg-white/80 z-30 md:hidden" onClick={() => setOpen(false)}></div>}
    </>
  );
}

function SidebarItem({ icon, label, active, bottom, red }) {
  const baseClasses = "flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition font-medium";
  const activeClasses = active ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700 hover:bg-blue-50";
  const redClasses = red ? "text-red-600 hover:bg-red-50" : activeClasses;
  const bottomClasses = bottom ? "mt-10" : "";

  return (
    <div className={`${baseClasses} ${bottomClasses} ${red ? redClasses : activeClasses}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
} 