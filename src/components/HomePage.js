"use client";
import { Toaster } from "react-hot-toast";
import ArticlesSection from "./ArticlesSection";

export default function HomePage() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 lg:py-8">
          {/* Articles Section Only */}
          <ArticlesSection />
        </div>
      </div>
      <Toaster position="top-right" />
    </>
  );
}