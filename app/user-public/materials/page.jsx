"use client";
import { PlayCircle, Music, FileText, X, MoreVertical, Menu } from "lucide-react";
import Image from "next/image";
import Sidebar from "../Sidebar";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

function DescriptionModal({ title, description, onClose }) {
  if (!description) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 relative max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 bg-gray-100 rounded-full p-1 text-gray-800 hover:bg-gray-200 z-10">
          <X size={20} color="#000" />
        </button>
        <h3 className="text-2xl font-bold mb-4 text-black">{title}</h3>
        <div className="prose max-w-none">
          <p className="text-black">{description}</p>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ material, onClose }) {
  if (!material) return null;

  const { type, upload: link, title } = material;
  let content;

  if (type === 'video') {
    content = (
      <div className="aspect-video w-full bg-black">
        <ReactPlayer 
          url={link} 
          controls 
          playing 
          width="100%" 
          height="100%" 
          config={{ file: { attributes: { poster: material.thumbnail_url || '/thumbnail.jpg' } } }}
        />
      </div>
    );
  } else if (type === 'music') {
    content = (
      <div className="p-4">
        <ReactPlayer url={link} controls playing width="100%" height="50px" />
      </div>
    );
  } else if (type === 'article') {
    let articleUrl = link || '';
    if (articleUrl.includes("drive.google.com")) {
      articleUrl = articleUrl.replace("/view", "/preview");
    }
    content = <iframe src={articleUrl} className="w-full h-full border-0" />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-4 relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 bg-gray-100 rounded-full p-1 text-gray-800 hover:bg-gray-200 z-10">
          <X size={24} color="#000" />
        </button>
        <h3 className="text-xl font-bold mb-4 pr-10 text-black">{title}</h3>
        <div className={type === 'article' ? 'w-full h-[75vh]' : ''}>
          {content}
        </div>
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState({ videos: [], music: [], articles: [] });
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [descriptionModal, setDescriptionModal] = useState({ isOpen: false, content: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await fetch('/api/materials');
        if (!res.ok) {
          throw new Error('Failed to fetch materials');
        }
        const data = await res.json();
        if (data.success) {
          const videos = data.data.filter(m => m.type === 'video');
          const music = data.data.filter(m => m.type === 'music');
          const articles = data.data.filter(m => m.type === 'article');
          setMaterials({ videos, music, articles });
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, []);

  const openDescription = (e, material) => {
    e.stopPropagation();
    setDescriptionModal({ isOpen: true, content: material });
  };

  const closeDescription = () => {
    setDescriptionModal({ isOpen: false, content: null });
  };

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* Hamburger menu for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-white rounded-full p-2 shadow-lg border border-gray-200"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={28} color="#000" />
      </button>
      {/* Sidebar as drawer on mobile, static on desktop */}
      <div>
        {/* Mobile Drawer */}
        <div
          className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} md:hidden`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 md:static md:translate-x-0 md:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:min-h-screen`}
        >
          {/* Close button for mobile */}
          <button
            className="md:hidden absolute top-4 right-4 z-50 bg-gray-100 rounded-full p-1 border border-gray-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} color="#000" />
          </button>
          <Sidebar activePage="MATERIALS" />
        </aside>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 transition-all duration-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Materials</h1>
        {preview && <PreviewModal material={preview} onClose={() => setPreview(null)} />}
        {descriptionModal.isOpen && (
          <DescriptionModal 
            title={descriptionModal.content.title}
            description={descriptionModal.content.description} 
            onClose={closeDescription} 
          />
        )}
        {loading ? (
          <div className="text-center text-gray-500">Loading materials...</div>
        ) : (
          <>
            {/* Educational Videos */}
            <section className="bg-white rounded-2xl shadow p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <PlayCircle className="text-red-500" size={22} />
                <span className="font-semibold text-gray-800 text-lg">Educational Videos</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {materials.videos.length > 0 ? materials.videos.map((v, i) => (
                  <div key={v.id || i} className="flex flex-col group">
                    <div className="relative rounded-xl overflow-hidden shadow mb-2 cursor-pointer" onClick={() => setPreview(v)}>
                      <Image src={v.thumbnail_url || "/thumbnail.jpg"} alt={v.title} width={320} height={180} className="object-cover w-full h-40 group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle size={48} className="text-white" />
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded font-semibold">{v.duration}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-800 text-sm mt-1">{v.title}</span>
                      <button onClick={(e) => openDescription(e, v)} className="text-gray-400 hover:text-gray-600 p-1">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                )) : <p className="text-gray-500 col-span-full">No videos available.</p>}
              </div>
            </section>
            {/* Relaxing Music */}
            <section className="bg-white rounded-2xl shadow p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Music className="text-purple-500" size={22} />
                <span className="font-semibold text-gray-800 text-lg">Relaxing Music</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {materials.music.length > 0 ? materials.music.map((m, i) => (
                  <div key={m.id || i} className="relative flex flex-col items-center justify-center bg-purple-50 rounded-xl px-6 py-4 min-w-[180px] shadow-sm group">
                     <div className="cursor-pointer text-center" onClick={() => setPreview(m)}>
                      <Music className="text-purple-400 mb-1 mx-auto" size={28} />
                      <span className="font-medium text-purple-800 text-sm mb-1 text-center">{m.title}</span>
                      <span className="text-xs text-gray-500">{m.duration}</span>
                    </div>
                    <button onClick={(e) => openDescription(e, m)} className="absolute top-1 right-1 text-purple-400 hover:text-purple-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                )) : <p className="text-gray-500">No music available.</p>}
              </div>
            </section>
            {/* Articles & Resources */}
            <section className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-green-500" size={22} />
                <span className="font-semibold text-gray-800 text-lg">Articles & Resources</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {materials.articles.length > 0 ? materials.articles.map((a, i) => (
                  <div key={a.id || i} className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col group">
                    <div className="cursor-pointer" onClick={() => setPreview(a)}>
                      <span className="font-medium text-gray-800 mb-1">{a.title}</span>
                      <span className="text-xs text-gray-500">{a.duration}</span>
                    </div>
                    <button onClick={(e) => openDescription(e, a)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                )) : <p className="text-gray-500 col-span-full">No articles available.</p>}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
} 