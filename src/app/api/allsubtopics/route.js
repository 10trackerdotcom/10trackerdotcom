import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cached data fetching function
const getCachedExamData = unstable_cache(
  async (category) => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.log("🔄 [Cache] Fetching data for category:", category);
    
    const allData = [];
    let from = 0;
    const pageSize = 1000;
    let fetchMore = true;

    while (fetchMore) {
      let query = supabase
        .from("examtracker")
        .select("subject, topic, category", { count: "exact" });

      if (category) {
        query = query.eq("category", category);
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

    // Process data
    const subjectsWithTopics = allData.reduce((acc, row) => {
      if (!row.subject || !row.topic) {
        return acc;
      }
      
      if (!acc[row.subject]) {
        acc[row.subject] = { subject: row.subject, subtopics: [] };
      }

      const topicIndex = acc[row.subject].subtopics.findIndex(
        (topic) => topic.title === row.topic
      );

      if (topicIndex === -1) {
        acc[row.subject].subtopics.push({
          title: row.topic,
          count: 1,
          category: row.category,
        });
      } else {
        acc[row.subject].subtopics[topicIndex].count += 1;
      }

      return acc;
    }, {});

    const result = Object.values(subjectsWithTopics);
    if (isDev) {
      console.log(`✅ [Cache] Processed ${result.length} subjects, ${allData.length} total records`);
    }
    
    return result;
  },
  // Cache key includes category - Next.js automatically includes function params in cache key
  [`exam-data`],
  {
    tags: ["examtracker"], // Tags for cache invalidation
    revalidate: 10, // Cache revalidation after 10 seconds (reduced from 30)
  }
);

export async function GET(req) {
  const isDev = process.env.NODE_ENV === 'development';
  
  try {
    const { searchParams } = new URL(req.url);
    let categoryParam = searchParams.get("category");
    
    // Handle URL decoding for categories with hyphens or special chars
    if (categoryParam) {
      categoryParam = decodeURIComponent(categoryParam);
    }
    
    if (!categoryParam) {
      return new Response(JSON.stringify({ error: "Category parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const category = categoryParam.toUpperCase();

    // Category is automatically part of cache key since it's a function parameter
    const subjectsData = await getCachedExamData(category);
    
    if (isDev && subjectsData) {
      console.log(`✅ [API] Fetched ${subjectsData.length} subjects for ${category}`);
    }

    return new Response(JSON.stringify({ subjectsData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    if (isDev) {
      console.error("❌ [API] Error:", error);
    }
    return new Response(JSON.stringify({ 
      error: error.message,
      details: isDev ? error.stack : undefined
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
