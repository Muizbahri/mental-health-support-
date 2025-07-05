"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Camera, IdCard, Phone, Calendar, Menu, X } from "lucide-react";
import Sidebar from "../Sidebar";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [originalUser, setOriginalUser] = useState(null);
  const fileInputRef = useRef();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("publicToken");
    console.log("Token from localStorage:", token ? "Found" : "Not found");
    
    if (!token) {
      console.log("No token found, redirecting to login");
      router.push("/user-public/login");
      return;
    }
    
    console.log("Fetching user profile...");
    setLoading(true);
    setError("");
    
    // Try to get user data from localStorage first as a fallback
    const storedUser = localStorage.getItem("publicUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Found user data in localStorage:", parsedUser);
        setUser(parsedUser);
        setOriginalUser(parsedUser);
      } catch (e) {
        console.error("Error parsing user data from localStorage:", e);
      }
    }
    
    // Fetch the latest user data from the server
    fetch(`${BASE_URL}/api/public-users/profile/me`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        console.log("Profile API response status:", res.status);
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.message || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        console.log("Profile API response data:", data);
        
        if (data.success && data.data) {
          setUser(data.data);
          setOriginalUser(data.data);
          // Update localStorage with fresh data
          localStorage.setItem("publicUser", JSON.stringify(data.data));
        } else {
          throw new Error(data.message || "Failed to load user profile.");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to load user profile.");
        setLoading(false);
      });
  }, [router]);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profile_image', file);
      
      // Get the token from localStorage
      const token = localStorage.getItem("publicToken");
      console.log("Uploading profile image...");
      
      // Send the image to the server
      fetch(`${BASE_URL}/api/public-users/upload-profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      .then(res => {
        console.log("Upload response status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("Upload response:", data);
        if (data.success) {
          // Update the user state with the new profile image
          setUser(prevUser => ({
            ...prevUser,
            profile_image: data.filename
          }));
          
          // Update localStorage
          const storedUser = JSON.parse(localStorage.getItem("publicUser") || "{}");
          storedUser.profile_image = data.filename;
          localStorage.setItem("publicUser", JSON.stringify(storedUser));
        } else {
          setError(data.message || "Failed to upload profile image");
        }
      })
      .catch(err => {
        console.error("Error uploading image:", err);
        setError("Failed to upload profile image");
      });
    }
  }

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete your account?");
    if (!confirmed) return;
    
    const token = localStorage.getItem("publicToken");
    if (!token) {
      setError("Authentication required");
      return;
    }
    
    try {
      const res = await fetch(`${BASE_URL}/api/public-users/account/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        // Clear local storage
        localStorage.removeItem("publicToken");
        localStorage.removeItem("publicUser");
        localStorage.removeItem("full_name");
        
        alert("Account deleted successfully.");
        router.push("/");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete account.");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Failed to delete account. Please try again.");
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("publicToken");
    if (!token) {
      setError("Authentication required");
      return;
    }
    
    try {
      // Create the payload with required fields
      const payload = {
        full_name: user.full_name,
        email: user.email,
        ic_number: user.ic_number,
        age: user.age,
        phone_number: user.phone_number
      };
      
      // Password validation
      if (newPassword && newPassword.trim() !== '') {
        // Verify passwords match
        if (newPassword !== confirmPassword) {
          alert("New password and confirmation do not match");
          return;
        }
        
        // Verify current password is provided
        if (!currentPassword || currentPassword.trim() === '') {
          alert("Please enter your current password to change your password");
          return;
        }
        
        // Include the new password and current password in the payload
        payload.password = newPassword;
        payload.currentPassword = currentPassword;
        
        console.log("Password change requested");
      }
      
      console.log("Updating profile with payload:", { ...payload, password: payload.password ? '******' : undefined, currentPassword: payload.currentPassword ? '******' : undefined });
      
      const res = await fetch(`${BASE_URL}/api/public-users/profile/me`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("Update response:", data);
        
        // Update localStorage but don't include password
        const userToStore = { ...user };
        delete userToStore.password;
        localStorage.setItem("publicUser", JSON.stringify(userToStore));
        
        // Reset password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        alert("Profile updated successfully");
        setIsEditing(false);
      } else {
        const data = await res.json();
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setUser(originalUser);
    setIsEditing(false);
  };

  // Handler to auto-update age from IC number
  const handleICChange = (e) => {
    const ic = e.target.value;
    let age = user.age;
    if (/^\d{6}/.test(ic)) {
      const icYear = parseInt(ic.slice(0, 2), 10);
      const icMonth = parseInt(ic.slice(2, 4), 10) - 1;
      const icDay = parseInt(ic.slice(4, 6), 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const fullYear = icYear > 50 ? 1900 + icYear : 2000 + icYear;
      const birthDate = new Date(fullYear, icMonth, icDay);
      age = now.getFullYear() - birthDate.getFullYear();
      const m = now.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    setUser((prev) => ({ ...prev, ic_number: ic, age }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!user) return null;

  const formattedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : '';

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
          <Sidebar activePage="PROFILE" />
        </aside>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 transition-all duration-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600 mb-8 text-lg">Manage your personal information and account settings.</p>
        {/* User Info & Change Password */}
        <section className="bg-white rounded-2xl shadow p-8 mb-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-28 h-28 mb-2">
              {user?.profile_image ? (
                <img
                  src={`${BASE_URL}/uploads/${user.profile_image}`}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover border"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border border-gray-300 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              <button
                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow flex items-center justify-center"
                onClick={() => fileInputRef.current.click()}
                type="button"
                aria-label="Change profile picture"
              >
                <Camera size={18} />
              </button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleAvatarChange}
              />
            </div>
            <h2 className="text-xl font-bold text-black text-center">
              {user?.full_name || "N/A"}
            </h2>
            <p className="text-sm text-gray-600 text-center">
              Member since {formattedDate}
            </p>
          </div>
          <form className="w-full">
            <div className="mb-4">
              <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
                  value={user.full_name || ""}
                  onChange={e => setUser({ ...user, full_name: e.target.value })}
                  placeholder="Full Name"
                  readOnly={!isEditing}
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
                  value={user.email || ""}
                  onChange={e => setUser({ ...user, email: e.target.value })}
                  placeholder="Email Address"
                  readOnly={!isEditing}
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block font-semibold text-gray-700 mb-1">IC Number</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
                  value={user.ic_number || ""}
                  onChange={handleICChange}
                  placeholder="IC Number"
                  readOnly={!isEditing}
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block font-semibold text-gray-700 mb-1">Age</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black bg-gray-100`}
                  value={user.age || ""}
                  readOnly
                  placeholder="Age"
                />
              </div>
            </div>
            <hr className="my-6" />
            {/* Password Section - improved */}
            {isEditing && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-bold text-gray-800 mb-3">Change Password</h3>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      style={{ color: '#000' }}
                      placeholder="Enter current password"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      style={{ color: '#000' }}
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      style={{ color: '#000' }}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
                  value={user.phone_number || ""}
                  onChange={e => setUser({ ...user, phone_number: e.target.value })}
                  placeholder="Phone Number"
                  readOnly={!isEditing}
                />
              </div>
            </div>
            {/* Buttons */}
            {isEditing ? (
              <div className="flex gap-4 justify-end mt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  💾 Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
                >
                  ❌ Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  🗑️ Delete Account
                </button>
              </div>
            ) : (
              <div className="flex gap-4 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  ✏️ Edit Profile
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  🗑️ Delete Account
                </button>
              </div>
            )}
          </form>
        </section>
        {/* Account Settings */}
        <section className="bg-white rounded-2xl shadow p-8 max-w-2xl mx-auto">
          <div className="font-bold text-lg text-gray-800 mb-6">Account Settings</div>
          <div className="flex flex-col gap-4">
            <ToggleSetting
              label="Email Notifications"
              description="Receive appointment reminders and updates"
              checked={emailNotif}
              onChange={() => setEmailNotif(v => !v)}
            />
            <ToggleSetting
              label="SMS Reminders"
              description="Get text message reminders for appointments"
              checked={smsNotif}
              onChange={() => setSmsNotif(v => !v)}
            />
            <ToggleSetting
              label="Privacy Mode"
              description="Enhanced privacy for sensitive information"
              checked={privacyMode}
              onChange={() => setPrivacyMode(v => !v)}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-6 py-4">
      <div>
        <div className="font-semibold text-gray-800 mb-1">{label}</div>
        <div className="text-gray-500 text-sm">{description}</div>
      </div>
      <label className="inline-flex items-center cursor-pointer ml-4">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition relative">
          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
      </label>
    </div>
  );
} 