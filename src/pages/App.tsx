import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { SiteEditor } from "../components/SiteEditor";
import { AdminAnalytics } from "../components/AdminAnalytics";

export function App() {
  const [session, setSession] = useState<any>(null);
  const [tab, setTab] = useState<"build" | "analytics">("build");

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) =>
      setSession(session)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!session) return <AuthView />;
  return <Dashboard tab={tab} setTab={setTab} />;
}

function AuthView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const signUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "80px auto",
        fontFamily: "Inter, system-ui",
      }}
    >
      <h1>Sign in</h1>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }}
      />
      <button onClick={signIn} disabled={loading} style={{ marginRight: 8 }}>
        Sign In
      </button>
      <button onClick={signUp} disabled={loading}>
        Sign Up
      </button>
      {error && <p style={{ color: "tomato" }}>{error}</p>}
    </div>
  );
}

function Dashboard({
  tab,
  setTab,
}: {
  tab: "build" | "analytics";
  setTab: (t: "build" | "analytics") => void;
}) {
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        fontFamily: "Inter, system-ui",
      }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab("build")} disabled={tab === "build"}>
          Builder
        </button>
        <button
          onClick={() => setTab("analytics")}
          disabled={tab === "analytics"}
        >
          Analytics
        </button>
      </div>
      {tab === "build" ? (
        <>
          <h1>Site Builder</h1>
          <SiteEditor />
        </>
      ) : (
        <>
          <h1>Analytics</h1>
          <AdminAnalytics />
        </>
      )}
    </div>
  );
}
