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

const rowDedupeKey = (row) =>
  `${row.category ?? ""}\x01${row.subject ?? ""}\x01${row.chapter ?? ""}\x01${row.topic ?? ""}`;

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

const fetchChaptersBySubject = async (category, subject) => {
  if (isDev) console.log("🔄 fetchChaptersBySubject", { category, subject });

  const normalizedSubject = normalize(subject);
  const categoryUpper = category.toUpperCase();

  const subjectVariants = Array.from(
    new Set([
      subject,
      subject.replace(/-/g, " "),
      subject.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      normalizedSubject,
    ])
  );

  // ── Run exact + ilike queries in parallel ──────────────────────────────────
  const exactPromise = fetchAllRows((from, to) =>
    supabase
      .from("examtracker")
      .select("chapter, subject, category, topic")
      .eq("category", categoryUpper)
      .in("subject", subjectVariants)
      .not("chapter", "is", null)
      .range(from, to)
  );

  const ilikePromise =
    normalizedSubject.length >= 2
      ? fetchAllRows((from, to) =>
          supabase
            .from("examtracker")
            .select("chapter, subject, category, topic")
            .eq("category", categoryUpper)
            .ilike("subject", `%${normalizedSubject}%`)
            .not("chapter", "is", null)
            .range(from, to)
        )
      : Promise.resolve([]);

  const [exactRows, fuzzyRows] = await Promise.all([exactPromise, ilikePromise]);

  // ── Deduplicate: exact rows first, then merge ilike additions ─────────────
  const seen = new Set(exactRows.map(rowDedupeKey));
  const rows = [...exactRows];

  for (const row of fuzzyRows) {
    const k = rowDedupeKey(row);
    if (!seen.has(k)) {
      seen.add(k);
      rows.push(row);
    }
  }

  if (isDev) {
    if (rows.length === 0) console.log("⚠️  No rows after exact + ilike merge");
    console.log(`📊 Total rows: ${rows.length} (exact: ${exactRows.length}, ilike new: ${rows.length - exactRows.length})`);
  }

  // ── Group by chapter, aggregate topics ────────────────────────────────────
  const chapterMap = new Map();

  for (const row of rows) {
    if (!row.chapter) continue;

    const chapterSlug = row.chapter.toLowerCase().replace(/\s+/g, "-").trim();
    const topicTitle = row.topic ? String(row.topic).trim() : null;
    const topicKey = topicTitle ? topicTitle.toLowerCase() : null;

    let ch = chapterMap.get(chapterSlug);
    if (!ch) {
      ch = {
        title: row.chapter,
        slug: chapterSlug,
        count: 0,
        category: row.category,
        subject: row.subject,
        _topicCounts: new Map(),
      };
      chapterMap.set(chapterSlug, ch);
    }

    ch.count += 1;

    if (topicKey) {
      const existing = ch._topicCounts.get(topicKey);
      ch._topicCounts.set(topicKey, {
        title: topicTitle,
        slug: topicKey.replace(/\s+/g, "-"),
        count: (existing?.count || 0) + 1,
      });
    }
  }

  const chapters = Array.from(chapterMap.values())
    .map(({ _topicCounts, ...rest }) => ({
      ...rest,
      topics: Array.from(_topicCounts.values()).sort((a, b) =>
        a.title.localeCompare(b.title)
      ),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (isDev) console.log(`✅ ${chapters.length} chapters found`);

  return {
    subject,
    category,
    chapters,
    totalChapters: chapters.length,
    totalQuestions: chapters.reduce((s, c) => s + c.count, 0),
  };
};

const getChaptersCached = unstable_cache(
  fetchChaptersBySubject,
  ["chapters-by-subject"],
  { tags: ["examtracker"], revalidate: 300 }
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subject = searchParams.get("subject");

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

    const result = await getChaptersCached(
      decodeURIComponent(category),
      decodeURIComponent(subject)
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
    if (isDev) console.error("❌ [by-subject] route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: isDev ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}