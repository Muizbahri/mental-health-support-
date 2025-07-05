"use client";
import { useState, useEffect } from "react";
import { FileText, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import AdminSidebar from '../Sidebar';

function ActivityModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: "", date: "", location: "", description: "" });
  useEffect(() => { setForm(initial || { name: "", date: "", location: "", description: "" }); }, [initial, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-neutral-200">
        <h2 className="text-xl font-bold mb-4 text-black">{initial ? "Edit Activity" : "Add Activity"}</h2>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <input className="w-full border rounded p-2 bg-white text-black placeholder:text-neutral-500 border-neutral-300" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input className="w-full border rounded p-2 bg-white text-black placeholder:text-neutral-500 border-neutral-300" placeholder="Date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          <input className="w-full border rounded p-2 bg-white text-black placeholder:text-neutral-500 border-neutral-300" placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          <textarea className="w-full border rounded p-2 bg-white text-black placeholder:text-neutral-500 border-neutral-300" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-black border-neutral-400 bg-white hover:bg-neutral-100">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ open, onClose, onConfirm, text }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border border-neutral-200">
        <div className="mb-4 text-black">{text}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded text-black border-neutral-400 bg-white hover:bg-neutral-100">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function ScrapeActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(Array.isArray(data.data) ? data.data : []);
    } catch {
      setMessage("Failed to load activities.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, []);

  const handleSave = async (form) => {
    setLoading(true);
    try {
      if (editItem) {
        await fetch(`/api/activities/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setMessage("Activity updated.");
      } else {
        await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setMessage("Activity added.");
      }
      setModalOpen(false);
      setEditItem(null);
      fetchActivities();
    } catch {
      setMessage("Failed to save activity.");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure to delete this activity?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (res.ok) {
        setActivities(activities.filter(activity => activity.id !== id));
        setMessage('Activity deleted.');
      } else {
        setMessage('Failed to delete activity.');
      }
    } catch {
      setMessage('Failed to delete activity.');
    }
    setLoading(false);
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    setScrapeLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/scrape-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });
      const data = await res.json();
      setMessage(data.message || "Scraping complete.");
      fetchActivities();
    } catch {
      setMessage("Scraping failed.");
    }
    setScrapeLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      <AdminSidebar />
      <main className="flex-1 w-full p-4 sm:p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-black"><FileText /> Scrape Activities</h1>
        <form onSubmit={handleScrape} className="flex gap-2 mb-6">
          <input type="url" required placeholder="https://..." className="border rounded px-4 py-2 flex-1 bg-white text-black placeholder:text-neutral-500 border-neutral-300" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} />
          <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700" disabled={scrapeLoading}>{scrapeLoading ? <Loader2 className="animate-spin" /> : "Scrape and Save"}</button>
        </form>
        <div className="mb-4 flex justify-between items-center">
          {message && (
            <span className={
              message.toLowerCase().includes("fail") ? "text-red-600 font-medium" : "text-green-600 font-medium"
            }>{message}</span>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => { setEditItem(null); setModalOpen(true); }}><Plus size={18} /> Add Activity</button>
        </div>
        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto border border-neutral-200">
          {loading ? <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-black" /></div> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="py-2 px-3 text-left font-semibold text-black">Name</th>
                  <th className="py-2 px-3 text-left font-semibold text-black">Date</th>
                  <th className="py-2 px-3 text-left font-semibold text-black">Location</th>
                  <th className="py-2 px-3 text-left font-semibold text-black">Description</th>
                  <th className="py-2 px-3 text-left font-semibold text-black">Link</th>
                  <th className="py-2 px-3 text-left font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-neutral-500 py-4">No activities found</td></tr>
                ) : activities.map(act => (
                  <tr key={act.id} className="border-b last:border-b-0 hover:bg-neutral-100 transition">
                    <td className="py-2 px-3 text-black">{act.name}</td>
                    <td className="py-2 px-3 text-black">{act.date}</td>
                    <td className="py-2 px-3 text-black">{act.location}</td>
                    <td className="py-2 px-3 text-black">{act.description}</td>
                    <td className="py-2 px-3 text-black">
                      {act.url ? (
                        <a href={act.url} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>
                          Link
                        </a>
                      ) : ''}
                    </td>
                    <td className="py-2 px-3 flex gap-2">
                      <button className="hover:text-green-600 text-black" title="Edit" onClick={() => { setEditItem(act); setModalOpen(true); }}><Edit size={18} /></button>
                      <button className="hover:text-red-600 text-black" title="Delete" onClick={() => handleDelete(act.id)}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <ActivityModal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} onSave={handleSave} initial={editItem} />
        <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} text="Are you sure you want to delete this activity?" />
      </main>
    </div>
  );
} 