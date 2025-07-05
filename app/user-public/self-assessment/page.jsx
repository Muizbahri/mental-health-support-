"use client";
import { ClipboardList, Heart, Smile, FileText, Calendar, MessageCircle, User, UserCircle, LogOut, Hospital, Menu, X } from "lucide-react";
import Sidebar from "../Sidebar";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const assessments = [
  {
    date: "June 10, 2024",
    type: "PHQ-9",
    score: 8,
    severity: "Mild",
    severityColor: "bg-yellow-100 text-yellow-700",
  },
  {
    date: "June 10, 2024",
    type: "GAD-7",
    score: 5,
    severity: "Minimal",
    severityColor: "bg-green-100 text-green-700",
  },
];

export default function SelfAssessmentPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem('assessmentHistory')) || [];
    setHistory(stored);
  }, []);

  function handleDelete(indexToDelete) {
    const updatedHistory = history.filter((_, index) => index !== indexToDelete);
    setHistory(updatedHistory);
    sessionStorage.setItem('assessmentHistory', JSON.stringify(updatedHistory));
  }

  function getSeverityColor(severity) {
    if (!severity) return '';
    if (severity.includes('Minimal')) return 'bg-green-100 text-green-700';
    if (severity.includes('Mild')) return 'bg-yellow-100 text-yellow-700';
    if (severity.includes('Moderate') && !severity.includes('severe')) return 'bg-orange-100 text-orange-700';
    if (severity.includes('Moderately')) return 'bg-red-100 text-red-700';
    if (severity.includes('Severe')) return 'bg-red-200 text-red-800';
    return 'bg-gray-100 text-gray-700';
  }

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
          <Sidebar activePage="SELF-ASSESSMENT" />
        </aside>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 transition-all duration-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Self-Assessment</h1>
        <p className="text-gray-600 mb-8 text-lg">Take these standardized assessments to better understand your mental health and get personalized recommendations.</p>
        {/* Assessment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* PHQ-9 */}
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center">
            <div className="bg-blue-100 rounded-full p-3 mb-4">
              <ClipboardList className="text-blue-500" size={32} />
            </div>
            <div className="font-bold text-2xl text-blue-900 mb-2">PHQ-9</div>
            <div className="text-gray-700 text-center mb-4">Patient Health Questionnaire - Depression screening tool that measures the severity of depression symptoms.</div>
            <div className="bg-blue-50 rounded-xl p-4 w-full mb-6">
              <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Duration:</span> 5-10 minutes</div>
              <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Questions:</span> 9 items</div>
              <div className="text-sm text-gray-700"><span className="font-semibold">Purpose:</span> Depression severity assessment</div>
            </div>
            <button
              className="bg-blue-600 text-white rounded-lg px-6 py-3 font-semibold w-full"
              onClick={() => router.push('/user-public/self-assessment/phq9')}
            >
              Start PHQ-9 Assessment
            </button>
          </div>
          {/* GAD-7 */}
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <ClipboardList className="text-green-500" size={32} />
            </div>
            <div className="font-bold text-2xl text-green-900 mb-2">GAD-7</div>
            <div className="text-gray-700 text-center mb-4">Generalized Anxiety Disorder scale - Measures anxiety symptoms and their severity over the past two weeks.</div>
            <div className="bg-green-50 rounded-xl p-4 w-full mb-6">
              <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Duration:</span> 5-10 minutes</div>
              <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Questions:</span> 7 items</div>
              <div className="text-sm text-gray-700"><span className="font-semibold">Purpose:</span> Anxiety severity assessment</div>
            </div>
            <button
              className="bg-green-500 text-white rounded-lg px-6 py-3 font-semibold w-full"
              onClick={() => router.push('/user-public/self-assessment/gad7')}
            >
              Start GAD-7 Assessment
            </button>
          </div>
        </div>
        {/* Middle Section: Appointment & Clinic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Make an Appointment */}
          <div className="bg-purple-50 rounded-2xl shadow p-6 flex flex-col items-start">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-purple-500" size={22} />
              <span className="font-semibold text-purple-800 text-lg">Make an Appointment</span>
            </div>
            <div className="text-gray-700 mb-4">Based on your assessment results, schedule a session with one of our qualified mental health professionals.</div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition" onClick={() => router.push('/user-public/appointments')}>
              Schedule Appointment
            </button>
          </div>
          {/* Find Clinic or Hospital */}
          <div className="bg-blue-50 rounded-2xl shadow p-6 flex flex-col items-start">
            <div className="flex items-center gap-2 mb-2">
              <Hospital className="text-blue-500" size={22} />
              <span className="font-semibold text-blue-800 text-lg">Find Clinic or Hospital</span>
            </div>
            <div className="text-gray-700 mb-4">Locate nearby mental health clinics, hospitals, and treatment centers in your area.</div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition"
              onClick={() => router.push('/user-public/self-assessment/find-location')}
            >
              Find Locations
            </button>
          </div>
        </div>
        {/* Previous Assessment Results Table */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="font-semibold text-gray-800 text-lg mb-4">Previous Assessment Results</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-gray-500 text-sm border-b">
                  <th className="py-2 px-4 font-semibold">Date</th>
                  <th className="py-2 px-4 font-semibold">Assessment</th>
                  <th className="py-2 px-4 font-semibold">Score</th>
                  <th className="py-2 px-4 font-semibold">Severity</th>
                  <th className="py-2 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-4">No previous results yet.</td></tr>
                ) : (
                  history.map((a, i) => (
                    <tr key={a.assessment + a.date + i} className="border-b last:border-0">
                      <td className="py-2 px-4 text-gray-800 whitespace-nowrap">{a.date}</td>
                      <td className="py-2 px-4 text-gray-700 whitespace-nowrap">{a.assessment}</td>
                      <td className="py-2 px-4 text-gray-700 whitespace-nowrap">{a.score}</td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(a.severity)}`}>{a.severity}</span>
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <a href="#" className="text-blue-600 hover:underline font-medium">View Details</a>
                          <button onClick={() => handleDelete(i)} className="text-red-600 hover:underline font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
} 