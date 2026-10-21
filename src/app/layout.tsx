import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import BackgroundFX from "@/components/BackgroundFX";
import AppFooter from "@/components/AppFooter";
import HelpButton from "@/components/HelpButton";
import CookieBanner from "@/components/CookieBanner";
import AppSplash from "@/components/AppSplash";
import SoundFX from "@/components/SoundFX";
import AmbienceHost from "@/components/AmbienceHost";
import { getThemeSchedule } from "@/lib/themeSchedule";
import { themeBootScript } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Lybry — Stories worth lingering in",
  description:
    "Curated books and interactive, choose-your-path storybooks. Free classics, honest reviews, and 65% to the creators you love.",
  applicationName: "Lybry",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Lybry" },
};

// Light app chrome (Laterite palette) + safe-area-aware viewport so the installed PWA feels native.
export const viewport: Viewport = {
  themeColor: "#FFFCF7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const seasons = await getThemeSchedule();
  // Light is the default look; dark is opt-in (Settings or the theme toggle).
  // suppressHydrationWarning: the inline script below sets data-theme on <html>
  // from localStorage before React hydrates, so the server/client attributes
  // differ by design — without this React 19 treats it as an unpatchable root
  // mismatch and can blank the page.
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var r=document.documentElement;var t=localStorage.getItem('libry-theme')||'light';var d=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;r.setAttribute('data-theme',d==='dark'?'dark':'light');var ac=localStorage.getItem('leep-accent');if(ac&&ac!=='laterite')r.setAttribute('data-accent',ac);var u=localStorage.getItem('leep-ui');if(u&&u!=='classic')r.setAttribute('data-ui',u);var ic=localStorage.getItem('leep-icons');if(ic&&ic!=='line')r.setAttribute('data-icons',ic);var fo=localStorage.getItem('leep-font');if(fo&&fo!=='classic')r.setAttribute('data-font',fo);var ts=localStorage.getItem('leep-text');if(ts&&ts!=='100')r.style.fontSize=ts+'%';if(localStorage.getItem('leep-motion')==='reduce')r.setAttribute('data-motion','reduce');}catch(e){}try{if(document.cookie.indexOf('leep_splash=1')>-1){document.documentElement.classList.add('leep-splash');document.cookie='leep_splash=; Max-Age=0; Path=/';}}catch(e){}`,
          }}
        />
        {/* Genre look + seasonal theme (by date, from the admin schedule). */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript(seasons) }} />
        <AppSplash />
        <SoundFX />
        <AmbienceHost />
        <BackgroundFX />
        {children}
        <AppFooter />
        <HelpButton />
        <CookieBanner />
      </body>
    </html>
  );
}
