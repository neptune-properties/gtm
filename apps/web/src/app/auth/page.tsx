'use client';
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = supabaseBrowser();
    try {
      // Log in/sign up useing the supabase object
      // see https://supabase.com/docs/guides/auth/passwords for more details
    } catch (err: any) {
      setMsg(err.message || "Auth error");
    }
  };

  return (
    <div style={{ maxWidth: 360 }}>
      <h2>{mode === "signin" ? "Sign In" : "Sign Up"}</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">{mode === "signin" ? "Sign In" : "Create Account"}</button>
      </form>
      <p style={{ color: "#555" }}>{msg}</p>
      <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        Switch to {mode === "signin" ? "Sign Up" : "Sign In"}
      </button>
    </div>
  );
}
