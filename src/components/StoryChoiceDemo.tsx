"use client";

import { useState } from "react";

type Node = {
  text: string;
  choices?: { label: string; to: string }[];
  end?: boolean;
};

// A tiny branching demo, themed light-vs-shadow to match the hero art.
const STORY: Record<string, Node> = {
  start: {
    text: "The path splits before you. A lantern glows warm to the left; something stirs in the shadows to the right. Who will you become?",
    choices: [
      { label: "Step into the light", to: "light" },
      { label: "Venture into shadow", to: "shadow" },
    ],
  },
  light: {
    text: "The lantern drifts ahead and lights a hidden door etched with silver runes that pulse as you draw near.",
    choices: [
      { label: "Open the door", to: "door" },
      { label: "Turn back", to: "start" },
    ],
  },
  shadow: {
    text: "A great wolf steps out of the dark — but its eyes are kind. It lowers its head, inviting you to climb on.",
    choices: [
      { label: "Climb on", to: "ride" },
      { label: "Back away", to: "start" },
    ],
  },
  door: { text: "Beyond the door, a staircase spirals down into starlight… and that's where your story truly begins.", end: true },
  ride: { text: "The wolf bounds through the trees, wind in your hair… and that's where your story truly begins.", end: true },
};

export default function StoryChoiceDemo() {
  const [id, setId] = useState("start");
  const node = STORY[id];
  const isStart = id === "start";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 440,
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid rgba(196,163,90,0.28)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
        // Cinematic light-into-shadow gradient ground.
        background:
          "radial-gradient(120% 80% at 78% 0%, rgba(220,192,136,0.22), transparent 60%), linear-gradient(160deg, #2a2118 0%, #1a1410 55%, #120d0a 100%)",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -60,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(220,192,136,0.28), transparent 70%)",
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", padding: "1.7rem 1.6rem 1.6rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#DCC088",
              fontFamily: "var(--sans, 'Plus Jakarta Sans', sans-serif)",
            }}
          >
            ✦ Interactive story
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "rgba(250,247,242,0.08)",
              border: "1px solid rgba(250,247,242,0.12)",
              borderRadius: 999,
              padding: "0.22rem 0.6rem",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#C6BEB2",
              fontFamily: "var(--sans, 'Plus Jakarta Sans', sans-serif)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4E9A6B", boxShadow: "0 0 0 3px rgba(78,154,107,0.2)" }} />
            Live demo · try it
          </span>
        </div>

        <p
          style={{
            fontFamily: "var(--serif, 'Fraunces', Georgia, serif)",
            fontStyle: "italic",
            fontSize: isStart ? "1.5rem" : "1.18rem",
            lineHeight: 1.35,
            color: "#FAF7F2",
            minHeight: "4.6em",
            margin: 0,
          }}
        >
          {node.text}
        </p>

        {node.end ? (
          <div style={{ marginTop: "1.3rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <a
              href="/onboarding"
              style={{
                display: "block",
                textAlign: "center",
                background: "#C4A35A",
                color: "#20180a",
                borderRadius: 999,
                padding: "0.85rem",
                fontWeight: 800,
                fontFamily: "var(--sans, 'Plus Jakarta Sans', sans-serif)",
                textDecoration: "none",
              }}
            >
              Sign up to keep reading →
            </a>
            <button
              type="button"
              onClick={() => setId("start")}
              style={{ background: "transparent", border: "none", color: "#A8A29E", cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.85rem" }}
            >
              ↺ Start over
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "1.3rem" }}>
            {node.choices!.map((c, i) => (
              <button
                key={c.to + c.label}
                type="button"
                onClick={() => setId(c.to)}
                style={{
                  textAlign: "left",
                  background: "rgba(250,247,242,0.05)",
                  border: "1px solid rgba(250,247,242,0.12)",
                  borderRadius: 14,
                  padding: "0.9rem 1.1rem",
                  color: "#FAF7F2",
                  fontFamily: "var(--sans, 'Plus Jakarta Sans', sans-serif)",
                  fontWeight: 700,
                  fontSize: "0.98rem",
                  cursor: "pointer",
                  transition: "background 0.15s ease, border-color 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <span aria-hidden style={{ fontSize: "1.05rem", opacity: 0.9 }}>
                  {isStart ? (i === 0 ? "⚔" : "🌙") : "→"}
                </span>
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
