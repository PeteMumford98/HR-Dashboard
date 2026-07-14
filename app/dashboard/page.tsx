import Link from "next/link";
import { listEmployees, listRecentWriteups } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/config";
import AddPersonForm from "./AddPersonForm";
import Logo from "@/app/Logo";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const employees = await listEmployees();
  const recent = await listRecentWriteups(8);

  return (
    <>
      <header className="topbar">
        <div className="wordmark"><Logo /><span>HR write-ups</span></div>
        {isSupabaseConfigured() && <Link href="/login">Sign out</Link>}
      </header>
      <main className="page">
        <h1>People</h1>
        <div className="semis"><i /><i /><i /></div>
        {!isSupabaseConfigured() && (
          <p className="muted">Demo mode: running on sample, in-memory data. Add Supabase credentials to persist real data.</p>
        )}
        <p className="lede">Pick a person to process a meeting note, or open a recent write-up below.</p>

        <div className="card">
          <table>
            <thead>
              <tr><th>Name</th><th>Role</th><th>Manager</th><th></th></tr>
            </thead>
            <tbody>
              {(employees ?? []).map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.full_name}</strong></td>
                  <td>{e.job_title}</td>
                  <td>{e.manager_name}</td>
                  <td><Link href={`/employees/${e.id}`}>Open</Link></td>
                </tr>
              ))}
              {(!employees || employees.length === 0) && (
                <tr><td colSpan={4} className="muted">No people yet. Run supabase/seed.sql or add rows to the employees table.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <AddPersonForm />

        <h2>Recent write-ups</h2>
        <div className="card">
          <table>
            <thead><tr><th>Person</th><th>Status</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {(recent ?? []).map((w: any) => (
                <tr key={w.id}>
                  <td>{w.employees?.full_name}</td>
                  <td><span className={`pill ${w.status}`}>{w.status}</span></td>
                  <td>{new Date(w.created_at).toLocaleDateString("en-GB")}</td>
                  <td><Link href={`/writeups/${w.id}`}>Review</Link></td>
                </tr>
              ))}
              {(!recent || recent.length === 0) && (
                <tr><td colSpan={4} className="muted">Nothing yet. Process your first note from a person's page.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
