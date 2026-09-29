"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-slate-100 font-sans min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <div className="inline-flex p-3 bg-red-100 text-red-600 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">ANUMATI Platform Fatal Error</h1>
          <p className="text-xs text-slate-600 mb-4">
            A system-level error prevented the layout from rendering.
          </p>
          <pre className="p-3 bg-slate-50 border text-red-700 text-left text-xs rounded mb-6 overflow-x-auto">
            {error.message}
          </pre>
          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" /> Reset Portal State
          </button>
        </div>
      </body>
    </html>
  );
}
