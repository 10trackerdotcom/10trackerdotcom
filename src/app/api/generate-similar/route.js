import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Detect question type from stem text — drives rewrite rules + token budget
const TYPE = {
  ASSERTION:     /Assertion\s*\(A\)|Reason\s*\(R\)/i,
  MULTI_STMT:    /consider the following|which of the following statements/i,
  MATCH:         /Match.*List|match.*column|match.*following/i,
  PLAIN:         /.*/,   // fallback
};

// Per-type token budgets: assertion/match need more room; plain facts need less
const TOKEN_BUDGET = {
  ASSERTION:  220,
  MULTI_STMT: 260,
  MATCH:      180,  // match stem is short — table stays unchanged
  PLAIN:      140,
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rewrite system prompt.
 *
 * Design principles:
 * - Explicit PRESERVE / CHANGE split so GPT has zero ambiguity
 * - Type-aware rules inline — handles all 4 question types in one prompt
 * - Hard output contract: stem only, no labels, no markdown
 * - Token-efficient: no padding, no examples (few-shot costs tokens we don't need here)
 */
const REWRITE_SYSTEM = `You rewrite Indian competitive exam question stems to avoid copyright while preserving full meaning and testability.

PRESERVE EXACTLY — never alter:
• All proper nouns, person names, place names, organisation names
• All dates, years, centuries, regnal periods
• All numerical values, percentages, measurements, scientific constants
• All acts, treaties, policies, schemes by their official name
• The correct answer (the stem must still have the same answer)
• Difficulty level and cognitive demand
• Question type structure (see TYPE RULES below)

CHANGE — rephrase every sentence:
• Reword the question sentence using different vocabulary and syntax
• Vary interrogative framing ("Which", "Who", "What", "Identify", "Select", etc.)
• Restructure clauses while retaining logical meaning

TYPE RULES:
1. PLAIN: Rewrite the question sentence only.
2. MULTI-STATEMENT (contains "I. II. III." or similar):
   • Rewrite the opening question sentence
   • Rewrite each statement (I, II, III…) — vary wording, keep factual content identical
   • Rewrite the closing question ("Which of the statements above is/are correct?")
   • Keep <br> tags exactly as they appear
3. ASSERTION-REASON (contains "Assertion (A):" and "Reason (R):"):
   • Rewrite each of Assertion and Reason in fresh language, facts unchanged
   • Reproduce the Codes block VERBATIM — do not touch it
   • Keep <br> tags exactly as they appear
4. MATCH (contains "Match List" or "Match Column"):
   • Rewrite the stem sentence only ("Match List I with List II…")
   • Do NOT touch the table — it is provided separately and unchanged
   • Output the rewritten sentence only

OUTPUT CONTRACT:
• Output the rewritten stem ONLY
• No options, no answer key, no labels like "Rewritten:", no markdown, no quotes
• Preserve all <br> tags in their original positions`;

const GENERATE_SYSTEM = `You are a tutor generating a single similar multiple-choice question for Indian competitive exam practice (UPSC/State PSC style). Match the topic, format, and difficulty of the original. Use plain text; use MathJax (\\( \\)) for any math. Provide 4 options (A–D) and the correct answer with a 1–2 line explanation. No external references.`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function detectType(question) {
  if (TYPE.ASSERTION.test(question))  return "ASSERTION";
  if (TYPE.MULTI_STMT.test(question)) return "MULTI_STMT";
  if (TYPE.MATCH.test(question))      return "MATCH";
  return "PLAIN";
}

function buildRewriteUserMessage(question, qType) {
  // For match questions the stem is just the first sentence before <br>
  // For all others send the full stem — GPT knows what to rewrite per type rules
  const label = {
    PLAIN:      "PLAIN question",
    MULTI_STMT: "MULTI-STATEMENT question",
    ASSERTION:  "ASSERTION-REASON question",
    MATCH:      "MATCH question (rewrite stem sentence only)",
  }[qType];

  return `TYPE: ${label}\n\n${question.trim()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPENAI CALL
// ─────────────────────────────────────────────────────────────────────────────

async function callOpenAI({ system, user, maxTokens, temperature, apiKey }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user",   content: user   },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content?.trim() ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { mode, question, prompt, maxTokens } = body;

    // ── Mode: rewrite-question ───────────────────────────────────────────────
    if (mode === "rewrite-question") {
      if (!question || typeof question !== "string" || !question.trim()) {
        return NextResponse.json({ error: "question is required for rewrite mode" }, { status: 400 });
      }

      const qType     = detectType(question);
      const budget    = TOKEN_BUDGET[qType];
      // Respect caller override but cap sensibly
      const tokenCap  = maxTokens
        ? Math.max(64, Math.min(400, Number(maxTokens)))
        : budget;

      const content = await callOpenAI({
        system:      REWRITE_SYSTEM,
        user:        buildRewriteUserMessage(question, qType),
        maxTokens:   tokenCap,
        temperature: 0.35,   // low enough for factual faithfulness, slight variation
        apiKey,
      });

      if (!content) {
        return NextResponse.json({ error: "Empty response from model" }, { status: 502 });
      }

      return NextResponse.json({ content, qType });
    }

    // ── Mode: generate (default) ─────────────────────────────────────────────
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const tokenCap = maxTokens
      ? Math.max(64, Math.min(800, Number(maxTokens)))
      : 512;

    const content = await callOpenAI({
      system:      GENERATE_SYSTEM,
      user:        prompt.trim(),
      maxTokens:   tokenCap,
      temperature: 0.8,
      apiKey,
    });

    return NextResponse.json({
      content: content || "Could not generate a question at this time.",
    });

  } catch (err) {
    console.error("[gpt route]", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}