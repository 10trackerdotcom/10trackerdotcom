import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cached function to fetch chapters by category and subject
const getCachedChaptersBySubject = async (category, subject) => {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log("🔄 [Cache] Fetching chapters for subject:", { category, subject });
  }
  
  const allData = [];
  let from = 0;
  const pageSize = 1000;
  let fetchMore = true;

  while (fetchMore) {
    let query = supabase
      .from("examtracker")
      .select("chapter, category, subject, topic", { count: "exact" });

    if (category) {
      query = query.eq("category", category.toUpperCase());
    }

    const { data, error } = await query.range(from, from + pageSize - 1);

    if (error) {
      if (isDev) console.error("❌ [Cache] Supabase error:", error);
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

  // Filter by subject and group by chapter
  const chapterMap = {};
  
  // Normalize subject for matching
  const normalizedQuerySubject = subject ? subject.replace(/-/g, " ").toLowerCase().trim() : "";
  
  allData.forEach(row => {
    if (!row.chapter) return; // Skip rows without chapter field
    
    // Normalize subject for matching
    const normalizedRowSubject = row.subject?.toLowerCase().replace(/\s+/g, " ").trim() || "";
    
    // Check if subject matches
    const subjectMatches = !subject || 
      normalizedRowSubject === normalizedQuerySubject ||
      normalizedRowSubject.includes(normalizedQuerySubject) ||
      normalizedQuerySubject.includes(normalizedRowSubject);
    
    if (subjectMatches) {
      // Normalize chapter name for grouping (handle hyphens and spaces)
      const chapterKey = row.chapter.toLowerCase().replace(/\s+/g, "-").trim();
      
      if (!chapterMap[chapterKey]) {
        // Count topics in this chapter
        const topicsInChapter = allData.filter(r => 
          r.chapter && 
          r.chapter.toLowerCase().replace(/\s+/g, "-").trim() === chapterKey &&
          (!subject || (r.subject?.toLowerCase().replace(/\s+/g, " ").trim() === normalizedQuerySubject ||
                       r.subject?.toLowerCase().replace(/\s+/g, " ").trim().includes(normalizedQuerySubject) ||
                       normalizedQuerySubject.includes(r.subject?.toLowerCase().replace(/\s+/g, " ").trim())))
        ).length;
        
        chapterMap[chapterKey] = {
          title: row.chapter,
          slug: chapterKey, // URL-friendly version
          count: 0, // Will count questions
          category: row.category,
          subject: row.subject
        };
      }
      chapterMap[chapterKey].count += 1;
    }
  });
  
  const chapters = Object.values(chapterMap);

  if (isDev) {
    console.log(`✅ [Cache] Found ${chapters.length} chapters for subject: ${subject || 'all'}`);
  }
  
  return {
    subject: subject,
    category: category,
    chapters: chapters.sort((a, b) => a.title.localeCompare(b.title)),
    totalChapters: chapters.length,
    totalQuestions: chapters.reduce((sum, c) => sum + c.count, 0)
  };
};

// Create cached version
const getCachedChapters = (category, subject) => {
  return unstable_cache(
    async () => {
      return await getCachedChaptersBySubject(category, subject);
    },
    [`chapters-by-subject-${category}-${subject}`],
    {
      tags: ["examtracker"],
      revalidate: 300, // 5 minutes cache
    }
  )();
};

export async function GET(req) {
  const isDev = process.env.NODE_ENV === 'development';
  
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subject = searchParams.get("subject");

    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is required" },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: "Subject parameter is required" },
        { status: 400 }
      );
    }

    // Decode URL parameters
    const decodedCategory = decodeURIComponent(category);
    const decodedSubject = decodeURIComponent(subject);

    if (isDev) {
      console.log("📖 [API] Fetching chapters for subject:", {
        category: decodedCategory,
        subject: decodedSubject
      });
    }

    const result = await getCachedChapters(
      decodedCategory,
      decodedSubject
    );

    if (isDev && result) {
      console.log(`✅ [API] Fetched ${result.chapters.length} chapters`);
    }

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    if (isDev) {
      console.error("❌ [API] Error:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: isDev ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

