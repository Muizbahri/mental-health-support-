"use client";
import PsychiatristSidebar from "../Sidebar";
import { useState, useEffect } from "react";

const STATUS_COLORS = {
  "In Progress": "bg-yellow-100 text-yellow-800",
  Resolved: "bg-teal-100 text-teal-800",
  Solved: "bg-green-100 text-green-800",
};

const STATUS_OPTIONS = ["In Progress", "Resolved", "Solved"];

function EmergencyModal({ open, onClose, onSave, initial, isSaving }) {
  const [name, setName] = useState(initial?.name_patient || "");
  const [ic, setIc] = useState(initial?.ic_number || "");
  const [datetime, setDatetime] = useState(initial?.date_time || "");
  const [status, setStatus] = useState(initial?.status || "In Progress");
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setName(initial?.name_patient || "");
      setIc(initial?.ic_number || "");
      setDatetime(initial?.date_time || "");
      setStatus(initial?.status || "In Progress");
    }
  }, [open, initial]);
  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      id: initial?.id,
      name_patient: name,
      ic_number: ic,
      date_time: datetime,
      status,
    });
  }
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm transition-all duration-200" />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-black">{initial?.id ? "Edit Emergency Case" : "New Emergency Case"}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block font-medium mb-1 text-black">Patient Name</label>
              <input className="w-full border rounded px-3 py-2 text-black placeholder-gray-500" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1 text-black">IC Number</label>
              <input className="w-full border rounded px-3 py-2 text-black placeholder-gray-500" value={ic} onChange={e => setIc(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1 text-black">Date/Time</label>
              <input type="datetime-local" className="w-full border rounded px-3 py-2 text-black placeholder-gray-500" value={datetime} onChange={e => setDatetime(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1 text-black">Status</label>
              <select className="w-full border rounded px-3 py-2 text-black" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map(opt => <option key={opt} className="text-black">{opt}</option>)}
              </select>
            </div>
            <div className="flex gap-4 mt-4">
              <button type="button" className="flex-1 bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg shadow transition" onClick={onClose} disabled={isSaving}>Cancel</button>
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition" disabled={isSaving}>{initial?.id ? (isSaving ? "Saving..." : "Save") : (isSaving ? "Creating..." : "Create")}</button>
            </div>
          </form>
          {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
        </div>
      </div>
    </>
  );
}

function parseDateTimeToMySQL(dtString) {
  // Accepts 'DD/MM/YYYY HH:mm' or 'YYYY-MM-DDTHH:mm' and returns 'YYYY-MM-DD HH:mm:00'
  if (!dtString) return '';
  if (dtString.includes('/')) {
    // Format: DD/MM/YYYY HH:mm
    const [date, time] = dtString.split(' ');
    if (!date || !time) return '';
    const [day, month, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${time}:00`;
  } else if (dtString.includes('T')) {
    // Format: YYYY-MM-DDTHH:mm
    return dtString.replace('T', ' ') + ':00';
  }
  return dtString;
}

export default function PsychiatristEmergencyCasesPage() {
  const [cases, setCases] = useState([]);
  const [modal, setModal] = useState({ open: false, initial: null });
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState("");
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("psychiatrystUser")) : null;

  async function fetchCases() {
    if (!user || !user.full_name) return;
    const res = await fetch(`/api/emergency_cases?assigned_to=${encodeURIComponent(user.full_name)}`);
    const data = await res.json();
    setCases(data.data || []);
  }

  useEffect(() => { fetchCases(); }, []);

  function handleCreate() {
    setModal({ open: true, initial: null });
  }
  function handleEdit(ecase) {
    setModal({ open: true, initial: ecase });
  }
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this emergency case?")) return;
    setIsSaving(true);
    await fetch(`/api/emergency_cases/${id}`, { method: "DELETE" });
    await fetchCases();
    setIsSaving(false);
  }
  async function handleSave(form) {
    setIsSaving(true);
    setError("");
    const mysqlDateTime = parseDateTimeToMySQL(form.date_time);
    if (!mysqlDateTime || mysqlDateTime.length < 16) {
      setError("Invalid date/time format. Please use the date picker.");
      setIsSaving(false);
      return;
    }
    const payload = {
      name_patient: form.name_patient,
      ic_number: form.ic_number,
      date_time: mysqlDateTime,
      status: form.status,
      assigned_to: user.full_name,
      role: "Psychiatrist",
    };
    let res, data;
    if (form.id) {
      res = await fetch(`/api/emergency_cases/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = await res.json();
      if (data.success) {
        await fetchCases();
        setModal({ open: false, initial: null });
      } else {
        setError(data.message || "Failed to update emergency case.");
      }
    } else {
      res = await fetch(`/api/emergency_cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = await res.json();
      if (data.success) {
        await fetchCases();
        setModal({ open: false, initial: null });
      } else {
        setError(data.message || "Failed to create emergency case.");
      }
    }
    setIsSaving(false);
  }

  // Filter cases by search and status
  const filteredCases = cases.filter(row =>
    (
      row.name_patient?.toLowerCase().includes(search.toLowerCase()) ||
      row.ic_number?.includes(search)
    ) &&
    (statusFilter === "All" || row.status === statusFilter)
  );

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <PsychiatristSidebar activePage="EMERGENCY" />
      <main className="flex-1 px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Emergency Cases</h1>
        <div className="flex gap-6 mb-6">
          {Object.keys(STATUS_COLORS).map((status) => (
            <div
              key={status}
              className={`flex flex-col items-center justify-center rounded-2xl px-12 py-6 text-center text-2xl font-bold shadow-sm ${STATUS_COLORS[status]}`}
              style={{ minWidth: 220 }}
            >
              <span>{cases.filter(ec => ec.status === status).length}</span>
              <span className="text-base font-medium mt-1">{status}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mb-6 items-center">
          <input
            type="text"
            placeholder="Search by patient name or IC number"
            className="border border-gray-300 rounded-lg px-4 py-2 w-80 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            <option value="All">All</option>
            <option value="Accepted">Accepted</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <div className="flex-1" />
          <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition text-base" onClick={handleCreate}>
            New Emergency
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow p-0 max-w-5xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-teal-50 text-gray-800 text-base font-semibold">
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">IC Number</th>
                <th className="py-3 px-4">Date/Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((ec, idx) => (
                <tr key={ec.id || idx} className="border-t border-gray-200 text-base">
                  <td className="py-3 px-4 text-black">{ec.name_patient}</td>
                  <td className="py-3 px-4 text-black">{ec.ic_number}</td>
                  <td className="py-3 px-4 text-black">{ec.date_time ? ec.date_time.replace('T', ' ').substring(0, 19) : ''}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[ec.status]}`}>{ec.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-4 py-1 rounded mr-2 text-sm" onClick={() => handleEdit(ec)} disabled={isSaving}>Edit</button>
                    <button className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-1 rounded text-sm" onClick={() => handleDelete(ec.id)} disabled={isSaving}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <EmergencyModal open={modal.open} onClose={() => setModal({ open: false, initial: null })} onSave={handleSave} initial={modal.initial} isSaving={isSaving} />
    </div>
  );
} 