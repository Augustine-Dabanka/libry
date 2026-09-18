"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Tiptap-based rich-text editor. Exposes the same value/onChange(html) contract
// as the other editors, so it drops straight into the Chapter Editor. Note the
// `immediatelyRender: false` — required under the Next App Router to avoid an
// SSR hydration mismatch.
export default function TiptapEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: "le-img" } }),
      Placeholder.configure({ placeholder: "Write your chapter…" }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const path = `chapter-images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("book-media").upload(path, file, { contentType: file.type });
      if (error) return;
      const url = supabase.storage.from("book-media").getPublicUrl(path).data.publicUrl;
      editor.chain().focus().setImage({ src: url }).run();
    } catch { /* ignore */ }
    if (fileRef.current) fileRef.current.value = "";
  }

  if (!editor) return null;

  const btn = (label: string, active: boolean, onClick: () => void, title?: string) => (
    <button type="button" title={title || label} onClick={onClick}
      style={{ background: active ? "var(--gold)" : "transparent", color: active ? "#12100E" : "var(--ivory-muted)", border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.82rem", fontWeight: 700, padding: "0.3rem 0.55rem", minWidth: 30 }}>
      {label}
    </button>
  );

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--charcoal)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", padding: "0.5rem", borderBottom: "1px solid var(--border)", background: "var(--stone)" }}>
        {btn("B", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Bold")}
        {btn("I", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Italic")}
        {btn("H", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "Heading")}
        {btn("❝", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "Quote")}
        {btn("•", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "Bullet list")}
        {btn("1.", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Numbered list")}
        {btn("―", false, () => editor.chain().focus().setHorizontalRule().run(), "Divider")}
        <button type="button" title="Image" onClick={() => fileRef.current?.click()} style={{ background: "transparent", color: "var(--ivory-muted)", border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", fontSize: "0.9rem", padding: "0.3rem 0.55rem" }}>🖼</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickImage} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
