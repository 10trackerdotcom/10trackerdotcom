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
      name,
      description,
      totalQuestions,
      duration,
      difficulty,
      includeGeneralAptitude,
      includeEngineeringMath,
      customWeightage,
      weightageConfig,
      questionDistribution
    } = body;

    // Validate required fields
    if (!name || !totalQuestions || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: name, totalQuestions, duration' },
        { status: 400 }
      );
    }

    // Create test in Supabase
    const { data: test, error } = await supabase
      .from('gate_cse_tests')
      .insert({
        name,
        description: description || '',
        total_questions: totalQuestions,
        duration,
        difficulty,
        include_general_aptitude: includeGeneralAptitude,
        include_engineering_math: includeEngineeringMath,
        custom_weightage: customWeightage,
        weightage_config: weightageConfig,
        question_distribution: questionDistribution,
        created_by: 'jain10gunjan@gmail.com', // TODO: Get from session
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create test' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test created successfully',
      test: {
        id: test.id,
        name: test.name,
        createdAt: test.created_at
      }
    });

  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data: tests, error } = await supabase
      .from('gate_cse_tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tests: tests || []
    });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
