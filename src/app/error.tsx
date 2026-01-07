"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-slate-900"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Something went wrong</h1>
          <p className="text-slate-400 text-lg">
            We&apos;re experiencing some technical difficulties. Please try again.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold rounded-lg hover:from-amber-300 hover:to-orange-400 transition-all duration-200 shadow-lg shadow-amber-500/20"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-slate-700/50 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all duration-200 border border-slate-600"
          >
            Go Home
          </a>
        </div>

        {/* Status Link */}
        <p className="text-slate-500 text-sm">
          Check our{" "}
          <a
            href="https://status.lynxprompt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            status page
          </a>{" "}
          for updates.
        </p>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="text-slate-600 text-xs font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}













