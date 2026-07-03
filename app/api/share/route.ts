import { NextResponse } from "next/server";
import { newShareToken } from "@/lib/shareTokens";
import { getCurrentUser, createShareLink, revokeShareLinks, logAudit } from "@/lib/db";

// POST: create a share link for a write-up and mark it shared.
// This is the deliberate publish gate: nothing is visible to the
// employee until the HR lead clicks Share.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { writeupId } = await req.json();

  const { token, hash } = newShareToken();
  const days = parseInt(process.env.SHARE_LINK_EXPIRY_DAYS || "14", 10);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  try {
    await createShareLink(writeupId, hash, expiresAt);
    await logAudit(user.id, "shared", "writeup", writeupId);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // The raw token appears here once and is never stored.
  return NextResponse.json({ url: `${base}/share/${token}`, expiresAt });
}

// DELETE: revoke all live links for a write-up.
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { writeupId } = await req.json();

  try {
    await revokeShareLinks(writeupId);
    await logAudit(user.id, "revoked", "writeup", writeupId);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
