import Link from "next/link";

// Shown instead of the admin panel to anyone who isn't signed in as staff.
// Access is decided on the server (see isAdmin in actions/admin.ts).
export default function AdminGate({ signedIn, email }: { signedIn: boolean; email: string | null }) {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "1.5rem", background: "var(--charcoal)" }}>
      <div style={{ width: "100%", maxWidth: 380, background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 18, padding: "2rem 1.8rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>Staff only</h1>
        {signedIn ? (
          <>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", marginBottom: "1.3rem" }}>
              {email ?? "This account"} isn&apos;t on the staff list. Sign in with your staff account instead.
            </p>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>Switch account</button>
            </form>
          </>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", marginBottom: "1.3rem" }}>
              Sign in with your staff account to continue.
            </p>
            <Link href="/login?next=/admin" className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }}>Sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}
