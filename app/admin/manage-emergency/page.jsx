"use client";
import { useRouter, usePathname } from "next/navigation";
import { Home, Users, BookOpen, MessageCircle, AlertTriangle, LogOut, Search, Filter, Eye, Edit, Trash2, Plus, User, Calendar, ChevronDown, FileText, X } from "lucide-react";
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

const STATUS = [
  { label: "In Progress", value: "in_progress", color: "text-yellow-600", bg: "bg-yellow-50" },
  { label: "Resolved", value: "resolved", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Solved", value: "solved", color: "text-green-600", bg: "bg-green-50" },
];

const SEVERITY = {
  High: { icon: <AlertTriangle size={16} className="text-yellow-500" />, label: "High", color: "text-yellow-700" },
  Medium: { icon: <FileText size={16} className="text-blue-500" />, label: "Medium", color: "text-blue-700" },
  Low: { icon: <User size={16} className="text-green-500" />, label: "Low", color: "text-green-700" },
};

function NewCaseModal({ isOpen, onClose, onAdd, loading }) {
  const [formData, setFormData] = useState({
    name: "",
    ic: "",
    date: "",
    status: "In Progress",
    assigned: "",
    role: "Counselor",
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
    if (isOpen) {
      fetchProfessionals();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.ic || !formData.date || !formData.status || !formData.assigned || !formData.role) {
      setError("All fields are required.");
      return;
    }
    setError("");
    onAdd(formData);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-sm mx-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">New Emergency Case</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition p-1 hover:bg-gray-100 rounded-full"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Name (Patient)</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500" placeholder="Enter patient name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">IC Number</label>
            <input type="text" required value={formData.ic} onChange={e => setFormData({ ...formData, ic: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500" placeholder="Enter IC number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Date/Time</label>
            <input type="datetime-local" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
            <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500">
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Solved">Solved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Assigned To</label>
            <select
              required
              value={formData.assigned}
              onChange={e => setFormData({ ...formData, assigned: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-900 mb-2">Role</label>
            <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500">
              <option value="Counselor">Counselor</option>
              <option value="Psychiatrist">Psychiatrist</option>
            </select>
          </div>
          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" disabled={loading}>{loading ? "Adding..." : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCaseModal({ isOpen, onClose, onEdit, loading, initialData }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    ic: '',
    date: '',
    status: 'In Progress',
    assigned: '',
    role: 'Counselor',
  });
  const [error, setError] = useState('');
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
    if (isOpen) {
      fetchProfessionals();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name_patient,
        ic: initialData.ic_number,
        date: initialData.date_time ? initialData.date_time.replace(' ', 'T').slice(0, 16) : '',
        status: initialData.status,
        assigned: initialData.assigned_to,
        role: initialData.role,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.ic || !formData.date || !formData.status || !formData.assigned || !formData.role) {
      setError('All fields are required.');
      return;
    }
    setError('');
    onEdit(formData);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-sm mx-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Edit Emergency Case</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition p-1 hover:bg-gray-100 rounded-full"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Name (Patient)</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500" placeholder="Enter patient name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">IC Number</label>
            <input type="text" required value={formData.ic} onChange={e => setFormData({ ...formData, ic: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500" placeholder="Enter IC number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Date/Time</label>
            <input type="datetime-local" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
            <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500">
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Solved">Solved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Assigned To</label>
            <select
              required
              value={formData.assigned}
              onChange={e => setFormData({ ...formData, assigned: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-900 mb-2">Role</label>
            <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500">
              <option value="Counselor">Counselor</option>
              <option value="Psychiatrist">Psychiatrist</option>
            </select>
          </div>
          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDisplayDateTime(mysqlDateTime) {
  if (!mysqlDateTime) return '';
  // Expecting 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DDTHH:mm:ss'
  const dt = mysqlDateTime.replace('T', ' ').replace('Z', '').split(/[- :]/);
  if (dt.length < 5) return mysqlDateTime;
  // dt: [YYYY, MM, DD, HH, mm, ...]
  return `${dt[2]}/${dt[1]}/${dt[0]}, ${dt[3]}:${dt[4]}`;
}

export default function ManageEmergencyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editCaseData, setEditCaseData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  const fetchCases = async () => {
    setFetching(true);
    setFetchError("");
    try {
      const res = await fetch('http://194.164.148.171:5000/api/emergency_cases');
      const data = await res.json();
      if (data.success) {
        setCases(data.data);
      } else {
        setFetchError('Failed to load emergency cases.');
      }
    } catch (err) {
      setFetchError('Failed to load emergency cases.');
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleAddCase = async (formData) => {
    setModalLoading(true);
    const sendData = {
      name_patient: formData.name,
      ic_number: formData.ic,
      date_time: formData.date.replace('T', ' ') + ':00',
      status: formData.status,
      assigned_to: formData.assigned,
      role: formData.role,
    };
    try {
      const res = await fetch('http://194.164.148.171:5000/api/emergency_cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchCases(); // Refresh cases after add
      } else {
        alert(data.message || 'Failed to add emergency case.');
      }
    } catch (err) {
      alert('Failed to add emergency case.');
    }
    setModalLoading(false);
  };

  const handleDeleteCase = async (id) => {
    if (!window.confirm('Are you sure you want to delete this emergency case?')) return;
    try {
      const res = await fetch(`http://194.164.148.171:5000/api/emergency_cases/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setCases(prev => prev.filter(c => c.id !== id));
      } else {
        alert(data.message || 'Failed to delete emergency case.');
      }
    } catch (err) {
      alert('Failed to delete emergency case.');
    }
  };

  const handleEditCase = (row) => {
    setEditCaseData(row);
    setIsEditModalOpen(true);
  };

  const handleEditCaseSubmit = async (formData) => {
    setEditModalLoading(true);
    const sendData = {
      name_patient: formData.name,
      ic_number: formData.ic,
      date_time: formData.date.replace('T', ' ') + ':00',
      status: formData.status,
      assigned_to: formData.assigned,
      role: formData.role,
    };
    try {
      const res = await fetch(`http://194.164.148.171:5000/api/emergency_cases/${editCaseData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendData),
      });
      const data = await res.json();
      if (data.success) {
        setCases(prev => prev.map(c => c.id === editCaseData.id ? { ...c, ...sendData, id: editCaseData.id } : c));
        setIsEditModalOpen(false);
      } else {
        alert(data.message || 'Failed to update emergency case.');
      }
    } catch (err) {
      alert('Failed to update emergency case.');
    }
    setEditModalLoading(false);
  };

  // Update filteredCases to use fetched data
  const filteredCases = cases.filter(c =>
    (!search || c.name_patient.toLowerCase().includes(search.toLowerCase()) || c.ic_number.includes(search) || c.role.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || c.status === statusFilter) &&
    (!dateFilter || (c.date_time && c.date_time.slice(0, 10) === dateFilter))
  );

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
        <h1 className="font-bold text-3xl mb-6 text-gray-900">Manage Emergency Cases</h1>
        {/* Status Summary */}
        <div className="flex gap-6 mb-6">
          {STATUS.map(s => (
            <div key={s.label} className={`rounded-xl px-8 py-6 flex flex-col items-center shadow ${s.bg}`} style={{ minWidth: 120 }}>
              <span className="text-lg font-semibold text-gray-600">{s.label}</span>
              <span className={`text-3xl font-bold ${s.color}`}>{cases.filter(c => c.status === s.label).length}</span>
            </div>
          ))}
        </div>
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, IC number, clinic"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {STATUS.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
            </select>
            <input
              type="date"
              className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          <button className="ml-auto flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Case
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition text-gray-700 font-medium">
            <FileText size={18} /> Import CSV
          </button>
        </div>
        {/* Table */}
        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className="py-2 px-3 text-left font-semibold text-gray-800">Name (Patient)</th>
                <th className="py-2 px-3 text-left font-semibold text-gray-800">IC Number</th>
                <th className="py-2 px-3 text-left font-semibold text-gray-800">Date/Time</th>
                <th className="py-2 px-3 text-left font-semibold text-gray-800">Status</th>
                <th className="py-2 px-3 text-left font-semibold text-gray-800">Assigned To</th>
                <th className="py-2 px-3 text-left font-semibold text-gray-800">Role</th>
                <th className="py-2 px-3 text-left font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-4">No cases found</td></tr>
              ) : filteredCases.map(row => (
                <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                  <td className="py-2 px-3 text-gray-800">{row.name_patient}</td>
                  <td className="py-2 px-3 text-gray-800">{row.ic_number}</td>
                  <td className="py-2 px-3 text-gray-800">{formatDisplayDateTime(row.date_time)}</td>
                  <td className="py-2 px-3 text-gray-800">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                      row.status === 'Resolved' ? 'bg-blue-100 text-blue-700' :
                      row.status === 'Solved' ? 'bg-green-100 text-green-700' :
                      ''
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-800">{row.assigned_to}</td>
                  <td className="py-2 px-3 text-gray-800">{row.role}</td>
                  <td className="py-2 px-3 flex gap-2">
                    <button className="hover:text-blue-600" title="View"><Eye size={18} /></button>
                    <button className="hover:text-green-600" title="Edit" onClick={() => handleEditCase(row)}><Edit size={18} /></button>
                    <button className="hover:text-red-500" title="Delete" onClick={() => handleDeleteCase(row.id)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <NewCaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddCase} loading={modalLoading} />
        <EditCaseModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onEdit={handleEditCaseSubmit} loading={editModalLoading} initialData={editCaseData} />
      </main>
    </div>
  );
} 