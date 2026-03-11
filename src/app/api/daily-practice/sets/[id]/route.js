import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, context) {
  try {
    // In newer Next.js versions, dynamic route params are async
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: 'Set id is required' },
        { status: 400 }
      );
    }

    const { data: set, error: setError } = await supabase
      .from('daily_practice_sets')
      .select('id, category, title, description, date_for, scope_subject, scope_topic, scope_chapter, created_at')
      .eq('id', id)
      .single();

    if (setError) {
      console.error('Error fetching daily practice set:', setError);
      return NextResponse.json(
        { error: 'Daily practice set not found' },
        { status: 404 }
      );
    }

    const { data: mapping, error: mapError } = await supabase
      .from('daily_practice_questions')
      .select('question_id, order_index')
      .eq('set_id', id)
      .order('order_index', { ascending: true });

    if (mapError) {
      console.error('Error fetching daily practice mapping:', mapError);
      return NextResponse.json(
        { error: 'Failed to fetch questions for this set' },
        { status: 500 }
      );
    }

    const questionIds = (mapping || []).map((m) => m.question_id);

    if (!questionIds.length) {
      return NextResponse.json(
        { success: true, set, questions: [] },
        { status: 200 }
      );
    }

    const { data: questions, error: qError } = await supabase
      .from('examtracker')
      .select('_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty, subject, chapter')
      .in('_id', questionIds);

    if (qError) {
      console.error('Error fetching examtracker questions:', qError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    const orderedQuestions = questionIds
      .map((qid) => questions?.find((q) => q._id === qid))
      .filter(Boolean);

    return NextResponse.json(
      { success: true, set, questions: orderedQuestions },
      { status: 200 }
    );
  } catch (error) {
    console.error('Daily practice set detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

