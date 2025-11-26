"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Nav from "@/app/components/nav";
import RequireAuth from "@/app/components/require-auth";

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  // On /auth → no Nav, no RequireAuth
  if (isAuthPage) {
    return <main style={{ padding: 16 }}>{children}</main>;
  }

  // Everywhere else → protect & show Nav
  return (
    <RequireAuth>
      <Nav />
      <main style={{ padding: 16 }}>{children}</main>
    </RequireAuth>
  );
}
