"use client";

import { useState } from "react";

type Node = {
  text: string;
  choices?: { label: string; to: string }[];
  end?: boolean;
};

const STORY: Record<string, Node> = {
  start: {
    text: "You reach a fork in the Forgotten Forest. A lantern flickers to your left; a low growl rumbles to your right.",
    choices: [
      { label: "Follow the lantern", to: "lantern" },
      { label: "Face the growl", to: "growl" },
    ],
  },
  lantern: {
    text: "The lantern drifts ahead and lights a hidden door etched with silver runes that pulse as you approach.",
    choices: [
      { label: "Open the door", to: "door" },
      { label: "Turn back", to: "start" },
    ],
  },
  growl: {
    text: "A great wolf steps out — but its eyes are kind. It lowers its head, inviting you to climb on.",
    choices: [
      { label: "Climb on", to: "ride" },
      { label: "Back away", to: "start" },
    ],
  },
  door: { text: "Beyond the door, a staircase spirals down into starlight… and that's where your story truly begins.", end: true },
  ride: { text: "The wolf bounds through the trees, the wind in your hair… and that's where your story truly begins.", end: true },
};

export default function StoryChoiceDemo() {
  const [id, setId] = useState("start");
  const node = STORY[id];

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 20,
        padding: "1.6rem",
        boxShadow: "var(--shadow)",
        maxWidth: 420,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold)" }}>
          ✦ Interactive · try it
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--serif, 'Fraunces', Georgia, serif)",
          fontSize: "1.15rem",
          lineHeight: 1.5,
          color: "var(--ink)",
          minHeight: "5.2em",
        }}
      >
        {node.text}
      </p>

      {node.end ? (
        <div style={{ marginTop: "0.4rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <a
            href="/onboarding"
            style={{
              display: "block",
              textAlign: "center",
              background: "var(--gold)",
              color: "#20180a",
              borderRadius: 999,
              padding: "0.8rem",
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
            style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.85rem" }}
          >
            ↺ Start over
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.4rem" }}>
          {node.choices!.map((c) => (
            <button
              key={c.to + c.label}
              type="button"
              onClick={() => setId(c.to)}
              style={{
                textAlign: "left",
                background: "var(--card2, #211C18)",
                border: "1px solid var(--line)",
                borderBottom: "3px solid rgba(0,0,0,0.45)",
                borderRadius: 14,
                padding: "0.85rem 1.1rem",
                color: "var(--ink)",
                fontFamily: "var(--sans, 'Plus Jakarta Sans', sans-serif)",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "border-color 0.15s ease",
              }}
            >
              → {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
