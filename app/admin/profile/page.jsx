"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Mail, Phone, Hash, Calendar, Save, X, Edit3, Trash2, Eye, EyeOff } from "lucide-react";
import AdminSidebar from '../Sidebar';
import NotificationDrawer from '../../../components/NotificationDrawer';

export default function AdminProfile() {
  const router = useRouter();
  const [adminData, setAdminData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchAdminProfile();
  }, [router]);

  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminData(data.admin);
        setFormData({
          fullName: data.admin.full_name,
          icNumber: data.admin.ic_number,
          age: data.admin.age,
          email: data.admin.email,
          phone: data.admin.phone_number,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        console.error('Failed to fetch admin profile');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.icNumber?.trim()) {
      newErrors.icNumber = 'IC number is required';
    }
    
    if (!formData.age || formData.age < 18 || formData.age > 100) {
      newErrors.age = 'Age must be between 18 and 100';
    }
    
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Password validation (only if new password is provided)
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const updateData = {
        fullName: formData.fullName,
        icNumber: formData.icNumber,
        age: parseInt(formData.age),
        email: formData.email,
        phone: formData.phone
      };

      // Only include password fields if new password is provided
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchAdminProfile();
        setIsEditing(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        alert('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      fullName: adminData.full_name,
      icNumber: adminData.ic_number,
      age: adminData.age,
      email: adminData.email,
      phone: adminData.phone_number,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setDeleting(true);
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/profile', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          alert('Your account has been deleted successfully.');
          // Clear token and redirect to login
          localStorage.removeItem('adminToken');
          router.push('/admin/login');
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to delete account');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Error deleting account. Please try again.');
      } finally {
        setDeleting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-pink-50 flex flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-10 flex items-center justify-center">
          <div className="text-xl text-black">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-pink-50 flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-black">Admin Profile</h1>
            <p className="text-black mt-1">Manage your account settings and information</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationDrawer />
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="text-blue-600" size={32} />
              </div>
                             <div>
                 <h2 className="text-xl font-semibold text-black">Profile Information</h2>
                 <p className="text-black">Update your account details</p>
               </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Full Name */}
             <div>
               <label className="block text-sm font-medium text-black mb-2">Full Name</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ''}
                    onChange={handleInputChange}
                                         className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                       errors.fullName ? 'border-red-500' : 'border-gray-300'
                     }`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>
              ) : (
                                 <p className="bg-gray-50 px-3 py-2 rounded-lg text-black">{adminData?.full_name}</p>
              )}
            </div>

                         {/* Email */}
             <div>
               <label className="block text-sm font-medium text-black mb-2">Email</label>
              {isEditing ? (
                <div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                                         className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                       errors.email ? 'border-red-500' : 'border-gray-300'
                     }`}
                    placeholder="Enter email"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              ) : (
                                 <p className="bg-gray-50 px-3 py-2 rounded-lg text-black">{adminData?.email}</p>
              )}
            </div>

                         {/* IC Number */}
             <div>
               <label className="block text-sm font-medium text-black mb-2">IC Number</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="icNumber"
                    value={formData.icNumber || ''}
                    onChange={handleInputChange}
                                         className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                       errors.icNumber ? 'border-red-500' : 'border-gray-300'
                     }`}
                    placeholder="Enter IC number"
                  />
                  {errors.icNumber && <p className="text-red-500 text-sm mt-1">{errors.icNumber}</p>}
                </div>
              ) : (
                                 <p className="bg-gray-50 px-3 py-2 rounded-lg text-black">{adminData?.ic_number}</p>
              )}
            </div>

                         {/* Age */}
             <div>
               <label className="block text-sm font-medium text-black mb-2">Age</label>
              {isEditing ? (
                <div>
                  <input
                    type="number"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleInputChange}
                                         className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                       errors.age ? 'border-red-500' : 'border-gray-300'
                     }`}
                    placeholder="Enter age"
                    min="18"
                    max="100"
                  />
                  {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                </div>
              ) : (
                                 <p className="bg-gray-50 px-3 py-2 rounded-lg text-black">{adminData?.age}</p>
              )}
            </div>

                         {/* Phone Number */}
             <div>
               <label className="block text-sm font-medium text-black mb-2">Phone Number</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                                         className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                       errors.phone ? 'border-red-500' : 'border-gray-300'
                     }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              ) : (
                                 <p className="bg-gray-50 px-3 py-2 rounded-lg text-black">{adminData?.phone_number}</p>
              )}
            </div>

                         {/* Secret Code - Read Only */}
             <div>
               <label className="block text-sm font-medium text-black mb-2">Secret Code</label>
               <p className="bg-gray-50 px-3 py-2 rounded-lg text-black">{adminData?.secret_code}</p>
             </div>
          </div>

          {/* Password Change Section - Only show when editing */}
          {isEditing && (
            <div className="mt-8 pt-6 border-t border-gray-200">
                             <h3 className="text-lg font-semibold text-black mb-4">Change Password (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 {/* Current Password */}
                 <div>
                   <label className="block text-sm font-medium text-black mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="currentPassword"
                      value={formData.currentPassword || ''}
                      onChange={handleInputChange}
                                             className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-black ${
                         errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                       }`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>}
                </div>

                                 {/* New Password */}
                 <div>
                   <label className="block text-sm font-medium text-black mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword || ''}
                      onChange={handleInputChange}
                                             className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-black ${
                         errors.newPassword ? 'border-red-500' : 'border-gray-300'
                       }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
                </div>

                                 {/* Confirm Password */}
                 <div>
                   <label className="block text-sm font-medium text-black mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword || ''}
                    onChange={handleInputChange}
                                         className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                       errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                     }`}
                    placeholder="Confirm new password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
              <div className="flex gap-3 flex-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                <Trash2 size={16} />
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 