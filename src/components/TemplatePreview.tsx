import React from "react";
import { renderLandingHTML, renderSimpleHTML } from "../lib/renderers";

export function TemplatePreview({
  template,
  data,
}: {
  template: string;
  data: any;
}) {
  const html =
    template === "landing" ? renderLandingHTML(data) : renderSimpleHTML(data);
  return (
    <iframe
      title="preview"
      style={{
        width: "100%",
        minHeight: 420,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
      }}
      srcDoc={html}
    />
  );
}
