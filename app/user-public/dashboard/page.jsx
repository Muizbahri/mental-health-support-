"use client";
import { useState, useEffect } from "react";
import { Calendar, MapPin, Music, User, PlayCircle, FileText } from "lucide-react";
import Sidebar from "../Sidebar";
import dynamic from "next/dynamic";
const MapComponent = dynamic(() => import("../self-assessment/find-location/components/MapComponent"), { ssr: false });

const moodOptions = [
  { label: "Very Good", emoji: "😄", color: "border-green-400 bg-green-50 text-green-700" },
  { label: "Good", emoji: "🙂", color: "border-blue-400 bg-blue-50 text-blue-700" },
  { label: "Okay", emoji: "😐", color: "border-yellow-400 bg-yellow-50 text-yellow-700" },
  { label: "Bad", emoji: "😕", color: "border-orange-400 bg-orange-50 text-orange-700" },
  { label: "Very Bad", emoji: "😣", color: "border-red-400 bg-red-50 text-red-700" },
];

const hospitals = [
  { name: "St. Mary's Hospital", location: "Downtown", distance: "2.1 km" },
  { name: "Green Valley Clinic", location: "North Side", distance: "3.5 km" },
  { name: "Sunshine Medical Center", location: "East District", distance: "4.2 km" },
];

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

const geoapifyApiKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;

