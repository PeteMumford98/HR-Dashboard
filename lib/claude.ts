import { FORMAT_SYSTEM_PROMPT, REVIEW_SYSTEM_PROMPT } from "./prompts";

// ── Model tiering ────────────────────────────────────────
// Cheap mechanical pass on Haiku; guideline reasoning on Sonnet.
// Swap strings here if Anthropic releases newer models.
export const FORMAT_MODEL = "claude-haiku-4-5-20251001";
export const REVIEW_MODEL = "claude-sonnet-4-6";

const API_URL = "https://api.anthropic.com/v1/messages";

type ClaudeBlock = { type: string; text?: string };

async function callClaude(body: Record<string, unknown>): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("YOUR_")) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env (see .env.example).");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Claude API error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  // Assemble text blocks by type, never by position.
  return (data.content as ClaudeBlock[])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n");
}

// Pass 1: structure the raw note. No judgement.
export async function formatPass(rawNote: string): Promise<string> {
  return callClaude({
    model: FORMAT_MODEL,
    max_tokens: 1500,
    system: FORMAT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: `RAW MEETING NOTE:\n\n${rawNote}` }],
  });
}

export type ReviewResult = {
  content: string;
  flags: { issue: string; severity: "high" | "medium" | "low"; location: string }[];
  suggestions: string[];
};

// Pass 2: review against the guidelines. Returns structured JSON.
export async function reviewPass(
  formatted: string,
  guidelines: { title: string; content: string }[]
): Promise<ReviewResult> {
  const guidelinesText = guidelines
    .map((g) => `### ${g.title}\n${g.content}`)
    .join("\n\n");

  const raw = await callClaude({
    model: REVIEW_MODEL,
    max_tokens: 3000,
    system: REVIEW_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `GUIDELINES:\n${guidelinesText}\n\nWRITE-UP TO REVIEW:\n${formatted}`,
      },
    ],
  });

  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      content: typeof parsed.content === "string" ? parsed.content : formatted,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    // Model returned non-JSON: keep the formatted text, surface the problem as a flag.
    return {
      content: formatted,
      flags: [{ issue: "Automatic review failed to parse. Check this write-up by hand.", severity: "high", location: "whole document" }],
      suggestions: [],
    };
  }
}

// Demo fallback used when ANTHROPIC_API_KEY isn't set, so the create-a-write-up
// flow still works end to end in a prototype without any API keys configured.
export function demoFormatPass(rawNote: string): string {
  return `## Summary\n${rawNote.trim().split("\n")[0]}\n\n## Notes\n${rawNote.trim()}\n\n## Agreed actions\n- (add actions and owners here)\n\n## Follow-up date\n(add a date)`;
}

export function demoReviewPass(formatted: string): ReviewResult {
  return {
    content: formatted,
    flags: [{ issue: "This write-up was generated in demo mode without a Claude API key, so no AI review ran.", severity: "medium", location: "whole document" }],
    suggestions: ["Add ANTHROPIC_API_KEY to enable real formatting and guideline review."],
  };
}
