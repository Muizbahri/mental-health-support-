"use client";
import { useState } from "react";
import { Phone, AlertTriangle, MessageCircle, MapPin, CheckCircle, Shield } from "lucide-react";
import Sidebar from "../Sidebar";

const contacts = [
  {
    name: "National Suicide Prevention Lifeline",
    number: "988",
    tag: "Crisis",
    tagColor: "bg-blue-100 text-blue-700",
    desc: "24/7 crisis support",
  },
  {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    tag: "Crisis",
    tagColor: "bg-blue-100 text-blue-700",
    desc: "Text-based crisis support",
  },
  {
    name: "Emergency Services",
    number: "911",
    tag: "Medical",
    tagColor: "bg-red-100 text-red-700",
    desc: "Immediate medical emergency",
  },
  {
    name: "Mental Health Crisis Line",
    number: "1-800-273-8255",
    tag: "Mental Health",
    tagColor: "bg-green-100 text-green-700",
    desc: "Professional mental health support",
  },
];

const centers = [
  {
    name: "City Crisis Center",
    address: "123 Main St, Downtown",
    distance: "0.8 miles away",
    status: "Open 24/7",
    statusColor: "bg-green-100 text-green-700",
  },
  {
    name: "Regional Mental Health Facility",
    address: "456 Health Ave, Midtown",
    distance: "1.2 miles away",
    status: "Open until 11 PM",
    statusColor: "bg-green-50 text-green-700",
  },
  {
    name: "Community Support Center",
    address: "789 Care Blvd, Northside",
    distance: "2.1 miles away",
    status: "Open 24/7",
    statusColor: "bg-green-100 text-green-700",
  },
];

export default function EmergencyCasePage() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar activePage="EMERGENCY" />
      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12">
        {/* Header Section */}
        <div className="bg-[#EF4444] rounded-t-2xl shadow text-white px-8 py-6 mb-8 flex items-center gap-4">
          <AlertTriangle size={32} className="text-white" />
          <div>
            <div className="text-2xl font-bold mb-1">Emergency Support</div>
            <div className="text-base">If you're experiencing a mental health crisis, you're not alone. Help is available immediately.</div>
          </div>
        </div>
        {/* Immediate Help */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="font-bold text-lg text-red-700 mb-2 flex items-center gap-2"><AlertTriangle size={20} className="text-red-500" /> Immediate Help</div>
            <div className="w-full flex flex-col gap-2">
              <div className="bg-red-50 rounded-lg p-4 flex flex-col items-center md:items-start">
                <div className="font-semibold text-gray-700 mb-2">If you're in immediate danger:</div>
                <button className="bg-[#EF4444] hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow flex items-center gap-2 text-lg w-full md:w-auto justify-center"><Phone size={20} /> Call 911 Now</button>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="font-bold text-lg text-blue-700 mb-2 flex items-center gap-2"><Shield size={20} className="text-blue-500" /> For crisis support:</div>
            <div className="w-full flex flex-col gap-2">
              <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-center md:items-start">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow flex items-center gap-2 text-lg w-full md:w-auto justify-center"><Phone size={20} /> Call 988</button>
              </div>
            </div>
          </div>
        </section>
        {/* Emergency Contacts */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="font-bold text-lg text-green-700 mb-4 flex items-center gap-2"><Phone size={22} className="text-green-500" /> Emergency Contacts</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contacts.map((c, i) => (
              <div key={c.name + i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${c.tagColor}`}>{c.tag}</span>
                  <span className="font-semibold text-gray-800 text-base">{c.name}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-700 font-bold text-lg">{c.number}</span>
                </div>
                <div className="text-gray-500 text-xs mb-2">{c.desc}</div>
                <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2 w-full md:w-auto justify-center"><Phone size={18} /> Call Now</button>
              </div>
            ))}
          </div>
        </section>
        {/* Crisis Centers Near You */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="font-bold text-lg text-blue-700 mb-4 flex items-center gap-2"><MapPin size={22} className="text-blue-500" /> Crisis Centers Near You</div>
          <div className="flex flex-col gap-4">
            {centers.map((center, i) => (
              <div key={center.name + i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="font-semibold text-gray-800">{center.name}</div>
                  <div className="text-gray-500 text-sm">{center.address}</div>
                  <div className="text-blue-500 text-xs mb-1">{center.distance}</div>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${center.statusColor}`}>{center.status}</span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2"><MapPin size={16} /> Get Directions</button>
                  <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2"><Phone size={16} /> Call</button>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Your Safety Plan */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="font-bold text-lg text-gray-800 mb-4">Your Safety Plan</div>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg p-4 bg-yellow-50 border border-yellow-100">
              <span className="font-semibold text-yellow-700">1. Recognize Warning Signs</span>
              <div className="text-gray-700 text-sm mt-1">Identify your personal triggers and early warning signs of crisis.</div>
            </div>
            <div className="rounded-lg p-4 bg-blue-50 border border-blue-100">
              <span className="font-semibold text-blue-700">2. Use Coping Strategies</span>
              <div className="text-gray-700 text-sm mt-1">Practice breathing exercises, grounding techniques, or contact a trusted friend.</div>
            </div>
            <div className="rounded-lg p-4 bg-green-50 border border-green-100">
              <span className="font-semibold text-green-700">3. Reach Out for Help</span>
              <div className="text-gray-700 text-sm mt-1">Don't hesitate to use the emergency contacts above when you need immediate support.</div>
            </div>
          </div>
        </section>
        {/* 24/7 Chat Support */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="font-bold text-lg text-purple-700 mb-2 flex items-center gap-2"><MessageCircle size={22} className="text-purple-500" /> 24/7 Chat Support</div>
          <div className="text-gray-700 mb-4">Connect with a trained crisis counselor right now through our secure chat platform.</div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow flex items-center gap-2"><MessageCircle size={18} /> Start Crisis Chat</button>
        </section>
      </main>
    </div>
  );
} 