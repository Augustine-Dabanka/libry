import type { ReactNode } from "react";
import AppNav from "@/components/AppNav";
import BackButton from "@/components/BackButton";

export type DocTab = { key: string; label: string };

export default function DocsLayout({
  title,
  basePath,
  tabs,
  active,
  children,
}: {
  title: string;
  basePath: string;
  tabs: DocTab[];
  active: string;
  children: ReactNode;
}) {
  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.6rem" }}>
          <BackButton fallback="/" />
          <h2 style={{ margin: 0 }}>{title}</h2>
        </div>
        <div className="docs-grid">
          <nav className="docs-side">
            {tabs.map((t) => (
              <a key={t.key} href={`${basePath}?tab=${t.key}`} className={t.key === active ? "active" : undefined}>
                {t.label}
              </a>
            ))}
          </nav>
          <article className="docs-prose">{children}</article>
        </div>
      </section>
    </>
  );
}
