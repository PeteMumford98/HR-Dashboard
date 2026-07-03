import Link from "next/link";
import { getEmployee, listWriteupsForEmployee } from "@/lib/db";
import ProcessNoteForm from "./ProcessNoteForm";

export const dynamic = "force-dynamic";

export default async function EmployeePage({ params }: { params: { id: string } }) {
  const employee = await getEmployee(params.id);
  const writeups = employee ? await listWriteupsForEmployee(params.id) : [];

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

        <h2>Process a meeting note</h2>
        <ProcessNoteForm employeeId={employee.id} granolaMode={process.env.GRANOLA_MODE === "mcp" ? "mcp" : "paste"} />

        <h2>Write-ups</h2>
        <div className="card">
          <table>
            <thead><tr><th>Meeting</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {(writeups ?? []).map((w: any) => (
                <tr key={w.id}>
                  <td>{w.meetings?.meeting_type?.replace(/_/g, " ")}</td>
                  <td>{w.meetings?.meeting_date ? new Date(w.meetings.meeting_date).toLocaleDateString("en-GB") : ""}</td>
                  <td><span className={`pill ${w.status}`}>{w.status}</span></td>
                  <td><Link href={`/writeups/${w.id}`}>Review</Link></td>
                </tr>
              ))}
              {(!writeups || writeups.length === 0) && (
                <tr><td colSpan={4} className="muted">No write-ups yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
