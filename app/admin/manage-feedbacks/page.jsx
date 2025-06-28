"use client";
import { useRouter, usePathname } from "next/navigation";
import { Home, Users, BookOpen, MessageCircle, AlertTriangle, LogOut, Edit, Trash2, Plus, Calendar, User } from "lucide-react";
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

const FEEDBACK_TYPES = [
  { key: "public", label: "Public User", icon: <User size={18} /> },
  { key: "counselor", label: "Counselor", icon: <User size={18} /> },
  { key: "psychiatrist", label: "Psychiatrist Feedback" },
];

export default function ManageFeedbacksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [modal, setModal] = useState({ open: false, type: null, feedback: null });
  const [feedbacks, setFeedbacks] = useState({ public: [], counselor: [], psychiatrist: [] });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  async function fetchFeedbacks() {
    const [pub, coun, psych] = await Promise.all([
      fetch('/api/feedbacks/public').then(r => r.json()),
      fetch('/api/feedbacks/counselor').then(r => r.json()),
      fetch('/api/feedbacks/psychiatrist').then(r => r.json()),
    ]);
    function mapFeedbacks(arr) {
      return (arr || []).map(row => {
        let date = row.feedback_date || '';
        // If date is in ISO format, convert to YYYY-MM-DD in local time for input[type=date]
        if (date && date.length > 10) {
          const d = new Date(date);
          // Adjust for timezone offset so the date matches the DB
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          date = d.toISOString().slice(0, 10);
        }
        return {
          ...row,
          fullName: row.full_name,
          typeOfFeedback: row.type_of_feedback,
          date,
        };
      });
    }
    setFeedbacks({
      public: mapFeedbacks(pub.data),
      counselor: mapFeedbacks(coun.data),
      psychiatrist: mapFeedbacks(psych.data),
    });
  }

  useEffect(() => { fetchFeedbacks(); }, []);

  function handleAdd(type) {
    setModal({ open: true, type, feedback: null });
  }
  function handleEdit(type, feedback) {
    setModal({ open: true, type, feedback });
  }
  function handleClose() {
    setModal({ open: false, type: null, feedback: null });
  }
  async function handleSubmit(form, isEdit) {
    const payload = {
      user_role: modal.type,
      full_name: form.fullName,
      type_of_feedback: form.typeOfFeedback,
      feedback: form.feedback,
      feedback_date: form.date,
    };
    if (isEdit && modal.feedback && modal.feedback.id) {
      await fetch(`/api/feedbacks/${modal.feedback.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    handleClose();
    fetchFeedbacks();
  }
  async function handleDelete(type, id) {
    await fetch(`/api/feedbacks/${id}`, { method: 'DELETE' });
    fetchFeedbacks();
  }

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
        <h1 className="font-bold text-3xl mb-6 text-gray-900">Manage Feedback</h1>
        {FEEDBACK_TYPES.map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-900">{label}</h2>
              <button className="border border-neutral-300 px-5 py-2 rounded-lg hover:bg-neutral-100 transition flex items-center gap-2 text-gray-900 font-medium" onClick={() => handleAdd(key)}>
                <Plus size={18} /> Add
              </button>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="py-2 px-3 text-left font-semibold text-gray-800">Full Name</th>
                    <th className="py-2 px-3 text-left font-semibold text-gray-800">Type of Feedback</th>
                    <th className="py-2 px-3 text-left font-semibold text-gray-800">Feedback</th>
                    <th className="py-2 px-3 text-left font-semibold text-gray-800">Date</th>
                    <th className="py-2 px-3 text-left font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks[key].length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-4">No feedback found</td></tr>
                  ) : feedbacks[key].map(row => (
                    <tr key={row.id}>
                      <td className="py-2 px-3 text-gray-800">{row.fullName}</td>
                      <td className="py-2 px-3 text-gray-800">{row.typeOfFeedback}</td>
                      <td className="py-2 px-3 text-gray-800">{row.feedback}</td>
                      <td className="py-2 px-3 text-gray-800">{row.date}</td>
                      <td className="py-2 px-3 flex gap-2">
                        <button className="hover:text-blue-600" onClick={() => handleEdit(key, row)}><Edit size={18} /></button>
                        <button className="hover:text-red-500" onClick={() => handleDelete(key, row.id)}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {modal.open && (
          <FeedbackModal type={modal.type} feedback={modal.feedback} onClose={handleClose} onSubmit={handleSubmit} />
        )}
      </main>
    </div>
  );
}

function FeedbackModal({ type, feedback, onClose, onSubmit }) {
  const [form, setForm] = useState(feedback ? { ...feedback } : { fullName: '', typeOfFeedback: '', feedback: '', date: '' });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form, !!feedback);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <form onSubmit={handleSubmit} className="relative z-10 bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-5">
        <h3 className="text-2xl font-bold mb-2 text-gray-900">{feedback ? 'Edit' : 'Add'} Feedback</h3>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">Full Name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400" required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">Type of Feedback</label>
          <input name="typeOfFeedback" value={form.typeOfFeedback} onChange={handleChange} className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400" required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">Feedback</label>
          <textarea name="feedback" value={form.feedback} onChange={handleChange} className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400" rows={3} required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">Date</label>
          <input name="date" type="date" value={form.date} onChange={handleChange} className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400" required />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button type="button" className="px-4 py-2 rounded-lg border border-gray-400 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700" disabled={loading}>{loading ? (feedback ? 'Saving...' : 'Adding...') : (feedback ? 'Save' : 'Add')}</button>
        </div>
      </form>
    </div>
  );
} 