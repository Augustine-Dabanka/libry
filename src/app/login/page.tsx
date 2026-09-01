import GoogleButton from "@/components/GoogleButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--stone)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "2.6rem 2rem",
          boxShadow: "var(--shadow)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.6rem" }}>
          <span className="logo" style={{ fontSize: "2rem" }}>
            Libry<span>.</span>
          </span>
        </div>
        <h1 style={{ fontSize: "1.6rem", textAlign: "center", marginBottom: "0.4rem" }}>
          Welcome back.
        </h1>
        <p style={{ color: "var(--muted)", textAlign: "center", marginBottom: "1.9rem" }}>
          Sign in to pick up where you left off.
        </p>

        <GoogleButton next={next} />

        {error ? (
          <p
            style={{
              color: "var(--terracotta)",
              textAlign: "center",
              marginTop: "1rem",
              fontSize: "0.9rem",
            }}
          >
            Sign-in failed. Please try again.
          </p>
        ) : null}
      </div>
    </main>
  );
}
