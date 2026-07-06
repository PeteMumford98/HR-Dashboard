import { NextResponse } from "next/server";
import { getCurrentUser, updateEmployeeResponsibilities, logAudit } from "@/lib/db";

// Save the role & responsibilities blurb for an employee.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { responsibilities } = await req.json();
  if (typeof responsibilities !== "string") {
    return NextResponse.json({ error: "Responsibilities must be text" }, { status: 400 });
  }

  try {
    await updateEmployeeResponsibilities(params.id, responsibilities.trim());
    await logAudit(user.id, "edited", "employee", params.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err.message === "Not found" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
