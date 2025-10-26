import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
  try {
    const instanceId = parseInt(params.instanceId);

    const { data: result, error } = await supabase
      .from('gate_cse_test_instances')
      .select(`
        *,
        gate_cse_tests(*)
      `)
      .eq('id', instanceId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    // Transform data to match expected format
    const transformedResult = {
      id: result.id,
      testId: result.test_id,
      userId: result.user_id,
      startedAt: result.started_at,
      completedAt: result.completed_at,
      answers: result.answers,
      score: result.score,
      analytics: result.analytics
    };

    return NextResponse.json({
      success: true,
      result: transformedResult
    });

  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
