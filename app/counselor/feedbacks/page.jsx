"use client";
import { useState } from "react";
import { MessageCircle, Info, CheckCircle, AlertCircle } from "lucide-react";
import CounselorSidebar from "../Sidebar";

const FEEDBACK_TYPES = [
  "General Feedback",
  "Bug Report",
  "Feature Request",
  "Counselor Feedback",
  "Appointment Experience",
  "Materials & Resources",
  "Technical Issue"
];

const FEEDBACK_STATUS = {
  "Under Review": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Acknowledged": "bg-green-100 text-green-800 border-green-300"
};

const initialFeedbacks = [
  {
    id: 1,
    type: "Feature Request",
    message: "It would be great to have a mobile app for easier access to appointments and materials.",
    status: "Under Review",
    date: "June 12, 2024"
  },
  {
    id: 2,
    type: "General Feedback",
    message: "The meditation videos have been incredibly helpful for my daily routine. Thank you!",
    status: "Acknowledged",
    date: "June 8, 2024"
  }
];

export default function CounselorFeedbackPage() {
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [submitting, setSubmitting] = useState(false);

  const charLimit = 1000;
  const chars = message.length;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!type || !message.trim()) return;
    setSubmitting(true);
    // Get user info from localStorage (simulate auth/session)
    const user = JSON.parse(localStorage.getItem("counselorUser"));
    const feedbackData = {
      user_role: "counselor",
      full_name: user?.full_name || "",
      type_of_feedback: type,
      feedback: message,
      feedback_date: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    try {
      const res = await fetch("http://194.164.148.171:5000/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData)
      });
      if (res.ok) {
        alert("Feedback submitted successfully!");
        setType("");
        setMessage("");
      } else {
        alert("Failed to submit feedback.");
      }
    } catch (err) {
      alert("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f7fafc]">
      <CounselorSidebar activePage="FEEDBACK" />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback</h1>
        <p className="text-gray-600 mb-8 max-w-2xl">Your feedback helps us improve our mental health services. Please share your thoughts, suggestions, or report any issues.</p>
        {/* Submit Feedback */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="text-blue-500" size={22} />
            <span className="font-semibold text-lg text-gray-800">Submit Feedback</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700">Type of Feedback</label>
              <select
                className="w-full border rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                value={type}
                onChange={e => setType(e.target.value)}
                required
              >
                <option value="">Select feedback type...</option>
                {FEEDBACK_TYPES.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">Write your feedback...</label>
              <textarea
                className="w-full border rounded-lg px-4 py-2 min-h-[100px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                placeholder="Please provide detailed feedback about your experience. Include any specific issues, suggestions for improvement, or positive experiences you'd like to share."
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, charLimit))}
                maxLength={charLimit}
                required
              />
              <div className="text-xs text-gray-500 text-right mt-1">{chars}/{charLimit} characters</div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition text-base flex items-center gap-2"
              disabled={submitting || !type || !message.trim()}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </section>
        {/* Feedback Guidelines */}
        <section className="rounded-2xl shadow p-6 mb-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
          <div className="font-semibold text-lg text-blue-900 mb-2 flex items-center gap-2"><Info size={20} /> Feedback Guidelines</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold mb-1">What to include:</div>
              <ul className="list-disc ml-5 text-gray-700 space-y-0.5">
                <li>Specific details about your experience</li>
                <li>Steps that led to any issues</li>
                <li>Suggestions for improvement</li>
                <li>Positive feedback about what works well</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-1">Response time:</div>
              <ul className="list-disc ml-5 text-gray-700 space-y-0.5">
                <li>General feedback: 3-5 business days</li>
                <li>Bug reports: 1-2 business days</li>
                <li>Urgent issues: Within 24 hours</li>
                <li>Feature requests: 1-2 weeks</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Recent Feedback */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="font-semibold text-lg text-gray-800 mb-4">Your Recent Feedback</div>
          <div className="space-y-4">
            {feedbacks.map(fb => (
              <div key={fb.id} className="rounded-xl border-l-4 p-4 bg-blue-50/60 border-blue-300 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className={
                    fb.type === "Feature Request" ? "text-blue-700 font-semibold" :
                    fb.type === "General Feedback" ? "text-green-700 font-semibold" :
                    "text-gray-700 font-semibold"
                  }>
                    {fb.type}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">{fb.date}</span>
                </div>
                <div className="text-gray-800 mb-2">"{fb.message}"</div>
                <span className={`inline-block px-3 py-1 text-xs rounded-full border font-semibold ${FEEDBACK_STATUS[fb.status] || "bg-gray-100 text-gray-700 border-gray-300"}`}>{fb.status}</span>
              </div>
            ))}
            {feedbacks.length === 0 && (
              <div className="text-gray-400 text-center py-8">No feedback submitted yet.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
} 