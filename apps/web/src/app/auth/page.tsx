"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const supabase = supabaseBrowser();

    try {
      let error;
      if (mode === "signin") {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        error = e;
      } else {
        const { data, error: e } = await supabase.auth.signUp({ email, password });
        error = e;

        // If email confirmations are ON, user may not have a session yet:
        if (!error && data.user && !data.session) {
          setMsg("Check your email to confirm your account.");
          return;
        }
      }
      if (error) throw error;

      setMsg("Success! Redirecting…");
      router.push("/targets");
    } catch (err: any) {
      setMsg(err?.message || "Auth error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360 }}>
      <h2>{mode === "signin" ? "Sign In" : "Sign Up"}</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />
        <button type="submit" disabled={loading}>
          {loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>
      <p style={{ color: "#555", minHeight: 20 }}>{msg}</p>
      <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        Switch to {mode === "signin" ? "Sign Up" : "Sign In"}
      </button>
    </div>
  );
}
