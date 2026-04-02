import type { Metadata } from "next";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "IS455 Shop Analytics",
  description: "ML-powered shop analytics dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            background: "#1a1a2e",
            color: "white",
            padding: "0 2rem",
            height: "56px",
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "0.02em", marginRight: "0.5rem" }}>
            IS455 Shop
          </span>
          <NavLinks />
        </nav>
        <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
