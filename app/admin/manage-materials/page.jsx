"use client";
import { useRouter, usePathname } from "next/navigation";
import { Home, Users, BookOpen, MessageCircle, AlertTriangle, LogOut, Play, Edit, Trash2, Plus, Music, FileText, Calendar } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import AdminSidebar from '../Sidebar';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const sidebarMenu = [
  { icon: <Home size={20} />, label: "Dashboard", path: "/admin/dashboard" },
  { icon: <Users size={20} />, label: "Manage Users", path: "/admin/manage-users" },
  { icon: <BookOpen size={20} />, label: "Manage Materials", path: "/admin/manage-materials" },
  { icon: <MessageCircle size={20} />, label: "Manage Feedback", path: "/admin/manage-feedbacks" },
  { icon: <Calendar size={20} />, label: "Manage Appointments", path: "/admin/manage-appointments" },
  { icon: <AlertTriangle size={20} />, label: "Manage Emergency Case", path: "/admin/manage-emergency" },
];

export default function ManageMaterialsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [modal, setModal] = useState({ open: false, type: null, material: null });
  const [materials, setMaterials] = useState({ video: [], music: [], article: [] });
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  async function fetchMaterials() {
    setLoading(true);
    try {
      const [video, music, article] = await Promise.all([
        fetch('/api/materials/video').then(r => r.json()),
        fetch('/api/materials/music').then(r => r.json()),
        fetch('/api/materials/article').then(r => r.json()),
      ]);
      setMaterials({
        video: video.data || [],
        music: music.data || [],
        article: article.data || [],
      });
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh materials data every 20 seconds
  const { refresh: refreshMaterials } = useAutoRefresh(
    fetchMaterials,
    20000, // 20 seconds
    isAuthenticated // Only refresh when authenticated
  );

  useEffect(() => { 
    if (isAuthenticated) {
      fetchMaterials(); 
    }
  }, [isAuthenticated]);

  function handleAdd(type) {
    setModal({ open: true, type, material: null });
  }
  function handleEdit(type, material) {
    setModal({ open: true, type, material });
  }
  function handleClose() {
    setModal({ open: false, type: null, material: null });
  }
  async function handleSubmit(form, isEdit) {
    if (isEdit) {
      await fetch(`/api/materials/${modal.material.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    handleClose();
    fetchMaterials();
  }
  async function handleDelete(id) {
    await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    fetchMaterials();
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="font-bold text-3xl text-gray-900">Manage Materials</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refresh: ON</span>
          </div>
        </div>

        {/* Video Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Play size={28} className="text-blue-500" />
              <span className="text-xl font-semibold text-gray-900">Video</span>
            </div>
            <button className="border border-neutral-300 px-5 py-2 rounded-lg hover:bg-neutral-100 transition flex items-center gap-2 text-gray-900 font-medium" onClick={() => handleAdd('video')}>
              <Plus size={18} /> Add
            </button>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Title</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Link</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Description</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.video.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-4">No videos found</td></tr>
                ) : materials.video.map(row => (
                  <tr key={row.id}>
                    <td className="py-2 px-3 text-gray-800">{row.title}</td>
                    <td className="py-2 px-3 text-gray-800"><a href={row.upload} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a></td>
                    <td className="py-2 px-3 text-gray-800">{row.description}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button 
                          className="flex items-center gap-1 px-2 py-1 text-blue-700 font-semibold hover:bg-blue-50 rounded text-xs"
                          onClick={() => handleEdit('video', row)}
                        >
                          <Edit size={12} />
                          Edit
                        </button>
                        <button 
                          className="flex items-center gap-1 px-2 py-1 text-red-700 font-semibold hover:bg-red-50 rounded text-xs"
                          onClick={() => handleDelete(row.id)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Music Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Music size={28} className="text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900">Music</h2>
            </div>
            <button className="border border-neutral-300 px-5 py-2 rounded-lg hover:bg-neutral-100 transition flex items-center gap-2 text-gray-900 font-medium" onClick={() => handleAdd('music')}>
              <Plus size={18} /> Add
            </button>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Title</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Link</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Description</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.music.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-4">No music found</td></tr>
                ) : materials.music.map(row => (
                  <tr key={row.id}>
                    <td className="py-2 px-3 text-gray-800">{row.title}</td>
                    <td className="py-2 px-3 text-gray-800">
                      <a href={row.upload} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Link
                      </a>
                    </td>
                    <td className="py-2 px-3 text-gray-800">{row.description}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button 
                          className="flex items-center gap-1 px-2 py-1 text-blue-700 font-semibold hover:bg-blue-50 rounded text-xs"
                          onClick={() => handleEdit('music', row)}
                        >
                          <Edit size={12} />
                          Edit
                        </button>
                        <button 
                          className="flex items-center gap-1 px-2 py-1 text-red-700 font-semibold hover:bg-red-50 rounded text-xs"
                          onClick={() => handleDelete(row.id)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Article Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <FileText size={28} className="text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">Article</h2>
            </div>
            <button className="border border-neutral-300 px-5 py-2 rounded-lg hover:bg-neutral-100 transition flex items-center gap-2 text-gray-900 font-medium" onClick={() => handleAdd('article')}>
              <Plus size={18} /> Add
            </button>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Title</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Link</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Summary</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.article.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-4">No articles found</td></tr>
                ) : materials.article.map(row => (
                  <tr key={row.id}>
                    <td className="py-2 px-3 text-gray-800">{row.title}</td>
                    <td className="py-2 px-3 text-gray-800">
                      <a href={row.upload} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Link
                      </a>
                    </td>
                    <td className="py-2 px-3 text-gray-800">{row.description}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button 
                          className="flex items-center gap-1 px-2 py-1 text-blue-700 font-semibold hover:bg-blue-50 rounded text-xs"
                          onClick={() => handleEdit('article', row)}
                        >
                          <Edit size={12} />
                          Edit
                        </button>
                        <button 
                          className="flex items-center gap-1 px-2 py-1 text-red-700 font-semibold hover:bg-red-50 rounded text-xs"
                          onClick={() => handleDelete(row.id)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal for Add Material */}
      {modal.open && (
        <MaterialModal type={modal.type} onClose={handleClose} onSubmit={handleSubmit} material={modal.material} />
      )}
    </div>
  );
}

// Modal component
function MaterialModal({ type, onClose, onSubmit, material }) {
  const [form, setForm] = useState(material ? { ...material, type } : { type, title: '', upload: '', description: '' });
  const [loading, setLoading] = useState(false);
  const isVideo = type === 'video';
  const isMusic = type === 'music';
  const isArticle = type === 'article';

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form, !!material);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <form onSubmit={handleSubmit} className="relative z-10 bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-5">
        <h3 className="text-2xl font-bold mb-2 text-gray-900">{material ? 'Edit' : 'Add'} {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400" required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">{isVideo ? 'Link/Upload' : isMusic ? 'Link' : 'Link'}</label>
          <input name="upload" value={form.upload} onChange={handleChange} className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400" required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-800">{isArticle ? 'Summary' : 'Description'}</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400" rows={3} />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button type="button" className="px-4 py-2 rounded-lg border border-gray-400 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700" disabled={loading}>{loading ? (material ? 'Saving...' : 'Adding...') : (material ? 'Save' : 'Add')}</button>
        </div>
      </form>
    </div>
  );
} 