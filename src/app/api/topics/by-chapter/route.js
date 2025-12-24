import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cached function to fetch topics by chapter
// chapterName comes from URL param [chaptername] - e.g., "laws-of-motion"
const getCachedTopicsByChapter = async (category, subject, chapterName) => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log("🔄 [Cache] Fetching topics for chapter:", { 
        category, 
        subject, 
        chapterName,
        note: "chapterName comes from URL param [chaptername]"
      });
    }
    
    const allData = [];
    let from = 0;
    const pageSize = 1000;
    let fetchMore = true;

    while (fetchMore) {
      // Try to select chapter field if it exists, otherwise use available fields
      let query = supabase
        .from("examtracker")
        .select("topic, category, subject, chapter", { count: "exact" });

      if (category) {
        query = query.eq("category", category.toUpperCase());
      }

      // Note: We'll filter by chapter in JavaScript to handle cases where chapter field might not exist
      // This makes the query more flexible

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

    // Filter by chapter name and group topics
    // chapterName comes from URL param [chaptername] - e.g., "laws-of-motion"
    // We need to find all rows where chapter field matches this chapter name
    const topicMap = {};
    
    // Normalize chapter name for matching (handle hyphens and spaces)
    const normalizedChapterName = chapterName.replace(/-/g, " ").toLowerCase().trim();
    
    if (isDev) {
      console.log(`🔍 [Cache] Filtering by chapter: "${chapterName}" (normalized: "${normalizedChapterName}")`);
      console.log(`📊 [Cache] Total rows fetched: ${allData.length}`);
    }
    
    allData.forEach(row => {
      if (!row.topic) return;
      
      // Check if this row belongs to the requested chapter
      let chapterMatches = false;
      
      // Priority 1: Check if row has a chapter field that matches
      if (row.chapter) {
        const normalizedRowChapter = row.chapter.replace(/-/g, " ").toLowerCase().trim();
        // Try exact match first (handles both "laws-of-motion" and "laws of motion")
        chapterMatches = normalizedRowChapter === normalizedChapterName;
        
        // If no exact match, try partial match
        if (!chapterMatches) {
          chapterMatches = 
            normalizedRowChapter.includes(normalizedChapterName) ||
            normalizedChapterName.includes(normalizedRowChapter);
        }
        
        if (isDev && chapterMatches) {
          console.log(`✅ [Cache] Match found - Row chapter: "${row.chapter}" matches "${chapterName}"`);
        }
      } else {
        // Priority 2: If no chapter field exists, check if topic matches (fallback for backward compatibility)
        const normalizedTopic = row.topic?.toLowerCase() || "";
        chapterMatches = 
          normalizedTopic.includes(normalizedChapterName) ||
          normalizedChapterName.includes(normalizedTopic);
        
        if (isDev && chapterMatches) {
          console.log(`⚠️ [Cache] Fallback match - No chapter field, using topic: "${row.topic}"`);
        }
      }
      
      if (chapterMatches) {
        const topicKey = row.topic.toLowerCase();
        if (!topicMap[topicKey]) {
          topicMap[topicKey] = {
            title: row.topic,
            count: 0,
            category: row.category,
            subject: row.subject,
            chapter: row.chapter || null
          };
        }
        topicMap[topicKey].count += 1;
      }
    });
    
    const topics = Object.values(topicMap);

    if (isDev) {
      console.log(`✅ [Cache] Found ${topics.length} topics for chapter: ${chapterName || subject}`);
    }
    
    return {
      chapterName: chapterName || subject,
      subject: subject,
      category: category,
      topics: topics.sort((a, b) => a.title.localeCompare(b.title)),
      totalTopics: topics.length,
      totalQuestions: topics.reduce((sum, t) => sum + t.count, 0)
    };
  };

// Create cached version - cache key will include parameters automatically
const getCachedTopics = (category, subject, chapterName) => {
  return unstable_cache(
    async () => {
      return await getCachedTopicsByChapter(category, subject, chapterName);
    },
    [`topics-by-chapter-${category}-${subject}-${chapterName}`],
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
    const chapter = searchParams.get("chapter");

    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is required" },
        { status: 400 }
      );
    }

    // Chapter parameter is required (comes from URL param [chaptername])
    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter parameter is required (from URL [chaptername])" },
        { status: 400 }
      );
    }

    // Decode URL parameters
    const decodedCategory = decodeURIComponent(category);
    const decodedSubject = subject ? decodeURIComponent(subject) : null;
    const decodedChapter = decodeURIComponent(chapter); // chapter is required

    if (isDev) {
      console.log("📖 [API] Fetching topics for chapter:", {
        category: decodedCategory,
        subject: decodedSubject,
        chapter: decodedChapter
      });
    }

    const result = await getCachedTopics(
      decodedCategory,
      decodedSubject,
      decodedChapter
    );

    if (isDev && result) {
      console.log(`✅ [API] Fetched ${result.topics.length} topics`);
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

