import type { ReactNode } from "react";
import Nav from "@/app/components/nav";

export const metadata = { title: "Neptune — GTM MVP" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, Arial" }}>
        <header
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
            display: "flex",
            gap: 16,
          }}
        >
          <strong>Neptune</strong>
          <nav style={{ display: "flex", gap: 12 }}>
            <a href="/">Home</a>
            <a href="/templates">Templates</a>
            <a href="/auth">Auth</a>
          </nav>
        </header>

        {/* added nav */}
        <Nav />

        <main style={{ padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}
