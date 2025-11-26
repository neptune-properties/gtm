import type { ReactNode } from "react";
import Shell from "@/app/components/shell"; // we'll create this

export const metadata = { title: "Neptune — GTM MVP" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, Arial" }}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
