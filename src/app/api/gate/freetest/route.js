import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Replace with your Supabase URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Replace with your Supabase API Key
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topics = searchParams.get("topics");
    const number = searchParams.get("number");

    // Validate query parameters
    if (!topics || !number) {
      return NextResponse.json(
        {
        error: "Both 'topics' (comma-separated) and 'number' are required.",
        },
        { status: 400 }
      );
    }

    const topicsArray = topics.split("_");
    const questionsPerTopic = Math.floor(Number(number) / topicsArray.length);

    if (questionsPerTopic <= 0) {
      return NextResponse.json(
        { error: "Number of questions per topic must be greater than 0." },
        { status: 400 }
      );
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

    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error("Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
