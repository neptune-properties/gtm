import type { ReactNode } from "react";
import Nav from "@/app/components/nav";
import RequireAuth from "@/app/components/require-auth";

export const metadata = { title: "Neptune — GTM MVP" };

export default function RootLayout({ children }: { children: ReactNode }) {
  const isAuthPage = typeof window !== "undefined" && window.location.pathname.startsWith("/auth");

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, Arial" }}>
        {/* Wrap everything except /auth in RequireAuth */}
        {isAuthPage ? (
          <main style={{ padding: 16 }}>{children}</main>
        ) : (
          <RequireAuth>
            <Nav />
            <main style={{ padding: 16 }}>{children}</main>
          </RequireAuth>
        )}
      </body>
    </html>
  );
}
