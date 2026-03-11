import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/** Normalize exam category for DB: e.g. "gate-cse" -> "GATE-CSE" */
function normalizeCategory(param) {
  if (!param || typeof param !== 'string') return 'GATE-CSE';
  return param.trim().toUpperCase().replace(/_/g, '-');
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    const category = normalizeCategory(categoryParam);

    // Fetch all rows in pages so we don't miss subjects/topics beyond default range
    const allRows = [];
    let from = 0;
    const pageSize = 1000;
    let fetchMore = true;

    while (fetchMore) {
      let query = supabase
        .from("examtracker")
        .select("subject, topic", { count: "exact" })
        .eq("category", category);

      const { data, error } = await query.range(from, from + pageSize - 1);

      if (error) {
        console.error('Error fetching subjects/topics:', error);
        return NextResponse.json(
          { error: 'Failed to fetch subjects/topics' },
          { status: 500 }
        );
      }

      if (data && data.length > 0) {
        allRows.push(...data);
        from += pageSize;
        fetchMore = data.length === pageSize;
      } else {
        fetchMore = false;
      }
    }

    const uniqueSubjects = [
      ...new Set(
        allRows
          .map(r => r.subject)
          .filter(Boolean)
      ),
    ].sort();

    const uniqueTopics = [
      ...new Set(
        allRows
          .map(r => r.topic)
          .filter(Boolean)
      ),
    ].sort();

    return NextResponse.json({
      success: true,
      subjects: uniqueSubjects,
      topics: uniqueTopics,
      category,
    });
  } catch (error) {
    console.error('Error fetching topics and subjects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
