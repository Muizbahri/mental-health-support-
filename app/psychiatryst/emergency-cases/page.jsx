"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PsychiatristSidebar from "../Sidebar";

const STATUS_COLORS = {
  "In Progress": "bg-yellow-100 text-yellow-800",
  "Resolved": "bg-blue-100 text-blue-800",
  "Solved": "bg-green-100 text-green-800",
};
const STATUS_OPTIONS = ["All", "In Progress", "Resolved", "Solved"];

export default function PsychiatristEmergencyCasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("new");
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({
    name_patient: "",
    ic_number: "",
    date_time: "",
    status: "In Progress",
    assigned_to: "",
    role: "Counselor",
  });
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [professionals, setProfessionals] = useState({ counselors: [], psychiatrists: [] });
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

    console.log("Emergency Cases Page - Component mounted");
    console.log("LocalStorage keys:", Object.keys(localStorage));
    
    try {
      const psychiatristUser = localStorage.getItem("psychiatristUser");
      const psychiatrystUser = localStorage.getItem("psychiatrystUser");
      
      console.log("psychiatristUser in localStorage:", psychiatristUser ? "exists" : "not found");
      console.log("psychiatrystUser in localStorage:", psychiatrystUser ? "exists" : "not found");
      
      if (psychiatristUser) {
        console.log("Parsed psychiatristUser:", JSON.parse(psychiatristUser));
      }
      
      if (psychiatrystUser) {
        console.log("Parsed psychiatrystUser:", JSON.parse(psychiatrystUser));
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
    
    fetchCases();
    fetchProfessionals();
  }, [isAuthenticated]);

  function fetchCases() {
    const user = JSON.parse(localStorage.getItem("psychiatristUser"));
    console.log("Psychiatrist user from localStorage:", user);
    const psychiatristId = user?.id;
    console.log("Psychiatrist ID:", psychiatristId);
    
    if (!psychiatristId) {
      // Try alternate localStorage key (psychiatrystUser)
      const altUser = JSON.parse(localStorage.getItem("psychiatrystUser"));
      console.log("Alternative psychiatrist user from localStorage:", altUser);
      if (altUser?.id) {
        console.log("Using alternative psychiatrist ID:", altUser.id);
        fetchCasesWithId(altUser.id);
        return;
      }
      
      console.log("No psychiatrist ID found - user needs to log in");
      setCases([]);
      setLoading(false);
      return;
    }
    
    console.log(`Fetching emergency cases for psychiatrist: ${user.full_name} (ID: ${psychiatristId})`);
    fetchCasesWithId(psychiatristId);
  }
  
  function fetchCasesWithId(id) {
    setLoading(true);
    console.log(`Fetching cases for psychiatrist ID: ${id}`);
    
    const token = localStorage.getItem('psychiatrystToken');
    console.log("Using token:", token ? "Token exists" : "No token found");
    fetch(`http://localhost:5000/api/emergency-cases/psychiatrist/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        console.log("Response status:", res.status);
        // Check if API response indicates authentication failure
        if (res.status === 401 || res.status === 403) {
          localStorage.clear();
          router.push("/psychiatryst/login");
          return;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        
        console.log("Fetched data:", data);
        // Handle different response formats
        let casesData = [];
        if (Array.isArray(data)) {
          casesData = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          casesData = data.data;
        } else if (data && data.success && data.data && Array.isArray(data.data)) {
          casesData = data.data;
        }
        console.log("Processed cases data:", casesData);
        console.log(`Found ${casesData.length} emergency cases assigned to this psychiatrist`);
        if (casesData.length === 0) {
          console.log("No cases found. This could mean:");
          console.log("1. No cases have been assigned to this psychiatrist yet");
          console.log("2. The psychiatrist ID doesn't match any assigned cases");
          console.log("3. There's an issue with the database query");
        }
        setCases(casesData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching cases:", error);
        setLoading(false);
      });
  }

  // Fetch professionals for assignment dropdown
  async function fetchProfessionals() {
    try {
      const [counselorRes, psychiatristRes] = await Promise.all([
        fetch("http://localhost:5000/api/counselors").then(res => {
          if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            router.push("/psychiatryst/login");
            return { data: [] };
          }
          return res.json();
        }),
        fetch("http://localhost:5000/api/psychiatrists").then(res => {
          if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            router.push("/psychiatryst/login");
            return { data: [] };
          }
          return res.json();
        }),
      ]);
      
      // Get current logged-in psychiatrist
      const currentUser = JSON.parse(localStorage.getItem("psychiatristUser")) || 
                        JSON.parse(localStorage.getItem("psychiatrystUser"));
      const currentPsychiatristId = currentUser?.id;
      
      // Filter out current psychiatrist from the list
      const filteredPsychiatrists = (psychiatristRes.data || []).filter(
        psychiatrist => psychiatrist.id !== currentPsychiatristId
      );
      
      console.log(`Fetched ${(counselorRes.data || []).length} counselors and ${filteredPsychiatrists.length} psychiatrists (excluded current user)`);
      
      setProfessionals({
        counselors: counselorRes.data || [],
        psychiatrists: filteredPsychiatrists,
      });
    } catch (error) {
      console.error("Error fetching professionals:", error);
    }
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

  // Filter by search and status
  const filteredCases = cases.filter(row =>
    (
      row.name_patient?.toLowerCase().includes(search.toLowerCase()) ||
      row.ic_number?.includes(search)
    ) &&
    (statusFilter === "All" || row.status === statusFilter)
  );

  // Status summary counts
  const inProgress = cases.filter(c => c.status === "In Progress").length;
  const resolved = cases.filter(c => c.status === "Resolved").length;
  const solved = cases.filter(c => c.status === "Solved").length;

  // Get today's date and time for min attribute
  const today = new Date();
  const todayString = today.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM

  function openNewModal() {
    setModalMode("new");
    setForm({ name_patient: "", ic_number: "", date_time: "", status: "In Progress", assigned_to: "", role: "Counselor" });
    setShowModal(true);
    setCurrent(null);
  }
  function openEditModal(c) {
    setModalMode("edit");
    setForm({
      name_patient: c.name_patient || "",
      ic_number: c.ic_number || "",
      date_time: c.date_time ? c.date_time.slice(0, 16) : "",
      status: c.status || "In Progress",
    });
    setCurrent(c);
    setShowModal(true);
  }
  function closeModal() {
    setShowModal(false);
    setCurrent(null);
    setForm({ name_patient: "", ic_number: "", date_time: "", status: "In Progress", assigned_to: "", role: "Counselor" });
  }
  function handleFormChange(e) {
    const { name, value } = e.target;
    
    // Validate date/time to prevent past dates
    if (name === "date_time" && value) {
      const selectedDate = new Date(value);
      const now = new Date();
      
      if (selectedDate < now) {
        alert("Cannot select a past date. Please choose today's date or a future date.");
        return; // Don't update the form with past date
      }
    }
    
    setForm(f => ({ ...f, [name]: value }));
    
    // Reset assigned_to when role changes
    if (name === "role") {
      setForm(f => ({ ...f, [name]: value, assigned_to: "" }));
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    
    // Final validation: Check if selected date/time is not in the past
    if (form.date_time) {
      const selectedDate = new Date(form.date_time);
      const now = new Date();
      
      if (selectedDate < now) {
        alert("Cannot submit a past date. Please choose today's date or a future date.");
        setSaving(false);
        return;
      }
    }
    
    // Try to get user from both possible localStorage keys
    const user = JSON.parse(localStorage.getItem("psychiatristUser")) || 
                JSON.parse(localStorage.getItem("psychiatrystUser"));
    
    const psychiatristId = user?.id;
    console.log("Submit - Psychiatrist ID:", psychiatristId);
    
    if (!psychiatristId) {
      alert("User information not found. Please login again.");
      setSaving(false);
      return;
    }
    
    let payload;
    let counselor_id = null;
    let psychiatrist_id = null;
    
    if (modalMode === "edit" && current) {
      // For editing, preserve existing assignment and role
      payload = {
        name_patient: form.name_patient,
        ic_number: form.ic_number,
        date_time: form.date_time,
        status: form.status,
        assigned_to: current.assigned_to, // Keep existing assignment
        role: current.role // Keep existing role
      };
    } else {
      // For new cases, validate assignment fields
      if (!form.assigned_to || !form.role) {
        alert("Please select both Role and Assigned To before saving.");
        setSaving(false);
        return;
      }
      
      // Find the selected professional and get their ID
      if (form.role === "Counselor") {
        const selectedCounselor = professionals.counselors.find(c => c.full_name === form.assigned_to);
        if (!selectedCounselor) {
          alert("Selected counselor not found. Please try again.");
          setSaving(false);
          return;
        }
        counselor_id = selectedCounselor.id;
      } else if (form.role === "Psychiatrist") {
        const selectedPsychiatrist = professionals.psychiatrists.find(p => p.full_name === form.assigned_to);
        if (!selectedPsychiatrist) {
          alert("Selected psychiatrist not found. Please try again.");
          setSaving(false);
          return;
        }
        psychiatrist_id = selectedPsychiatrist.id;
      }
      
      payload = {
        name_patient: form.name_patient,
        ic_number: form.ic_number,
        date_time: form.date_time,
        status: form.status,
        assigned_to: form.assigned_to,
        role: form.role,
        counselor_id,
        psychiatrist_id,
      };
    }
    
    console.log("Submitting payload:", payload);
    
    let url = "http://localhost:5000/api/emergency-cases/admin";
    let method = "POST";
    if (modalMode === "edit" && current) {
      url = `http://localhost:5000/api/emergency-cases/${current.id}`;
      method = "PUT";
    }
    
    try {
      const token = localStorage.getItem('psychiatrystToken');
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        fetchCases();
        closeModal();
      } else {
        const errorData = await res.json();
        alert(`Failed to save emergency case: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving case:", error);
      alert("Failed to save emergency case due to a network error.");
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this emergency case?")) return;
    setDeletingId(id);
    const token = localStorage.getItem('psychiatrystToken');
    const res = await fetch(`http://localhost:5000/api/emergency-cases/${id}`, { 
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

  return (
    <div className="min-h-screen w-full flex bg-white">
      <PsychiatristSidebar activePage="EMERGENCY" />
      <main className="flex-1 w-full p-4 sm:p-8">
        <h2 className="text-2xl font-bold text-black mb-6">My Emergency Cases</h2>
        {/* Status summary cards */}
        <div className="flex gap-4 mb-8">
          <StatusCard label="In Progress" count={inProgress} color="bg-yellow-100" />
          <StatusCard label="Resolved" count={resolved} color="bg-blue-100" />
          <StatusCard label="Solved" count={solved} color="bg-green-100" />
        </div>
        {/* Search and filter row */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by patient name or IC number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-72 placeholder-black"
            style={{ color: '#000' }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-48"
            style={{ color: '#000' }}
          >
            {STATUS_OPTIONS.map(opt => <option key={opt} style={{ color: '#000' }}>{opt}</option>)}
          </select>
          <div className="flex-1 flex justify-end">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition" onClick={openNewModal}>New Emergency</button>
          </div>
        </div>
        {/* Data table */}
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
                ) : filteredCases.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-black py-12">No emergency cases found.</td></tr>
                ) : (
                  filteredCases.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-blue-50/40 transition text-black">
                      <td className="py-2 px-4 text-black">{c.name_patient || '-'}</td>
                      <td className="py-2 px-4 text-black">{c.ic_number || '-'}</td>
                      <td className="py-2 px-4 text-black">{formatDateTime(c.date_time)}</td>
                      <td className="py-2 px-4 text-black">
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
        {/* Modal for create/edit */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[6px]">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative z-10">
              <h2 className="text-2xl font-bold mb-6 text-black">{modalMode === "edit" ? "Edit Emergency Case" : "New Emergency Case"}</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block font-medium mb-1 text-black">Patient Name</label>
                  <input
                    type="text"
                    name="name_patient"
                    className="w-full border rounded px-3 py-2 text-black placeholder-gray-500"
                    value={form.name_patient}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-black">IC Number</label>
                  <input
                    type="text"
                    name="ic_number"
                    className="w-full border rounded px-3 py-2 text-black placeholder-gray-500"
                    value={form.ic_number}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-black">Date/Time</label>
                  <input
                    type="datetime-local"
                    name="date_time"
                    className="w-full border rounded px-3 py-2 text-black placeholder-gray-500"
                    value={form.date_time}
                    onChange={handleFormChange}
                    required
                    min={todayString}
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
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Solved">Solved</option>
                  </select>
                </div>
                {modalMode === "new" && (
                  <>
                    <div>
                      <label className="block font-medium mb-1 text-black">Role</label>
                      <select
                        name="role"
                        className="w-full border rounded px-3 py-2 text-black"
                        value={form.role}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="Counselor">Counselor</option>
                        <option value="Psychiatrist">Psychiatrist</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-1 text-black">Assigned To</label>
                      <select
                        name="assigned_to"
                        className="w-full border rounded px-3 py-2 text-black"
                        value={form.assigned_to}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">Select</option>
                        {form.role === "Counselor"
                          ? professionals.counselors.map(c => (
                              <option key={c.id} value={c.full_name}>{c.full_name}</option>
                            ))
                          : professionals.psychiatrists.map(p => (
                              <option key={p.id} value={p.full_name}>{p.full_name}</option>
                            ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="flex gap-4 mt-4">
                  <button type="button" className="flex-1 bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg shadow transition" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition" disabled={saving}>{saving ? (modalMode === "edit" ? "Saving..." : "Creating...") : (modalMode === "edit" ? "Save" : "Create")}</button>
                </div>
              </form>
            </div>
          </div>
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

function formatDateTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d)) return dt;
  // Format as YYYY-MM-DD HH:mm:ss
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
} 