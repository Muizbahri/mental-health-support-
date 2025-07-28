"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function CounselorResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      validateToken(tokenFromUrl);
    }
  }, [searchParams]);

  const validateToken = async (tokenToValidate) => {
    try {
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToValidate }),
      });

      const data = await response.json();
      setTokenValid(data.success);
      
      if (!data.success) {
        setError(data.message || 'Invalid or expired reset token');
      }
    } catch (err) {
      setError('Failed to validate token');
    }
  };

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
          token,
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

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white relative px-2">
        <div className="absolute top-0 left-0 p-4 sm:p-8 flex items-center">
          <Image src="/brain-logo.png" width={40} height={40} alt="Logo" className="mr-3" />
          <span className="font-semibold text-lg sm:text-xl text-gray-700">MENTAL HEALTH CARE</span>
        </div>
        <div className="flex flex-col items-center justify-center w-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl px-4 py-6 sm:px-8 sm:py-10 w-full max-w-md mt-24">
            <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center text-gray-800">Reset Password</h1>
            <div className="text-center text-red-500 mb-4">
              Invalid reset link. Please request a new password reset.
            </div>
            <div className="flex justify-center">
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative px-2">
      <div className="absolute top-0 left-0 p-4 sm:p-8 flex items-center">
        <Image src="/brain-logo.png" width={40} height={40} alt="Logo" className="mr-3" />
        <span className="font-semibold text-lg sm:text-xl text-gray-700">MENTAL HEALTH CARE</span>
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl px-4 py-6 sm:px-8 sm:py-10 w-full max-w-md mt-24">
          <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center text-gray-800">Reset Password</h1>
          
          {!tokenValid ? (
            <div className="text-center text-red-500 mb-4">
              {error || 'Validating reset token...'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Enter reset token from email"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="New password"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
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
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 bg-gray-50"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

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