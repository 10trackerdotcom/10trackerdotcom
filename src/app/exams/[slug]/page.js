"use client";

import React from "react";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { examMeta } from "@/data/examMeta";
import { ArrowRight, BookOpen, FileText, Info, ShieldCheck } from "lucide-react";

export default function ExamPage() {
  const router = useRouter();
  const { slug } = useParams();
  const rawSlug = Array.isArray(slug) ? slug[0] : slug;
  const normalizedSlug = decodeURIComponent(rawSlug || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  const exam =
    examMeta[normalizedSlug] ||
    Object.values(examMeta).find((item) => item?.slug?.toLowerCase() === normalizedSlug);

  useEffect(() => {
    if (!exam && normalizedSlug) {
      router.replace(`/${normalizedSlug}`);
    }
  }, [exam, normalizedSlug, router]);

  if (!exam) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-neutral-50 pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
              <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-2">
                Redirecting to practice page
              </h1>
              <p className="text-sm text-neutral-600 mb-4">
                Guide is not available for this exam yet. Opening category practice page.
              </p>
              <Link
                href={normalizedSlug ? `/${normalizedSlug}` : "/exams"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 text-sm font-medium hover:bg-neutral-50"
              >
                <ArrowRight className="w-4 h-4" />
                Open practice page
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-neutral-50 pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <section className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex flex-col gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1">
                  Exam overview
                </p>
                <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {exam.name}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed">
                  {exam.heroTagline}
                </p>

                {/* Practice action bar */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {exam.practiceLinks?.topicWisePyqs && (
                    <Link
                      href={exam.practiceLinks.topicWisePyqs}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                      <BookOpen className="w-4 h-4" />
                      PYQs (Topic-wise)
                    </Link>
                  )}
                  {exam.practiceLinks?.dpp && (
                    <Link
                      href={exam.practiceLinks.dpp}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-medium hover:bg-neutral-50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-neutral-700" />
                      DPP
                    </Link>
                  )}
                  {exam.practiceLinks?.topicWiseTests && (
                    <Link
                      href={exam.practiceLinks.topicWiseTests}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-medium hover:bg-neutral-50 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 text-neutral-700" />
                      Topic tests
                    </Link>
                  )}
                  {exam.practiceLinks?.mockTests && (
                    <Link
                      href={exam.practiceLinks.mockTests}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-medium hover:bg-neutral-50 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 text-neutral-700" />
                      Mock tests
                    </Link>
                  )}
                </div>

                {exam.overview && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-[13px] text-neutral-700">
                    <div>
                      <p className="text-neutral-500">Level</p>
                      <p className="font-semibold text-neutral-900">
                        {exam.overview.level}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Mode</p>
                      <p className="font-semibold text-neutral-900">
                        {exam.overview.mode}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Frequency</p>
                      <p className="font-semibold text-neutral-900">
                        {exam.overview.frequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Conducting body</p>
                      <p className="font-semibold text-neutral-900">
                        {exam.overview.conductingBody}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Grid: left info + right quick actions */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: about + highlights + pattern + breakdown + sessions + dates + updates + eligibility + syllabus + process + centers + tips + score usage + FAQs */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <Info className="w-4 h-4 text-neutral-700" />
                  </div>
                  <h2 className="text-base font-semibold text-neutral-900">
                    About the exam
                  </h2>
                </div>
                <p className="mt-1 text-sm text-neutral-600 whitespace-pre-line">
                  {exam.about}
                </p>
              </div>

              {/* Highlights */}
              {exam.highlights && exam.highlights.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-neutral-900 mb-2">
                    Highlights
                  </h2>
                  <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                    {exam.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pattern */}
              {exam.pattern && exam.pattern.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-neutral-700" />
                    </div>
                    <h2 className="text-base font-semibold text-neutral-900">
                      Exam pattern (quick glance)
                    </h2>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {exam.pattern.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <dt className="text-neutral-500">{row.label}</dt>
                        <dd className="text-neutral-900 font-medium text-right">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Pattern breakdown table */}
              {exam.patternBreakdown && exam.patternBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-neutral-900 mb-3">
                    Section-wise distribution
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-neutral-500">
                          <th className="py-2 pr-4 font-medium">Section</th>
                          <th className="py-2 pr-4 font-medium">Marks</th>
                          <th className="py-2 font-medium">Questions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {exam.patternBreakdown.map((r) => (
                          <tr key={r.section} className="text-neutral-700">
                            <td className="py-2 pr-4 font-medium text-neutral-900">
                              {r.section}
                            </td>
                            <td className="py-2 pr-4 tabular-nums">{r.marks}</td>
                            <td className="py-2 tabular-nums">{r.questions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Exam sessions */}
              {exam.sessions && exam.sessions.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-neutral-900 mb-2">
                    Exam sessions
                  </h2>
                  <ul className="space-y-2 text-sm">
                    {exam.sessions.map((s) => (
                      <li
                        key={s.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-neutral-600">{s.label}</span>
                        <span className="text-neutral-900 font-medium">{s.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Important dates */}
              {exam.importantDates && exam.importantDates.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-neutral-700" />
                    </div>
                    <h2 className="text-base font-semibold text-neutral-900">
                      Important dates (tentative)
                    </h2>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {exam.importantDates.map((d) => (
                      <li
                        key={d.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-neutral-600">{d.label}</span>
                        <span className="text-neutral-900 font-medium text-right">
                          {d.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Latest updates (dummy, future RSS) */}
              {exam.updates && exam.updates.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-neutral-900">
                      Latest updates (sample)
                    </h2>
                    <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Static · RSS later
                    </span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {exam.updates.map((u) => (
                      <li key={u.id} className="border-b last:border-b-0 border-neutral-100 pb-3 last:pb-0">
                        <div className="flex items-center justify-between gap-3 mb-0.5">
                          <span className="text-xs font-medium text-neutral-500">
                            {u.type}
                          </span>
                          <span className="text-xs text-neutral-400">{u.date}</span>
                        </div>
                        <p className="text-sm font-medium text-neutral-900">
                          {u.title}
                        </p>
                        {u.summary && (
                          <p className="mt-1 text-xs text-neutral-600">
                            {u.summary}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Eligibility */}
              {exam.eligibility && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-neutral-900 mb-2">
                    Eligibility (summary)
                  </h2>
                  <ul className="space-y-1.5 text-sm text-neutral-600">
                    <li>
                      <span className="font-medium text-neutral-800">Nationality: </span>
                      {exam.eligibility.nationality}
                    </li>
                    <li>
                      <span className="font-medium text-neutral-800">Age limit: </span>
                      {exam.eligibility.ageLimit}
                    </li>
                    <li>
                      <span className="font-medium text-neutral-800">Attempts: </span>
                      {exam.eligibility.attempts}
                    </li>
                  </ul>
                  {exam.eligibility.education && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-neutral-800 mb-1">
                        Educational qualification
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                        {exam.eligibility.education.map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Syllabus summary */}
              {exam.syllabusSummary && exam.syllabusSummary.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-neutral-900 mb-2">
                    Syllabus (high-level)
                  </h2>
                  <p className="text-xs text-neutral-500 mb-2">
                    Detailed topic-wise syllabus will be linked from the official brochure
                    and our PYQ/practice pages.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                    {exam.syllabusSummary.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Application process */}
              {exam.application?.steps && exam.application.steps.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-neutral-900 mb-2">
                    Application process
                  </h2>
                  <p className="text-sm text-neutral-600 mb-3">
                    Apply online via{" "}
                    <a
                      href={exam.application.portalUrl || "#"}
                      className="underline underline-offset-4 hover:text-neutral-900"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {exam.application.portalName || "official portal"}
                    </a>
                    .
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-neutral-600">
                    {exam.application.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Exam centers */}
              {exam.centers && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-neutral-900 mb-2">
                    Exam centers
                  </h2>
                  {exam.centers.summary && (
                    <p className="text-sm text-neutral-600 mb-2">
                      {exam.centers.summary}
                    </p>
                  )}
                  {exam.centers.notes && exam.centers.notes.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                      {exam.centers.notes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Preparation tips */}
              {exam.preparationTips && exam.preparationTips.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-neutral-900 mb-2">
                    Preparation tips
                  </h2>
                  <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                    {exam.preparationTips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Score usage */}
              {exam.scoreUsage && exam.scoreUsage.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-neutral-900 mb-2">
                    Score usage
                  </h2>
                  <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                    {exam.scoreUsage.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQs */}
              {exam.faqs && exam.faqs.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-neutral-700" />
                    </div>
                    <h2 className="text-base font-semibold text-neutral-900">
                      Frequently asked questions
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {exam.faqs.map((f, idx) => (
                      <div key={idx}>
                        <p className="text-sm font-medium text-neutral-900">{f.q}</p>
                        <p className="mt-1 text-sm text-neutral-600">{f.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: practice + updates + jobs */}
            <div className="space-y-4">
              {/* Practice */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-neutral-900 mb-3">
                  Practice for {exam.shortName}
                </h2>
                <div className="space-y-2 text-sm">
                  {exam.practiceLinks?.topicWisePyqs && (
                    <Link
                      href={exam.practiceLinks.topicWisePyqs}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
                    >
                      <span>PYQs – topic wise</span>
                      <span className="text-xs text-neutral-500">Open</span>
                    </Link>
                  )}
                  {exam.practiceLinks?.dpp && (
                    <Link
                      href={exam.practiceLinks.dpp}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
                    >
                      <span>DPP (daily practice)</span>
                      <span className="text-xs text-neutral-500">Practice</span>
                    </Link>
                  )}
                  {exam.practiceLinks?.topicWiseTests && (
                    <Link
                      href={exam.practiceLinks.topicWiseTests}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
                    >
                      <span>Topic-wise tests</span>
                      <span className="text-xs text-neutral-500">Attempt</span>
                    </Link>
                  )}
                  {exam.practiceLinks?.mockTests && (
                    <Link
                      href={exam.practiceLinks.mockTests}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
                    >
                      <span>Full-length mock tests</span>
                      <span className="text-xs text-neutral-500">Attempt</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Updates */}
              {exam.newsLinks && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-neutral-900 mb-3">
                    Updates & notices
                  </h2>
                  <div className="space-y-2 text-sm">
                    {exam.newsLinks.examUpdates && (
                      <Link
                        href={exam.newsLinks.examUpdates}
                        className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
                      >
                        <span>News & exam updates</span>
                        <span className="text-xs text-neutral-500">View</span>
                      </Link>
                    )}
                    {exam.newsLinks.importantNotices && (
                      <Link
                        href={exam.newsLinks.importantNotices}
                        className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
                      >
                        <span>Official notices</span>
                        <span className="text-xs text-neutral-500">View</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Jobs */}
              {exam.jobsLinks && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-neutral-900 mb-3">
                    Jobs after {exam.shortName}
                  </h2>
                  <div className="space-y-2 text-sm">
                    {exam.jobsLinks.psuJobs && (
                      <Link
                        href={exam.jobsLinks.psuJobs}
                        className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
                      >
                        <span>PSU / Govt jobs</span>
                        <span className="text-xs text-neutral-500">Browse</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

