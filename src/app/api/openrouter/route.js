import { NextResponse } from "next/server";

export async function POST(request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY environment variable" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const prompt = body?.prompt || "Hello!";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_TITLE || "cattracker",
      },
      body: JSON.stringify({
        model: "google/gemini-pro-2", // Correct model name
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
