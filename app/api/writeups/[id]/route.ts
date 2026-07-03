import { NextResponse } from "next/server";
import { getCurrentUser, updateWriteupContent, logAudit } from "@/lib/db";

// Save edits to a write-up. First edit moves draft → edited.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { formatted_content } = await req.json();
  if (typeof formatted_content !== "string" || !formatted_content.trim()) {
    return NextResponse.json({ error: "Content is empty" }, { status: 400 });
  }

  try {
    const nextStatus = await updateWriteupContent(params.id, formatted_content);
    await logAudit(user.id, "edited", "writeup", params.id);
    return NextResponse.json({ status: nextStatus });
  } catch (err: any) {
    const status = err.message === "Not found" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
