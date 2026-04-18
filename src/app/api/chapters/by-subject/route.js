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

const PAGE_SIZE = 1000;

async function fetchAllRows(rangeQuery) {
  const acc = [];
  let from = 0;
  for (;;) {
    const { data, error } = await rangeQuery(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const batch = data ?? [];
    acc.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return acc;
}

/**
 * Single DB query that returns chapters AND topics for a category+subject.
 * The frontend previously made 1 + N calls (chapters, then one per chapter).
 * This route collapses all of that into ONE Supabase query.
 *
 * Response shape:
 * {
 *   success: true,
 *   data: {
 *     chapters: [
 *       {
 *         title, slug, count, category, subject,
 *         topics: [{ title, count, category, subject, chapter }]
 *       }
 *     ],
 *     totalChapters, totalQuestions
 *   }
 * }
 */
const fetchChaptersWithTopics = async (category, subject) => {
  if (isDev) console.log("🔄 fetchChaptersWithTopics", { category, subject });

  const subjectVariants = Array.from(
    new Set([
      subject,
      subject.replace(/-/g, " "),
      subject.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      normalize(subject),
    ])
  );

  let rows = await fetchAllRows((from, to) =>
    supabase
      .from("examtracker")
      .select("chapter, topic, subject, category")
      .eq("category", category.toUpperCase())
      .in("subject", subjectVariants)
      .not("chapter", "is", null)
      .not("topic", "is", null)
      .range(from, to)
  );

  const ns = normalize(subject);
  if (rows.length === 0 && ns.length >= 2) {
    if (isDev) console.log("⚠️  Trying ilike subject fallback");
    rows = await fetchAllRows((from, to) =>
      supabase
        .from("examtracker")
        .select("chapter, topic, subject, category")
        .eq("category", category.toUpperCase())
        .ilike("subject", `%${ns}%`)
        .not("chapter", "is", null)
        .not("topic", "is", null)
        .range(from, to)
    );
  }

  if (isDev) console.log(`📊 Total rows: ${rows.length}`);

  // ── Group into chapterMap → topicMap in a single pass ─────────────────────
  const chapterMap = {};

  rows.forEach((row) => {
    const chapterKey = row.chapter.toLowerCase().replace(/\s+/g, "-").trim();
    const topicKey   = row.topic.toLowerCase();

    if (!chapterMap[chapterKey]) {
      chapterMap[chapterKey] = {
        title:     row.chapter,
        slug:      chapterKey,
        count:     0,
        category:  row.category,
        subject:   row.subject,
        topicMap:  {},           // temporary — removed before returning
      };
    }

    const chapter = chapterMap[chapterKey];
    chapter.count += 1;

    if (!chapter.topicMap[topicKey]) {
      chapter.topicMap[topicKey] = {
        title:    row.topic,
        count:    0,
        category: row.category,
        subject:  row.subject,
        chapter:  row.chapter,
      };
    }
    chapter.topicMap[topicKey].count += 1;
  });

  // ── Convert topicMap → sorted topics array, remove temp key ───────────────
  const chapters = Object.values(chapterMap)
    .map(({ topicMap, ...rest }) => ({
      ...rest,
      topics: Object.values(topicMap).sort((a, b) =>
        a.title.localeCompare(b.title)
      ),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (isDev) {
    console.log(
      `✅ ${chapters.length} chapters, ` +
      `${chapters.reduce((s, c) => s + c.topics.length, 0)} topics`
    );
  }

  return {
    subject,
    category,
    chapters,
    totalChapters:  chapters.length,
    totalQuestions: chapters.reduce((s, c) => s + c.count, 0),
  };
};

const getChaptersWithTopicsCached = (category, subject) =>
  unstable_cache(
    () => fetchChaptersWithTopics(category, subject),
    [`chapters-with-topics-${category}-${subject}`],
    { tags: ["examtracker"], revalidate: 300 }   // 5 min server cache
  )();

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subject  = searchParams.get("subject");

    if (!category) {
      return NextResponse.json(
        { success: false, error: "category parameter is required" },
        { status: 400 }
      );
    }
    if (!subject) {
      return NextResponse.json(
        { success: false, error: "subject parameter is required" },
        { status: 400 }
      );
    }

    const decodedCategory = decodeURIComponent(category);
    const decodedSubject  = decodeURIComponent(subject);

    const result = await getChaptersWithTopicsCached(
      decodedCategory,
      decodedSubject
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
    if (isDev) console.error("❌ [with-topics] route error:", error);
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