"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function CounselorSetNewPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-fill token from URL parameters
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setNewPassword('');
        setConfirmPassword('');
        // Redirect to login after successful reset
        setTimeout(() => {
          router.push('/counselor/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative">
      <div className="absolute top-0 left-0 p-8 flex items-center">
        <Image src="/brain-logo.png" width={40} height={40} alt="Logo" className="mr-3" />
        <span className="font-semibold text-xl text-gray-700">MENTAL HEALTH CARE</span>
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="bg-white rounded-3xl shadow-xl px-8 py-10 w-full max-w-md mt-24">
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Set New Password</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Enter reset token from email"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="New password"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">
                {message}
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 text-lg"
              disabled={loading}
              style={{ backgroundColor: '#2563EB' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="flex justify-center mt-6">
            <button
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium bg-white bg-opacity-80 px-4 py-2 rounded-lg shadow transition"
              onClick={() => router.push('/counselor/login')}
              type="button"
            >
              <ArrowLeft size={20} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 