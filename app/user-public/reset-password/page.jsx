import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export default function PublicResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white relative">
        <div className="absolute top-0 left-0 p-8 flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse mr-3"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
        </div>
        <div className="flex flex-col items-center justify-center w-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl px-8 py-10 w-full max-w-md mt-24">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordClient />
    </Suspense>
  );
} 