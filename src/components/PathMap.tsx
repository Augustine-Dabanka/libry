// The reader's journey through an interactive story (spec §15) — rendered as a
// vertical story-world trail, not a developer flowchart. Shows the path they
// actually travelled (chapters + the choices they made) ending at their ending,
// and how many of the total endings they've found — spoiler-safe (never names
// unexplored endings). Semantic <ol> gives screen readers the sequence.
export default function PathMap({
  steps,
  endingLabel,
  endingNumber,
  totalEndings,
}: {
  steps: { chapter: string; choice: string }[];
  endingLabel: string;
  endingNumber: number;
  totalEndings: number;
}) {
  return (
    <div style={{ marginTop: "2rem", padding: "1.4rem", borderRadius: 16, border: "1px solid rgba(196,163,90,0.28)", background: "linear-gradient(160deg,#20191233,#14101933)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: "var(--serif, Georgia, serif)", fontStyle: "italic", fontSize: "1.2rem", color: "#FAF7F2", margin: 0 }}>Your path</h3>
        {totalEndings > 1 ? <span style={{ fontFamily: "var(--sans)", fontSize: "0.76rem", color: "#DCC088" }}>Ending {endingNumber} of {totalEndings} found</span> : null}
      </div>

      <ol style={{ listStyle: "none", margin: 0, padding: 0, position: "relative" }}>
        {steps.map((s, i) => (
          <li key={i} style={{ position: "relative", paddingLeft: "1.8rem", paddingBottom: "1.1rem" }}>
            {/* connector line */}
            <span aria-hidden="true" style={{ position: "absolute", left: "0.42rem", top: "0.5rem", bottom: 0, width: 2, background: "linear-gradient(#c4a35a99, #c4a35a22)" }} />
            {/* node */}
            <span aria-hidden="true" style={{ position: "absolute", left: 0, top: "0.25rem", width: 12, height: 12, borderRadius: "50%", background: "#C4A35A", boxShadow: "0 0 0 4px rgba(196,163,90,0.16)" }} />
            <div style={{ fontFamily: "var(--serif, Georgia, serif)", color: "#FAF7F2", fontSize: "0.98rem" }}>{s.chapter}</div>
            {s.choice ? (
              <div style={{ fontFamily: "var(--sans)", fontSize: "0.82rem", color: "#C6BEB2", marginTop: "0.15rem" }}>
                <span style={{ color: "#8a7d70" }}>You chose:</span> {s.choice}
              </div>
            ) : null}
          </li>
        ))}
        {/* ending node */}
        <li style={{ position: "relative", paddingLeft: "1.8rem" }}>
          <span aria-hidden="true" style={{ position: "absolute", left: "-1px", top: "0.15rem", width: 14, height: 14, borderRadius: "50%", background: "#FAF7F2", border: "3px solid #C4A35A" }} />
          <div style={{ fontFamily: "var(--serif, Georgia, serif)", fontStyle: "italic", color: "#DCC088", fontSize: "1.05rem" }}>{endingLabel}</div>
        </li>
      </ol>

      {totalEndings > 1 ? (
        <p style={{ fontFamily: "var(--sans)", fontSize: "0.78rem", color: "#8a7d70", marginTop: "0.9rem", marginBottom: 0 }}>
          Other choices lead elsewhere — {totalEndings - 1} more ending{totalEndings - 1 === 1 ? "" : "s"} to discover.
        </p>
      ) : null}
    </div>
  );
}
