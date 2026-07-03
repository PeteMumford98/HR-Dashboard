"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProcessNoteForm({ employeeId, granolaMode }: { employeeId: string; granolaMode: "paste" | "mcp" }) {
  const router = useRouter();
  const [meetingType, setMeetingType] = useState("one_to_one");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [noteRef, setNoteRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/process-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          meetingType,
          meetingDate,
          rawNote: granolaMode === "paste" ? note : undefined,
          granolaNoteRef: granolaMode === "mcp" ? noteRef : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Processing failed");
      router.push(`/writeups/${data.writeupId}`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <label htmlFor="mtype">Meeting type</label>
      <select id="mtype" value={meetingType} onChange={(e) => setMeetingType(e.target.value)}>
        <option value="one_to_one">One to one</option>
        <option value="review">Review</option>
        <option value="interview_debrief">Interview debrief</option>
        <option value="other">Other</option>
      </select>

      <label htmlFor="mdate">Meeting date</label>
      <input id="mdate" type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />

      {granolaMode === "paste" ? (
        <>
          <label htmlFor="note">Meeting note (paste from Granola)</label>
          <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} required
            placeholder="Open the note in Granola, copy it and paste it here." />
        </>
      ) : (
        <>
          <label htmlFor="noteref">Granola note (title, id, or date and person)</label>
          <input id="noteref" value={noteRef} onChange={(e) => setNoteRef(e.target.value)} required
            placeholder="e.g. 1:1 with Demo Employee, 2 July" />
        </>
      )}

      {error && <p className="error">{error}</p>}
      <p>
        <button className="btn" disabled={busy}>
          {busy ? "Formatting and reviewing…" : "Create draft write-up"}
        </button>
      </p>
      <p className="muted">Two passes run: a formatting pass, then a review against the HR guidelines. The result lands as a draft only you can see.</p>
    </form>
  );
}
