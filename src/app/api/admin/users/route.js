import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Source of truth: Clerk user list (all registered users with email).
// Join Supabase user_progress by user_id: if present, show usage; if not, show — in usage columns.
export async function GET() {
  try {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!clerkSecret) {
      return NextResponse.json(
        { error: "CLERK_SECRET_KEY is not configured" },
        { status: 500 }
      );
    }

    // 1) Fetch all Clerk users (primary source for id + email + name)
    const clerkRes = await fetch(
      "https://api.clerk.com/v1/users?limit=500",
      {
        headers: {
          Authorization: `Bearer ${clerkSecret}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!clerkRes.ok) {
      const text = await clerkRes.text();
      console.error("Clerk users API error:", clerkRes.status, text);
      return NextResponse.json(
        { error: "Failed to fetch users from Clerk" },
        { status: 500 }
      );
    }

    const clerkJson = await clerkRes.json();
    const clerkUsers = Array.isArray(clerkJson)
      ? clerkJson
      : clerkJson?.data || [];

    // 2) Fetch Supabase user_progress and aggregate by user_id
    let usageByUserId = {};

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("user_progress")
        .select(
          "user_id, topic, area, points, completedquestions, correctanswers"
        );

      if (!error && data && data.length > 0) {
        data.forEach((row) => {
          const userId = row.user_id || "unknown";
          const area = row.area || "unknown";
          const topic = row.topic || "unknown-topic";
          const completedCount = Array.isArray(row.completedquestions)
            ? row.completedquestions.length
            : 0;
          const correctCount = Array.isArray(row.correctanswers)
            ? row.correctanswers.length
            : 0;
          const points = row.points || 0;

          if (!usageByUserId[userId]) {
            usageByUserId[userId] = {
              totalPoints: 0,
              totalCompleted: 0,
              totalCorrect: 0,
              areas: {},
            };
          }

          const entry = usageByUserId[userId];
          entry.totalPoints += points;
          entry.totalCompleted += completedCount;
          entry.totalCorrect += correctCount;

          if (!entry.areas[area]) {
            entry.areas[area] = {
              area,
              topics: new Set(),
              completed: 0,
              correct: 0,
              points: 0,
            };
          }
          const areaEntry = entry.areas[area];
          areaEntry.topics.add(topic);
          areaEntry.completed += completedCount;
          areaEntry.correct += correctCount;
          areaEntry.points += points;
        });
      }
    }

    // 3) Build final list: one row per Clerk user, join usage from Supabase by user_id
    const users = clerkUsers.map((cu) => {
      const primaryEmail =
        cu.primary_email_address?.email_address ||
        cu.email_addresses?.[0]?.email_address ||
        cu.email ||
        null;
      const name =
        `${cu.first_name || ""} ${cu.last_name || ""}`.trim() ||
        primaryEmail ||
        cu.id;

      const rawUsage = usageByUserId[cu.id];
      const usage = rawUsage
        ? {
            totalPoints: rawUsage.totalPoints,
            totalCompleted: rawUsage.totalCompleted,
            totalCorrect: rawUsage.totalCorrect,
            areas: Object.values(rawUsage.areas).map((a) => ({
              area: a.area,
              topicsCount: a.topics.size,
              completed: a.completed,
              correct: a.correct,
              points: a.points,
            })),
          }
        : null;

      return {
        id: cu.id,
        email: primaryEmail,
        name,
        createdAt: cu.created_at || null,
        lastSignInAt: cu.last_sign_in_at || cu.updated_at || null,
        imageUrl: cu.profile_image_url || null,
        usage,
      };
    });

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}
