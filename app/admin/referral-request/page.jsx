"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "../Sidebar";
import { Plus, Edit, Trash2 } from "lucide-react";
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const STATUS_OPTIONS = ["Pending", "Accepted", "Rejected"];

function ReferralModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(
    initial || {
      patient_name: "",
      referred_by: "",
      disorder: "",
      status: "Pending",
      psychiatrist_id: ""
    }
  );
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  useEffect(() => {
    setForm(initial || {
      patient_name: "",
      referred_by: "",
      disorder: "",
      status: "Pending",
      psychiatrist_id: ""
    });
    setSelectedDoctorId(initial && initial.psychiatrist_id ? String(initial.psychiatrist_id) : "");
    fetch("/api/psychiatrists")
      .then(res => res.json())
      .then(data => {
        console.log('Fetched psychiatrists:', data);
        setDoctors(Array.isArray(data.data) ? data.data : []);
      });
  }, [initial, open]);
  useEffect(() => {
    if (initial && doctors.length > 0) {
      const doc = doctors.find(d => String(d.id) === String(initial.psychiatrist_id));
      if (doc) setSelectedDoctorId(String(doc.id));
    }
  }, [doctors, initial]);
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleDoctorChange = e => {
    const id = e.target.value;
    setSelectedDoctorId(id);
    const doc = doctors.find(d => String(d.id) === String(id));
    setForm(f => ({ ...f, referred_by: doc ? doc.full_name : "", psychiatrist_id: doc ? doc.id : "" }));
  };
  const handleSubmit = e => {
    e.preventDefault();
    onSave({ ...form, psychiatrist_id: selectedDoctorId });
  };
  const selectedDoctor = doctors.find(d => String(d.id) === String(selectedDoctorId));
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold mb-2 text-black">{initial ? "Edit" : "Add"} Referral Request</h2>
        <input name="patient_name" value={form.patient_name} onChange={handleChange} required placeholder="Patient Name" className="border rounded px-3 py-2 w-full text-black" />
        <div>
          <label className="block text-black mb-1">Referred By</label>
          <select value={selectedDoctorId} onChange={handleDoctorChange} required className="border rounded px-3 py-2 w-full text-black">
            <option value="">Select Psychiatrist</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>{`Dr. ${doc.full_name} (${doc.med_number || ''})`}</option>
            ))}
          </select>
          {selectedDoctor && (
            <div className="mt-1 text-xs text-gray-600">Address: {selectedDoctor.address}</div>
          )}
        </div>
        <input name="disorder" value={form.disorder} onChange={handleChange} required placeholder="Disorder" className="border rounded px-3 py-2 w-full text-black" />
        <select name="status" value={form.status} onChange={handleChange} className="border rounded px-3 py-2 w-full text-black">
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="flex gap-4 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-black">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">{initial ? "Save" : "Add"}</button>
        </div>
      </form>
    </div>
  );
}

export default function ReferralRequestPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Auto-refresh referral requests data every 12 seconds
  const { refresh: refreshRequests } = useAutoRefresh(
    fetchRequests,
    12000, // 12 seconds
    isAuthenticated // Only refresh when authenticated
  );

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referral-requests");
      const data = await res.json();
      console.log(data);
      setRequests(Array.isArray(data.data) ? data.data : []);
      setError("");
    } catch (e) {
      setError("Failed to load referral requests");
    }
    setLoading(false);
  };

  useEffect(() => { 
    if (isAuthenticated) {
      fetchRequests(); 
    }
  }, [isAuthenticated]);

  const handleAdd = async form => {
    const res = await fetch("/api/referral-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      fetchRequests();
    } else {
      alert("Failed to add referral request");
    }
  };
  const handleEdit = id => setEditId(id);
  const handleSave = async form => {
    const res = await fetch(`/api/referral-requests/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setEditId(null);
      fetchRequests();
    } else {
      alert("Failed to update referral request");
    }
  };
  const handleDelete = id => {
    setDeleteId(id);
    setConfirmDelete(true);
  };
  const doDelete = async () => {
    await fetch(`/api/referral-requests/${deleteId}`, { method: "DELETE" });
    setConfirmDelete(false);
    setDeleteId(null);
    fetchRequests();
  };
  const editing = requests.find(r => r.id === editId);

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-8 overflow-x-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-black">Referral Requests</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-refresh: ON</span>
            </div>
          </div>
          <button className="bg-[#6b6bce] hover:bg-[#5757b2] text-white font-semibold px-4 py-2 rounded flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add New
          </button>
        </div>
        {loading ? (
          <div className="text-black">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded shadow text-sm">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="p-2 text-black font-bold">Patient Name</th>
                  <th className="p-2 text-black font-bold">Referred By</th>
                  <th className="p-2 text-black font-bold">Disorder</th>
                  <th className="p-2 text-black font-bold">Status</th>
                  <th className="p-2 text-black font-bold">Created At</th>
                  <th className="p-2 text-black font-bold">Psychiatrist ID</th>
                  <th className="p-2 text-black font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-4 text-black">No referral requests found.</td></tr>
                ) : (
                  requests.map(r => (
                    <tr key={r.id} className="border-b last:border-none hover:bg-neutral-50">
                      <td className="p-2 text-black font-medium">{r.patient_name}</td>
                      <td className="p-2 text-black">{r.referred_by}</td>
                      <td className="p-2 text-black">{r.disorder}</td>
                      <td className="p-2 text-black">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${r.status === "Pending" ? "bg-yellow-100 text-yellow-700" : r.status === "Accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.status}</span>
                      </td>
                      <td className="p-2 text-black">{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</td>
                      <td className="p-2 text-black">{r.psychiatrist_id}</td>
                      <td className="p-2 text-black">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(r.id)} 
                            className="flex items-center gap-1 px-2 py-1 text-blue-700 font-semibold hover:bg-blue-50 rounded text-xs"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(r.id)} 
                            className="flex items-center gap-1 px-2 py-1 text-red-700 font-semibold hover:bg-red-50 rounded text-xs"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {showModal && (
          <ReferralModal open={showModal} onClose={() => setShowModal(false)} onSave={handleAdd} />
        )}
        {editId && editing && (
          <ReferralModal open={!!editId} onClose={() => setEditId(null)} onSave={handleSave} initial={editing} />
        )}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg">
              <div className="mb-4 text-black">Are you sure you want to delete this referral request?</div>
              <div className="flex gap-4 justify-end">
                <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded bg-gray-200 text-black">Cancel</button>
                <button onClick={doDelete} className="px-4 py-2 rounded bg-red-600 text-white">Delete</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 