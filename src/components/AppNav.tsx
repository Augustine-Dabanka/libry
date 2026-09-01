import { createClient } from "@/lib/supabase/server";

// Shared app navbar (server component) — reads the signed-in user for the
// user chip + sign-out. Uses the design-system classes from globals.css.
export default async function AppNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .maybeSingle();
    name = profile?.full_name || profile?.username || user.email || "";
  }

  return (
    <nav className="navbar">
      <div className="nav-left" style={{ display: "flex", alignItems: "center", gap: "1.6rem" }}>
        <a href="/home" className="logo">
          Libry<span>.</span>
        </a>
        <ul className="nav-links">
          <li>
            <a href="/home">Home</a>
          </li>
          <li>
            <a href="/catalog">Catalog</a>
          </li>
          <li>
            <a href="/leagues">Leagues</a>
          </li>
          <li>
            <a href="/shop">Shop</a>
          </li>
          <li>
            <a href="/creator">Write</a>
          </li>
        </ul>
      </div>

      <div className="nav-right">
        <form action="/catalog" method="get" className="search-box">
          <input name="q" placeholder="Search books…" aria-label="Search books" />
          <button type="submit" aria-label="Search">
            ⌕
          </button>
        </form>
        {user ? (
          <>
            <a href="/settings" style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }} title="Reader settings">
              {name}
            </a>
            <form action="/auth/signout" method="post">
              <button className="btn btn-outline" type="submit">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <a href="/login" className="btn btn-gold">
            Sign in
          </a>
        )}
      </div>
    </nav>
  );
}
