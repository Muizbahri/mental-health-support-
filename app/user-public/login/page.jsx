"use client";
import Image from "next/image";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PublicLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      console.log("Attempting login with email:", email);
      
      // Use the correct API endpoint that matches the backend route
      const res = await fetch("/api/public-users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      console.log("Login response status:", res.status);
      const contentType = res.headers.get("content-type");
      console.log("Response content type:", contentType);
      
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
        } else {
          throw new Error("Server error: Not a valid JSON response. Please check if the backend is running and the login route exists.");
        }
      }
      
      const data = await res.json();
      console.log("Login API response:", data);
      
      if (data.success) {
        localStorage.setItem("publicUser", JSON.stringify(data.user));
        localStorage.setItem("publicToken", data.token);
        localStorage.setItem("user_public_id", data.user.id.toString());
        localStorage.setItem("full_name", data.user.full_name?.trim() || "");
        localStorage.setItem("email", data.user.email?.trim() || "");
        router.push("/user-public/dashboard");
      } else {
        setError(data.message || "Invalid email or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed: " + err.message);
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
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Public Login</h1>
          <div className="mb-6">
            <span className="block text-xl font-semibold text-gray-700 mb-4">User Login</span>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Email Address"
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
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-2"
                  onClick={() => router.push('/user-public/signup')}
                >
                  Sign Up
                </button>
              </div>
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Logging In..." : "Log In"}
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