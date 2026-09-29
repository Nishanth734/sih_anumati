"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Route Error Catch:", error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="inline-flex p-3 bg-red-100 text-red-600 rounded-full mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Application Error Occurred</h2>
        <p className="text-xs text-slate-600 mb-4">
          An error occurred while loading this page. Our central logging system has recorded the exception.
        </p>
        <div className="p-3 bg-slate-100 rounded text-left font-mono text-[11px] text-slate-800 mb-6 overflow-x-auto">
          {error.message || "Unknown Application Exception"}
        </div>
        <button
          onClick={() => reset()}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gov-navy text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  );
}
