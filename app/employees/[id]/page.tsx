import Link from "next/link";
import { getEmployee, listWriteupsForEmployee, listObjectives } from "@/lib/db";
import ProcessNoteForm from "./ProcessNoteForm";
import ResponsibilitiesEditor from "./ResponsibilitiesEditor";
import ObjectivesPanel from "./ObjectivesPanel";

export const dynamic = "force-dynamic";

function truncate(text: string, max: number) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export default async function EmployeePage({ params }: { params: { id: string } }) {
  const employee = await getEmployee(params.id);
  const [meetings, objectives] = employee
    ? await Promise.all([listWriteupsForEmployee(params.id), listObjectives(params.id)])
    : [[], []];

  if (!employee) return <main className="page"><p className="error">Person not found.</p></main>;

  return (
    <>
      <header className="topbar">
        <div className="wordmark">cartwright<span>HR write-ups</span></div>
        <Link href="/dashboard">All people</Link>
      </header>
      <main className="page">
        <h1>{employee.full_name}</h1>
        <div className="semis"><i /><i /><i /></div>
        <p className="muted">{employee.job_title} · manager {employee.manager_name} · started {employee.start_date ? new Date(employee.start_date).toLocaleDateString("en-GB") : "n/a"}</p>

        <h2>Role & responsibilities</h2>
        <ResponsibilitiesEditor employeeId={employee.id} initialText={employee.responsibilities ?? ""} />

        <h2>Latest objectives</h2>
        <ObjectivesPanel employeeId={employee.id} initialObjectives={objectives as any} />

        <h2>Add notes from a meeting</h2>
        <ProcessNoteForm employeeId={employee.id} granolaMode={process.env.GRANOLA_MODE === "mcp" ? "mcp" : "paste"} />

        <h2>Recent meetings</h2>
        <div className="card">
          <table>
            <thead><tr><th>Meeting</th><th>Date</th><th>Note</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {(meetings ?? []).map((w: any) => (
                <tr key={w.id}>
                  <td>{w.meetings?.meeting_type?.replace(/_/g, " ")}</td>
                  <td>{w.meetings?.meeting_date ? new Date(w.meetings.meeting_date).toLocaleDateString("en-GB") : ""}</td>
                  <td className="muted">{w.meetings?.raw_note ? truncate(w.meetings.raw_note, 90) : "—"}</td>
                  <td><span className={`pill ${w.status}`}>{w.status}</span></td>
                  <td><Link href={`/writeups/${w.id}`}>Review</Link></td>
                </tr>
              ))}
              {(!meetings || meetings.length === 0) && (
                <tr><td colSpan={5} className="muted">No meetings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
