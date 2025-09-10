import { createClient } from "@supabase/supabase-js";
import React from "react";
import { renderToString } from "react-dom/server";
import { LandingTemplate } from "../templates/landing";
import { SimpleTemplate } from "../templates/simple";

// Pages Functions entry — handles subdomain routing like {slug}.yourdomain.com
// For local dev, path-based fallback /s/{slug} also supported

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // Determine slug from subdomain or /s/{slug}
  let slug: string | null = null;
  const host = url.hostname;
  const root = env.ROOT_DOMAIN as string | undefined;

  // If HOST is like slug.yourdomain.com and root domain is configured
  if (root && host.endsWith(root)) {
    const sub = host.replace(`.${root}`, "");
    if (sub && sub !== host && !host.startsWith("www.")) slug = sub;
  }

  // Path fallback: /s/{slug}
  if (!slug && params?.path) {
    const p = Array.isArray(params.path) ? params.path.join("/") : params.path;
    const m = p.match(/^s\/(.+)$/);
    if (m) slug = m[1];
  }

  // Render dashboard app if no slug detected
  if (!slug) return context.next();

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from("sites")
    .select("data")
    .eq("slug", slug)
    .single();
  if (error || !data) return new Response("Site not found", { status: 404 });

  // Basic analytics: log a view event (non-blocking)
  context.waitUntil(
    (async () => {
      try {
        await supabase
          .from("events")
          .insert({ type: "view", slug, ts: new Date().toISOString() });
      } catch {}
    })()
  );

  const tpl = data.data?.template || "landing";
  const element =
    tpl === "simple"
      ? React.createElement(SimpleTemplate as any, { data: data.data })
      : React.createElement(LandingTemplate as any, { data: data.data });

  const html = renderToString(element);
  return new Response("<!doctype html>" + html, {
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
};
