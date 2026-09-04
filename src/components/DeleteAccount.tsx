"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions/account";

// "Danger zone" — permanently delete the reader's own account. Guarded behind
// an expand step plus a typed confirmation so it can't happen by accident.
export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    setErr(null);
    startTransition(async () => {
      const res = await deleteAccount();
      if (res?.error) {
        setErr(res.error);
        return;
      }
      // Account gone + session cleared — send them to the public landing.
      window.location.href = "/";
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => setOpen(true)}
        style={{ color: "var(--terracotta, #b5533f)", borderColor: "rgba(181,83,63,0.5)" }}
      >
        Delete account
      </button>
    );
  }

  const ready = confirm.trim().toUpperCase() === "DELETE";

  return (
    <div style={{ border: "1px solid rgba(181,83,63,0.4)", borderRadius: 12, padding: "1.1rem 1.2rem", background: "rgba(181,83,63,0.06)" }}>
      <p style={{ fontFamily: "var(--sans)", color: "var(--ivory)", fontSize: "0.92rem", marginBottom: "0.3rem", fontWeight: 700 }}>
        This can&apos;t be undone.
      </p>
      <p style={{ fontFamily: "var(--sans)", color: "var(--muted)", fontSize: "0.86rem", marginBottom: "0.9rem" }}>
        Deleting your account removes your profile, your books, your library, and your reading progress. Type
        <strong style={{ color: "var(--ivory)" }}> DELETE</strong> to confirm.
      </p>
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="DELETE"
        style={{
          width: "100%",
          padding: "0.6rem 0.9rem",
          background: "var(--charcoal)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          color: "var(--ivory)",
          fontFamily: "var(--sans)",
          outline: "none",
          marginBottom: "0.9rem",
        }}
      />
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          onClick={onDelete}
          disabled={!ready || pending}
          style={{ background: ready ? "var(--terracotta, #b5533f)" : "rgba(181,83,63,0.3)", color: "#fff", border: "none", cursor: ready ? "pointer" : "not-allowed" }}
        >
          {pending ? "Deleting…" : "Permanently delete my account"}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => { setOpen(false); setConfirm(""); setErr(null); }} disabled={pending}>
          Cancel
        </button>
      </div>
      {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.7rem" }}>{err}</p> : null}
    </div>
  );
}
