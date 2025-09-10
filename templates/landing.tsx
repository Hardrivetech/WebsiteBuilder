import React from "react";

export function LandingTemplate({
  data,
}: {
  data: {
    title: string;
    tagline: string;
    features: string[];
    cta: string;
    theme?: { primary?: string; bg?: string; text?: string };
  };
}) {
  const theme = {
    primary: data.theme?.primary || "#0ea5e9",
    bg: data.theme?.bg || "#ffffff",
    text: data.theme?.text || "#111827",
  };
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{data.title}</title>
        <style>{`
          body{font-family:Inter,system-ui;margin:0;color:${theme.text};background:${theme.bg}}
          .hero{padding:80px 24px;text-align:center;background:#f8fafc}
          .title{font-size:48px;margin:0 0 8px}
          .tagline{font-size:20px;color:#475569;margin:0 0 24px}
          .features{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding:24px; max-width: 960px; margin: 0 auto;}
          .card{border:1px solid #e2e8f0;border-radius:12px;padding:16px}
          .cta{background:${theme.primary};color:white;padding:12px 20px;border-radius:10px;text-decoration:none;display:inline-block}
        `}</style>
      </head>
      <body>
        <section className="hero">
          <h1 className="title">{data.title}</h1>
          <p className="tagline">{data.tagline}</p>
          <a className="cta" href="#get-started">
            {data.cta}
          </a>
        </section>
        <section className="features">
          {data.features.map((f, i) => (
            <div className="card" key={i}>
              <strong>{f}</strong>
            </div>
          ))}
        </section>
      </body>
    </html>
  );
}
