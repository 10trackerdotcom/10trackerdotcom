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
  const categoryUpper = category.toUpperCase();
  const normalizedInput = normalizeChapterName(chapter);

  const candidates = Array.from(
    new Set(
      [
        chapter,
        String(chapter).trim(),
        String(chapter).replace(/-/g, ' '),
        normalizeChapterName(chapter),
        normalizeChapterName(chapter).replace(/\s+/g, '-'),
      ].filter(Boolean)
    )
  );

  const headCount = async (chapterValue, difficulty) => {
    let q = supabase
      .from('examtracker')
      .select('_id', { count: 'exact', head: true })
      .eq('category', categoryUpper)
      .eq('chapter', chapterValue);

    if (difficulty) q = q.eq('difficulty', difficulty);
    const res = await q;
    if (res.error) throw res.error;
    return res.count || 0;
  };

  // Fast path: exact chapter match using a few candidates.
  let matchedChapter = candidates[0] ?? chapter;
  let total = 0;

  for (const candidate of candidates) {
    total = await headCount(candidate, null);
    if (total > 0) {
      matchedChapter = candidate;
      break;
    }
  }

  // Fallback: resolve chapter by normalization via a limited chapter list.
  if (total === 0) {
    const { data: chaptersData, error: chaptersError } = await supabase
      .from('examtracker')
      .select('chapter')
      .eq('category', categoryUpper)
      .limit(5000);
    if (chaptersError) throw chaptersError;

    const resolved = (chaptersData ?? [])
      .map((r) => r?.chapter)
      .filter(Boolean)
      .find((ch) => chapterNamesMatch(ch, normalizedInput));

    if (!resolved) {
      return {
        matchedChapter: null,
        counts: { easy: 0, medium: 0, hard: 0 },
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
      };
    }

    matchedChapter = resolved;
    total = await headCount(matchedChapter, null);
  }

  const [easy, medium, hard] = await Promise.all([
    headCount(matchedChapter, 'easy'),
    headCount(matchedChapter, 'medium'),
    headCount(matchedChapter, 'hard'),
  ]);

  const counts = { easy, medium, hard };
  return {
    matchedChapter,
    counts,
    total,
    easy,
    medium,
    hard,
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
