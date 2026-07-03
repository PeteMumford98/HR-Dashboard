"use client";
import { useState } from "react";

type Flag = { issue: string; severity: "high" | "medium" | "low"; location: string };

export default function WriteupEditor({
  writeupId, initialContent, initialStatus, flags, suggestions,
}: {
  writeupId: string; initialContent: string; initialStatus: string;
  flags: Flag[]; suggestions: string[];
}) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState(initialStatus);
  const [shareUrl, setShareUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setBusy(true); setError(""); setMsg("");
    const res = await fetch(`/api/writeups/${writeupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formatted_content: content }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error); return; }
    setStatus(data.status);
    setMsg("Saved");
  }

  async function share() {
    if (!confirm("Share this write-up? The employee will be able to read it at the link until it expires or you revoke it.")) return;
    setBusy(true); setError(""); setMsg("");
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writeupId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error); return; }
    setStatus("shared");
    setShareUrl(data.url);
    setMsg(`Shared. Link expires ${new Date(data.expiresAt).toLocaleDateString("en-GB")}. Copy it now: it is shown once.`);
  }

  async function revoke() {
    setBusy(true); setError(""); setMsg("");
    const res = await fetch("/api/share", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writeupId }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setStatus("edited");
    setShareUrl("");
    setMsg("All links for this write-up revoked.");
  }

  return (
    <>
      {flags.length > 0 && (
        <>
          <h2>Review flags</h2>
          {flags.map((f, i) => (
            <div key={i} className={`flag ${f.severity}`}>
              <span className="sev">{f.severity.toUpperCase()}</span> · {f.issue}
              {f.location ? <span className="muted"> ({f.location})</span> : null}
            </div>
          ))}
        </>
      )}

      {suggestions.length > 0 && (
        <div className="card">
          <h3>Suggestions</h3>
          <ul>{suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}

      <h2>Write-up</h2>
      <p className="muted">This is a draft until you share it. Edit freely; the flags above are advisory.</p>
      <textarea className="editor" value={content} onChange={(e) => setContent(e.target.value)} aria-label="Write-up content" />

      <p style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button className="btn secondary" onClick={save} disabled={busy}>Save changes</button>
        {status !== "shared" && <button className="btn" onClick={share} disabled={busy}>Share with employee</button>}
        {status === "shared" && <button className="btn warn" onClick={revoke} disabled={busy}>Revoke link</button>}
      </p>

      {shareUrl && (
        <div className="card">
          <strong>Share link</strong>
          <p style={{ wordBreak: "break-all" }}><code>{shareUrl}</code></p>
          <button className="btn secondary" onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy link</button>
        </div>
      )}
      {msg && <p className="muted">{msg}</p>}
      {error && <p className="error">{error}</p>}
    </>
  );
}
