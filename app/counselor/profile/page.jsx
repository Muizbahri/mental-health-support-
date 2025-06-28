"use client";
import { useState, useEffect, useRef } from "react";
import { User, Mail, IdCard, Calendar, Phone, Hash, FileText, MapPin, Image as ImageIcon, Lock } from "lucide-react";
import CounselorSidebar from "../Sidebar";
import { useRouter } from "next/navigation";

export default function CounselorProfilePage() {
  const router = useRouter();
  const [counselor, setCounselor] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [originalForm, setOriginalForm] = useState({});
  const [profilePreview, setProfilePreview] = useState(null);
  const [certificateName, setCertificateName] = useState("");
  const [settings, setSettings] = useState({ email: true, sms: false, privacy: true });
  const fileInputRef = useRef();

  useEffect(() => {
    // Simulate auth/session: get counselor ID from localStorage
    const user = JSON.parse(localStorage.getItem("counselorUser"));
    if (!user) {
      router.push("/counselor/login");
      return;
    }
    fetch(`http://194.164.148.171:5000/api/counselors/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setCounselor(data);
        setForm({ ...data, password: data.password || "" });
        setOriginalForm({ ...data, password: data.password || "" });
        setProfilePreview(data.profile_image ? `http://194.164.148.171:5000/uploads/${data.profile_image}` : null);
        setCertificateName(data.certificate);
      });
  }, [router]);

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "profile_image" && files && files[0]) {
      setProfilePreview(URL.createObjectURL(files[0]));
      setForm(f => ({ ...f, profile_image: files[0] }));
    } else if (name === "certificate" && files && files[0]) {
      setCertificateName(files[0].name);
      setForm(f => ({ ...f, certificate: files[0] }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  }

  function handleSettingToggle(key) {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  }

  function isFormChanged() {
    return Object.keys(form).some(key => form[key] !== originalForm[key]);
  }

  async function handleEditProfile(e) {
    e.preventDefault();
    if (!isFormChanged()) {
      alert("No changes detected.");
      return;
    }
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      // Only send password if changed and not empty
      if (k === "password") {
        if (!v || v === originalForm.password) {
          // Do not send any password field
          return;
        }
      }
      if (v !== undefined && v !== null) formData.append(k, v);
    });
    // If password is not in formData, add the original password!
    if (!form.password || form.password === "" || form.password === originalForm.password) {
      formData.append("password", originalForm.password);
    }
    const user = JSON.parse(localStorage.getItem("counselorUser"));
    const res = await fetch(`http://194.164.148.171:5000/api/update-counselor/${user.id}`, {
      method: "PUT",
      body: formData
    });
    if (res.ok) {
      alert("Profile updated successfully.");
      setEditMode(false);
      window.location.reload();
    } else {
      alert("Failed to update profile.");
    }
  }

  function handleCancelEdit() {
    setForm({ ...originalForm });
    setProfilePreview(originalForm.profile_image ? `http://194.164.148.171:5000/uploads/${originalForm.profile_image}` : null);
    setCertificateName(originalForm.certificate);
    setEditMode(false);
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    const user = JSON.parse(localStorage.getItem("counselorUser"));
    const res = await fetch(`http://194.164.148.171:5000/api/delete-counselor/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      localStorage.removeItem("counselorUser");
      localStorage.removeItem("counselorToken");
      localStorage.removeItem("full_name");
      router.push("/counselor/login");
    } else {
      alert("Failed to delete account.");
    }
  }

  if (!counselor) return <div className="min-h-screen flex bg-[#f7fafc]"><CounselorSidebar activePage="PROFILE" /><main className="flex-1 flex items-center justify-center text-gray-400">Loading...</main></div>;

  return (
    <div className="min-h-screen flex bg-[#f7fafc]">
      <CounselorSidebar activePage="PROFILE" />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600 mb-8 max-w-2xl">Manage your personal information and account settings.</p>
        <form
          className="max-w-xl mx-auto bg-white rounded-2xl shadow p-8 mb-8"
          onSubmit={editMode ? handleEditProfile : (e) => e.preventDefault()}
          autoComplete="off"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img
                src={profilePreview || "/brain-logo.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow"
              />
              <label htmlFor="profile_image" className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer border-4 border-white shadow-lg">
                <ImageIcon className="text-white" size={18} />
                <input
                  id="profile_image"
                  name="profile_image"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleChange}
                />
              </label>
            </div>
            <div className="text-xl font-bold mt-3 text-gray-900">{counselor.full_name}</div>
            <div className="text-sm text-gray-500">Member since {new Date(counselor.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
          <div className="space-y-4">
            <Field icon={<User size={18} />} label="Full Name" name="full_name" value={form.full_name || ""} onChange={handleChange} readOnly={!editMode} />
            <Field icon={<Mail size={18} />} label="Email Address" name="email" value={form.email || ""} onChange={handleChange} readOnly={!editMode} />
            <Field icon={<IdCard size={18} />} label="IC Number" name="ic_number" value={form.ic_number || ""} onChange={handleChange} readOnly />
            <Field icon={<Calendar size={18} />} label="Age" name="age" value={form.age || ""} onChange={handleChange} readOnly />
            <Field icon={<Phone size={18} />} label="Phone Number" name="phone_number" value={form.phone_number || ""} onChange={handleChange} readOnly={!editMode} />
            <Field icon={<Hash size={18} />} label="Registration Number" name="registration_number" value={form.registration_number || ""} onChange={handleChange} readOnly={!editMode} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FileText size={18} /> Certificate</label>
              {counselor.certificate && (
                <a href={`http://194.164.148.171:5000/uploads/${counselor.certificate}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">{certificateName || counselor.certificate}</a>
              )}
              {editMode && (
                <input type="file" name="certificate" accept=".pdf,.jpg,.jpeg,.png" className="mt-2" onChange={handleChange} />
              )}
            </div>
            <Field icon={<MapPin size={18} />} label="Location (Hospital/Clinic Name)" name="location" value={form.location || ""} onChange={handleChange} readOnly={!editMode} />
            <Field icon={<MapPin size={18} />} label="Address" name="address" value={form.address || ""} onChange={handleChange} readOnly={!editMode} />
            <div className="flex gap-4">
              <Field icon={<MapPin size={18} />} label="Latitude" name="latitude" value={form.latitude || ""} onChange={handleChange} readOnly />
              <Field icon={<MapPin size={18} />} label="Longitude" name="longitude" value={form.longitude || ""} onChange={handleChange} readOnly />
            </div>
            <Field icon={<Lock size={18} />} label="Password" name="password" value={form.password || ""} onChange={handleChange} readOnly={!editMode} placeholder="Enter new password" type="password" />
          </div>
          <div className="flex gap-4 mt-8">
            {!editMode ? (
              <>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                  onClick={() => setEditMode(true)}
                >
                  ✏️ Edit Profile
                </button>
                <button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                  onClick={handleDeleteAccount}
                >
                  🗑️ Delete Account
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={!isFormChanged()}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
        {/* Account Settings */}
        <section className="max-w-xl mx-auto bg-white rounded-2xl shadow p-8">
          <div className="text-black font-bold text-lg mb-4">Account Settings</div>
          <div className="space-y-4">
            <SettingToggle label="Email Notifications" desc="Receive appointment reminders and updates" checked={settings.email} onChange={() => handleSettingToggle("email")} />
            <SettingToggle label="SMS Reminders" desc="Get text message reminders for appointments" checked={settings.sms} onChange={() => handleSettingToggle("sms")} />
            <SettingToggle label="Privacy Mode" desc="Enhanced privacy for sensitive information" checked={settings.privacy} onChange={() => handleSettingToggle("privacy")} />
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ icon, label, name, value, onChange, readOnly, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">{icon} {label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 ${readOnly ? "opacity-80" : ""}`}
      />
    </div>
  );
}

function SettingToggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
      <div>
        <div className="font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <label className="inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-5"></div>
      </label>
    </div>
  );
} 