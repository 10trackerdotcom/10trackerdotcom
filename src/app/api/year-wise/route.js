import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cached RPC function call
const getCachedYearDataRPC = unstable_cache(
  async (category) => {
    try {
      // Call the get_year_data RPC function with the category parameter
      const { data, error } = await supabase
        .rpc('get_year_data', { category_param: category });
        
      if (error) throw error;
      
      // Sort by year (if possible)
      data.sort((a, b) => {
        // Try to extract year numbers for comparison
        const yearA = a.year.match(/\d{4}/);
        const yearB = b.year.match(/\d{4}/);
        
        if (yearA && yearB) {
          return parseInt(yearB[0]) - parseInt(yearA[0]); // Sort descending
        }
        return a.year.localeCompare(b.year); // Fallback to string comparison
      });
      
      return data;
    } catch (error) {
      console.error("Error calling RPC function:", error);
      throw error;
    }
  },
  ["exam-year-data-rpc"], // Cache key prefix
  {
    tags: ["examtracker"], // Tags for cache invalidation
    revalidate: 60, // Cache revalidation after 60 seconds
  }
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.toUpperCase();

    if (!category) {
      return new Response(JSON.stringify({ error: "Category parameter is required" }), {
        status: 400,
      });
    }

    const yearData = await getCachedYearDataRPC(category);

    return new Response(JSON.stringify({ yearData }), {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching year data:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}