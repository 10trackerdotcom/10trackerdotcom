"use client";

import { Suspense } from "react";

// Minimal layout for auth pages - no heavy components
export default function SignUpLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin"></div>
      </div>
    }>
      {children}
    </Suspense>
  );
}

