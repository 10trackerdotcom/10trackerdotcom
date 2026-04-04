import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const isDev = process.env.NODE_ENV === "development";

const normalize = (v) =>
  String(v ?? "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Fetch topics for a given category + subject + chapter.
 * All filtering pushed to Supabase — no full table scans.
 *
 * Index recommendation: (category, chapter) composite index on `examtracker`
 */
const fetchTopicsByChapter = async (category, subject, chapterName) => {
  if (isDev) console.log("🔄 fetchTopicsByChapter", { category, subject, chapterName });

  // chapterName arrives as a slug: "laws-of-motion"
  // DB may store it as "Laws of Motion" or "laws-of-motion" — build variants
  const chapterVariants = Array.from(
    new Set([
      chapterName,                                              // "laws-of-motion"
      chapterName.replace(/-/g, " "),                          // "laws of motion"
      chapterName.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), // "Laws Of Motion"
      normalize(chapterName),                                   // "laws of motion"
    ])
  );

  let query = supabase
    .from("examtracker")
    .select("topic, subject, category, chapter")
    .eq("category", category.toUpperCase())
    .in("chapter", chapterVariants)
    .not("topic", "is", null);

  // Narrow by subject if provided
  if (subject) {
    const subjectVariants = Array.from(
      new Set([
        subject,
        subject.replace(/-/g, " "),
        subject.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        normalize(subject),
      ])
    );
    query = query.in("subject", subjectVariants);
  }

  const { data, error } = await query;

  if (error) {
    if (isDev) console.error("❌ Supabase error:", error);
    throw error;
  }

  let rows = data || [];

  // ── Fallback: ilike on chapter if exact match returned nothing ─────────────
  if (rows.length === 0) {
    if (isDev) console.log("⚠️  No exact chapter match — trying ilike fallback");
    const normalizedChapter = normalize(chapterName);

    let fallbackQuery = supabase
      .from("examtracker")
      .select("topic, subject, category, chapter")
      .eq("category", category.toUpperCase())
      .ilike("chapter", `%${normalizedChapter}%`)
      .not("topic", "is", null);

    if (subject) {
      const subjectVariants = Array.from(
        new Set([
          subject,
          subject.replace(/-/g, " "),
          subject.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          normalize(subject),
        ])
      );
      fallbackQuery = fallbackQuery.in("subject", subjectVariants);
    }

    const { data: fd, error: fe } = await fallbackQuery;
    if (fe) throw fe;
    rows = fd || [];
  }

  if (isDev) console.log(`📊 Rows returned from DB: ${rows.length}`);

  // ── Group by topic ─────────────────────────────────────────────────────────
  const topicMap = {};

  rows.forEach((row) => {
    if (!row.topic) return;
    const key = row.topic.toLowerCase();

    if (!topicMap[key]) {
      topicMap[key] = {
        title:   row.topic,
        count:   0,
        category: row.category,
        subject:  row.subject,
        chapter:  row.chapter ?? null,
      };
    }
    topicMap[key].count += 1;
  });

  const topics = Object.values(topicMap).sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  if (isDev) console.log(`✅ ${topics.length} topics found`);

  return {
    chapterName,
    subject,
    category,
    topics,
    totalTopics:    topics.length,
    totalQuestions: topics.reduce((s, t) => s + t.count, 0),
  };
};

const getTopicsCached = (category, subject, chapterName) =>
  unstable_cache(
    () => fetchTopicsByChapter(category, subject, chapterName),
    [`topics-by-chapter-${category}-${subject}-${chapterName}`],
    { tags: ["examtracker"], revalidate: 300 }
  )();

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subject  = searchParams.get("subject");
    const chapter  = searchParams.get("chapter");

    if (!category) {
      return NextResponse.json(
        { success: false, error: "category parameter is required" },
        { status: 400 }
      );
    }
    if (!chapter) {
      return NextResponse.json(
        { success: false, error: "chapter parameter is required" },
        { status: 400 }
      );
    }

    const decodedCategory = decodeURIComponent(category);
    const decodedSubject  = subject ? decodeURIComponent(subject) : null;
    const decodedChapter  = decodeURIComponent(chapter);

    const result = await getTopicsCached(
      decodedCategory,
      decodedSubject,
      decodedChapter
    );

    return NextResponse.json(
      { success: true, data: result },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    if (isDev) console.error("❌ [by-chapter] route error:", error);
    return NextResponse.json(
      {
        success: false,
        error:   "Internal server error",
        details: isDev ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}