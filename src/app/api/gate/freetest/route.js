import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Replace with your Supabase URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Replace with your Supabase API Key
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { topics, number } = req.query;

    // Validate query parameters
    if (!topics || !number) {
      res.status(400).json({
        error: "Both 'topics' (comma-separated) and 'number' are required.",
      });
      return;
    }

    const topicsArray = topics.split("_");
    const questionsPerTopic = Math.floor(Number(number) / topicsArray.length);

    if (questionsPerTopic <= 0) {
      res.status(400).json({
        error: "Number of questions per topic must be greater than 0.",
      });
      return;
    }

    const questions = [];

    for (const topic of topicsArray) {
      const { data, error } = await supabase
        .from("gatequestions")
        .select("*")
        .eq("topic", topic)
        .limit(questionsPerTopic);

      if (error) {
        throw new Error(
          `Error fetching questions for topic '${topic}': ${error.message}`
        );
      }

      if (data) {
        questions.push(...data);
      }
    }

    res.status(200).json(questions);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
