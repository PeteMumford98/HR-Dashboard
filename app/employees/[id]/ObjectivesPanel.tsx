"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Objective = { id: string; title: string; status: "on_track" | "at_risk" | "done"; due_date: string | null };

const STATUS_LABEL: Record<Objective["status"], string> = {
  on_track: "On track",
  at_risk: "At risk",
  done: "Done",
};

export default function ObjectivesPanel({ employeeId, initialObjectives }: { employeeId: string; initialObjectives: Objective[] }) {
  const router = useRouter();
  const [objectives, setObjectives] = useState(initialObjectives);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addObjective(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/objectives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, title, dueDate: dueDate || null }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error); return; }
    setObjectives((prev) => [...prev, data.objective].sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")));
    setTitle("");
    setDueDate("");
    router.refresh();
  }

  async function setStatus(id: string, status: Objective["status"]) {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch(`/api/objectives/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
    await fetch(`/api/objectives/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="card">
      {objectives.length === 0 && <p className="muted">No objectives added yet.</p>}
      {objectives.map((o) => (
        <div key={o.id} className="objective-row">
          <div>
            <strong>{o.title}</strong>
            {o.due_date && <span className="muted"> · due {new Date(o.due_date).toLocaleDateString("en-GB")}</span>}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <select
              aria-label={`Status for ${o.title}`}
              value={o.status}
              onChange={(e) => setStatus(o.id, e.target.value as Objective["status"])}
              className={`pill-select ${o.status}`}
            >
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button className="btn secondary" onClick={() => remove(o.id)} aria-label={`Remove ${o.title}`}>Remove</button>
          </div>
        </div>
      ))}

      <form onSubmit={addObjective} className="objective-form">
        <input
          aria-label="New objective title"
          placeholder="Add an objective…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input aria-label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button className="btn secondary" disabled={busy}>{busy ? "Adding…" : "Add"}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
