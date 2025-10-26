"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from "@supabase/supabase-js";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  ArrowLeft,
  Zap,
  BarChart3,
  Target,
  Timer,
  Brain
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MockTestNav from '../../components/MockTestNav';

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// MathJax configuration
const config = {
  "fast-preview": { disabled: true },
  tex2jax: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
  },
  messageStyle: "none",
};

export default function TestResultPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { instanceid } = useParams();
  const attemptId = instanceid;

  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [testInfo, setTestInfo] = useState(null);
  const [topicBreakdown, setTopicBreakdown] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [enhancedQuestions, setEnhancedQuestions] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (attemptId && user) fetchAttemptDetails();
    // eslint-disable-next-line
  }, [attemptId, user]);

  // --- Helpers ---
  const fetchAttemptData = async (attemptId, userEmail) => {
    return supabase
      .from("user_test_attempts")
      .select(`
        id,
        test_id,
        user_email,
        started_at,
        submitted_at,
        duration_taken,
        total_questions,
        attempted_questions,
        correct_answers,
        wrong_answers,
        unanswered,
        score,
        percentage,
        is_completed,
        answers,
        all_questions,
        mock_tests (
          name,
          duration,
          difficulty,
          category
        )
      `)
      .eq("id", attemptId)
      .eq("user_email", userEmail)
      .eq("is_completed", true)
      .single();
  };

  const fetchQuestionsData = async (questionIds) => {
    return supabase
      .from("examtracker")
      .select(`
        _id,
        topic,
        category,
        difficulty,
        year,
        subject,
        question,
        options_A,
        options_B,
        options_C,
        options_D,
        correct_option,
        solution,
        questionCode,
        questionImage,
        solutiontext,
        topicList,
        topic_list
      `)
      .in("_id", questionIds);
  };

  const buildMaps = (questionsData, answers) => {
    const questionsMap = new Map();
    const answersMap = new Map();

    questionsData?.forEach((q) => questionsMap.set(q._id, q));
    answers?.forEach((a) => answersMap.set(a.questionId, a));

    return { questionsMap, answersMap };
  };

  const buildBreakdown = (allQuestions, questionsMap, answersMap) => {
    const breakdown = {};
    const enhancedQuestions = [];

    allQuestions.forEach((q, idx) => {
      const fullQ = questionsMap.get(q.id);
      const ans = answersMap.get(q.id);

      const topic =
        fullQ?.topic || fullQ?.subject || q.topic || q.subject || "General";

      if (!breakdown[topic]) {
        breakdown[topic] = {
          correct: [],
          incorrect: [],
          unanswered: [],
          timeSpent: 0,
          totalQuestions: 0,
          subject: fullQ?.subject || q.subject || topic,
          difficulty: fullQ?.difficulty || q.difficulty || "medium",
        };
      }

      const enriched = {
        ...q,
        ...fullQ,
        question_order: idx + 1,
        userAnswer: ans?.userAnswer ?? "",
        correctAnswer: fullQ?.correct_option || q.correct_option,
        isCorrect: ans?.isCorrect ?? false,
        timeSpent: ans?.timeSpent ?? 0,
        isAttempted: Boolean(ans?.userAnswer),
        isMarkedForReview: ans?.isMarkedForReview ?? false,
        hasFullData: !!fullQ,
        questionText: fullQ?.question || q.question || "Question text not available",
        options: fullQ
          ? { A: fullQ.options_A, B: fullQ.options_B, C: fullQ.options_C, D: fullQ.options_D }
          : (q.options || {}),
        solution: fullQ?.solution || q.solution,
        solutionText: fullQ?.solutiontext || q.solutiontext,
        questionImage: fullQ?.questionImage,
        questionCode: fullQ?.questionCode,
        topicList: fullQ?.topic_list || fullQ?.topicList || [],
        category: fullQ?.category || q.category,
        year: fullQ?.year || q.year,
        difficulty: fullQ?.difficulty || q.difficulty || "medium",
      };

      enhancedQuestions.push(enriched);

      breakdown[topic].totalQuestions++;
      if (enriched.isAttempted) {
        enriched.isCorrect
          ? breakdown[topic].correct.push(enriched)
          : breakdown[topic].incorrect.push(enriched);
      } else {
        breakdown[topic].unanswered.push(enriched);
      }
      breakdown[topic].timeSpent += enriched.timeSpent;
    });

    // add stats
    Object.values(breakdown).forEach((topicData) => {
      const attempted = topicData.correct.length + topicData.incorrect.length;
      topicData.accuracy =
        topicData.totalQuestions > 0
          ? Math.round((topicData.correct.length / (attempted || 1)) * 100)
          : 0;
      topicData.attemptedCount = attempted;
      topicData.averageTime = attempted > 0
        ? Math.round(topicData.timeSpent / attempted)
        : 0;
    });

    return { breakdown, enhancedQuestions };
  };

  // --- Main function with performance logging ---
  const fetchAttemptDetails = async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);

      // Step 1: Fetch attempt
      const { data: attemptData, error: attemptError } = await fetchAttemptData(attemptId, user.email);
      if (attemptError || !attemptData) {
        toast.error("Test attempt not found or unauthorized");
        router.push("/gate-cse/mock-test");
        return;
      }
      setAttempt(attemptData);
      setTestInfo(attemptData.mock_tests);

      // Step 2: Collect question IDs
      const questionIds = (attemptData.all_questions || []).map((q) => q.id).filter(Boolean);
      if (questionIds.length === 0) {
        toast.error("No questions found in this test attempt");
        return;
      }

      // Step 3: Fetch questions
      const { data: questionsData, error: questionsError } = await fetchQuestionsData(questionIds);
      if (questionsError) console.error("Error fetching questions:", questionsError);

      // Step 4: Maps + breakdown
      const { questionsMap, answersMap } = buildMaps(questionsData, attemptData.answers);
      const { breakdown, enhancedQuestions } = buildBreakdown(
        attemptData.all_questions || [],
        questionsMap,
        answersMap
      );

      setTopicBreakdown(breakdown);
      setEnhancedQuestions(enhancedQuestions);

      // Step 5: Debug logging
      const missing = questionIds.filter((id) => !questionsMap.has(id));
      if (missing.length > 0) {
        console.warn(`Missing question data for IDs: ${missing.join(", ")}`);
      }

      // Performance metrics
      const duration = Date.now() - startTime;
      console.log(`Fetch completed in ${duration}ms
      - Questions expected: ${questionIds.length}
      - Questions fetched: ${questionsData?.length || 0}
      - Completeness: ${((questionsData?.length || 0) / questionIds.length * 100).toFixed(1)}%`);

      toast.success("Test results loaded successfully");
    } catch (err) {
      console.error("Error in fetchAttemptDetails:", err);
      toast.error("Failed to load test results");
      router.push("/gate-cse/mock-test");
    } finally {
      setIsLoading(false);
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'text-emerald-600';
    if (accuracy >= 60) return 'text-amber-600';
    if (accuracy >= 40) return 'text-orange-600';
    return 'text-rose-600';
  };

  const getScoreGradient = (percentage) => {
    if (percentage >= 80) return 'from-emerald-500 to-teal-600';
    if (percentage >= 60) return 'from-amber-500 to-orange-600';
    if (percentage >= 40) return 'from-orange-500 to-red-600';
    return 'from-rose-500 to-red-600';
  };

  const toggleTopic = (topic) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topic]: !prev[topic],
    }));
  };

  const filteredQuestions = Object.entries(topicBreakdown).reduce((acc, [topic, data]) => {
    if (activeTab === 'all') acc[topic] = data;
    else if (activeTab === 'correct') acc[topic] = { ...data, incorrect: [], unanswered: [] };
    else if (activeTab === 'incorrect') acc[topic] = { ...data, correct: [], unanswered: [] };
    else if (activeTab === 'unanswered') acc[topic] = { ...data, correct: [], incorrect: [] };
    return acc;
  }, {});

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-xl shadow-sm border">
            <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign In Required</h2>
            <p className="text-gray-600">Please sign in to view test results.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mb-4 mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading your results...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!attempt || !testInfo) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-xl shadow-sm border">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Test Attempt Not Found</h2>
            <p className="text-gray-600">The requested test attempt could not be found.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <MathJaxContext config={config}>
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{testInfo.name}</h1>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {testInfo.category}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {testInfo.difficulty}
                      </span>
                    </div>
                  </div>
                   
                </div>

                {/* Performance Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                   

                  {/* Stats Grid */}
                  <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-2xl font-bold text-green-900">{attempt.correct_answers}</span>
                      </div>
                      <div className="text-sm font-medium text-green-700">Correct</div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-2xl font-bold text-red-900">{attempt.wrong_answers}</span>
                      </div>
                      <div className="text-sm font-medium text-red-700">Incorrect</div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-2xl font-bold text-yellow-900">{attempt.unanswered}</span>
                      </div>
                      <div className="text-sm font-medium text-yellow-700">Skipped</div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <Timer className="w-5 h-5 text-blue-600" />
                        <span className="text-2xl font-bold text-blue-900">
                          {Math.floor(attempt.duration_taken / 60)}m
                        </span>
                      </div>
                      <div className="text-sm font-medium text-blue-700">Time Taken</div>
                    </div>
                  </div>
                </div>

                {/* Test Details */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Started:</span>
                      <div>{new Date(attempt.started_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Submitted:</span>
                      <div>{new Date(attempt.submitted_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Questions:</span>
                      <div>{attempt.attempted_questions}/{attempt.total_questions}</div>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <div>{Math.floor(attempt.duration_taken / 60)}m {attempt.duration_taken % 60}s</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
              <div className="p-4">
                <div className="flex space-x-1">
                  {[
                    { key: 'all', label: 'All Questions', icon: BarChart3 },
                    { key: 'correct', label: 'Correct', icon: CheckCircle },
                    { key: 'incorrect', label: 'Incorrect', icon: XCircle },
                    { key: 'unanswered', label: 'Skipped', icon: AlertCircle }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                        activeTab === tab.key
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="space-y-4">
              {Object.keys(filteredQuestions).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No questions found for this filter.</p>
                </div>
              ) : (
                Object.entries(filteredQuestions).map(([topic, data]) => {
                  const total = data.correct.length + data.incorrect.length + data.unanswered.length;
                  if (total === 0) return null;
                  const accuracy = total > 0 ? (data.correct.length / total) * 100 : 0;
                  const isExpanded = expandedTopics[topic];

                  return (
                    <div key={topic} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleTopic(topic)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                              <h3 className="text-lg font-semibold text-gray-900">{topic}</h3>
                              <div className="flex items-center gap-1 ml-auto">
                                <Target className="w-4 h-4 text-gray-400" />
                                <span className={`font-semibold ${getAccuracyColor(accuracy)}`}>
                                  {accuracy.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-green-700 font-medium">{data.correct.length} Correct</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-red-700 font-medium">{data.incorrect.length} Incorrect</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-yellow-700 font-medium">{data.unanswered.length} Skipped</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-600">{Math.floor(data.timeSpent / 60)}m {data.timeSpent % 60}s</span>
                              </div>
                            </div>
                          </div>

                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-gray-200">
                          <div className="pt-6 space-y-6">
                            {/* Correct Questions */}
                            {data.correct.length > 0 && (
                              <QuestionSection
                                title="Correct Answers"
                                questions={data.correct}
                                type="correct"
                                icon={CheckCircle}
                                bgColor="bg-green-50"
                                borderColor="border-green-200"
                                textColor="text-green-700"
                              />
                            )}

                            {/* Incorrect Questions */}
                            {data.incorrect.length > 0 && (
                              <QuestionSection
                                title="Incorrect Answers"
                                questions={data.incorrect}
                                type="incorrect"
                                icon={XCircle}
                                bgColor="bg-red-50"
                                borderColor="border-red-200"
                                textColor="text-red-700"
                              />
                            )}

                            {/* Unanswered Questions */}
                            {data.unanswered.length > 0 && (
                              <QuestionSection
                                title="Skipped Questions"
                                questions={data.unanswered}
                                type="unanswered"
                                icon={AlertCircle}
                                bgColor="bg-yellow-50"
                                borderColor="border-yellow-200"
                                textColor="text-yellow-700"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

             
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              className: 'bg-white border shadow-lg rounded-lg',
              duration: 4000,
            }}
          />
        </MathJaxContext>
      </div>
    </>
  );
}

// Question Section Component
function QuestionSection({ title, questions, type, icon: Icon, bgColor, borderColor, textColor }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-6 h-6 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-current" />
        </div>
        <h4 className={`font-semibold ${textColor}`}>{title}</h4>
      </div>
      <div className="space-y-4">
        {questions.map((q, index) => (
          <MathJax hideUntilTypeset={"first"} inline dynamic key={index}>
            <div className={`${bgColor} p-4 rounded-lg ${borderColor} border`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`${bgColor.replace('50', '100')} ${textColor} px-2 py-1 rounded-full text-xs font-bold`}>
                  Q{q.question_order}
                </span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {q.difficulty}
                </span>
                <span className="ml-auto text-xs text-gray-600 font-medium">
                  {type === 'correct' ? '✓' : type === 'incorrect' ? '✗' : 'Skipped'} {q.timeSpent}s
                </span>
              </div>
              
              <div dangerouslySetInnerHTML={{ __html: q.question }} className="mb-3 text-gray-800" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-sm">
                {['A', 'B', 'C', 'D'].map(option => (
                  <div key={option} className="p-2 bg-white rounded border">
                    <strong>{option}:</strong> <span dangerouslySetInnerHTML={{ __html: q[`options_${option}`] || "" }} />
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  {type === 'incorrect' && (
                    <>
                      <span className="text-red-700 font-semibold">Your: {q.userAnswer}</span>
                      <span className="text-green-700 font-semibold">Correct: {q.correctAnswer}</span>
                    </>
                  )}
                  {type === 'correct' && (
                    <span className="text-green-700 font-semibold">Your Answer: {q.userAnswer}</span>
                  )}
                  {type === 'unanswered' && (
                    <span className="text-green-700 font-semibold">Correct Answer: {q.correctAnswer}</span>
                  )}
                </div>
              </div>
              {q.solutiontext && (

                  
<div dangerouslySetInnerHTML={{ __html: q.solutiontext }} className="mt-4 mb-3 text-gray-800 overflow-x-auto" />
                )}
            </div>
          </MathJax>
        ))}
      </div>
    </div>
  );
}