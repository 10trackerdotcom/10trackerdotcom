import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { data: tests, error } = await supabase
      .from('gate_cse_tests')
      .select(`
        *,
        gate_cse_test_instances(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tests' },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const transformedTests = tests?.map(test => ({
      id: test.id,
      name: test.name,
      description: test.description,
      totalQuestions: test.total_questions,
      duration: test.duration,
      difficulty: test.difficulty,
      createdAt: test.created_at,
      questionCount: test.total_questions,
      attemptCount: test.gate_cse_test_instances?.[0]?.count || 0
    })) || [];

    return NextResponse.json({
      success: true,
      tests: transformedTests
    });

  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
