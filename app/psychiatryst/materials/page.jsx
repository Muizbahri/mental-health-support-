"use client";
import PsychiatristSidebar from "../Sidebar";
import { Video, Music, BookOpen, Plus, ExternalLink, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const MATERIAL_TYPES = ["video", "music", "article"];

function groupByType(materials) {
  const grouped = { video: [], music: [], article: [] };
  materials.forEach(mat => {
    if (grouped[mat.type]) grouped[mat.type].push(mat);
  });
  return grouped;
}

function SectionCard({ icon, title, color, data, onAdd, onEdit, onDelete }) {
  return (
    <section
      className={`rounded-3xl shadow-lg p-6 mb-8 border-0`}
      style={{
        background: color.bg,
        boxShadow: `0 4px 24px 0 ${color.shadow}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-xl" style={{ color: color.text }}>{title}</span>
        </div>
        <button onClick={() => onAdd(title.toLowerCase())} className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-1.5 rounded-lg shadow transition text-sm">
          <Plus size={18} /> Add
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-700 font-semibold text-base">
              <th className="py-2 px-2">Title</th>
              <th className="py-2 px-2">Link</th>
              <th className="py-2 px-2">Description</th>
              <th className="py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.id} className="align-top border-t border-gray-200">
                <td className="py-2 px-2 font-medium text-gray-900 w-1/6">{item.title}</td>
                <td className="py-2 px-2 w-1/12">
                  <a href={item.upload} className="text-teal-600 hover:underline flex items-center gap-1" target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} /> Link
                  </a>
                </td>
                <td className="py-2 px-2 text-gray-700 w-2/3">{item.description}</td>
                <td className="py-2 px-2 w-1/12">
                  <button onClick={() => onEdit(item)} className="inline-flex items-center text-teal-500 hover:text-teal-700 mr-2" title="Edit">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="inline-flex items-center text-red-500 hover:text-red-700" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-400 py-6">No materials yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MaterialModal({ open, onClose, onSave, initial }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [upload, setUpload] = useState(initial?.upload || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setUpload(initial?.upload || "");
      setDescription(initial?.description || "");
    }
  }, [open, initial]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ id: initial?.id, type: initial?.type, title, upload, description });
    setSaving(false);
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-blur-overlay"
      style={{ background: 'rgba(0,0,0,0.15)', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-extrabold mb-4 text-black">{initial?.id ? "Edit Material" : "Add Material"}</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block font-medium mb-1 text-black">Title</label>
            <input className="w-full border rounded px-3 py-2 text-black placeholder-black" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Enter material title" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-black">Link</label>
            <input className="w-full border rounded px-3 py-2 text-black placeholder-black" value={upload} onChange={e => setUpload(e.target.value)} required placeholder="Paste a YouTube, SoundCloud, or article link" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-black">Description</label>
            <textarea className="w-full border rounded px-3 py-2 text-black placeholder-black" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter a short description for this material" />
          </div>
          <div className="flex gap-4 mt-2">
            <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg shadow transition" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button type="button" className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg shadow transition" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PsychiatristMaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState({ video: [], music: [], article: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, initial: null });
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

  async function fetchMaterials() {
    setLoading(true);
    try {
      const res = await fetch("/api/materials");
      
      // Check if API response indicates authentication failure
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      const data = await res.json();
      setMaterials(groupByType(data.data || []));
    } catch (err) {
      console.error("Error fetching materials:", err);
      setMaterials({ video: [], music: [], article: [] });
    }
    setLoading(false);
  }

  useEffect(() => { 
    if (!isAuthenticated) return;
    fetchMaterials(); 
  }, [isAuthenticated]);

  function handleAdd(type) {
    setModal({ open: true, initial: { type } });
  }
  function handleEdit(mat) {
    setModal({ open: true, initial: mat });
  }
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    
    try {
      const response = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  }
  async function handleSave(mat) {
    try {
      let response;
      if (mat.id) {
        response = await fetch(`/api/materials/${mat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mat)
        });
      } else {
        response = await fetch("/api/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mat)
        });
      }
      
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      setModal({ open: false, initial: null });
      fetchMaterials();
    } catch (error) {
      console.error("Error saving material:", error);
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

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <PsychiatristSidebar activePage="MATERIALS" />
      <main className="flex-1 px-8 py-10">
        <h1 className="text-3xl font-bold text-teal-800 mb-8">Materials</h1>
        {MATERIAL_TYPES.map(type => (
          <SectionCard
            key={type}
            icon={type === "video" ? <Video size={22} className="text-teal-500" /> : type === "music" ? <Music size={22} className="text-green-500" /> : <BookOpen size={22} className="text-purple-500" />}
            title={type.charAt(0).toUpperCase() + type.slice(1)}
            color={type === "video"
              ? { bg: "#f4f8f7", text: "#14b8a6", shadow: "#14b8a622" }
              : type === "music"
              ? { bg: "#f4fff8", text: "#059669", shadow: "#05966922" }
              : { bg: "#faf4ff", text: "#7c3aed", shadow: "#7c3aed22" }}
            data={materials[type]}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        <MaterialModal open={modal.open} onClose={() => setModal({ open: false, initial: null })} onSave={handleSave} initial={modal.initial} />
      </main>
    </div>
  );
} 