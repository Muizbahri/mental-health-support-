"use client";
import { useState } from 'react';
import Sidebar from "../../Sidebar";
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactDOM from "react-dom";
import toast from 'react-hot-toast';

const phq9Questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself or that you're a failure",
  "Trouble concentrating on things",
  "Moving or speaking so slowly...",
  "Thoughts that you would be better off dead"
];

const options = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

export default function PHQ9Assessment() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(phq9Questions.length).fill(null));
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const portalRoot = typeof window !== "undefined" ? document.body : null;

  const handleOptionChange = (value) => {
    const updated = [...answers];
    updated[currentQuestionIndex] = value;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (answers[currentQuestionIndex] === null) {
      toast.error("Please answer the question before proceeding to the next one.");
      return;
    }
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  const handleSubmit = () => {
    if (answers[currentQuestionIndex] === null) {
      toast.error("Please answer the question before submitting.");
      return;
    }
    const answersStr = JSON.stringify(answers);
    router.push(`/user-public/self-assessment/phq9/result?answers=${encodeURIComponent(answersStr)}`);
  };

  const progress = ((currentQuestionIndex + 1) / phq9Questions.length) * 100;

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
        <Sidebar activePage="SELF-ASSESSMENT" />
      </div>
      {/* Sidebar as drawer on mobile */}
      {portalRoot && sidebarOpen && ReactDOM.createPortal(
        <>
          <div
            className="fixed inset-0 z-[9999] bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="fixed top-0 left-0 z-[10000] h-full w-64 bg-white shadow-lg transform transition-transform duration-200 md:static md:translate-x-0 md:block translate-x-0 md:min-h-screen"
          >
            <button
              className="md:hidden absolute top-4 right-4 z-[10001] bg-gray-100 rounded-full p-1 border border-gray-300"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} color="#000" />
            </button>
            <Sidebar activePage="SELF-ASSESSMENT" />
          </aside>
        </>, portalRoot
      )}
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-2xl mx-auto w-full transition-all duration-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">PHQ-9 Self-Assessment</h1>
        <div className="bg-white rounded-xl shadow p-4 sm:p-8 flex flex-col gap-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <Link href="/user-public/self-assessment" className="flex items-center text-gray-600 hover:text-blue-600 text-sm font-medium">
              <ArrowLeft className="mr-1" size={18} /> Back to Assessments
            </Link>
            <span className="text-xs text-gray-500 font-medium">Question {currentQuestionIndex + 1} of {phq9Questions.length}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded mb-6">
            <div className="h-2 bg-blue-600 rounded transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="bg-white rounded-2xl shadow p-8 mb-8">
            <h2 className="text-xl font-bold text-black text-center mb-2">PHQ-9 Depression Assessment</h2>
            <p className="text-center text-gray-600 mb-6">Over the last 2 weeks, how often have you been bothered by the following problem?</p>
            <div className="font-semibold mb-4 text-gray-800">{phq9Questions[currentQuestionIndex]}</div>
            <div className="space-y-3 mb-6">
              {options.map((opt, index) => (
                <label key={index} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="answer"
                    value={index}
                    checked={answers[currentQuestionIndex] === index}
                    onChange={() => handleOptionChange(index)}
                    className="mr-3 accent-blue-600"
                  />
                  <span className="text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-4 justify-between mt-6">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="px-5 py-2 rounded bg-gray-100 text-gray-600 font-medium flex items-center gap-1 disabled:opacity-50"
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft size={18} /> Previous
              </button>
              {currentQuestionIndex < phq9Questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2 rounded bg-blue-600 text-white font-medium flex items-center gap-1 hover:bg-blue-700"
                >
                  Next <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 