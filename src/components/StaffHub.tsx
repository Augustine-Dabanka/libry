"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addStaff, linkRoster, sendStaffMessage, setStaffRole } from "@/app/actions/staff";
import { play } from "@/lib/sound";

export type HubMember = { id: string; name: string; username: string | null; role: string; roleName: string; finance: boolean; code?: string | null };
export type RosterEntry = { code: string; name: string; role: string; roleName: string; linked: string | null };
export type HubMessage = { id: number; channel: string; sender_id: string | null; kind: "text" | "system" | "call" | "command"; body: string; created_at: string };
type RoleOpt = { key: string; name: string; does: string };

const dm = (a: string, b: string) => `dm:${[a, b].sort().join(":")}`;
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// The admin team room: a global channel, one-to-one DMs, slash commands and
// video-call links. Messages arrive live (Supabase Realtime); sending and every
// command go through the server, which checks the sender's rank.
export default function StaffHub({ me, team, roles, assignable, initial, roster = [] }: {
  roster?: RosterEntry[];
  me: { id: string; name: string; roleName: string; canAssign: boolean };
  team: HubMember[];
  roles: RoleOpt[];
  assignable: string[];
  initial: HubMessage[];
}) {
  const [tab, setTab] = useState<"chat" | "team">("chat");
  const [channel, setChannel] = useState("global");
  const [msgs, setMsgs] = useState<HubMessage[]>(initial);
  const [text, setText] = useState("");
  const [note, setNote] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState(team);
  const [newUser, setNewUser] = useState("");
  const [newRole, setNewRole] = useState(assignable[assignable.length - 1] || "staff");
  const list = useRef<HTMLDivElement>(null);
  const [linkFor, setLinkFor] = useState<Record<string, string>>({});
  async function link(code: string) {
    const h = (linkFor[code] || "").trim();
    if (!h) return;
    const r = await linkRoster(code, h);
    setNote("error" in r ? { ok: false, t: r.error } : { ok: true, t: r.note || "Linked. Refresh to see it in the team list." });
  }
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  useEffect(() => {
    const sb = createClient();
    const ch = sb.channel("staff-room")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "staff_messages" }, (p) => {
        const m = p.new as HubMessage;
        setMsgs((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
        if (m.sender_id !== me.id) play("pop");
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [me.id]);

  useEffect(() => {
    // Load this channel's history when switching.
    (async () => {
      const { data } = await createClient().from("staff_messages").select("id, channel, sender_id, kind, body, created_at").eq("channel", channel).order("created_at", { ascending: false }).limit(80);
      if (data) setMsgs((cur) => {
        const keep = cur.filter((m) => m.channel !== channel);
        return [...keep, ...(data as HubMessage[]).reverse()];
      });
    })();
  }, [channel]);

  const shown = msgs.filter((m) => m.channel === channel);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [shown.length]);

  async function send(e?: React.FormEvent, override?: string) {
    e?.preventDefault();
    const body = (override ?? text).trim();
    if (!body) return;
    setBusy(true); setNote(null);
    const r = await sendStaffMessage(channel, body);
    setBusy(false);
    if ("error" in r) { setNote({ ok: false, t: r.error }); play("error"); return; }
    if (!override) setText("");
    if (r.note) setNote({ ok: true, t: r.note });
  }

  async function changeRole(id: string, role: string) {
    const r = await setStaffRole(id, role as never);
    if ("error" in r) { setNote({ ok: false, t: r.error }); return; }
    setMembers((ms) => (role === "none" ? ms.filter((m) => m.id !== id) : ms.map((m) => (m.id === id ? { ...m, role, roleName: roles.find((x) => x.key === role)?.name || role } : m))));
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await addStaff(newUser, newRole as never);
    if ("error" in r) { setNote({ ok: false, t: r.error }); return; }
    setNote({ ok: true, t: `Added @${newUser.replace(/^@/, "")}. Refresh to see them in the list.` });
    setNewUser("");
  }

  const label = (c: string) => (c === "global" ? "# everyone" : `@ ${byId.get(c.split(":").slice(1).find((x) => x !== me.id) || "")?.name || "Direct message"}`);
  const chip = (on: boolean): React.CSSProperties => ({ textAlign: "left", width: "100%", padding: "0.5rem 0.7rem", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 800, fontSize: "0.88rem", background: on ? "var(--gold-tint)" : "transparent", color: on ? "var(--gold)" : "var(--ivory)" });

  return (
    <section className="section" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Team room</h1>
          <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontWeight: 700 }}>You&apos;re signed in as <strong style={{ color: "var(--gold)" }}>{me.roleName}</strong>. Type <code>/help</code> to see your commands.</p>
        </div>
        <div className="st-tabs" role="tablist" style={{ position: "static", margin: 0 }}>
          <button role="tab" type="button" className="st-tab" aria-selected={tab === "chat"} onClick={() => setTab("chat")}>Chat</button>
          <button role="tab" type="button" className="st-tab" aria-selected={tab === "team"} onClick={() => setTab("team")}>Team</button>
        </div>
      </div>

      {tab === "chat" ? (
        <div className="hub-grid">
          <aside className="hub-side" aria-label="Conversations">
            <button type="button" style={chip(channel === "global")} onClick={() => setChannel("global")}># everyone</button>
            <div style={{ margin: "0.6rem 0 0.3rem", fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", color: "var(--muted)" }}>DIRECT</div>
            {members.filter((m) => m.id !== me.id).map((m) => (
              <button key={m.id} type="button" style={chip(channel === dm(me.id, m.id))} onClick={() => setChannel(dm(me.id, m.id))}>
                {m.name} <span style={{ color: "var(--muted)", fontWeight: 700, fontSize: "0.75rem" }}>· {m.roleName}</span>
              </button>
            ))}
            {members.length <= 1 ? <p style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600 }}>Add teammates in Team &amp; ranks.</p> : null}
          </aside>
          <div className="hub-main">
            <div className="hub-head">
              <strong>{label(channel)}</strong>
              <button type="button" className="btn btn-outline" onClick={() => send(undefined, "/call")} disabled={busy} style={{ padding: "0.4rem 0.9rem" }}>Start video call</button>
            </div>
            <div ref={list} className="hub-list" aria-live="polite">
              {shown.length === 0 ? <p style={{ color: "var(--muted)", textAlign: "center", fontWeight: 700 }}>No messages yet. Say hello.</p> : null}
              {shown.map((m) => {
                const who = m.sender_id ? byId.get(m.sender_id) : null;
                const mine = m.sender_id === me.id;
                if (m.kind === "call") return (
                  <div key={m.id} className="hub-call">
                    <span>📹 {who?.name || "Someone"} started a video call</span>
                    <a className="btn btn-gold" href={m.body} target="_blank" rel="noreferrer" style={{ padding: "0.35rem 0.9rem" }}>Join</a>
                  </div>
                );
                if (m.kind === "command" || m.kind === "system") return (
                  <div key={m.id} className={m.kind === "system" ? "hub-announce" : "hub-cmd"}>{m.kind === "system" ? "📣 " : ""}{m.body}<span> · {time(m.created_at)}</span></div>
                );
                return (
                  <div key={m.id} className={`hub-msg${mine ? " mine" : ""}`}>
                    <div className="hub-meta">{mine ? "You" : who?.name || "Former teammate"} <span>{who ? who.roleName : ""} · {time(m.created_at)}</span></div>
                    <div className="hub-bubble">{m.body}</div>
                  </div>
                );
              })}
            </div>
            {note ? <pre role={note.ok ? "status" : "alert"} className="hub-note" style={{ color: note.ok ? "var(--ivory)" : "var(--danger)" }}>{note.t}</pre> : null}
            <form onSubmit={send} className="hub-form">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={channel === "global" ? "Message everyone, or /help" : "Message, or /help"} aria-label="Message" maxLength={4000} />
              <button className="btn btn-gold" type="submit" disabled={busy || !text.trim()}>Send</button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div className="hub-card">
            <h3 style={{ marginTop: 0 }}>Ranks and what they can do</h3>
            <ol style={{ margin: 0, paddingLeft: "1.2rem", display: "grid", gap: "0.35rem" }}>
              {roles.map((r) => <li key={r.key}><strong>{r.name}</strong> <span style={{ color: "var(--muted)", fontWeight: 600 }}>— {r.does}</span></li>)}
            </ol>
          </div>
          {roster.length ? (
            <div className="hub-card">
              <h3 style={{ marginTop: 0 }}>Staff IDs</h3>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table" style={{ minWidth: 560 }}>
                  <thead><tr><th>Staff ID</th><th>Name</th><th>Rank</th><th>Account</th></tr></thead>
                  <tbody>
                    {roster.map((r) => (
                      <tr key={r.code}>
                        <td><code style={{ color: "var(--gold)", fontWeight: 800 }}>{r.code}</code></td>
                        <td>{r.name}</td>
                        <td>{r.roleName}</td>
                        <td>
                          {r.linked ? <span style={{ color: "var(--success)", fontWeight: 800 }}>Linked · {r.linked}</span> : me.canAssign ? (
                            <span style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <input className="hub-input" style={{ width: 140 }} placeholder="@username" aria-label={`Account for ${r.name}`} value={linkFor[r.code] || ""} onChange={(e) => setLinkFor((m) => ({ ...m, [r.code]: e.target.value }))} />
                              <button type="button" className="btn btn-outline" style={{ padding: "0.35rem 0.8rem" }} onClick={() => link(r.code)}>Link</button>
                            </span>
                          ) : <span style={{ color: "var(--muted)" }}>Not linked yet</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          <div className="hub-card">
            <h3 style={{ marginTop: 0 }}>Team</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ minWidth: 520 }}>
                <thead><tr><th>Name</th><th>Rank</th><th /></tr></thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>{m.code ? <code style={{ marginRight: 6, color: "var(--gold)", fontWeight: 800 }}>{m.code}</code> : null}{m.name}{m.username ? <span style={{ color: "var(--muted)" }}> @{m.username}</span> : null}{m.role === "accountant_2" ? <span style={{ color: m.finance ? "var(--success)" : "var(--muted)", fontWeight: 800 }}> · payouts {m.finance ? "allowed" : "locked"}</span> : null}</td>
                      <td>{m.roleName}</td>
                      <td>
                        {me.canAssign && m.id !== me.id && assignable.includes(m.role) ? (
                          <select aria-label={`Rank for ${m.name}`} value={m.role} onChange={(e) => changeRole(m.id, e.target.value)}>
                            {roles.filter((r) => assignable.includes(r.key)).map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
                            <option value="none">Remove from team</option>
                          </select>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {me.canAssign ? (
              <form onSubmit={add} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                <input value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="@username" aria-label="Username to add" style={{ flex: "1 1 160px" }} className="hub-input" />
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} aria-label="Rank" className="hub-input">
                  {roles.filter((r) => assignable.includes(r.key)).map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
                </select>
                <button className="btn btn-gold" type="submit" disabled={!newUser.trim()}>Add to team</button>
              </form>
            ) : null}
            {note ? <p role="status" style={{ color: note.ok ? "var(--success)" : "var(--danger)", fontWeight: 800 }}>{note.t}</p> : null}
          </div>
        </div>
      )}
    </section>
  );
}
