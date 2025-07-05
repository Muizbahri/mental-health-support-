"use client";
import PsychiatristSidebar from "../Sidebar";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
  
  // Get today's date for min attribute (only date part, not time)
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  useEffect(() => {
    if (open) {
      setDate(initial?.date || "");
      setTime(initial?.time || "");
      setClient(initial?.client || "");
      setContact(initial?.contact || "");
      setStatus(initial?.status || "Accepted");
    }
  }, [open, initial]);
  
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    
    // Validate date to prevent past dates
    if (selectedDate) {
      const selected = new Date(selectedDate);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      if (selected < todayDate) {
        alert("Cannot select a past date. Please choose today's date or a future date.");
        return; // Don't update the state with past date
      }
    }
    
    setDate(selectedDate);
  };
  
  function handleSubmit(e) {
    e.preventDefault();
    
    // Final validation: Check if selected date is not in the past
    if (date) {
      const selectedDate = new Date(date);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      if (selectedDate < todayDate) {
        alert("Cannot submit a past date. Please choose today's date or a future date.");
        return;
      }
    }
    
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
                onChange={handleDateChange}
                required 
                placeholder="dd/mm/yyyy"
                min={todayDateString}
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
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ date: "", time: "", client_name: "", contact: "", status: "Accepted" });
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const userRef = useRef(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authentication check on page load
  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const user = JSON.parse(localStorage.getItem("psychiatrystUser"));
        const token = user?.token;
        
        if (!user || !token) {
          // No valid authentication found, redirect to login
          router.push("/psychiatryst/login");
          return false;
        }
        
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.push("/psychiatryst/login");
        return false;
      }
    };

    if (!checkAuthentication()) {
      return;
    }

    // Prevent back button access after logout
    const handlePopState = () => {
      const user = JSON.parse(localStorage.getItem("psychiatrystUser"));
      if (!user || !user.token) {
        router.push("/psychiatryst/login");
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAppointments();
    // Set userRef for the form submission
    const user = JSON.parse(localStorage.getItem('psychiatrystUser')) || 
                JSON.parse(localStorage.getItem('psychiatristUser'));
    userRef.current = user;
  }, [isAuthenticated]);

  function fetchAppointments() {
    const user = JSON.parse(localStorage.getItem('psychiatrystUser')) || 
                JSON.parse(localStorage.getItem('psychiatristUser'));
    const psychiatristId = user?.id;
    if (!psychiatristId) {
      console.log('No psychiatrist ID found');
      setAppointments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
          fetch(`/api/psychiatrist-appointments/${psychiatristId}`)
      .then(res => {
        // Check if API response indicates authentication failure
        if (res.status === 401 || res.status === 403) {
          localStorage.clear();
          router.push("/psychiatryst/login");
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          console.log('Fetched appointments:', data);
          setAppointments(data.data || []);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching appointments:', error);
        setLoading(false);
      });
  }

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  function openCreateModal() {
    setModalMode("create");
    setForm({ date: "", time: "", client_name: "", contact: "", status: "Accepted" });
    setShowModal(true);
  }

  function openEditModal(appt) {
    setModalMode("edit");
    setCurrent(appt);
    
    // Better date/time parsing
    let dateValue = "";
    let timeValue = "";
    
    if (appt.date_time) {
      const appointmentDate = new Date(appt.date_time);
      if (!isNaN(appointmentDate.getTime())) {
        // Format date as YYYY-MM-DD for date input
        dateValue = appointmentDate.toISOString().split('T')[0];
        // Format time as HH:MM for time input
        timeValue = appointmentDate.toTimeString().split(' ')[0].substring(0, 5);
      }
    }
    
    setForm({
      date: dateValue,
      time: timeValue,
      client_name: appt.name_patient || "",
      contact: appt.contact || "",
      status: appt.status || "Accepted"
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setCurrent(null);
    setSaving(false);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    
    // Validate date to prevent past dates
    if (name === "date" && value) {
      const selectedDate = new Date(value);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      if (selectedDate < todayDate) {
        alert("Cannot select a past date. Please choose today's date or a future date.");
        return; // Don't update the form with past date
      }
    }
    
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    
    // Additional validation: Check if selected date is not in the past
    if (form.date) {
      const selectedDate = new Date(form.date);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      if (selectedDate < todayDate) {
        alert("Cannot submit a past date. Please choose today's date or a future date.");
        setSaving(false);
        return;
      }
    }
    
    const user = userRef.current;
    if (!user) {
      alert("User information not found. Please login again.");
      setSaving(false);
      return;
    }
    
    const psychiatristId = user.id;
    if (!psychiatristId) {
      alert("Psychiatrist ID not found. Please login again.");
      setSaving(false);
      return;
    }
    
    // Create proper datetime string
    const dateTimeString = `${form.date} ${form.time}:00`;
    
    const payload = {
      name_patient: form.client_name,
      contact: form.contact,
      assigned_to: user.full_name || user.name || user.fullname,
      status: form.status,
      date_time: dateTimeString,
      psychiatrist_id: psychiatristId,
      created_by: user.email
    };
    
    console.log('Submitting appointment:', payload);
    
          let url = `/api/psychiatrist-appointments/${psychiatristId}`;
    let method = "POST";
    if (modalMode === "edit" && current) {
              url = `/api/psychiatrist-appointments/${psychiatristId}/${current.id}`;
      method = "PUT";
    }
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const responseData = await res.json();
      console.log('API Response:', responseData);
      
      if (res.ok) {
        fetchAppointments();
        closeModal();
      } else {
        alert(`Failed to save appointment: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert("Failed to save appointment due to network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    setDeletingId(id);
    
    const user = userRef.current;
    const psychiatristId = user?.id;
    
    if (!psychiatristId) {
      alert("Psychiatrist ID not found. Please login again.");
      setDeletingId(null);
      return;
    }
    
    try {
      const res = await fetch(`/api/psychiatrist-appointments/${psychiatristId}/${id}`, { 
        method: "DELETE" 
      });
      
      const responseData = await res.json();
      console.log('Delete response:', responseData);
      
      if (res.ok) {
        setAppointments(appts => appts.filter(a => a.id !== id));
      } else {
        alert(`Failed to delete appointment: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert("Failed to delete appointment due to network error.");
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

  // Format date/time for display
  function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '-';
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return dateTimeString;
      
      // Format as: MM/DD/YYYY HH:MM AM/PM
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateTimeString;
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-white">
        <PsychiatristSidebar activePage="APPOINTMENTS" />
      <main className="flex-1 w-full p-4 sm:p-8">
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
                      <td className="py-2 px-4 text-black">{formatDateTime(appt.date_time)}</td>
                      <td className="py-2 px-4 text-black">{appt.name_patient || '-'}</td>
                      <td className="py-2 px-4 text-black">{appt.contact || '-'}</td>
                      <td className="py-2 px-4 text-black">
                        <span className={
                          appt.status === "Accepted" ? "bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium" :
                          appt.status === "In Progress" ? "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium" :
                          appt.status === "Resolved" ? "bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium" :
                          "bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium"
                        }>{appt.status || '-'}</span>
                    </td>
                      <td className="py-2 px-4 text-black">
                        <button onClick={() => openEditModal(appt)} className="text-blue-600 hover:underline mr-2">Edit</button>
                        <button onClick={() => handleDelete(appt.id)} className="text-red-600 hover:underline" disabled={deletingId === appt.id}>{deletingId === appt.id ? "Deleting..." : "Delete"}</button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Modal for create/edit */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[4px]">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-black">{modalMode === "edit" ? "Edit Appointment" : "New Appointment"}</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block font-medium mb-1 text-black">Date</label>
                  <input
                    type="date"
                    name="date"
                    className="w-full border rounded px-3 py-2 text-black placeholder-gray-500"
                    value={form.date}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-black">Time</label>
                  <input
                    type="time"
                    name="time"
                    className="w-full border rounded px-3 py-2 text-black placeholder-gray-500"
                    value={form.time}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-black">Client Name</label>
                  <input
                    type="text"
                    name="client_name"
                    className="w-full border rounded px-3 py-2 text-black placeholder-gray-500"
                    value={form.client_name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-black">Contact</label>
                  <input
                    type="text"
                    name="contact"
                    className="w-full border rounded px-3 py-2 text-black placeholder-gray-500"
                    value={form.contact}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-black">Status</label>
                  <select
                    name="status"
                    className="w-full border rounded px-3 py-2 text-black"
                    value={form.status}
                    onChange={handleFormChange}
                  >
                    <option value="Accepted">Accepted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div className="flex gap-4 mt-4">
                  <button type="button" className="flex-1 bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg shadow transition" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition" disabled={saving}>
                    {saving ? (modalMode === "edit" ? "Saving..." : "Creating...") : (modalMode === "edit" ? "Save" : "Create")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </main>
    </div>
  );
} 