"use client";
import Image from "next/image";
import { User, Mail, IdCard, Calendar, Phone, Lock, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PublicSignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    icNumber: "",
    age: "",
    phone: "",
    password: "",
    profileImage: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function calculateAgeFromIC(ic) {
    // Extract YYMMDD from IC Number
    const match = ic.match(/^(\d{2})(\d{2})(\d{2})/);
    if (!match) return "";
    let [_, yy, mm, dd] = match;
    // Convert to numbers
    yy = parseInt(yy, 10);
    mm = parseInt(mm, 10);
    dd = parseInt(dd, 10);
    // Determine century (assume 2000+ if year is less than current year-2000, else 1900+)
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const century = yy > currentYear ? 1900 : 2000;
    const birthYear = century + yy;
    const birthDate = new Date(birthYear, mm - 1, dd);
    if (isNaN(birthDate.getTime())) return "";
    // Calculate age
    let age = now.getFullYear() - birthYear;
    const m = now.getMonth() - (mm - 1);
    if (m < 0 || (m === 0 && now.getDate() < dd)) {
      age--;
    }
    return age >= 0 && age < 150 ? String(age) : "";
  }

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "profileImage") {
      setForm(f => ({ ...f, profileImage: files[0] }));
    } else if (name === "icNumber") {
      // Remove any non-numeric characters
      let ic = value.replace(/\D/g, '');
      
      // Limit to 12 digits maximum
      if (ic.length > 12) {
        ic = ic.slice(0, 12);
      }
      
      const age = calculateAgeFromIC(ic);
      setForm(f => ({ ...f, icNumber: ic, age }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
    // Validate IC Number first
    if (!form.icNumber || form.icNumber.length !== 12 || !/^\d{12}$/.test(form.icNumber)) {
      setError('IC Number must be exactly 12 digits with no dashes or non-numeric characters.');
      return;
    }
    
    setLoading(true);
    
    const formData = new FormData();
    formData.append("full_name", form.fullName);
    formData.append("email", form.email);
    formData.append("ic_number", form.icNumber);
    formData.append("phone_number", form.phone);
    formData.append("password", form.password);
    if (form.profileImage) formData.append("profile_image", form.profileImage);
    
    console.log("Submitting signup form data:", {
      full_name: form.fullName,
      email: form.email,
      ic_number: form.icNumber,
      phone_number: form.phone,
      has_profile_image: !!form.profileImage
    });
    
    try {
      // Try the new endpoint first
      let res = await fetch("/api/public-users", {
        method: "POST",
        body: formData,
      });
      
      // If the new endpoint fails, try the old one
      if (!res.ok && res.status === 404) {
        console.log("New endpoint failed with 404, trying old endpoint");
        res = await fetch("/api/add-public", {
          method: "POST",
          body: formData,
        });
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Signup error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.message || `Error: ${res.status} ${res.statusText}`);
        } catch (jsonError) {
          setError(`Error: ${res.status} ${res.statusText}`);
        }
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log("Signup response:", data);
      
      if (data.success || data.message === 'User created successfully') {
        router.push("/user-public/login");
      } else {
        setError(data.message || "Sign up failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Sign up failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-pink-50 relative">
      <div className="absolute top-0 left-0 p-8 flex items-center">
        <Image src="/brain-logo.png" width={40} height={40} alt="Logo" className="mr-3" />
        <span className="font-semibold text-xl text-gray-700">MENTAL HEALTH CARE</span>
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="bg-white rounded-3xl shadow-xl px-8 py-10 w-full max-w-md mt-24">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Public Sign Up</h1>
          <form className="space-y-4" onSubmit={handleSubmit} encType="multipart/form-data">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">IC Number</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="icNumber"
                  placeholder="12 digits only (e.g. 991231071234)"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${form.icNumber && form.icNumber.length !== 12 ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200'} focus:outline-none focus:ring-2 text-gray-700 bg-gray-50`}
                  value={form.icNumber}
                  onChange={handleChange}
                  maxLength={12}
                  pattern="[0-9]{12}"
                  title="Must be exactly 12 digits"
                  required
                />
              </div>
              {form.icNumber && form.icNumber.length !== 12 && (
                <p className="text-red-500 text-sm mt-1">IC Number must be exactly 12 digits ({form.icNumber.length}/12)</p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Age</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                  value={form.age}
                  readOnly
                  tabIndex={-1}
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Profile Image</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
          <div className="flex justify-center mt-6">
            <button
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium bg-white bg-opacity-80 px-4 py-2 rounded-lg shadow transition"
              onClick={() => router.push('/user-public/login')}
              type="button"
            >
              <ArrowLeft size={20} />
              Back to Public Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 