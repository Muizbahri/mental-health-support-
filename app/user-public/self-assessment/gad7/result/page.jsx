import { Suspense } from "react";
import Sidebar from "../../../Sidebar";
import ResultContent from "./ResultContent";

export const dynamic = "force-dynamic";

export default function GAD7ResultPage() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar activePage="SELF-ASSESSMENT" />
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <ResultContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
} 