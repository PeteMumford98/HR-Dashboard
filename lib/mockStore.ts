import { randomUUID } from "crypto";

// In-memory stand-in for the Supabase schema (supabase/schema.sql), used
// whenever NEXT_PUBLIC_SUPABASE_URL isn't configured. State lives for the
// life of the server process — fine for clicking through a prototype, and
// resets on redeploy/cold start.

export type Employee = {
  id: string; full_name: string; email: string | null; job_title: string | null;
  manager_name: string | null; start_date: string | null; status: string;
  responsibilities: string | null;
};

export type Meeting = {
  id: string; employee_id: string; meeting_type: string; meeting_date: string;
  granola_note_id: string | null; raw_note: string | null; created_at: string;
};

export type Flag = { issue: string; severity: "high" | "medium" | "low"; location: string };

export type Writeup = {
  id: string; meeting_id: string; employee_id: string; status: string;
  formatted_content: string; review_flags: Flag[]; suggestions: string[];
  model_format: string | null; model_review: string | null;
  created_at: string; updated_at: string;
};

export type ShareLink = {
  id: string; writeup_id: string; token_hash: string; expires_at: string;
  revoked: boolean; view_count: number;
};

export type ObjectiveStatus = "on_track" | "at_risk" | "done";

export type Objective = {
  id: string; employee_id: string; title: string; status: ObjectiveStatus;
  due_date: string | null; created_at: string; updated_at: string;
};

export const DEMO_USER = { id: "demo-user" };

const now = "2026-01-01T00:00:00.000Z";

const employees: Employee[] = [
  {
    id: "emp-1", full_name: "Ade Okafor", email: "ade@example.com", job_title: "Account Executive",
    manager_name: "Sam Manager", start_date: "2024-03-01", status: "active",
    responsibilities: "Owns a mid-market sales patch across the UK. Runs discovery through to close, keeps CRM pipeline data accurate, and mentors new SDRs on qualification.",
  },
  {
    id: "emp-2", full_name: "Priya Shah", email: "priya@example.com", job_title: "Customer Success Lead",
    manager_name: "Sam Manager", start_date: "2023-08-15", status: "active",
    responsibilities: "Leads the customer success team of four. Owns renewal and expansion targets, runs quarterly business reviews with top accounts, and sets the team's playbooks.",
  },
  {
    id: "emp-3", full_name: "Tom Fielding", email: "tom@example.com", job_title: "Support Specialist",
    manager_name: "Jo Director", start_date: "2025-01-10", status: "active",
    responsibilities: "First response on the support queue. Triages and resolves tickets against SLA, escalates product bugs, and maintains the internal knowledge base.",
  },
];

const meetings: Meeting[] = [
  {
    id: "meet-1", employee_id: "emp-1", meeting_type: "one_to_one", meeting_date: "2026-06-20",
    granola_note_id: null, created_at: now,
    raw_note: "Ade - 1:1 20 June. Pipeline at 3.2x, feeling good about Q3. Wants more exposure to enterprise deal structuring - keen to shadow one this month. Sam to add Ade to onboarding call rota. Follow up 20 July.",
  },
  {
    id: "meet-2", employee_id: "emp-2", meeting_type: "review", meeting_date: "2026-06-15",
    granola_note_id: null, created_at: now,
    raw_note: "Priya mid-year review. NRR 108% vs 105% target, team CSAT 94%. Recovered two at-risk accounts ahead of renewal. Rating: exceeds expectations. Wants to shadow a people-manager skip-level next quarter. Enrol in Q3 leadership cohort.",
  },
];

