import { NextResponse } from "next/server";
import { getCurrentUser, createObjective, logAudit } from "@/lib/db";

// POST: add a new objective for an employee.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { employeeId, title, dueDate } = await req.json();
  if (typeof employeeId !== "string" || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "employeeId and title are required" }, { status: 400 });
  }

  try {
    const objective = await createObjective(employeeId, title.trim(), dueDate || null);
    await logAudit(user.id, "created", "objective", objective.id);
    return NextResponse.json({ objective });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
