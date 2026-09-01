import { type Book } from "@/lib/types";

function coverGradient(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) % 360;
  return `linear-gradient(150deg, hsl(${h} 32% 30%), hsl(${(h + 40) % 360} 36% 17%))`;
}

const OFFSETS = [0, 72, 104, 72, 0, -72, -104, -72];

type Node = { kind: "book"; book: Book } | { kind: "chest" };

export default function LearningPath({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return (
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "3rem 2rem",
          textAlign: "center",
          background: "var(--stone)",
        }}
      >
        <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Your path starts here.</p>
        <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>
          No stories yet — once creators publish, your reading path fills in with
          books and reward chests.
        </p>
      </div>
    );
  }

  const nodes: Node[] = [];
  books.forEach((book, i) => {
    nodes.push({ kind: "book", book });
    if ((i + 1) % 3 === 0) nodes.push({ kind: "chest" });
  });

  return (
    <div style={{ position: "relative", maxWidth: 560, margin: "0 auto", padding: "1.5rem 0 3rem" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: 0,
          borderLeft: "3px dashed var(--border)",
          transform: "translateX(-50%)",
        }}
      />
      {nodes.map((node, i) => {
        const offset = OFFSETS[i % OFFSETS.length];
        const isNext = i === 0 && node.kind === "book";
        return (
          // Wrapper holds the static zig-zag offset; inner elements animate.
          <div
            key={i}
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              justifyContent: "center",
              transform: `translateX(${offset}px)`,
              marginBottom: "1.7rem",
            }}
          >
            <div className="lb-pop" style={{ animationDelay: `${Math.min(i * 0.07, 0.8)}s` }}>
              {node.kind === "book" ? (
                <a
                  href={`/book/${node.book.id}`}
                  className="lb-node"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", width: 150 }}
                >
                  <span
                    className={isNext ? "lb-ring" : undefined}
                    style={{
                      width: 86,
                      height: 86,
                      borderRadius: "50%",
                      background: coverGradient(node.book.title),
                      boxShadow: "0 8px 20px rgba(0,0,0,0.45), inset 0 -4px 10px rgba(0,0,0,0.35)",
                      border: "3px solid rgba(196,163,90,0.5)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "1.6rem",
                    }}
                  >
                    📖
                  </span>
                  <span
                    style={{
                      marginTop: "0.5rem",
                      fontFamily: "var(--serif)",
                      fontStyle: "italic",
                      fontSize: "0.9rem",
                      color: "var(--ivory)",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {node.book.title}
                  </span>
                </a>
              ) : (
                <span
                  className="lb-chest"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: "linear-gradient(150deg, var(--gold), var(--terracotta))",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "1.6rem",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                  }}
                  title="Reward chest"
                >
                  🎁
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
