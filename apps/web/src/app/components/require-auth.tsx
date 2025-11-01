'use client';
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabaseBrowser().auth.getSession();

      // prevent redirect loops
      if (!session && pathname !== "/auth") {
        router.replace("/auth");
      }

      setChecking(false);
    };
    run();
  }, [router, pathname]);

  if (checking) return null;
  return <>{children}</>;
}
