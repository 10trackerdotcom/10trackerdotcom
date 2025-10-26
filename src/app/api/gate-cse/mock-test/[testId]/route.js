import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
  try {
    const testId = parseInt(params.testId);

    const { data: test, error } = await supabase
      .from('gate_cse_tests')
      .select(`
        *,
        gate_cse_test_instances(count)
      `)
      .eq('id', testId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Transform data to match expected format
    const transformedTest = {
      id: test.id,
      name: test.name,
      description: test.description,
      totalQuestions: test.total_questions,
      duration: test.duration,
      difficulty: test.difficulty,
      createdAt: test.created_at,
      questionCount: test.total_questions,
      attemptCount: test.gate_cse_test_instances?.[0]?.count || 0,
      isActive: test.is_active
    };

    return NextResponse.json({
      success: true,
      test: transformedTest
    });

  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
