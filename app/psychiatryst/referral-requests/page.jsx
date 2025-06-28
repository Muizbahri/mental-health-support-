"use client";
import { useEffect, useState } from "react";
import PsychiatristSidebar from "../Sidebar";
import { Mail, User, Clock, Check, X } from "lucide-react";

const STATUS_COLORS = {
  "Pending": "bg-yellow-100 text-yellow-800",
  "Accepted": "bg-green-100 text-green-800",
  "Declined": "bg-red-100 text-red-800",
};

export default function PsychiatristReferralRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("psychiatrystUser")) : null;

  async function fetchRequests() {
    if (!user || !user.full_name) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/referral_requests?assigned_to=${encodeURIComponent(user.full_name)}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      } else {
        setError(data.message || "Failed to fetch referral requests.");
      }
    } catch (err) {
      setError("Failed to fetch referral requests.");
    }
    setLoading(false);
  }

  useEffect(() => { fetchRequests(); }, []);

  async function handleAction(id, newStatus) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/referral_requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) setError(data.message || `Failed to update status to ${newStatus}.`);
      await fetchRequests();
    } catch (err) {
      setError(`Failed to update status to ${newStatus}.`);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this referral request?")) return;
    setLoading(true);
    setError("");
    try {
      await fetch(`/api/referral_requests/${id}`, { method: "DELETE" });
      await fetchRequests();
    } catch (err) {
      setError("Failed to delete referral request.");
    }
    setLoading(false);
  }

  const filteredRequests = requests.filter(r =>
    (statusFilter === "All" || r.status === statusFilter) &&
    (r.patient_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex bg-[#f4f7fd]">
      <PsychiatristSidebar activePage="REFERRALS" />
      <main className="flex-1 px-8 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Mail size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Pending Referral Requests</h1>
          </div>
          <div className="flex gap-4 mb-6 items-center">
            <label className="font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
              <option value="All">All</option>
            </select>
            <input
              type="text"
              placeholder="Search by patient name"
              className="border border-gray-300 rounded-lg px-4 py-2 w-80 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
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
                <div key={req.id} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-2">
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