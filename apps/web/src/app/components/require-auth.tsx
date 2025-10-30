'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabaseBrowser().auth.getSession();
      if (!session) router.replace("/auth");
      setChecking(false);
    };
    run();
  }, [router]);

  if (checking) return null;
  return <>{children}</>;
}
