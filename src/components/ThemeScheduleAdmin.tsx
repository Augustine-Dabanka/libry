"use client";

import { useState, useTransition } from "react";
import { saveThemeSchedule } from "@/app/actions/admin";
import { type Season } from "@/lib/themes";

// Staff editor for the seasonal theme calendar. Dates are MM-DD and repeat
// every year; a range may wrap past New Year (e.g. 12-30 to 01-02).
export default function ThemeScheduleAdmin({ initial }: { initial: Season[] }) {
  const [rows, setRows] = useState<Season[]>(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (i: number, patch: Partial<Season>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const input = { background: "var(--charcoal)", color: "var(--ivory)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.45rem 0.6rem", width: 86, fontFamily: "var(--sans)" } as const;

  return (
    <section style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.2rem" }}>
      <h2 style={{ marginBottom: "0.3rem" }}>Seasonal themes</h2>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: "1rem" }}>
        Each theme switches on automatically between its dates (every year) and off again after. Readers can turn holiday themes off in Settings.
      </p>
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {rows.map((s, i) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap", padding: "0.8rem 1rem", border: "1px solid var(--border)", borderRadius: 12, background: "var(--stone)" }}>
            <span style={{ width: 14, height: 14, borderRadius: "50%", background: s.accent, flexShrink: 0 }} />
            <span style={{ flex: "1 1 180px", fontFamily: "var(--sans)", fontWeight: 700 }}>{s.name}</span>
            <label style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)" }}>From <input aria-label={`${s.name} start (MM-DD)`} value={s.start} onChange={(e) => set(i, { start: e.target.value })} style={input} /></label>
            <label style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)" }}>To <input aria-label={`${s.name} end (MM-DD)`} value={s.end} onChange={(e) => set(i, { end: e.target.value })} style={input} /></label>
            <button type="button" role="switch" aria-checked={s.enabled} aria-label={`${s.name} enabled`} onClick={() => set(i, { enabled: !s.enabled })}
              style={{ width: 52, height: 32, borderRadius: 16, border: "none", padding: 3, cursor: "pointer", background: s.enabled ? "var(--gold)" : "var(--border)", display: "flex" }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#fff", transform: s.enabled ? "translateX(20px)" : "none", transition: "transform 180ms ease" }} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
        <button type="button" className="btn btn-gold" disabled={pending}
          onClick={() => start(async () => {
            setMsg(null);
            const r = await saveThemeSchedule(rows);
            setMsg(r && "error" in r && r.error ? r.error : "Saved. Live within a few minutes.");
          })}>
          {pending ? "Saving…" : "Save schedule"}
        </button>
        {msg ? <span role="status" style={{ fontFamily: "var(--sans)", color: "var(--muted)" }}>{msg}</span> : null}
      </div>
    </section>
  );
}
