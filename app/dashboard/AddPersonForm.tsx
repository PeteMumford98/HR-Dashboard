"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddPersonForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [managerName, setManagerName] = useState("");
  const [email, setEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, jobTitle, managerName, email, startDate }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error); return; }
    setFullName(""); setJobTitle(""); setManagerName(""); setEmail(""); setStartDate("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <p>
        <button className="btn secondary" onClick={() => setOpen(true)}>Add person</button>
      </p>
    );
  }

  return (
    <form onSubmit={addPerson} className="card">
      <label htmlFor="person-name">Name</label>
      <input id="person-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />

      <label htmlFor="person-title">Job title</label>
      <input id="person-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />

      <label htmlFor="person-manager">Manager</label>
      <input id="person-manager" value={managerName} onChange={(e) => setManagerName(e.target.value)} />

      <label htmlFor="person-email">Email</label>
      <input id="person-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

      <label htmlFor="person-start">Start date</label>
      <input id="person-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

      {error && <p className="error">{error}</p>}
      <p style={{ display: "flex", gap: "0.5rem" }}>
        <button className="btn" disabled={busy}>{busy ? "Adding…" : "Add person"}</button>
        <button type="button" className="btn secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
      </p>
    </form>
  );
}
