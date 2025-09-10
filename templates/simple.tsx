import React from "react";

export function SimpleTemplate({ data }: { data: any }) {
  const theme = data.theme || {
    primary: "#0ea5e9",
    bg: "#ffffff",
    text: "#111827",
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
          .title{font-size:42px;margin:0 0 8px}
          .tagline{font-size:18px;color:#475569;margin:0 0 24px}
          .cta{background:${theme.primary};color:white;padding:10px 18px;border-radius:10px;text-decoration:none;display:inline-block}
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
      </body>
    </html>
  );
}
