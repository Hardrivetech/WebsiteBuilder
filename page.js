"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { supabase } from "../lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function HomePage() {
  const [siteName, setSiteName] = useState("");
  const [session, setSession] = useState(null);
  const [headline, setHeadline] = useState("");
  const [theme, setTheme] = useState("light");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      setError("You must be logged in to create a site.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:3001/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ siteName, headline, theme }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <h1>Website Builder</h1>
          <p>Sign in to start creating your websites.</p>
          <div className={styles.authContainer}>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={["github", "google"]}
              theme="dark"
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Create Your Website</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className={styles.logoutButton}
          >
            Sign Out
          </button>
        </div>
        <p>Welcome, {session.user.email}!</p>
        <p>Fill in the details below to generate your new website.</p>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Your Website's Name"
              required
            />
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="A catchy headline"
              required
            />
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">Light Theme</option>
              <option value="dark">Dark Theme</option>
            </select>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Create My Site"}
            </button>
          </form>

          {error && <p className={styles.error}>Error: {error}</p>}

          {result && (
            <div className={styles.result}>
              <h3>{result.message}</h3>
              <p>
                Your new site is live at:{" "}
                <a
                  href={result.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {result.siteUrl}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
