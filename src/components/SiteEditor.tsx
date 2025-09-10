import React, { useState } from "react";
import { supabase } from "../lib/supabase";

// Simple schema: sites(id, owner, slug unique, data jsonb, created_at)

export function SiteEditor() {
  const [slug, setSlug] = useState("mybrand");
  const [title, setTitle] = useState("My Product");
  const [tagline, setTagline] = useState("Do more with less");
  const [features, setFeatures] = useState<string>("Fast,Simple,Affordable");
  const [cta, setCta] = useState("Get Started");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const data = {
      title,
      tagline,
      features: features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      cta,
    };
    const { data: user } = await supabase.auth.getUser();
    const owner = user.user?.id;

    const { error } = await supabase
      .from("sites")
      .upsert({ slug, owner, data }, { onConflict: "slug" });
    if (error) setMessage(error.message);
    else setMessage("Saved! Deploying in ~10s.");
    setSaving(false);
  };

  return (
    <div>
      <label>Subdomain (slug)</label>
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }}
      />

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

      <button onClick={save} disabled={saving}>
        Save & Deploy
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
