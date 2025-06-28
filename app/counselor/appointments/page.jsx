"use client";
import { useEffect, useState, useRef } from "react";
import CounselorSidebar from "../Sidebar";

export default function CounselorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [current, setCurrent] = useState(null); // appointment being edited
  const [form, setForm] = useState({ date: "", time: "", client_name: "", contact: "", status: "Accepted" });
  const [deletingId, setDeletingId] = useState(null);
  const userRef = useRef(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    // Fetch appointments for the logged-in counselor
    const user = JSON.parse(localStorage.getItem("counselorUser"));
    userRef.current = user;
    if (!user) return;
    // Use full name for assigned_to filtering
    fetchAppointments(user.full_name);
  }, []);

  function fetchAppointments(assignedTo) {
    setLoading(true);
    fetch(`http://localhost:5000/api/appointments/counselor/${encodeURIComponent(assignedTo)}`)
      .then(res => res.json())
      .then(data => {
        setAppointments((data.success ? data.data : []).map(a => ({
          ...a,
          contact: a.contact || a.patient_email
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function openCreateModal() {
    setModalMode("create");
    setForm({ date: "", time: "", client_name: "", contact: "", status: "Accepted" });
    setShowModal(true);
  }

  function openEditModal(appt) {
    setModalMode("edit");
    setCurrent(appt);
    setForm({
      date: appt.date || "",
      time: appt.time || "",
      client_name: appt.name_patient || "",
      contact: appt.contact || "",
      status: appt.status || "Accepted"
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setCurrent(null);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const user = userRef.current;
    if (!user) return;
    const payload = {
      role: "Counselor",
      name_patient: form.client_name,
      contact: form.contact,
      assigned_to: user.full_name,
      status: form.status,
      date_time: form.date + (form.time ? ` ${form.time}` : "")
    };
    let url = "http://localhost:5000/api/appointments";
    let method = "POST";
    if (modalMode === "edit" && current) {
      url = `http://localhost:5000/api/appointments/${current.id}`;
      method = "PUT";
    }
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      fetchAppointments(user.full_name);
      closeModal();
    } else {
      alert("Failed to save appointment.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    setDeletingId(id);
    const res = await fetch(`http://localhost:5000/api/appointments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAppointments(appts => appts.filter(a => a.id !== id));
    } else {
      alert("Failed to delete appointment.");
    }
    setDeletingId(null);
  }

  // Filtered appointments based on search and status
  const filteredAppointments = appointments.filter(appt => {
    const matchesSearch =
      search.trim() === "" ||
      (appt.name_patient && appt.name_patient.toLowerCase().includes(search.toLowerCase())) ||
      (appt.ic_number && appt.ic_number.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === "All" ||
      (appt.status && appt.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex bg-[#f7fafc]">
      <CounselorSidebar activePage="APPOINTMENTS" />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
          <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition">+ New Appointment</button>
        </div>
        {/* Search and Filter Row */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by patient name or IC number"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg w-72 text-black"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-black"
          >
            <option value="All">All</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Accepted">Accepted</option>
          </select>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border rounded-lg">
              <thead>
                <tr className="bg-blue-50">
                  <th className="py-3 px-4 text-left font-semibold text-black">Date & Time</th>
                  <th className="py-3 px-4 text-left font-semibold text-black">Client Name</th>
                  <th className="py-3 px-4 text-left font-semibold text-black">Contact</th>
                  <th className="py-3 px-4 text-left font-semibold text-black">Status</th>
                  <th className="py-3 px-4 text-left font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center text-black py-12">Loading...</td></tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-black py-12">No appointments found.</td></tr>
                ) : (
                  filteredAppointments.map((appt) => (
                    <tr key={appt.id} className="border-b hover:bg-blue-50/40 transition text-black">
                      <td className="py-2 px-4 text-black">{appt.date_time || '-'}</td>
                      <td className="py-2 px-4 text-black">{appt.name_patient || '-'}</td>
                      <td className="py-2 px-4 text-black">{appt.contact || '-'}</td>
                      <td className="py-2 px-4 text-black">
                        <span className={
                          appt.status === "Accepted" ? "bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium" :
                          appt.status === "In Progress" ? "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium" :
                          appt.status === "Resolved" ? "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium" :
                          "bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium"
                        }>{appt.status}</span>
                      </td>
                      <td className="py-2 px-4 space-x-2 text-black">
                        <button onClick={() => openEditModal(appt)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded transition text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(appt.id)} disabled={deletingId === appt.id} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition text-xs font-medium">{deletingId === appt.id ? "Deleting..." : "Delete"}</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(6px)' }}>
            <div className="bg-white rounded-2xl shadow-xl px-11 py-6 w-full max-w-md">
              <h2 className="text-2xl font-extrabold mb-4 text-black">{modalMode === "create" ? "New Appointment" : "Edit Appointment"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-bold mb-1 text-black">Date</label>
                  <input type="date" name="date" value={form.date} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-lg text-black placeholder-gray-400" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-black">Time</label>
                  <input type="time" name="time" value={form.time} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-lg text-black placeholder-gray-400" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-black">Client Name</label>
                  <input type="text" name="client_name" value={form.client_name} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-lg text-black placeholder-gray-400" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-black">Contact</label>
                  <input type="text" name="contact" value={form.contact} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-lg text-black placeholder-gray-400" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-black">Status</label>
                  <select name="status" value={form.status} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg text-black placeholder-gray-400">
                    <option value="Accepted">Accepted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div className="flex gap-4 mt-4">
                  <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded-lg transition" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition">{modalMode === "create" ? "Create" : "Save"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function formatDateTime(date, time) {
  if (!date && !time) return "-";
  try {
    const d = new Date(date + (time ? `T${time}` : ""));
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return date + (time ? ` ${time}` : "");
  }
} 