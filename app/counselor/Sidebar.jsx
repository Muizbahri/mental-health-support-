"use client";
import { AlertTriangle, ClipboardList, FileText, MessageCircle, UserCircle, BookOpen, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const menu = [
  { key: "DASHBOARD", label: "Dashboard", icon: <UserCircle size={20} />, href: "/counselor/dashboard" },
  { key: "EMERGENCY", label: "Emergency Reports", icon: <AlertTriangle size={20} />, href: "/counselor/emergency-reports" },
  { key: "APPOINTMENTS", label: "Appointments", icon: <ClipboardList size={20} />, href: "/counselor/appointments" },
  { key: "MATERIALS", label: "Materials", icon: <FileText size={20} />, href: "/counselor/materials" },
  { key: "FEEDBACK", label: "Feedback", icon: <MessageCircle size={20} />, href: "/counselor/feedbacks" },
  { key: "PROFILE", label: "Profile", icon: <User size={20} />, href: "/counselor/profile" },
];

export default function CounselorSidebar({ activePage }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("counselorToken");
    localStorage.removeItem("counselorUser");
    localStorage.removeItem("full_name");
    router.push("/counselor/login");
  };

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col justify-between py-8 px-4 min-h-screen">
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-blue-100 p-2 rounded-xl">
            <UserCircle className="text-blue-500" size={28} />
          </div>
          <span className="font-bold text-xl text-gray-800 leading-tight">MENTAL HEALTH <span className="font-normal">CARE</span></span>
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
    </aside>
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