const writeups: Writeup[] = [
  {
    id: "wu-1", meeting_id: "meet-1", employee_id: "emp-1", status: "draft",
    formatted_content:
      "## Summary\nAde is on track for the quarter and raised interest in leading onboarding calls for new hires.\n\n## Key discussion points\n- Pipeline coverage is healthy at 3.2x target\n- Wants more visibility into enterprise deal structuring\n\n## Agreed actions\n- Ade to shadow one enterprise deal review this month (owner: Ade, due 2026-07-15)\n- Sam to loop Ade into the onboarding call rota (owner: Sam, due 2026-07-10)\n\n## Development areas\n- Enterprise deal structuring\n\n## Follow-up date\n2026-07-20",
    review_flags: [{ issue: "No protected-characteristic language detected.", severity: "low", location: "whole document" }],
    suggestions: ["Consider adding a specific metric to the enterprise-deal shadowing action."],
    model_format: "demo", model_review: "demo", created_at: now, updated_at: now,
  },
  {
    id: "wu-2", meeting_id: "meet-2", employee_id: "emp-2", status: "shared",
    formatted_content:
      "## Summary\nPriya's mid-year review covered renewal performance and a development plan for people leadership.\n\n## Objectives reviewed\n- Net revenue retention: 108% (target 105%)\n- Team CSAT: 94%\n\n## Evidence discussed\n- Two at-risk accounts recovered ahead of renewal\n\n## Agreed outcome\nExceeds expectations.\n\n## Development objectives\n- Shadow a people-manager 1:1 skip-level next quarter\n\n## Support the company will provide\n- Enrolment in the Q3 leadership cohort",
    review_flags: [],
    suggestions: [],
    model_format: "demo", model_review: "demo", created_at: now, updated_at: now,
  },
];

const guidelines = [
  { title: "One to one write-ups", content: "Every one to one write-up must include: a short summary, key discussion points, agreed actions with owners, any development areas raised, and a follow-up date. Actions must be specific and dated." },
  { title: "Fair and lawful language", content: "Write-ups must be factual and balanced. Describe behaviour and outcomes, not personality. Never reference protected characteristics." },
  { title: "Review meetings", content: "Performance review write-ups must record: objectives reviewed, evidence discussed, an agreed rating or outcome if applicable, development objectives for the next period, and support the company will provide." },
];

const objectives: Objective[] = [
  { id: "obj-1", employee_id: "emp-1", title: "Close $400k of enterprise pipeline this quarter", status: "on_track", due_date: "2026-09-30", created_at: now, updated_at: now },
  { id: "obj-2", employee_id: "emp-1", title: "Shadow an enterprise deal structuring review", status: "at_risk", due_date: "2026-07-15", created_at: now, updated_at: now },
  { id: "obj-3", employee_id: "emp-2", title: "Grow net revenue retention to 110%", status: "on_track", due_date: "2026-12-31", created_at: now, updated_at: now },
  { id: "obj-4", employee_id: "emp-2", title: "Complete Q3 leadership cohort", status: "on_track", due_date: "2026-09-30", created_at: now, updated_at: now },
  { id: "obj-5", employee_id: "emp-3", title: "Bring first-response time under 2 hours", status: "done", due_date: "2026-06-01", created_at: now, updated_at: now },
];

const shareLinks: ShareLink[] = [];
const auditLog: { actor: string; action: string; entity: string; entity_id: string; created_at: string }[] = [];

