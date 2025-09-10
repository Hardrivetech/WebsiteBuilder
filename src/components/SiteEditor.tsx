import React, { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { TemplatePreview } from "./TemplatePreview";

// Simple schema: sites(id, owner, slug unique, data jsonb, created_at)

const templates = [
  { id: "landing", name: "Landing (Cards)" },
  { id: "simple", name: "Simple" },
];

export function SiteEditor() {
  const [slug, setSlug] = useState("mybrand");
  const [title, setTitle] = useState("My Product");
  const [tagline, setTagline] = useState("Do more with less");
  const [features, setFeatures] = useState<string>("Fast,Simple,Affordable");
  const [cta, setCta] = useState("Get Started");
  const [template, setTemplate] = useState("landing");
  const [primary, setPrimary] = useState("#0ea5e9");
  const [bg, setBg] = useState("#ffffff");
  const [text, setText] = useState("#111827");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const previewData = useMemo(
    () => ({
      title,
      tagline,
      features: features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      cta,
      theme: { primary, bg, text },
    }),
    [title, tagline, features, cta, primary, bg, text]
  );

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const data = previewData as any;
    const { data: user } = await supabase.auth.getUser();
    const owner = user.user?.id;

    const { error } = await supabase
      .from("sites")
      .upsert(
        { slug, owner, data: { ...data, template } },
        { onConflict: "slug" }
      );
    if (error) setMessage(error.message);
    else setMessage("Saved! Deploying in ~10s.");
    setSaving(false);
  };

  const exportZip = async () => {
    setMessage("Preparing ZIP...");
    const res = await fetch(`/api/export?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) {
      const msg = await res.text();
      setMessage(`Export failed: ${msg}`);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("ZIP downloaded");
  };

  return (
    <div>
      <label>Subdomain (slug)</label>
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }}
      />

      <label>Template</label>
      <select
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }}
      >
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <label>Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }}
      />

      <label>Tagline</label>
      <input
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }}
      />

      <label>Features (comma-separated)</label>
      <input
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
        style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }}
      />

      <label>CTA Text</label>
      <input
        value={cta}
        onChange={(e) => setCta(e.target.value)}
        style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          margin: "12px 0",
        }}
      >
        <div>
          <label>Primary</label>
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            style={{ width: "100%", height: 40 }}
          />
        </div>
        <div>
          <label>Background</label>
          <input
            type="color"
            value={bg}
            onChange={(e) => setBg(e.target.value)}
            style={{ width: "100%", height: 40 }}
          />
        </div>
        <div>
          <label>Text</label>
          <input
            type="color"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: "100%", height: 40 }}
          />
        </div>
      </div>

      <TemplatePreview template={template} data={previewData} />

      <div style={{ marginTop: 12 }}>
        <button onClick={save} disabled={saving} style={{ marginRight: 8 }}>
          Save & Deploy
        </button>
        <button onClick={exportZip}>Export ZIP</button>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}
