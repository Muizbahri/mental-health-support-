"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PsychiatristSidebar from "../Sidebar";
import { MessageCircle } from "lucide-react";

const FEEDBACK_TYPES = [
  "General Feedback",
  "Bug Report",
  "Feature Request",
  "Counselor Feedback",
  "Appointment Experience",
  "Materials & Resources",
  "Technical Issue",
];

const RECENT_FEEDBACK = [
  {
    type: "Feature Request",
    text: "It would be great to have a mobile app for easier access to appointments and materials.",
    status: "Under Review",
    statusColor: "bg-yellow-100 text-yellow-800",
    date: "June 12, 2024",
  },
  {
    type: "General Feedback",
    text: "The meditation videos have been incredibly helpful for my daily routine. Thank you!",
    status: "Acknowledged",
    statusColor: "bg-green-100 text-green-800",
    date: "June 8, 2024",
  },
];

export default function PsychiatristFeedbackPage() {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const maxChars = 1000;

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!feedbackType || !feedbackText.trim()) return;
    setSubmitting(true);
    
    try {
      // Get user info from localStorage (more reliable)
      const psychiatrystUserData = localStorage.getItem("psychiatrystUser");
      let fullName = "";
      
      if (psychiatrystUserData) {
        try {
          const user = JSON.parse(psychiatrystUserData);
          fullName = user?.full_name || "";
        } catch (err) {
          console.error("Error parsing psychiatrist user data:", err);
        }
      }
      
      console.log('Psychiatrist feedback submission:', {
        user_role: "psychiatrist",
        full_name: fullName,
        type_of_feedback: feedbackType,
        feedback: feedbackText.substring(0, 50) + '...'
      });
      
      const feedbackData = {
        user_role: "psychiatrist",
        full_name: fullName,
        type_of_feedback: feedbackType,
        feedback: feedbackText
      };
      
      const res = await fetch("http://localhost:5000/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData)
      });
      
      // Check if API response indicates authentication failure
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        router.push("/psychiatryst/login");
        return;
      }
      
      if (res.ok) {
        setFeedbackType("");
        setFeedbackText("");
        alert("Feedback submitted successfully!");
      } else {
        alert("Failed to submit feedback.");
      }
    } catch (err) {
      console.error('Psychiatrist feedback error:', err);
      alert("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
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
      <PsychiatristSidebar activePage="FEEDBACK" />
      <main className="flex-1 px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback</h1>
        <p className="text-gray-600 mb-6 max-w-2xl">Your feedback helps us improve our mental health services. Please share your thoughts, suggestions, or report any issues.</p>
        {/* Submit Feedback */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="text-teal-500" size={22} />
            <span className="font-semibold text-lg text-gray-800">Submit Feedback</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of Feedback</label>
              <select
                className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-200"
                value={feedbackType}
                onChange={e => setFeedbackType(e.target.value)}
                disabled={submitting}
              >
                <option value="">Select feedback type...</option>
                {FEEDBACK_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Write your feedback...</label>
              <textarea
                className="w-full border rounded px-3 py-2 min-h-[80px] text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-200"
                maxLength={maxChars}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Please provide detailed feedback about your experience. Include any specific issues, suggestions for improvement, or positive experiences you'd like to share."
                disabled={submitting}
              />
              <div className="text-xs text-gray-400 text-right mt-1">{feedbackText.length}/{maxChars} characters</div>
            </div>
            <button
              type="submit"
              className="mt-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition disabled:opacity-60"
              disabled={!feedbackType || !feedbackText.trim() || submitting}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </section>
        {/* Feedback Guidelines */}
        <section className="bg-teal-50 rounded-2xl p-6 mb-6 max-w-2xl border border-teal-100">
          <div className="font-semibold text-teal-800 mb-2 flex items-center gap-2">
            <MessageCircle size={18} className="text-teal-500" /> Feedback Guidelines
          </div>
          <div className="flex flex-col md:flex-row gap-6 text-sm">
            <ul className="flex-1 text-gray-700 list-disc list-inside mb-2">
              <li>Specific details about your experience</li>
              <li>Steps that led to any issues</li>
              <li>Suggestions for improvement</li>
              <li>Positive feedback about what works well</li>
            </ul>
            <div className="flex-1 text-gray-700">
              <div className="font-semibold text-teal-700 mb-1">Response times:</div>
              <ul className="list-disc list-inside">
                <li>General feedback: 3-5 business days</li>
                <li>Bug reports: 1-2 business days</li>
                <li>Urgent issues: Within 24 hours</li>
                <li>Feature requests: 1-2 weeks</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Recent Feedback */}
        <section className="bg-white rounded-2xl shadow p-6 max-w-2xl">
          <div className="font-semibold text-teal-800 mb-4">Your Recent Feedback</div>
          <ul className="space-y-4">
            {RECENT_FEEDBACK.map((fb, idx) => (
              <li key={idx} className="border rounded-xl p-4 bg-teal-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-200 text-teal-800">{fb.type}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ml-2 ${fb.statusColor}`}>{fb.status}</span>
                  <span className="ml-auto text-xs text-gray-400">{fb.date}</span>
                </div>
                <div className="text-gray-800 text-sm">"{fb.text}"</div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
} 