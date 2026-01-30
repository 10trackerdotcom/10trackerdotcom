import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, BookOpen, X, Check, AlertTriangle, Clock, Edit3 } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/app/context/AuthContext";

// Supabase client (browser)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { fetch: (...args) => fetch(...args) }
);

// Helper function to convert [latex] tags to $ for MathJax
const convertLatexTags = (text) => {
  if (!text) return text;
  return String(text)
    .replace(/\[latex\]/g, '$')
    .replace(/\[\/latex\]/g, '$');
};

// Helper function to convert relative image URLs to absolute URLs
const convertRelativeImageUrls = (text) => {
  if (!text) return text;
  const textStr = String(text);
  
  // Check if the text contains /wp-content/uploads/GATE
  if (textStr.includes('/wp-content/uploads/GATE')) {
    // Replace relative paths in img src attributes
    let processed = textStr.replace(
      /(<img[^>]*src=["'])(\/wp-content\/uploads\/GATE[^"']*)(["'])/gi,
      '$1https://practicepaper.in$2$3'
    );
    
    // Replace relative paths that are not in img tags (standalone URLs)
    // processed = processed.replace(
    //   /(^|[^"'])(\/wp-content\/uploads\/GATE[^\s<>"']+)/g,
    //   '$1https://practicepaper.in$2'
    // );
    
    return processed;
  }
  
  return textStr;
};

// Helper function to convert \n to <br /> for UPSC Prelims
const convertNewlinesToBreaks = (text, isUpscPrelims) => {
  if (!text || !isUpscPrelims) return text;
  
  let processed = String(text);
  
  // First handle escaped \n (literal backslash + n) - this is what comes from database as string
  processed = processed.replace(/\\n/g, '<br />');
  
  // Then handle actual newline characters (Windows \r\n, Mac \r, Unix \n)
  processed = processed.replace(/\r\n/g, '<br />'); // Windows line endings
  processed = processed.replace(/\r/g, '<br />');     // Mac line endings
  processed = processed.replace(/\n/g, '<br />');      // Unix line endings
  
  return processed;
};

