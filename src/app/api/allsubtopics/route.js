import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cached data fetching function
const getCachedExamData = unstable_cache(
  async (category) => {
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

      if (error) throw error;

      if (data) {
        allData.push(...data);
        from += pageSize;
        fetchMore = data.length === pageSize;
      } else {
        fetchMore = false;
      }
    }

    // Process data
    const subjectsWithTopics = allData.reduce((acc, row) => {
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

    return Object.values(subjectsWithTopics);
  },
  ["exam-data"], // Cache key prefix
  {
    tags: ["examtracker"], // Tags for cache invalidation
    revalidate: 30, // Cache revalidation after 30 seconds (in seconds)
  }
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category").toUpperCase();

    const subjectsData = await getCachedExamData(category);

    return new Response(JSON.stringify({ subjectsData }), {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30", // Cache for 30 seconds, stale-while-revalidate for 30 seconds
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
