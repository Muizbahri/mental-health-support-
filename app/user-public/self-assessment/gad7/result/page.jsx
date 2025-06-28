"use client";
import React from 'react';
import Sidebar from "../../../Sidebar";
import Link from "next/link";
import { CheckCircle, Calendar, MapPin } from "lucide-react";
import { useSearchParams } from 'next/navigation';

export default function GAD7ResultPage() {
  const searchParams = useSearchParams();
  const answersParam = searchParams.get('answers');
  const answers = answersParam ? JSON.parse(answersParam) : [];
  const totalScore = answers.reduce((sum, val) => sum + val, 0);

  function getGadSeverity(score) {
    if (score <= 4) return 'Minimal anxiety';
    if (score <= 9) return 'Mild anxiety';
    if (score <= 14) return 'Moderate anxiety';
    return 'Severe anxiety';
  }
  const severity = getGadSeverity(totalScore);
  const recommendations = [
    "Consider relaxation techniques and self-care",
    "If symptoms persist, consult a mental health professional",
    "Seek support from friends, family, or support groups"
  ];

  // Save result to sessionStorage, preventing duplicates for the same day
  React.useEffect(() => {
    if (answers.length === 7 && !isNaN(totalScore)) {
      const history = JSON.parse(sessionStorage.getItem('assessmentHistory')) || [];
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const newEntry = {
        date: today,
        assessment: 'GAD-7',
        score: totalScore,
        severity: severity
      };
      // Filter out any previous entry for the same assessment on the same day
      const updatedHistory = history.filter(
        (entry) => !(entry.assessment === 'GAD-7' && entry.date === today)
      );
      updatedHistory.push(newEntry);
      sessionStorage.setItem('assessmentHistory', JSON.stringify(updatedHistory));
    }
  }, [answers, totalScore, severity]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar activePage="SELF-ASSESSMENT" />
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full mx-auto">
          <div className="flex flex-col items-center">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h2 className="text-black font-bold text-2xl text-center mb-1">Assessment Complete</h2>
            <div className="text-gray-500 text-lg mb-6">GAD-7 Results</div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-8 py-4 mb-6 flex flex-col items-center">
              <div className="text-3xl font-extrabold text-red-600 mb-1">Score: {totalScore}</div>
              <div className="text-base text-red-700 font-medium">{severity}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-5 mb-6 w-full">
              <div className="font-bold text-gray-800 mb-2">Recommendations</div>
              <ul className="list-disc list-inside space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-blue-700 font-medium">{rec}</li>
                ))}
              </ul>
            </div>
            <div className="flex gap-4 w-full mb-6">
              <Link href="/user-public/appointments" className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg shadow transition">
                <Calendar size={20} /> Schedule Appointment
              </Link>
              <Link href="/user-public/self-assessment/find-location" className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold py-2 rounded-lg shadow transition">
                <MapPin size={20} /> Find Nearby Clinics & Hospitals
              </Link>
            </div>
            <Link href="/user-public/self-assessment" className="block text-center text-gray-700 font-medium hover:underline mt-2">
              Take Another Assessment
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 