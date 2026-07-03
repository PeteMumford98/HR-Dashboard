import { NextResponse } from "next/server";
import { formatPass, reviewPass, demoFormatPass, demoReviewPass, FORMAT_MODEL, REVIEW_MODEL } from "@/lib/claude";
import { fetchNoteFromGranola, granolaMode } from "@/lib/granola";
import { isClaudeConfigured } from "@/lib/config";
import { getCurrentUser, listGuidelines, createMeetingAndWriteup, logAudit } from "@/lib/db";

// Needs Vercel Pro in production: the two model passes can run past the
// Hobby plan's 60 second function limit.
export const maxDuration = 300;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const { employeeId, meetingType, meetingDate, rawNote, granolaNoteRef } = body;

  try {
    // 1. Get the note.
    let note: string;
    if (granolaMode() === "mcp" && granolaNoteRef) {
      note = await fetchNoteFromGranola(granolaNoteRef);
    } else if (rawNote?.trim()) {
      note = rawNote.trim();
    } else {
      return NextResponse.json({ error: "No note supplied" }, { status: 400 });
    }

    // 2. Format pass (Haiku) and review pass (Sonnet) against the guidelines,
    // or a canned demo pass when no Claude API key is configured.
    const claudeReady = isClaudeConfigured();
    const formatted = claudeReady ? await formatPass(note) : demoFormatPass(note);
    const review = claudeReady
      ? await reviewPass(formatted, await listGuidelines())
      : demoReviewPass(formatted);

    // 3. Store meeting + draft write-up.
    const writeup = await createMeetingAndWriteup({
      employeeId,
      meetingType,
      meetingDate,
      granolaNoteRef,
      content: review.content,
      flags: review.flags,
      suggestions: review.suggestions,
      modelFormat: claudeReady ? FORMAT_MODEL : "demo",
      modelReview: claudeReady ? REVIEW_MODEL : "demo",
    });

    await logAudit(user.id, "created", "writeup", writeup.id);

    return NextResponse.json({ writeupId: writeup.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
