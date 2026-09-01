"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCollaborator, removeCollaborator } from "@/app/actions/collaboration";

type Collab = { userId: string; name: string };

export default function CollaboratorsPanel({
  bookId,
  collaborators,
}: {
  bookId: number;
  collaborators: Collab[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uname, setUname] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    setMsg(null);
    start(async () => {
      const res = await addCollaborator(bookId, uname);
      setMsg(res.message);
      if (res.ok) {
        setUname("");
        router.refresh();
      }
    });
  }

  function remove(userId: string) {
    start(async () => {
      await removeCollaborator(bookId, userId);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        className="btn btn-outline"
        style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}
        onClick={() => setOpen(true)}
        type="button"
      >
        👥 Co-authors{collaborators.length ? ` (${collaborators.length})` : ""}
      </button>
    );
  }

  return (
    <div
      style={{
        background: "var(--charcoal)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "0.7rem",
        minWidth: 240,
      }}
    >
      {collaborators.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.6rem" }}>
          {collaborators.map((c) => (
            <div key={c.userId} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontFamily: "var(--sans)" }}>
              <span style={{ flex: 1 }}>@{c.name}</span>
              <button
                type="button"
                onClick={() => remove(c.userId)}
                style={{ background: "none", border: "none", color: "var(--terracotta)", cursor: "pointer", fontSize: "0.78rem" }}
              >
                remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", fontFamily: "var(--sans)", marginBottom: "0.6rem" }}>
          No co-authors yet.
        </p>
      )}

      <div style={{ display: "flex", gap: "0.4rem" }}>
        <input
          value={uname}
          onChange={(e) => setUname(e.target.value)}
          placeholder="@username"
          style={{
            flex: 1,
            background: "var(--stone)",
            border: "1px solid var(--border)",
            borderRadius: 9,
            padding: "0.4rem 0.6rem",
            color: "var(--ivory)",
            fontFamily: "var(--sans)",
            fontSize: "0.82rem",
            outline: "none",
          }}
        />
        <button className="btn btn-gold" style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }} onClick={add} disabled={pending} type="button">
          Add
        </button>
      </div>
      {msg ? <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.5rem" }}>{msg}</p> : null}
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.78rem", marginTop: "0.4rem" }}
      >
        Close
      </button>
    </div>
  );
}
