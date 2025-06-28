"use client";
import { useState, useEffect } from "react";
import { PlayCircle, Music, FileText, Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import CounselorSidebar from "../Sidebar";

const sectionMeta = {
  video: { icon: <PlayCircle size={24} className="text-blue-400" />, label: "Video", color: "from-blue-50 to-blue-100" },
  music: { icon: <Music size={24} className="text-green-400" />, label: "Music", color: "from-green-50 to-green-100" },
  article: { icon: <FileText size={24} className="text-purple-400" />, label: "Article", color: "from-purple-50 to-purple-100" },
};

const MATERIAL_TYPES = ["video", "music", "article"];

function groupByType(materials) {
  const grouped = { video: [], music: [], article: [] };
  materials.forEach(mat => {
    if (grouped[mat.type]) grouped[mat.type].push(mat);
  });
  return grouped;
}

export default function CounselorMaterialsPage() {
  const [materials, setMaterials] = useState({ video: [], music: [], article: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: "add", mat: null, matType: "video" });
  const [form, setForm] = useState({ type: "video", title: "", upload: "", description: "" });

  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    setLoading(true);
    const res = await fetch("http://194.164.148.171:5000/api/materials");
    const data = await res.json();
    setMaterials(groupByType(data.data || []));
    setLoading(false);
  }

  function openAdd(type) {
    setForm({ type, title: "", upload: "", description: "" });
    setModal({ open: true, type: "add", mat: null, matType: type });
  }
  function openEdit(type, mat) {
    setForm({ type, title: mat.title, upload: mat.upload, description: mat.description, id: mat.id });
    setModal({ open: true, type: "edit", mat, matType: type });
  }
  function closeModal() {
    setModal({ open: false, type: "add", mat: null, matType: "video" });
    setForm({ type: "video", title: "", upload: "", description: "" });
  }

  async function handleDelete(type, id) {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    await fetch(`http://194.164.148.171:5000/api/materials/${id}`, { method: "DELETE" });
    fetchMaterials();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.upload) return;
    if (modal.type === "add") {
      await fetch("http://194.164.148.171:5000/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: modal.matType })
      });
    } else if (modal.type === "edit") {
      await fetch(`http://194.164.148.171:5000/api/materials/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
    }
    closeModal();
    fetchMaterials();
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f7fafc] to-[#eaf3fa]">
      <CounselorSidebar activePage="MATERIALS" />
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-blue-800 mb-8">Materials</h1>
        {loading ? <div>Loading...</div> : (
        <div className="flex flex-col gap-8">
          {MATERIAL_TYPES.map(type => (
            <section key={type} className={`w-full rounded-3xl shadow-xl p-6 bg-gradient-to-br ${sectionMeta[type].color} flex flex-col mb-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {sectionMeta[type].icon}
                  <span className="text-2xl font-bold text-gray-800">{sectionMeta[type].label}</span>
                </div>
                <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2 rounded-full shadow transition text-lg" onClick={() => openAdd(type)}>
                  <Plus size={20} /> Add
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-left bg-white bg-opacity-80 rounded-xl">
                  <thead>
                    <tr className="text-gray-700 text-base">
                      <th className="px-4 py-2 font-semibold">Title</th>
                      <th className="px-4 py-2 font-semibold">Link</th>
                      <th className="px-4 py-2 font-semibold">Description</th>
                      <th className="px-4 py-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials[type].map(mat => (
                      <tr key={mat.id} className="hover:bg-blue-50/40 transition rounded-xl">
                        <td className="px-4 py-2 font-medium text-gray-900">{mat.title}</td>
                        <td className="px-4 py-2">
                          <a href={mat.upload} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <ExternalLink size={16} /> Link
                          </a>
                        </td>
                        <td className="px-4 py-2 text-gray-700">{mat.description}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <button className="p-2 rounded-full hover:bg-blue-100 transition" title="Edit" onClick={() => openEdit(type, mat)}>
                            <Edit size={18} className="text-blue-500" />
                          </button>
                          <button className="p-2 rounded-full hover:bg-red-100 transition" title="Delete" onClick={() => handleDelete(type, mat.id)}>
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {materials[type].length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-gray-400 py-6">No materials yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
        )}
        {/* Modal for Add/Edit */}
        {modal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(6px)' }}>
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-extrabold mb-4 text-black">{modal.type === "add" ? "Add Material" : "Edit Material"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-bold mb-1 text-black">Title</label>
                  <input
                    className="w-full border rounded-lg px-4 py-2 font-bold text-black"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                    placeholder="Enter material title"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-black">Link</label>
                  <input
                    className="w-full border rounded-lg px-4 py-2 font-bold text-black"
                    value={form.upload}
                    onChange={e => setForm(f => ({ ...f, upload: e.target.value }))}
                    required
                    placeholder="Paste or type the link here"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-black">Description</label>
                  <textarea
                    className="w-full border rounded-lg px-4 py-2 font-bold text-black"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Enter a short description for this material"
                  />
                </div>
                <div className="flex gap-4 mt-4">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition">{modal.type === "add" ? "Add" : "Save"}</button>
                  <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded-lg transition" onClick={closeModal}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 