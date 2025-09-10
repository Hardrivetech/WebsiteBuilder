// Pure string renderers for client-side preview and ZIP export

export type SiteData = {
  title: string;
  tagline: string;
  features?: string[];
  cta: string;
  theme?: { primary?: string; bg?: string; text?: string };
};

export function renderLandingHTML(data: SiteData): string {
  const theme = {
    primary: data.theme?.primary || "#0ea5e9",
    bg: data.theme?.bg || "#ffffff",
    text: data.theme?.text || "#111827",
  };
  const features = (data.features || [])
    .map((f) => `<div class="card"><strong>${escapeHtml(f)}</strong></div>`)
    .join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(data.title)}</title>
    <style>
      body{font-family:Inter,system-ui;margin:0;color:${
        theme.text
      };background:${theme.bg}}
      .hero{padding:80px 24px;text-align:center;background:#f8fafc}
      .title{font-size:48px;margin:0 0 8px}
      .tagline{font-size:20px;color:#475569;margin:0 0 24px}
      .features{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding:24px; max-width: 960px; margin: 0 auto;}
      .card{border:1px solid #e2e8f0;border-radius:12px;padding:16px}
      .cta{background:${
        theme.primary
      };color:white;padding:12px 20px;border-radius:10px;text-decoration:none;display:inline-block}
    </style>
  </head>
  <body>
    <section class="hero">
      <h1 class="title">${escapeHtml(data.title)}</h1>
      <p class="tagline">${escapeHtml(data.tagline)}</p>
      <a class="cta" href="#get-started">${escapeHtml(data.cta)}</a>
    </section>
    <section class="features">${features}</section>
  </body>
</html>`;
}

export function renderSimpleHTML(data: SiteData): string {
  const theme = {
    primary: data.theme?.primary || "#0ea5e9",
    bg: data.theme?.bg || "#ffffff",
    text: data.theme?.text || "#111827",
  };
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(data.title)}</title>
    <style>
      body{font-family:Inter,system-ui;margin:0;color:${
        theme.text
      };background:${theme.bg}}
      .hero{padding:80px 24px;text-align:center;background:#f8fafc}
      .title{font-size:42px;margin:0 0 8px}
      .tagline{font-size:18px;color:#475569;margin:0 0 24px}
      .cta{background:${
        theme.primary
      };color:white;padding:10px 18px;border-radius:10px;text-decoration:none;display:inline-block}
    </style>
  </head>
  <body>
    <section class="hero">
      <h1 class="title">${escapeHtml(data.title)}</h1>
      <p class="tagline">${escapeHtml(data.tagline)}</p>
      <a class="cta" href="#get-started">${escapeHtml(data.cta)}</a>
    </section>
  </body>
</html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
