import { redirect } from "next/navigation";

// Legacy URL: send visitors into the normal account creation flow.
export default function WaitlistPage(): never {
  redirect("/login?auth=signup");
}
