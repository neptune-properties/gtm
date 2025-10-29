// components/Nav.tsx
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

    // 1) get current session once
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    // 2) keep in sync with future changes
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
    <nav style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #eee" }}>
      <Link href="/">Home</Link>
      <Link href="/targets">Targets</Link>
      <Link href="/templates">Templates</Link>
      <Link href="/campaigns">Campaigns</Link>

      <div style={{ marginLeft: "auto" }}>
        {email ? (
          <span>
            Signed in as <strong>{email}</strong>{" "}
            <button onClick={signOut} style={{ marginLeft: 8 }}>Sign out</button>
          </span>
        ) : (
          <Link href="/auth">Sign in</Link>
        )}
      </div>
    </nav>
  );
}
