import { Suspense } from 'react';
import Sidebar from "../../../Sidebar";
import PHQ9ResultContent from "./PHQ9ResultContent";

export const dynamic = "force-dynamic";

export default function PHQ9ResultPage() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar activePage="SELF-ASSESSMENT" />
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <PHQ9ResultContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
} 