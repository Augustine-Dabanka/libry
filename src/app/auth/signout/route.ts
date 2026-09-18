import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { origin } = new URL(request.url);
  // 303 so the browser switches the POST to a GET on the redirect.
  // Land on the public home page (not the sign-in wall) so signing out feels
  // like stepping back to the storefront, not being locked out.
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
