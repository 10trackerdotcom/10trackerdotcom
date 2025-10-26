import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
  try {
    const testId = parseInt(params.testId);

    // First get the test configuration
    const { data: test, error: testError } = await supabase
      .from('gate_cse_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (testError) {
      console.error('Supabase error:', testError);
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Get questions from examtracker table based on test configuration
    let query = supabase
      .from("examtracker")
      .select("_id, question, options_A, options_B, options_C, options_D, correct_option, solution, solutiontext, topic, difficulty")
      .eq("category", "GATE_CSE");

    // Apply difficulty filter if specified
    if (test.difficulty && test.difficulty !== 'mixed') {
      query = query.eq("difficulty", test.difficulty);
    }

    // Limit to total questions specified in test
    query = query.limit(test.total_questions);

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Supabase error:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this test' },
        { status: 404 }
      );
    }

    // Transform questions to match expected format
    const transformedQuestions = questions.map((q, index) => ({
      id: q._id || index + 1,
      question: q.question,
      type: "MCQ", // Default to MCQ for now
      subject: q.topic,
      difficulty: q.difficulty,
      options_A: q.options_A,
      options_B: q.options_B,
      options_C: q.options_C,
      options_D: q.options_D,
      correct_option: q.correct_option,
      solution: q.solution || q.solutiontext
    }));

    return NextResponse.json({
      success: true,
      questions: transformedQuestions
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
