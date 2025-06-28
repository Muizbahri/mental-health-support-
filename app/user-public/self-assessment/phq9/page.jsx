"use client";
import { useState } from 'react';
import Sidebar from "../../Sidebar";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  const handleOptionChange = (value) => {
    const updated = [...answers];
    updated[currentQuestionIndex] = value;
    setAnswers(updated);
  };

  const handleSubmit = () => {
    const answersStr = JSON.stringify(answers);
    router.push(`/user-public/self-assessment/phq9/result?answers=${encodeURIComponent(answersStr)}`);
  };

  const progress = ((currentQuestionIndex + 1) / phq9Questions.length) * 100;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar activePage="SELF-ASSESSMENT" />
      <main className="flex-1 p-10">
        <div className="max-w-xl mx-auto">
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
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-5 py-2 rounded bg-blue-600 text-white font-medium flex items-center gap-1"
                  disabled={answers[currentQuestionIndex] === null}
                >
                  Next <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded bg-green-600 text-white font-medium"
                  disabled={answers[currentQuestionIndex] === null}
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