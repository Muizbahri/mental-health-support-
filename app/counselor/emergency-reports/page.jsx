"use client";
import { useEffect, useState, useRef } from "react";
import CounselorSidebar from "../Sidebar";

const STATUS_COLORS = {
  "In Progress": "bg-yellow-100 text-yellow-800",
  "Resolved": "bg-blue-100 text-blue-800",
  "Solved": "bg-green-100 text-green-800",
};
const STATUS_OPTIONS = ["All", "In Progress", "Resolved", "Solved"];

export default function EmergencyReportsPage() {
  const [cases, setCases] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [current, setCurrent] = useState(null);
  const [editForm, setEditForm] = useState({ status: "In Progress", notes: "" });
  const [deletingId, setDeletingId] = useState(null);
  const userRef = useRef(null);
  const [newForm, setNewForm] = useState({
    name_patient: "",
    ic_number: "",
    date_time: "",
    status: "In Progress",
    assigned_to: "",
    role: "Counselor",
  });
  const [professionals, setProfessionals] = useState({ counselors: [], psychiatrists: [] });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('counselorUser'));
    userRef.current = user;
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem('counselorToken');
            fetch(`/api/emergency-cases?counselor_id=${user.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCases(data.success ? data.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filteredCases = cases;
    if (search) {
      const s = search.toLowerCase();
      filteredCases = filteredCases.filter(c =>
        c.patient_name?.toLowerCase().includes(s) || c.ic_number?.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "All") {
      filteredCases = filteredCases.filter(c => c.status === statusFilter);
    }
    setFiltered(filteredCases);
  }, [cases, search, statusFilter]);

  useEffect(() => {
    // Fetch professionals for dropdown
    async function fetchProfessionals() {
      const [counselorRes, psychiatristRes] = await Promise.all([
              fetch("/api/counselors").then(res => res.json()),
      fetch("/api/psychiatrists").then(res => res.json()),
      ]);
      
      // Get current logged-in counselor
      const currentUser = JSON.parse(localStorage.getItem('counselorUser'));
      const currentCounselorId = currentUser?.id;
      
      // Filter out current counselor from the list
      const filteredCounselors = (counselorRes.data || []).filter(
        counselor => counselor.id !== currentCounselorId
      );
      
      console.log(`Filtered ${filteredCounselors.length} counselors (excluded current user ID: ${currentCounselorId})`);
      
      setProfessionals({
        counselors: filteredCounselors,
        psychiatrists: psychiatristRes.data || [],
      });
    }
    fetchProfessionals();
  }, []);

  function openViewModal(c) {
    setModalMode("view");
    setCurrent(c);
    setShowModal(true);
  }
  function openEditModal(c) {
    setModalMode("edit");
    setCurrent(c);
    setEditForm({ status: c.status, notes: c.notes || "" });
    setShowModal(true);
  }
  function closeModal() {
    setShowModal(false);
    setCurrent(null);
  }
  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  }
  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!current) return;
    let counselor_id = null;
    let psychiatrist_id = null;
    
    // Use current case's role and assigned_to values instead of form values
    if (current.role === "Counselor") {
      const selected = professionals.counselors.find(c => c.full_name === current.assigned_to || c.email === current.assigned_to);
      counselor_id = selected ? selected.id : null;
    } else if (current.role === "Psychiatrist") {
      const selected = professionals.psychiatrists.find(p => p.full_name === current.assigned_to || p.email === current.assigned_to);
      psychiatrist_id = selected ? selected.id : null;
    }
    const payload = {
      name_patient: editForm.name_patient ?? current.name_patient,
      ic_number: editForm.ic_number ?? current.ic_number,
      date_time: editForm.date_time ?? current.date_time,
      status: editForm.status ?? current.status,
      assigned_to: current.assigned_to, // Keep existing assignment
      role: current.role, // Keep existing role
      counselor_id,
      psychiatrist_id,
    };
    const token = localStorage.getItem('counselorToken');
          const res = await fetch(`/api/emergency-cases/${current.id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updated = cases.map(c => c.id === current.id ? { ...c, ...payload } : c);
      setCases(updated);
      closeModal();
    } else {
      alert("Failed to update case.");
    }
  }
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this emergency case?")) return;
    setDeletingId(id);
    const token = localStorage.getItem('counselorToken');
    const res = await fetch(`/api/emergency-cases/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      setCases(cs => cs.filter(c => c.id !== id));
    } else {
      alert("Failed to delete case.");
    }
    setDeletingId(null);
  }

  function openNewModal() {
    setModalMode("new");
    setNewForm({
      name_patient: "",
      ic_number: "",
      date_time: "",
      status: "In Progress",
      assigned_to: "",
      role: "Counselor",
    });
    setShowModal(true);
  }

  async function handleNewSubmit(e) {
    e.preventDefault();
    setAdding(true);
    const user = userRef.current;
    let counselor_id = null;
    let psychiatrist_id = null;
    if (newForm.role === "Counselor") {
      const selected = professionals.counselors.find(c => c.full_name === newForm.assigned_to || c.email === newForm.assigned_to);
      counselor_id = selected ? selected.id : null;
    } else if (newForm.role === "Psychiatrist") {
      const selected = professionals.psychiatrists.find(p => p.full_name === newForm.assigned_to || p.email === newForm.assigned_to);
      psychiatrist_id = selected ? selected.id : null;
    }
    const payload = {
      name_patient: newForm.name_patient,
      ic_number: newForm.ic_number,
      date_time: newForm.date_time,
      status: newForm.status,
      assigned_to: newForm.assigned_to,
      role: newForm.role,
      counselor_id,
      psychiatrist_id,
    };
    const token = localStorage.getItem('counselorToken');
    const res = await fetch("/api/emergency-cases/admin", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });
    setAdding(false);
    if (res.ok) {
      setShowModal(false);
      setNewForm({ name_patient: "", ic_number: "", date_time: "", status: "In Progress", assigned_to: "", role: "Counselor" });
      // Refresh cases
      const data = await res.json();
      const token = localStorage.getItem('counselorToken');
      fetch(`/api/emergency-cases?counselor_id=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setCases(data.success ? data.data : []));
    } else {
      alert("Failed to add emergency case.");
    }
  }

  // Status summary counts
  const inProgress = cases.filter(c => c.status === "In Progress").length;
  const resolved = cases.filter(c => c.status === "Resolved").length;
  const solved = cases.filter(c => c.status === "Solved").length;

  return (
    <div className="min-h-screen w-full flex bg-white">
      <CounselorSidebar activePage="EMERGENCY REPORTS" />
      <main className="flex-1 w-full p-4 sm:p-8">
        <h2 className="text-2xl font-bold text-black mb-6">My Emergency Cases</h2>
        <div className="flex gap-4 mb-8">
          <StatusCard label="In Progress" count={inProgress} color="bg-yellow-100" />
          <StatusCard label="Resolved" count={resolved} color="bg-blue-100" />
          <StatusCard label="Solved" count={solved} color="bg-green-100" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by patient name or IC number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-72 placeholder-black"
            style={{color:'#000'}}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-48"
            style={{color:'#000'}}
          >
            {STATUS_OPTIONS.map(opt => <option key={opt} style={{color:'#000'}}>{opt}</option>)}
          </select>
          <div className="flex-1 flex justify-end">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition" onClick={openNewModal}>New Emergency</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border rounded-lg">
              <thead>
                <tr className="bg-blue-50 text-gray-700">
                  <th className="py-3 px-4 text-left font-semibold text-black">Patient Name</th>
                  <th className="py-3 px-4 text-left font-semibold text-black">IC Number</th>
                  <th className="py-3 px-4 text-left font-semibold text-black">Date/Time</th>
                  <th className="py-3 px-4 text-left font-semibold text-black">Status</th>
                  <th className="py-3 px-4 text-left font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center text-black py-12">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-black py-12">No emergency cases assigned to you.</td></tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c.id} className="border-b hover:bg-blue-50/40 transition">
                      <td className="py-2 px-4 text-black">{c.name_patient || '-'}</td>
                      <td className="py-2 px-4 text-black">{c.ic_number || '-'}</td>
                      <td className="py-2 px-4 text-black">{formatDateTime(c.date_time)}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-black ${STATUS_COLORS[c.status] || "bg-gray-100"}`}>{c.status}</span>
                      </td>
                      <td className="py-2 px-4 space-x-2">
                        <button onClick={() => openEditModal(c)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded transition text-xs font-medium text-black">Edit</button>
                        <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition text-xs font-medium text-black">{deletingId === c.id ? "Deleting..." : "Delete"}</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {showModal && (
          <Modal onClose={closeModal}>
            {modalMode === "view" && current && (
              <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-black">
                <h3 className="text-xl font-bold mb-4 text-black">Emergency Case Details</h3>
                <div className="mb-2"><span className="font-semibold text-black">Patient Name:</span> {current.patient_name}</div>
                <div className="mb-2"><span className="font-semibold text-black">IC Number:</span> {current.ic_number}</div>
                <div className="mb-2"><span className="font-semibold text-black">Date/Time:</span> {formatDateTime(current.date_time)}</div>
                <div className="mb-2"><span className="font-semibold text-black">Status:</span> <span className={`px-2 py-1 rounded-full text-xs font-medium text-black ${STATUS_COLORS[current.status] || "bg-gray-100"}`}>{current.status}</span></div>
                <div className="mb-2"><span className="font-semibold text-black">Notes:</span> {current.notes || "-"}</div>
                <div className="flex justify-end mt-6">
                  <button onClick={closeModal} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-black">Close</button>
                </div>
              </div>
            )}
            {modalMode === "edit" && current && (
              <form className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-black" onSubmit={handleEditSubmit}>
                <h3 className="text-xl font-bold mb-4 text-black">Edit Emergency Case</h3>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-black">Name (Patient)</label>
                  <input type="text" required name="name_patient" value={editForm.name_patient ?? current.name_patient} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg text-black" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-black">IC Number</label>
                  <input type="text" required name="ic_number" value={editForm.ic_number ?? current.ic_number} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg text-black" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-black">Date/Time</label>
                  <input type="datetime-local" required name="date_time" value={editForm.date_time ?? current.date_time} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg text-black" min={(() => { const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); return now.toISOString().slice(0,16); })()} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-black">Status</label>
                  <select name="status" required value={editForm.status ?? current.status} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg text-black">
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Solved">Solved</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-black">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-black">Save</button>
                </div>
              </form>
            )}
            {modalMode === "new" && (
              <form className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-black" onSubmit={handleNewSubmit}>
                <h3 className="text-xl font-bold mb-4 text-black">New Emergency Case</h3>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-black">Name (Patient)</label>
                  <input type="text" required value={newForm.name_patient} onChange={e => setNewForm(f => ({ ...f, name_patient: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-black" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-black">IC Number</label>
                  <input type="text" required value={newForm.ic_number} onChange={e => setNewForm(f => ({ ...f, ic_number: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-black" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-black">Date/Time</label>
                  <input type="datetime-local" required value={newForm.date_time} onChange={e => setNewForm(f => ({ ...f, date_time: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-black" min={(() => { const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); return now.toISOString().slice(0,16); })()} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-black">Status</label>
                  <select required value={newForm.status} onChange={e => setNewForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-black">
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Solved">Solved</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-black">Assigned To</label>
                  <select required value={newForm.assigned_to} onChange={e => setNewForm(f => ({ ...f, assigned_to: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-black">
                    <option value="">Select</option>
                    {(newForm.role === "Counselor" ? professionals.counselors : professionals.psychiatrists).map(p => (
                      <option key={p.id} value={p.full_name}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1 text-black">Role</label>
                  <select required value={newForm.role} onChange={e => setNewForm(f => ({ ...f, role: e.target.value, assigned_to: "" }))} className="w-full px-3 py-2 border rounded-lg text-black">
                    <option value="Counselor">Counselor</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-black">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-black" disabled={adding}>{adding ? "Adding..." : "Add"}</button>
                </div>
              </form>
            )}
          </Modal>
        )}
      </main>
    </div>
  );
}

function StatusCard({ label, count, color }) {
  return (
    <div className={`flex-1 rounded-xl shadow p-4 flex flex-col items-center ${color} bg-opacity-60`}>
      <div className="text-2xl font-bold mb-1 text-black">{count}</div>
      <div className="text-sm font-medium text-black">{label}</div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function formatDateTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d)) return dt;
  // Format as YYYY-MM-DD HH:mm:ss
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
} 