"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PsychiatristSidebar from "../Sidebar";
import { Mail, User, Clock, Check, X } from "lucide-react";

const STATUS_COLORS = {
  "Pending": "bg-yellow-100 text-yellow-800",
  "Accepted": "bg-green-100 text-green-800",
  "Declined": "bg-red-100 text-red-800",
};

export default function PsychiatristReferralRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Authentication check on page load
  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const userData = JSON.parse(localStorage.getItem("psychiatrystUser"));
        const token = userData?.token;
        
        if (!userData || !token) {
          // No valid authentication found, redirect to login
          router.push("/psychiatryst/login");
          return false;
        }
        
        setUser(userData);
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
      const userData = JSON.parse(localStorage.getItem("psychiatrystUser"));
      if (!userData || !userData.token) {
        router.push("/psychiatryst/login");
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  async function fetchRequests() {
    if (!user || !user.id) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('psychiatrystToken');
      const res = await fetch(`/api/referral-requests/psychiatrist?status=${encodeURIComponent(statusFilter)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Check if API response indicates authentication failure
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setRequests(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to fetch referral requests.");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to fetch referral requests.");
    }
    setLoading(false);
  }

  useEffect(() => { 
    if (!isAuthenticated || !user) return;
    fetchRequests(); 
  }, [statusFilter, isAuthenticated, user]);

  async function handleAction(id, newStatus) {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('psychiatrystToken');
      const res = await fetch(`/api/referral-requests/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      // Check if API response indicates authentication failure
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      const data = await res.json();
      if (!data.success) setError(data.message || `Failed to update status to ${newStatus}.`);
      await fetchRequests();
    } catch (err) {
      console.error("Error updating status:", err);
      setError(`Failed to update status to ${newStatus}.`);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this referral request?")) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('psychiatrystToken');
      const response = await fetch(`/api/referral-requests/${id}`, { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      // Check if API response indicates authentication failure
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      await fetchRequests();
    } catch (err) {
      console.error("Error deleting request:", err);
      setError("Failed to delete referral request.");
    }
    setLoading(false);
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

  const filteredRequests = requests.filter(r =>
    (statusFilter === "All" || r.status === statusFilter) &&
    (r.patient_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen w-full flex bg-white">
      <PsychiatristSidebar activePage="REFERRALS" />
      <main className="flex-1 w-full px-4 py-6 sm:px-8 sm:py-10 bg-white min-h-screen">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <Mail size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Pending Referral Requests</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center w-full">
            <label className="font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            >
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
              <option value="All">All</option>
            </select>
            <input
              type="text"
              placeholder="Search by patient name"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-80 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex-1" />
          </div>
          {error && <div className="text-red-600 font-semibold mb-4">{error}</div>}
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-gray-600">No referral requests found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(req => (
                <div key={req.id} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-800"}`}>{req.status}</span>
                    <span className="ml-auto text-xs text-gray-500">{req.created_at ? req.created_at.replace('T', ' ').substring(0, 19) : ''}</span>
                  </div>
                  <div className="font-bold text-lg text-black">{req.patient_name}</div>
                  <div className="text-gray-700">Referred by: <span className="font-medium">{req.referred_by}</span></div>
                  <div className="text-gray-700">Disorder: <span className="font-medium">{req.disorder}</span></div>
                  <div className="flex gap-2 mt-4">
                    {req.status === "Pending" && (
                      <>
                        <button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow transition"
                          onClick={() => handleAction(req.id, "Accepted")}
                          disabled={loading}
                        >
                          Accept
                        </button>
                        <button
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg shadow transition"
                          onClick={() => handleAction(req.id, "Declined")}
                          disabled={loading}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    <button
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg shadow transition"
                      onClick={() => handleDelete(req.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 