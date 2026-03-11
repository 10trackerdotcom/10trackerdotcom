import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function normalizeCategory(param) {
  if (!param || typeof param !== 'string') return null;
  return param.trim().toUpperCase().replace(/_/g, '-');
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    const dateFor = searchParams.get('date');

    const category = normalizeCategory(categoryParam);
    if (!category) {
      return NextResponse.json(
        { error: 'category is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('daily_practice_sets')
      .select('id, title, description, date_for, scope_subject, scope_topic, scope_chapter, created_at')
      .eq('category', category)
      .eq('is_active', true)
      .order('date_for', { ascending: false })
      .order('created_at', { ascending: false });

    if (dateFor) {
      query = query.eq('date_for', dateFor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching daily practice sets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch daily practice sets' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, sets: data || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Daily practice sets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

