"use client";
import { useState } from "react";

export default function ResponsibilitiesEditor({ employeeId, initialText }: { employeeId: string; initialText: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialText);
  const [saved, setSaved] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responsibilities: text }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not save");
      return;
    }
    setSaved(text);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="card">
        {saved ? <p>{saved}</p> : <p className="muted">No responsibilities added yet.</p>}
        <button className="btn secondary" onClick={() => setEditing(true)}>Edit</button>
      </div>
    );
  }

  return (
    <div className="card">
      <label htmlFor="responsibilities">Role & responsibilities</label>
      <textarea id="responsibilities" value={text} onChange={(e) => setText(e.target.value)} />
      {error && <p className="error">{error}</p>}
      <p style={{ display: "flex", gap: "0.75rem" }}>
        <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        <button className="btn secondary" onClick={() => { setText(saved); setEditing(false); setError(""); }} disabled={busy}>Cancel</button>
      </p>
    </div>
  );
}
