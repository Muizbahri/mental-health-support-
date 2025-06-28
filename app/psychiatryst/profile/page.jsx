"use client";
import { useState, useEffect } from "react";
import PsychiatristSidebar from "../Sidebar";
import { UserCircle, Mail, IdCard, Calendar, Phone, Hash, FileText, MapPin, Lock, Image as ImageIcon, Download, Save, XCircle, Trash2 } from "lucide-react";

export default function PsychiatristProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showCertPreview, setShowCertPreview] = useState(false);

  // Get psychiatrist ID from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("psychiatrystUser"));
    if (user && user.id) {
      fetch(`/api/psychiatrists/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          setForm(data);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isFormChanged = () => {
    if (!profile) return false;
    // Compare all editable fields
    return (
      form.full_name !== profile.full_name ||
      form.email !== profile.email ||
      form.ic_number !== profile.ic_number ||
      form.age !== profile.age ||
      form.phone_number !== profile.phone_number ||
      form.med_number !== profile.med_number ||
      form.location !== profile.location ||
      form.address !== profile.address ||
      form.latitude !== profile.latitude ||
      form.longitude !== profile.longitude ||
      form.password !== profile.password
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormChanged()) {
      setEditMode(false);
      return;
    }
    setSaving(true);
    const user = JSON.parse(localStorage.getItem("psychiatrystUser"));
    await fetch(`/api/psychiatrists/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    // Always re-fetch the latest profile after save
    const res = await fetch(`/api/psychiatrists/${user.id}`);
    const data = await res.json();
    setProfile(data);
    setForm(data);
    setEditMode(false);
    setSaving(false);
    alert('Profile updated successfully!');
  };

  if (loading) return <div className="min-h-screen flex bg-[#f8fafc]"><PsychiatristSidebar activePage="PROFILE" /><main className="flex-1 px-8 py-10">Loading...</main></div>;
  if (!profile) return <div className="min-h-screen flex bg-[#f8fafc]"><PsychiatristSidebar activePage="PROFILE" /><main className="flex-1 px-8 py-10">Profile not found.</main></div>;

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <PsychiatristSidebar activePage="PROFILE" />
      <main className="flex-1 px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600 mb-8">Manage your personal information and account settings.</p>
        <div className="max-w-2xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow p-8 mb-8 flex flex-col items-center">
            <div className="relative mb-2">
              <label className="block text-center font-medium text-gray-700 mb-1">Profile Image</label>
              {profile.profile_image ? (
                <img
                  src={`http://194.164.148.171:5000/uploads/${profile.profile_image}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 bg-gray-100"
                  onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center bg-blue-100 text-blue-700 text-3xl font-bold border-4 border-blue-100">
                  {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'P'}
                </div>
              )}
              <span className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 cursor-pointer border-2 border-white">
                <ImageIcon size={18} />
              </span>
            </div>
            <div className="text-xl font-bold text-gray-900 mb-0.5 mt-2">{profile.full_name}</div>
            <div className="text-gray-500 text-sm mb-6">Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}</div>
            <form className="w-full grid grid-cols-1 gap-5" onSubmit={handleSave}>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Full Name</label>
                <div className="flex items-center gap-2">
                  <UserCircle size={18} className="text-gray-400" />
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="full_name" value={editMode ? form.full_name : profile.full_name || ""} onChange={handleChange} readOnly={!editMode} />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-gray-400" />
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="email" value={editMode ? form.email : profile.email || ""} onChange={handleChange} readOnly={!editMode} />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">IC Number</label>
                <div className="flex items-center gap-2">
                  <IdCard size={18} className="text-gray-400" />
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="ic_number" value={editMode ? form.ic_number : profile.ic_number || ""} onChange={handleChange} readOnly={!editMode} />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Age</label>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-400" />
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="age" value={editMode ? form.age : profile.age || ""} onChange={handleChange} readOnly={!editMode} />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-gray-400" />
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="phone_number" value={editMode ? form.phone_number : profile.phone_number || ""} onChange={handleChange} readOnly={!editMode} />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Medical Registration Number</label>
                <div className="flex items-center gap-2">
                  <Hash size={18} className="text-gray-400" />
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="med_number" value={editMode ? form.med_number : profile.med_number || ""} onChange={handleChange} readOnly={!editMode} />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Certificate</label>
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-gray-400" />
                  {profile.certificate ? (
                    <>
                      <a href={`http://194.164.148.171:5000/uploads/${profile.certificate}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" download>
                        {profile.certificate}
                        <Download size={16} className="inline ml-1" />
                      </a>
                      {profile.certificate.endsWith('.pdf') && (
                        <button
                          type="button"
                          className="ml-2 px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm font-semibold"
                          onClick={() => setShowCertPreview(true)}
                        >
                          Preview
                        </button>
                      )}
                      {showCertPreview && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                          <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full relative flex flex-col items-center">
                            <h2 className="text-lg font-bold mb-2">Certificate Preview</h2>
                            <iframe
                              src={`http://194.164.148.171:5000/uploads/${profile.certificate}`}
                              width="700"
                              height="500"
                              title="Certificate Preview"
                              className="border rounded mb-4"
                            />
                            <button
                              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
                              onClick={() => setShowCertPreview(false)}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">No certificate</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Clinic/Hospital Location</label>
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-gray-400" />
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="location" value={editMode ? form.location : profile.location || ""} onChange={handleChange} readOnly={!editMode} />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Clinic/Hospital Address</label>
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-gray-400" />
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="address" value={editMode ? form.address : profile.address || ""} onChange={handleChange} readOnly={!editMode} />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Latitude / Longitude</label>
                <div className="flex gap-2">
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="latitude" value={editMode ? form.latitude : profile.latitude || ""} onChange={handleChange} readOnly={!editMode} placeholder="Latitude" />
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="longitude" value={editMode ? form.longitude : profile.longitude || ""} onChange={handleChange} readOnly={!editMode} placeholder="Longitude" />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Password</label>
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-gray-400" />
                  <input className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-50" name="password" type="password" value={editMode ? form.password : profile.password || ""} onChange={handleChange} readOnly={!editMode} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-8 w-full justify-center">
                {editMode ? (
                  <>
                    <button
                      type="submit"
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow transition"
                      disabled={!isFormChanged() || saving}
                    >
                      <Save size={20} />
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg shadow transition"
                      onClick={() => { setEditMode(false); setForm(profile); }}
                      disabled={saving}
                    >
                      <XCircle size={20} className="text-pink-500" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg shadow transition"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          const user = JSON.parse(localStorage.getItem("psychiatrystUser"));
                          const res = await fetch(`/api/psychiatrists/${user.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            localStorage.removeItem("psychiatrystUser");
                            localStorage.removeItem("psychiatrystToken");
                            localStorage.removeItem("full_name");
                            window.location.href = '/psychiatryst/login';
                          } else {
                            alert('Failed to delete account.');
                          }
                        }
                      }}
                    >
                      <Trash2 size={20} />
                      Delete Account
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition"
                      onClick={() => setEditMode(true)}
                      disabled={false}
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg shadow transition"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          const user = JSON.parse(localStorage.getItem("psychiatrystUser"));
                          const res = await fetch(`/api/psychiatrists/${user.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            localStorage.removeItem("psychiatrystUser");
                            localStorage.removeItem("psychiatrystToken");
                            localStorage.removeItem("full_name");
                            window.location.href = '/psychiatryst/login';
                          } else {
                            alert('Failed to delete account.');
                          }
                        }
                      }}
                    >
                      <Trash2 size={20} />
                      Delete Account
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
          {/* Account Settings */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="font-bold text-lg text-gray-900 mb-4">Account Settings</div>
            <div className="flex flex-col gap-4">
              <ToggleSetting
                label="Email Notifications"
                desc="Receive appointment reminders and updates"
                checked={emailNotif}
                onChange={setEmailNotif}
              />
              <ToggleSetting
                label="SMS Reminders"
                desc="Get text message reminders for appointments"
                checked={smsNotif}
                onChange={setSmsNotif}
              />
              <ToggleSetting
                label="Privacy Mode"
                desc="Enhanced privacy for sensitive information"
                checked={privacyMode}
                onChange={setPrivacyMode}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToggleSetting({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
      <div>
        <div className="font-medium text-gray-800">{label}</div>
        <div className="text-gray-500 text-sm">{desc}</div>
      </div>
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition relative">
          <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
      </label>
    </div>
  );
} 