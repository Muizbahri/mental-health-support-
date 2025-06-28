"use client";
import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";

const feedbackTypes = [
  "General Feedback",
  "Bug Report",
  "Feature Request",
  "Urgent Issue",
];

const recentFeedback = [
  {
    type: "Feature Request",
    message: "It would be great to have a mobile app for easier access to appointments and materials.",
    status: "Under Review",
    statusColor: "bg-yellow-100 text-yellow-800",
    date: "June 12, 2024",
    typeColor: "text-blue-700",
  },
  {
    type: "General Feedback",
    message: "The meditation videos have been incredibly helpful for my daily routine. Thank you!",
    status: "Acknowledged",
    statusColor: "bg-green-100 text-green-700",
    date: "June 8, 2024",
    typeColor: "text-green-700",
  },
];

export default function FeedbackPage() {
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState({ full_name: '', user_role: '' });
  const charLimit = 1000;

  useEffect(() => {
    // Fetch logged-in user profile
    const token = localStorage.getItem("publicToken");
    if (!token) return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id;
    fetch(`http://194.164.148.171:5000/api/users/user-public/profile?id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser({
            full_name: data.user.full_name,
            user_role: 'public', // or data.user.user_role if available
          });
        }
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !message) {
      alert("Please select a feedback type and write a message.");
      return;
    }

    const fullName = localStorage.getItem("full_name");
    if (!fullName) {
      alert("Could not find user information. Please log in again.");
      return;
    }

    try {
      const res = await fetch("http://194.164.148.171:5000/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          user_role: 'public',
          type_of_feedback: type,
          feedback: message,
          feedback_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Feedback submitted successfully!");
        setType("");
        setMessage("");
      } else {
        throw new Error(data.message || "Failed to submit feedback.");
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar activePage="FEEDBACK" />
      {/* Main Content */}
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback</h1>
        <p className="text-gray-600 mb-8 text-lg">Your feedback helps us improve our mental health services. Please share your thoughts, suggestions, or report any issues.</p>
        {/* Submit Feedback */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="text-blue-500" size={22} />
            <span className="font-semibold text-gray-800 text-lg">Submit Feedback</span>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-gray-700 mb-1">Type of Feedback</label>
            <select
              name="feedbackType"
              id="feedbackType"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="">Select feedback type...</option>
              <option value="General Feedback">General Feedback</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Counselor Feedback">Counselor Feedback</option>
              <option value="Appointment Experience">Appointment Experience</option>
              <option value="Materials & Resources">Materials & Resources</option>
              <option value="Technical Issue">Technical Issue</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-gray-700 mb-1">Write your feedback...</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[100px] resize-vertical"
              maxLength={charLimit}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Please provide detailed feedback about your experience. Include any specific issues, suggestions for improvement, or positive experiences you'd like to share."
            />
            <div className="text-xs text-gray-400 mt-1">{message.length}/{charLimit} characters</div>
          </div>
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition flex items-center gap-2">
            <MessageCircle size={18} /> Submit Feedback
          </button>
        </section>
        {/* Feedback Guidelines */}
        <section className="rounded-2xl shadow p-6 mb-8 bg-gradient-to-br from-blue-50 to-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-semibold text-gray-800 mb-2">What to include:</div>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Specific details about your experience</li>
                <li>Steps that led to any issues</li>
                <li>Suggestions for improvement</li>
                <li>Positive feedback about what works well</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-800 mb-2">Response time:</div>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
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
          <div className="font-semibold text-gray-800 text-lg mb-4">Your Recent Feedback</div>
          <div className="flex flex-col gap-4">
            {recentFeedback.map((fb, i) => (
              <div key={fb.type + fb.date + i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className={`font-semibold mb-1 ${fb.typeColor}`}>{fb.type}</div>
                  <div className="text-gray-700 text-sm mb-2">"{fb.message}"</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${fb.statusColor}`}>{fb.status}</span>
                </div>
                <div className="text-gray-400 text-xs mt-2 md:mt-0 md:ml-4 whitespace-nowrap">{fb.date}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
} 