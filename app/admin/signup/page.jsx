"use client";
import { useState } from "react";
import { User, IdCard, Calendar, Mail, Key, Phone, Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    icNumber: "",
    age: "",
    email: "",
    secretCode: "",
    phone: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  // Live age calculation from IC Number (Malaysian NRIC: YYMMDD...)
  function handleICChange(e) {
    const ic = e.target.value;
    let age = "";
    if (/^\d{6}/.test(ic)) {
      const now = new Date();
      let year = parseInt(ic.slice(0, 2), 10);
      const month = parseInt(ic.slice(2, 4), 10) - 1;
      const day = parseInt(ic.slice(4, 6), 10);
      // Assume 00-29 is 2000s, 30-99 is 1900s
      year += year < 30 ? 2000 : 1900;
      const birthDate = new Date(year, month, day);
      if (!isNaN(birthDate)) {
        const ageDifMs = now - birthDate;
        const ageDate = new Date(ageDifMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }
    }
    setForm(f => ({ ...f, icNumber: ic, age: age ? String(age) : "" }));
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!form.fullName) errs.fullName = "Full Name is required";
    if (!form.icNumber) errs.icNumber = "IC Number is required";
    if (!form.age) errs.age = "Age is required";
    if (!form.email) errs.email = "Email is required";
    if (!form.secretCode) errs.secretCode = "Secret Code is required";
    if (!form.phone) errs.phone = "Phone Number is required";
    if (!form.password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    try {
      const res = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        router.push('/admin/dashboard');
      } else {
        setError(data.message || "Sign up failed");
      }
    } catch (err) {
      setError("Sign up failed: " + err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-pink-50 relative">
      <div className="absolute top-0 left-0 p-8 flex items-center">
        <img src="/brain-logo.png" width={40} height={40} alt="Logo" className="mr-3" />
        <span className="font-semibold text-xl text-gray-700">MENTAL HEALTH CARE</span>
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="bg-white rounded-3xl shadow-xl px-8 py-10 w-full max-w-md mt-24">
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Admin Sign Up</h1>
          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="fullName"
                  type="text"
                  placeholder="Full Name"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.fullName ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50`}
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">IC Number</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="icNumber"
                  type="text"
                  placeholder="IC Number"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.icNumber ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50`}
                  value={form.icNumber}
                  onChange={handleICChange}
                  required
                />
              </div>
              {errors.icNumber && <p className="text-red-500 text-xs mt-1">{errors.icNumber}</p>}
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Age</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="age"
                  type="text"
                  placeholder="Age"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.age ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50`}
                  value={form.age}
                  readOnly
                  disabled
                  required
                />
              </div>
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.email ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50`}
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Secret Code</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="secretCode"
                  type="password"
                  placeholder="Secret Code"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.secretCode ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50`}
                  value={form.secretCode}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.secretCode && <p className="text-red-500 text-xs mt-1">{errors.secretCode}</p>}
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="phone"
                  type="text"
                  placeholder="Phone Number"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.phone ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50`}
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.password ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50`}
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition mt-2"
            >
              Sign Up
            </button>
          </form>
          {/* Back to Admin Login button */}
          <div className="flex justify-center mt-6">
            <button
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium bg-white bg-opacity-80 px-4 py-2 rounded-lg shadow transition"
              onClick={() => router.push('/admin/login')}
              type="button"
            >
              <ArrowLeft size={20} />
              Back to Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 