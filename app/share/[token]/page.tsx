import { hashShareToken } from "@/lib/shareTokens";
import { getValidShareLink, getSharedWriteup, incrementShareView } from "@/lib/db";
import Logo from "@/app/Logo";

export const dynamic = "force-dynamic";

// Public read-only view. No login. The token in the URL is hashed and
// checked against share_links; the service role client is used only
// after validation, and only fetches this one write-up.
export default async function ShareView({ params }: { params: { token: string } }) {
  const hash = hashShareToken(params.token);
  const link = await getValidShareLink(hash);

  const valid = link && !link.revoked && new Date(link.expires_at) > new Date();

  if (!valid) {
    return (
      <main className="share-shell">
        <div className="wordmark"><Logo /></div>
        <h1>This link is no longer available</h1>
        <div className="semis"><i /><i /><i /></div>
        <p>It may have expired or been withdrawn. Contact the HR team if you were expecting to read something here.</p>
      </main>
    );
  }

  const writeup = await getSharedWriteup(link.writeup_id);

  // Only shared write-ups render, even with a valid token.
  if (!writeup || writeup.status !== "shared") {
    return (
      <main className="share-shell">
        <div className="wordmark"><Logo /></div>
        <h1>This link is no longer available</h1>
        <div className="semis"><i /><i /><i /></div>
        <p>Contact the HR team if you were expecting to read something here.</p>
      </main>
    );
  }

  await incrementShareView(link.id, link.view_count ?? 0);

  const w: any = writeup;
  return (
    <main className="share-shell">
      <div className="wordmark" style={{ color: "var(--blue)" }}>cartwright</div>
      <h1>Meeting write-up</h1>
      <div className="semis"><i /><i /><i /></div>
      <p className="muted">
        {w.employees?.full_name} · {w.meetings?.meeting_type?.replace(/_/g, " ")} ·{" "}
        {w.meetings?.meeting_date ? new Date(w.meetings.meeting_date).toLocaleDateString("en-GB") : ""}
      </p>
      <article className="card share-content">
        {renderMarkdownish(w.formatted_content)}
      </article>
      <p className="muted">Read-only copy shared by Cartwright HR. Reply to your HR contact with any questions or corrections.</p>
    </main>
  );
}

// Minimal renderer for the write-up template (headings, lists, paragraphs).
// Keeps the prototype dependency-free; swap for a Markdown library later.
function renderMarkdownish(md: string) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: number) => {
    if (list.length) {
      out.push(<ul key={`ul${key}`}>{list.map((li, i) => <li key={i}>{li}</li>)}</ul>);
      list = [];
    }
  };
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("## ")) { flush(i); out.push(<h2 key={i}>{t.slice(3)}</h2>); }
    else if (t.startsWith("# ")) { flush(i); out.push(<h2 key={i}>{t.slice(2)}</h2>); }
    else if (t.startsWith("- ") || t.startsWith("* ")) { list.push(t.slice(2)); }
    else if (t === "") { flush(i); }
    else { flush(i); out.push(<p key={i}>{t}</p>); }
  });
  flush(lines.length);
  return out;
}
