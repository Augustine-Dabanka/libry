"use client";

import { useState } from "react";

import Glyph from "@/components/Glyph";
type Node = {
  text: string;
  choices?: { label: string; to: string }[];
  end?: boolean;
};

// A tiny branching demo, themed light-vs-shadow to match the hero art.
const STORY: Record<string, Node> = {
  start: {
    text: "The path splits. Who will you become?",
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
        border: "none",
        boxShadow: "0 8px 0 #8F2F12, 0 24px 48px rgba(143,47,18,0.28)",
        // Cinematic light-into-shadow gradient ground.
        background:
          "#C8471F",
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
          background: "radial-gradient(circle, rgba(255,214,190,0.35), transparent 70%)",
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
              color: "#FFFFFF",
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
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 999,
              padding: "0.22rem 0.6rem",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#FFFFFF",
              fontFamily: "var(--sans, 'Plus Jakarta Sans', sans-serif)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 0 3px rgba(255,255,255,0.25)" }} />
            Live demo · try it
          </span>
        </div>

        <p
          style={{
            fontFamily: "var(--serif, 'Fraunces', Georgia, serif)",
            fontStyle: "italic",
            fontSize: isStart ? "1.5rem" : "1.18rem",
            lineHeight: 1.35,
            color: "#FFFFFF",
            minHeight: "4.6em",
            margin: 0,
          }}
        >
          {node.text}
        </p>

        {isStart ? (
          <p style={{ margin: "0.6rem 0 0", color: "#FFF3EC", fontFamily: "var(--sans, 'Nunito', sans-serif)", fontSize: "0.9rem" }}>
            Your choices shape the story. Live. Breathe. Decide.
          </p>
        ) : null}

        {node.end ? (
          <div style={{ marginTop: "1.3rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <a
              href="/onboarding"
              style={{
                display: "block",
                textAlign: "center",
                background: "#FFFFFF",
                color: "#C8471F",
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
              style={{ background: "transparent", border: "none", color: "#FFF3EC", cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.85rem" }}
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
                  background: "#FFFFFF",
                  border: "none",
                  boxShadow: "0 4px 0 #8F2F12",
                  borderRadius: 14,
                  padding: "0.9rem 1.1rem",
                  color: "#1D1A17",
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
                  {isStart ? <Glyph e={i === 0 ? "⚔" : "🌙"} /> : "→"}
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
