import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint aggregates Supabase user_progress and enriches it with Clerk user metadata
// (email, name, avatar) fetched via Clerk's REST API using CLERK_SECRET_KEY.
// The /admin/users UI is already admin-gated via AuthContext.isAdmin.
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const clerkSecret = process.env.CLERK_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("user_progress")
      .select(
        "user_id, topic, area, points, completedquestions, correctanswers"
      );

    if (error) {
      console.error("Supabase user_progress error:", error);
      return NextResponse.json(
        { error: "Failed to fetch user progress" },
        { status: 500 }
      );
    }

    // Aggregate usage by user_id and area/topic
    const byUser = {};

    (data || []).forEach((row) => {
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

      if (!byUser[userId]) {
        byUser[userId] = {
          userId,
          totalPoints: 0,
          totalCompleted: 0,
          totalCorrect: 0,
          areas: {}, // area -> { area, topics: Set, completed, correct, points }
        };
      }

      const userEntry = byUser[userId];
      userEntry.totalPoints += points;
      userEntry.totalCompleted += completedCount;
      userEntry.totalCorrect += correctCount;

      if (!userEntry.areas[area]) {
        userEntry.areas[area] = {
          area,
          topics: new Set(),
          completed: 0,
          correct: 0,
          points: 0,
        };
      }

      const areaEntry = userEntry.areas[area];
      areaEntry.topics.add(topic);
      areaEntry.completed += completedCount;
      areaEntry.correct += correctCount;
      areaEntry.points += points;
    });

    // Build base user list from Supabase usage
    let users = Object.values(byUser).map((u) => ({
      id: u.userId,
      email: null,
      name: u.userId,
      createdAt: null,
      lastSignInAt: null,
      imageUrl: null,
      usage: {
        totalPoints: u.totalPoints,
        totalCompleted: u.totalCompleted,
        totalCorrect: u.totalCorrect,
        areas: Object.values(u.areas).map((a) => ({
          area: a.area,
          topicsCount: a.topics.size,
          completed: a.completed,
          correct: a.correct,
          points: a.points,
        })),
      },
    }));

    // Optionally enrich with Clerk metadata if CLERK_SECRET_KEY is configured
    if (clerkSecret && users.length > 0) {
      try {
        // Fetch all Clerk users for this instance (up to 500)
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

        if (clerkRes.ok) {
          const clerkJson = await clerkRes.json();
          const clerkUsers = Array.isArray(clerkJson)
            ? clerkJson
            : clerkJson?.data || [];

          const clerkById = new Map(
            clerkUsers.map((u) => [u.id, u])
          );

          users = users.map((u) => {
            const cu = clerkById.get(u.id);
            if (!cu) return u;

            const primaryEmail =
              cu.primary_email_address?.email_address ||
              cu.email_addresses?.[0]?.email_address ||
              cu.email ||
              null;
            const name = `${cu.first_name || ""} ${cu.last_name || ""}`.trim();

            return {
              ...u,
              email: primaryEmail,
              name: name || primaryEmail || u.name,
              createdAt: cu.created_at || u.createdAt,
              lastSignInAt: cu.last_sign_in_at || cu.updated_at || u.lastSignInAt,
              imageUrl: cu.profile_image_url || u.imageUrl,
            };
          });
        } else {
          const text = await clerkRes.text();
          console.error("Clerk users API error:", clerkRes.status, text);
        }
      } catch (clerkErr) {
        console.error("Failed to enrich users with Clerk data:", clerkErr);
      }
    }

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}

