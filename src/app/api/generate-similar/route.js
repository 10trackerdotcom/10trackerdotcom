import { NextRequest, NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "Missing OpenRouter API key" }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://10tracker.com";
    const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE || "10tracker.com";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": siteUrl,
        "X-Title": siteTitle,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
          {
            role: "system",
            content:
              "You are a tutor that generates a single similar multiple-choice question only. Keep it concise, GATE-CSE style, same topic and difficulty. Use plain text and MathJax for math. Provide 4 options (A-D) and the correct answer with 1-2 line explanation. Do not include external references.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: 500 });
    }

    const json = await response.json();
    const content =
      json?.choices?.[0]?.message?.content?.trim() ||
      "Could not generate a similar question at the moment.";

    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
