"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Marks the viewer's unread notifications read once the page is open, so the
// nav badge clears on the next navigation. Best-effort and guarded.
export default function MarkNotificationsRead({ userId }: { userId: string }) {
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
      } catch { /* table not migrated — ignore */ }
    })();
  }, [userId]);
  return null;
}
