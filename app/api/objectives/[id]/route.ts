import { NextResponse } from "next/server";
import { getCurrentUser, updateObjective, deleteObjective, logAudit } from "@/lib/db";

const VALID_STATUSES = ["on_track", "at_risk", "done"];

// PATCH: update an objective's status, title, or due date.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { status, title, dueDate } = await req.json();
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    await updateObjective(params.id, {
      ...(status !== undefined ? { status } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(dueDate !== undefined ? { due_date: dueDate || null } : {}),
    });
    await logAudit(user.id, "edited", "objective", params.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status2 = err.message === "Not found" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status: status2 });
  }
}

// DELETE: remove an objective.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    await deleteObjective(params.id);
    await logAudit(user.id, "deleted", "objective", params.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
