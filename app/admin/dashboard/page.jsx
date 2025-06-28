"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
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
  Calendar
} from "lucide-react";

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

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-pink-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white rounded-3xl shadow-xl m-6 flex flex-col p-6 justify-between">
        <div>
          <div className="flex items-center mb-10">
            <Image src="/brain-logo.png" width={36} height={36} alt="Logo" className="mr-3" />
            <span className="font-semibold text-lg text-gray-700">MENTAL HEALTH CARE</span>
          </div>
          <nav>
            <ul className="space-y-2">
              {sidebarMenu.map((item, idx) => (
                <li key={item.label}>
                  <button
                    className={`flex items-center w-full px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 transition font-medium ${idx === 0 ? 'bg-blue-50' : ''}`}
                    tabIndex={0}
                    onClick={() => {
                      if (item.path) router.push(item.path);
                    }}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <button
          className="flex items-center gap-2 mt-8 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium transition"
          onClick={() => {
            localStorage.removeItem('adminToken');
            router.push('/admin/login');
          }}
        >
          <LogOut size={20} />
          Log Out
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-10">
        {/* Welcome/Profile */}
        <div className="flex items-center mb-8">
          <Image src="/admin-mental.png" width={48} height={48} alt="Admin Avatar" className="rounded-full mr-4" />
          <div>
            <div className="text-2xl font-semibold text-gray-800">Welcome, Admin!</div>
            <div className="text-gray-500 text-sm">System Administrator</div>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <SummaryCard
            icon={<Users size={32} className="text-blue-500" />}
            title="Manage User"
            description="View and manage all users."
            onClick={() => router.push('/admin/manage-users')}
          />
          <SummaryCard
            icon={<BookOpen size={32} className="text-green-500" />}
            title="Manage Material"
            description="Add or edit resources."
            onClick={() => router.push('/admin/manage-material')}
          />
          <SummaryCard
            icon={<MessageCircle size={32} className="text-yellow-500" />}
            title="Manage Feedback"
            description="Review user feedback."
            onClick={() => router.push('/admin/manage-feedback')}
          />
          <SummaryCard
            icon={<AlertTriangle size={32} className="text-red-500" />}
            title="Manage Emergency Case"
            description="Handle emergency cases."
            onClick={() => router.push('/admin/manage-emergency')}
          />
        </div>
        {/* Optionally add more dashboard content here */}
      </main>
    </div>
  );
}

function SummaryCard({ icon, title, description, onClick }) {
  return (
    <button
      className="w-full bg-white rounded-2xl shadow-md p-6 flex flex-col items-start hover:bg-blue-50 transition border border-gray-100 group"
      onClick={onClick}
    >
      <div className="mb-4">{icon}</div>
      <div className="font-semibold text-lg text-gray-800 mb-1">{title}</div>
      <div className="text-gray-500 text-sm mb-4">{description}</div>
      <span className="flex items-center text-blue-600 font-medium text-sm group-hover:underline">
        Go to {title} <ArrowRight size={16} className="ml-1" />
      </span>
    </button>
  );
} 