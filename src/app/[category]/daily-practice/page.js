"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import MetaDataJobs from "@/components/Seo";
import { Calendar, BookOpen, ArrowRight, AlertCircle } from "lucide-react";

const normalizeCategory = (param) =>
  (param || "gate-cse").toString().trim().toUpperCase().replace(/_/g, "-");

const categoryLabel = (param) =>
  (param || "gate-cse").toString().trim().replace(/-/g, " ").toUpperCase();

export default function DailyPracticePage() {
  const { category } = useParams();
  const router = useRouter();
  const safeCategory = category || "gate-cse";
  const categoryForApi = normalizeCategory(safeCategory);
  const label = categoryLabel(safeCategory);

  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/daily-practice/sets?category=${encodeURIComponent(
            categoryForApi
          )}`
        );
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to load daily practice sets");
        }
        setSets(data.sets || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load daily practice sets");
      } finally {
        setLoading(false);
      }
    };
    fetchSets();
  }, [categoryForApi]);

  const latestSet = sets[0] || null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <MetaDataJobs
        seoTitle={`${label} – Daily practice`}
        seoDescription={`Daily MCQ practice sets for ${label}.`}
      />
      <Navbar />

      <div className="pt-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-neutral-900 mb-2 sm:mb-3 tracking-tight">
            {label} – Daily practice
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto">
            Short MCQ sets you can solve anytime – no timer, no scoring, just
            practice with explanations.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-neutral-200 rounded w-1/3" />
              <div className="h-4 bg-neutral-100 rounded w-2/3" />
              <div className="h-16 bg-neutral-100 rounded" />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-5">
                <h2 className="text-sm sm:text-base font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Today&apos;s set
                </h2>
                {latestSet ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/${safeCategory}/daily-practice/${latestSet.id}`
                      )
                    }
                    className="w-full text-left mt-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 sm:px-4 sm:py-4 hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base line-clamp-2">
                        {latestSet.title}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] sm:text-xs font-medium text-white">
                        Latest
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 mb-2 line-clamp-2">
                      {latestSet.description || "Daily MCQ practice set."}
                    </p>
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {latestSet.date_for}
                      </span>
                      <span className="inline-flex items-center gap-1 text-neutral-700">
                        Start practice
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                ) : (
                  <p className="text-xs sm:text-sm text-neutral-600">
                    No daily practice sets available yet for this exam.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-5">
                <h2 className="text-sm sm:text-base font-semibold text-neutral-900 mb-2">
                  How this works
                </h2>
                <ul className="space-y-1.5 text-xs sm:text-sm text-neutral-600">
                  <li>• Pick a set and solve MCQs at your own pace.</li>
                  <li>• See immediate correct / incorrect feedback.</li>
                  <li>• Read explanations after each question.</li>
                  <li>• No scoring or tracking – pure practice.</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm sm:text-base font-semibold text-neutral-900">
                  All daily practice sets
                </h2>
                <span className="text-[11px] sm:text-xs text-neutral-500">
                  {sets.length} set{sets.length === 1 ? "" : "s"}
                </span>
              </div>
              {sets.length === 0 ? (
                <p className="text-xs sm:text-sm text-neutral-600">
                  No sets found yet. Check back soon.
                </p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {sets.map((set) => (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() =>
                        router.push(`/${safeCategory}/daily-practice/${set.id}`)
                      }
                      className="w-full text-left py-2.5 sm:py-3 flex items-start justify-between gap-3 hover:bg-neutral-50 rounded-lg px-2 sm:px-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 text-xs sm:text-sm line-clamp-1">
                          {set.title}
                        </p>
                        <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-2">
                          {set.description || "Daily MCQ practice set."}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-neutral-500">
                          <Calendar className="w-3 h-3" />
                          {set.date_for}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-neutral-700">
                          Solve
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

