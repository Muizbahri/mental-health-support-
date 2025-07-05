"use client";
import { useState, useEffect } from "react";
import { Calendar, MapPin, Music, User, PlayCircle, FileText, Menu, X } from "lucide-react";
import Sidebar from "../Sidebar";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import NotificationDrawer from '../../../components/NotificationDrawer';
const MapComponent = dynamic(() => import("../self-assessment/find-location/components/MapComponent"), { ssr: false });

const moodOptions = [
  { label: "Very Good", emoji: "😄", color: "border-green-400 bg-green-50 text-green-700" },
  { label: "Good", emoji: "🙂", color: "border-blue-400 bg-blue-50 text-blue-700" },
  { label: "Okay", emoji: "😐", color: "border-yellow-400 bg-yellow-50 text-yellow-700" },
  { label: "Bad", emoji: "😕", color: "border-orange-400 bg-orange-50 text-orange-700" },
  { label: "Very Bad", emoji: "😣", color: "border-red-400 bg-red-50 text-red-700" },
];

// Encouragement messages for each mood type
const encouragementMessages = {
  "Very Good": [
    "Amazing! Your positive energy is infectious!",
    "Fantastic! Keep riding this wave of positivity!",
    "Wonderful! You're radiating happiness today!",
    "Excellent! Your good mood brightens everyone's day!",
    "Brilliant! This positive energy will carry you far!",
    "Superb! You're absolutely glowing with positivity!",
    "Terrific! Your happiness is well-deserved!",
    "Marvelous! Keep embracing these joyful moments!",
    "Outstanding! Your positive outlook is inspiring!",
    "Incredible! You're thriving and it shows!",
    "Splendid! Your happiness is contagious!",
    "Magnificent! You're on top of the world today!",
    "Phenomenal! Keep nurturing this positive state!",
    "Extraordinary! Your joy lights up the room!",
    "Remarkable! This positive energy suits you well!",
    "Stellar! You're radiating good vibes!",
    "Exceptional! Your happiness is a beautiful thing to witness!",
    "Spectacular! Keep celebrating these wonderful feelings!",
    "Impressive! Your positive mindset is paying off!",
    "Excellent! You deserve every bit of this happiness!",
    "Sensational! Keep riding this positive wave!",
    "Fantastic! Your joy is absolutely radiant!",
    "Wonderful! This positive energy will propel you forward!",
    "Brilliant! You're absolutely shining today!",
    "Amazing! Keep nurturing this beautiful state of mind!",
    "Tremendous! Your positive outlook is inspiring!",
    "Fabulous! This happiness looks great on you!",
    "Wonderful! Keep embracing these positive moments!",
    "Excellent! Your joy is truly contagious!",
    "Magnificent! Keep sharing your positive energy!",
    "Marvelous! You're absolutely beaming today!",
    "Incredible! Your happiness is well-earned!",
    "Wonderful! Keep cultivating this positive mindset!",
    "Superb! Your joy brings light to those around you!",
    "Fantastic! This positive energy will take you places!",
    "Brilliant! Keep nurturing this wonderful feeling!",
    "Amazing! Your happiness is truly inspiring!",
    "Excellent! Keep riding this wave of positivity!",
    "Spectacular! Your joy is absolutely radiant!",
    "Wonderful! This positive energy suits you perfectly!",
    "Remarkable! Keep embracing these beautiful moments!",
    "Fantastic! Your happiness is a gift to yourself and others!",
    "Brilliant! Keep nurturing this positive state of mind!",
    "Amazing! Your joy is truly contagious!",
    "Excellent! Keep celebrating these wonderful feelings!",
    "Wonderful! Your positive energy is truly remarkable!",
    "Superb! Keep embracing this beautiful state of being!",
    "Fantastic! Your happiness is absolutely radiant!",
    "Brilliant! Keep sharing your positive energy!",
    "Amazing! Your joy is truly inspiring!"
  ],
  "Good": [
    "Great job! You're doing wonderfully today!",
    "Nicely done! Your positive attitude is showing!",
    "Well done! Keep nurturing this good energy!",
    "Good for you! Your positivity is admirable!",
    "Excellent! You're handling things beautifully!",
    "Impressive! Your good mood is well-deserved!",
    "Wonderful! Keep embracing these positive feelings!",
    "Fantastic! You're doing great today!",
    "Terrific! Your positive outlook is paying off!",
    "Brilliant! Keep nurturing this good energy!",
    "Awesome! You're on a positive path today!",
    "Excellent! Your good spirits are inspiring!",
    "Marvelous! Keep embracing this positive mindset!",
    "Wonderful! You're doing really well today!",
    "Fantastic! Your positive energy is showing!",
    "Great work! Keep nurturing these good feelings!",
    "Excellent! You're in a good place today!",
    "Impressive! Your positive attitude is admirable!",
    "Wonderful! Keep embracing this good energy!",
    "Brilliant! You're handling things beautifully!",
    "Terrific! Your positive outlook is refreshing!",
    "Fantastic! Keep nurturing this good mood!",
    "Excellent! You're doing wonderfully today!",
    "Great job! Your positive energy is showing!",
    "Wonderful! Keep embracing these good feelings!",
    "Impressive! You're on a positive track today!",
    "Brilliant! Your good mood is well-deserved!",
    "Excellent! Keep nurturing this positive energy!",
    "Fantastic! You're handling things beautifully!",
    "Wonderful! Your positive outlook is admirable!",
    "Great work! Keep embracing these good feelings!",
    "Terrific! You're doing really well today!",
    "Excellent! Your positive attitude is showing!",
    "Brilliant! Keep nurturing this good energy!",
    "Wonderful! You're in a good place today!",
    "Fantastic! Your positive outlook is refreshing!",
    "Great job! Keep embracing these good feelings!",
    "Excellent! You're handling things beautifully!",
    "Impressive! Your good mood is well-deserved!",
    "Wonderful! Keep nurturing this positive energy!",
    "Brilliant! You're doing wonderfully today!",
    "Terrific! Your positive attitude is showing!",
    "Fantastic! Keep embracing this good energy!",
    "Excellent! You're on a positive path today!",
    "Great work! Your good spirits are inspiring!",
    "Wonderful! Keep nurturing this positive mindset!",
    "Impressive! You're doing really well today!",
    "Brilliant! Your positive energy is showing!",
    "Excellent! Keep embracing these good feelings!",
    "Fantastic! You're in a good place today!"
  ],
  "Okay": [
    "You're doing alright, and that's perfectly fine!",
    "It's okay to have neutral days - they're part of life's balance.",
    "Steady and stable - sometimes that's exactly what we need.",
    "Middle ground days help us appreciate the highs even more.",
    "You're navigating today with calm steadiness - well done!",
    "Being okay is a perfectly valid state - honor where you are today.",
    "Neutral days are important too - they give us space to reflect.",
    "You're maintaining balance today - that's a skill worth celebrating.",
    "Sometimes 'okay' is exactly where we need to be - and that's perfectly fine.",
    "Steady days build resilience for whatever comes next.",
    "There's strength in stability - you're doing well!",
    "Middle ground moments give us space to breathe and center ourselves.",
    "Being okay means you're holding steady - that's an achievement!",
    "Neutral days are the canvas for what comes next - you're doing fine.",
    "You're maintaining equilibrium today - that's a valuable skill.",
    "Sometimes 'okay' is exactly what we need - embrace this steady moment.",
    "There's wisdom in accepting these neutral moments - well done!",
    "Steady days build the foundation for better ones ahead.",
    "You're navigating today with calm presence - that's admirable.",
    "Being okay is part of life's natural rhythm - you're right where you need to be.",
    "Neutral moments give us space to gather our strength - you're doing well!",
    "You're maintaining balance today - that's something to appreciate.",
    "Sometimes 'okay' is a peaceful harbor in life's journey - rest here a while.",
    "There's value in these steady moments - they're part of your story too.",
    "You're holding steady today - that shows inner strength.",
    "Being okay means you're navigating life's middle path - well done!",
    "Neutral days give us space to simply be - that's a gift.",
    "You're maintaining equilibrium - that's a skill worth recognizing.",
    "Sometimes 'okay' is exactly where growth happens - embrace this moment.",
    "There's wisdom in accepting these steady days - you're doing fine.",
    "You're navigating today with calm stability - that's commendable.",
    "Being okay is part of life's natural ebb and flow - honor where you are.",
    "Neutral moments build resilience for whatever comes next.",
    "You're holding steady today - that shows inner fortitude.",
    "Sometimes 'okay' is the quiet strength we need - well done!",
    "There's value in these balanced moments - they're important too.",
    "You're maintaining steadiness today - that's worth acknowledging.",
    "Being okay means you're present with whatever is - that's mindfulness in action.",
    "Neutral days give us space to recalibrate - you're doing well!",
    "You're navigating today with quiet strength - that's admirable.",
    "Sometimes 'okay' is the foundation we build upon - honor this moment.",
    "There's wisdom in accepting where you are today - you're doing fine.",
    "You're holding steady - that shows resilience and adaptability.",
    "Being okay is part of the full spectrum of human experience - embrace it.",
    "Neutral moments teach us valuable lessons too - you're exactly where you need to be.",
    "You're maintaining balance today - that's a meaningful achievement.",
    "Sometimes 'okay' is the quiet harbor before new adventures - rest here a while.",
    "There's value in these steady days - they're part of your journey too.",
    "You're navigating today with calm presence - that's worth celebrating.",
    "Being okay means you're honoring your current state - well done!"
  ],
  "Bad": [
    "It's okay to have tough days - they don't define you.",
    "You're stronger than you feel right now - this will pass.",
    "Difficult moments are temporary visitors - you won't feel this way forever.",
    "Your feelings are valid, and it's okay to acknowledge them.",
    "Even on hard days, you're still moving forward - that takes courage.",
    "Remember to be gentle with yourself today - you deserve compassion.",
    "This feeling is just passing through - it doesn't define your whole day.",
    "You've navigated difficult feelings before, and you'll do it again.",
    "It's okay to not be okay sometimes - that's part of being human.",
    "Your resilience is still there, even when you don't feel it.",
    "Tough days are part of life's journey - you're not alone in this.",
    "This moment is just one scene in your much larger story.",
    "Your strength often shows most during challenging times like these.",
    "It's okay to pause and honor how you're feeling right now.",
    "Remember that emotions come and go like weather - this will shift.",
    "Even on difficult days, small moments of peace are possible.",
    "You've weathered storms before - you have that strength within you.",
    "This feeling doesn't have the final say in your day or your life.",
    "It's okay to take things one moment at a time right now.",
    "Your worth isn't diminished by having a tough day.",
    "Difficult feelings are messengers - listen, but remember they will pass.",
    "You're still you, even on the hard days - and that's enough.",
    "This moment isn't forever - things will shift and change.",
    "It's okay to reach out for support when days feel heavy.",
    "Your resilience is built in these very moments - you're growing stronger.",
    "Remember to breathe through the difficult feelings - they will ease.",
    "You're not defined by your hardest days - you're so much more.",
    "This feeling is just one note in the symphony of your life.",
    "Even small steps forward on tough days are victories worth celebrating.",
    "It's okay to honor your feelings without letting them take over.",
    "Your strength is often quietest but deepest on the difficult days.",
    "This moment will pass - you won't feel this way forever.",
    "You're navigating a tough day with more grace than you realize.",
    "It's okay to adjust your expectations when you're not feeling your best.",
    "Remember that healing isn't linear - tough days are part of the process.",
    "Your resilience is still there, working quietly beneath the surface.",
    "This feeling is temporary - it will shift and change.",
    "You're stronger than any difficult day - this doesn't define you.",
    "It's okay to take extra care of yourself when days feel heavy.",
    "Your worth remains constant, even when your feelings fluctuate.",
    "Difficult moments are just that - moments, not permanence.",
    "You've moved through tough feelings before - you have that wisdom now.",
    "It's okay to acknowledge where you are today without judgment.",
    "Your story continues beyond this challenging chapter.",
    "Remember that even on hard days, you're never truly alone.",
    "This feeling is valid but temporary - it will pass.",
    "You're still on your path, even when the terrain gets rough.",
    "It's okay to honor your difficult feelings without being defined by them.",
    "Your resilience is being strengthened in these very moments.",
    "This tough day is just one day in your much larger journey."
  ],
  "Very Bad": [
    "You're going through a really tough time, and that's okay - you won't feel this way forever.",
    "It's brave to acknowledge when you're struggling - that's the first step toward healing.",
    "Your pain is real and valid - please be gentle with yourself today.",
    "Even in your darkest moments, you're not alone - help is available.",
    "This intense feeling will eventually pass - hold on to that truth.",
    "Your strength is being tested, but it's still there - you will get through this.",
    "It's okay to reach out for support when things feel overwhelming.",
    "These difficult feelings don't define you - they're just passing through.",
    "Remember to breathe - just focus on the next moment, then the next.",
    "You've survived every difficult day so far - that's proof of your resilience.",
    "It's okay to not be okay - honor where you are without judgment.",
    "This pain is real, but it isn't permanent - things will change.",
    "Your worth isn't diminished by your struggles - you matter, always.",
    "Sometimes the bravest thing is simply making it through the day - and that's enough.",
    "These overwhelming feelings will eventually ease - hold on to hope.",
    "It's okay to take things minute by minute when days feel impossible.",
    "Your pain deserves compassion, especially from yourself.",
    "This difficult time is part of your story, but it's not the whole story.",
    "Even when you can't feel it, healing is still possible.",
    "You're carrying a heavy burden right now - it's okay to put it down sometimes.",
    "These intense feelings will eventually shift - nothing lasts forever.",
    "It's okay to ask for help when things feel too heavy to carry alone.",
    "Your struggle doesn't define your worth or your future.",
    "Remember that even small acts of self-care matter on the hardest days.",
    "This pain is speaking to you, but it doesn't have the final word.",
    "You're stronger than you feel right now - this moment isn't forever.",
    "It's okay to acknowledge when you're in a dark place - that's how light eventually finds its way in.",
    "Your feelings are intense right now, but you are more than your feelings.",
    "Even in your darkest hours, tiny moments of peace are possible.",
    "This overwhelming time will eventually pass - hold on to that truth.",
    "It's okay to take life one breath at a time when things feel unbearable.",
    "Your pain matters and deserves to be acknowledged with compassion.",
    "This difficult chapter isn't the end of your story.",
    "Even when you can't see it, hope is still possible.",
    "You're navigating extremely rough waters right now - be gentle with yourself.",
    "These intense feelings will eventually transform - nothing stays the same forever.",
    "It's okay to reach out for professional support when things feel this difficult.",
    "Your struggle is real, but it doesn't define who you are at your core.",
    "Remember that tiny steps forward still count, especially on the hardest days.",
    "This pain feels overwhelming, but it won't always feel this intense.",
    "You're doing the best you can with what you have right now - and that's enough.",
    "It's okay to not have it all together - healing isn't linear.",
    "Your feelings are valid, but they aren't permanent - this will shift.",
    "Even in your darkest moments, you're still worthy of compassion and care.",
    "This overwhelming time is teaching you something, even if you can't see it yet.",
    "It's okay to focus just on surviving right now - that's brave too.",
    "Your pain doesn't diminish your worth or your potential.",
    "Remember that you've survived every difficult day so far - you have that strength.",
    "These intense feelings are part of your human experience, not a failure.",
    "It's okay to honor where you are today while still believing things can get better."
  ]
};

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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 backdrop-blur" onClick={onClose}>
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

