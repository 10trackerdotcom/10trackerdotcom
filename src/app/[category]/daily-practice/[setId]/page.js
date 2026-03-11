"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import MetaDataJobs from "@/components/Seo";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { BookOpen, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

const normalizeCategory = (param) =>
  (param || "gate-cse").toString().trim().toUpperCase().replace(/_/g, "-");

const categoryLabel = (param) =>
  (param || "gate-cse").toString().trim().replace(/-/g, " ").toUpperCase();

// Local MathJax config tuned for daily practice (v3 style, supports $...$ and \(...\))
const mathJaxConfig = {
  "fast-preview": { disabled: false },
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
    processEscapes: true,
  },
  messageStyle: "none",
  showMathMenu: false,
};

// Helpers to render rich HTML with code blocks + MathJax, same style as practice pages
const CODE_BLOCK_REGEX =
  /<pre><code(?: class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/gi;

// Naive linkifier: wraps bare http/https URLs in <a> tags when no <a> already present
const LINK_REGEX = /https?:\/\/[^\s<>"']+/g;

const decodeHtml = (html) => {
  if (typeof window === "undefined") return html;
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

// Very lightweight C-style formatter for inline code snippets
const formatCCode = (raw) => {
  if (!raw) return "";
  let text = raw;
  // Normalize <br> tags to newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Basic splitting around common C tokens
  text = text
    .replace(/\s*#include/g, "\n#include")
    .replace(/\s*int main/g, "\nint main")
    .replace(/{/g, "{\n")
    .replace(/;/g, ";\n")
    .replace(/}\s*/g, "\n}\n");
  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, "\n\n");
  // Simple indentation based on braces
  const lines = text.split("\n");
  let indentLevel = 0;
  const indented = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      // Decrease indent if line starts with a closing brace
      if (trimmed.startsWith("}")) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }
      const prefix = "  ".repeat(indentLevel);
      // Increase indent after opening brace
      if (trimmed.includes("{")) {
        indentLevel += 1;
      }
      return prefix + trimmed;
    })
    .join("\n");
  return indented.trim();
};

const renderCQuestionIfNeeded = (html) => {
  if (!html) return null;
  const decoded = decodeHtml(html);

  // Prefer an explicit <pre><code> block if present – ignore everything after it
  const preMatch = decoded.match(
    /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/i
  );

  let intro = "";
  let codeRaw = "";

  if (preMatch) {
    const full = preMatch[0];
    const inner = preMatch[1] || "";
    const start = decoded.indexOf(full);
    intro = decoded.slice(0, start);
    codeRaw = inner;
  } else {
    const hasInclude = decoded.includes("#include");
    const hasMain = decoded.includes("int main");
    if (!hasInclude && !hasMain) {
      return null;
    }
    const splitIndex = hasInclude
      ? decoded.indexOf("#include")
      : decoded.indexOf("int main");
    intro = decoded.slice(0, splitIndex);
    codeRaw = decoded.slice(splitIndex);

    // If the HTML around the code is messy (no proper <pre> wrapper),
    // stop the code before common non-code tags like </pre>, <ol>, etc.
    const stopMarkers = ["</pre", "<ol", "<ul", "<div", "<p", "<span", "<table"];
    const stopIndexes = stopMarkers
      .map((m) => {
        const idx = codeRaw.indexOf(m);
        return idx === -1 ? null : idx;
      })
      .filter((v) => v !== null);
    if (stopIndexes.length > 0) {
      const stopAt = Math.min(...stopIndexes);
      codeRaw = codeRaw.slice(0, stopAt);
    }
  }

  const formattedCode = formatCCode(codeRaw);

  return (
    <>
      {intro.trim() && (
        <MathJax dynamic>
          <div dangerouslySetInnerHTML={{ __html: intro }} />
        </MathJax>
      )}
      {formattedCode && (
        <div className="my-3 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-50 overflow-x-auto">
          <SyntaxHighlighter
            language="c"
            style={docco}
            customStyle={{
              margin: 0,
              background: "transparent",
              fontSize: "0.85rem",
            }}
            wrapLongLines
            showLineNumbers={false}
          >
            {formattedCode}
          </SyntaxHighlighter>
        </div>
      )}
    </>
  );
};

