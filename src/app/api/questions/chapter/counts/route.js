import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase client with connection pooling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: { schema: 'public' },
    global: { headers: { 'x-application-name': 'cattracker-chapter-counts' } }
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

// Helper function to check if two chapter names match (handles spaces, hyphens, case)
const chapterNamesMatch = (name1, name2) => {
  const norm1 = normalizeChapterName(name1);
  const norm2 = normalizeChapterName(name2);
  return norm1 === norm2;
};

// Function to fetch counts
const fetchCounts = async (category, chapter) => {

  // Normalize the input chapter name
  const normalizedInputChapter = normalizeChapterName(chapter);

  // Fetch all questions for this category (only difficulty and chapter fields for efficiency)
  // We'll aggregate in memory for accurate matching
  let allData = [];
  let from = 0;
  const pageSize = 1000;
  let fetchMore = true;

  while (fetchMore) {
    const { data, error } = await supabase
      .from('examtracker')
      .select('difficulty, chapter')
      .eq('category', category.toUpperCase())
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching data:', error);
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
  const matchingQuestions = allData.filter(row => {
    if (!row.chapter) return false;
    return chapterNamesMatch(row.chapter, normalizedInputChapter);
  });

  // Aggregate counts by difficulty
  const counts = {
    easy: 0,
    medium: 0,
    hard: 0
  };

  matchingQuestions.forEach(q => {
    if (q.difficulty && counts.hasOwnProperty(q.difficulty)) {
      counts[q.difficulty]++;
    }
  });

  const totalCount = matchingQuestions.length;

  return {
    counts,
    total: totalCount,
    easy: counts.easy || 0,
    medium: counts.medium || 0,
    hard: counts.hard || 0
  };
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const chapter = searchParams.get('chapter');

    if (!category || !chapter) {
      return NextResponse.json(
        { error: 'Missing required parameters: category and chapter' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `counts-${category}-${chapter}`;
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
    const result = await fetchCounts(category, chapter);
    
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
    console.error('Chapter counts API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch counts', 
        details: error.message,
        counts: { easy: 0, medium: 0, hard: 0 },
        total: 0
      },
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