function CalendarWidget({ appointments = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Filter appointments for the selected month
  const monthAppointments = appointments.filter(app => {
    const appDate = new Date(app.date_time);
    return appDate.getFullYear() === year && appDate.getMonth() === month;
  });

  const appointmentDates = new Set(
    monthAppointments.map(app => {
      const appDate = new Date(app.date_time);
      return appDate.getDate();
    })
  );
  
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  return (
    <div className="rounded-xl bg-gradient-to-br from-green-50 to-blue-50 p-4 shadow flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <button onClick={goToPreviousMonth} className="p-1 rounded-full hover:bg-gray-200 text-black">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="text-green-500" size={20} />
          <span className="font-semibold text-gray-700">{`${monthNames[month]} ${year}`}</span>
        </div>
        <button onClick={goToNextMonth} className="p-1 rounded-full hover:bg-gray-200 text-black">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <table className="w-full text-center">
        <thead>
          <tr>
            {days.map((d, i) => <th key={`${d}-${i}`} className="w-10 h-10 font-medium text-xs text-gray-500">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((date, dayIndex) => {
                const isAppointment = date && appointmentDates.has(date);
                const today = new Date();
                const isToday = date && date === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                return (
                  <td key={dayIndex} className="p-1">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-medium relative mx-auto ${
                      isToday ? "bg-blue-500 text-white font-bold" :
                      date ? "hover:bg-blue-100 cursor-pointer text-gray-700" : "text-transparent"
                    }`}>
                      {date}
                      {isAppointment && <span className="absolute bottom-1 left-1 right-1 mx-auto w-1.5 h-1.5 bg-green-500 rounded-full" style={{display:'block'}}></span>}
                    </div>
                  </td>
                );
              })}
              {Array(7 - week.length).fill(null).map((_, i) => <td key={`pad-${i}`}></td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Appointment list for the selected month */}
      {monthAppointments.length > 0 ? (
        <div className="mt-4 text-sm text-gray-700">
          {monthAppointments.map((app, i) => {
            const d = new Date(app.date_time);
            const dateStr = d.toISOString().slice(0, 10);
            const timeStr = d.toTimeString().slice(0, 5);
            let displayName = app.assigned_to || "";
            let displayRole = app.role === "Psychiatrist" ? "Psychiatrist" : "Counselor";
            let displayPrefix = app.role === "Psychiatrist" ? " " : " ";
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: 'green', marginRight: 4 }}>•</span>
                <span style={{ fontWeight: 500 }}>
                  appointment • {dateStr}, {timeStr} – {displayPrefix}{displayName} ({displayRole})
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 text-sm text-gray-400">No appointments for this month.</div>
      )}
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
          ×
        </button>
        <h3 className="text-xl font-bold mb-4 pr-10 text-black">{title}</h3>
        <div className={type === 'article' ? 'w-full h-[75vh]' : ''}>
          {content}
        </div>
      </div>
    </div>
  );
}

export default function PublicDashboard() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [mapProfessionals, setMapProfessionals] = useState([]);
  const [recommendations, setRecommendations] = useState({ music: null, article: null, video: null });
  const [preview, setPreview] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState(null);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const [counselorsRes, psychiatristsRes] = await Promise.all([
          fetch("http://194.164.148.171:5000/api/counselors"),
          fetch("http://194.164.148.171:5000/api/psychiatrists"),
        ]);

        const counselorsResult = await counselorsRes.json();
        const psychiatristsResult = await psychiatristsRes.json();

        const counselorsData = (counselorsResult.success && Array.isArray(counselorsResult.data))
          ? counselorsResult.data.map(c => ({ ...c, role: 'Counselor' }))
          : [];
        
        const psychiatristsData = (psychiatristsResult.success && Array.isArray(psychiatristsResult.data))
          ? psychiatristsResult.data.map(p => ({ ...p, role: 'Psychiatrist' }))
          : [];

        const combined = [...counselorsData, ...psychiatristsData];
        
        setProfessionals(combined);
        setMapProfessionals(combined.filter(p => p.latitude && p.longitude));
      } catch (error) {
        console.error("Failed to fetch professionals:", error);
        setProfessionals([]);
        setMapProfessionals([]);
      }
    };
    fetchProfessionals();

    const fetchAppointments = async () => {
      const userName = localStorage.getItem("full_name");
      if (userName) {
        try {
          const res = await fetch(`http://194.164.148.171:5000/api/appointments?user=${encodeURIComponent(userName)}`);
          if (res.ok) {
            const data = await res.json();
            setAppointments(data.data || []);
          }
        } catch (error) {
          console.error("Error fetching appointments:", error);
        }
      }
    };
    fetchAppointments();

    // Fetch and shuffle materials for recommendations
    const fetchMaterials = async () => {
      try {
        const res = await fetch("http://194.164.148.171:5000/api/materials");
        const data = await res.json();
        if (data.success) {
          const music = data.data.filter(m => m.type === 'music');
          const articles = data.data.filter(m => m.type === 'article');
          const videos = data.data.filter(m => m.type === 'video');
          function getRandom(arr) {
            if (!arr.length) return null;
            return arr[Math.floor(Math.random() * arr.length)];
          }
          setRecommendations({
            music: getRandom(music),
            article: getRandom(articles),
            video: getRandom(videos),
          });
        }
      } catch (err) {
        setRecommendations({ music: null, article: null, video: null });
      }
    };
    fetchMaterials();
  }, []);

  // Default to first professional if none selected
  const selectedLatLon = selectedProfessional
    ? [selectedProfessional.latitude, selectedProfessional.longitude]
    : (mapProfessionals[0] ? [mapProfessionals[0].latitude, mapProfessionals[0].longitude] : undefined);
  const selectedName = selectedProfessional
    ? selectedProfessional.full_name
    : (mapProfessionals[0] ? mapProfessionals[0].full_name : "");

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar activePage="DASHBOARD" />
      {/* Main Content */}
      <main className="flex-1 p-10">
        {/* Top Section */}
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <span className="text-gray-500 text-lg mt-2">Welcome back! How are you feeling today?</span>
        </div>
        {/* Mood Buttons */}
        <div className="flex gap-4 mb-8">
          {moodOptions.map((mood, idx) => (
            <button
              key={`${mood.label}-${idx}`}
              className={`flex flex-col items-center px-5 py-3 rounded-xl border-2 shadow-sm transition font-semibold text-sm focus:outline-none ${mood.color} ${selectedMood === idx ? "ring-2 ring-blue-300" : ""}`}
              onClick={() => setSelectedMood(idx)}
            >
              <span className="text-2xl mb-1">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left: Hospitals & Clinics */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-blue-500" size={20} />
              <span className="font-semibold text-gray-800 text-lg">Nearby Hospitals & Clinics</span>
            </div>
            <div className="h-48 w-full rounded-lg bg-gray-200 mb-4 overflow-hidden">
              <MapComponent professionals={mapProfessionals} selectedProfessional={selectedProfessional} geoapifyApiKey={geoapifyApiKey} />
            </div>
            <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-4 overflow-x-auto pb-4" style={{gridTemplateRows: 'repeat(2, minmax(0, 1fr))'}}>
              {professionals.map((pro, i) => (
                <div 
                  key={`${pro.id}-${i}`} 
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-64 cursor-pointer hover:bg-blue-50 flex-shrink-0"
                  onClick={() => setSelectedProfessional(pro)}
                >
                  <p className="font-bold text-gray-800">{pro.full_name}</p>
                  <p className="text-sm text-gray-500">{pro.location}</p>
                  <p className={`text-sm font-medium ${pro.role === 'Counselor' ? 'text-blue-500' : 'text-purple-500'}`}>{pro.role}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Right: Appointments & Calendar */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-green-500" size={20} />
              <span className="font-semibold text-gray-800 text-lg">Upcoming Appointments</span>
            </div>
            <CalendarWidget appointments={appointments} />
          </div>
        </div>
        {/* Lower Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Today's Recommendation */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Music className="text-purple-500" size={20} />
              <span className="font-semibold text-gray-800 text-lg">Today's Recommendation</span>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              {recommendations.music && (
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPreview(recommendations.music)}>
                  <div className="bg-purple-100 rounded-full p-3">
                    <Music className="text-purple-500" size={28} />
                  </div>
                  <div>
                    <div className="font-semibold text-purple-700 underline">{recommendations.music.title}</div>
                    <div className="text-gray-500 text-sm">{recommendations.music.description}</div>
                  </div>
                </div>
              )}
              {recommendations.article && (
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPreview(recommendations.article)}>
                  <div className="bg-green-100 rounded-full p-3">
                    <FileText className="text-green-500" size={28} />
                  </div>
                  <div>
                    <div className="font-semibold text-green-700 underline">{recommendations.article.title}</div>
                    <div className="text-gray-500 text-sm">{recommendations.article.description}</div>
                  </div>
                </div>
              )}
              {recommendations.video && (
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPreview(recommendations.video)}>
                  <div className="bg-red-100 rounded-full p-3">
                    <PlayCircle className="text-red-500" size={28} />
                  </div>
                  <div>
                    <div className="font-semibold text-red-700 underline">{recommendations.video.title}</div>
                    <div className="text-gray-500 text-sm">{recommendations.video.description}</div>
                  </div>
                </div>
              )}
              {!recommendations.music && !recommendations.article && !recommendations.video && (
                <div className="text-gray-500">No recommendations available.</div>
              )}
            </div>
            {preview && <PreviewModal material={preview} onClose={() => setPreview(null)} />}
          </div>
          {/* Available Counselors & Psychiatrists */}
          <div className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-blue-500" size={20} />
              <h3 className="font-semibold text-gray-700">Available Counselors & Psychiatrists</h3>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateRows: 'repeat(2, 1fr)',
                gridAutoFlow: 'column',
                gap: '1rem',
                overflowX: 'auto',
                maxHeight: '310px',
                paddingBottom: '10px'
              }}
            >
              {professionals.map((pro, i) => (
                <div key={`${pro.id}-${i}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-4 w-72 flex-shrink-0">
                  <img
                    src={pro.profile_image ? `http://194.164.148.171:5000/uploads/${pro.profile_image}` : '/default-avatar.png'}
                    alt={pro.full_name}
                    className="w-[60px] h-[60px] rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-gray-800">{pro.full_name}</p>
                    <p className="text-sm text-gray-500">{pro.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 