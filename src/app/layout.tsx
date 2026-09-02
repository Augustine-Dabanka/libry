import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Libry — Stories worth lingering in",
  description:
    "Curated books and interactive, choose-your-path storybooks. Reading streaks, read-aloud in five languages, and 70% to the creators you love.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Bare :root in globals.css is the dark theme; [data-theme="light"] flips it.
  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var b=localStorage.getItem('libry-brand');if(b)document.documentElement.setAttribute('data-brand',b);}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