export function listEmployees() {
  return [...employees].sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export function getEmployee(id: string) {
  return employees.find((e) => e.id === id) ?? null;
}

export function updateEmployeeResponsibilities(id: string, responsibilities: string) {
  const e = employees.find((x) => x.id === id);
  if (!e) return null;
  e.responsibilities = responsibilities;
  return e;
}

export function listGuidelines() {
  return guidelines;
}

export function listObjectives(employeeId: string) {
  return objectives
    .filter((o) => o.employee_id === employeeId)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
}

export function createObjective(employeeId: string, title: string, dueDate: string | null) {
  const createdAt = new Date().toISOString();
  const objective: Objective = {
    id: randomUUID(), employee_id: employeeId, title, status: "on_track",
    due_date: dueDate, created_at: createdAt, updated_at: createdAt,
  };
  objectives.push(objective);
  return objective;
}

export function updateObjective(id: string, patch: { title?: string; status?: ObjectiveStatus; due_date?: string | null }) {
  const o = objectives.find((x) => x.id === id);
  if (!o) return null;
  if (patch.title !== undefined) o.title = patch.title;
  if (patch.status !== undefined) o.status = patch.status;
  if (patch.due_date !== undefined) o.due_date = patch.due_date;
  o.updated_at = new Date().toISOString();
  return o;
}

export function deleteObjective(id: string) {
  const i = objectives.findIndex((x) => x.id === id);
  if (i >= 0) objectives.splice(i, 1);
}

function meetingFor(writeup: Writeup) {
  return meetings.find((m) => m.id === writeup.meeting_id) ?? null;
}

export function listRecentWriteups(limit: number) {
  return [...writeups]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map((w) => ({ ...w, employees: { full_name: getEmployee(w.employee_id)?.full_name ?? "" } }));
}

export function listWriteupsForEmployee(employeeId: string) {
  return writeups
    .filter((w) => w.employee_id === employeeId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((w) => {
      const m = meetingFor(w);
      return {
        ...w,
        meetings: m ? { meeting_type: m.meeting_type, meeting_date: m.meeting_date, raw_note: m.raw_note } : null,
      };
    });
}

export function getWriteupFull(id: string) {
  const w = writeups.find((x) => x.id === id);
  if (!w) return null;
  const m = meetingFor(w);
  return {
    ...w,
    employees: { full_name: getEmployee(w.employee_id)?.full_name ?? "" },
    meetings: m ? { meeting_type: m.meeting_type, meeting_date: m.meeting_date, raw_note: m.raw_note } : null,
  };
}

export function createMeetingAndWriteup(input: {
  employeeId: string; meetingType: string; meetingDate: string; granolaNoteRef?: string | null; rawNote: string;
  content: string; flags: Flag[]; suggestions: string[]; modelFormat: string; modelReview: string;
}) {
  const createdAt = new Date().toISOString();
  const meeting: Meeting = {
    id: randomUUID(), employee_id: input.employeeId, meeting_type: input.meetingType,
    meeting_date: input.meetingDate, granola_note_id: input.granolaNoteRef ?? null,
    raw_note: input.rawNote, created_at: createdAt,
  };
  meetings.push(meeting);

  const writeup: Writeup = {
    id: randomUUID(), meeting_id: meeting.id, employee_id: input.employeeId, status: "draft",
    formatted_content: input.content, review_flags: input.flags, suggestions: input.suggestions,
    model_format: input.modelFormat, model_review: input.modelReview, created_at: createdAt, updated_at: createdAt,
  };
  writeups.push(writeup);
  return writeup;
}

export function updateWriteupContent(id: string, content: string) {
  const w = writeups.find((x) => x.id === id);
  if (!w) return null;
  w.status = w.status === "draft" ? "edited" : w.status;
  w.formatted_content = content;
  w.updated_at = new Date().toISOString();
  return w;
}

export function createShareLink(writeupId: string, tokenHash: string, expiresAt: string) {
  const link: ShareLink = { id: randomUUID(), writeup_id: writeupId, token_hash: tokenHash, expires_at: expiresAt, revoked: false, view_count: 0 };
  shareLinks.push(link);
  const w = writeups.find((x) => x.id === writeupId);
  if (w) w.status = "shared";
  return link;
}

export function getValidShareLink(tokenHash: string) {
  return shareLinks.find((l) => l.token_hash === tokenHash) ?? null;
}

export function incrementShareView(id: string) {
  const l = shareLinks.find((x) => x.id === id);
  if (l) l.view_count += 1;
}

export function revokeShareLinks(writeupId: string) {
  shareLinks.filter((l) => l.writeup_id === writeupId).forEach((l) => (l.revoked = true));
  const w = writeups.find((x) => x.id === writeupId);
  if (w) w.status = "edited";
}

export function logAudit(actor: string, action: string, entity: string, entityId: string) {
  auditLog.push({ actor, action, entity, entity_id: entityId, created_at: new Date().toISOString() });
}
