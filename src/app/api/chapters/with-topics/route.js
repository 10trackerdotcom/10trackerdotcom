import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const isDev = process.env.NODE_ENV === "development";

/**
 * Normalize a subject/chapter string for consistent matching.
 * "Medieval-History" → "medieval history"
 */
const normalize = (v) =>
  String(v ?? "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Fetch chapters for a given category + subject directly from Supabase.
 * All filtering is done IN the DB query — no full table scans in JS.
 *
 * DB columns used: category, subject, chapter, topic
 * Index recommendation: (category, subject) composite index on `examtracker`
 */
const fetchChaptersBySubject = async (category, subject) => {
  if (isDev) console.log("🔄 fetchChaptersBySubject", { category, subject });

  // ── Build subject variants to match DB values ──────────────────────────────
  // URL sends "medieval-history", DB might store "Medieval History" or "medieval-history"
  const subjectVariants = Array.from(
    new Set([
      subject,                                          // raw: "medieval-history"
      subject.replace(/-/g, " "),                       // "medieval history"
      subject.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), // "Medieval History"
      normalize(subject),                               // "medieval history"
    ])
  );

  // ── Single Supabase query — only columns we need ───────────────────────────
  // We try each subject variant. Using .in() so it's still one round-trip.
  const { data, error } = await supabase
    .from("examtracker")
    .select("chapter, subject, category, topic")
    .eq("category", category.toUpperCase())
    .in("subject", subjectVariants)
    .not("chapter", "is", null);    // skip rows with no chapter

  if (error) {
    if (isDev) console.error("❌ Supabase error:", error);
    throw error;
  }

  // ── Fallback: if .in() returned nothing, try ilike (partial match) ─────────
  let rows = data || [];

  if (rows.length === 0) {
    if (isDev) console.log("⚠️  No exact subject match — trying ilike fallback");
    const normalized = normalize(subject);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("examtracker")
      .select("chapter, subject, category, topic")
      .eq("category", category.toUpperCase())
      .ilike("subject", `%${normalized}%`)
      .not("chapter", "is", null);

    if (fallbackError) throw fallbackError;
    rows = fallbackData || [];
  }

  if (isDev) console.log(`📊 Rows returned from DB: ${rows.length}`);

  // ── Group by chapter in JS (only on the small filtered set) ───────────────
  const chapterMap = {};

  rows.forEach((row) => {
    if (!row.chapter) return;
    const key = row.chapter.toLowerCase().replace(/\s+/g, "-").trim();

    if (!chapterMap[key]) {
      chapterMap[key] = {
        title:    row.chapter,
        slug:     key,
        count:    0,
        category: row.category,
        subject:  row.subject,
      };
    }
    chapterMap[key].count += 1;
  });

  const chapters = Object.values(chapterMap).sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  if (isDev) console.log(`✅ ${chapters.length} chapters found`);

  return {
    subject,
    category,
    chapters,
    totalChapters:  chapters.length,
    totalQuestions: chapters.reduce((s, c) => s + c.count, 0),
  };
};

/**
 * Stable cached wrapper.
 * unstable_cache is called ONCE per unique key — not recreated per request.
 */
const getChaptersCached = (category, subject) =>
  unstable_cache(
    () => fetchChaptersBySubject(category, subject),
    [`chapters-by-subject-${category}-${subject}`],
    { tags: ["examtracker"], revalidate: 300 }   // 5 min
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

    const result = await getChaptersCached(decodedCategory, decodedSubject);

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
    if (isDev) console.error("❌ [by-subject] route error:", error);
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