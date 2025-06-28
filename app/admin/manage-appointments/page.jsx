"use client";
import { useRouter, usePathname } from "next/navigation";
import { Home, Users, BookOpen, MessageCircle, AlertTriangle, LogOut, Calendar, User, FileText, CheckSquare, X } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

const sidebarMenu = [
  { icon: <Home size={20} />, label: "Dashboard", path: "/admin/dashboard" },
  { icon: <Users size={20} />, label: "Manage Users", path: "/admin/manage-users" },
  { icon: <BookOpen size={20} />, label: "Manage Materials", path: "/admin/manage-materials" },
  { icon: <MessageCircle size={20} />, label: "Manage Feedback", path: "/admin/manage-feedbacks" },
  { icon: <Calendar size={20} />, label: "Manage Appointments", path: "/admin/manage-appointments" },
  { icon: <AlertTriangle size={20} />, label: "Manage Emergency Cases", path: "/admin/manage-emergency" },
];

function MinimalCalendar() {
  // Simple static calendar for demo
  return (
    <div className="bg-white rounded-xl shadow p-4 w-full max-w-xs">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="font-semibold text-gray-700">Apr</span>
        <span className="font-semibold text-gray-700">April</span>
      </div>
      <div className="grid grid-cols-7 text-xs text-gray-400 mb-1 px-1">
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={`weekday-${i}`} className="text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {Array.from({length: 30}, (_, i) => i + 1).map(day => (
          <div key={`day-${day}`} className="text-center py-1 rounded-lg hover:bg-blue-100 cursor-pointer text-gray-700 font-medium">
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMySQLDateTime(dtLocal) {
  // dtLocal: 'YYYY-MM-DDTHH:mm' => 'YYYY-MM-DD HH:mm:00'
  if (!dtLocal) return '';
  return dtLocal.replace('T', ' ') + ':00';
}

function formatDisplayDateTime(mysqlDateTime) {
  // mysqlDateTime: 'YYYY-MM-DD HH:mm:ss' or ISO string
  if (!mysqlDateTime) return '';
  // Try to parse as local time
  const dt = new Date(mysqlDateTime.replace(' ', 'T'));
  if (isNaN(dt.getTime())) return mysqlDateTime;
  return dt.toLocaleString();
}

function NewAppointmentModal({ isOpen, onClose, onAdd, loading }) {
  const [formData, setFormData] = useState({
    role: "",
    name_patient: "",
    assigned_to: "",
    status: "",
    date_time: "",
  });
  const [error, setError] = useState("");
  const [professionals, setProfessionals] = useState({ counselors: [], psychiatrists: [] });

  useEffect(() => {
    async function fetchProfessionals() {
      try {
        const [counselorRes, psychiatristRes] = await Promise.all([
          fetch('/api/counselors').then(res => res.json()),
          fetch('/api/psychiatrists').then(res => res.json())
        ]);
        setProfessionals({
          counselors: counselorRes.data || [],
          psychiatrists: psychiatristRes.data || []
        });
      } catch (err) {
        console.error("Failed to fetch professionals:", err);
      }
    }
    fetchProfessionals();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.role || !formData.name_patient || !formData.assigned_to || !formData.status || !formData.date_time) {
      setError("All fields are required.");
      return;
    }
    setError("");
    // Convert to MySQL format before sending
    const sendData = { ...formData, date_time: formatMySQLDateTime(formData.date_time) };
    onAdd(sendData, setError);
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({ role: "", name_patient: "", assigned_to: "", status: "", date_time: "" });
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">New Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Select Role</label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
            >
              <option value="" className="text-gray-500">Select a role</option>
              <option value="Psychiatrist" className="text-gray-900">Psychiatrist</option>
              <option value="Counselor" className="text-gray-900">Counselor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Name (Patient)</label>
            <input
              type="text"
              required
              value={formData.name_patient}
              onChange={(e) => setFormData({ ...formData, name_patient: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
              placeholder="Enter patient name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Assigned To</label>
            <select
              required
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
              disabled={!formData.role}
            >
              <option value="">Select a professional</option>
              {(formData.role === 'Counselor' ? professionals.counselors : professionals.psychiatrists).map(p => (
                <option key={p.id} value={p.full_name} className="font-semibold text-gray-800">{p.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
            >
              <option value="" className="text-gray-500">Select status</option>
              <option value="Resolved" className="text-gray-900">Resolved</option>
              <option value="In Progress" className="text-gray-900">In Progress</option>
              <option value="Solved" className="text-gray-900">Solved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Date/Time</label>
            <input
              type="datetime-local"
              required
              value={formData.date_time}
              onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>
          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditAppointmentModal({ open, appointment, loading, error, onClose, onSave }) {
  const [formData, setFormData] = useState({
    role: appointment?.role || '',
    name_patient: appointment?.name_patient || '',
    assigned_to: appointment?.assigned_to || '',
    status: appointment?.status || '',
    date_time: appointment?.date_time ? appointment.date_time.replace(' ', 'T').slice(0, 16) : '',
  });
  const [professionals, setProfessionals] = useState({ counselors: [], psychiatrists: [] });

  useEffect(() => {
    async function fetchProfessionals() {
      try {
        const [counselorRes, psychiatristRes] = await Promise.all([
          fetch('/api/counselors').then(res => res.json()),
          fetch('/api/psychiatrists').then(res => res.json())
        ]);
        setProfessionals({
          counselors: counselorRes.data || [],
          psychiatrists: psychiatristRes.data || []
        });
      } catch (err) {
        console.error("Failed to fetch professionals:", err);
      }
    }
    fetchProfessionals();
  }, []);

  useEffect(() => {
    if (appointment) {
      setFormData({
        role: appointment.role,
        name_patient: appointment.name_patient,
        assigned_to: appointment.assigned_to,
        status: appointment.status,
        date_time: appointment.date_time ? appointment.date_time.replace(' ', 'T').slice(0, 16) : '',
      });
    }
  }, [appointment]);

  const handleRoleChange = (e) => {
    setFormData({ ...formData, role: e.target.value, assigned_to: "" });
  };

  function handleChange(e) {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.role || !formData.name_patient || !formData.assigned_to || !formData.status || !formData.date_time) {
      return onSave(null, 'All fields are required.');
    }
    // Convert to MySQL format
    const sendData = { ...formData, date_time: formatMySQLDateTime(formData.date_time) };
    onSave(sendData);
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Edit Appointment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition p-1 hover:bg-gray-100 rounded-full"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Select Role</label>
            <select name="role" required value={formData.role} onChange={handleRoleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500">
              <option value="" className="text-gray-500">Select a role</option>
              <option value="Psychiatrist" className="text-gray-900">Psychiatrist</option>
              <option value="Counselor" className="text-gray-900">Counselor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Name (Patient)</label>
            <input name="name_patient" type="text" required value={formData.name_patient} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500" placeholder="Enter patient name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Assigned To</label>
            <select
              name="assigned_to"
              required
              value={formData.assigned_to}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
              disabled={!formData.role}
            >
              <option value="">Select a professional</option>
              {(formData.role === 'Counselor' ? professionals.counselors : professionals.psychiatrists).map(p => (
                <option key={p.id} value={p.full_name} className="font-semibold text-gray-800">{p.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
            <select name="status" required value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500">
              <option value="" className="text-gray-500">Select status</option>
              <option value="Resolved" className="text-gray-900">Resolved</option>
              <option value="In Progress" className="text-gray-900">In Progress</option>
              <option value="Solved" className="text-gray-900">Solved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Date/Time</label>
            <input name="date_time" type="datetime-local" required value={formData.date_time} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500" />
          </div>
          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
          <div className="flex justify-end gap-4 pt-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" disabled={loading}>Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageAppointmentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editModal, setEditModal] = useState({ open: false, appointment: null, loading: false, error: '' });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  function openEditModal(appointment) {
    setEditModal({ open: true, appointment, loading: false, error: '' });
  }
  function closeEditModal() {
    setEditModal({ open: false, appointment: null, loading: false, error: '' });
  }
  async function handleEditSave(updatedData) {
    setEditModal((m) => ({ ...m, loading: true, error: '' }));
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${editModal.appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...updatedData, assigned_to: updatedData.assigned_to}),
      });
      const data = await res.json();
      if (data.success) {
        closeEditModal();
        fetchAppointments();
      } else {
        setEditModal((m) => ({ ...m, error: data.message || 'Failed to update appointment.' }));
      }
    } catch (err) {
      setEditModal((m) => ({ ...m, error: 'Failed to update appointment.' }));
    }
    setEditModal((m) => ({ ...m, loading: false }));
  }

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    setFetching(true);
    setFetchError("");
    try {
      const res = await fetch("http://localhost:5000/api/appointments");
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
      } else {
        setFetchError("Failed to load appointments.");
      }
    } catch (err) {
      setFetchError("Failed to load appointments.");
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments by role
  const psychiatristAppointments = appointments.filter(apt => apt.role === "Psychiatrist");
  const counselorAppointments = appointments.filter(apt => apt.role === "Counselor");

  // Add appointment via backend
  const handleAddAppointment = async (formData, setError) => {
    setLoading(true);
    setError && setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...formData, assigned_to: formData.assigned_to}),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setSuccessMsg("Appointment added successfully.");
        fetchAppointments();
      } else {
        setError && setError(data.message || "Failed to add appointment.");
      }
    } catch (err) {
      setError && setError("Failed to add appointment.");
    }
    setLoading(false);
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    setDeleteError("");
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
      } else {
        setDeleteError(data.message || "Failed to delete appointment.");
      }
    } catch (err) {
      setDeleteError("Failed to delete appointment.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white rounded-xl shadow-lg m-4 flex flex-col p-4 justify-between">
        <div>
          <div className="flex items-center mb-6">
            <Image src="/brain-logo.png" width={32} height={32} alt="Logo" className="mr-2" />
            <span className="font-semibold text-lg text-gray-700">MENTAL HEALTH CARE</span>
          </div>
          <nav>
            <ul className="space-y-1">
              {sidebarMenu.map((item) => (
                <li key={item.label}>
                  <button
                    className={`flex items-center w-full px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 transition font-medium ${pathname === item.path ? 'bg-blue-50' : ''}`}
                    onClick={() => router.push(item.path)}
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
      <main className="flex-1 p-8 space-y-8">
        <h1 className="font-bold text-3xl mb-6 text-gray-900">Manage Appointments</h1>
        {successMsg && <div className="mb-4 text-green-700 bg-green-100 px-4 py-2 rounded-lg font-medium">{successMsg}</div>}
        {fetchError && <div className="mb-4 text-red-700 bg-red-100 px-4 py-2 rounded-lg font-medium">{fetchError}</div>}
        {deleteError && <div className="mb-4 text-red-700 bg-red-100 px-4 py-2 rounded-lg font-medium">{deleteError}</div>}
        {/* New Appointment Button */}
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="border border-neutral-300 px-5 py-2 rounded-lg hover:bg-neutral-100 transition text-gray-900 font-medium bg-white"
          >
            + New Appointment
          </button>
        </div>

        {/* New Appointment Modal */}
        <NewAppointmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddAppointment}
          loading={loading}
        />

        {/* Psychiatrists Table */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Psychiatrists</h2>
          <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Date/Time</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Name (Patient)</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Assigned To</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Status</th>
                  <th className="py-2 px-3 text-center font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {psychiatristAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center text-gray-500">
                        <Calendar size={48} className="mb-2 text-gray-400" />
                        <p className="text-sm font-medium">No psychiatrist appointments found</p>
                        <p className="text-xs mt-1">Click the "+ New Appointment" button to create one</p>
                      </div>
                    </td>
                  </tr>
                ) : psychiatristAppointments.map(row => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                    <td className="py-2 px-3 text-gray-800">{formatDisplayDateTime(row.date_time)}</td>
                    <td className="py-2 px-3 text-gray-800">{row.name_patient}</td>
                    <td className="py-2 px-3 text-gray-800">{row.assigned_to}</td>
                    <td className="py-2 px-3 text-gray-800">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === 'Solved' ? 'bg-green-100 text-green-700' :
                        row.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          onClick={() => openEditModal(row)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button 
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          onClick={() => handleDeleteAppointment(row.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Counselors Table */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Counselors</h2>
          <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Date/Time</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Name (Patient)</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Assigned To</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Status</th>
                  <th className="py-2 px-3 text-center font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {counselorAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center text-gray-500">
                        <Calendar size={48} className="mb-2 text-gray-400" />
                        <p className="text-sm font-medium">No counselor appointments found</p>
                        <p className="text-xs mt-1">Click the "+ New Appointment" button to create one</p>
                      </div>
                    </td>
                  </tr>
                ) : counselorAppointments.map(row => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                    <td className="py-2 px-3 text-gray-800">{formatDisplayDateTime(row.date_time)}</td>
                    <td className="py-2 px-3 text-gray-800">{row.name_patient}</td>
                    <td className="py-2 px-3 text-gray-800">{row.assigned_to}</td>
                    <td className="py-2 px-3 text-gray-800">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === 'Solved' ? 'bg-green-100 text-green-700' :
                        row.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          onClick={() => openEditModal(row)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button 
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          onClick={() => handleDeleteAppointment(row.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Appointment Modal */}
        <EditAppointmentModal
          open={editModal.open}
          appointment={editModal.appointment}
          loading={editModal.loading}
          error={editModal.error}
          onClose={closeEditModal}
          onSave={handleEditSave}
        />
      </main>
    </div>
  );
} 