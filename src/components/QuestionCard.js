import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, BookOpen, X, Check, AlertTriangle, Clock, Edit3 } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";

// Supabase client (browser)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { fetch: (...args) => fetch(...args) }
);

// Memoized QuestionCard component
const QuestionCard = memo(({ question, index, onAnswer, isCompleted, onReport, onEdit, isEditing, onStartEditing, isAdmin }) => {
  const [state, setState] = useState({
    showSolution: false,
    selectedOption: null,
    isAnswered: isCompleted,
    difficulty: 0,
    showFeedback: false,
    isCorrect: false,
    confidence: 50,
    showReportForm: false,
    reportReason: "",
    editData: {
      question: question.question,
      options_A: question.options_A,
      options_B: question.options_B,
      options_C: question.options_C,
      options_D: question.options_D,
      correct_option: question.correct_option,
      solution: question.solution,
      difficulty: question.difficulty,
    },
    isSaving: false,
  });

// Optimized MathJax config
  const config = useMemo(() => ({
  "fast-preview": { disabled: false },
    tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]], displayMath: [["$$", "$$"], ["\\[", "\\]"]], processEscapes: true },
  messageStyle: "none",
  showMathMenu: false,
  }), []);

  // Set MathJax global config
  useEffect(() => {
    window.MathJax = { tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]], processEscapes: true }, svg: { fontCache: "global" } };
  }, []);

  // Set difficulty level
  useEffect(() => {
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    setState((prev) => ({ ...prev, difficulty: difficultyMap[question.difficulty] || 0 }));
  }, [question.difficulty]);

  // Memoized handlers
  const handleOptionClick = useCallback((option) => {
    if (state.isAnswered) return;
    setState((prev) => ({ ...prev, selectedOption: option }));
  }, [state.isAnswered]);

  const handleSubmit = useCallback(() => {
    if (!state.selectedOption || state.isAnswered) return;
    const isCorrect = state.selectedOption === question.correct_option;
    setState((prev) => ({ ...prev, isCorrect, showFeedback: true, isAnswered: true }));
    setTimeout(() => onAnswer(isCorrect), 800);
  }, [state.selectedOption, state.isAnswered, question.correct_option, onAnswer]);

  const handleSkip = useCallback(() => {
    setState((prev) => ({ ...prev, isAnswered: true }));
    onAnswer(false);
  }, [onAnswer]);

  // Report disabled per request
  const handleReport = useCallback(() => {}, []);

  const handleSaveEdit = useCallback(async () => {
    if (!isAdmin) return;

    const { question: qText, options_A, options_B, options_C, options_D, correct_option } = state.editData || {};
    if (!qText || !options_A || !options_B || !options_C || !options_D || !correct_option) {
      toast.error("Please fill question, all options and correct option.");
      return;
    }

    try {
      setState((prev) => ({ ...prev, isSaving: true }));
      const { error } = await supabase
        .from("examtracker")
        .update({
          question: qText,
          options_A,
          options_B,
          options_C,
          options_D,
          correct_option,
          solution: state.editData.solution || null,
          solutiontext: state.editData.solution || null,
          difficulty: state.editData.difficulty || "easy",
        })
        .eq("_id", question._id);

      if (error) throw error;

      if (onEdit) onEdit(question._id, state.editData);
      if (onStartEditing) onStartEditing(); // toggle off editor if parent uses it as a toggle
      toast.success("Question updated successfully.");
    } catch (e) {
      toast.error("Failed to save changes. Please try again.");
    }
    finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  }, [isAdmin, onEdit, onStartEditing, question._id, state.editData]);

  const getDifficultyColor = useCallback((level) => ({
    1: "bg-gradient-to-r from-green-400 to-emerald-500",
    2: "bg-gradient-to-r from-yellow-400 to-orange-500",
    3: "bg-gradient-to-r from-red-400 to-pink-500",
  }[level] || "bg-gray-300"), []);

  // JSON-LD Structured Data
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Question",
    "@id": `https://yourdomain.com/questions/${question._id}`,
    "eduQuestionType": "Multiple choice",
    "text": question.question.replace(/<\/?[^>]+(>|$)/g, ""), // Strip HTML for clean text
    "acceptedAnswer": {
      "@type": "Answer",
      "text": question.correct_option
    },
    "suggestedAnswer": [
      question.options_A && { "@type": "Answer", "text": question.options_A.replace(/<\/?[^>]+(>|$)/g, "") },
      question.options_B && { "@type": "Answer", "text": question.options_B.replace(/<\/?[^>]+(>|$)/g, "") },
      question.options_C && { "@type": "Answer", "text": question.options_C.replace(/<\/?[^>]+(>|$)/g, "") },
      question.options_D && { "@type": "Answer", "text": question.options_D.replace(/<\/?[^>]+(>|$)/g, "") },
    ].filter(Boolean),
    "comment": {
      "@type": "Comment",
      "text": (question.solution || question.solutiontext || "").replace(/<\/?[^>]+(>|$)/g, "")
    },
    "educationalAlignment": {
      "@type": "AlignmentObject",
      "alignmentType": "educationalSubject",
      "targetName": question.topic
    },
    "learningResourceType": "Assessment",
    "datePublished": question.created_at || "2025-09-06",
    "publisher": {
      "@type": "Organization",
      "name": "Your Organization Name"
    }
  }), [question]);

  // Reusable question card renderer
  const renderQuestionCard = useCallback((questionData, questionIndex) => (
      <motion.div
      initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      className={`bg-white rounded-xl shadow-md border border-gray-100/50 ${isCompleted ? "ring-2 ring-emerald-500/20" : "hover:shadow-lg"}`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MathJaxContext config={config}>
        <div className="bg-gray-50 p-4 border-b border-gray-100/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white flex items-center justify-center font-bold text-sm">{questionIndex + 1}</div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-medium text-gray-500 uppercase">Difficulty</span>
                <div className="flex space-x-1">
                  {[1, 2, 3].map((level) => (
                    <div key={level} className={`w-2 h-2 rounded-full ${level <= state.difficulty ? getDifficultyColor(level) : "bg-gray-200"}`} />
                  ))}
                </div>
              </div>
            </div>
            {questionData.year && (
              <div className="px-2 py-1 rounded-lg bg-white/80 text-xs font-semibold text-gray-700 border border-gray-200/60">{questionData.year}</div>
            )}
            {isAdmin && !isEditing && (
              <button onClick={onStartEditing} className="px-2 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold flex items-center space-x-1">
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            )}
            <div className={`px-2 py-1 rounded-lg text-xs font-semibold border ${state.isAnswered ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              {state.isAnswered ? (
                <div className="flex items-center space-x-1">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Completed</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Clock size={12} className="text-amber-600" />
                  <span>Pending</span>
              </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-4">
          {isEditing && isAdmin ? (
            <textarea
              value={state.editData.question}
              onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, question: e.target.value } }))}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400 bg-gray-50/50"
              rows={3}
            />
          ) : (
            <MathJax hideUntilTypeset={"first"} inline dynamic>
              <div className="text-gray-800 text-sm leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: questionData.question }} />
                {questionData.questionextratext && (
                  <div className="mt-2 text-gray-600 text-xs" dangerouslySetInnerHTML={{ __html: questionData.questionextratext }} />
                )}
                {(questionData.category === "GATE-CSE" || questionData.category === "CAT") && questionData.questionCode && (
                  <div className="mt-3 rounded-lg overflow-hidden shadow-sm border border-gray-200/50">
                    <SyntaxHighlighter language="javascript" style={atomOneDark} customStyle={{ margin: 0, padding: "12px" }}>
                      {questionData.questionCode}
                  </SyntaxHighlighter>
                </div>
              )}
                {(questionData.category === "GATE-CSE" || questionData.category === "CAT") && questionData.questionImage && (
                  <div className="mt-3 flex justify-center">
                    <Image
                      src={questionData.questionImage}
                      width={160}
                      height={120}
                      className="w-40 rounded-lg shadow-sm border border-gray-200/50"
                      alt={`Question ${questionIndex + 1}`}
                    loading="lazy"
                      onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}
              </div>
            </MathJax>
          )}
          {questionData.options_A && (
            <div className="mt-4 space-y-2">
                  {["A", "B", "C", "D"].map((opt, optIndex) => {
                const optionText = questionData[`options_${opt}`];
                    if (!optionText) return null;
                const isSelected = state.selectedOption === opt;
                const isCorrectOption = opt === questionData.correct_option;
                const optionClass = state.isAnswered && state.showFeedback
                  ? isCorrectOption
                    ? "border-emerald-500 bg-emerald-50/50"
                    : isSelected && !isCorrectOption
                    ? "border-rose-500 bg-rose-50/50"
                    : "border-gray-200/60"
                  : isSelected
                  ? "border-gray-800 bg-gray-100/50"
                  : "border-2 border-gray-200/60 hover:bg-gray-50/50";
                    return (
                  <div key={opt}>
                    {isEditing && isAdmin ? (
                      <textarea
                        value={state.editData[`options_${opt}`]}
                        onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, [`options_${opt}`]: e.target.value } }))}
                        className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400 bg-gray-50/50"
                        rows={2}
                      />
                    ) : (
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: optIndex * 0.05 }}
                        onClick={() => handleOptionClick(opt)}
                        disabled={state.isAnswered}
                        className={`w-full text-left p-3 rounded-lg ${optionClass} ${state.isAnswered ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <div className="flex items-start space-x-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${isSelected ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`}>
                            {opt}
                          </div>
                          <MathJax hideUntilTypeset={"first"} inline dynamic>
                            <div className="flex-grow text-xs">{optionText}</div>
                          </MathJax>
                          {state.isAnswered && state.showFeedback && isCorrectOption && <Check size={14} className="text-green-500" />}
                          {state.isAnswered && state.showFeedback && isSelected && !isCorrectOption && <X size={14} className="text-red-500" />}
                        </div>
                      </motion.button>
                    )}
                  </div>
                    );
                  })}
                </div>
              )}
          {questionData.options_A && !state.isAnswered && state.selectedOption && !isEditing && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200/50">
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Confidence Level</label>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500">Not sure</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                  value={state.confidence}
                  onChange={(e) => setState((prev) => ({ ...prev, confidence: parseInt(e.target.value) }))}
                  className="flex-grow h-1.5 bg-gray-200 rounded-full cursor-pointer"
                  style={{ background: `linear-gradient(to right, #10b981 0%, #10b981 ${state.confidence}%, #e5e7eb ${state.confidence}%, #e5e7eb 100%)` }}
                />
                <span className="text-xs text-gray-500">Very sure</span>
              </div>
              <div className="text-center mt-1">
                <span className="text-sm font-bold text-gray-800">{state.confidence}%</span>
              </div>
            </div>
          )}
          {isEditing && isAdmin && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200/50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Correct Option</label>
                  <select
                    value={state.editData.correct_option}
                    onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, correct_option: e.target.value } }))}
                    className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400"
                  >
                    {["A", "B", "C", "D"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Difficulty</label>
                  <select
                    value={state.editData.difficulty}
                    onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, difficulty: e.target.value } }))}
                    className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400"
                  >
                    {["easy", "medium", "hard"].map((diff) => <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Solution</label>
                <textarea
                  value={state.editData.solution}
                  onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, solution: e.target.value } }))}
                  className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400"
                  rows={3}
                />
                  </div>
              <button
                onClick={handleSaveEdit}
                disabled={state.isSaving}
                className={`w-full sm:w-auto px-4 py-1.5 rounded-lg text-white ${state.isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {state.isSaving ? "Saving..." : "Save Changes"}
              </button>
                  </div>
          )}
          {!isEditing && (
            <div className="mt-4 flex flex-wrap gap-2">
              {!state.isAnswered && questionData.options_A && (
                <button
                    onClick={handleSubmit}
                  disabled={!state.selectedOption}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-xs ${state.selectedOption ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                  >
                    Submit Answer
                </button>
              )}
              {!state.isAnswered && !questionData.options_A && (
                <button onClick={handleSkip} className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold text-xs">
                    Mark Complete
                </button>
              )}
              {questionData.solution && (
                <a
                  href={questionData.solution}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold text-xs flex items-center justify-center space-x-1"
                >
                  <BookOpen size={14} />
                  <span>Solution Answer</span>
                </a>
              )}
              <button
                onClick={() => setState((prev) => ({ ...prev, showSolution: !prev.showSolution }))}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-xs ${state.showSolution ? "bg-gray-100 text-gray-800 border-2 border-gray-300" : "border-2 border-gray-300 text-gray-700"}`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <BookOpen size={14} />
                  <span>{state.showSolution ? "Hide Solution" : "Show Solution"}</span>
                </div>
              </button>
              {false && !state.isAnswered && (
                <button onClick={() => {}} className="hidden" />
                )}
              </div>
          )}
              <AnimatePresence>
            {state.showFeedback && (
                  <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`mt-3 p-3 rounded-lg border-2 ${state.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
              >
                <div className="flex items-center space-x-2">
                  {state.isCorrect ? (
                    <>
                      <CheckCircle size={16} className="text-green-600" />
                          <div>
                        <span className="font-bold text-green-800 text-sm">Correct!</span>
                        <p className="text-green-700 text-xs">You earned 100 points.</p>
                          </div>
                        </>
                      ) : (
                        <>
                      <AlertTriangle size={16} className="text-red-600" />
                          <div>
                        <span className="font-bold text-red-800 text-sm">Incorrect</span>
                        <p className="text-red-700 text-xs">Correct answer: <strong>{questionData.correct_option}</strong></p>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
            {state.showSolution && (
                  <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500"
              >
                <h3 className="font-bold mb-1 text-indigo-800 text-sm flex items-center">
                  <BookOpen size={14} className="mr-1" />
                      Solution
                    </h3>
                {questionData.correct_option && (
                  <div className="mb-1 p-2 bg-white/70 rounded-lg">
                    <span className="font-semibold text-indigo-800 text-xs">Correct Answer: {questionData.correct_option}</span>
                      </div>
                    )}
                <MathJax hideUntilTypeset={"first"} inline dynamic>
                  <div className="text-gray-700 text-xs">
                    {questionData.category?.includes("GATE") ? (
                      <div dangerouslySetInnerHTML={{ __html: questionData.solutiontext }} />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: questionData.solution }} />
                    )}
                      </div>
                    </MathJax>
                  </motion.div>
                )}
              </AnimatePresence>
        </div>
      </MathJaxContext>
    </motion.div>
  ), [state, question, isEditing, isAdmin, onStartEditing, handleOptionClick, handleSubmit, handleSkip, handleSaveEdit, getDifficultyColor, jsonLd, config, isCompleted]);

  return (
    <div className="space-y-4">
      {renderQuestionCard(question, index)}
      {false && (
              <AnimatePresence>
          {state.showReportForm && !state.isAnswered && (
            <motion.div />
                )}
              </AnimatePresence>
          )}
        </div>
  );
});

QuestionCard.displayName = 'QuestionCard';

export default QuestionCard;