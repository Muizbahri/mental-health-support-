"use client";
import PsychiatristSidebar from "../Sidebar";
import { useState, useEffect } from "react";

const STATUS_COLORS = {
  Accepted: "bg-teal-100 text-teal-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Resolved: "bg-green-100 text-green-700",
};

const STATUS_OPTIONS = ["Accepted", "In Progress", "Resolved"];

function AppointmentModal({ open, onClose, onSave, initial, isSaving }) {
  const [date, setDate] = useState(initial?.date || "");
  const [time, setTime] = useState(initial?.time || "");
  const [client, setClient] = useState(initial?.client || "");
  const [contact, setContact] = useState(initial?.contact || "");
  const [status, setStatus] = useState(initial?.status || "Accepted");
  useEffect(() => {
    if (open) {
      setDate(initial?.date || "");
      setTime(initial?.time || "");
      setClient(initial?.client || "");
      setContact(initial?.contact || "");
      setStatus(initial?.status || "Accepted");
    }
  }, [open, initial]);
  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      id: initial?.id,
      date,
      time,
      client,
      contact,
      status,
    });
  }
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm transition-all duration-200" />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-black">{initial?.id ? "Edit Appointment" : "New Appointment"}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block font-medium mb-1 text-black">Date</label>
              <input 
                type="date" 
                className="w-full border rounded px-3 py-2 text-black placeholder-gray-500" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required 
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-black">Time</label>
              <input 
                type="time" 
                className="w-full border rounded px-3 py-2 text-black placeholder-gray-500" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                required 
                placeholder="--:-- --"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-black">Client Name</label>
              <input 
                className="w-full border rounded px-3 py-2 text-black placeholder-gray-500" 
                placeholder="Enter client name"
                value={client} 
                onChange={e => setClient(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-black">Contact</label>
              <input 
                className="w-full border rounded px-3 py-2 text-black placeholder-gray-500" 
                placeholder="Enter contact number"
                value={contact} 
                onChange={e => setContact(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-black">Status</label>
              <select 
                className="w-full border rounded px-3 py-2 text-black" 
                value={status} 
                onChange={e => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map(opt => <option key={opt} className="text-black">{opt}</option>)}
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

export default function PsychiatristAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [modal, setModal] = useState({ open: false, initial: null });
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("psychiatrystUser")) : null;

  async function fetchAppointments() {
    if (!user || !user.full_name) return;
    const res = await fetch(`/api/appointments/psychiatrist/${encodeURIComponent(user.full_name)}`);
    const data = await res.json();
    setAppointments(data.data || []);
  }

  useEffect(() => { fetchAppointments(); }, []);

  function handleCreate() {
    setModal({ open: true, initial: null });
  }
  function handleEdit(appt) {
    const [date, time] = appt.date_time ? appt.date_time.split(" ") : ["", ""];
    setModal({ open: true, initial: { ...appt, date, time, client: appt.name_patient } });
  }
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    setIsSaving(true);
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    await fetchAppointments();
    setIsSaving(false);
  }
  async function handleSave(form) {
    setIsSaving(true);
    const date_time = `${form.date} ${form.time}`;
    const payload = {
      role: "Psychiatrist",
      name_patient: form.client,
      contact: form.contact,
      assigned_to: user.full_name,
      status: form.status,
      date_time,
    };
    if (form.id) {
      await fetch(`/api/appointments/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchAppointments();
    } else {
      await fetch(`/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchAppointments();
    }
    setModal({ open: false, initial: null });
    setIsSaving(false);
  }

  // Filter appointments by search and status
  const filteredAppointments = appointments.filter(row =>
    (
      row.name_patient?.toLowerCase().includes(search.toLowerCase()) ||
      row.ic_number?.includes(search)
    ) &&
    (statusFilter === "All" || row.status === statusFilter)
  );

  return (
    <div className="min-h-screen flex bg-[#f8fafc] relative">
      <div className={modal.open ? "w-full flex blur-sm transition-all duration-200" : "w-full flex transition-all duration-200"}>
        <PsychiatristSidebar activePage="APPOINTMENTS" />
        <main className="flex-1 px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition text-base" onClick={handleCreate}>
              + New Appointment
            </button>
          </div>
          <div className="flex gap-4 mb-6">
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
          </div>
          <div className="bg-white rounded-2xl shadow p-0 max-w-5xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-teal-50 text-gray-800 text-base font-semibold">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt, idx) => (
                  <tr key={appt.id || idx} className="text-black border-t border-gray-200 text-base">
                    <td className="text-black py-3 px-4">{appt.date_time}</td>
                    <td className="text-black py-3 px-4">{appt.name_patient}</td>
                    <td className="text-black py-3 px-4">{appt.contact}</td>
                    <td className="text-black py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[appt.status]}`}>{appt.status}</span>
                    </td>
                    <td className="text-black py-3 px-4">
                      <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-4 py-1 rounded mr-2 text-sm" onClick={() => handleEdit(appt)} disabled={isSaving}>Edit</button>
                      <button className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-1 rounded text-sm" onClick={() => handleDelete(appt.id)} disabled={isSaving}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      <AppointmentModal open={modal.open} onClose={() => setModal({ open: false, initial: null })} onSave={handleSave} initial={modal.initial} isSaving={isSaving} />
    </div>
  );
} 