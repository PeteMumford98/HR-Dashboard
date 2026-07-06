import { supabaseServer, supabaseAdmin } from "./supabaseServer";
import { isSupabaseConfigured } from "./config";
import * as mock from "./mockStore";
import type { Flag, ObjectiveStatus } from "./mockStore";

// Data-access facade. Every page and API route goes through here instead of
// calling Supabase directly, so the app can run against the in-memory demo
// store when Supabase isn't configured yet, with no code changes needed
// once real credentials are added.

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return mock.DEMO_USER;
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function listEmployees() {
  if (!isSupabaseConfigured()) return mock.listEmployees();
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("employees").select("id, full_name, job_title, manager_name, status").order("full_name");
  return data ?? [];
}

export async function getEmployee(id: string) {
  if (!isSupabaseConfigured()) return mock.getEmployee(id);
  const supabase = supabaseServer();
  const { data } = await supabase.from("employees").select("*").eq("id", id).single();
  return data;
}

export async function updateEmployeeResponsibilities(id: string, responsibilities: string) {
  if (!isSupabaseConfigured()) {
    const e = mock.updateEmployeeResponsibilities(id, responsibilities);
    if (!e) throw new Error("Not found");
    return;
  }
  const supabase = supabaseServer();
  const { error } = await supabase
    .from("employees")
    .update({ responsibilities, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listObjectives(employeeId: string) {
  if (!isSupabaseConfigured()) return mock.listObjectives(employeeId);
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("objectives")
    .select("id, title, status, due_date")
    .eq("employee_id", employeeId)
    .order("due_date", { ascending: true });
  return data ?? [];
}

export async function createObjective(employeeId: string, title: string, dueDate: string | null) {
  if (!isSupabaseConfigured()) return mock.createObjective(employeeId, title, dueDate);
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("objectives")
    .insert({ employee_id: employeeId, title, due_date: dueDate })
    .select("id, title, status, due_date").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateObjective(id: string, patch: { title?: string; status?: ObjectiveStatus; due_date?: string | null }) {
  if (!isSupabaseConfigured()) {
    const o = mock.updateObjective(id, patch);
    if (!o) throw new Error("Not found");
    return;
  }
  const supabase = supabaseServer();
  const { error } = await supabase
    .from("objectives")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteObjective(id: string) {
  if (!isSupabaseConfigured()) {
    mock.deleteObjective(id);
    return;
  }
  const supabase = supabaseServer();
  const { error } = await supabase.from("objectives").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listRecentWriteups(limit: number) {
  if (!isSupabaseConfigured()) return mock.listRecentWriteups(limit);
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("writeups")
    .select("id, status, created_at, employees(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listWriteupsForEmployee(employeeId: string) {
  if (!isSupabaseConfigured()) return mock.listWriteupsForEmployee(employeeId);
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("writeups")
    .select("id, status, created_at, meetings(meeting_type, meeting_date, raw_note)")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getWriteupFull(id: string) {
  if (!isSupabaseConfigured()) return mock.getWriteupFull(id);
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("writeups")
    .select("*, employees(full_name), meetings(meeting_type, meeting_date, raw_note)")
    .eq("id", id)
    .single();
  return data;
}

export async function listGuidelines() {
  if (!isSupabaseConfigured()) return mock.listGuidelines();
  const supabase = supabaseServer();
  const { data } = await supabase.from("guidelines").select("title, content");
  return data ?? [];
}

export async function createMeetingAndWriteup(input: {
  employeeId: string; meetingType: string; meetingDate: string; granolaNoteRef?: string | null; rawNote: string;
  content: string; flags: Flag[]; suggestions: string[]; modelFormat: string; modelReview: string;
}) {
  if (!isSupabaseConfigured()) return mock.createMeetingAndWriteup(input);

  const supabase = supabaseServer();
  const { data: meeting, error: mErr } = await supabase
    .from("meetings")
    .insert({
      employee_id: input.employeeId,
      meeting_type: input.meetingType,
      meeting_date: input.meetingDate,
      granola_note_id: input.granolaNoteRef ?? null,
      raw_note: input.rawNote,
    })
    .select("id").single();
  if (mErr) throw new Error(mErr.message);

  const { data: writeup, error: wErr } = await supabase
    .from("writeups")
    .insert({
      meeting_id: meeting.id,
      employee_id: input.employeeId,
      status: "draft",
      formatted_content: input.content,
      review_flags: input.flags,
      suggestions: input.suggestions,
      model_format: input.modelFormat,
      model_review: input.modelReview,
    })
    .select("id").single();
  if (wErr) throw new Error(wErr.message);
  return writeup;
}

export async function updateWriteupContent(id: string, content: string) {
  if (!isSupabaseConfigured()) {
    const w = mock.updateWriteupContent(id, content);
    if (!w) throw new Error("Not found");
    return w.status;
  }

  const supabase = supabaseServer();
  const { data: current } = await supabase.from("writeups").select("status").eq("id", id).single();
  if (!current) throw new Error("Not found");

  const nextStatus = current.status === "draft" ? "edited" : current.status;
  const { error } = await supabase
    .from("writeups")
    .update({ formatted_content: content, status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return nextStatus;
}

export async function createShareLink(writeupId: string, tokenHash: string, expiresAt: string) {
  if (!isSupabaseConfigured()) {
    mock.createShareLink(writeupId, tokenHash, expiresAt);
    return;
  }

  const supabase = supabaseServer();
  const { error: linkErr } = await supabase
    .from("share_links")
    .insert({ writeup_id: writeupId, token_hash: tokenHash, expires_at: expiresAt });
  if (linkErr) throw new Error(linkErr.message);

  const { error: statusErr } = await supabase.from("writeups").update({ status: "shared" }).eq("id", writeupId);
  if (statusErr) throw new Error(statusErr.message);
}

export async function revokeShareLinks(writeupId: string) {
  if (!isSupabaseConfigured()) {
    mock.revokeShareLinks(writeupId);
    return;
  }

  const supabase = supabaseServer();
  const { error } = await supabase.from("share_links").update({ revoked: true }).eq("writeup_id", writeupId);
  if (error) throw new Error(error.message);
  await supabase.from("writeups").update({ status: "edited" }).eq("id", writeupId);
}

export async function getValidShareLink(tokenHash: string) {
  if (!isSupabaseConfigured()) {
    const link = mock.getValidShareLink(tokenHash);
    return link && { id: link.id, writeup_id: link.writeup_id, expires_at: link.expires_at, revoked: link.revoked, view_count: link.view_count };
  }
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("share_links")
    .select("id, writeup_id, expires_at, revoked, view_count")
    .eq("token_hash", tokenHash)
    .single();
  return data;
}

export async function getSharedWriteup(writeupId: string) {
  if (!isSupabaseConfigured()) return mock.getWriteupFull(writeupId);
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("writeups")
    .select("formatted_content, status, employees(full_name), meetings(meeting_type, meeting_date)")
    .eq("id", writeupId)
    .single();
  return data;
}

export async function incrementShareView(linkId: string, currentViewCount: number) {
  if (!isSupabaseConfigured()) {
    mock.incrementShareView(linkId);
    return;
  }
  const admin = supabaseAdmin();
  await admin.from("share_links").update({ view_count: currentViewCount + 1 }).eq("id", linkId);
}

export async function logAudit(actor: string, action: string, entity: string, entityId: string) {
  if (!isSupabaseConfigured()) {
    mock.logAudit(actor, action, entity, entityId);
    return;
  }
  const supabase = supabaseServer();
  await supabase.from("audit_log").insert({ actor, action, entity, entity_id: entityId });
}
