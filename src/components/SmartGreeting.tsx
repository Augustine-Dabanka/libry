"use client";

import { useEffect, useState } from "react";
import { greet } from "@/lib/greeting";

// The home heading. The server renders a plain "Welcome back"; once in the
// browser we know the reader's local time, so we swap in the day's greeting.
export default function SmartGreeting({ name, dob }: { name: string; dob?: string | null }) {
  const [g, setG] = useState<{ line: string; emoji?: string } | null>(null);
  useEffect(() => { setG(greet(name || "reader", { dob })); }, [name, dob]);
  const first = (name || "reader").split(" ")[0];
  return (
    <h1 className="smart-greet" aria-live="polite">
      {g ? (
        <span key={g.line} className="sg-in">{g.line}{g.emoji ? <span aria-hidden="true" className="sg-emoji"> {g.emoji}</span> : null}</span>
      ) : (
        <>Welcome back, <span style={{ fontStyle: "italic" }}>{first}</span></>
      )}
    </h1>
  );
}