// Add this function to display encouragement messages
function EncouragementModal({ mood, onClose }) {
  if (mood === null || mood === undefined) return null;
  
  const moodLabel = moodOptions[mood].label;
  const messages = encouragementMessages[moodLabel];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm" 
         onClick={onClose}
         style={{ 
           zIndex: 99999,
           position: 'fixed',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0
         }}>
      <div className="bg-white rounded-xl shadow-2xl p-8 relative max-w-md w-full mx-4 transform transition-all duration-300 scale-100" 
           onClick={e => e.stopPropagation()}
           style={{ 
             boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.2)',
             zIndex: 100000
           }}>
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors duration-200"
        >
          ×
        </button>
        <div className="text-center">
          <div className="text-5xl mb-6">{moodOptions[mood].emoji}</div>
          <h3 className="text-2xl font-bold mb-4 text-gray-800">{moodLabel} Mood! 🎉</h3>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">{randomMessage}</p>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg"
          >
            Thank You! 💙
          </button>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);

  // Close preview modal when encouragement modal is shown
  useEffect(() => {
    if (showEncouragement && preview) {
      setPreview(null);
    }
  }, [showEncouragement]);

  // Close encouragement modal when preview modal is shown
  useEffect(() => {
    if (preview && showEncouragement) {
      setShowEncouragement(false);
    }
  }, [preview]);

  // Portal root for sidebar/overlay
  const portalRoot = typeof window !== "undefined" ? document.body : null;

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const [counselorsRes, psychiatristsRes] = await Promise.all([
          fetch("http://localhost:5000/api/counselors"),
          fetch("http://localhost:5000/api/psychiatrists"),
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
        
        console.log('Raw combined data:', combined);
        
        // Filter for all registered professionals (for lists)
        const registeredProfessionals = combined.filter(p => 
          p.full_name && 
          p.email && 
          // Check registration number (registration_number for counselors, med_number for psychiatrists)
          (p.registration_number || p.med_number)
        );
        
        // Filter for map-ready professionals (subset with coordinates)
        const mapReadyProfessionals = registeredProfessionals.filter(p => 
          p.location && 
          p.latitude && 
          p.longitude
        );
        
        console.log(`Found ${registeredProfessionals.length} registered professionals, ${mapReadyProfessionals.length} map-ready`);
        console.log('Registered professionals:', registeredProfessionals);
        console.log('Map-ready professionals:', mapReadyProfessionals);
        
        setProfessionals(registeredProfessionals);
        setMapProfessionals(mapReadyProfessionals);
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
          const res = await fetch(`http://localhost:5000/api/appointments?user=${encodeURIComponent(userName)}`);
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
        const res = await fetch("http://localhost:5000/api/materials");
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
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* Hamburger menu for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-[10000] bg-white rounded-full p-2 shadow-lg border border-gray-200"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={28} color="#000" />
      </button>
      {/* Sidebar for desktop/tablet */}
      <div className="hidden md:block">
        <Sidebar activePage="DASHBOARD" />
      </div>
      {/* Sidebar as drawer on mobile, static on desktop */}
      {portalRoot && sidebarOpen && createPortal(
        <>
          {/* Mobile Drawer Overlay - only when sidebarOpen is true */}
          <div
            className="fixed inset-0 z-[9999] bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar Drawer */}
          <aside
            className="fixed top-0 left-0 z-[10000] h-full w-64 bg-white shadow-lg transform transition-transform duration-200 md:static md:translate-x-0 md:block translate-x-0 md:min-h-screen"
          >
            {/* Close button for mobile */}
            <button
              className="md:hidden absolute top-4 right-4 z-[10001] bg-gray-100 rounded-full p-1 border border-gray-300"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} color="#000" />
            </button>
            <Sidebar activePage="DASHBOARD" />
          </aside>
        </>, portalRoot
      )}
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 transition-all duration-200">
        {/* Top Section */}
        <div className="flex flex-col sm:flex-row items-center mb-8 gap-4 sm:gap-0 justify-between">
          <div className="flex items-center gap-4">
            <img src="/admin-mental.png" width={48} height={48} alt="User Avatar" className="rounded-full mr-0 sm:mr-4" />
            <div className="text-center sm:text-left">
              <div className="text-xl md:text-2xl font-semibold text-gray-800">Welcome!</div>
              <div className="text-gray-500 text-sm">User Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationDrawer />
          </div>
        </div>
        {/* Mood Buttons */}
        <div className="flex gap-2 sm:gap-4 mb-8 flex-wrap">
          {moodOptions.map((mood, idx) => (
            <button
              key={`${mood.label}-${idx}`}
              className={`flex flex-col items-center px-4 py-2 sm:px-5 sm:py-3 rounded-xl border-2 shadow-sm transition-all duration-200 font-semibold text-sm focus:outline-none hover:scale-105 ${mood.color} ${selectedMood === idx ? "ring-2 ring-blue-300" : ""}`}
              onClick={() => {
                console.log(`Clicked ${mood.label} (index: ${idx})`);
                setSelectedMood(idx);
                setShowEncouragement(true);
              }}
            >
              <span className="text-2xl mb-1">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left: Hospitals & Clinics */}
          <div className="bg-white rounded-2xl shadow p-4 sm:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-blue-500" size={20} />
              <span className="font-semibold text-gray-800 text-lg">Nearby Hospitals & Clinics ({professionals.length})</span>
              {mapProfessionals.length < professionals.length && (
                <span className="text-xs text-orange-500 ml-2">
                  ({professionals.length - mapProfessionals.length} without map coordinates)
                </span>
              )}
            </div>
            {selectedProfessional && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-blue-800">
                    Viewing: {selectedProfessional.full_name} ({selectedProfessional.role})
                  </span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  📍 {selectedProfessional.location}
                </div>
              </div>
            )}
            <div className="h-48 w-full rounded-lg bg-gray-200 mb-4 overflow-hidden relative" style={{ zIndex: 1 }}>
              <MapComponent professionals={mapProfessionals} selectedProfessional={selectedProfessional} geoapifyApiKey={geoapifyApiKey} />
            </div>
            {professionals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No registered professionals found</p>
                <p className="text-sm">Please check back later or contact support.</p>
              </div>
            ) : (
              <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-4 overflow-x-auto pb-4" style={{gridTemplateRows: 'repeat(2, minmax(0, 1fr))'}}>
                {professionals.map((pro, i) => (
                <div 
                  key={`${pro.id}-${i}`} 
                  className={`p-4 rounded-lg border-2 w-64 cursor-pointer transition-all duration-200 flex-shrink-0 ${
                    selectedProfessional?.id === pro.id 
                      ? 'bg-blue-100 border-blue-400 shadow-lg transform scale-105' 
                      : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    if (pro.latitude && pro.longitude) {
                      setSelectedProfessional(pro);
                      // Show a brief notification that the map has been updated
                      const notification = document.createElement('div');
                      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all';
                      notification.innerHTML = `📍 Map centered on ${pro.full_name}`;
                      document.body.appendChild(notification);
                      setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => document.body.removeChild(notification), 300);
                      }, 2000);
                    } else {
                      // Show notification for professionals without coordinates
                      const notification = document.createElement('div');
                      notification.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all';
                      notification.innerHTML = `ℹ️ Location not available for ${pro.full_name}`;
                      document.body.appendChild(notification);
                      setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => document.body.removeChild(notification), 300);
                      }, 2000);
                    }
                  }}
                >
                  <p className="font-bold text-gray-800">{pro.full_name}</p>
                  <p className="text-sm text-gray-500">{pro.location || 'Location not specified'}</p>
                  <p className={`text-sm font-medium ${pro.role === 'Counselor' ? 'text-blue-500' : 'text-purple-500'}`}>{pro.role}</p>
                  
                  {/* Registration info */}
                  <div className="mt-1 text-xs text-green-600">
                    ✓ Registered {pro.role === 'Counselor' ? `(#${pro.registration_number})` : `(Med #${pro.med_number})`}
                  </div>
                  
                  {selectedProfessional?.id === pro.id && (
                    <div className="mt-2 flex items-center text-xs text-blue-600">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                      Selected on map
                    </div>
                  )}
                  
                  {/* Location status */}
                  {pro.latitude && pro.longitude ? (
                    <div className="mt-1 text-xs text-blue-400">
                      📍 Map location available
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-orange-400">
                      📍 Map location not available
                    </div>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>
          {/* Right: Appointments & Calendar */}
          <div className="bg-white rounded-2xl shadow p-4 sm:p-6 flex flex-col">
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
          <div className="bg-white rounded-2xl shadow p-4 sm:p-6 flex flex-col mb-4">
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
            {!showEncouragement && preview && <PreviewModal material={preview} onClose={() => setPreview(null)} />}
          </div>
          {/* Available Counselors & Psychiatrists */}
          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-blue-500" size={20} />
              <h3 className="font-semibold text-gray-700">Available Counselors & Psychiatrists ({professionals.length})</h3>
            </div>
            {professionals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No registered professionals found</p>
                <p className="text-sm">Please check back later or contact support.</p>
              </div>
            ) : (
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
                  <div key={`${pro.id}-${i}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-4 w-72 flex-shrink-0 hover:bg-blue-50 transition-colors">
                    <img
                      src={pro.profile_image ? `http://localhost:5000/uploads/${pro.profile_image}` : '/default-avatar.png'}
                      alt={pro.full_name}
                      className="w-[60px] h-[60px] rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/admin-mental.png'; // Fallback to existing avatar
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{pro.full_name}</p>
                      <p className={`text-sm font-medium ${pro.role === 'Counselor' ? 'text-blue-500' : 'text-purple-500'}`}>{pro.role}</p>
                      <p className="text-xs text-gray-500 mt-1">{pro.location || 'Location not specified'}</p>
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Registered {pro.role === 'Counselor' ? `#${pro.registration_number}` : `Med #${pro.med_number}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Encouragement Modal - render in a portal to ensure it's at the root level of the DOM */}
      {showEncouragement && selectedMood !== null && selectedMood !== undefined && portalRoot && createPortal(
        <EncouragementModal 
          mood={selectedMood} 
          onClose={() => {
            console.log('Closing encouragement modal');
            setShowEncouragement(false);
            setSelectedMood(null);
          }} 
        />,
        portalRoot
      )}

      {/* Fallback: Render modal directly if portal is not available */}
      {showEncouragement && selectedMood !== null && selectedMood !== undefined && !portalRoot && (
        <EncouragementModal 
          mood={selectedMood} 
          onClose={() => {
            console.log('Closing encouragement modal (fallback)');
            setShowEncouragement(false);
            setSelectedMood(null);
          }} 
        />
      )}
    </div>
  );
} 