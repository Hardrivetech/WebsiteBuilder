import { createClient } from "@supabase/supabase-js";
import { Zip, strToU8 } from "fflate";

// Simple in-memory token bucket per IP (per instance). Good enough for MVP.
const buckets = new Map<string, { tokens: number; ts: number }>();
const RATE = 5; // tokens per window
const WINDOW_MS = 60_000; // 1 minute

function rateLimit(key: string) {
  const now = Date.now();
  const b = buckets.get(key) || { tokens: RATE, ts: now };
  const refill = Math.floor((now - b.ts) / WINDOW_MS) * RATE;
  const tokens = Math.min(RATE, b.tokens + Math.max(refill, 0));
  const next = { tokens, ts: tokens === RATE ? now : b.ts };
  if (next.tokens <= 0) {
    buckets.set(key, next);
    return false;
  }
  next.tokens -= 1;
  buckets.set(key, next);
  return true;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderLandingHTML(site: any): string {
  const data = site;
  const theme = {
    primary: data?.theme?.primary || "#0ea5e9",
    bg: data?.theme?.bg || "#ffffff",
    text: data?.theme?.text || "#111827",
  };
  const features = (data?.features || [])
    .map(
      (f: string) => `<div class="card"><strong>${escapeHtml(f)}</strong></div>`
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(
    data.title
  )}</title><style>body{font-family:Inter,system-ui;margin:0;color:${
    theme.text
  };background:${
    theme.bg
  }}.hero{padding:80px 24px;text-align:center;background:#f8fafc}.title{font-size:48px;margin:0 0 8px}.tagline{font-size:20px;color:#475569;margin:0 0 24px}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding:24px; max-width: 960px; margin: 0 auto;}.card{border:1px solid #e2e8f0;border-radius:12px;padding:16px}.cta{background:${
    theme.primary
  };color:white;padding:12px 20px;border-radius:10px;text-decoration:none;display:inline-block}</style></head><body><section class="hero"><h1 class="title">${escapeHtml(
    data.title
  )}</h1><p class="tagline">${escapeHtml(
    data.tagline
  )}</p><a class="cta" href="#get-started">${escapeHtml(
    data.cta
  )}</a></section><section class="features">${features}</section></body></html>`;
}

function renderSimpleHTML(site: any): string {
  const data = site;
  const theme = {
    primary: data?.theme?.primary || "#0ea5e9",
    bg: data?.theme?.bg || "#ffffff",
    text: data?.theme?.text || "#111827",
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(
    data.title
  )}</title><style>body{font-family:Inter,system-ui;margin:0;color:${
    theme.text
  };background:${
    theme.bg
  }}.hero{padding:80px 24px;text-align:center;background:#f8fafc}.title{font-size:42px;margin:0 0 8px}.tagline{font-size:18px;color:#475569;margin:0 0 24px}.cta{background:${
    theme.primary
  };color:white;padding:10px 18px;border-radius:10px;text-decoration:none;display:inline-block}</style></head><body><section class="hero"><h1 class="title">${escapeHtml(
    data.title
  )}</h1><p class="tagline">${escapeHtml(
    data.tagline
  )}</p><a class="cta" href="#get-started">${escapeHtml(
    data.cta
  )}</a></section></body></html>`;
}

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return new Response("Missing slug", { status: 400 });

  // Rate limiting by IP
  const ip = request.headers.get("CF-Connecting-IP") || "anon";
  if (!rateLimit(`export:${ip}`))
    return new Response("Rate limit exceeded", { status: 429 });

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from("sites")
    .select("data")
    .eq("slug", slug)
    .single();
  if (error || !data) return new Response("Not found", { status: 404 });

  const site = data.data;
  const template = site.template || "landing";
  const html =
    template === "simple" ? renderSimpleHTML(site) : renderLandingHTML(site);

  // Build ZIP with index.html
  const chunks: Uint8Array[] = [];
  const zip = new Zip((err, data, final) => {
    if (err) throw err;
    chunks.push(data);
  });
  zip.add("index.html", strToU8(html));
  zip.end();

  const blob = new Blob(chunks, { type: "application/zip" });

  // Fire-and-forget analytics event
  try {
    const supa = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    await supa
      .from("events")
      .insert({ type: "export", slug, ts: new Date().toISOString() });
  } catch {}

  return new Response(blob, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${slug}.zip"`,
    },
  });
};
