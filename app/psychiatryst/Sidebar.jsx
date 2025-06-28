"use client";
import { AlertTriangle, ClipboardList, FileText, MessageCircle, UserCircle, BookOpen, LogOut, User, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const menu = [
  { key: "DASHBOARD", label: "Dashboard", icon: <UserCircle size={20} />, href: "/psychiatryst/dashboard" },
  { key: "PROFILE", label: "Profile", icon: <User size={20} />, href: "/psychiatryst/profile" },
  { key: "APPOINTMENTS", label: "Appointments", icon: <ClipboardList size={20} />, href: "/psychiatryst/appointments" },
  { key: "EMERGENCY", label: "Emergency Cases", icon: <AlertTriangle size={20} />, href: "/psychiatryst/emergency-cases" },
  { key: "REFERRALS", label: "Referral Requests", icon: <FileText size={20} />, href: "/psychiatryst/referral-requests" },
  { key: "PATIENT_CASES", label: "Patient Cases", icon: <Users size={20} />, href: "/psychiatryst/patient-cases" },
  { key: "MATERIALS", label: "Materials Shared", icon: <BookOpen size={20} />, href: "/psychiatryst/materials" },
  { key: "FEEDBACK", label: "Feedback", icon: <MessageCircle size={20} />, href: "/psychiatryst/feedback" },
];

export default function PsychiatristSidebar({ activePage }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("psychiatrystToken");
    localStorage.removeItem("psychiatrystUser");
    localStorage.removeItem("full_name");
    router.push("/psychiatryst/login");
  };

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col justify-between py-8 px-4 min-h-screen">
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-teal-100 p-2 rounded-xl">
            <UserCircle className="text-teal-500" size={28} />
          </div>
          <span className="font-bold text-xl text-gray-800 leading-tight">MENTAL HEALTH <span className="font-normal">CARE</span></span>
        </div>
        <nav className="flex flex-col gap-2">
          {menu.map((item) => (
            <Link key={item.key} href={item.href} tabIndex={0} className="outline-none focus:ring-2 focus:ring-teal-400 rounded-lg">
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
  const activeClasses = active ? "bg-teal-50 text-teal-600 font-bold" : "text-gray-700 hover:bg-teal-50";
  const redClasses = red ? "text-red-600 hover:bg-red-50" : activeClasses;
  const bottomClasses = bottom ? "mt-10" : "";

  return (
    <div className={`${baseClasses} ${bottomClasses} ${red ? redClasses : activeClasses}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
} 