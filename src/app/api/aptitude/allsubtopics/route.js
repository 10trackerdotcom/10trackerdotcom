import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Replace with your Supabase URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Replace with your Supabase API Key
const supabase = createClient(supabaseUrl, supabaseKey);

// Handler for GET requests
export async function GET(req) {
  try {
    const allData = [];
    let from = 0;
    const pageSize = 1000; // Fetch 1,000 rows at a time
    let fetchMore = true;

    // Fetch all rows in batches
    while (fetchMore) {
      const { data, error, count } = await supabase
        .from("aptitudequestions")
        .select("subject, topic", { count: "exact" })
        .range(from, from + pageSize - 1);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      if (data) {
        allData.push(...data);
        from += pageSize; // Move to the next batch
        fetchMore = data.length === pageSize; // Continue fetching if the last batch was full
      } else {
        fetchMore = false;
      }
    }

    // Group data by subject and topic, and count unique occurrences
    const subjectsWithTopics = allData.reduce((acc, row) => {
      if (!acc[row.subject]) {
        acc[row.subject] = { subject: row.subject, subtopics: [] };
      }
      // Check if the topic already exists in the subtopics array
      const topicIndex = acc[row.subject].subtopics.findIndex(
        (topic) => topic.title === row.topic
      );
      if (topicIndex === -1) {
        acc[row.subject].subtopics.push({ title: row.topic, count: 1 });
      } else {
        acc[row.subject].subtopics[topicIndex].count += 1;
      }
      return acc;
    }, {});

    // Convert the result into an array
    const subjectsData = Object.values(subjectsWithTopics);

    return new Response(
      JSON.stringify({
        subjectsData,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
