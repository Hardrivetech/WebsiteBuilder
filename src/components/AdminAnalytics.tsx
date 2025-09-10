import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type EventRow = { type: string; slug: string; ts: string };

type SiteRow = { slug: string };

export function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      // Get current user
      const { data: u } = await supabase.auth.getUser();
      const owner = u.user?.id;
      if (!owner) {
        setError("No user");
        setLoading(false);
        return;
      }

      // Fetch user's sites slugs
      const { data: sites, error: sErr } = await supabase
        .from("sites")
        .select("slug")
        .eq("owner", owner);
      if (sErr) {
        setError(sErr.message);
        setLoading(false);
        return;
      }
      const mySlugs = (sites as SiteRow[]).map((s) => s.slug);
      setSlugs(mySlugs);

      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      // Fetch events for those slugs (client-side filter)
      const { data: ev, error: eErr } = await supabase
        .from("events")
        .select("type, slug, ts")
        .gte("ts", since)
        .in("slug", mySlugs);
      if (eErr) {
        setError(eErr.message);
        setLoading(false);
        return;
      }
      setEvents(ev as EventRow[]);
      setLoading(false);
    })();
  }, []);

  const metrics = useMemo(() => {
    const views: Record<string, number> = {};
    const exports: Record<string, number> = {};
    for (const e of events) {
      if (e.type === "view") views[e.slug] = (views[e.slug] || 0) + 1;
      if (e.type === "export") exports[e.slug] = (exports[e.slug] || 0) + 1;
    }
    return { views, exports };
  }, [events]);

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <p style={{ color: "tomato" }}>{error}</p>;
  if (!slugs.length) return <p>No sites yet.</p>;

  return (
    <div>
      <h2>Last 7 days</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                borderBottom: "1px solid #e5e7eb",
                padding: 8,
              }}
            >
              Slug
            </th>
            <th
              style={{
                textAlign: "left",
                borderBottom: "1px solid #e5e7eb",
                padding: 8,
              }}
            >
              Views
            </th>
            <th
              style={{
                textAlign: "left",
                borderBottom: "1px solid #e5e7eb",
                padding: 8,
              }}
            >
              Exports
            </th>
          </tr>
        </thead>
        <tbody>
          {slugs.map((slug) => (
            <tr key={slug}>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>
                {slug}
              </td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>
                {metrics.views[slug] || 0}
              </td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>
                {metrics.exports[slug] || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