// Memoized QuestionCard component
const QuestionCard = memo(({ question, category, index, onAnswer, isCompleted, onReport, onEdit, isEditing, onStartEditing, isAdmin }) => {
  const { user } = useAuth();
  // Check if this is UPSC Prelims
  const isUpscPrelims = category?.toLowerCase() === 'upsc-prelims' || category?.toLowerCase() === 'upscprelims';
  
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

  const handleReport = useCallback(() => {
    setState((prev) => ({ ...prev, showReportForm: !prev.showReportForm }));
  }, []);

  const handleReportSubmit = useCallback(async () => {
    if (!state.reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    const questionId = question._id || question.id;
    const topic = question.topic || question.chapter || category;

    if (onReport) {
      // Use the provided onReport callback
      onReport(questionId, state.reportReason.trim(), topic);
      setState((prev) => ({ 
        ...prev, 
        showReportForm: false, 
        reportReason: "" 
      }));
      toast.success("Question reported successfully");
    } else {
      // Default behavior: report directly to Supabase
      try {
        if (!user) {
          toast.error("Please sign in to report questions");
          return;
        }

        // Get user email from Clerk user object
        const userEmail = user?.primaryEmailAddress?.emailAddress || user?.email;
        
        if (!userEmail) {
          toast.error("Unable to get user email. Please sign in again.");
          return;
        }

        const { error } = await supabase.from("reported_questions").insert({
          question_id: questionId,
          topic: topic || category || "unknown",
          user_id: userEmail,
          reason: state.reportReason.trim(),
          reported_at: new Date().toISOString(),
        });

        if (error) throw error;

        setState((prev) => ({ 
          ...prev, 
          showReportForm: false, 
          reportReason: "" 
        }));
        toast.success("Question reported successfully");
      } catch (error) {
        console.error("Report error:", error);
        toast.error("Failed to report question. Please try again.");
      }
    }
  }, [onReport, question, category, state.reportReason]);

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
      className={`bg-white rounded-xl shadow-md border border-gray-100/50 overflow-hidden ${isCompleted ? "ring-2 ring-emerald-500/20" : "hover:shadow-lg"}`}
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
            <div className="flex items-center gap-2">
              {questionData.year && (
                <div className="px-2 py-1 rounded-lg bg-white/80 text-xs font-semibold text-gray-700 border border-gray-200/60">{questionData.year}</div>
              )}
              {!state.isAnswered && (
                <button 
                  onClick={handleSkip}
                  className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium flex items-center space-x-1 transition-colors"
                  title="Mark as complete"
                >
                  <CheckCircle size={12} />
                  <span>Mark Complete</span>
                </button>
              )}
              {isAdmin && !isEditing && (
                <button onClick={onStartEditing} className="px-2 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold flex items-center space-x-1">
                  <Edit3 size={12} />
                  <span>Edit</span>
                </button>
              )}
              <button 
                onClick={handleReport}
                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium flex items-center space-x-1 transition-colors"
                title="Report question"
              >
                <AlertTriangle size={12} />
                <span>Report</span>
              </button>
              
              {questionData.topic && (
                <div className="px-2 py-1 rounded-lg bg-white/80 text-xs font-semibold text-gray-700 border border-gray-200/60">{questionData.topic}</div>
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
        </div>
        <div className="p-4 overflow-x-auto">
          {isEditing && isAdmin ? (
            <textarea
              value={state.editData.question}
              onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, question: e.target.value } }))}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400 bg-gray-50/50"
              rows={3}
            />
          ) : (
            <MathJax hideUntilTypeset={"first"} inline dynamic>
              <div className="text-gray-800 text-sm leading-relaxed break-words overflow-x-auto [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto">
                {questionData.directionHTML && questionData.directionHTML !== null && (
                  <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto" dangerouslySetInnerHTML={{ __html: convertNewlinesToBreaks(convertLatexTags(convertRelativeImageUrls(questionData.directionHTML)), isUpscPrelims) }} />
                )}
                <div className="break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto" dangerouslySetInnerHTML={{ __html: convertNewlinesToBreaks(convertLatexTags(convertRelativeImageUrls(questionData.question)), isUpscPrelims) }} />

                {questionData.questionextratext && (
                  <div className="mt-2 text-gray-600 text-xs break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto" dangerouslySetInnerHTML={{ __html: convertNewlinesToBreaks(convertLatexTags(convertRelativeImageUrls(questionData.questionextratext)), isUpscPrelims) }} />
                )}
                {(questionData.category === "GATE-CSE" || questionData.category === "CAT") && questionData.questionCode && (
                  <div className="mt-3 rounded-lg overflow-x-auto shadow-sm border border-gray-200/50 max-w-full">
                    <SyntaxHighlighter 
                      language="javascript" 
                      style={atomOneDark} 
                      customStyle={{ margin: 0, padding: "12px", maxWidth: "100%", overflowX: "auto" }}
                      wrapLines={true}
                      wrapLongLines={true}
                    >
                      {questionData.questionCode}
                  </SyntaxHighlighter>
                </div>
              )}
                {(questionData.category === "GATE-CSE" || questionData.category === "CAT") && questionData.questionImage && (
                  <div className="mt-3 flex justify-center max-w-full overflow-hidden">
                    <Image
                      src={questionData.questionImage}
                      width={160}
                      height={120}
                      className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200/50"
                      alt={`Question ${questionIndex + 1}`}
                    loading="lazy"
                      onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}
              </div>
            </MathJax>
          )}
          {(() => {
            const hasOptions = ["A", "B", "C", "D"].some(opt => {
              const optionText = questionData[`options_${opt}`];
              return optionText && String(optionText).trim().length > 0;
            });
            
            if (!hasOptions) return null;
            
            return (
              <div className="mt-4 space-y-2">
                {["A", "B", "C", "D"].map((opt, optIndex) => {
                  const optionText = questionData[`options_${opt}`];
                  if (!optionText || String(optionText).trim().length === 0) return null;
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
                        className={`w-full text-left p-3 rounded-lg ${optionClass} ${state.isAnswered ? "cursor-default" : "cursor-pointer"} overflow-x-auto`}
                      >
                        <div className="flex items-start space-x-2 min-w-0">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0 ${isSelected ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`}>
                            {opt}
                          </div>
                          <MathJax hideUntilTypeset={"first"} inline dynamic>
                            <div className="flex-grow text-xs break-words min-w-0 [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto" dangerouslySetInnerHTML={{ __html: convertNewlinesToBreaks(convertLatexTags(convertRelativeImageUrls(optionText)), isUpscPrelims) }} />
                          </MathJax>
                          <div className="flex-shrink-0">
                            {state.isAnswered && state.showFeedback && isCorrectOption && <Check size={14} className="text-green-500" />}
                            {state.isAnswered && state.showFeedback && isSelected && !isCorrectOption && <X size={14} className="text-red-500" />}
                          </div>
                        </div>
                      </motion.button>
                    )}
                  </div>
                    );
                  })}
                </div>
            );
          })()}
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
            <div className="mt-4 flex gap-2">
              {!state.isAnswered && questionData.options_A && (
                <button
                  onClick={handleSubmit}
                  disabled={!state.selectedOption}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    state.selectedOption 
                      ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Submit Answer
                </button>
              )}
              <button
                onClick={() => setState((prev) => ({ ...prev, showSolution: !prev.showSolution }))}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center space-x-2 ${
                  state.showSolution 
                    ? "bg-gray-100 text-gray-800 border-2 border-gray-300" 
                    : "bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800"
                }`}
              >
                <BookOpen size={16} />
                <span>{state.showSolution ? "Hide Solution" : "Show Solution"}</span>
              </button>
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
              {state.showSolution && (
                <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 transition-all duration-300 ease-in-out overflow-x-auto">
                  <h3 className="font-bold mb-1 text-indigo-800 text-sm flex items-center">
                    <BookOpen size={14} className="mr-1 flex-shrink-0" />
                    Solution
                  </h3>
                  {questionData.correct_option && (
                    <div className="mb-1 p-2 bg-white/70 rounded-lg break-words">
                      <span className="font-semibold text-indigo-800 text-xs">Correct Answer: {questionData.correct_option}</span>
                    </div>
                  )}
                  

<MathJax hideUntilTypeset={"first"} inline dynamic>
  <div className="text-gray-700 text-xs break-words overflow-x-auto [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto">
  {["gate-cse", "gate-me", "gate-da"].includes(
    category?.toLowerCase() || ""
    ) ? (
      <a
        href={convertRelativeImageUrls(questionData.solution)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        Discuss solution
      </a>
    ) : (
      <p
        dangerouslySetInnerHTML={{ __html: convertNewlinesToBreaks(convertLatexTags(convertRelativeImageUrls(questionData.solution)), isUpscPrelims) }}
      >
      </p>
    )}
  </div>
</MathJax>

                </div>
              )}
        </div>
      </MathJaxContext>
    </motion.div>
  ), [state, question, isEditing, isAdmin, onStartEditing, handleOptionClick, handleSubmit, handleSkip, handleSaveEdit, getDifficultyColor, jsonLd, config, isCompleted]);

  return (
    <div className="space-y-4 mb-8">
      {renderQuestionCard(question, index)}
      <AnimatePresence>
        {state.showReportForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
              <AlertTriangle size={14} className="mr-2" />
              Report Question
            </h3>
            <p className="text-xs text-red-700 mb-3">
              Please provide a reason for reporting this question. This helps us improve the quality of our content.
            </p>
            <textarea
              value={state.reportReason}
              onChange={(e) => setState((prev) => ({ ...prev, reportReason: e.target.value }))}
              placeholder="E.g., Incorrect answer, unclear question, typo, etc."
              className="w-full p-3 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-300/30 focus:border-red-400 bg-white text-sm resize-none"
              rows={4}
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={handleReport}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Submit Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

QuestionCard.displayName = 'QuestionCard';

export default QuestionCard;