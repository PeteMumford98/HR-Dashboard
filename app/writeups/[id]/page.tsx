import Link from "next/link";
import { getWriteupFull } from "@/lib/db";
import WriteupEditor from "./WriteupEditor";

export const dynamic = "force-dynamic";

export default async function WriteupPage({ params }: { params: { id: string } }) {
  const writeup = await getWriteupFull(params.id);

  if (!writeup) return <main className="page"><p className="error">Write-up not found.</p></main>;

  return (
    <>
      <header className="topbar">
        <div className="wordmark">cartwright<span>HR write-ups</span></div>
        <Link href={`/employees/${writeup.employee_id}`}>Back to {(writeup as any).employees?.full_name}</Link>
      </header>
      <main className="page">
        <h1>{(writeup as any).employees?.full_name}</h1>
        <div className="semis"><i /><i /><i /></div>
        <p className="muted">
          {(writeup as any).meetings?.meeting_type?.replace(/_/g, " ")} ·{" "}
          {(writeup as any).meetings?.meeting_date ? new Date((writeup as any).meetings.meeting_date).toLocaleDateString("en-GB") : ""} ·{" "}
          <span className={`pill ${writeup.status}`}>{writeup.status}</span>
        </p>
        <WriteupEditor
          writeupId={writeup.id}
          initialContent={writeup.formatted_content}
          initialStatus={writeup.status}
          flags={writeup.review_flags ?? []}
          suggestions={writeup.suggestions ?? []}
        />
      </main>
    </>
  );
}
