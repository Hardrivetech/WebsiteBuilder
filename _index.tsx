import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { getSupabaseClient, getUserId } from "~/lib/supabase.server";

export interface Env {
  DB: D1Database;
  APP_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

// A helper function to get the user ID or redirect to login
// This would be defined in a separate utility file, e.g., `app/lib/auth.server.ts`
// For now, we'll assume it exists and throws a redirect response if the user is not logged in.

interface Site {
  id: number;
  subdomain: string;
  title: string;
  description: string;
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = context.env as Env;
  const userId = await getUserId(request, env); // This will redirect if not logged in

  const { results } = await env.DB.prepare(
    "SELECT id, subdomain, title, description FROM sites WHERE userId = ? ORDER BY createdAt DESC"
  )
    .bind(userId)
    .all<Site>();

  return json({ sites: results ?? [], appUrl: env.APP_URL });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const env = context.env as Env;
  const userId = await getUserId(request, env); // Ensure user is logged in for action
  const formData = await request.formData();
  const { subdomain, title, description } = Object.fromEntries(formData);

  if (typeof subdomain !== "string" || subdomain.length < 3) {
    return json(
      { error: "Subdomain must be at least 3 characters long." },
      { status: 400 }
    );
  }
  if (typeof title !== "string" || title.length === 0) {
    return json({ error: "Title is required." }, { status: 400 });
  }

  try {
    await env.DB.prepare(
      "INSERT INTO sites (userId, subdomain, title, description) VALUES (?, ?, ?, ?)"
    )
      .bind(userId, subdomain, title, description ?? "")
      .run();
    return redirect("/");
  } catch (e: any) {
    if (e.message?.includes("UNIQUE constraint failed")) {
      return json({ error: "Subdomain is already taken." }, { status: 400 });
    }
    console.error(e);
    return json({ error: "Failed to create site." }, { status: 500 });
  }
};

export default function Index() {
  const { sites, appUrl } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const rootDomain = new URL(appUrl).hostname;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        lineHeight: "1.8",
        maxWidth: "800px",
        margin: "2rem auto",
      }}
    >
      <h1>Website Builder SaaS</h1>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "1rem",
          borderRadius: "8px",
        }}
      >
        <h2>Create a New Site</h2>
        <Form method="post">
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="subdomain">Subdomain:</label>
            <br />
            <input
              type="text"
              id="subdomain"
              name="subdomain"
              required
              style={{ width: "200px", padding: "0.5rem" }}
            />
            <span style={{ marginLeft: "0.5rem" }}>.{rootDomain}</span>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="title">Site Title:</label>
            <br />
            <input
              type="text"
              id="title"
              name="title"
              required
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="description">Site Description:</label>
            <br />
            <textarea
              id="description"
              name="description"
              rows={4}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          {actionData?.error && (
            <p style={{ color: "red" }}>{actionData.error}</p>
          )}
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Create Site
          </button>
        </Form>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Your Sites</h2>
        {sites.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {sites.map((site) => (
              <li
                key={site.id}
                style={{
                  border: "1px solid #eee",
                  padding: "1rem",
                  marginBottom: "1rem",
                  borderRadius: "8px",
                }}
              >
                <strong>{site.title}</strong>
                <br />
                <a
                  href={`http://${site.subdomain}.${rootDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {site.subdomain}.{rootDomain}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven't created any sites yet.</p>
        )}
      </div>
    </div>
  );
}
