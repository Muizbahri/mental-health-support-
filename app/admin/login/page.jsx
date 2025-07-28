"use client";
import Image from "next/image";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
<<<<<<< HEAD
    // Hardcoded admin credentials
    const validEmail = "admin";
    const validPassword = "admin123";
=======
    // Hardcoded admin credentials - fixed and cannot be changed
    const validEmail = "systemmanager112@gmail.com";
    const validPassword = "Z!9r@V7x#Lp2$uBn";
>>>>>>> 923c6e4110cfd6dbd6e37a2ae66c7b98f9749ac9
    
    if (email === validEmail && password === validPassword) {
      // Create a simple admin token that the backend will recognize
      const adminToken = btoa(JSON.stringify({
        user: "admin",
        role: "admin", 
        id: 1,
        timestamp: Date.now(),
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours expiry
      }));
      
      localStorage.setItem("adminToken", adminToken);
      router.push("/admin/dashboard");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-pink-50 relative px-2">
      <div className="absolute top-0 left-0 p-4 sm:p-8 flex items-center">
        <Image src="/brain-logo.png" width={40} height={40} alt="Logo" className="mr-3" />
        <span className="font-semibold text-lg sm:text-xl text-gray-700">MENTAL HEALTH CARE</span>
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="bg-white rounded-3xl shadow-xl px-4 py-6 sm:px-8 sm:py-10 w-full max-w-md mt-24">
          <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center text-gray-800">Admin Login</h1>
          <div className="mb-6">
            <span className="block text-lg sm:text-xl font-semibold text-gray-700 mb-4">User Login</span>
            <form className="space-y-4" onSubmit={handleSubmit}>
<<<<<<< HEAD
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Username: admin"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="Password: admin123"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
=======
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="email"
                    type="email"
                    placeholder="Email"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="password"
                    type="password"
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
>>>>>>> 923c6e4110cfd6dbd6e37a2ae66c7b98f9749ac9
              </div>
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Log In
              </button>
            </form>
            <div className="flex justify-center mt-6">
              <button
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium bg-white bg-opacity-80 px-4 py-2 rounded-lg shadow transition"
                onClick={() => router.push('/')}
                type="button"
              >
                <ArrowLeft size={20} />
                Back to Select Role
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 