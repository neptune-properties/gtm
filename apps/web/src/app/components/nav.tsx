'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function Nav() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();

    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    // Keep session in sync
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabaseBrowser().auth.signOut();
    router.push("/auth");
  };

  return (
    <header
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Neptune logo / title */}
      <strong>Neptune</strong>

      {/* Main nav links */}
      <nav style={{ display: "flex", gap: 12 }}>
        <Link href="/">Home</Link>
        <Link href="/targets">Targets</Link>
        <Link href="/templates">Templates</Link>
        <Link href="/campaigns">Campaigns</Link>
      </nav>

      {/* Auth info / buttons */}
      <div style={{ marginLeft: "auto" }}>
        {email ? (
          <span>
            Signed in as <strong>{email}</strong>{" "}
            <button onClick={signOut} style={{ marginLeft: 8 }}>
              Sign out
            </button>
          </span>
        ) : (
          <Link href="/auth">Sign in</Link>
        )}
      </div>
    </header>
  );
}
