import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      testId,
      answers,
      totalTime,
      score,
      statistics
    } = body;

    // Validate required fields
    if (!testId || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: testId, answers' },
        { status: 400 }
      );
    }

    // Calculate final score and analytics
    const finalScore = calculateScore(answers);
    const analytics = calculateAnalytics(answers, totalTime, statistics);

    // Create test instance in Supabase
    const { data: testInstance, error } = await supabase
      .from('gate_cse_test_instances')
      .insert({
        test_id: parseInt(testId),
        user_id: 'mock-user-id', // TODO: Get from session
        started_at: new Date(Date.now() - totalTime * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        answers: answers,
        score: finalScore,
        analytics: analytics
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to submit test' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test submitted successfully',
      instanceId: testInstance.id,
      score: finalScore,
      analytics: analytics
    });

  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateScore(answers) {
  let score = 0;
  let totalQuestions = answers.length;

  answers.forEach(answer => {
    if (answer.isCorrect) {
      score += 100; // 100 points per correct answer
    }
  });

  return Math.round((score / (totalQuestions * 100)) * 100); // Convert to percentage
}

function calculateAnalytics(answers, totalTime, statistics) {
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  // Subject-wise performance
  const subjectPerformance = {};
  answers.forEach(answer => {
    const subject = answer.subject || 'Unknown';
    if (!subjectPerformance[subject]) {
      subjectPerformance[subject] = { correct: 0, total: 0 };
    }
    subjectPerformance[subject].total++;
    if (answer.isCorrect) {
      subjectPerformance[subject].correct++;
    }
  });

  // Calculate subject-wise accuracy
  Object.keys(subjectPerformance).forEach(subject => {
    const { correct, total } = subjectPerformance[subject];
    subjectPerformance[subject].accuracy = total > 0 ? (correct / total) * 100 : 0;
  });

  return {
    totalQuestions,
    correctAnswers,
    accuracy: Math.round(accuracy),
    totalTime,
    avgTimePerQuestion: totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
    subjectPerformance,
    difficultyBreakdown: statistics?.difficultyBreakdown || {},
    percentile: calculatePercentile(accuracy) // Mock percentile calculation
  };
}

function calculatePercentile(accuracy) {
  // Mock percentile calculation - replace with actual distribution
  if (accuracy >= 90) return 95;
  if (accuracy >= 80) return 85;
  if (accuracy >= 70) return 70;
  if (accuracy >= 60) return 50;
  if (accuracy >= 50) return 30;
  return 15;
}
