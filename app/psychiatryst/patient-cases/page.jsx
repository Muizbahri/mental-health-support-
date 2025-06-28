"use client";
import { useEffect, useState } from "react";
import PsychiatristSidebar from "../Sidebar";
import { FolderOpen, Calendar } from "lucide-react";

const STATUS_COLORS = {
  "Active": "bg-green-100 text-green-800",
  "Monitoring": "bg-blue-100 text-blue-800",
};

export default function PsychiatristPatientCasesPage() {
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ open: false, initial: null });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("psychiatrystUser")) : null;

  async function fetchCases() {
    if (!user || !user.full_name) return;
    setError("");
    const res = await fetch(`/api/patient-cases/${encodeURIComponent(user.full_name)}`);
    const data = await res.json();
    if (data.success) setCases(data.data || []);
    else setError(data.message || "Failed to fetch patient cases.");
  }

  useEffect(() => { fetchCases(); }, []);

  function handleCreate() {
    setModal({ open: true, initial: null });
  }
  function handleEdit(pc) {
    setModal({ open: true, initial: pc });
  }
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this patient case?")) return;
    setIsSaving(true);
    await fetch(`/api/patient-cases/${id}`, { method: "DELETE" });
    await fetchCases();
    setIsSaving(false);
  }
  async function handleSave(form) {
    setIsSaving(true);
    setError("");
    const payload = {
      patient_name: form.patient_name,
      diagnosis: form.diagnosis,
      last_visit: form.last_visit,
      status: form.status,
      assigned_to: user.full_name,
    };
    let res, data;
    if (form.id) {
      res = await fetch(`/api/patient-cases/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = await res.json();
      if (data.success) {
        await fetchCases();
        setModal({ open: false, initial: null });
      } else {
        setError(data.message || "Failed to update patient case.");
        console.error("Update error:", data);
      }
    } else {
      res = await fetch(`/api/patient-cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = await res.json();
      if (data.success) {
        await fetchCases();
        setModal({ open: false, initial: null });
      } else {
        setError(data.message || "Failed to create patient case.");
        console.error("Create error:", data);
      }
    }
    setIsSaving(false);
  }

  const filteredCases = cases.filter(row =>
    row.patient_name?.toLowerCase().includes(search.toLowerCase())
  );

  function PatientCaseModal({ open, onClose, onSave, initial, isSaving }) {
    const [name, setName] = useState(initial?.patient_name || "");
    const [diagnosis, setDiagnosis] = useState(initial?.diagnosis || "");
    const [lastVisit, setLastVisit] = useState(initial?.last_visit || "");
    const [status, setStatus] = useState(initial?.status || "Active");
    useEffect(() => {
      if (open) {
        setName(initial?.patient_name || "");
        setDiagnosis(initial?.diagnosis || "");
        setLastVisit(initial?.last_visit || "");
        setStatus(initial?.status || "Active");
      }
    }, [open, initial]);
    function handleSubmit(e) {
      e.preventDefault();
      onSave({
        id: initial?.id,
        patient_name: name,
        diagnosis,
        last_visit: lastVisit,
        status,
      });
    }
    if (!open) return null;
    return (
      <>
        <div className="fixed inset-0 z-40 backdrop-blur-sm transition-all duration-200" />
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-black">{initial?.id ? "Edit Patient Case" : "New Patient Case"}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block font-medium mb-1 text-black">Patient Name</label>
                <input className="w-full border rounded px-3 py-2 text-black placeholder-gray-500" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block font-medium mb-1 text-black">Diagnosis</label>
                <input className="w-full border rounded px-3 py-2 text-black placeholder-gray-500" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required />
              </div>
              <div>
                <label className="block font-medium mb-1 text-black">Last Visit (YYYY-MM-DD)</label>
                <input type="date" className="w-full border rounded px-3 py-2 text-black placeholder-gray-500" value={lastVisit} onChange={e => setLastVisit(e.target.value)} required />
              </div>
              <div>
                <label className="block font-medium mb-1 text-black">Status</label>
                <select className="w-full border rounded px-3 py-2 text-black" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Monitoring">Monitoring</option>
                </select>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="flex-1 bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg shadow transition" onClick={onClose} disabled={isSaving}>Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition" disabled={isSaving}>{initial?.id ? (isSaving ? "Saving..." : "Save") : (isSaving ? "Creating..." : "Create")}</button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f4f7fd]">
      <PsychiatristSidebar activePage="PATIENT_CASES" />
      <main className="flex-1 px-8 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <FolderOpen size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Active Patient Cases</h1>
          </div>
          <div className="flex gap-4 mb-6 items-center">
            <input
              type="text"
              placeholder="Search by patient name"
              className="border border-gray-300 rounded-lg px-4 py-2 w-80 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition text-base" onClick={handleCreate}>
              New Patient Case
            </button>
            <div className="flex-1" />
          </div>
          {error && <div className="text-red-600 font-semibold mb-4">{error}</div>}
          <div className="flex flex-col gap-6">
            {filteredCases.map(pc => (
              <div key={pc.id} className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer" onClick={() => handleEdit(pc)}>
                <div>
                  <div className="font-bold text-lg text-black">{pc.patient_name}</div>
                  <div className="text-gray-700">{pc.diagnosis}</div>
                  <div className="text-gray-500 text-sm mt-1">Last visit: {pc.last_visit}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[pc.status]}`}>{pc.status}</span>
                  <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-4 py-1 rounded text-sm" onClick={e => { e.stopPropagation(); handleEdit(pc); }} disabled={isSaving}>Edit</button>
                  <button className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-1 rounded text-sm" onClick={e => { e.stopPropagation(); handleDelete(pc.id); }} disabled={isSaving}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <PatientCaseModal open={modal.open} onClose={() => setModal({ open: false, initial: null })} onSave={handleSave} initial={modal.initial} isSaving={isSaving} />
    </div>
  );
} 