const renderRichContent = (html) => {
  if (!html) return null;

  // If there is already an <a> tag, assume author formatted links manually
  const source = html.includes("<a")
    ? html
    : html.replace(LINK_REGEX, (url) => {
        const safe = url.replace(/"/g, "&quot;");
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`;
      });

  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = CODE_BLOCK_REGEX.exec(source)) !== null) {
    const [fullMatch, lang, codeHtml] = match;

    const precedingHtml = source.slice(lastIndex, match.index);
    if (precedingHtml.trim()) {
      elements.push(
        <MathJax dynamic key={`mj-${lastIndex}`}>
          <div dangerouslySetInnerHTML={{ __html: precedingHtml }} />
        </MathJax>
      );
    }

    const code = decodeHtml(codeHtml);
    elements.push(
      <div className="my-4" key={`code-${match.index}`}>
        <SyntaxHighlighter
          language={lang || "javascript"}
          style={docco}
          wrapLongLines
          showLineNumbers={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );

    lastIndex = match.index + fullMatch.length;
  }

  const remainingHtml = source.slice(lastIndex);
  if (remainingHtml.trim()) {
    elements.push(
      <MathJax dynamic key={`mj-end-${lastIndex}`}>
        <div dangerouslySetInnerHTML={{ __html: remainingHtml }} />
      </MathJax>
    );
  }

  return elements;
};

export default function DailyPracticeSetPage() {
  const { category, setId } = useParams();
  const safeCategory = category || "gate-cse";
  const label = categoryLabel(safeCategory);
  const [setData, setSetData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [openSolutions, setOpenSolutions] = useState({});

  useEffect(() => {
    const fetchSet = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/daily-practice/sets/${setId}`);
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to load daily practice set");
        }
        setSetData(data.set);
        setQuestions(data.questions || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load daily practice set");
      } finally {
        setLoading(false);
      }
    };
    fetchSet();
  }, [setId]);

  const handleAnswer = (qid, option) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: option,
    }));
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-neutral-50">
        <MetaDataJobs
          seoTitle={
            setData
              ? `${setData.title} – ${label} daily practice`
              : `${label} daily practice`
          }
          seoDescription={`Solve MCQs in a daily practice set for ${label}.`}
        />
        <Navbar />

        <div className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-neutral-200 rounded w-1/3" />
                <div className="h-4 bg-neutral-100 rounded w-2/3" />
                <div className="h-24 bg-neutral-100 rounded" />
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 sm:p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-neutral-900 mb-1">
                  Failed to load daily practice set
                </h1>
                <p className="text-sm text-neutral-600">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 sm:p-6 mb-5 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-1">
                      {setData?.title || "Daily practice"}
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600">
                      {setData?.description ||
                        "Solve these MCQs at your own pace. See immediate feedback and explanations."}
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1 text-xs sm:text-sm text-neutral-600">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {label}
                    </span>
                    {setData?.date_for && (
                      <span className="inline-flex items-center gap-1 text-neutral-500">
                        {setData.date_for}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white">
                      Practice only – no scoring
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {questions.map((q, idx) => {
                  const selected = answers[q._id];
                  const isCorrect =
                    selected && selected === q.correct_option;
                  const hasOptions = ["A", "B", "C", "D"].some((opt) => {
                    const v = q[`options_${opt}`];
                    return typeof v === "string" && v.trim() !== "";
                  });
                  const isSolutionOpen = !!openSolutions[q._id];
                  return (
                    <div
                      key={q._id || idx}
                      className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                          Q{idx + 1}
                        </div>
                        {selected && (
                          <div className="inline-flex items-center gap-1 text-xs font-medium">
                            {isCorrect ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span className="text-emerald-700">
                                  Correct
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-red-600">
                                  Incorrect
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mb-3 sm:mb-4 overflow-x-hidden">
                        <div className="prose max-w-none text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                          {renderCQuestionIfNeeded(q.question) ||
                            renderRichContent(q.question)}
                        </div>
                      </div>

                      {hasOptions && (
                        <div className="space-y-2">
                          {["A", "B", "C", "D"].map((opt) => {
                            const isSelected = selected === opt;
                            const isOptCorrect = q.correct_option === opt;
                            const value = q[`options_${opt}`];
                            if (!value || typeof value !== "string" || value.trim() === "") {
                              return null;
                            }
                            let cls =
                              "w-full text-left px-3 py-2.5 rounded-lg border text-sm sm:text-base transition-colors";
                            if (selected) {
                              if (isOptCorrect) {
                                cls +=
                                  " border-emerald-500 bg-emerald-50 text-emerald-900";
                              } else if (isSelected && !isOptCorrect) {
                                cls +=
                                  " border-red-400 bg-red-50 text-red-800";
                              } else {
                                cls +=
                                  " border-neutral-200 bg-white text-neutral-900";
                              }
                            } else if (isSelected) {
                              cls +=
                                " border-neutral-900 bg-neutral-900 text-white";
                            } else {
                              cls +=
                                " border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50";
                            }
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleAnswer(q._id, opt)}
                                className={cls}
                              >
                                <span className="font-semibold mr-2">
                                  {opt}.
                                </span>
                                <MathJax hideUntilTypeset={"first"} inline dynamic>
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: value,
                                    }}
                                  />
                                </MathJax>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.solution && (
                        <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 overflow-x-hidden">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className="text-xs sm:text-sm font-semibold text-neutral-800">
                              Explanation
                            </p>
                            {!hasOptions && (
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenSolutions((prev) => ({
                                    ...prev,
                                    [q._id]: !prev[q._id],
                                  }))
                                }
                                className="text-[11px] sm:text-xs font-medium text-neutral-700 hover:text-neutral-900"
                              >
                                {isSolutionOpen ? "Hide solution" : "Show solution"}
                              </button>
                            )}
                          </div>

                          {(hasOptions ? selected : isSolutionOpen) && (
                            <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap break-words">
                              {renderRichContent(q.solution)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {questions.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 sm:p-6 text-center">
                    <p className="text-sm sm:text-base text-neutral-600">
                      This daily practice set does not have any questions yet.
                    </p>
                  </div>
                )}
              </div>
          </>
        )}
      </div>
    </div>
    </MathJaxContext>
  );
}

