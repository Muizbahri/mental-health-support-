"use client";
import Image from "next/image";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PsychiatristLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isFormValid) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/psychiatrists/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setError("Login failed: Invalid server response. Please contact admin.");
        setLoading(false);
        return;
      }
      if (res.status === 404) {
        setError("Login failed: Psychiatrist login endpoint not found. Please contact admin.");
        setLoading(false);
        return;
      }
      if (data.success) {
        // Store user data consistently in localStorage
        const userData = {
          id: data.user.id,
          full_name: data.user.full_name,
          email: data.user.email,
          token: data.token
        };
        
        console.log("Storing psychiatrist user data:", userData);
        
        // Store with both keys for backward compatibility
        localStorage.setItem("psychiatristUser", JSON.stringify(userData));
        localStorage.setItem("psychiatrystUser", JSON.stringify(userData));
        localStorage.setItem("psychiatrystToken", data.token || "");
        localStorage.setItem("full_name", data.user.full_name?.trim() || "");
        
        router.push("/psychiatryst/dashboard");
      } else {
        setError(data.message || "Invalid email or password.");
      }
    } catch (err) {
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative px-2">
      <div className="absolute top-0 left-0 p-4 sm:p-8 flex items-center">
        <Image src="/brain-logo.png" width={40} height={40} alt="Logo" className="mr-3" />
        <span className="font-semibold text-lg sm:text-xl text-gray-700">MENTAL HEALTH CARE</span>
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="bg-white rounded-3xl shadow-xl px-4 py-6 sm:px-8 sm:py-10 w-full max-w-md mt-24">
          <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center text-gray-800">Psychiatrist Login</h1>
          <div className="mb-6">
            <span className="block text-lg sm:text-xl font-semibold text-gray-700 mb-4">User Login</span>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <a href="#" className="text-sm text-teal-600 hover:underline">Forgot password?</a>
                <button
                  type="button"
                  className="text-sm text-teal-600 hover:text-teal-800 font-medium ml-2"
                  onClick={() => router.push('/psychiatryst/signup')}
                >
                  Sign Up
                </button>
              </div>
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
                disabled={!isFormValid || loading}
              >
                {loading ? "Logging In..." : "Log In"}
              </button>
            </form>
            <div className="flex justify-center mt-6">
              <button
                className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium bg-white bg-opacity-80 px-4 py-2 rounded-lg shadow transition"
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