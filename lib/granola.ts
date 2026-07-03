// Granola note retrieval.
//
// Two modes, set by GRANOLA_MODE in .env:
//   paste  → the HR lead pastes the note into the dashboard. Works day one,
//            no Granola account wiring needed. Recommended starting point.
//   mcp    → fetch the note live from Granola's hosted MCP server by
//            attaching it to a Claude API call. Needs a Granola OAuth token
//            and a Business or Enterprise plan for transcript access.
//
// The mcp path works by giving Claude the Granola MCP server as a tool and
// asking it to return the note verbatim. That avoids writing a Granola REST
// client, at the cost of one extra (cheap) model call.

const GRANOLA_MCP_URL = "https://mcp.granola.ai/mcp";

export function granolaMode(): "paste" | "mcp" {
  return process.env.GRANOLA_MODE === "mcp" ? "mcp" : "paste";
}

export async function fetchNoteFromGranola(noteRef: string): Promise<string> {
  const authToken = process.env.GRANOLA_MCP_AUTH_TOKEN;
  if (!authToken || authToken.startsWith("YOUR_")) {
    throw new Error(
      "GRANOLA_MCP_AUTH_TOKEN is not set. Either complete the Granola OAuth setup or switch GRANOLA_MODE back to 'paste'."
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      // MCP connector on the Messages API sits behind a beta flag; adjust the
      // header value if Anthropic's docs list a newer one.
      "anthropic-beta": "mcp-client-2025-04-04",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content:
            `Use the Granola tools to find and read this meeting note: "${noteRef}". ` +
            `It may be a note title, a note id, or a date and person. ` +
            `Return the full note content verbatim and nothing else. ` +
            `If you cannot find it, reply exactly NOT_FOUND.`,
        },
      ],
      mcp_servers: [
        {
          type: "url",
          url: GRANOLA_MCP_URL,
          name: "granola",
          authorization_token: authToken,
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Granola fetch failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = (data.content as { type: string; text?: string }[])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!text || text === "NOT_FOUND") {
    throw new Error(`No Granola note found for "${noteRef}".`);
  }
  return text;
}
