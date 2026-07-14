import { NextResponse } from "next/server";
import { getCurrentUser, createEmployee, logAudit } from "@/lib/db";

function optional(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// POST: add a new person to the employees table.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { fullName, jobTitle, managerName, email, startDate } = await req.json();
  if (typeof fullName !== "string" || !fullName.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const employee = await createEmployee({
      fullName: fullName.trim(),
      jobTitle: optional(jobTitle),
      managerName: optional(managerName),
      email: optional(email),
      startDate: optional(startDate),
    });
    await logAudit(user.id, "created", "employee", employee.id);
    return NextResponse.json({ employee });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
