"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import MetaDataJobs from "@/components/Seo";
import { Calendar, BookOpen, ArrowRight, AlertCircle, Layers } from "lucide-react";

/* ─── helpers ────────────────────────────────────────────────── */
const normalizeCategory = (param) =>
  (param || "gate-cse").toString().trim().toUpperCase().replace(/_/g, "-");

const categoryLabel = (param) =>
  (param || "gate-cse").toString().trim().replace(/-/g, " ").toUpperCase();

/* ─── sub-components ─────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="h-4 w-1/3 rounded bg-neutral-200" />
      <div className="h-3 w-2/3 rounded bg-neutral-100" />
      <div className="h-14 rounded-xl bg-neutral-100" />
    </div>
  );
}

function HowItWorks() {
  const steps = [
    "Pick any set and solve MCQs at your own pace.",
    "Get instant correct / incorrect feedback per question.",
    "Read detailed explanations after each answer.",
    "No timers, no scoring — pure focused practice.",
  ];
  return (
    <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
        <Layers className="h-4 w-4 text-neutral-400" />
        How it works
      </h2>
      <ul className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs text-neutral-600">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SetRow({ set, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-neutral-900 sm:text-sm">
            {set.title}
          </p>
          {set.description && (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-neutral-500 sm:text-xs">
              {set.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 sm:text-xs">
            <Calendar className="h-3 w-3" />
            {set.date_for}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-700 opacity-0 transition-opacity group-hover:opacity-100 sm:text-xs">
            Solve
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─── page ───────────────────────────────────────────────────── */

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
    let cancelled = false;

    const fetchSets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/daily-practice/sets?category=${encodeURIComponent(categoryForApi)}`
        );
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to load daily practice sets");
        }
        if (!cancelled) setSets(data.sets || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load daily practice sets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSets();
    return () => { cancelled = true; };
  }, [categoryForApi]);

  const latestSet = sets[0] ?? null;
  const navigate = (id) => router.push(`/${safeCategory}/daily-practice/${id}`);

  return (
    <div className="min-h-screen bg-neutral-50">
      <MetaDataJobs
        seoTitle={`${label} – Daily Practice`}
        seoDescription={`Daily MCQ practice sets for ${label}.`}
      />
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <header className="mb-8 sm:mb-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Daily Practice
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {label}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 sm:text-base">
            Short MCQ sets — no timer, no scoring, just practice with explanations.
          </p>
        </header>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2"><SkeletonCard /></div>
            <SkeletonCard />
            <div className="md:col-span-3"><SkeletonCard /></div>
          </div>
        ) : (
          <>
            {/* ── Top row: Today's set + How it works ── */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 sm:mb-8">

              {/* Today's set */}
              <div className="md:col-span-2 rounded-2xl border border-neutral-200 bg-white p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <BookOpen className="h-4 w-4 text-neutral-400" />
                  Today&apos;s set
                </h2>

                {latestSet ? (
                  <button
                    type="button"
                    onClick={() => navigate(latestSet.id)}
                    className="group w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm font-semibold text-neutral-900 sm:text-base">
                        {latestSet.title}
                      </p>
                      <span className="shrink-0 rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
                        Latest
                      </span>
                    </div>
                    {latestSet.description && (
                      <p className="mb-3 line-clamp-2 text-xs text-neutral-500 sm:text-sm">
                        {latestSet.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {latestSet.date_for}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-neutral-700">
                        Start practice
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </button>
                ) : (
                  <p className="text-sm text-neutral-500">
                    No practice sets available yet. Check back soon.
                  </p>
                )}
              </div>

              {/* How it works */}
              <HowItWorks />
            </div>

            {/* ── All sets ── */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900 sm:text-base">
                  All practice sets
                </h2>
                <span className="text-xs text-neutral-400">
                  {sets.length} {sets.length === 1 ? "set" : "sets"}
                </span>
              </div>

              {sets.length === 0 ? (
                <p className="text-sm text-neutral-500">No sets found yet.</p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {sets.map((set) => (
                    <SetRow key={set.id} set={set} onClick={() => navigate(set.id)} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}