import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase client with connection pooling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: { schema: 'public' },
    global: { headers: { 'x-application-name': 'cattracker-chapter-questions' } }
  }
);

// Simple in-memory cache (cleared on server restart)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to normalize chapter names for comparison
const normalizeChapterName = (name) => {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/-/g, ' ');
};

// Helper function to check if two chapter names match
const chapterNamesMatch = (name1, name2) => {
  const norm1 = normalizeChapterName(name1);
  const norm2 = normalizeChapterName(name2);
  return norm1 === norm2;
};

// Function to fetch questions
const fetchQuestions = async (category, chapter, difficulty, page, limit) => {
  const normalizedInputChapter = normalizeChapterName(chapter);
  const offset = (page - 1) * limit;

  // Fetch all questions for this category and difficulty, then filter by chapter
  let allData = [];
  let from = 0;
  const pageSize = 1000;
  let fetchMore = true;

  // Build base query
  let baseQuery = supabase
    .from('examtracker')
    .select('_id, question, options_A, options_B, options_C, options_D, correct_option, solution, difficulty, year, subject, chapter')
    .eq('category', category.toUpperCase());

  if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
    baseQuery = baseQuery.eq('difficulty', difficulty);
  }

  // Fetch all matching data in batches
  while (fetchMore) {
    const { data, error } = await baseQuery
      .order('_id')
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      allData.push(...data);
      from += pageSize;
      fetchMore = data.length === pageSize;
    } else {
      fetchMore = false;
    }
  }

  // Filter by chapter name with proper normalization
  const filtered = allData.filter(row => {
    if (!row.chapter) return false;
    return chapterNamesMatch(row.chapter, normalizedInputChapter);
  });

  // Apply pagination
  const count = filtered.length;
  const questions = filtered.slice(offset, offset + limit);
  const hasMorePages = (offset + limit) < count;

  return {
    questions: questions || [],
    hasMore: hasMorePages,
    totalCount: count,
    currentPage: page,
    totalPages: Math.ceil(count / limit)
  };
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const chapter = searchParams.get('chapter');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!category || !chapter) {
      return NextResponse.json(
        { error: 'Missing required parameters: category and chapter' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `chapter-${category}-${chapter}-${difficulty || 'all'}-${page}-${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(
        cached.data,
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Fetch fresh data
    const result = await fetchQuestions(category, chapter, difficulty || 'all', page, limit);
    
    // Store in cache
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(
      result,
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Chapter questions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: error.message },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
